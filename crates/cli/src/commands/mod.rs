use std::io::{self, Write};
use std::process::ExitCode;

use crate::cli::Cli;
use crate::render::{Styles, emit};
use crate::term::Term;

mod index;
mod version;

#[derive(Debug, clap::Subcommand)]
pub(crate) enum Command {
    /// Print the running tessera version.
    Version,
    /// Produce SCIP index files for a project directory.
    Index(index::IndexArgs),
}

pub(crate) fn run(cli: Cli) -> anyhow::Result<ExitCode> {
    let mut stdout = anstream::AutoStream::new(io::stdout().lock(), cli.color.into());
    let styles = Styles::default();
    let mut term = Term::new();

    let exit = match cli.command {
        Command::Version => {
            let value = version::run();
            emit(&value, cli.format, &mut stdout, &styles)?;
            ExitCode::SUCCESS
        }
        Command::Index(args) => {
            let (report, exit) = index::run(args, &mut term)?;
            emit(&report, cli.format, &mut stdout, &styles)?;
            exit
        }
    };

    stdout.flush()?;
    Ok(exit)
}
