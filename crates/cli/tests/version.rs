use assert_cmd::Command;
use predicates::str::contains;

#[test]
fn version_subcommand_prints_version() {
    Command::cargo_bin("tessera")
        .unwrap()
        .args(["version", "--color", "never"])
        .assert()
        .success()
        .stdout(contains("tessera"));
}

#[test]
fn version_json_mode() {
    let output = Command::cargo_bin("tessera")
        .unwrap()
        .args(["--format", "json", "version", "--color", "never"])
        .output()
        .unwrap();

    assert!(output.status.success());
    let stdout = String::from_utf8(output.stdout).unwrap();
    let parsed: serde_json::Value = serde_json::from_str(&stdout).unwrap();
    assert!(parsed["version"].as_str().is_some());
}
