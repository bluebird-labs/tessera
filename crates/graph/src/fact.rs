use std::collections::BTreeMap;

use serde::{Deserialize, Serialize};

use crate::enums::RegistryValue;
use crate::id::TesseraId;

/// Closed fact value union (spec §6.5).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum FactValue {
    String(String),
    Integer(i64),
    Boolean(bool),
    Bytes(Vec<u8>),
    Enum(RegistryValue),
    NodeRef(TesseraId),
    List(Vec<FactValue>),
    Map(BTreeMap<String, FactValue>),
}

impl<T: Into<RegistryValue>> From<T> for FactValue {
    fn from(v: T) -> Self {
        Self::Enum(v.into())
    }
}
