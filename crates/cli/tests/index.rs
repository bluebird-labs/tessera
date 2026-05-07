#![cfg(unix)]

use std::os::unix::fs::PermissionsExt;
use std::path::Path;

use assert_cmd::Command;
use predicates::prelude::*;
use predicates::str::contains;

fn touch(dir: &Path, name: &str) {
    std::fs::write(dir.join(name), b"").unwrap();
}

fn write_executable(dir: &Path, name: &str, body: &str) {
    let path = dir.join(name);
    std::fs::write(&path, body).unwrap();
    let mut perms = std::fs::metadata(&path).unwrap().permissions();
    perms.set_mode(0o755);
    std::fs::set_permissions(&path, perms).unwrap();
}

#[test]
fn no_indexers_on_path_exits_nonzero_with_skips() {
    let project = tempfile::tempdir().unwrap();
    touch(project.path(), "Cargo.toml");
    touch(project.path(), "go.mod");
    touch(project.path(), "package.json");
    touch(project.path(), "pyproject.toml");

    let assert = Command::cargo_bin("tessera")
        .unwrap()
        .args([
            "index",
            project.path().to_str().unwrap(),
            "--color",
            "never",
        ])
        .env("PATH", "")
        .assert();

    assert
        .failure()
        .stdout(contains("rust").and(contains("not on PATH")))
        .stdout(contains("go").and(contains("scip-go")))
        .stdout(contains("typescript").and(contains("scip-typescript")))
        .stdout(contains("python").and(contains("scip-python")))
        .stderr(contains("rust-analyzer").and(contains("not found on PATH")));

    // Per RFC 0003 §9, the DB is created before the indexer loop runs,
    // so an "all skipped" run still leaves the schema'd file on disk.
    let db = project.path().join(".tessera").join("index.db");
    assert!(db.exists(), "expected schema-only DB at {}", db.display());
}

#[test]
fn synthetic_rust_indexer_writes_default_db() {
    let project = tempfile::tempdir().unwrap();
    touch(project.path(), "Cargo.toml");
    let bin_dir = tempfile::tempdir().unwrap();

    // rust-analyzer is invoked as `rust-analyzer scip <path>`; $2 is the path.
    // An empty file decodes as a default-valued SCIP `Index` proto, which
    // exercises the full ingest pipeline (metadata row inserted, zero
    // documents).
    write_executable(
        bin_dir.path(),
        "rust-analyzer",
        "#!/bin/sh\n: > \"$2/index.scip\"\n",
    );

    let assert = Command::cargo_bin("tessera")
        .unwrap()
        .args([
            "index",
            project.path().to_str().unwrap(),
            "--color",
            "never",
        ])
        .env("PATH", bin_dir.path())
        .assert();

    assert.success();

    let db = project.path().join(".tessera").join("index.db");
    assert!(db.exists(), "expected DB at {}", db.display());
    assert!(!project.path().join("index.scip").exists());

    let conn = rusqlite::Connection::open(&db).unwrap();
    let lang: String = conn
        .query_row("SELECT language FROM metadata", [], |r| r.get(0))
        .unwrap();
    assert_eq!(lang, "rust");
}

#[test]
fn synthetic_rust_indexer_writes_custom_output() {
    let project = tempfile::tempdir().unwrap();
    touch(project.path(), "Cargo.toml");
    let bin_dir = tempfile::tempdir().unwrap();
    let out_dir = tempfile::tempdir().unwrap();
    let custom_db = out_dir.path().join("nested").join("custom.db");

    write_executable(
        bin_dir.path(),
        "rust-analyzer",
        "#!/bin/sh\n: > \"$2/index.scip\"\n",
    );

    let assert = Command::cargo_bin("tessera")
        .unwrap()
        .args([
            "index",
            project.path().to_str().unwrap(),
            "-o",
            custom_db.to_str().unwrap(),
            "--color",
            "never",
        ])
        .env("PATH", bin_dir.path())
        .assert();

    assert.success();
    assert!(custom_db.exists(), "expected DB at {}", custom_db.display());
    // Default location must NOT also have been created.
    assert!(!project.path().join(".tessera").join("index.db").exists());
}

#[test]
fn missing_path_exits_nonzero() {
    let assert = Command::cargo_bin("tessera")
        .unwrap()
        .args([
            "index",
            "/tmp/tessera-does-not-exist-xyz",
            "--color",
            "never",
        ])
        .assert();
    assert.failure().stderr(contains("invalid project path"));
}

#[test]
fn empty_project_exits_nonzero_and_creates_no_db() {
    let project = tempfile::tempdir().unwrap();
    let assert = Command::cargo_bin("tessera")
        .unwrap()
        .args([
            "index",
            project.path().to_str().unwrap(),
            "--color",
            "never",
        ])
        .assert();
    assert
        .failure()
        .stderr(contains("no language manifests detected"));

    // Detection failure happens before DB creation, so nothing is on disk.
    assert!(!project.path().join(".tessera").exists());
}
