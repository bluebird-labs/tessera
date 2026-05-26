use std::io::BufRead;

use anyhow::Context;
use serde::Deserialize;
use tessera_graph::{Bond, Mosaic, MosaicBuilder, Tessera};

#[derive(Deserialize)]
#[serde(rename_all = "lowercase")]
enum Entry {
    Tile(Tessera),
    Bond(Bond),
}

pub(crate) fn read_mosaic(reader: impl BufRead) -> anyhow::Result<Mosaic> {
    let mut builder = MosaicBuilder::new();

    for line_result in reader.lines() {
        let line = line_result.context("reading extractor output")?;
        if line.is_empty() {
            continue;
        }

        let entry: Entry = serde_json::from_str(&line).context("parsing extractor NDJSON line")?;

        match entry {
            Entry::Tile(t) => {
                builder.add(t)?;
            }
            Entry::Bond(b) => {
                builder.bond(b);
            }
        }
    }

    builder
        .build()
        .context("building mosaic from extractor output")
}
