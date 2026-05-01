use std::io;
use std::path::PathBuf;
use std::process::ExitCode;

use anyhow::{Context, bail};
use tessera_scip::{
    LanguageOutcome, LanguageStatus, Reporter, RunOptions, detect_languages, run as run_indexers,
};

use crate::render::{Render, Styles};
use crate::term::Term;

/// Arguments to `tessera index`.
#[derive(Debug, clap::Args)]
pub(crate) struct IndexArgs {
    /// Path to the project directory to index.
    pub path: PathBuf,
    /// Directory in which to write the per-language `.scip` files.
    /// Defaults to `<path>/.tessera`.
    #[arg(long, short = 'o')]
    pub output_dir: Option<PathBuf>,
}

const DEFAULT_OUTPUT_SUBDIR: &str = ".tessera";

#[derive(Debug, serde::Serialize)]
pub(crate) struct IndexReport {
    pub project: PathBuf,
    pub output_dir: PathBuf,
    pub results: Vec<LanguageOutcome>,
}

impl Render for IndexReport {
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
            self.output_dir.display(),
            dim.render_reset(),
        )?;

        if self.results.is_empty() {
            writeln!(w, "  (no languages detected)")?;
            return Ok(());
        }

        for outcome in &self.results {
            let lang = outcome.language.as_str();
            match &outcome.status {
                LanguageStatus::Succeeded { output } => {
                    let s = styles.success;
                    writeln!(
                        w,
                        "  {}✓{} {} → {}{}{}",
                        s.render(),
                        s.render_reset(),
                        lang,
                        dim.render(),
                        output.display(),
                        dim.render_reset(),
                    )?;
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
                LanguageStatus::SkippedMoveFailed { error } => {
                    let s = styles.error;
                    writeln!(
                        w,
                        "  {}✗{} {}: failed to move output: {}",
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

    let output_dir_display = args
        .output_dir
        .clone()
        .unwrap_or_else(|| args.path.join(DEFAULT_OUTPUT_SUBDIR));
    let output_dir_arg = args
        .output_dir
        .unwrap_or_else(|| project.join(DEFAULT_OUTPUT_SUBDIR));
    std::fs::create_dir_all(&output_dir_arg)
        .with_context(|| format!("failed to create output dir: {}", output_dir_arg.display()))?;
    let output_dir = std::fs::canonicalize(&output_dir_arg)
        .with_context(|| format!("failed to resolve output dir: {}", output_dir_arg.display()))?;

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

    let mut reporter = TermReporter(term);
    let results = run_indexers(
        RunOptions {
            project: &project,
            output_dir: &output_dir,
            languages: &languages,
        },
        &mut reporter,
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
        output_dir: output_dir_display,
        results,
    };
    Ok((report, exit))
}

#[cfg(test)]
mod tests {
    use super::*;
    use tessera_scip::Language;

    fn report() -> IndexReport {
        IndexReport {
            project: PathBuf::from("/proj"),
            output_dir: PathBuf::from("/out"),
            results: vec![
                LanguageOutcome {
                    language: Language::Rust,
                    status: LanguageStatus::Succeeded {
                        output: PathBuf::from("/out/rust.scip"),
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
        assert!(out.contains("/out"));
        assert!(out.contains("rust"));
        assert!(out.contains("/out/rust.scip"));
        assert!(out.contains("scip-go"));
        assert!(out.contains("not on PATH"));
        assert!(out.contains("python"));
        assert!(out.contains("indexer exited 2"));
    }

    #[test]
    fn json_serialization_uses_kind_tag() {
        let r = report();
        let v = serde_json::to_value(&r).unwrap();
        let results = v.get("results").unwrap().as_array().unwrap();
        assert_eq!(results[0]["language"], "rust");
        assert_eq!(results[0]["status"]["kind"], "succeeded");
        assert_eq!(results[0]["status"]["output"], "/out/rust.scip");
        assert_eq!(results[1]["status"]["kind"], "skipped_binary_missing");
        assert_eq!(results[1]["status"]["binary"], "scip-go");
        assert_eq!(results[2]["status"]["kind"], "skipped_indexer_failed");
        assert_eq!(results[2]["status"]["exit_code"], 2);
    }
}
