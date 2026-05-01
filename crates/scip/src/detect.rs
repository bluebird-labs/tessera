use std::collections::HashSet;
use std::ffi::OsString;
use std::io;
use std::path::Path;

use crate::language::Language;

/// Detect languages from root-level manifests in `project`.
///
/// Detection is non-recursive (RFC 0001 §6) — only direct children of
/// `project` are considered. Returned languages are in [`Language::ALL`]
/// order so reports are stable.
pub fn detect_languages(project: &Path) -> io::Result<Vec<Language>> {
    let mut filenames: HashSet<OsString> = HashSet::new();
    let mut has_py_file = false;

    for entry in std::fs::read_dir(project)? {
        let entry = entry?;
        let name = entry.file_name();
        if !has_py_file
            && entry.file_type().is_ok_and(|t| t.is_file())
            && entry.path().extension().is_some_and(|ext| ext == "py")
        {
            has_py_file = true;
        }
        filenames.insert(name);
    }

    let has = |s: &str| filenames.contains(std::ffi::OsStr::new(s));

    let mut out = Vec::new();
    for lang in Language::ALL {
        let detected = match lang {
            Language::Rust => has("Cargo.toml"),
            Language::Go => has("go.mod"),
            Language::TypeScript => has("tsconfig.json") || has("package.json"),
            Language::Python => {
                has("pyproject.toml") || has("setup.py") || has("requirements.txt") || has_py_file
            }
        };
        if detected {
            out.push(lang);
        }
    }
    Ok(out)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn touch(dir: &Path, name: &str) {
        std::fs::write(dir.join(name), b"").unwrap();
    }

    #[test]
    fn empty_dir_detects_nothing() {
        let dir = tempfile::tempdir().unwrap();
        assert!(detect_languages(dir.path()).unwrap().is_empty());
    }

    #[test]
    fn cargo_toml_detects_rust() {
        let dir = tempfile::tempdir().unwrap();
        touch(dir.path(), "Cargo.toml");
        assert_eq!(detect_languages(dir.path()).unwrap(), vec![Language::Rust]);
    }

    #[test]
    fn go_mod_detects_go() {
        let dir = tempfile::tempdir().unwrap();
        touch(dir.path(), "go.mod");
        assert_eq!(detect_languages(dir.path()).unwrap(), vec![Language::Go]);
    }

    #[test]
    fn tsconfig_or_package_json_detects_ts() {
        let a = tempfile::tempdir().unwrap();
        touch(a.path(), "tsconfig.json");
        assert_eq!(
            detect_languages(a.path()).unwrap(),
            vec![Language::TypeScript]
        );

        let b = tempfile::tempdir().unwrap();
        touch(b.path(), "package.json");
        assert_eq!(
            detect_languages(b.path()).unwrap(),
            vec![Language::TypeScript]
        );
    }

    #[test]
    fn python_signals_each_detect() {
        for marker in ["pyproject.toml", "setup.py", "requirements.txt", "main.py"] {
            let dir = tempfile::tempdir().unwrap();
            touch(dir.path(), marker);
            assert_eq!(
                detect_languages(dir.path()).unwrap(),
                vec![Language::Python],
                "marker {marker} should detect Python",
            );
        }
    }

    #[test]
    fn polyglot_returns_canonical_order() {
        let dir = tempfile::tempdir().unwrap();
        // Create in deliberately scrambled order to ensure output is sorted by Language::ALL.
        touch(dir.path(), "main.py");
        touch(dir.path(), "package.json");
        touch(dir.path(), "go.mod");
        touch(dir.path(), "Cargo.toml");
        assert_eq!(
            detect_languages(dir.path()).unwrap(),
            vec![
                Language::Rust,
                Language::Go,
                Language::TypeScript,
                Language::Python,
            ],
        );
    }

    #[test]
    fn subdirectory_manifests_are_ignored() {
        let dir = tempfile::tempdir().unwrap();
        let sub = dir.path().join("sub");
        std::fs::create_dir(&sub).unwrap();
        touch(&sub, "Cargo.toml");
        touch(&sub, "go.mod");
        assert!(detect_languages(dir.path()).unwrap().is_empty());
    }
}
