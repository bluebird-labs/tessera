use std::collections::BTreeMap;
use std::io::{self, BufRead, BufReader};
use std::path::PathBuf;
use std::process::{Command, Stdio};

use anyhow::{Context, bail};
use serde::{Deserialize, Serialize};
use tessera_graph::{Bond, MosaicBuilder, Tessera};

use crate::render::{Render, Styles};

#[derive(Debug, clap::Args)]
pub(crate) struct IndexArgs {
    /// Project directory to index.
    #[arg(value_name = "PROJECT")]
    pub path: PathBuf,

    /// Corpus name (defaults to directory name).
    #[arg(long)]
    pub corpus: Option<String>,
}

#[derive(Debug, Serialize)]
pub(crate) struct IndexOutput {
    corpus: String,
    tile_count: usize,
    bond_count: usize,
    kind_counts: BTreeMap<String, usize>,
}

impl Render for IndexOutput {
    fn render_pretty(&self, w: &mut dyn io::Write, styles: &Styles) -> io::Result<()> {
        let heading = styles.heading;
        let key = styles.key;
        let dim = styles.dim;
        let success = styles.success;

        writeln!(
            w,
            "{heading}Indexed{heading:#} {success}{}{success:#}",
            self.corpus,
        )?;
        writeln!(w, "  {key}tiles{key:#}  {}", self.tile_count)?;
        writeln!(w, "  {key}bonds{key:#}  {}", self.bond_count)?;
        writeln!(w)?;
        for (kind, count) in &self.kind_counts {
            writeln!(w, "  {dim}{kind:>16}{dim:#}  {count}")?;
        }
        Ok(())
    }
}

pub(crate) fn run(args: IndexArgs) -> anyhow::Result<IndexOutput> {
    let project_root = args
        .path
        .canonicalize()
        .with_context(|| format!("cannot resolve project directory: {}", args.path.display()))?;

    let corpus_name = args
        .corpus
        .or_else(|| {
            project_root
                .file_name()
                .map(|n| n.to_string_lossy().into_owned())
        })
        .unwrap_or_else(|| "unknown".into());

    let extractor = find_extractor()?;

    let mut child = Command::new("npx")
        .args(["tsx", extractor.to_str().unwrap()])
        .arg(&project_root)
        .arg(&corpus_name)
        .stdout(Stdio::piped())
        .stderr(Stdio::inherit())
        .spawn()
        .context("failed to spawn TypeScript extractor")?;

    let stdout = child.stdout.take().unwrap();
    let reader = BufReader::new(stdout);

    let mut builder = MosaicBuilder::new();

    for line_result in reader.lines() {
        let line = line_result.context("reading extractor output")?;
        if line.is_empty() {
            continue;
        }

        let entry: NdjsonEntry =
            serde_json::from_str(&line).context("parsing extractor NDJSON line")?;

        match entry {
            NdjsonEntry::Tile(t) => {
                builder.add(t)?;
            }
            NdjsonEntry::Bond(b) => {
                builder.bond(b);
            }
        }
    }

    let status = child.wait().context("waiting for extractor")?;
    if !status.success() {
        bail!(
            "extractor exited with status {}",
            status.code().unwrap_or(-1)
        );
    }

    let mosaic = builder
        .build()
        .context("building mosaic from extractor output")?;

    let mut kind_counts: BTreeMap<String, usize> = BTreeMap::new();
    for tile in mosaic.tiles() {
        *kind_counts.entry(format!("{:?}", tile.kind)).or_default() += 1;
    }

    Ok(IndexOutput {
        corpus: corpus_name,
        tile_count: mosaic.tile_count(),
        bond_count: mosaic.bond_count(),
        kind_counts,
    })
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

    bail!("TypeScript extractor not found. Expected at <workspace>/extractors/ts/src/index.ts");
}

#[derive(Deserialize)]
#[serde(rename_all = "lowercase")]
enum NdjsonEntry {
    Tile(Tessera),
    Bond(Bond),
}
