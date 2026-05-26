use reqwest::Client;
use serde::Serialize;
use serde::de::DeserializeOwned;
use url::Url;

use crate::config::StoreConfig;
use crate::error::StoreError;

#[derive(Debug, Clone)]
pub struct TerminusClient {
    http: Client,
    base_url: Url,
    user: String,
    password: String,
}

#[derive(Debug, Clone, serde::Deserialize)]
pub struct ServerInfo {
    #[serde(rename = "@type")]
    pub ty: String,
    pub authority: Option<String>,
    pub storage: Option<serde_json::Value>,
}

impl TerminusClient {
    pub fn new(config: &StoreConfig) -> Result<Self, StoreError> {
        let http = Client::builder().build()?;
        Ok(Self {
            http,
            base_url: config.base_url.clone(),
            user: config.user.clone(),
            password: config.password.clone(),
        })
    }

    pub fn from_env() -> Result<Self, StoreError> {
        let config = StoreConfig::from_env()?;
        Self::new(&config)
    }

    fn api_url(&self, path: &str) -> Url {
        let mut url = self.base_url.clone();
        url.set_path(&format!("api/{path}"));
        url
    }

    pub async fn info(&self) -> Result<ServerInfo, StoreError> {
        self.get("info").await
    }

    pub async fn create_database(
        &self,
        org: &str,
        db: &str,
        label: &str,
    ) -> Result<serde_json::Value, StoreError> {
        let body = serde_json::json!({
            "label": label,
            "comment": "",
            "schema": true,
        });
        self.post(&format!("db/{org}/{db}"), &body).await
    }

    pub async fn delete_database(
        &self,
        org: &str,
        db: &str,
    ) -> Result<serde_json::Value, StoreError> {
        self.delete(&format!("db/{org}/{db}")).await
    }

    pub async fn list_databases(&self) -> Result<serde_json::Value, StoreError> {
        self.get("db").await
    }

    pub async fn get_documents<T: DeserializeOwned>(&self, path: &str) -> Result<T, StoreError> {
        self.get(&format!("document/{path}")).await
    }

    pub async fn insert_documents(
        &self,
        path: &str,
        docs: &(impl Serialize + Sync),
    ) -> Result<serde_json::Value, StoreError> {
        self.post(&format!("document/{path}"), docs).await
    }

    pub async fn replace_documents(
        &self,
        path: &str,
        docs: &(impl Serialize + Sync),
    ) -> Result<serde_json::Value, StoreError> {
        self.put(&format!("document/{path}"), docs).await
    }

    pub async fn delete_documents(&self, path: &str) -> Result<serde_json::Value, StoreError> {
        self.delete(&format!("document/{path}")).await
    }

    pub async fn get_schema(&self, path: &str) -> Result<serde_json::Value, StoreError> {
        self.get(&format!("schema/{path}")).await
    }

    async fn get<T: DeserializeOwned>(&self, path: &str) -> Result<T, StoreError> {
        let resp = self
            .http
            .get(self.api_url(path))
            .basic_auth(&self.user, Some(&self.password))
            .send()
            .await?;

        Self::handle_response(resp).await
    }

    async fn post<T: DeserializeOwned>(
        &self,
        path: &str,
        body: &(impl Serialize + Sync),
    ) -> Result<T, StoreError> {
        let resp = self
            .http
            .post(self.api_url(path))
            .basic_auth(&self.user, Some(&self.password))
            .json(body)
            .send()
            .await?;

        Self::handle_response(resp).await
    }

    async fn put<T: DeserializeOwned>(
        &self,
        path: &str,
        body: &(impl Serialize + Sync),
    ) -> Result<T, StoreError> {
        let resp = self
            .http
            .put(self.api_url(path))
            .basic_auth(&self.user, Some(&self.password))
            .json(body)
            .send()
            .await?;

        Self::handle_response(resp).await
    }

    async fn delete<T: DeserializeOwned>(&self, path: &str) -> Result<T, StoreError> {
        let resp = self
            .http
            .delete(self.api_url(path))
            .basic_auth(&self.user, Some(&self.password))
            .send()
            .await?;

        Self::handle_response(resp).await
    }

    async fn handle_response<T: DeserializeOwned>(
        resp: reqwest::Response,
    ) -> Result<T, StoreError> {
        let status = resp.status();
        if status.is_success() {
            Ok(resp.json().await?)
        } else {
            let body = resp.text().await.unwrap_or_default();
            Err(StoreError::Api {
                status: status.as_u16(),
                body,
            })
        }
    }
}
