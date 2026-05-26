use url::Url;

use crate::error::StoreError;

const DEFAULT_HOST: &str = "localhost";
const DEFAULT_PORT: u16 = 6363;
const DEFAULT_USER: &str = "admin";

#[derive(Debug, Clone)]
pub struct StoreConfig {
    pub base_url: Url,
    pub user: String,
    pub password: String,
}

impl StoreConfig {
    pub fn from_env() -> Result<Self, StoreError> {
        let host = std::env::var("TERMINUSDB_HOST").unwrap_or_else(|_| DEFAULT_HOST.to_owned());
        let port: u16 = std::env::var("TERMINUSDB_PORT")
            .unwrap_or_else(|_| DEFAULT_PORT.to_string())
            .parse()
            .map_err(|_| StoreError::Config("TERMINUSDB_PORT must be a valid u16".into()))?;
        let user =
            std::env::var("TERMINUSDB_USER").unwrap_or_else(|_| DEFAULT_USER.to_owned());
        let password = std::env::var("TERMINUSDB_ADMIN_PASS")
            .map_err(|_| StoreError::Config("TERMINUSDB_ADMIN_PASS must be set".into()))?;

        let base_url = Url::parse(&format!("http://{host}:{port}"))
            .map_err(|e| StoreError::Config(format!("invalid base URL: {e}")))?;

        Ok(Self {
            base_url,
            user,
            password,
        })
    }

    #[must_use]
    pub const fn new(base_url: Url, user: String, password: String) -> Self {
        Self {
            base_url,
            user,
            password,
        }
    }
}
