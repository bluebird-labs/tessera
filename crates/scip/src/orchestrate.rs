use std::io;
use std::path::{Path, PathBuf};
use std::process::Command;

use serde::Serialize;

use crate::indexer::{self, IndexerSpec};
use crate::language::Language;

/// Inputs to a run. All paths must exist; canonicalization is the caller's
/// responsibility (the CLI does this).
#[derive(Copy, Clone, Debug)]
pub struct RunOptions<'a> {
    pub project: &'a Path,
    pub output_dir: &'a Path,
    pub languages: &'a [Language],
}

/// Outcome for a single language. Encoded as an externally-tagged enum
/// so JSON consumers can dispatch on `kind`.
#[derive(Clone, Debug, Serialize)]
#[serde(tag = "kind", rename_all = "snake_case")]
pub enum LanguageStatus {
    Succeeded {
        output: PathBuf,
    },
    SkippedBinaryMissing {
        binary: String,
        install_hint: String,
    },
    SkippedIndexerFailed {
        exit_code: Option<i32>,
    },
    SkippedNoOutput,
    SkippedMoveFailed {
        error: String,
    },
}

#[derive(Clone, Debug, Serialize)]
pub struct LanguageOutcome {
    pub language: Language,
    pub status: LanguageStatus,
}

/// Sink for warning messages emitted during a run.
pub trait Reporter {
    fn warn(&mut self, msg: &str);
}

/// Run the indexer pipeline using the canonical [`indexer::spec_for`]
/// mapping. See RFC 0001 §5.
pub fn run(opts: RunOptions<'_>, reporter: &mut dyn Reporter) -> Vec<LanguageOutcome> {
    run_with(opts, reporter, indexer::spec_for)
}

/// Internal pipeline parameterized by a spec resolver — exists so tests
/// can substitute fake binaries without touching real PATH.
pub(crate) fn run_with(
    opts: RunOptions<'_>,
    reporter: &mut dyn Reporter,
    spec_for: impl Fn(Language) -> IndexerSpec,
) -> Vec<LanguageOutcome> {
    let mut outcomes = Vec::with_capacity(opts.languages.len());

    for &lang in opts.languages {
        let spec = spec_for(lang);
        let status = run_one(opts.project, opts.output_dir, lang, &spec, reporter);
        outcomes.push(LanguageOutcome {
            language: lang,
            status,
        });
    }

    outcomes
}

fn run_one(
    project: &Path,
    output_dir: &Path,
    lang: Language,
    spec: &IndexerSpec,
    reporter: &mut dyn Reporter,
) -> LanguageStatus {
    let mut cmd = Command::new(&spec.binary);
    cmd.args(&spec.args);
    if spec.append_path {
        cmd.arg(project);
    }
    cmd.current_dir(project);

    match cmd.status() {
        Err(e) if e.kind() == io::ErrorKind::NotFound => {
            let binary = spec.binary.to_string_lossy().into_owned();
            reporter.warn(&format!(
                "{}: indexer `{}` not found on PATH; install with: {}",
                lang.as_str(),
                binary,
                spec.install_hint,
            ));
            return LanguageStatus::SkippedBinaryMissing {
                binary,
                install_hint: spec.install_hint.clone(),
            };
        }
        Err(e) => {
            reporter.warn(&format!(
                "{}: failed to launch `{}`: {}",
                lang.as_str(),
                spec.binary.to_string_lossy(),
                e,
            ));
            return LanguageStatus::SkippedIndexerFailed { exit_code: None };
        }
        Ok(status) if !status.success() => {
            let code = status.code();
            let code_str = code.map_or_else(|| "signal".to_owned(), |c| c.to_string());
            reporter.warn(&format!(
                "{}: indexer `{}` exited {}",
                lang.as_str(),
                spec.binary.to_string_lossy(),
                code_str,
            ));
            return LanguageStatus::SkippedIndexerFailed { exit_code: code };
        }
        Ok(_) => {}
    }

    let produced = project.join("index.scip");
    if !produced.exists() {
        reporter.warn(&format!(
            "{}: indexer `{}` reported success but produced no `{}`; skipping",
            lang.as_str(),
            spec.binary.to_string_lossy(),
            produced.display(),
        ));
        return LanguageStatus::SkippedNoOutput;
    }

    let dest = output_dir.join(lang.output_filename());
    if let Err(e) = move_file(&produced, &dest) {
        reporter.warn(&format!(
            "{}: failed to move {} to {}: {}",
            lang.as_str(),
            produced.display(),
            dest.display(),
            e,
        ));
        // Best-effort cleanup so the leftover doesn't leak into the next
        // indexer's run as a stale `index.scip`.
        drop(std::fs::remove_file(&produced));
        return LanguageStatus::SkippedMoveFailed {
            error: e.to_string(),
        };
    }

    LanguageStatus::Succeeded { output: dest }
}

fn move_file(from: &Path, to: &Path) -> io::Result<()> {
    if std::fs::rename(from, to).is_ok() {
        return Ok(());
    }
    std::fs::copy(from, to)?;
    std::fs::remove_file(from)?;
    Ok(())
}

#[cfg(test)]
#[cfg(unix)]
mod tests {
    use std::ffi::OsString;
    use std::os::unix::fs::PermissionsExt;

    use super::*;

    struct VecReporter(Vec<String>);
    impl Reporter for VecReporter {
        fn warn(&mut self, msg: &str) {
            self.0.push(msg.to_owned());
        }
    }

    fn write_script(dir: &Path, name: &str, body: &str) -> PathBuf {
        let path = dir.join(name);
        std::fs::write(&path, body).unwrap();
        let mut perms = std::fs::metadata(&path).unwrap().permissions();
        perms.set_mode(0o755);
        std::fs::set_permissions(&path, perms).unwrap();
        path
    }

    fn spec_with(
        binary: impl Into<OsString>,
        args: Vec<OsString>,
        append_path: bool,
    ) -> IndexerSpec {
        IndexerSpec {
            binary: binary.into(),
            args,
            append_path,
            install_hint: "noop".into(),
        }
    }

    #[test]
    fn binary_missing_yields_skipped() {
        let project = tempfile::tempdir().unwrap();
        let out = tempfile::tempdir().unwrap();
        let mut reporter = VecReporter(Vec::new());
        let outcomes = run_with(
            RunOptions {
                project: project.path(),
                output_dir: out.path(),
                languages: &[Language::Rust],
            },
            &mut reporter,
            |_| spec_with("/nonexistent/tessera-test-binary-xyz", vec![], false),
        );
        assert!(matches!(
            outcomes[0].status,
            LanguageStatus::SkippedBinaryMissing { .. }
        ));
        assert!(reporter.0.iter().any(|m| m.contains("not found on PATH")));
    }

    #[test]
    fn nonzero_exit_yields_indexer_failed() {
        let project = tempfile::tempdir().unwrap();
        let out = tempfile::tempdir().unwrap();
        let mut reporter = VecReporter(Vec::new());
        let outcomes = run_with(
            RunOptions {
                project: project.path(),
                output_dir: out.path(),
                languages: &[Language::Rust],
            },
            &mut reporter,
            |_| spec_with("/usr/bin/false", vec![], false),
        );
        assert!(matches!(
            outcomes[0].status,
            LanguageStatus::SkippedIndexerFailed { exit_code: Some(c) } if c != 0
        ));
    }

    #[test]
    fn success_without_output_yields_no_output() {
        let project = tempfile::tempdir().unwrap();
        let out = tempfile::tempdir().unwrap();
        let mut reporter = VecReporter(Vec::new());
        let outcomes = run_with(
            RunOptions {
                project: project.path(),
                output_dir: out.path(),
                languages: &[Language::Rust],
            },
            &mut reporter,
            |_| spec_with("/usr/bin/true", vec![], false),
        );
        assert!(matches!(
            outcomes[0].status,
            LanguageStatus::SkippedNoOutput
        ));
    }

    #[test]
    fn success_moves_output_and_clears_source() {
        let project = tempfile::tempdir().unwrap();
        let out = tempfile::tempdir().unwrap();
        let scripts = tempfile::tempdir().unwrap();
        let script = write_script(
            scripts.path(),
            "fake-indexer.sh",
            "#!/bin/sh\nprintf 'hi' > \"$1/index.scip\"\n",
        );
        let mut reporter = VecReporter(Vec::new());
        let outcomes = run_with(
            RunOptions {
                project: project.path(),
                output_dir: out.path(),
                languages: &[Language::Rust],
            },
            &mut reporter,
            move |_| spec_with(script.clone(), vec![], true),
        );

        match &outcomes[0].status {
            LanguageStatus::Succeeded { output } => {
                assert_eq!(output, &out.path().join("rust.scip"));
                assert_eq!(std::fs::read(output).unwrap(), b"hi");
            }
            other => panic!("expected Succeeded, got {other:?}"),
        }
        assert!(!project.path().join("index.scip").exists());
    }
}
