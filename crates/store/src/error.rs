use std::fmt;

#[derive(Debug)]
pub enum StoreError {
    Config(String),
    Http(reqwest::Error),
    Api { status: u16, body: String },
}

impl fmt::Display for StoreError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Config(msg) => write!(f, "store configuration error: {msg}"),
            Self::Http(err) => write!(f, "HTTP error: {err}"),
            Self::Api { status, body } => write!(f, "TerminusDB API error ({status}): {body}"),
        }
    }
}

impl std::error::Error for StoreError {
    fn source(&self) -> Option<&(dyn std::error::Error + 'static)> {
        match self {
            Self::Http(err) => Some(err),
            Self::Config(_) | Self::Api { .. } => None,
        }
    }
}

impl From<reqwest::Error> for StoreError {
    fn from(err: reqwest::Error) -> Self {
        Self::Http(err)
    }
}
