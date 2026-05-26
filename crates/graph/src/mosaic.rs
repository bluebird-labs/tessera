use std::collections::BTreeMap;

use serde::{Deserialize, Serialize};

use crate::bond::BondKind;
use crate::enums::{ConformanceProfile, ModuleKind};
use crate::fact::FactValue;
use crate::fact_keys;
use crate::id::TesseraId;
use crate::kind::TesseraKind;

/// A canonical graph — an assembled mosaic of tesserae and bonds (spec §6.1).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Mosaic {
    #[serde(
        serialize_with = "tiles_ser::serialize",
        deserialize_with = "tiles_ser::deserialize"
    )]
    tiles: BTreeMap<TesseraId, Tessera>,
    bonds: Vec<Bond>,
}

mod tiles_ser {
    use super::{BTreeMap, Deserialize, Tessera, TesseraId};
    use serde::Serializer;
    use serde::ser::SerializeSeq;

    pub(super) fn serialize<S: Serializer>(
        tiles: &BTreeMap<TesseraId, Tessera>,
        s: S,
    ) -> Result<S::Ok, S::Error> {
        let mut seq = s.serialize_seq(Some(tiles.len()))?;
        for tile in tiles.values() {
            seq.serialize_element(tile)?;
        }
        seq.end()
    }

    pub(super) fn deserialize<'de, D: serde::Deserializer<'de>>(
        d: D,
    ) -> Result<BTreeMap<TesseraId, Tessera>, D::Error> {
        let vec = Vec::<Tessera>::deserialize(d)?;
        Ok(vec.into_iter().map(|t| (t.id.clone(), t)).collect())
    }
}

/// A single tile in the mosaic (spec §6.2).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Tessera {
    pub id: TesseraId,
    pub kind: TesseraKind,
    pub facts: BTreeMap<String, FactValue>,
}

/// A typed relationship between two tesserae (spec §6.3).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Bond {
    pub kind: BondKind,
    pub source: TesseraId,
    pub target: TesseraId,
    pub ordinal: Option<u32>,
    pub facts: BTreeMap<String, FactValue>,
}

// --- Mosaic ---

impl Mosaic {
    pub(crate) const fn from_parts(tiles: BTreeMap<TesseraId, Tessera>, bonds: Vec<Bond>) -> Self {
        Self { tiles, bonds }
    }

    pub fn tile(&self, id: &TesseraId) -> Option<&Tessera> {
        self.tiles.get(id)
    }

    pub fn tiles(&self) -> impl Iterator<Item = &Tessera> {
        self.tiles.values()
    }

    pub fn tile_count(&self) -> usize {
        self.tiles.len()
    }

    pub fn bonds(&self) -> &[Bond] {
        &self.bonds
    }

    pub fn bond_count(&self) -> usize {
        self.bonds.len()
    }

    pub fn bonds_from<'a>(&'a self, source: &'a TesseraId) -> impl Iterator<Item = &'a Bond> {
        self.bonds.iter().filter(move |b| &b.source == source)
    }

    pub fn bonds_to<'a>(&'a self, target: &'a TesseraId) -> impl Iterator<Item = &'a Bond> {
        self.bonds.iter().filter(move |b| &b.target == target)
    }

    pub fn corpus_tiles(&self) -> impl Iterator<Item = &Tessera> {
        self.tiles
            .values()
            .filter(|t| t.kind == TesseraKind::Corpus)
    }
}

// --- Tessera ---

impl Tessera {
    pub const fn new(id: TesseraId, kind: TesseraKind) -> Self {
        Self {
            id,
            kind,
            facts: BTreeMap::new(),
        }
    }

    #[must_use]
    pub fn with_fact(mut self, key: impl Into<String>, value: FactValue) -> Self {
        self.facts.insert(key.into(), value);
        self
    }

    /// Create a `Corpus` tessera with required facts (spec §15.2).
    pub fn corpus(id: TesseraId, name: &str, profiles: &[ConformanceProfile]) -> Self {
        Self::new(id, TesseraKind::Corpus)
            .with_fact(fact_keys::SCHEMA_VERSION, FactValue::String("0.1.0".into()))
            .with_fact(fact_keys::CORPUS_NAME, FactValue::String(name.into()))
            .with_fact(
                fact_keys::CONFORMANCE_PROFILES,
                FactValue::List(profiles.iter().copied().map(FactValue::from).collect()),
            )
    }

    /// Create a `File` tessera with path fact (spec §13).
    pub fn file(id: TesseraId, path: &str) -> Self {
        Self::new(id, TesseraKind::File)
            .with_fact(fact_keys::FILE_PATH, FactValue::String(path.into()))
    }

    /// Create a `Module` tessera with kind fact (spec §13).
    pub fn module(id: TesseraId, kind: ModuleKind) -> Self {
        Self::new(id, TesseraKind::Module).with_fact(fact_keys::MODULE_KIND, FactValue::from(kind))
    }

    /// Create an `Anchor` tessera with required byte-range facts (spec §8).
    pub fn anchor(id: TesseraId, file: &str, byte_start: i64, byte_end: i64) -> Self {
        Self::new(id, TesseraKind::Anchor)
            .with_fact(fact_keys::ANCHOR_FILE, FactValue::String(file.into()))
            .with_fact(fact_keys::ANCHOR_BYTE_START, FactValue::Integer(byte_start))
            .with_fact(fact_keys::ANCHOR_BYTE_END, FactValue::Integer(byte_end))
    }
}

// --- Bond ---

impl Bond {
    pub const fn new(kind: BondKind, source: TesseraId, target: TesseraId) -> Self {
        Self {
            kind,
            source,
            target,
            ordinal: None,
            facts: BTreeMap::new(),
        }
    }

    #[must_use]
    pub const fn with_ordinal(mut self, ordinal: u32) -> Self {
        self.ordinal = Some(ordinal);
        self
    }

    #[must_use]
    pub fn with_fact(mut self, key: impl Into<String>, value: FactValue) -> Self {
        self.facts.insert(key.into(), value);
        self
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::build::MosaicBuilder;
    use crate::enums::{ConformanceProfile, ModuleKind};
    use crate::id::{LanguageTag, TesseraId};

    fn accessor_mosaic() -> Mosaic {
        let corpus_id = TesseraId::corpus("corp");
        let file_id = TesseraId::file("corp", "src/main.rs");
        let mod_id = TesseraId::module("corp", LanguageTag::Rust, "app");
        let fn_id = TesseraId::new("corp", LanguageTag::Rust, "app", "", "main");

        let mut builder = MosaicBuilder::new();
        builder
            .add(Tessera::corpus(
                corpus_id.clone(),
                "test",
                &[ConformanceProfile::Core],
            ))
            .unwrap();
        builder
            .add(Tessera::file(file_id.clone(), "src/main.rs"))
            .unwrap();
        builder
            .add(Tessera::module(mod_id.clone(), ModuleKind::CrateMod))
            .unwrap();
        builder
            .add(Tessera::new(fn_id.clone(), TesseraKind::Function))
            .unwrap();

        builder.bond(Bond::new(BondKind::ChildOf, mod_id.clone(), corpus_id));
        builder.bond(Bond::new(BondKind::ChildOf, fn_id, mod_id));
        builder.bond(
            Bond::new(BondKind::DefinedIn, file_id.clone(), file_id)
                .with_ordinal(0)
                .with_fact("note", FactValue::String("self-ref".into())),
        );

        builder.build().unwrap()
    }

    fn json_mosaic() -> Mosaic {
        let corpus = "github.com/pinojs/pino@v9.0.0";
        let corpus_id = TesseraId::corpus(corpus);
        let module_id = TesseraId::module(corpus, LanguageTag::Js, "pino");
        let file_id = TesseraId::file(corpus, "pino.js");
        let fn_id = TesseraId::new(corpus, LanguageTag::Js, "pino", "", "pino");

        let mut builder = MosaicBuilder::new();
        builder
            .add(Tessera::corpus(
                corpus_id.clone(),
                "pinojs/pino",
                &[ConformanceProfile::Core],
            ))
            .unwrap();
        builder
            .add(Tessera::module(module_id.clone(), ModuleKind::FileModule))
            .unwrap();
        builder
            .add(Tessera::file(file_id.clone(), "pino.js"))
            .unwrap();
        builder
            .add(Tessera::new(fn_id.clone(), TesseraKind::Function))
            .unwrap();

        builder.bond(Bond::new(BondKind::ChildOf, module_id, corpus_id));
        builder.bond(Bond::new(BondKind::DefinedIn, fn_id, file_id));

        builder.build().unwrap()
    }

    #[test]
    fn tile_lookup() {
        let mosaic = accessor_mosaic();
        let corpus_id = TesseraId::corpus("corp");
        assert!(mosaic.tile(&corpus_id).is_some());

        let missing = TesseraId::corpus("nonexistent");
        assert!(mosaic.tile(&missing).is_none());
    }

    #[test]
    fn tiles_iterator() {
        let mosaic = accessor_mosaic();
        assert_eq!(mosaic.tiles().count(), 4);
    }

    #[test]
    fn bonds_from_and_to() {
        let mosaic = accessor_mosaic();
        let corpus_id = TesseraId::corpus("corp");
        let mod_id = TesseraId::module("corp", LanguageTag::Rust, "app");

        assert_eq!(mosaic.bonds_from(&mod_id).count(), 1);
        assert_eq!(mosaic.bonds_to(&corpus_id).count(), 1);
    }

    #[test]
    fn corpus_tiles_filter() {
        let mosaic = accessor_mosaic();
        let corpus_tiles: Vec<_> = mosaic.corpus_tiles().collect();
        assert_eq!(corpus_tiles.len(), 1);
        assert_eq!(corpus_tiles[0].kind, TesseraKind::Corpus);
    }

    #[test]
    fn anchor_tessera_factory() {
        let id = TesseraId::new("corp", LanguageTag::Rust, "app", "", "anchor0");
        let anchor = Tessera::anchor(id, "src/lib.rs", 10, 42);
        assert_eq!(anchor.kind, TesseraKind::Anchor);
        assert_eq!(
            anchor.facts.get(fact_keys::ANCHOR_FILE),
            Some(&FactValue::String("src/lib.rs".into()))
        );
        assert_eq!(
            anchor.facts.get(fact_keys::ANCHOR_BYTE_START),
            Some(&FactValue::Integer(10))
        );
        assert_eq!(
            anchor.facts.get(fact_keys::ANCHOR_BYTE_END),
            Some(&FactValue::Integer(42))
        );
    }

    #[test]
    fn bond_ordinal_and_facts() {
        let a = TesseraId::corpus("corp");
        let b = TesseraId::file("corp", "f.rs");
        let bond = Bond::new(BondKind::DefinedIn, a, b)
            .with_ordinal(3)
            .with_fact("key", FactValue::Boolean(true));
        assert_eq!(bond.ordinal, Some(3));
        assert_eq!(bond.facts.get("key"), Some(&FactValue::Boolean(true)));
    }

    #[test]
    fn mosaic_json_round_trip() {
        let mosaic = json_mosaic();
        let json = serde_json::to_string_pretty(&mosaic).unwrap();
        let deserialized: Mosaic = serde_json::from_str(&json).unwrap();
        assert_eq!(mosaic, deserialized);
    }

    #[test]
    fn mosaic_json_tiles_is_array() {
        let mosaic = json_mosaic();
        let value: serde_json::Value = serde_json::to_value(&mosaic).unwrap();
        assert!(
            value["tiles"].is_array(),
            "tiles must serialize as a JSON array"
        );
        assert!(value["bonds"].is_array());
        assert_eq!(value["tiles"].as_array().unwrap().len(), 4);
        assert_eq!(value["bonds"].as_array().unwrap().len(), 2);
    }

    #[test]
    fn tessera_json_shape() {
        let id = TesseraId::new("corp", LanguageTag::Js, "pino", "", "pino");
        let t = Tessera::new(id, TesseraKind::Function).with_fact(
            fact_keys::DOC_TEXT,
            FactValue::String("Main logger factory".into()),
        );
        let value: serde_json::Value = serde_json::to_value(&t).unwrap();

        assert_eq!(value["kind"], "Function");
        assert_eq!(value["id"]["language"], "js");
        assert_eq!(value["id"]["module"], "pino");
        assert_eq!(
            value["facts"]["tessera/doc/text"],
            serde_json::json!({"String": "Main logger factory"})
        );
    }

    #[test]
    fn bond_json_shape() {
        let src = TesseraId::new("corp", LanguageTag::Js, "pino", "", "pino");
        let tgt = TesseraId::file("corp", "pino.js");
        let bond = Bond::new(BondKind::DefinedIn, src, tgt).with_ordinal(0);

        let value: serde_json::Value = serde_json::to_value(&bond).unwrap();
        assert_eq!(value["kind"], "defined_in");
        assert_eq!(value["ordinal"], 0);
        assert_eq!(value["source"]["language"], "js");
        assert_eq!(value["target"]["signature"], "file:pino.js");
    }

    #[test]
    fn fact_value_enum_json_shape() {
        let fv = FactValue::from(ModuleKind::FileModule);
        let value: serde_json::Value = serde_json::to_value(&fv).unwrap();
        assert_eq!(
            value,
            serde_json::json!({"Enum": {"ModuleKind": "file_module"}})
        );
    }
}
