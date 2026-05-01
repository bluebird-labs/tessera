use clap::Parser;

use crate::commands::Command;
use crate::render::Format;

/// Top-level parser for the `tessera` binary. Subcommands live in
/// [`crate::commands`].
#[derive(Debug, Parser)]
#[command(
    name = "tessera",
    version,
    about = "Tessera — LLM-powered coding harness",
    propagate_version = true,
    arg_required_else_help = true,
)]
pub struct Cli {
    /// Output format for the command's result.
    #[arg(long, value_enum, global = true, default_value = "pretty")]
    pub format: Format,

    /// When to colorize output (overrides `NO_COLOR` / TTY detection).
    #[arg(long, value_enum, global = true, default_value = "auto")]
    pub color: ColorChoice,

    #[command(subcommand)]
    pub command: Command,
}

#[derive(Copy, Clone, Debug, Default, clap::ValueEnum)]
pub enum ColorChoice {
    #[default]
    Auto,
    Always,
    Never,
}

impl From<ColorChoice> for anstream::ColorChoice {
    fn from(c: ColorChoice) -> Self {
        match c {
            ColorChoice::Auto => anstream::ColorChoice::Auto,
            ColorChoice::Always => anstream::ColorChoice::Always,
            ColorChoice::Never => anstream::ColorChoice::Never,
        }
    }
}
