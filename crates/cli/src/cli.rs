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
    arg_required_else_help = true
)]
pub(crate) struct Cli {
    /// Output format for the command's result.
    #[arg(long, value_enum, global = true, default_value = "pretty")]
    pub(crate) format: Format,

    /// When to colorize output (overrides `NO_COLOR` / TTY detection).
    #[arg(long, value_enum, global = true, default_value = "auto")]
    pub(crate) color: ColorChoice,

    #[command(subcommand)]
    pub(crate) command: Command,
}

#[derive(Copy, Clone, Debug, Default, clap::ValueEnum)]
pub(crate) enum ColorChoice {
    #[default]
    Auto,
    Always,
    Never,
}

impl From<ColorChoice> for anstream::ColorChoice {
    fn from(c: ColorChoice) -> Self {
        match c {
            ColorChoice::Auto => Self::Auto,
            ColorChoice::Always => Self::Always,
            ColorChoice::Never => Self::Never,
        }
    }
}
