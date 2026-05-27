use std::io::{BufRead, BufReader};
use std::path::PathBuf;
use std::process::{Child, ChildStdout, Command, Stdio};

use anyhow::{Context, bail};
use tessera_graph::{GraphEntry, Mosaic, MosaicBuilder};

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

pub struct ExtractorStream {
    child: Child,
    lines: std::io::Lines<BufReader<ChildStdout>>,
}

impl std::fmt::Debug for ExtractorStream {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("ExtractorStream")
            .field("child_id", &self.child.id())
            .finish_non_exhaustive()
    }
}

impl ExtractorStream {
    pub fn finish(mut self) -> anyhow::Result<()> {
        drop(self.lines);
        let status = self.child.wait().context("waiting for extractor")?;
        if !status.success() {
            bail!(
                "extractor exited with status {}",
                status.code().unwrap_or(-1)
            );
        }
        Ok(())
    }
}

impl Iterator for ExtractorStream {
    type Item = anyhow::Result<GraphEntry>;

    fn next(&mut self) -> Option<Self::Item> {
        loop {
            match self.lines.next()? {
                Err(e) => {
                    return Some(Err(
                        anyhow::Error::new(e).context("reading extractor output")
                    ));
                }
                Ok(line) if line.is_empty() => continue,
                Ok(line) => {
                    return Some(
                        serde_json::from_str::<GraphEntry>(&line)
                            .context("parsing extractor NDJSON line"),
                    );
                }
            }
        }
    }
}

pub fn index_stream(opts: &IndexOptions) -> anyhow::Result<ExtractorStream> {
    let project_root = opts.project_root.canonicalize().with_context(|| {
        format!(
            "cannot resolve project directory: {}",
            opts.project_root.display()
        )
    })?;

    let extractor = find_extractor()?;
    let tsx = find_tsx(&extractor)?;

    let mut child = Command::new(&tsx)
        .arg(&extractor)
        .arg(&project_root)
        .arg(&opts.corpus_name)
        .stdout(Stdio::piped())
        .stderr(Stdio::inherit())
        .spawn()
        .with_context(|| format!("failed to spawn tsx at {}", tsx.display()))?;

    let stdout = child.stdout.take().expect("stdout was piped");
    let reader = BufReader::new(stdout);
    let lines = reader.lines();

    Ok(ExtractorStream { child, lines })
}

pub fn index(opts: &IndexOptions) -> anyhow::Result<Mosaic> {
    let mut stream = index_stream(opts)?;
    let mut builder = MosaicBuilder::new();

    for entry in &mut stream {
        match entry? {
            GraphEntry::Tile(t) => {
                builder.add(t)?;
            }
            GraphEntry::Bond(b) => {
                builder.bond(b);
            }
        }
    }

    stream.finish()?;

    builder
        .build()
        .context("building mosaic from extractor output")
}

fn find_tsx(extractor_entry: &std::path::Path) -> anyhow::Result<PathBuf> {
    if let Some(extractor_root) = extractor_entry.parent().and_then(|p| p.parent()) {
        let local = extractor_root.join("node_modules/.bin/tsx");
        if local.exists() {
            return Ok(local);
        }
    }

    if let Ok(output) = Command::new("which").arg("tsx").output() {
        if output.status.success() {
            let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
            if !path.is_empty() {
                return Ok(PathBuf::from(path));
            }
        }
    }

    bail!("tsx not found. Install it in extractors/ts/ (pnpm install) or globally.");
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
