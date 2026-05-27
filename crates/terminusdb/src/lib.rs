#![doc = "TerminusDB adapter for Tessera graph ingestion."]

mod client;
mod config;
mod error;
pub mod mapping;
mod session;

pub use client::{ServerInfo, TerminusClient};
pub use config::TerminusConfig;
pub use error::TerminusError;
pub use session::{OpenMode, SessionConfig, TerminusSession};
