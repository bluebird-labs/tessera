use tessera_graph::GraphEntry;
use tessera_store::{IngestionSession, IngestionStats};

/// Drain graph entries into a session, commit, and return stats.
pub fn ingest<S: IngestionSession>(
    entries: &mut impl Iterator<Item = anyhow::Result<GraphEntry>>,
    session: &mut S,
) -> anyhow::Result<IngestionStats>
where
    S::Error: std::error::Error + Send + Sync + 'static,
{
    for entry in entries {
        match entry? {
            GraphEntry::Tile(ref t) => session.ingest_tessera(t)?,
            GraphEntry::Bond(ref b) => session.ingest_bond(b)?,
        }
    }
    Ok(session.commit()?)
}

#[cfg(test)]
mod tests {
    use tessera_graph::{Bond, BondKind, GraphEntry, Tessera, TesseraId, TesseraKind};
    use tessera_store::MemorySession;

    use super::*;

    fn sample_tile() -> Tessera {
        Tessera::new(TesseraId::corpus("test-corp"), TesseraKind::Corpus)
    }

    fn sample_bond() -> Bond {
        Bond::new(
            BondKind::ChildOf,
            TesseraId::file("test-corp", "a.rs"),
            TesseraId::corpus("test-corp"),
        )
    }

    #[test]
    fn happy_path_commits_and_returns_stats() {
        let mut entries: Box<dyn Iterator<Item = anyhow::Result<GraphEntry>>> = Box::new(
            vec![
                Ok(GraphEntry::Tile(sample_tile())),
                Ok(GraphEntry::Bond(sample_bond())),
                Ok(GraphEntry::Tile(Tessera::new(
                    TesseraId::file("test-corp", "a.rs"),
                    TesseraKind::File,
                ))),
            ]
            .into_iter(),
        );

        let mut session = MemorySession::new();
        let stats = ingest(&mut entries, &mut session).unwrap();

        assert_eq!(stats.tiles_written, 2);
        assert_eq!(stats.bonds_written, 1);
        assert!(session.committed);
    }

    #[test]
    fn error_mid_stream_propagates() {
        let mut entries: Box<dyn Iterator<Item = anyhow::Result<GraphEntry>>> = Box::new(
            vec![
                Ok(GraphEntry::Tile(sample_tile())),
                Err(anyhow::anyhow!("extractor crashed")),
                Ok(GraphEntry::Bond(sample_bond())),
            ]
            .into_iter(),
        );

        let mut session = MemorySession::new();
        let result = ingest(&mut entries, &mut session);

        assert!(result.is_err());
        assert!(!session.committed);
    }
}
