use assert_cmd::Command;
use predicates::str::contains;

#[test]
fn index_is_not_yet_implemented() {
    let assert = Command::cargo_bin("tessera")
        .unwrap()
        .args(["index", ".", "--color", "never"])
        .assert();

    assert.failure().stderr(contains("not yet implemented"));
}
