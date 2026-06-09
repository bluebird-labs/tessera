/* Lookup helpers — pick the per-view projection metadata, outliner data and
 * inspector model. Kept out of the individual panel files so the same code
 * powers Outliner / Inspector / Layers / Spec without duplication. */

import {
  viewDataDescribe,
  viewDataMeta,
  viewDataOutliner,
  viewDomainDescribe,
  viewDomainMeta,
  viewDomainOutliner,
  viewFlowDescribe,
  viewFlowMeta,
  viewFlowOutliner,
  type InspectorModel,
  type OutlinerGroup,
  type ProjectionMeta,
} from "../viz";
import type { ViewId } from "../state/app-store";

export function projectionMeta(view: ViewId): ProjectionMeta | null {
  if (view === "domain") return viewDomainMeta();
  if (view === "data") return viewDataMeta();
  if (view === "flow") return viewFlowMeta();
  return null;
}

export function projectionOutliner(view: ViewId): OutlinerGroup[] {
  if (view === "domain") return viewDomainOutliner();
  if (view === "data") return viewDataOutliner();
  if (view === "flow") return viewFlowOutliner();
  return [];
}

export function projectionDescribe(view: ViewId, id: string): InspectorModel | null {
  if (view === "domain") return viewDomainDescribe(id);
  if (view === "data") return viewDataDescribe(id);
  if (view === "flow") return viewFlowDescribe(id);
  return null;
}
