use std::process::ExitCode;

use clap::Parser;

mod cli;
mod commands;
mod render;
mod term;

fn main() -> ExitCode {
    let parsed = cli::Cli::parse();
    match commands::run(parsed) {
        Ok(code) => code,
        Err(err) => {
            let mut t = term::Term::new();
            drop(t.error(format!("{err:#}")));
            ExitCode::FAILURE
        }
    }
}
