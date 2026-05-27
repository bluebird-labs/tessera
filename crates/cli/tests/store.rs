use assert_cmd::Command;

#[test]
fn store_flag_without_env_vars_fails() {
    Command::cargo_bin("tessera")
        .unwrap()
        .args(["index", ".", "--store", "--color", "never"])
        .env_remove("TERMINUSDB_HOST")
        .env_remove("TERMINUSDB_PORT")
        .env_remove("TERMINUSDB_USER")
        .env_remove("TERMINUSDB_ADMIN_PASS")
        .assert()
        .failure();
}
