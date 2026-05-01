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
}

#[test]
fn synthetic_rust_indexer_succeeds() {
    let project = tempfile::tempdir().unwrap();
    touch(project.path(), "Cargo.toml");
    let output = tempfile::tempdir().unwrap();
    let bin_dir = tempfile::tempdir().unwrap();

    // rust-analyzer is invoked as `rust-analyzer scip <path>`; $2 is the path.
    write_executable(
        bin_dir.path(),
        "rust-analyzer",
        "#!/bin/sh\nprintf 'hi' > \"$2/index.scip\"\n",
    );

    let assert = Command::cargo_bin("tessera")
        .unwrap()
        .args([
            "index",
            project.path().to_str().unwrap(),
            "-o",
            output.path().to_str().unwrap(),
            "--color",
            "never",
        ])
        .env("PATH", bin_dir.path())
        .assert();

    assert.success();

    let produced = output.path().join("rust.scip");
    assert!(
        produced.exists(),
        "expected {} to exist",
        produced.display()
    );
    assert_eq!(std::fs::read(&produced).unwrap(), b"hi");
    assert!(!project.path().join("index.scip").exists());
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
fn empty_project_exits_nonzero() {
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
}
