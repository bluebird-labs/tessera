use std::io;

#[derive(Copy, Clone, Debug, Default, clap::ValueEnum)]
pub(crate) enum Format {
    #[default]
    Pretty,
    Json,
}

/// Style tokens for pretty-mode output. The CLI's writer is typically
/// wrapped in `anstream::AutoStream`, which strips ANSI escapes when
/// stdout is not a TTY or when `NO_COLOR` / `CLICOLOR` ask for it. Render
/// impls therefore write styled output unconditionally.
#[allow(dead_code)]
#[derive(Debug)]
pub(crate) struct Styles {
    pub heading: anstyle::Style,
    pub key: anstyle::Style,
    pub dim: anstyle::Style,
    pub error: anstyle::Style,
    pub warn: anstyle::Style,
    pub success: anstyle::Style,
}

impl Default for Styles {
    fn default() -> Self {
        use anstyle::{AnsiColor, Style};
        Self {
            heading: Style::new().bold(),
            key: Style::new().fg_color(Some(AnsiColor::Cyan.into())),
            dim: Style::new().dimmed(),
            error: Style::new().fg_color(Some(AnsiColor::Red.into())).bold(),
            warn: Style::new().fg_color(Some(AnsiColor::Yellow.into())),
            success: Style::new().fg_color(Some(AnsiColor::Green.into())),
        }
    }
}

pub(crate) trait Render: serde::Serialize {
    fn render_pretty(&self, w: &mut dyn io::Write, styles: &Styles) -> io::Result<()>;
}

pub(crate) fn emit<T: Render>(
    value: &T,
    format: Format,
    w: &mut dyn io::Write,
    styles: &Styles,
) -> anyhow::Result<()> {
    match format {
        Format::Pretty => value.render_pretty(w, styles)?,
        Format::Json => {
            serde_json::to_writer_pretty(&mut *w, value)?;
            writeln!(w)?;
        }
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[derive(serde::Serialize)]
    struct Greeting<'a> {
        hello: &'a str,
    }

    impl Render for Greeting<'_> {
        fn render_pretty(&self, w: &mut dyn io::Write, styles: &Styles) -> io::Result<()> {
            let h = styles.heading;
            writeln!(w, "{}hello{}, {}", h.render(), h.render_reset(), self.hello)
        }
    }

    #[test]
    fn pretty_writes_via_render_trait() {
        let greeting = Greeting { hello: "world" };
        let mut buf: Vec<u8> = Vec::new();
        emit(&greeting, Format::Pretty, &mut buf, &Styles::default()).unwrap();
        let out = String::from_utf8(buf).unwrap();
        assert!(out.contains("hello"));
        assert!(out.ends_with("world\n"));
    }

    #[test]
    fn json_writes_serialized_form() {
        let greeting = Greeting { hello: "world" };
        let mut buf: Vec<u8> = Vec::new();
        emit(&greeting, Format::Json, &mut buf, &Styles::default()).unwrap();
        let out = String::from_utf8(buf).unwrap();
        assert!(out.contains("\"hello\": \"world\""));
        assert!(out.ends_with('\n'));
    }

    #[test]
    fn anstream_strip_removes_ansi_in_pretty_mode() {
        let greeting = Greeting { hello: "world" };
        let mut sink = anstream::StripStream::new(Vec::new());
        emit(&greeting, Format::Pretty, &mut sink, &Styles::default()).unwrap();
        let out = String::from_utf8(sink.into_inner()).unwrap();
        assert_eq!(out, "hello, world\n");
    }
}
