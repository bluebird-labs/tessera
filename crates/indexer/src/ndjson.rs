use std::io::BufRead;

use anyhow::Context;
use tessera_graph::{GraphEntry, Mosaic, MosaicBuilder};

pub fn read_entries(reader: impl BufRead) -> impl Iterator<Item = anyhow::Result<GraphEntry>> {
    reader.lines().filter_map(|line_result| match line_result {
        Err(e) => Some(Err(
            anyhow::Error::new(e).context("reading extractor output")
        )),
        Ok(line) if line.is_empty() => None,
        Ok(line) => {
            Some(serde_json::from_str::<GraphEntry>(&line).context("parsing extractor NDJSON line"))
        }
    })
}

pub fn read_mosaic(reader: impl BufRead) -> anyhow::Result<Mosaic> {
    let mut builder = MosaicBuilder::new();

    for entry in read_entries(reader) {
        match entry? {
            GraphEntry::Tile(t) => {
                builder.add(t)?;
            }
            GraphEntry::Bond(b) => {
                builder.bond(b);
            }
        }
    }

    builder
        .build()
        .context("building mosaic from extractor output")
}

#[cfg(test)]
mod tests {
    use std::io::Cursor;

    use tessera_graph::{
        Bond, BondKind, ConformanceProfile, GraphEntry, LanguageTag, Tessera, TesseraId,
        TesseraKind,
    };

    use super::*;

    fn sample_ndjson() -> String {
        let corpus_id = TesseraId::corpus("c");
        let fn_id = TesseraId::new("c", LanguageTag::Ts, "m", "", "f");

        let tile = GraphEntry::Tile(Tessera::corpus(
            corpus_id.clone(),
            "c",
            &[ConformanceProfile::Core],
        ));
        let bond = GraphEntry::Bond(Bond::new(BondKind::ChildOf, fn_id.clone(), corpus_id));
        let tile2 = GraphEntry::Tile(Tessera::new(fn_id, TesseraKind::Function));

        let mut buf = serde_json::to_string(&tile).unwrap();
        buf.push('\n');
        buf.push_str(&serde_json::to_string(&bond).unwrap());
        buf.push('\n');
        buf.push('\n'); // empty line — should be skipped
        buf.push_str(&serde_json::to_string(&tile2).unwrap());
        buf.push('\n');
        buf
    }

    #[test]
    fn read_entries_parses_tiles_and_bonds() {
        let ndjson = sample_ndjson();
        let cursor = Cursor::new(ndjson.as_bytes());
        let entries: Vec<GraphEntry> = read_entries(cursor).collect::<Result<Vec<_>, _>>().unwrap();

        assert_eq!(entries.len(), 3);
        assert!(matches!(entries[0], GraphEntry::Tile(_)));
        assert!(matches!(entries[1], GraphEntry::Bond(_)));
        assert!(matches!(entries[2], GraphEntry::Tile(_)));
    }

    #[test]
    fn read_entries_errors_on_bad_json() {
        let input: &[u8] = b"not json\n";
        let cursor = Cursor::new(input);
        let results: Vec<_> = read_entries(cursor).collect();
        assert_eq!(results.len(), 1);
        assert!(results[0].is_err());
    }
}
