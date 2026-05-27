use tessera_graph::{Bond, Tessera, TesseraId};

fn uri_encode(s: &str) -> String {
    use std::fmt::Write;
    let mut out = String::with_capacity(s.len());
    for byte in s.bytes() {
        if byte.is_ascii_alphanumeric() || matches!(byte, b'.' | b'-' | b'~' | b'_' | b'@' | b':') {
            out.push(char::from(byte));
        } else {
            write!(out, "%{byte:02X}").expect("write to String cannot fail");
        }
    }
    out
}

fn encode_field(s: &str) -> String {
    if s.is_empty() {
        "_".to_owned()
    } else {
        uri_encode(s)
    }
}

pub fn tessera_db_id(id: &TesseraId) -> String {
    format!(
        "Tessera/{}__{}__{}__{}__{}",
        encode_field(&id.corpus),
        encode_field(id.language.as_str()),
        encode_field(&id.module),
        encode_field(&id.scope),
        encode_field(&id.signature),
    )
}

pub fn bond_db_id(bond: &Bond) -> String {
    let source_id = tessera_db_id(&bond.source);
    let target_id = tessera_db_id(&bond.target);
    let kind = serde_json::to_value(bond.kind)
        .expect("BondKind serialization cannot fail")
        .as_str()
        .expect("BondKind serializes to a string")
        .to_owned();
    let ordinal = bond
        .ordinal
        .map_or_else(|| "_".to_owned(), |n| n.to_string());
    format!("Bond/{kind}__{source_id}__{target_id}__{ordinal}")
}

pub fn tessera_to_document(t: &Tessera) -> serde_json::Value {
    let db_id = tessera_db_id(&t.id);
    let kind = serde_json::to_value(t.kind).expect("TesseraKind serialization cannot fail");
    let facts = serde_json::to_value(&t.facts).expect("facts serialization cannot fail");
    serde_json::json!({
        "@type": "Tessera",
        "@id": db_id,
        "corpus": t.id.corpus,
        "language": t.id.language.as_str(),
        "module": t.id.module,
        "scope": t.id.scope,
        "signature": t.id.signature,
        "kind": kind,
        "facts": facts,
    })
}

pub fn bond_to_document(b: &Bond) -> serde_json::Value {
    let db_id = bond_db_id(b);
    let source_id = tessera_db_id(&b.source);
    let target_id = tessera_db_id(&b.target);
    let kind = serde_json::to_value(b.kind).expect("BondKind serialization cannot fail");
    let facts = serde_json::to_value(&b.facts).expect("facts serialization cannot fail");

    let mut doc = serde_json::json!({
        "@type": "Bond",
        "@id": db_id,
        "kind": kind,
        "source": source_id,
        "target": target_id,
        "facts": facts,
    });

    if let Some(ord) = b.ordinal {
        doc["ordinal"] = serde_json::json!(ord);
    }

    doc
}

pub fn terminus_schema() -> serde_json::Value {
    serde_json::json!([
        {
            "@type": "Class",
            "@id": "Tessera",
            "corpus": "xsd:string",
            "language": "xsd:string",
            "module": "xsd:string",
            "scope": "xsd:string",
            "signature": "xsd:string",
            "kind": "xsd:string",
            "facts": "sys:JSON"
        },
        {
            "@type": "Class",
            "@id": "Bond",
            "kind": "xsd:string",
            "source": "Tessera",
            "target": "Tessera",
            "ordinal": { "@type": "Optional", "@class": "xsd:nonNegativeInteger" },
            "facts": "sys:JSON"
        }
    ])
}

#[cfg(test)]
mod tests {
    use super::*;
    use tessera_graph::{BondKind, FactValue, LanguageTag, TesseraKind};

    #[test]
    fn tessera_db_id_encodes_slashes() {
        let id = TesseraId::new(
            "github.com/acme/app",
            LanguageTag::Ts,
            "src.utils",
            "",
            "renderPage",
        );
        let db_id = tessera_db_id(&id);
        assert_eq!(
            db_id,
            "Tessera/github.com%2Facme%2Fapp__ts__src.utils_____renderPage"
        );
    }

    #[test]
    fn tessera_db_id_empty_fields_become_underscore() {
        let id = TesseraId::corpus("my-corpus");
        let db_id = tessera_db_id(&id);
        // corpus="my-corpus", language="_", module=""→"_", scope=""→"_", signature="_"
        // = my-corpus __ _ __ _ __ _ __ _ (12 underscores)
        assert_eq!(db_id, "Tessera/my-corpus____________");
    }

    #[test]
    fn bond_db_id_with_ordinal() {
        let src = TesseraId::corpus("c");
        let tgt = TesseraId::corpus("c");
        let bond = Bond::new(BondKind::ChildOf, src, tgt).with_ordinal(3);
        let db_id = bond_db_id(&bond);
        assert!(db_id.starts_with("Bond/child_of__"));
        assert!(db_id.ends_with("__3"));
    }

    #[test]
    fn bond_db_id_without_ordinal() {
        let src = TesseraId::corpus("a");
        let tgt = TesseraId::corpus("b");
        let bond = Bond::new(BondKind::DependsOn, src, tgt);
        let db_id = bond_db_id(&bond);
        assert!(db_id.ends_with("___"));
    }

    #[test]
    fn tessera_to_document_shape() {
        let id = TesseraId::new("corp", LanguageTag::Rust, "app", "", "main");
        let t = Tessera::new(id, TesseraKind::Function)
            .with_fact("tessera/doc/text", FactValue::String("test doc".into()));
        let doc = tessera_to_document(&t);

        assert_eq!(doc["@type"], "Tessera");
        assert!(doc["@id"].as_str().unwrap().starts_with("Tessera/"));
        assert_eq!(doc["corpus"], "corp");
        assert_eq!(doc["language"], "rust");
        assert_eq!(doc["module"], "app");
        assert_eq!(doc["scope"], "");
        assert_eq!(doc["signature"], "main");
        assert_eq!(doc["kind"], "Function");
        assert!(doc["facts"].is_object());
        assert!(doc["facts"]["tessera/doc/text"].is_object());
    }

    #[test]
    fn bond_to_document_with_ordinal() {
        let src = TesseraId::new("corp", LanguageTag::Rust, "app", "", "main");
        let tgt = TesseraId::corpus("corp");
        let bond = Bond::new(BondKind::ChildOf, src, tgt).with_ordinal(0);
        let doc = bond_to_document(&bond);

        assert_eq!(doc["@type"], "Bond");
        assert!(doc["@id"].as_str().unwrap().starts_with("Bond/"));
        assert_eq!(doc["kind"], "child_of");
        assert!(doc["source"].as_str().unwrap().starts_with("Tessera/"));
        assert!(doc["target"].as_str().unwrap().starts_with("Tessera/"));
        assert_eq!(doc["ordinal"], 0);
        assert!(doc["facts"].is_object());
    }

    #[test]
    fn bond_to_document_without_ordinal() {
        let src = TesseraId::corpus("a");
        let tgt = TesseraId::corpus("b");
        let bond = Bond::new(BondKind::DependsOn, src, tgt);
        let doc = bond_to_document(&bond);

        assert!(doc.get("ordinal").is_none());
    }

    #[test]
    fn terminus_schema_structure() {
        let schema = terminus_schema();
        let arr = schema.as_array().unwrap();
        assert_eq!(arr.len(), 2);
        assert_eq!(arr[0]["@id"], "Tessera");
        assert_eq!(arr[0]["@type"], "Class");
        assert_eq!(arr[1]["@id"], "Bond");
        assert_eq!(arr[1]["source"], "Tessera");
        assert_eq!(arr[1]["target"], "Tessera");
    }
}
