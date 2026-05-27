use std::fmt;

#[derive(Debug)]
pub enum StoreError {
    Config(String),
    Ingestion(String),
}

impl fmt::Display for StoreError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Config(msg) => write!(f, "store configuration error: {msg}"),
            Self::Ingestion(msg) => write!(f, "ingestion error: {msg}"),
        }
    }
}

impl std::error::Error for StoreError {}
