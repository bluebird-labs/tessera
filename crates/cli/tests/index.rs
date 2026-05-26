use assert_cmd::Command;
use predicates::str::contains;

#[test]
fn index_produces_mosaic_summary() {
    let assert = Command::cargo_bin("tessera")
        .unwrap()
        .args(["index", ".", "--color", "never"])
        .assert();

    assert.success().stdout(contains("tiles"));
}

#[test]
fn index_json_mode_produces_valid_json() {
    let output = Command::cargo_bin("tessera")
        .unwrap()
        .args(["--format", "json", "index", ".", "--color", "never"])
        .output()
        .unwrap();

    assert!(output.status.success());
    let stdout = String::from_utf8(output.stdout).unwrap();
    let parsed: serde_json::Value = serde_json::from_str(&stdout).unwrap();
    assert!(parsed["tile_count"].as_u64().unwrap() > 0);
}

#[test]
fn index_nonexistent_directory_fails() {
    let assert = Command::cargo_bin("tessera")
        .unwrap()
        .args(["index", "/nonexistent/path", "--color", "never"])
        .assert();

    assert.failure();
}
