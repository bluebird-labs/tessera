use std::io;
use std::path::PathBuf;
use std::process::ExitCode;

use anyhow::{Context, bail};
use tessera_scip::{
    LanguageOutcome, LanguageStatus, MirrorDb, Reporter, RunOptions, detect_languages,
    run as run_indexers,
};

use crate::render::{Render, Styles};
use crate::term::Term;

/// Arguments to `tessera index`.
#[derive(Debug, clap::Args)]
pub(crate) struct IndexArgs {
    /// Project directory to index. Detected language manifests
    /// (`Cargo.toml`, `go.mod`, `package.json`, etc.) drive which
    /// SCIP indexers run.
    #[arg(value_name = "PROJECT")]
    pub path: PathBuf,
    /// Path to the `SQLite` database file to write.
    /// Defaults to `<path>/.tessera/index.db`.
    #[arg(long, short = 'o')]
    pub output: Option<PathBuf>,
}

const DEFAULT_OUTPUT_SUBDIR: &str = ".tessera";
const DEFAULT_OUTPUT_FILENAME: &str = "index.db";

#[derive(Debug, serde::Serialize)]
pub(crate) struct IndexReport {
    pub project: PathBuf,
    pub output: PathBuf,
    pub results: Vec<LanguageOutcome>,
}

impl Render for IndexReport {
    #[allow(clippy::too_many_lines)]
    fn render_pretty(&self, w: &mut dyn io::Write, styles: &Styles) -> io::Result<()> {
        let h = styles.heading;
        let dim = styles.dim;
        writeln!(
            w,
            "{}tessera index{} {}{}{}",
            h.render(),
            h.render_reset(),
            dim.render(),
            self.project.display(),
            dim.render_reset(),
        )?;
        writeln!(
            w,
            "  {}output{}: {}{}{}",
            styles.key.render(),
            styles.key.render_reset(),
            dim.render(),
            self.output.display(),
            dim.render_reset(),
        )?;

        if self.results.is_empty() {
            writeln!(w, "  (no languages detected)")?;
            return Ok(());
        }

        for outcome in &self.results {
            let lang = outcome.language.as_str();
            match &outcome.status {
                LanguageStatus::Succeeded { stats } => {
                    let s = styles.success;
                    writeln!(
                        w,
                        "  {}✓{} {}: docs={} symbols={} occurrences={} relationships={} diagnostics={}",
                        s.render(),
                        s.render_reset(),
                        lang,
                        stats.documents,
                        stats.symbols,
                        stats.occurrences,
                        stats.relationships,
                        stats.diagnostics,
                    )?;
                    if stats.unknown_field_messages > 0 {
                        let warn = styles.warn;
                        writeln!(
                            w,
                            "      {}!{} {} message(s) carried unknown SCIP fields \
                             (upstream indexer is newer than tessera's `scip` crate; \
                             unrecognised wire data was not stored)",
                            warn.render(),
                            warn.render_reset(),
                            stats.unknown_field_messages,
                        )?;
                    }
                }
                LanguageStatus::SkippedBinaryMissing {
                    binary,
                    install_hint,
                } => {
                    let s = styles.warn;
                    writeln!(
                        w,
                        "  {}-{} {}: skipped — `{}` not on PATH (install: {})",
                        s.render(),
                        s.render_reset(),
                        lang,
                        binary,
                        install_hint,
                    )?;
                }
                LanguageStatus::SkippedIndexerFailed { exit_code } => {
                    let s = styles.error;
                    let code = exit_code.map_or_else(|| "signal".to_owned(), |c| c.to_string());
                    writeln!(
                        w,
                        "  {}✗{} {}: indexer exited {}",
                        s.render(),
                        s.render_reset(),
                        lang,
                        code,
                    )?;
                }
                LanguageStatus::SkippedNoOutput => {
                    let s = styles.warn;
                    writeln!(
                        w,
                        "  {}-{} {}: skipped — indexer produced no `index.scip`",
                        s.render(),
                        s.render_reset(),
                        lang,
                    )?;
                }
                LanguageStatus::SkippedDecodeFailed { error } => {
                    let s = styles.error;
                    writeln!(
                        w,
                        "  {}✗{} {}: failed to decode index.scip: {}",
                        s.render(),
                        s.render_reset(),
                        lang,
                        error,
                    )?;
                }
                LanguageStatus::SkippedIngestFailed { error } => {
                    let s = styles.error;
                    writeln!(
                        w,
                        "  {}✗{} {}: ingestion failed: {}",
                        s.render(),
                        s.render_reset(),
                        lang,
                        error,
                    )?;
                }
            }
        }
        Ok(())
    }
}

struct TermReporter<'a>(&'a mut Term);

impl Reporter for TermReporter<'_> {
    fn warn(&mut self, msg: &str) {
        drop(self.0.warn(msg));
    }
}

pub(crate) fn run(args: IndexArgs, term: &mut Term) -> anyhow::Result<(IndexReport, ExitCode)> {
    let project_display = args.path.clone();
    let project = std::fs::canonicalize(&args.path)
        .with_context(|| format!("invalid project path: {}", args.path.display()))?;
    if !project.is_dir() {
        bail!("not a directory: {}", args.path.display());
    }

    // Detect languages BEFORE touching the output path. RFC 0003 §5
    // sketches the order the other way around; we invert so that the
    // "no manifests" precondition failure doesn't leave an empty DB on
    // disk. The §9 leftover-DB semantics still apply for the
    // "all languages skipped" case (the DB is created below before the
    // sink runs).
    let languages = detect_languages(&project)
        .with_context(|| format!("failed to read {}", project.display()))?;
    if languages.is_empty() {
        bail!(
            "no language manifests detected at {}; expected one of: \
             Cargo.toml, go.mod, tsconfig.json, package.json, \
             pyproject.toml, setup.py, requirements.txt, or any *.py file",
            args.path.display(),
        );
    }

    let output_display = args.output.clone().unwrap_or_else(|| {
        args.path
            .join(DEFAULT_OUTPUT_SUBDIR)
            .join(DEFAULT_OUTPUT_FILENAME)
    });
    let output = args.output.unwrap_or_else(|| {
        project
            .join(DEFAULT_OUTPUT_SUBDIR)
            .join(DEFAULT_OUTPUT_FILENAME)
    });

    let mut db = MirrorDb::create(&output)
        .with_context(|| format!("failed to create database at {}", output.display()))?;

    let mut reporter = TermReporter(term);
    let results = run_indexers(
        RunOptions {
            project: &project,
            languages: &languages,
        },
        &mut reporter,
        &mut db,
    );

    let exit = if results
        .iter()
        .any(|o| matches!(o.status, LanguageStatus::Succeeded { .. }))
    {
        ExitCode::SUCCESS
    } else {
        ExitCode::FAILURE
    };

    let report = IndexReport {
        project: project_display,
        output: output_display,
        results,
    };
    Ok((report, exit))
}

#[cfg(test)]
mod tests {
    use super::*;
    use tessera_scip::{IngestStats, Language};

    fn report() -> IndexReport {
        IndexReport {
            project: PathBuf::from("/proj"),
            output: PathBuf::from("/proj/.tessera/index.db"),
            results: vec![
                LanguageOutcome {
                    language: Language::Rust,
                    status: LanguageStatus::Succeeded {
                        stats: IngestStats {
                            documents: 42,
                            symbols: 380,
                            occurrences: 4218,
                            relationships: 17,
                            diagnostics: 3,
                            unknown_field_messages: 5,
                        },
                    },
                },
                LanguageOutcome {
                    language: Language::Go,
                    status: LanguageStatus::SkippedBinaryMissing {
                        binary: "scip-go".into(),
                        install_hint: "go install ...".into(),
                    },
                },
                LanguageOutcome {
                    language: Language::Python,
                    status: LanguageStatus::SkippedIndexerFailed { exit_code: Some(2) },
                },
                LanguageOutcome {
                    language: Language::TypeScript,
                    status: LanguageStatus::SkippedDecodeFailed {
                        error: "truncated proto".into(),
                    },
                },
            ],
        }
    }

    #[test]
    fn pretty_render_includes_each_outcome() {
        let r = report();
        let mut sink = anstream::StripStream::new(Vec::new());
        r.render_pretty(&mut sink, &Styles::default()).unwrap();
        let out = String::from_utf8(sink.into_inner()).unwrap();
        assert!(out.contains("/proj"));
        assert!(out.contains("/proj/.tessera/index.db"));
        assert!(out.contains("rust"));
        assert!(out.contains("docs=42"));
        assert!(out.contains("symbols=380"));
        assert!(out.contains("occurrences=4218"));
        assert!(out.contains("relationships=17"));
        assert!(out.contains("diagnostics=3"));
        assert!(out.contains("5 message(s) carried unknown SCIP fields"));
        assert!(out.contains("scip-go"));
        assert!(out.contains("not on PATH"));
        assert!(out.contains("python"));
        assert!(out.contains("indexer exited 2"));
        assert!(out.contains("typescript"));
        assert!(out.contains("failed to decode index.scip"));
        assert!(out.contains("truncated proto"));
    }

    #[test]
    fn json_serialization_uses_kind_tag() {
        let r = report();
        let v = serde_json::to_value(&r).unwrap();
        assert_eq!(v["output"], "/proj/.tessera/index.db");
        let results = v.get("results").unwrap().as_array().unwrap();
        assert_eq!(results[0]["language"], "rust");
        assert_eq!(results[0]["status"]["kind"], "succeeded");
        assert_eq!(results[0]["status"]["stats"]["documents"], 42);
        assert_eq!(results[0]["status"]["stats"]["symbols"], 380);
        assert_eq!(results[0]["status"]["stats"]["occurrences"], 4218);
        assert_eq!(results[0]["status"]["stats"]["relationships"], 17);
        assert_eq!(results[0]["status"]["stats"]["diagnostics"], 3);
        assert_eq!(results[0]["status"]["stats"]["unknown_field_messages"], 5);
        assert_eq!(results[1]["status"]["kind"], "skipped_binary_missing");
        assert_eq!(results[1]["status"]["binary"], "scip-go");
        assert_eq!(results[2]["status"]["kind"], "skipped_indexer_failed");
        assert_eq!(results[2]["status"]["exit_code"], 2);
        assert_eq!(results[3]["status"]["kind"], "skipped_decode_failed");
        assert_eq!(results[3]["status"]["error"], "truncated proto");
    }
}
