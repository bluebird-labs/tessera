//! App-level registry of opened project folders.
//!
//! `tessera-projects` is the persistence layer for the desktop's project
//! picker: which folders the user has opened and when they were last
//! touched. It deliberately lives outside `tessera-store` (the graph
//! ingestion port) because project-list state is application metadata,
//! not graph data.
//!
//! Storage is a single `SQLite` file owned by [`ProjectStore`]; rows are
//! returned as [`Project`] values.

use std::path::{Path, PathBuf};
use std::sync::Mutex;

use rusqlite::{Connection, OptionalExtension, params};
use serde::Serialize;
use thiserror::Error;
use time::OffsetDateTime;
use time::format_description::well_known::Iso8601;

// Re-export `time` so consumers can format/parse [`Project::last_opened`]
// without taking their own direct dependency on the crate.
pub use time;

/// `SQLite`-backed registry of opened project folders.
///
/// The underlying [`rusqlite::Connection`] is wrapped in a [`Mutex`] so
/// `ProjectStore` is `Send + Sync` and can be parked in Tauri state.
#[derive(Debug)]
pub struct ProjectStore {
    conn: Mutex<Connection>,
}

/// A project folder the user has opened at least once.
#[derive(Debug, Clone, Serialize)]
pub struct Project {
    pub id: i64,
    pub path: PathBuf,
    #[serde(with = "time::serde::iso8601")]
    pub last_opened: OffsetDateTime,
}

#[derive(Debug, Error)]
pub enum ProjectStoreError {
    #[error("i/o error: {0}")]
    Io(#[from] std::io::Error),
    #[error("sqlite error: {0}")]
    Sqlite(#[from] rusqlite::Error),
    #[error("project not found: id {0}")]
    NotFound(i64),
    #[error("could not canonicalize path {path:?}: {source}")]
    PathCanonicalize {
        path: PathBuf,
        #[source]
        source: std::io::Error,
    },
    #[error("invalid timestamp returned from store: {0}")]
    InvalidTimestamp(String),
}

const SCHEMA: &str = "
CREATE TABLE IF NOT EXISTS projects (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  path        TEXT NOT NULL UNIQUE,
  last_opened TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
";

impl ProjectStore {
    /// Open or create the `SQLite` database at `db_path`.
    ///
    /// Creates the parent directory if missing and applies the schema.
    pub fn open(db_path: &Path) -> Result<Self, ProjectStoreError> {
        if let Some(parent) = db_path.parent() {
            if !parent.as_os_str().is_empty() {
                std::fs::create_dir_all(parent)?;
            }
        }
        let conn = Connection::open(db_path)?;
        conn.execute_batch(SCHEMA)?;
        Ok(Self {
            conn: Mutex::new(conn),
        })
    }

    /// Open an in-memory store. Primarily useful for tests.
    pub fn open_in_memory() -> Result<Self, ProjectStoreError> {
        let conn = Connection::open_in_memory()?;
        conn.execute_batch(SCHEMA)?;
        Ok(Self {
            conn: Mutex::new(conn),
        })
    }

    fn lock(&self) -> std::sync::MutexGuard<'_, Connection> {
        // A poisoned mutex means a previous query panicked while holding
        // the lock; downstream errors are more useful than a panic here.
        self.conn
            .lock()
            .unwrap_or_else(std::sync::PoisonError::into_inner)
    }

    /// List all projects, most recently opened first.
    // `list` holds the connection mutex across a `prepare` + `query_map`
    // sequence; clippy's `significant_drop_tightening` wants a single
    // expression, which isn't expressible here without leaking the
    // rusqlite `Statement`'s borrow of the connection.
    #[allow(clippy::significant_drop_tightening)]
    pub fn list(&self) -> Result<Vec<Project>, ProjectStoreError> {
        let conn = self.lock();
        let mut stmt = conn.prepare(
            "SELECT id, path, last_opened FROM projects ORDER BY last_opened DESC, id DESC",
        )?;
        let rows: Vec<ProjectRow> = stmt
            .query_map([], row_to_project)?
            .collect::<Result<_, _>>()?;
        drop(stmt);
        drop(conn);
        rows.into_iter().map(parse_project_row).collect()
    }

    /// Add a project. Idempotent: if `path` already exists, its
    /// `last_opened` is bumped and the existing row is returned.
    pub fn add(&self, path: &Path) -> Result<Project, ProjectStoreError> {
        let canonical = canonicalize(path)?;
        let canonical_str = canonical.to_string_lossy().into_owned();
        let now = now_iso8601();
        let row = self.lock().query_row(
            "INSERT INTO projects(path, last_opened) VALUES(?1, ?2)
             ON CONFLICT(path) DO UPDATE SET last_opened = excluded.last_opened
             RETURNING id, path, last_opened",
            params![canonical_str, now],
            row_to_project,
        )?;
        parse_project_row(row)
    }

    /// Remove a project by id.
    pub fn remove(&self, id: i64) -> Result<(), ProjectStoreError> {
        let affected = self
            .lock()
            .execute("DELETE FROM projects WHERE id = ?1", params![id])?;
        if affected == 0 {
            return Err(ProjectStoreError::NotFound(id));
        }
        Ok(())
    }

    /// Bump `last_opened` for the row with `id`.
    pub fn touch(&self, id: i64) -> Result<(), ProjectStoreError> {
        let now = now_iso8601();
        let updated = self.lock().execute(
            "UPDATE projects SET last_opened = ?1 WHERE id = ?2",
            params![now, id],
        )?;
        if updated == 0 {
            return Err(ProjectStoreError::NotFound(id));
        }
        Ok(())
    }

    /// Fetch a single project by id.
    ///
    /// Returns [`ProjectStoreError::NotFound`] if no row matches.
    pub fn get(&self, id: i64) -> Result<Project, ProjectStoreError> {
        let row = self
            .lock()
            .query_row(
                "SELECT id, path, last_opened FROM projects WHERE id = ?1",
                params![id],
                row_to_project,
            )
            .optional()?
            .ok_or(ProjectStoreError::NotFound(id))?;
        parse_project_row(row)
    }
}

struct ProjectRow {
    id: i64,
    path: String,
    last_opened: String,
}

fn row_to_project(row: &rusqlite::Row<'_>) -> rusqlite::Result<ProjectRow> {
    Ok(ProjectRow {
        id: row.get(0)?,
        path: row.get(1)?,
        last_opened: row.get(2)?,
    })
}

fn parse_project_row(row: ProjectRow) -> Result<Project, ProjectStoreError> {
    let last_opened = OffsetDateTime::parse(&row.last_opened, &Iso8601::DEFAULT)
        .map_err(|_| ProjectStoreError::InvalidTimestamp(row.last_opened.clone()))?;
    Ok(Project {
        id: row.id,
        path: PathBuf::from(row.path),
        last_opened,
    })
}

fn canonicalize(path: &Path) -> Result<PathBuf, ProjectStoreError> {
    std::fs::canonicalize(path).map_err(|source| ProjectStoreError::PathCanonicalize {
        path: path.to_path_buf(),
        source,
    })
}

fn now_iso8601() -> String {
    // `SQLite`'s default `strftime('%Y-%m-%dT%H:%M:%fZ', 'now')` produces
    // an ISO-8601 string; we mirror its format here so timestamps written
    // by the schema default and by manual upserts sort identically.
    OffsetDateTime::now_utc()
        .format(&Iso8601::DEFAULT)
        .unwrap_or_else(|_| "1970-01-01T00:00:00.000Z".to_owned())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::thread::sleep;
    use std::time::Duration;
    use tempfile::tempdir;

    fn store() -> ProjectStore {
        ProjectStore::open_in_memory().expect("open in-memory store")
    }

    #[test]
    fn open_creates_db_file_and_is_idempotent() {
        let dir = tempdir().unwrap();
        let db_path = dir.path().join("nested").join("projects.db");
        {
            let _store = ProjectStore::open(&db_path).expect("first open");
            assert!(db_path.exists());
        }
        let _reopened = ProjectStore::open(&db_path).expect("second open");
    }

    #[test]
    fn add_returns_project_with_canonical_path() {
        let dir = tempdir().unwrap();
        let store = store();
        let project = store.add(dir.path()).unwrap();
        assert_eq!(
            project.path,
            std::fs::canonicalize(dir.path()).unwrap(),
            "stored path should be canonical",
        );
        assert!(project.id > 0);
    }

    #[test]
    fn add_is_idempotent_and_bumps_timestamp() {
        let dir = tempdir().unwrap();
        let store = store();
        let first = store.add(dir.path()).unwrap();
        sleep(Duration::from_millis(10));
        let second = store.add(dir.path()).unwrap();
        assert_eq!(first.id, second.id, "re-adding should return same id");
        assert!(
            second.last_opened >= first.last_opened,
            "re-adding should bump last_opened",
        );
    }

    #[test]
    fn list_orders_by_last_opened_desc() {
        let a = tempdir().unwrap();
        let b = tempdir().unwrap();
        let store = store();
        let added_a = store.add(a.path()).unwrap();
        sleep(Duration::from_millis(10));
        let added_b = store.add(b.path()).unwrap();
        let list = store.list().unwrap();
        assert_eq!(list.len(), 2);
        assert_eq!(list[0].id, added_b.id, "newest first");
        assert_eq!(list[1].id, added_a.id);
    }

    #[test]
    fn touch_bumps_row_to_top() {
        let a = tempdir().unwrap();
        let b = tempdir().unwrap();
        let store = store();
        let added_a = store.add(a.path()).unwrap();
        sleep(Duration::from_millis(10));
        let _added_b = store.add(b.path()).unwrap();
        sleep(Duration::from_millis(10));
        store.touch(added_a.id).unwrap();
        let list = store.list().unwrap();
        assert_eq!(list[0].id, added_a.id, "touched row should be first");
    }

    #[test]
    fn remove_deletes_row() {
        let dir = tempdir().unwrap();
        let store = store();
        let project = store.add(dir.path()).unwrap();
        store.remove(project.id).unwrap();
        assert!(store.list().unwrap().is_empty());
    }

    #[test]
    fn remove_missing_id_returns_not_found() {
        let store = store();
        let err = store.remove(999).unwrap_err();
        assert!(matches!(err, ProjectStoreError::NotFound(999)));
    }

    #[test]
    fn touch_missing_id_returns_not_found() {
        let store = store();
        let err = store.touch(999).unwrap_err();
        assert!(matches!(err, ProjectStoreError::NotFound(999)));
    }

    #[test]
    fn get_returns_inserted_row() {
        let dir = tempdir().unwrap();
        let store = store();
        let added = store.add(dir.path()).unwrap();
        let fetched = store.get(added.id).unwrap();
        assert_eq!(fetched.id, added.id);
        assert_eq!(fetched.path, added.path);
    }

    #[test]
    fn get_missing_id_returns_not_found() {
        let store = store();
        let err = store.get(999).unwrap_err();
        assert!(matches!(err, ProjectStoreError::NotFound(999)));
    }

    #[test]
    fn canonicalize_collapses_equivalent_paths() {
        let dir = tempdir().unwrap();
        let abs = dir.path().to_path_buf();

        let store = store();
        let first = store.add(&abs).unwrap();
        // Build an equivalent path that contains a `.` segment so
        // canonicalize must reduce it.
        let with_dot = abs.join(".");
        let second = store.add(&with_dot).unwrap();
        assert_eq!(first.id, second.id, "same dir should collapse to one row");
        assert_eq!(store.list().unwrap().len(), 1);
    }

    #[test]
    fn canonicalize_missing_path_errors() {
        let store = store();
        let bogus = PathBuf::from("/this/path/does/not/exist/for/real");
        let err = store.add(&bogus).unwrap_err();
        assert!(matches!(err, ProjectStoreError::PathCanonicalize { .. }));
    }
}
