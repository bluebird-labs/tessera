use std::io::BufReader;
use std::path::PathBuf;
use std::process::{Command, Stdio};

use anyhow::{Context, bail};
use tessera_graph::Mosaic;

use crate::ndjson;

#[derive(Debug)]
pub struct IndexOptions {
    pub project_root: PathBuf,
    pub corpus_name: String,
}

impl IndexOptions {
    pub fn new(project_root: impl Into<PathBuf>) -> Self {
        let root: PathBuf = project_root.into();
        let name = root
            .file_name()
            .map_or_else(|| "unknown".into(), |n| n.to_string_lossy().into_owned());
        Self {
            project_root: root,
            corpus_name: name,
        }
    }

    #[must_use]
    pub fn with_corpus_name(mut self, name: impl Into<String>) -> Self {
        self.corpus_name = name.into();
        self
    }
}

pub fn index(opts: &IndexOptions) -> anyhow::Result<Mosaic> {
    let project_root = opts.project_root.canonicalize().with_context(|| {
        format!(
            "cannot resolve project directory: {}",
            opts.project_root.display()
        )
    })?;

    let extractor = find_extractor()?;

    let mut child = Command::new("npx")
        .args(["tsx", &extractor.to_string_lossy()])
        .arg(&project_root)
        .arg(&opts.corpus_name)
        .stdout(Stdio::piped())
        .stderr(Stdio::inherit())
        .spawn()
        .context("failed to spawn TypeScript extractor")?;

    let stdout = child.stdout.take().expect("stdout was piped");
    let reader = BufReader::new(stdout);

    let mosaic = ndjson::read_mosaic(reader)?;

    let status = child.wait().context("waiting for extractor")?;
    if !status.success() {
        bail!(
            "extractor exited with status {}",
            status.code().unwrap_or(-1)
        );
    }

    Ok(mosaic)
}

fn find_extractor() -> anyhow::Result<PathBuf> {
    let mut dir = std::env::current_dir()?;
    loop {
        let candidate = dir.join("extractors/ts/src/index.ts");
        if candidate.exists() {
            return Ok(candidate);
        }
        if dir.join("Cargo.toml").exists() && dir.join("extractors").exists() {
            break;
        }
        if !dir.pop() {
            break;
        }
    }

    // Also check relative to the executable location.
    if let Ok(exe) = std::env::current_exe() {
        if let Some(exe_dir) = exe.parent() {
            for ancestor in exe_dir.ancestors() {
                let candidate = ancestor.join("extractors/ts/src/index.ts");
                if candidate.exists() {
                    return Ok(candidate);
                }
            }
        }
    }

    bail!("TypeScript extractor not found. Expected at <workspace>/extractors/ts/src/index.ts");
}
