use serde::Serialize;

/// Languages Tessera can index in v1 — see RFC 0001 §6/§7.
#[derive(Copy, Clone, Debug, PartialEq, Eq, Hash, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum Language {
    Rust,
    Go,
    TypeScript,
    Python,
}

impl Language {
    /// Canonical iteration order. Reports list languages in this order so
    /// output is stable regardless of detection order.
    pub const ALL: [Self; 4] = [Self::Rust, Self::Go, Self::TypeScript, Self::Python];

    #[must_use]
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Rust => "rust",
            Self::Go => "go",
            Self::TypeScript => "typescript",
            Self::Python => "python",
        }
    }

    /// Filename Tessera writes per RFC 0001 §8.
    #[must_use]
    pub const fn output_filename(self) -> &'static str {
        match self {
            Self::Rust => "rust.scip",
            Self::Go => "go.scip",
            Self::TypeScript => "typescript.scip",
            Self::Python => "python.scip",
        }
    }
}
