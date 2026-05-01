use std::ffi::OsString;

use crate::language::Language;

/// Per-language indexer command, owned so tests can substitute fake
/// binaries. Construction is cheap and only happens up to four times per
/// run, so allocation cost is irrelevant.
#[derive(Clone, Debug)]
pub(crate) struct IndexerSpec {
    /// Binary name (resolved via PATH) or absolute path.
    pub binary: OsString,
    /// Literal arguments preceding the project path.
    pub args: Vec<OsString>,
    /// If true, the project path is appended as the final argument.
    /// `rust-analyzer scip <path>` and `scip-python index <path>` need this;
    /// `scip-go` and `scip-typescript index` use the working directory.
    pub append_path: bool,
    /// Human-readable install instruction surfaced when the binary is
    /// missing from PATH.
    pub install_hint: String,
}

/// Default spec for `lang` — the canonical invocation per RFC 0001 §7.
pub(crate) fn spec_for(lang: Language) -> IndexerSpec {
    match lang {
        Language::Rust => IndexerSpec {
            binary: "rust-analyzer".into(),
            args: vec!["scip".into()],
            append_path: true,
            install_hint: "rustup component add rust-analyzer".into(),
        },
        Language::Go => IndexerSpec {
            binary: "scip-go".into(),
            args: vec![],
            append_path: false,
            install_hint: "go install github.com/scip-code/scip-go/cmd/scip-go@latest".into(),
        },
        Language::TypeScript => IndexerSpec {
            binary: "scip-typescript".into(),
            args: vec!["index".into()],
            append_path: false,
            install_hint: "npm install -g @sourcegraph/scip-typescript".into(),
        },
        Language::Python => IndexerSpec {
            binary: "scip-python".into(),
            args: vec!["index".into()],
            append_path: true,
            install_hint: "npm install -g @sourcegraph/scip-python".into(),
        },
    }
}
