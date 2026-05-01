use std::io::{self, Write};

use crate::render::Styles;

/// Stderr writer with style helpers. Wraps stderr in `anstream::AutoStream`
/// so ANSI escapes are stripped automatically when stderr isn't a TTY or
/// when `NO_COLOR` / `CLICOLOR` ask for it.
pub struct Term {
    out: anstream::AutoStream<io::Stderr>,
    styles: Styles,
}

#[allow(dead_code)]
impl Term {
    pub fn new() -> Self {
        Self {
            out: anstream::AutoStream::auto(io::stderr()),
            styles: Styles::default(),
        }
    }

    pub fn info(&mut self, msg: impl AsRef<str>) -> io::Result<()> {
        let s = self.styles.dim;
        writeln!(self.out, "{}info{}: {}", s.render(), s.render_reset(), msg.as_ref())
    }

    pub fn warn(&mut self, msg: impl AsRef<str>) -> io::Result<()> {
        let s = self.styles.warn;
        writeln!(self.out, "{}warning{}: {}", s.render(), s.render_reset(), msg.as_ref())
    }

    pub fn error(&mut self, msg: impl AsRef<str>) -> io::Result<()> {
        let s = self.styles.error;
        writeln!(self.out, "{}error{}: {}", s.render(), s.render_reset(), msg.as_ref())
    }
}

impl Default for Term {
    fn default() -> Self {
        Self::new()
    }
}
