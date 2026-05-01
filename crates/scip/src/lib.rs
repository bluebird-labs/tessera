mod detect;
mod indexer;
mod language;
mod orchestrate;

pub use detect::detect_languages;
pub use language::Language;
pub use orchestrate::{LanguageOutcome, LanguageStatus, Reporter, RunOptions, run};
