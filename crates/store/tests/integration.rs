#![allow(clippy::unwrap_used)]

use tessera_store::{StoreConfig, TerminusClient};
use url::Url;

fn test_client() -> TerminusClient {
    let config = StoreConfig::new(
        Url::parse("http://localhost:6363").unwrap(),
        "admin".into(),
        "root".into(),
    );
    TerminusClient::new(&config).unwrap()
}

#[tokio::test]
async fn server_info() {
    let client = test_client();
    let info = client.info().await.unwrap();
    assert_eq!(info.ty, "api:InfoResponse");
}

#[tokio::test]
async fn create_and_delete_database() {
    let client = test_client();
    let db_name = "tessera_integration_test";

    drop(client.delete_database("admin", db_name).await);

    let result = client
        .create_database("admin", db_name, "Integration Test DB")
        .await
        .unwrap();
    assert!(result.get("@type").is_some());

    let dbs = client.list_databases().await.unwrap();
    let dbs_array = dbs.as_array().expect("expected array of databases");
    let found = dbs_array
        .iter()
        .any(|db| db["path"].as_str() == Some(&format!("admin/{db_name}")));
    assert!(found, "created database should appear in listing");

    client.delete_database("admin", db_name).await.unwrap();
}
