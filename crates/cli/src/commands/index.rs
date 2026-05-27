use std::collections::BTreeMap;
use std::io;
use std::path::PathBuf;

use serde::Serialize;
use tessera_indexer::{IndexOptions, index, index_stream};
use tessera_terminusdb::{OpenMode, TerminusClient, TerminusSession};

use crate::render::{Render, Styles};

#[derive(Debug, clap::Args)]
pub(crate) struct IndexArgs {
    /// Project directory to index.
    #[arg(value_name = "PROJECT")]
    pub path: PathBuf,

    /// Corpus name (defaults to directory name).
    #[arg(long)]
    pub corpus: Option<String>,

    /// Persist the indexed graph to `TerminusDB`.
    #[arg(long)]
    pub store: bool,
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

        if !self.kind_counts.is_empty() {
            writeln!(w)?;
            for (kind, count) in &self.kind_counts {
                writeln!(w, "  {dim}{kind:>16}{dim:#}  {count}")?;
            }
        }
        Ok(())
    }
}

pub(crate) fn run(args: IndexArgs) -> anyhow::Result<IndexOutput> {
    let mut opts = IndexOptions::new(&args.path);
    if let Some(name) = args.corpus {
        opts = opts.with_corpus_name(name);
    }

    if args.store {
        run_store(opts)
    } else {
        run_local(opts)
    }
}

fn run_local(opts: IndexOptions) -> anyhow::Result<IndexOutput> {
    let mosaic = index(&opts)?;

    let mut kind_counts: BTreeMap<String, usize> = BTreeMap::new();
    for tile in mosaic.tiles() {
        *kind_counts.entry(format!("{:?}", tile.kind)).or_default() += 1;
    }

    Ok(IndexOutput {
        corpus: opts.corpus_name,
        tile_count: mosaic.tile_count(),
        bond_count: mosaic.bond_count(),
        kind_counts,
    })
}

fn run_store(opts: IndexOptions) -> anyhow::Result<IndexOutput> {
    let mut stream = index_stream(&opts)?;

    let client = TerminusClient::from_env()?;
    let db_name: String = opts
        .corpus_name
        .chars()
        .map(|c| {
            if c.is_ascii_alphanumeric() {
                c.to_ascii_lowercase()
            } else {
                '_'
            }
        })
        .collect();

    let mut session = TerminusSession::open(client, "admin", &db_name, OpenMode::Replace)?;
    let stats = tessera_core::ingest(&mut stream, &mut session)?;
    stream.finish()?;

    Ok(IndexOutput {
        corpus: opts.corpus_name,
        tile_count: stats.tiles_written,
        bond_count: stats.bonds_written,
        kind_counts: BTreeMap::new(),
    })
}
