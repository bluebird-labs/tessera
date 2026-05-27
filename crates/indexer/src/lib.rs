#![doc = "Project indexer: discovers and runs language extractors,\n\
    assembles the NDJSON output into a validated [`Mosaic`]."]

mod extract;
mod ndjson;

pub use extract::{ExtractorStream, IndexOptions, index, index_stream};
pub use ndjson::{read_entries, read_mosaic};
