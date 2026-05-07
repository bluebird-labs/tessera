use std::path::PathBuf;

use anyhow::bail;

/// Arguments to `tessera index`.
#[derive(Debug, clap::Args)]
pub(crate) struct IndexArgs {
    /// Project directory to index.
    #[arg(value_name = "PROJECT")]
    pub path: PathBuf,
}

pub(crate) fn run(_args: IndexArgs) -> anyhow::Result<()> {
    bail!("tessera index: not yet implemented");
}
