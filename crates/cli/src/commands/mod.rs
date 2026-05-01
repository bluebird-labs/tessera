use std::io::{self, Write};

use crate::cli::Cli;
use crate::render::{emit, Styles};

mod version;

#[derive(Debug, clap::Subcommand)]
pub enum Command {
    /// Print the running tessera version.
    Version,
}

pub fn run(cli: Cli) -> anyhow::Result<()> {
    let mut stdout = anstream::AutoStream::new(io::stdout().lock(), cli.color.into());
    let styles = Styles::default();

    match cli.command {
        Command::Version => {
            let value = version::run();
            emit(&value, cli.format, &mut stdout, &styles)?;
        }
    }

    stdout.flush()?;
    Ok(())
}
