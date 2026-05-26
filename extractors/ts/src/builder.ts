import type {
  Bond,
  BondKind,
  FactValue,
  NdjsonLine,
  Tessera,
  TesseraId,
  TesseraKind,
} from "./mosaic.js";
import { toCanonical } from "./id.js";

export class MosaicStream {
  private seen = new Set<string>();
  private output: (line: string) => void;

  constructor(output?: (line: string) => void) {
    this.output = output ?? ((line) => process.stdout.write(line + "\n"));
  }

  emitTile(
    id: TesseraId,
    kind: TesseraKind,
    facts: Record<string, FactValue> = {},
  ): void {
    const key = toCanonical(id);
    if (this.seen.has(key)) return;
    this.seen.add(key);

    const tile: Tessera = { id, kind, facts };
    const line: NdjsonLine = { tile };
    this.output(JSON.stringify(line));
  }

  emitBond(
    kind: BondKind,
    source: TesseraId,
    target: TesseraId,
    ordinal: number | null = null,
    facts: Record<string, FactValue> = {},
  ): void {
    const bond: Bond = { kind, source, target, ordinal, facts };
    const line: NdjsonLine = { bond };
    this.output(JSON.stringify(line));
  }

  hasTile(id: TesseraId): boolean {
    return this.seen.has(toCanonical(id));
  }
}
