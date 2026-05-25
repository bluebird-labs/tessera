use thiserror::Error;

#[derive(Debug, Error)]
pub enum MosaicError {
    #[error("invalid tessera ID: {reason}")]
    InvalidId { reason: String },

    #[error("invalid language tag: {tag}")]
    InvalidLanguageTag { tag: String },

    #[error("duplicate tessera: {id}")]
    DuplicateTessera { id: String },

    #[error("bond references unknown tessera: {id}")]
    UnknownTessera { id: String },

    #[error("mosaic has no root Corpus tessera")]
    MissingCorpus,
}

#[derive(Debug, Clone, Error)]
#[error("unknown {type_name} value: {value}")]
pub struct ParseEnumError {
    pub type_name: &'static str,
    pub value: String,
}
