#![allow(clippy::unwrap_used)]

use tessera_graph::{Bond, BondKind, LanguageTag, Tessera, TesseraId, TesseraKind};
use tessera_store::IngestionSession;
use tessera_terminusdb::{OpenMode, TerminusClient, TerminusConfig, TerminusSession};
use url::Url;

fn test_client() -> TerminusClient {
    let config = TerminusConfig::new(
        Url::parse("http://localhost:6363").unwrap(),
        "admin".into(),
        "root".into(),
    );
    TerminusClient::new(&config).unwrap()
}

#[test]
#[ignore = "requires running TerminusDB"]
fn ingest_and_verify() {
    let client = test_client();

    {
        let mut session = TerminusSession::open(
            client.clone(),
            "admin",
            "tessera_ingest_test",
            OpenMode::Replace,
        )
        .unwrap();

        let corpus_id = TesseraId::corpus("test-corpus");
        let fn_id = TesseraId::new("test-corpus", LanguageTag::Rust, "app", "", "main");

        session
            .ingest_tessera(&Tessera::new(corpus_id.clone(), TesseraKind::Corpus))
            .unwrap();
        session
            .ingest_tessera(&Tessera::new(fn_id.clone(), TesseraKind::Function))
            .unwrap();
        session
            .ingest_bond(&Bond::new(BondKind::ChildOf, fn_id, corpus_id))
            .unwrap();

        let stats = session.commit().unwrap();
        assert_eq!(stats.tiles_written, 2);
        assert_eq!(stats.bonds_written, 1);
    }

    let rt = tokio::runtime::Runtime::new().unwrap();
    let docs: Vec<serde_json::Value> = rt
        .block_on(client.get_documents("admin/tessera_ingest_test"))
        .unwrap();
    assert_eq!(docs.len(), 3);
}

#[test]
#[ignore = "requires running TerminusDB"]
fn replace_mode_overwrites() {
    let client = test_client();

    {
        let mut session = TerminusSession::open(
            client.clone(),
            "admin",
            "tessera_replace_test",
            OpenMode::Replace,
        )
        .unwrap();
        let id = TesseraId::corpus("corpus-1");
        session
            .ingest_tessera(&Tessera::new(id, TesseraKind::Corpus))
            .unwrap();
        session.commit().unwrap();
    }

    {
        let mut session = TerminusSession::open(
            client.clone(),
            "admin",
            "tessera_replace_test",
            OpenMode::Replace,
        )
        .unwrap();
        let id = TesseraId::corpus("corpus-2");
        session
            .ingest_tessera(&Tessera::new(id, TesseraKind::Corpus))
            .unwrap();
        let stats = session.commit().unwrap();
        assert_eq!(stats.tiles_written, 1);
    }

    let rt = tokio::runtime::Runtime::new().unwrap();
    let docs: Vec<serde_json::Value> = rt
        .block_on(client.get_documents("admin/tessera_replace_test"))
        .unwrap();
    let tessera_docs: Vec<_> = docs
        .iter()
        .filter(|d| d["@type"].as_str() == Some("Tessera"))
        .collect();
    assert_eq!(tessera_docs.len(), 1);
    assert_eq!(tessera_docs[0]["corpus"].as_str(), Some("corpus-2"));
}
