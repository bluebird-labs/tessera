#![doc = "Abstract persistence port for Tessera graph ingestion."]

mod error;
mod session;
pub mod testing;

pub use error::StoreError;
pub use session::{IngestionSession, IngestionStats};
pub use testing::MemorySession;
