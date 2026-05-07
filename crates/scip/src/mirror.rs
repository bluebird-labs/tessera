//! SCIP-isomorphic `SQLite` mirror — RFC 0003 §7.
//!
//! The mirror is the persisted contract of `tessera index`: each detected
//! language's SCIP `Index` proto is decoded in-process and inserted into
//! shared tables tagged with a `language` column. The schema preserves
//! every field the SCIP proto exposes; downstream consumers (and the
//! deferred derived graph layer) read this database, never the raw
//! `.scip` files.

use std::collections::HashMap;
use std::collections::hash_map::Entry;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

use protobuf::Message as _;
use rusqlite::{Connection, Transaction, params};
use scip::types::{Document, Index, Occurrence, Relationship, SymbolInformation};
use thiserror::Error;

use crate::language::Language;
use crate::orchestrate::{IngestStats, Sink, SinkError};

mod schema {
    /// All `CREATE TABLE` and `CREATE INDEX` statements applied at
    /// database creation time. Field names track the SCIP proto
    /// (snake-cased); the `language` column distinguishes per-language
    /// data co-located in shared tables.
    pub(super) const SCHEMA_SQL: &str = "\
CREATE TABLE metadata (
    language               TEXT PRIMARY KEY,
    scip_version           INTEGER NOT NULL,
    tool_name              TEXT NOT NULL,
    tool_version           TEXT NOT NULL,
    tool_arguments         TEXT NOT NULL,
    project_root           TEXT NOT NULL,
    text_document_encoding INTEGER NOT NULL,
    indexed_at             INTEGER NOT NULL
);

CREATE TABLE documents (
    id                INTEGER PRIMARY KEY,
    language          TEXT NOT NULL REFERENCES metadata(language),
    scip_language     TEXT NOT NULL,
    relative_path     TEXT NOT NULL,
    text              TEXT,
    position_encoding INTEGER NOT NULL,
    UNIQUE(language, relative_path)
);

CREATE TABLE symbols (
    id                      INTEGER PRIMARY KEY,
    language                TEXT NOT NULL REFERENCES metadata(language),
    document_id             INTEGER REFERENCES documents(id),
    -- Not unique within a language: the SCIP wire format permits the
    -- same `scip_symbol` to appear multiple times (across documents,
    -- or once in-doc and once in `external_symbols`). Each appearance
    -- gets its own row to preserve all `documentation`/`relationships`
    -- payloads attached to it.
    scip_symbol             TEXT NOT NULL,
    kind                    INTEGER NOT NULL,
    display_name            TEXT,
    -- JSON array of strings, mirroring SymbolInformation.documentation
    -- losslessly (newline-joining would collide with newlines inside
    -- individual entries).
    documentation           TEXT,
    -- The nested SymbolInformation.signature_documentation Document
    -- proto, serialized to bytes for lossless round-trip.
    signature_documentation BLOB,
    enclosing_symbol        TEXT
);

CREATE TABLE occurrences (
    id                     INTEGER PRIMARY KEY,
    document_id            INTEGER NOT NULL REFERENCES documents(id),
    symbol_id              INTEGER NOT NULL REFERENCES symbols(id),
    -- Lossless: the original Occurrence.range as a JSON int32 array
    -- (always 3 or 4 elements per the SCIP spec, but the proto allows
    -- any length so we preserve whatever the indexer emitted).
    range_raw              TEXT NOT NULL,
    -- Decoded coordinates for the standard 3- or 4-element range.
    -- NULL when range_raw has an unexpected element count; query with
    -- `WHERE start_line IS NULL` to find malformed ranges.
    start_line             INTEGER,
    start_character        INTEGER,
    end_line               INTEGER,
    end_character          INTEGER,
    symbol_roles           INTEGER NOT NULL,
    syntax_kind            INTEGER NOT NULL,
    -- JSON array of strings, mirroring Occurrence.override_documentation
    -- losslessly (newline-joining would collide with newlines inside
    -- individual entries).
    override_documentation TEXT,
    enclosing_range        TEXT
);

CREATE TABLE relationships (
    symbol_id          INTEGER NOT NULL REFERENCES symbols(id),
    related_symbol     TEXT NOT NULL,
    is_reference       INTEGER NOT NULL,
    is_implementation  INTEGER NOT NULL,
    is_type_definition INTEGER NOT NULL,
    is_definition      INTEGER NOT NULL
);

CREATE TABLE diagnostics (
    occurrence_id INTEGER NOT NULL REFERENCES occurrences(id),
    severity      INTEGER NOT NULL,
    code          TEXT,
    message       TEXT,
    source        TEXT,
    tags          TEXT
);

CREATE INDEX idx_occurrences_symbol_id     ON occurrences(symbol_id);
CREATE INDEX idx_occurrences_document_id   ON occurrences(document_id);
CREATE INDEX idx_relationships_symbol_id   ON relationships(symbol_id);
CREATE INDEX idx_symbols_lang_scip_symbol  ON symbols(language, scip_symbol);
CREATE INDEX idx_diagnostics_occurrence_id ON diagnostics(occurrence_id);
";
}

/// Top-level error from constructing a [`MirrorDb`]. Per-ingest failures
/// flow through [`SinkError`] instead.
#[derive(Debug, Error)]
pub enum MirrorError {
    #[error("failed to create parent directory `{path}`: {source}")]
    ParentDirectory {
        path: PathBuf,
        #[source]
        source: std::io::Error,
    },
    #[error("failed to remove existing database at `{path}`: {source}")]
    RemoveExisting {
        path: PathBuf,
        #[source]
        source: std::io::Error,
    },
    #[error("path `{path}` exists and is not a regular file (cannot replace)")]
    PathNotAFile { path: PathBuf },
    #[error("failed to open database at `{path}`: {source}")]
    Open {
        path: PathBuf,
        #[source]
        source: rusqlite::Error,
    },
    #[error("failed to apply schema to `{path}`: {source}")]
    Schema {
        path: PathBuf,
        #[source]
        source: rusqlite::Error,
    },
}

/// SCIP mirror database.
///
/// Wraps a single `rusqlite::Connection` and the path it was opened
/// from. Constructed via [`MirrorDb::create`]; each language's data is
/// committed as a single [`Sink::ingest`] transaction.
#[derive(Debug)]
pub struct MirrorDb {
    conn: Connection,
    path: PathBuf,
}

impl MirrorDb {
    /// Create (or replace) the database at `path`.
    ///
    /// If `path` exists, it is removed first; the parent directory is
    /// created if needed; the schema is applied. `PRAGMA foreign_keys`
    /// is turned on so referential constraints are enforced at write
    /// time.
    pub fn create(path: &Path) -> Result<Self, MirrorError> {
        if path.exists() {
            if !path.is_file() {
                return Err(MirrorError::PathNotAFile {
                    path: path.to_path_buf(),
                });
            }
            std::fs::remove_file(path).map_err(|source| MirrorError::RemoveExisting {
                path: path.to_path_buf(),
                source,
            })?;
        }
        if let Some(parent) = path.parent() {
            if !parent.as_os_str().is_empty() {
                std::fs::create_dir_all(parent).map_err(|source| MirrorError::ParentDirectory {
                    path: parent.to_path_buf(),
                    source,
                })?;
            }
        }
        let conn = Connection::open(path).map_err(|source| MirrorError::Open {
            path: path.to_path_buf(),
            source,
        })?;
        Self::apply_schema(&conn).map_err(|source| MirrorError::Schema {
            path: path.to_path_buf(),
            source,
        })?;
        Ok(Self {
            conn,
            path: path.to_path_buf(),
        })
    }

    #[must_use]
    pub fn path(&self) -> &Path {
        &self.path
    }

    fn apply_schema(conn: &Connection) -> Result<(), rusqlite::Error> {
        conn.execute_batch("PRAGMA foreign_keys = ON;")?;
        conn.execute_batch(schema::SCHEMA_SQL)?;
        Ok(())
    }

    #[cfg(test)]
    fn open_in_memory() -> Self {
        let conn = Connection::open_in_memory().expect("in-memory open");
        Self::apply_schema(&conn).expect("schema apply");
        Self {
            conn,
            path: PathBuf::from(":memory:"),
        }
    }
}

impl Sink for MirrorDb {
    fn ingest(&mut self, language: Language, scip_path: &Path) -> Result<IngestStats, SinkError> {
        let bytes =
            std::fs::read(scip_path).map_err(|e| SinkError::Decode(format!("read failed: {e}")))?;
        let index = <Index as protobuf::Message>::parse_from_bytes(&bytes)
            .map_err(|e| SinkError::Decode(e.to_string()))?;

        let tx = self
            .conn
            .transaction()
            .map_err(|e| SinkError::Ingest(e.to_string()))?;

        let stats =
            ingest_index(&tx, language, &index).map_err(|e| SinkError::Ingest(e.to_string()))?;

        tx.commit().map_err(|e| SinkError::Ingest(e.to_string()))?;
        Ok(stats)
    }
}

fn ingest_index(
    tx: &Transaction<'_>,
    language: Language,
    index: &Index,
) -> Result<IngestStats, rusqlite::Error> {
    let lang = language.as_str();

    insert_metadata(tx, lang, index)?;

    let mut doc_ids = Vec::with_capacity(index.documents.len());
    for doc in &index.documents {
        doc_ids.push(insert_document(tx, lang, doc)?);
    }

    // Symbols defined within documents come first; external symbols fold
    // into the same table with `document_id IS NULL`. Within a language a
    // `scip_symbol` is unique — duplicates (rare in practice) are kept as
    // the first-inserted row, which by construction is the in-document
    // version when present.
    // sym_ids maps each scip_symbol to the FIRST inserted row's id, used
    // to resolve `Occurrence.symbol` foreign keys. Duplicate
    // SymbolInformation entries are still stored as additional rows
    // (preserving each one's documentation + relationships); occurrences
    // simply point to the first.
    let mut sym_ids: HashMap<String, i64> = HashMap::new();
    let mut total_symbols: u64 = 0;
    let mut total_relationships: u64 = 0;
    for (i, doc) in index.documents.iter().enumerate() {
        let doc_id = doc_ids[i];
        for sym in &doc.symbols {
            let id = insert_symbol_row(tx, lang, Some(doc_id), sym)?;
            total_symbols = total_symbols.saturating_add(1);
            sym_ids.entry(sym.symbol.clone()).or_insert(id);
            for rel in &sym.relationships {
                insert_relationship(tx, id, rel)?;
                total_relationships = total_relationships.saturating_add(1);
            }
        }
    }
    for sym in &index.external_symbols {
        let id = insert_symbol_row(tx, lang, None, sym)?;
        total_symbols = total_symbols.saturating_add(1);
        sym_ids.entry(sym.symbol.clone()).or_insert(id);
        for rel in &sym.relationships {
            insert_relationship(tx, id, rel)?;
            total_relationships = total_relationships.saturating_add(1);
        }
    }

    let mut total_occurrences: u64 = 0;
    let mut total_diagnostics: u64 = 0;
    for (i, doc) in index.documents.iter().enumerate() {
        let doc_id = doc_ids[i];
        for occ in &doc.occurrences {
            let (symbol_id, inserted_placeholder) =
                ensure_symbol(tx, &mut sym_ids, lang, &occ.symbol)?;
            if inserted_placeholder {
                total_symbols = total_symbols.saturating_add(1);
            }
            let occ_id = insert_occurrence(tx, doc_id, symbol_id, occ)?;
            for diag in &occ.diagnostics {
                insert_diagnostic(tx, occ_id, diag)?;
                total_diagnostics = total_diagnostics.saturating_add(1);
            }
            total_occurrences = total_occurrences.saturating_add(1);
        }
    }

    Ok(IngestStats {
        documents: u64::try_from(index.documents.len()).unwrap_or(u64::MAX),
        symbols: total_symbols,
        occurrences: total_occurrences,
        relationships: total_relationships,
        diagnostics: total_diagnostics,
        unknown_field_messages: count_unknown_field_messages(index),
    })
}

fn insert_metadata(tx: &Transaction<'_>, lang: &str, index: &Index) -> Result<(), rusqlite::Error> {
    let meta = &index.metadata;
    let tool_info = meta.tool_info.as_ref();
    let tool_name = tool_info.map(|t| t.name.as_str()).unwrap_or_default();
    let tool_version = tool_info.map(|t| t.version.as_str()).unwrap_or_default();
    let tool_arguments = tool_info.map_or_else(
        || "[]".to_owned(),
        |t| serde_json::to_string(&t.arguments).unwrap_or_else(|_| "[]".to_owned()),
    );
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);
    tx.execute(
        "INSERT INTO metadata (language, scip_version, tool_name, tool_version, \
         tool_arguments, project_root, text_document_encoding, indexed_at) \
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![
            lang,
            i64::from(meta.version.value()),
            tool_name,
            tool_version,
            tool_arguments,
            meta.project_root,
            i64::from(meta.text_document_encoding.value()),
            i64::try_from(now).unwrap_or(i64::MAX),
        ],
    )?;
    Ok(())
}

fn insert_document(
    tx: &Transaction<'_>,
    lang: &str,
    doc: &Document,
) -> Result<i64, rusqlite::Error> {
    tx.execute(
        "INSERT INTO documents (language, scip_language, relative_path, text, \
         position_encoding) VALUES (?1, ?2, ?3, ?4, ?5)",
        params![
            lang,
            doc.language,
            doc.relative_path,
            if doc.text.is_empty() {
                None
            } else {
                Some(doc.text.as_str())
            },
            i64::from(doc.position_encoding.value()),
        ],
    )?;
    Ok(tx.last_insert_rowid())
}

fn insert_symbol_row(
    tx: &Transaction<'_>,
    lang: &str,
    document_id: Option<i64>,
    sym: &SymbolInformation,
) -> Result<i64, rusqlite::Error> {
    let documentation = if sym.documentation.is_empty() {
        None
    } else {
        Some(serde_json::to_string(&sym.documentation).expect("encode documentation"))
    };
    let signature_documentation = sym
        .signature_documentation
        .as_ref()
        .map(|d| d.write_to_bytes().expect("encode signature_documentation"));
    tx.execute(
        "INSERT INTO symbols (language, document_id, scip_symbol, kind, display_name, \
         documentation, signature_documentation, enclosing_symbol) \
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![
            lang,
            document_id,
            sym.symbol,
            i64::from(sym.kind.value()),
            none_if_empty(&sym.display_name),
            documentation,
            signature_documentation,
            none_if_empty(&sym.enclosing_symbol),
        ],
    )?;
    Ok(tx.last_insert_rowid())
}

/// Look up the symbol id for `scip_symbol`, inserting a placeholder
/// row if it isn't already known. Returns the id and `true` when a new
/// placeholder was inserted (so the caller can count it).
/// Look up the symbol id for `scip_symbol`, inserting a placeholder
/// row if it isn't already known. Returns the id and `true` when a new
/// placeholder was inserted (so the caller can count it).
fn ensure_symbol(
    tx: &Transaction<'_>,
    sym_ids: &mut HashMap<String, i64>,
    lang: &str,
    scip_symbol: &str,
) -> Result<(i64, bool), rusqlite::Error> {
    match sym_ids.entry(scip_symbol.to_owned()) {
        Entry::Occupied(e) => Ok((*e.get(), false)),
        Entry::Vacant(e) => {
            // Placeholder for an occurrence that references a symbol not
            // defined in any document of this language and not in
            // `external_symbols` (typically a cross-language reference).
            // Kind = 0 (Unspecified).
            tx.execute(
                "INSERT INTO symbols (language, document_id, scip_symbol, kind) \
                 VALUES (?1, NULL, ?2, 0)",
                params![lang, scip_symbol],
            )?;
            let id = tx.last_insert_rowid();
            e.insert(id);
            Ok((id, true))
        }
    }
}

fn insert_relationship(
    tx: &Transaction<'_>,
    symbol_id: i64,
    rel: &Relationship,
) -> Result<(), rusqlite::Error> {
    tx.execute(
        "INSERT INTO relationships (symbol_id, related_symbol, is_reference, \
         is_implementation, is_type_definition, is_definition) \
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![
            symbol_id,
            rel.symbol,
            i64::from(rel.is_reference),
            i64::from(rel.is_implementation),
            i64::from(rel.is_type_definition),
            i64::from(rel.is_definition),
        ],
    )?;
    Ok(())
}

fn insert_occurrence(
    tx: &Transaction<'_>,
    document_id: i64,
    symbol_id: i64,
    occ: &Occurrence,
) -> Result<i64, rusqlite::Error> {
    let decoded = decode_range(&occ.range);
    let (sl, sc, el, ec) = match decoded {
        Some((sl, sc, el, ec)) => (Some(sl), Some(sc), Some(el), Some(ec)),
        None => (None, None, None, None),
    };
    let range_raw = serde_json::to_string(&occ.range).expect("encode range_raw");
    let override_documentation = if occ.override_documentation.is_empty() {
        None
    } else {
        Some(
            serde_json::to_string(&occ.override_documentation)
                .expect("encode override_documentation"),
        )
    };
    let enclosing_range = if occ.enclosing_range.is_empty() {
        None
    } else {
        serde_json::to_string(&occ.enclosing_range).ok()
    };
    tx.execute(
        "INSERT INTO occurrences (document_id, symbol_id, range_raw, start_line, \
         start_character, end_line, end_character, symbol_roles, syntax_kind, \
         override_documentation, enclosing_range) \
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
        params![
            document_id,
            symbol_id,
            range_raw,
            sl,
            sc,
            el,
            ec,
            i64::from(occ.symbol_roles),
            i64::from(occ.syntax_kind.value()),
            override_documentation,
            enclosing_range,
        ],
    )?;
    Ok(tx.last_insert_rowid())
}

fn insert_diagnostic(
    tx: &Transaction<'_>,
    occurrence_id: i64,
    diag: &scip::types::Diagnostic,
) -> Result<(), rusqlite::Error> {
    let tags: Vec<i32> = diag
        .tags
        .iter()
        .map(protobuf::EnumOrUnknown::value)
        .collect();
    let tags_json = if tags.is_empty() {
        None
    } else {
        serde_json::to_string(&tags).ok()
    };
    tx.execute(
        "INSERT INTO diagnostics (occurrence_id, severity, code, message, source, tags) \
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![
            occurrence_id,
            i64::from(diag.severity.value()),
            none_if_empty(&diag.code),
            none_if_empty(&diag.message),
            none_if_empty(&diag.source),
            tags_json,
        ],
    )?;
    Ok(())
}

/// Decode SCIP's compact `Occurrence.range` into start/end coordinates.
/// Returns `None` for any element count other than 3 or 4 — the caller
/// stores the raw `Vec<i32>` losslessly in `range_raw` regardless.
fn decode_range(range: &[i32]) -> Option<(i64, i64, i64, i64)> {
    match range {
        [sl, sc, el, ec] => Some((
            i64::from(*sl),
            i64::from(*sc),
            i64::from(*el),
            i64::from(*ec),
        )),
        [sl, sc, ec] => Some((
            i64::from(*sl),
            i64::from(*sc),
            i64::from(*sl),
            i64::from(*ec),
        )),
        _ => None,
    }
}

const fn none_if_empty(s: &str) -> Option<&str> {
    if s.is_empty() { None } else { Some(s) }
}

/// Count messages within the decoded `Index` whose protobuf
/// `SpecialFields::unknown_fields` is non-empty. A non-zero result
/// means the upstream indexer was built against a `scip.proto` newer
/// than the `scip` crate this build links against; the unrecognised
/// wire bytes are not stored in the mirror. Surfaced via
/// [`IngestStats::unknown_field_messages`] and a stderr warning.
fn count_unknown_field_messages(index: &Index) -> u64 {
    let mut n: u64 = 0;
    inc_if_unknown(&mut n, &index.special_fields);
    if let Some(meta) = index.metadata.as_ref() {
        inc_if_unknown(&mut n, &meta.special_fields);
        if let Some(tool) = meta.tool_info.as_ref() {
            inc_if_unknown(&mut n, &tool.special_fields);
        }
    }
    for doc in &index.documents {
        n = n.saturating_add(count_unknown_in_document(doc));
    }
    for sym in &index.external_symbols {
        n = n.saturating_add(count_unknown_in_symbol(sym));
    }
    n
}

fn count_unknown_in_document(doc: &Document) -> u64 {
    let mut n: u64 = 0;
    inc_if_unknown(&mut n, &doc.special_fields);
    for sym in &doc.symbols {
        n = n.saturating_add(count_unknown_in_symbol(sym));
    }
    for occ in &doc.occurrences {
        n = n.saturating_add(count_unknown_in_occurrence(occ));
    }
    n
}

fn count_unknown_in_symbol(sym: &SymbolInformation) -> u64 {
    let mut n: u64 = 0;
    inc_if_unknown(&mut n, &sym.special_fields);
    if let Some(sig) = sym.signature_documentation.as_ref() {
        n = n.saturating_add(count_unknown_in_document(sig));
    }
    for rel in &sym.relationships {
        inc_if_unknown(&mut n, &rel.special_fields);
    }
    n
}

fn count_unknown_in_occurrence(occ: &Occurrence) -> u64 {
    let mut n: u64 = 0;
    inc_if_unknown(&mut n, &occ.special_fields);
    for diag in &occ.diagnostics {
        inc_if_unknown(&mut n, &diag.special_fields);
    }
    n
}

fn inc_if_unknown(n: &mut u64, fields: &protobuf::SpecialFields) {
    if fields.unknown_fields().iter().next().is_some() {
        *n = n.saturating_add(1);
    }
}

#[cfg(test)]
mod tests {
    use std::io::Write as _;

    use protobuf::{Enum as _, EnumOrUnknown, MessageField};
    use scip::types::{
        Diagnostic, Document, Index, Metadata, Occurrence, ProtocolVersion, Relationship, Severity,
        SymbolInformation, TextEncoding, ToolInfo, symbol_information::Kind,
    };
    use tempfile::TempDir;

    use super::*;

    fn synthetic_index() -> Index {
        let mut tool = ToolInfo::new();
        tool.name = "scip-test".into();
        tool.version = "0.1.0".into();
        tool.arguments = vec!["--flag".into(), "value".into()];

        let mut meta = Metadata::new();
        meta.version = EnumOrUnknown::new(ProtocolVersion::UnspecifiedProtocolVersion);
        meta.tool_info = MessageField::some(tool);
        meta.project_root = "file:///tmp/proj".into();
        meta.text_document_encoding = EnumOrUnknown::new(TextEncoding::UTF8);

        let mut sym_a = SymbolInformation::new();
        sym_a.symbol = "scip-test . . local 1".into();
        sym_a.kind = EnumOrUnknown::new(Kind::Function);
        sym_a.display_name = "foo".into();
        // Two-element documentation, where the first element itself
        // contains a newline. The naive newline-join would be lossy
        // here; the JSON encoding round-trips faithfully.
        sym_a.documentation = vec!["docs line 1\nstill in line 1".into(), "docs line 2".into()];

        let mut sym_b = SymbolInformation::new();
        sym_b.symbol = "scip-test . . local 2".into();
        sym_b.kind = EnumOrUnknown::new(Kind::Variable);
        let mut rel = Relationship::new();
        rel.symbol = "scip-test . . local 1".into();
        rel.is_reference = true;
        sym_b.relationships = vec![rel];

        let mut definition = Occurrence::new();
        definition.range = vec![0, 0, 5];
        definition.symbol = "scip-test . . local 1".into();
        definition.symbol_roles = 1;

        let mut diag = Diagnostic::new();
        diag.severity = EnumOrUnknown::new(Severity::Warning);
        diag.code = "W001".into();
        diag.message = "watch out".into();

        let mut reference = Occurrence::new();
        reference.range = vec![3, 1, 3, 4];
        reference.symbol = "scip-test . . local 2".into();
        reference.diagnostics = vec![diag];
        // Multi-element override_documentation, again with an embedded
        // newline to prove lossless round-trip.
        reference.override_documentation =
            vec!["override\nwith newline".into(), "second entry".into()];

        let mut unknown = Occurrence::new();
        unknown.range = vec![10, 0, 10, 7];
        unknown.symbol = "scip-test . . crosslang 99".into();

        let mut doc = Document::new();
        doc.language = "rust".into();
        doc.relative_path = "src/lib.rs".into();
        doc.symbols = vec![sym_a, sym_b];
        doc.occurrences = vec![definition, reference, unknown];

        let mut ext = SymbolInformation::new();
        ext.symbol = "scip-test . . extern 1".into();
        ext.kind = EnumOrUnknown::new(Kind::Class);

        let mut index = Index::new();
        index.metadata = MessageField::some(meta);
        index.documents = vec![doc];
        index.external_symbols = vec![ext];
        index
    }

    fn write_index_to_temp(index: &Index) -> (TempDir, PathBuf) {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("index.scip");
        let bytes = index.write_to_bytes().expect("encode synthetic index");
        std::fs::write(&path, bytes).unwrap();
        (dir, path)
    }

    #[test]
    fn schema_applies_cleanly() {
        let db = MirrorDb::open_in_memory();
        let table_count: i64 = db
            .conn
            .query_row(
                "SELECT count(*) FROM sqlite_master WHERE type='table'",
                [],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(table_count, 6);
    }

    #[test]
    #[allow(clippy::too_many_lines)]
    fn ingest_round_trips_synthetic_index() {
        let mut db = MirrorDb::open_in_memory();
        let (_dir, path) = write_index_to_temp(&synthetic_index());
        let stats = db.ingest(Language::Rust, &path).expect("ingest");

        // Stats match the actual `count(*)` of each per-language table.
        assert_eq!(stats.documents, 1);
        assert_eq!(stats.symbols, 4); // 2 in-doc + 1 external + 1 placeholder
        assert_eq!(stats.occurrences, 3);
        assert_eq!(stats.relationships, 1);
        assert_eq!(stats.diagnostics, 1);

        let actual_symbols: i64 = db
            .conn
            .query_row("SELECT count(*) FROM symbols", [], |r| r.get(0))
            .unwrap();
        assert_eq!(u64::try_from(actual_symbols).unwrap(), stats.symbols);
        let actual_relationships: i64 = db
            .conn
            .query_row("SELECT count(*) FROM relationships", [], |r| r.get(0))
            .unwrap();
        assert_eq!(
            u64::try_from(actual_relationships).unwrap(),
            stats.relationships
        );
        let actual_diagnostics: i64 = db
            .conn
            .query_row("SELECT count(*) FROM diagnostics", [], |r| r.get(0))
            .unwrap();
        assert_eq!(
            u64::try_from(actual_diagnostics).unwrap(),
            stats.diagnostics
        );

        // Metadata round-trips.
        let (tool, root): (String, String) = db
            .conn
            .query_row(
                "SELECT tool_name, project_root FROM metadata WHERE language = 'rust'",
                [],
                |r| Ok((r.get(0)?, r.get(1)?)),
            )
            .unwrap();
        assert_eq!(tool, "scip-test");
        assert_eq!(root, "file:///tmp/proj");

        // Document row-trips with the right relative_path.
        let path: String = db
            .conn
            .query_row(
                "SELECT relative_path FROM documents WHERE language = 'rust'",
                [],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(path, "src/lib.rs");

        // External symbol lands with NULL document_id.
        let ext_doc_id: Option<i64> = db
            .conn
            .query_row(
                "SELECT document_id FROM symbols WHERE scip_symbol = ?1",
                ["scip-test . . extern 1"],
                |r| r.get(0),
            )
            .unwrap();
        assert!(ext_doc_id.is_none());

        // The cross-language reference produced a placeholder symbol row.
        let placeholder_kind: i64 = db
            .conn
            .query_row(
                "SELECT kind FROM symbols WHERE scip_symbol = ?1",
                ["scip-test . . crosslang 99"],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(placeholder_kind, 0);

        // Three-element range expands to (start_line, start_char, start_line, end_char)
        // and the raw 3-element vec is preserved in range_raw.
        let (sl, sc, el, ec, raw): (i64, i64, i64, i64, String) = db
            .conn
            .query_row(
                "SELECT start_line, start_character, end_line, end_character, range_raw \
                 FROM occurrences ORDER BY id LIMIT 1",
                [],
                |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?, r.get(3)?, r.get(4)?)),
            )
            .unwrap();
        assert_eq!((sl, sc, el, ec), (0, 0, 0, 5));
        let raw_vec: Vec<i32> = serde_json::from_str(&raw).unwrap();
        assert_eq!(raw_vec, vec![0, 0, 5]);

        // Diagnostic landed on the second occurrence.
        let (sev, msg): (i64, String) = db
            .conn
            .query_row(
                "SELECT severity, message FROM diagnostics LIMIT 1",
                [],
                |r| Ok((r.get(0)?, r.get(1)?)),
            )
            .unwrap();
        assert_eq!(sev, i64::from(Severity::Warning.value()));
        assert_eq!(msg, "watch out");

        // Relationship landed.
        let related: String = db
            .conn
            .query_row(
                "SELECT related_symbol FROM relationships LIMIT 1",
                [],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(related, "scip-test . . local 1");

        // documentation round-trips through JSON, even when individual
        // entries contain newlines. Naive newline-joining would fuse
        // the two entries; the JSON array preserves the boundary.
        let doc_json: String = db
            .conn
            .query_row(
                "SELECT documentation FROM symbols WHERE scip_symbol = ?1",
                ["scip-test . . local 1"],
                |r| r.get(0),
            )
            .unwrap();
        let docs: Vec<String> = serde_json::from_str(&doc_json).unwrap();
        assert_eq!(docs, vec!["docs line 1\nstill in line 1", "docs line 2"]);

        // override_documentation round-trips the same way.
        let override_json: String = db
            .conn
            .query_row(
                "SELECT override_documentation FROM occurrences \
                 WHERE override_documentation IS NOT NULL LIMIT 1",
                [],
                |r| r.get(0),
            )
            .unwrap();
        let overrides: Vec<String> = serde_json::from_str(&override_json).unwrap();
        assert_eq!(overrides, vec!["override\nwith newline", "second entry"]);
    }

    #[test]
    fn ingest_invalid_proto_returns_decode_error() {
        let mut db = MirrorDb::open_in_memory();
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("garbage.scip");
        let mut f = std::fs::File::create(&path).unwrap();
        f.write_all(b"\xff\xff\xff\xff not a proto").unwrap();
        drop(f);

        let err = db
            .ingest(Language::Rust, &path)
            .expect_err("garbage bytes must fail");
        assert!(matches!(err, SinkError::Decode(_)));
    }

    #[test]
    fn duplicate_scip_symbol_lands_as_separate_rows() {
        let mut db = MirrorDb::open_in_memory();

        let mut tool = ToolInfo::new();
        tool.name = "scip-test".into();
        let mut meta = Metadata::new();
        meta.tool_info = MessageField::some(tool);

        // Two SymbolInformation entries with the same `symbol` string —
        // each carries different documentation. v1 preserves both.
        let mut sym_first = SymbolInformation::new();
        sym_first.symbol = "scip-test . . dup 1".into();
        sym_first.kind = EnumOrUnknown::new(Kind::Function);
        sym_first.documentation = vec!["first def".into()];

        let mut sym_second = SymbolInformation::new();
        sym_second.symbol = "scip-test . . dup 1".into();
        sym_second.kind = EnumOrUnknown::new(Kind::Function);
        sym_second.documentation = vec!["second def".into()];

        let mut doc = Document::new();
        doc.relative_path = "x.rs".into();
        doc.symbols = vec![sym_first, sym_second];

        let mut index = Index::new();
        index.metadata = MessageField::some(meta);
        index.documents = vec![doc];

        let (_dir, path) = write_index_to_temp(&index);
        let stats = db.ingest(Language::Rust, &path).expect("ingest");
        assert_eq!(stats.symbols, 2);

        let rows: i64 = db
            .conn
            .query_row(
                "SELECT count(*) FROM symbols WHERE scip_symbol = ?1",
                ["scip-test . . dup 1"],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(rows, 2);

        // Both documentations survive (they sort to a stable order; check both present).
        let mut docs: Vec<String> = db
            .conn
            .prepare("SELECT documentation FROM symbols WHERE scip_symbol = ?1 ORDER BY id")
            .unwrap()
            .query_map(["scip-test . . dup 1"], |r| r.get::<_, String>(0))
            .unwrap()
            .map(Result::unwrap)
            .collect();
        docs.sort();
        let parsed: Vec<Vec<String>> = docs
            .iter()
            .map(|s| serde_json::from_str(s).unwrap())
            .collect();
        assert_eq!(parsed, vec![vec!["first def"], vec!["second def"]]);
    }

    #[test]
    fn malformed_range_preserves_raw_and_nulls_structured_columns() {
        let mut db = MirrorDb::open_in_memory();

        let mut tool = ToolInfo::new();
        tool.name = "scip-test".into();
        let mut meta = Metadata::new();
        meta.tool_info = MessageField::some(tool);

        let mut sym = SymbolInformation::new();
        sym.symbol = "scip-test . . s".into();
        sym.kind = EnumOrUnknown::new(Kind::Variable);

        let mut occ = Occurrence::new();
        occ.range = vec![1, 2, 3, 4, 5]; // five elements — neither the 3- nor 4-form
        occ.symbol = "scip-test . . s".into();

        let mut doc = Document::new();
        doc.relative_path = "y.rs".into();
        doc.symbols = vec![sym];
        doc.occurrences = vec![occ];

        let mut index = Index::new();
        index.metadata = MessageField::some(meta);
        index.documents = vec![doc];

        let (_dir, path) = write_index_to_temp(&index);
        db.ingest(Language::Rust, &path).expect("ingest");

        let (sl, sc, el, ec, raw): (Option<i64>, Option<i64>, Option<i64>, Option<i64>, String) =
            db.conn
                .query_row(
                    "SELECT start_line, start_character, end_line, end_character, range_raw \
                     FROM occurrences",
                    [],
                    |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?, r.get(3)?, r.get(4)?)),
                )
                .unwrap();
        assert!(sl.is_none() && sc.is_none() && el.is_none() && ec.is_none());
        let raw_vec: Vec<i32> = serde_json::from_str(&raw).unwrap();
        assert_eq!(raw_vec, vec![1, 2, 3, 4, 5]);
    }

    #[test]
    fn unknown_fields_in_decoded_index_are_counted() {
        let mut db = MirrorDb::open_in_memory();

        let mut tool = ToolInfo::new();
        tool.name = "scip-test".into();
        let mut meta = Metadata::new();
        meta.tool_info = MessageField::some(tool);

        let mut doc = Document::new();
        doc.relative_path = "z.rs".into();
        // Inject an unknown field into the Document's special_fields,
        // simulating wire data from a future scip.proto field.
        doc.special_fields.mut_unknown_fields().add_varint(9999, 42);

        let mut index = Index::new();
        index.metadata = MessageField::some(meta);
        index.documents = vec![doc];

        let (_dir, path) = write_index_to_temp(&index);
        let stats = db.ingest(Language::Rust, &path).expect("ingest");
        assert_eq!(
            stats.unknown_field_messages, 1,
            "exactly one message should carry unknown wire data",
        );
    }

    #[test]
    fn re_create_truncates_existing_file() {
        let dir = tempfile::tempdir().unwrap();
        let db_path = dir.path().join("index.db");

        // First create + ingest.
        {
            let mut db = MirrorDb::create(&db_path).unwrap();
            let (_temp, scip) = write_index_to_temp(&synthetic_index());
            db.ingest(Language::Rust, &scip).unwrap();
            let n: i64 = db
                .conn
                .query_row("SELECT count(*) FROM documents", [], |r| r.get(0))
                .unwrap();
            assert_eq!(n, 1);
        }

        // Recreate at the same path; tables must be empty.
        let db = MirrorDb::create(&db_path).unwrap();
        let n: i64 = db
            .conn
            .query_row("SELECT count(*) FROM documents", [], |r| r.get(0))
            .unwrap();
        assert_eq!(n, 0);
    }
}
