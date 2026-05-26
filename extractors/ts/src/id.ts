import type { TesseraId } from "./mosaic.js";

export function corpusId(corpus: string): TesseraId {
  return { corpus, language: "_", module: "", scope: "", signature: "_" };
}

export function fileId(corpus: string, path: string): TesseraId {
  return {
    corpus,
    language: "_",
    module: "",
    scope: "",
    signature: `file:${path}`,
  };
}

export function moduleId(
  corpus: string,
  language: string,
  modulePath: string,
): TesseraId {
  return { corpus, language, module: modulePath, scope: "", signature: "_" };
}

export function declarationId(
  corpus: string,
  language: string,
  module: string,
  scope: string,
  name: string,
): TesseraId {
  return { corpus, language, module, scope, signature: name };
}

export function overloadId(
  corpus: string,
  language: string,
  module: string,
  scope: string,
  name: string,
  ordinal: number,
): TesseraId {
  return {
    corpus,
    language,
    module,
    scope,
    signature: `${name}#${ordinal}`,
  };
}

export function scopeNodeId(
  corpus: string,
  language: string,
  module: string,
  parentScope: string,
  parentSignature: string,
  ordinal: number,
): TesseraId {
  return {
    corpus,
    language,
    module,
    scope: parentScope
      ? `${parentScope}.${parentSignature}`
      : parentSignature,
    signature: `#Scope#${ordinal}`,
  };
}

export function anchorId(
  corpus: string,
  language: string,
  module: string,
  scope: string,
  parentSignature: string,
  ordinal: number,
): TesseraId {
  return {
    corpus,
    language,
    module,
    scope,
    signature: `${parentSignature}#Anchor#${ordinal}`,
  };
}

export function typeRefId(
  corpus: string,
  language: string,
  module: string,
  scope: string,
  parentSignature: string,
  ordinal: number,
): TesseraId {
  return {
    corpus,
    language,
    module,
    scope,
    signature: `${parentSignature}#TypeRef#${ordinal}`,
  };
}

export function dependencyId(corpus: string, name: string): TesseraId {
  return {
    corpus,
    language: "_",
    module: "",
    scope: "",
    signature: `dep:${name}`,
  };
}

const CANONICAL_PREFIX = "nodeid:v0:";

function percentEncode(s: string): string {
  let out = "";
  for (const ch of s) {
    const code = ch.codePointAt(0)!;
    if (code < 0x20 || ch === "|" || ch === "%" || ch === "\n" || ch === "\r") {
      out += `%${code.toString(16).toUpperCase().padStart(2, "0")}`;
    } else {
      out += ch;
    }
  }
  return out;
}

export function toCanonical(id: TesseraId): string {
  return `${CANONICAL_PREFIX}${percentEncode(id.corpus)}|${percentEncode(id.language)}|${percentEncode(id.module)}|${percentEncode(id.scope)}|${percentEncode(id.signature)}`;
}

export function filePathToModulePath(relPath: string): string {
  return relPath
    .replace(/\.[^.]+$/, "")
    .replace(/\//g, ".");
}

export function tesseraIdEq(a: TesseraId, b: TesseraId): boolean {
  return (
    a.corpus === b.corpus &&
    a.language === b.language &&
    a.module === b.module &&
    a.scope === b.scope &&
    a.signature === b.signature
  );
}
