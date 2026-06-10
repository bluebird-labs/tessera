/* Tessera · projection metadata types.
 *
 * Each view (`view-domain`, `view-data`, `view-flow`) exposes a small
 * descriptor consumed by the Canvas / Outliner / Inspector / Layers / Spec
 * panels. The shape mirrors the reference impl in
 * `crates/desktop/design/diagrams/app.js`; if the two disagree, the
 * reference wins.
 */

import type { ViewId } from "../state/app-store";

export interface ProjectionLayout {
  id: string;
  label: string;
}

export interface ProjectionFilter {
  id: string;
  label: string;
  color: string;
  count: number;
}

export interface ProjectionLegend {
  /** Plain glyph or short HTML snippet (legacy designs use coloured spans). */
  glyph: string;
  label: string;
}

export interface ProjectionMeta {
  id: ViewId;
  /** Tab label / rail label. */
  label: string;
  /** Outliner eyebrow (mono uppercase). */
  eyebrow: string;
  /** Outliner big title (e.g. "Atlas Stays"). */
  title: string;
  /** Canvas chrome title (usually `label`). */
  stageTitle: string;
  /** Canvas chrome meta string (HTML allowed for the inline drift count). */
  stageMeta: string;
  layouts: ProjectionLayout[];
  defaultLayout: string;
  filters: ProjectionFilter[];
  legendTitle: string;
  legend: ProjectionLegend[];
}

export interface OutlinerBadge {
  label: string;
  color: string;
  bg?: string;
}

export interface OutlinerRow {
  /** `null` for purely decorative rows (sections without a selectable id). */
  id: string | null;
  label: string;
  sub?: string;
  color?: string;
  badge?: OutlinerBadge;
}

export interface OutlinerGroup {
  section?: string;
  rows: OutlinerRow[];
}

export interface InspectorBadge {
  label: string;
  color: string;
  bg?: string;
}

export interface InspectorProp {
  k: string;
  v: string;
  mono?: boolean;
  color?: string;
}

export interface InspectorRel {
  label: string;
  color: string;
  kind: string;
  target: string;
}

export interface InspectorSection {
  title: string;
  props?: InspectorProp[];
  rels?: InspectorRel[];
}

export interface InspectorAction {
  label: string;
  kind?: "primary" | "ghost" | "";
}

export interface InspectorModel {
  type: string;
  typeLabel: string;
  title: string;
  id: string;
  accent?: string;
  badges?: InspectorBadge[];
  sections: InspectorSection[];
  actions?: InspectorAction[];
}
