use std::collections::BTreeMap;

use crate::error::MosaicError;
use crate::id::TesseraId;
use crate::kind::TesseraKind;
use crate::mosaic::{Bond, Mosaic, Tessera};

/// Assembles tesserae and bonds into a validated [`Mosaic`].
#[derive(Debug, Default)]
pub struct MosaicBuilder {
    tiles: BTreeMap<TesseraId, Tessera>,
    bonds: Vec<Bond>,
}

impl MosaicBuilder {
    pub fn new() -> Self {
        Self::default()
    }

    /// Add a tessera. Errors if a tessera with the same ID already exists.
    pub fn add(&mut self, tessera: Tessera) -> Result<&mut Self, MosaicError> {
        if self.tiles.contains_key(&tessera.id) {
            return Err(MosaicError::DuplicateTessera {
                id: tessera.id.to_string(),
            });
        }
        self.tiles.insert(tessera.id.clone(), tessera);
        Ok(self)
    }

    /// Add a bond between two tesserae.
    pub fn bond(&mut self, bond: Bond) -> &mut Self {
        self.bonds.push(bond);
        self
    }

    /// Consume the builder and produce a [`Mosaic`].
    ///
    /// Validates that at least one `Corpus` tessera exists and that all bond
    /// endpoints reference known tesserae.
    pub fn build(self) -> Result<Mosaic, MosaicError> {
        let has_corpus = self.tiles.values().any(|t| t.kind == TesseraKind::Corpus);
        if !has_corpus {
            return Err(MosaicError::MissingCorpus);
        }

        for bond in &self.bonds {
            if !self.tiles.contains_key(&bond.source) {
                return Err(MosaicError::UnknownTessera {
                    id: bond.source.to_string(),
                });
            }
            if !self.tiles.contains_key(&bond.target) {
                return Err(MosaicError::UnknownTessera {
                    id: bond.target.to_string(),
                });
            }
        }

        Ok(Mosaic::from_parts(self.tiles, self.bonds))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::bond::BondKind;
    use crate::enums::{ConformanceProfile, ModuleKind};
    use crate::id::{LanguageTag, TesseraId};

    #[test]
    fn build_minimal_mosaic() {
        let corpus_id = TesseraId::corpus("github.com/acme/app@abc123");
        let mut builder = MosaicBuilder::new();
        builder
            .add(Tessera::corpus(
                corpus_id,
                "acme/app",
                &[ConformanceProfile::Core],
            ))
            .unwrap();
        let mosaic = builder.build().unwrap();
        assert_eq!(mosaic.tile_count(), 1);
        assert_eq!(mosaic.bond_count(), 0);
    }

    #[test]
    fn rejects_missing_corpus() {
        let id = TesseraId::new("corp", LanguageTag::Rust, "app", "", "main");
        let mut builder = MosaicBuilder::new();
        builder
            .add(Tessera::new(id, TesseraKind::Function))
            .unwrap();
        let err = builder.build().unwrap_err();
        assert!(matches!(err, MosaicError::MissingCorpus));
    }

    #[test]
    fn rejects_duplicate_tessera() {
        let id = TesseraId::corpus("corp");
        let mut builder = MosaicBuilder::new();
        builder
            .add(Tessera::corpus(
                id.clone(),
                "a",
                &[ConformanceProfile::Core],
            ))
            .unwrap();
        let err = builder
            .add(Tessera::corpus(id, "b", &[ConformanceProfile::Core]))
            .unwrap_err();
        assert!(matches!(err, MosaicError::DuplicateTessera { .. }));
    }

    #[test]
    fn rejects_bond_to_unknown_tessera() {
        let corpus_id = TesseraId::corpus("corp");
        let unknown_id = TesseraId::new("corp", LanguageTag::Rust, "app", "", "missing");
        let mut builder = MosaicBuilder::new();
        builder
            .add(Tessera::corpus(
                corpus_id.clone(),
                "test",
                &[ConformanceProfile::Core],
            ))
            .unwrap();
        builder.bond(Bond::new(BondKind::ChildOf, unknown_id, corpus_id));
        let err = builder.build().unwrap_err();
        assert!(matches!(err, MosaicError::UnknownTessera { .. }));
    }

    /// Builds the representative graph from spec §19 (the `read_name` example).
    #[test]
    fn spec_section_19_example() {
        let corpus = "github.com/acme/app@abc123";

        let corpus_id = TesseraId::corpus(corpus);
        let module_id = TesseraId::module(corpus, LanguageTag::Rust, "app");
        let file_id = TesseraId::file(corpus, "src/lib.rs");
        let fn_id = TesseraId::new(corpus, LanguageTag::Rust, "app", "", "read_name");
        let param_id = TesseraId::new(corpus, LanguageTag::Rust, "app", "read_name", "path");

        let mut builder = MosaicBuilder::new();

        builder
            .add(Tessera::corpus(
                corpus_id.clone(),
                "acme/app",
                &[
                    ConformanceProfile::Core,
                    ConformanceProfile::Ops,
                    ConformanceProfile::Effects,
                ],
            ))
            .unwrap();
        builder
            .add(Tessera::module(module_id.clone(), ModuleKind::CrateMod))
            .unwrap();
        builder
            .add(Tessera::file(file_id.clone(), "src/lib.rs"))
            .unwrap();
        builder
            .add(Tessera::new(fn_id.clone(), TesseraKind::Function))
            .unwrap();
        builder
            .add(Tessera::new(param_id.clone(), TesseraKind::Variable))
            .unwrap();

        builder.bond(Bond::new(BondKind::ChildOf, module_id.clone(), corpus_id));
        builder.bond(Bond::new(BondKind::ChildOf, fn_id.clone(), module_id));
        builder.bond(Bond::new(BondKind::ChildOf, param_id, fn_id.clone()));
        builder.bond(Bond::new(BondKind::DefinedIn, fn_id, file_id));

        let mosaic = builder.build().unwrap();
        assert_eq!(mosaic.tile_count(), 5);
        assert_eq!(mosaic.bond_count(), 4);
    }
}
