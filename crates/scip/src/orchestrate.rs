use std::io;
use std::path::Path;
use std::process::Command;

use serde::Serialize;

use crate::indexer::{self, IndexerSpec};
use crate::language::Language;

/// Inputs to a run. `project` must exist; canonicalization is the caller's
/// responsibility (the CLI does this).
#[derive(Copy, Clone, Debug)]
pub struct RunOptions<'a> {
    pub project: &'a Path,
    pub languages: &'a [Language],
}

/// Per-language ingestion totals returned by a [`Sink`].
///
/// Surfaced in the final report so users see what landed in the
/// database. The first five fields match the row count of the
/// corresponding table for this language. `unknown_field_messages`
/// reports forward-compat wire data the underlying decoder didn't
/// recognise — see [`Sink::ingest`] implementors for details.
#[derive(Copy, Clone, Debug, Default, Serialize)]
pub struct IngestStats {
    pub documents: u64,
    pub symbols: u64,
    pub occurrences: u64,
    pub relationships: u64,
    pub diagnostics: u64,
    /// Count of decoded protobuf messages that carried fields the
    /// `scip` crate version we depend on doesn't understand. Non-zero
    /// means the upstream indexer was built against a newer
    /// `scip.proto` than ours; the unknown wire bytes are not stored.
    pub unknown_field_messages: u64,
}

/// Why a [`Sink`] could not commit a language's output. The two variants
/// drive distinct [`LanguageStatus`] outcomes so the report can attribute
/// failure to the decode step or the storage step.
#[derive(Debug)]
pub enum SinkError {
    /// The `.scip` file did not decode as a SCIP `Index` proto, or the
    /// file could not be read from disk.
    Decode(String),
    /// The storage backend rejected the write (e.g. `SQLite` error).
    Ingest(String),
}

/// Storage-side consumer of indexer output.
///
/// The orchestrator hands the path to a freshly-written `index.scip` to
/// the sink, then deletes the file regardless of the sink's outcome
/// (closing RFC 0003 §5(g)'s filename-collision window).
pub trait Sink {
    fn ingest(&mut self, language: Language, scip_path: &Path) -> Result<IngestStats, SinkError>;
}

/// Outcome for a single language. Encoded as an externally-tagged enum
/// so JSON consumers can dispatch on `kind`.
#[derive(Clone, Debug, Serialize)]
#[serde(tag = "kind", rename_all = "snake_case")]
pub enum LanguageStatus {
    Succeeded {
        stats: IngestStats,
    },
    SkippedBinaryMissing {
        binary: String,
        install_hint: String,
    },
    SkippedIndexerFailed {
        exit_code: Option<i32>,
    },
    SkippedNoOutput,
    SkippedDecodeFailed {
        error: String,
    },
    SkippedIngestFailed {
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
/// mapping. See RFC 0003 §5.
pub fn run(
    opts: RunOptions<'_>,
    reporter: &mut dyn Reporter,
    sink: &mut dyn Sink,
) -> Vec<LanguageOutcome> {
    run_with(opts, reporter, sink, indexer::spec_for)
}

/// Internal pipeline parameterized by a spec resolver — exists so tests
/// can substitute fake binaries without touching real PATH.
pub(crate) fn run_with(
    opts: RunOptions<'_>,
    reporter: &mut dyn Reporter,
    sink: &mut dyn Sink,
    spec_for: impl Fn(Language) -> IndexerSpec,
) -> Vec<LanguageOutcome> {
    let mut outcomes = Vec::with_capacity(opts.languages.len());

    for &lang in opts.languages {
        let spec = spec_for(lang);
        let status = run_one(opts.project, lang, &spec, reporter, sink);
        outcomes.push(LanguageOutcome {
            language: lang,
            status,
        });
    }

    outcomes
}

fn run_one(
    project: &Path,
    lang: Language,
    spec: &IndexerSpec,
    reporter: &mut dyn Reporter,
    sink: &mut dyn Sink,
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

    let outcome = match sink.ingest(lang, &produced) {
        Ok(stats) => {
            if stats.unknown_field_messages > 0 {
                reporter.warn(&format!(
                    "{}: {} message(s) carried unknown SCIP fields (upstream indexer is \
                     newer than the `scip` crate this build uses); their unrecognised wire \
                     data was not stored",
                    lang.as_str(),
                    stats.unknown_field_messages,
                ));
            }
            LanguageStatus::Succeeded { stats }
        }
        Err(SinkError::Decode(error)) => {
            reporter.warn(&format!(
                "{}: failed to decode `{}`: {}",
                lang.as_str(),
                produced.display(),
                error,
            ));
            LanguageStatus::SkippedDecodeFailed { error }
        }
        Err(SinkError::Ingest(error)) => {
            reporter.warn(&format!(
                "{}: failed to ingest `{}`: {}",
                lang.as_str(),
                produced.display(),
                error,
            ));
            LanguageStatus::SkippedIngestFailed { error }
        }
    };

    drop(std::fs::remove_file(&produced));

    outcome
}

#[cfg(test)]
#[cfg(unix)]
mod tests {
    use std::ffi::OsString;
    use std::os::unix::fs::PermissionsExt;
    use std::path::PathBuf;

    use super::*;

    struct VecReporter(Vec<String>);
    impl Reporter for VecReporter {
        fn warn(&mut self, msg: &str) {
            self.0.push(msg.to_owned());
        }
    }

    /// Test sink that records each call's `(language, bytes-at-path)` and
    /// returns a configurable result on first call.
    struct RecordingSink {
        calls: Vec<(Language, Vec<u8>)>,
        result: Option<Result<IngestStats, SinkError>>,
    }

    impl RecordingSink {
        const fn new(result: Result<IngestStats, SinkError>) -> Self {
            Self {
                calls: Vec::new(),
                result: Some(result),
            }
        }
    }

    impl Sink for RecordingSink {
        fn ingest(
            &mut self,
            language: Language,
            scip_path: &Path,
        ) -> Result<IngestStats, SinkError> {
            let bytes = std::fs::read(scip_path).expect("test sink reads existing file");
            self.calls.push((language, bytes));
            self.result
                .take()
                .unwrap_or_else(|| Ok(IngestStats::default()))
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
        let mut reporter = VecReporter(Vec::new());
        let mut sink = RecordingSink::new(Ok(IngestStats::default()));
        let outcomes = run_with(
            RunOptions {
                project: project.path(),
                languages: &[Language::Rust],
            },
            &mut reporter,
            &mut sink,
            |_| spec_with("/nonexistent/tessera-test-binary-xyz", vec![], false),
        );
        assert!(matches!(
            outcomes[0].status,
            LanguageStatus::SkippedBinaryMissing { .. }
        ));
        assert!(reporter.0.iter().any(|m| m.contains("not found on PATH")));
        assert!(sink.calls.is_empty());
    }

    #[test]
    fn nonzero_exit_yields_indexer_failed() {
        let project = tempfile::tempdir().unwrap();
        let mut reporter = VecReporter(Vec::new());
        let mut sink = RecordingSink::new(Ok(IngestStats::default()));
        let outcomes = run_with(
            RunOptions {
                project: project.path(),
                languages: &[Language::Rust],
            },
            &mut reporter,
            &mut sink,
            |_| spec_with("/usr/bin/false", vec![], false),
        );
        assert!(matches!(
            outcomes[0].status,
            LanguageStatus::SkippedIndexerFailed { exit_code: Some(c) } if c != 0
        ));
        assert!(sink.calls.is_empty());
    }

    #[test]
    fn success_without_output_yields_no_output() {
        let project = tempfile::tempdir().unwrap();
        let mut reporter = VecReporter(Vec::new());
        let mut sink = RecordingSink::new(Ok(IngestStats::default()));
        let outcomes = run_with(
            RunOptions {
                project: project.path(),
                languages: &[Language::Rust],
            },
            &mut reporter,
            &mut sink,
            |_| spec_with("/usr/bin/true", vec![], false),
        );
        assert!(matches!(
            outcomes[0].status,
            LanguageStatus::SkippedNoOutput
        ));
        assert!(sink.calls.is_empty());
    }

    #[test]
    fn success_invokes_sink_and_clears_source() {
        let project = tempfile::tempdir().unwrap();
        let scripts = tempfile::tempdir().unwrap();
        let script = write_script(
            scripts.path(),
            "fake-indexer.sh",
            "#!/bin/sh\nprintf 'hi' > \"$1/index.scip\"\n",
        );
        let mut reporter = VecReporter(Vec::new());
        let mut sink = RecordingSink::new(Ok(IngestStats {
            documents: 1,
            symbols: 2,
            occurrences: 3,
            relationships: 4,
            diagnostics: 5,
            unknown_field_messages: 0,
        }));
        let outcomes = run_with(
            RunOptions {
                project: project.path(),
                languages: &[Language::Rust],
            },
            &mut reporter,
            &mut sink,
            move |_| spec_with(script.clone(), vec![], true),
        );

        match outcomes[0].status {
            LanguageStatus::Succeeded { stats } => {
                assert_eq!(stats.documents, 1);
                assert_eq!(stats.symbols, 2);
                assert_eq!(stats.occurrences, 3);
                assert_eq!(stats.relationships, 4);
                assert_eq!(stats.diagnostics, 5);
                assert_eq!(stats.unknown_field_messages, 0);
            }
            ref other => panic!("expected Succeeded, got {other:?}"),
        }
        assert_eq!(sink.calls.len(), 1);
        assert_eq!(sink.calls[0].0, Language::Rust);
        assert_eq!(sink.calls[0].1, b"hi");
        assert!(!project.path().join("index.scip").exists());
    }

    #[test]
    fn sink_decode_error_yields_skipped_decode_failed() {
        let project = tempfile::tempdir().unwrap();
        let scripts = tempfile::tempdir().unwrap();
        let script = write_script(
            scripts.path(),
            "fake-indexer.sh",
            "#!/bin/sh\nprintf 'garbage' > \"$1/index.scip\"\n",
        );
        let mut reporter = VecReporter(Vec::new());
        let mut sink = RecordingSink::new(Err(SinkError::Decode("not a SCIP Index".into())));
        let outcomes = run_with(
            RunOptions {
                project: project.path(),
                languages: &[Language::Rust],
            },
            &mut reporter,
            &mut sink,
            move |_| spec_with(script.clone(), vec![], true),
        );

        match &outcomes[0].status {
            LanguageStatus::SkippedDecodeFailed { error } => {
                assert!(error.contains("not a SCIP Index"));
            }
            other => panic!("expected SkippedDecodeFailed, got {other:?}"),
        }
        assert!(reporter.0.iter().any(|m| m.contains("failed to decode")));
        assert!(!project.path().join("index.scip").exists());
    }

    #[test]
    fn sink_ingest_error_yields_skipped_ingest_failed() {
        let project = tempfile::tempdir().unwrap();
        let scripts = tempfile::tempdir().unwrap();
        let script = write_script(
            scripts.path(),
            "fake-indexer.sh",
            "#!/bin/sh\nprintf 'bytes' > \"$1/index.scip\"\n",
        );
        let mut reporter = VecReporter(Vec::new());
        let mut sink = RecordingSink::new(Err(SinkError::Ingest("DB write failed".into())));
        let outcomes = run_with(
            RunOptions {
                project: project.path(),
                languages: &[Language::Rust],
            },
            &mut reporter,
            &mut sink,
            move |_| spec_with(script.clone(), vec![], true),
        );

        match &outcomes[0].status {
            LanguageStatus::SkippedIngestFailed { error } => {
                assert!(error.contains("DB write failed"));
            }
            other => panic!("expected SkippedIngestFailed, got {other:?}"),
        }
        assert!(reporter.0.iter().any(|m| m.contains("failed to ingest")));
        assert!(!project.path().join("index.scip").exists());
    }
}
