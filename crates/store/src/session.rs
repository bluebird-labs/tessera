use tessera_graph::{Bond, Tessera};

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct IngestionStats {
    pub tiles_written: usize,
    pub bonds_written: usize,
}

pub trait IngestionSession {
    type Error;

    fn ingest_tessera(&mut self, tessera: &Tessera) -> Result<(), Self::Error>;
    fn ingest_bond(&mut self, bond: &Bond) -> Result<(), Self::Error>;
    fn commit(&mut self) -> Result<IngestionStats, Self::Error>;
    fn abort(&mut self) -> Result<(), Self::Error>;
}
