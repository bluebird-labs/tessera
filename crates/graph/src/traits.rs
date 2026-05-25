use crate::mosaic::Mosaic;

/// Software that emits a canonical graph (spec §2).
pub trait Producer {
    type Error: std::error::Error;

    fn produce(&self) -> Result<Mosaic, Self::Error>;
}

/// Software that reads, validates, or transforms a canonical graph (spec §2).
pub trait Consumer {
    type Error: std::error::Error;

    fn consume(&self, mosaic: &Mosaic) -> Result<(), Self::Error>;
}
