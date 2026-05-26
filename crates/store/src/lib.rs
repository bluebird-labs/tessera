#![doc = "TerminusDB-backed persistence layer for Tessera."]

mod client;
mod config;
mod error;

pub use client::{ServerInfo, TerminusClient};
pub use config::StoreConfig;
pub use error::StoreError;
