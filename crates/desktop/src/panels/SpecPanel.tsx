import { useSelected, useView } from "../state/app-store";
import { projectionDescribe } from "./meta";

export function SpecPanel() {
  const view = useView();
  const selected = useSelected();
  const model = selected ? projectionDescribe(view, selected) : null;

  if (!model) {
    return (
      <div className="spec">
        <div className="sp-empty">
          Select an element to preview the spec Tessera would hand a coding
          agent for it.
        </div>
      </div>
    );
  }

  const propLines: string[] = [];
  for (const sec of model.sections) {
    for (const p of sec.props ?? []) {
      const key = p.k.replace(/\s+/g, "_");
      const value = String(p.v).replace(/<[^>]+>/g, "");
      propLines.push(`  ${key}: ${value}`);
    }
  }
  const relLines: string[] = [];
  for (const sec of model.sections) {
    for (const r of sec.rels ?? []) {
      relLines.push(`  - ${r.kind} ${r.label}`);
    }
  }

  return (
    <div className="spec">
      <pre>
        <span className="cm"># generated · {view}@atlas-stays</span>
        {"\n"}
        <span className="sp-h">target</span>
        {"  "}
        {model.typeLabel || ""} <span className="st">{model.title}</span>
        {"\n"}
        <span className="sp-h">properties</span>
        {"\n"}
        {propLines.length ? propLines.join("\n") : <span className="cm">  —</span>}
        {"\n"}
        <span className="sp-h">relations</span>
        {"\n"}
        {relLines.length ? relLines.join("\n") : <span className="cm">  —</span>}
        {"\n"}
        <span className="sp-h">intent</span>
        {"  "}
        <span className="cm"># describe the change, then Tessera</span>
        {"\n"}
        {"  "}
        <span className="cm"># emits a task for the agent…</span>
      </pre>
    </div>
  );
}
