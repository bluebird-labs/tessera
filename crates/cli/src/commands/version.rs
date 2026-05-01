use std::io;

use crate::render::{Render, Styles};

#[derive(serde::Serialize)]
pub struct Version {
    pub version: &'static str,
}

impl Render for Version {
    fn render_pretty(&self, w: &mut dyn io::Write, styles: &Styles) -> io::Result<()> {
        let h = styles.heading;
        writeln!(
            w,
            "{}tessera{} {}",
            h.render(),
            h.render_reset(),
            self.version
        )
    }
}

pub fn run() -> Version {
    Version {
        version: env!("CARGO_PKG_VERSION"),
    }
}
