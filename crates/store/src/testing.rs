use tessera_graph::{Bond, Tessera};

use crate::session::{IngestionSession, IngestionStats};

#[derive(Debug, Clone)]
pub struct MemorySession {
    pub tiles: Vec<Tessera>,
    pub bonds: Vec<Bond>,
    pub committed: bool,
}

impl MemorySession {
    #[must_use]
    pub const fn new() -> Self {
        Self {
            tiles: Vec::new(),
            bonds: Vec::new(),
            committed: false,
        }
    }
}

impl Default for MemorySession {
    fn default() -> Self {
        Self::new()
    }
}

impl IngestionSession for MemorySession {
    type Error = std::convert::Infallible;

    fn ingest_tessera(&mut self, tessera: &Tessera) -> Result<(), Self::Error> {
        self.tiles.push(tessera.clone());
        Ok(())
    }

    fn ingest_bond(&mut self, bond: &Bond) -> Result<(), Self::Error> {
        self.bonds.push(bond.clone());
        Ok(())
    }

    fn commit(&mut self) -> Result<IngestionStats, Self::Error> {
        self.committed = true;
        Ok(IngestionStats {
            tiles_written: self.tiles.len(),
            bonds_written: self.bonds.len(),
        })
    }

    fn abort(&mut self) -> Result<(), Self::Error> {
        Ok(())
    }
}
