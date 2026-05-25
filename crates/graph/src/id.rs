use std::fmt;
use std::str::FromStr;

use serde::{Deserialize, Serialize};

use crate::error::{MosaicError, ParseEnumError};

/// Five-field structural identity for a tessera (spec §7.1).
#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
pub struct TesseraId {
    pub corpus: String,
    pub language: LanguageTag,
    pub module: String,
    pub scope: String,
    pub signature: String,
}

const CANONICAL_PREFIX: &str = "nodeid:v0:";

impl TesseraId {
    pub fn new(
        corpus: impl Into<String>,
        language: LanguageTag,
        module: impl Into<String>,
        scope: impl Into<String>,
        signature: impl Into<String>,
    ) -> Self {
        Self {
            corpus: corpus.into(),
            language,
            module: module.into(),
            scope: scope.into(),
            signature: signature.into(),
        }
    }

    /// Corpus tessera identity (§7.4).
    pub fn corpus(corpus: impl Into<String>) -> Self {
        Self::new(corpus, LanguageTag::Unspecified, "", "", "_")
    }

    /// File tessera identity (§7.4).
    pub fn file(corpus: impl Into<String>, path: &str) -> Self {
        Self::new(
            corpus,
            LanguageTag::Unspecified,
            "",
            "",
            format!("file:{path}"),
        )
    }

    /// Module tessera identity (§7.4).
    pub fn module(
        corpus: impl Into<String>,
        language: LanguageTag,
        module_path: impl Into<String>,
    ) -> Self {
        Self::new(corpus, language, module_path, "", "_")
    }

    /// Render the canonical string form (§7.3).
    pub fn to_canonical(&self) -> String {
        format!(
            "{CANONICAL_PREFIX}{}|{}|{}|{}|{}",
            percent_encode(&self.corpus),
            percent_encode(self.language.as_str()),
            percent_encode(&self.module),
            percent_encode(&self.scope),
            percent_encode(&self.signature),
        )
    }

    /// Parse a canonical string back into a `TesseraId` (§7.3).
    pub fn parse_canonical(s: &str) -> Result<Self, MosaicError> {
        let rest = s
            .strip_prefix(CANONICAL_PREFIX)
            .ok_or_else(|| MosaicError::InvalidId {
                reason: format!("missing prefix '{CANONICAL_PREFIX}'"),
            })?;

        let parts: Vec<&str> = rest.splitn(5, '|').collect();
        if parts.len() != 5 {
            return Err(MosaicError::InvalidId {
                reason: "expected exactly 5 pipe-separated fields".into(),
            });
        }

        let lang_str = percent_decode(parts[1])?;
        let language = lang_str
            .parse::<LanguageTag>()
            .map_err(|_| MosaicError::InvalidLanguageTag { tag: lang_str })?;

        Ok(Self {
            corpus: percent_decode(parts[0])?,
            language,
            module: percent_decode(parts[2])?,
            scope: percent_decode(parts[3])?,
            signature: percent_decode(parts[4])?,
        })
    }
}

impl fmt::Display for TesseraId {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(&self.to_canonical())
    }
}

/// Language tag for a tessera (spec §7.2).
///
/// Standard tags cover the v0.1 registry. Extension tags (`x-<name>`)
/// allow producers to represent languages not yet in the registry.
#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub enum LanguageTag {
    C,
    Cpp,
    CSharp,
    Go,
    Java,
    Js,
    Kotlin,
    Php,
    Py,
    Ruby,
    Rust,
    Scala,
    Swift,
    Ts,
    /// Cross-language or language-independent (`_`).
    Unspecified,
    /// Extension tag starting with `x-`.
    Extension(String),
}

impl LanguageTag {
    pub fn as_str(&self) -> &str {
        match self {
            Self::C => "c",
            Self::Cpp => "cpp",
            Self::CSharp => "csharp",
            Self::Go => "go",
            Self::Java => "java",
            Self::Js => "js",
            Self::Kotlin => "kotlin",
            Self::Php => "php",
            Self::Py => "py",
            Self::Ruby => "ruby",
            Self::Rust => "rust",
            Self::Scala => "scala",
            Self::Swift => "swift",
            Self::Ts => "ts",
            Self::Unspecified => "_",
            Self::Extension(s) => s,
        }
    }

    pub const fn is_standard(&self) -> bool {
        !matches!(self, Self::Extension(_))
    }
}

impl fmt::Display for LanguageTag {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(self.as_str())
    }
}

impl FromStr for LanguageTag {
    type Err = ParseEnumError;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "c" => Ok(Self::C),
            "cpp" => Ok(Self::Cpp),
            "csharp" => Ok(Self::CSharp),
            "go" => Ok(Self::Go),
            "java" => Ok(Self::Java),
            "js" => Ok(Self::Js),
            "kotlin" => Ok(Self::Kotlin),
            "php" => Ok(Self::Php),
            "py" => Ok(Self::Py),
            "ruby" => Ok(Self::Ruby),
            "rust" => Ok(Self::Rust),
            "scala" => Ok(Self::Scala),
            "swift" => Ok(Self::Swift),
            "ts" => Ok(Self::Ts),
            "_" => Ok(Self::Unspecified),
            ext if ext.starts_with("x-") && ext.len() > 2 => Ok(Self::Extension(ext.into())),
            _ => Err(ParseEnumError {
                type_name: "LanguageTag",
                value: s.into(),
            }),
        }
    }
}

impl Serialize for LanguageTag {
    fn serialize<S: serde::Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        serializer.serialize_str(self.as_str())
    }
}

impl<'de> Deserialize<'de> for LanguageTag {
    fn deserialize<D: serde::Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
        let s = String::deserialize(deserializer)?;
        s.parse().map_err(serde::de::Error::custom)
    }
}

// --- percent encoding (spec §7.3) ---

fn percent_encode(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    for ch in s.chars() {
        if ch.is_ascii_control() || ch == '|' || ch == '%' {
            let byte = u8::try_from(ch).expect("encoded chars are ASCII");
            push_percent_byte(&mut out, byte);
        } else {
            out.push(ch);
        }
    }
    out
}

fn push_percent_byte(out: &mut String, byte: u8) {
    const HEX: &[u8; 16] = b"0123456789ABCDEF";
    out.push('%');
    out.push(char::from(HEX[usize::from(byte >> 4)]));
    out.push(char::from(HEX[usize::from(byte & 0x0F)]));
}

fn percent_decode(s: &str) -> Result<String, MosaicError> {
    let mut out = String::with_capacity(s.len());
    let mut chars = s.chars();
    while let Some(ch) = chars.next() {
        if ch == '%' {
            let hi = chars.next().ok_or_else(|| MosaicError::InvalidId {
                reason: "truncated percent encoding".into(),
            })?;
            let lo = chars.next().ok_or_else(|| MosaicError::InvalidId {
                reason: "truncated percent encoding".into(),
            })?;
            let byte = decode_hex_pair(hi, lo).ok_or_else(|| MosaicError::InvalidId {
                reason: format!("invalid hex in percent encoding: %{hi}{lo}"),
            })?;
            out.push(char::from(byte));
        } else {
            out.push(ch);
        }
    }
    Ok(out)
}

fn decode_hex_pair(hi: char, lo: char) -> Option<u8> {
    let h = u8::try_from(hi.to_digit(16)?).ok()?;
    let l = u8::try_from(lo.to_digit(16)?).ok()?;
    Some((h << 4) | l)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn canonical_round_trip() {
        let id = TesseraId::new(
            "github.com/acme/app@abc123",
            LanguageTag::Rust,
            "app.server",
            "main",
            "handle_request",
        );
        let canonical = id.to_canonical();
        let parsed = TesseraId::parse_canonical(&canonical).unwrap();
        assert_eq!(id, parsed);
    }

    #[test]
    fn canonical_corpus() {
        let id = TesseraId::corpus("github.com/acme/app@abc123");
        let canonical = id.to_canonical();
        assert_eq!(canonical, "nodeid:v0:github.com/acme/app@abc123|_|||_");
        let parsed = TesseraId::parse_canonical(&canonical).unwrap();
        assert_eq!(id, parsed);
    }

    #[test]
    fn percent_encodes_pipe_and_control_chars() {
        let id = TesseraId::new(
            "corp|us",
            LanguageTag::Unspecified,
            "mod\nule",
            "",
            "sig%nature",
        );
        let canonical = id.to_canonical();
        assert!(canonical.contains("corp%7Cus"));
        assert!(canonical.contains("mod%0Aule"));
        assert!(canonical.contains("sig%25nature"));
        let parsed = TesseraId::parse_canonical(&canonical).unwrap();
        assert_eq!(id, parsed);
    }

    #[test]
    fn preserves_unicode() {
        let id = TesseraId::new("corp", LanguageTag::Unspecified, "mödule", "", "日本語");
        let canonical = id.to_canonical();
        assert!(canonical.contains("mödule"));
        assert!(canonical.contains("日本語"));
        let parsed = TesseraId::parse_canonical(&canonical).unwrap();
        assert_eq!(id, parsed);
    }

    #[test]
    fn parses_standard_language_tags() {
        assert_eq!("rust".parse::<LanguageTag>().unwrap(), LanguageTag::Rust);
        assert_eq!(
            "_".parse::<LanguageTag>().unwrap(),
            LanguageTag::Unspecified
        );
    }

    #[test]
    fn parses_extension_language_tags() {
        let tag: LanguageTag = "x-zig".parse().unwrap();
        assert_eq!(tag, LanguageTag::Extension("x-zig".into()));
        assert!(!tag.is_standard());
    }

    #[test]
    fn rejects_invalid_language_tags() {
        assert!("zig".parse::<LanguageTag>().is_err());
        assert!("x-".parse::<LanguageTag>().is_err());
    }

    #[test]
    fn round_trips_extension_tag_through_canonical() {
        let id = TesseraId::new(
            "corp",
            LanguageTag::Extension("x-zig".into()),
            "mod",
            "",
            "main",
        );
        let parsed = TesseraId::parse_canonical(&id.to_canonical()).unwrap();
        assert_eq!(id, parsed);
    }
}
