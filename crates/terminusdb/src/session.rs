use serde_json::Value;
use tessera_graph::{Bond, Tessera};
use tessera_store::{IngestionSession, IngestionStats};

use crate::client::TerminusClient;
use crate::error::TerminusError;
use crate::mapping;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum OpenMode {
    Replace,
    Append,
}

#[derive(Debug, Clone)]
pub struct SessionConfig {
    pub tile_batch_size: usize,
    pub bond_batch_size: usize,
}

impl Default for SessionConfig {
    fn default() -> Self {
        Self {
            tile_batch_size: 1000,
            bond_batch_size: 2000,
        }
    }
}

#[derive(Debug)]
pub struct TerminusSession {
    client: TerminusClient,
    runtime: tokio::runtime::Runtime,
    org: String,
    db: String,
    tile_buffer: Vec<Value>,
    bond_buffer: Vec<Value>,
    config: SessionConfig,
    stats: IngestionStats,
}

impl TerminusSession {
    pub fn open(
        client: TerminusClient,
        org: &str,
        db: &str,
        mode: OpenMode,
    ) -> Result<Self, TerminusError> {
        Self::open_with_config(client, org, db, mode, SessionConfig::default())
    }

    pub fn open_with_config(
        client: TerminusClient,
        org: &str,
        db: &str,
        mode: OpenMode,
        config: SessionConfig,
    ) -> Result<Self, TerminusError> {
        let runtime = tokio::runtime::Runtime::new()
            .map_err(|e| TerminusError::Config(format!("failed to create tokio runtime: {e}")))?;

        let exists = runtime.block_on(client.database_exists(org, db))?;

        match mode {
            OpenMode::Replace => {
                if exists {
                    runtime.block_on(client.delete_database(org, db))?;
                }
                runtime.block_on(client.create_database(org, db, db))?;
                runtime.block_on(client.replace_schema(org, db, &mapping::terminus_schema()))?;
            }
            OpenMode::Append => {
                if !exists {
                    runtime.block_on(client.create_database(org, db, db))?;
                    runtime.block_on(client.replace_schema(
                        org,
                        db,
                        &mapping::terminus_schema(),
                    ))?;
                }
            }
        }

        Ok(Self {
            client,
            runtime,
            org: org.to_owned(),
            db: db.to_owned(),
            tile_buffer: Vec::new(),
            bond_buffer: Vec::new(),
            config,
            stats: IngestionStats {
                tiles_written: 0,
                bonds_written: 0,
            },
        })
    }

    fn flush_tiles(&mut self) -> Result<(), TerminusError> {
        if self.tile_buffer.is_empty() {
            return Ok(());
        }
        let batch: Vec<Value> = self.tile_buffer.drain(..).collect();
        let count = batch.len();
        let path = format!("{}/{}", self.org, self.db);
        self.runtime
            .block_on(self.client.replace_documents(&path, &batch))?;
        self.stats.tiles_written += count;
        Ok(())
    }

    fn flush_bonds(&mut self) -> Result<(), TerminusError> {
        if self.bond_buffer.is_empty() {
            return Ok(());
        }
        let path = format!("{}/{}", self.org, self.db);
        let bonds = std::mem::take(&mut self.bond_buffer);
        for chunk in bonds.chunks(self.config.bond_batch_size) {
            self.runtime
                .block_on(self.client.replace_documents(&path, &chunk))?;
            self.stats.bonds_written += chunk.len();
        }
        Ok(())
    }
}

impl IngestionSession for TerminusSession {
    type Error = TerminusError;

    fn ingest_tessera(&mut self, tessera: &Tessera) -> Result<(), Self::Error> {
        let doc = mapping::tessera_to_document(tessera);
        self.tile_buffer.push(doc);
        if self.tile_buffer.len() >= self.config.tile_batch_size {
            self.flush_tiles()?;
        }
        Ok(())
    }

    fn ingest_bond(&mut self, bond: &Bond) -> Result<(), Self::Error> {
        let doc = mapping::bond_to_document(bond);
        self.bond_buffer.push(doc);
        Ok(())
    }

    fn commit(&mut self) -> Result<IngestionStats, Self::Error> {
        self.flush_tiles()?;
        self.flush_bonds()?;
        Ok(self.stats.clone())
    }

    fn abort(&mut self) -> Result<(), Self::Error> {
        Ok(())
    }
}
