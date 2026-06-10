import { select, useSelected, useView } from "../state/app-store";
import { TYPE, type NodeKind } from "../viz/viz-core";
import { projectionDescribe } from "./meta";

export function InspectorPanel() {
  const view = useView();
  const selected = useSelected();
  const model = selected ? projectionDescribe(view, selected) : null;

  if (!model) {
    return (
      <div className="insp-empty">
        <div className="big">◇</div>
        <div className="t">Nothing selected</div>
        <div className="s">
          Click any tile, table, or step on the canvas. Its schema, state and
          relations land here — the same panel across every view.
        </div>
      </div>
    );
  }

  const typeStyle = TYPE[model.type as NodeKind] ?? TYPE.module;
  const accent = model.accent ?? typeStyle.glow;

  return (
    <>
      <div className="insp-head">
        <div className="insp-type">
          <span className="dot" style={{ background: accent, boxShadow: `0 0 8px ${accent}` }} />
          {model.typeLabel || typeStyle.label}
        </div>
        <div className="insp-title">
          {model.title}
          {model.badges?.map((b, i) => (
            <span
              key={`${b.label}-${i}`}
              className="insp-chip"
              style={{
                color: b.color,
                background: b.bg ?? "transparent",
                border: `1px solid ${b.color}55`,
              }}
            >
              {b.label}
            </span>
          ))}
        </div>
        {model.id ? <div className="insp-id">{model.id}</div> : null}
      </div>
      {model.sections.map((sec, si) => (
        <div className="insp-sec" key={`sec-${si}`}>
          <h3>
            {sec.title}
            <span className="rule" />
          </h3>
          {sec.props?.map((p, pi) => (
            <div className="insp-prop" key={`prop-${pi}`}>
              <div className="k">{p.k}</div>
              <div
                className={`v${p.mono ? " mono" : ""}`}
                style={p.color ? { color: p.color } : undefined}
              >
                {p.v}
              </div>
            </div>
          ))}
          {sec.rels?.map((r, ri) => (
            <button
              type="button"
              className="insp-rel"
              key={`rel-${ri}`}
              onClick={() => select(r.target)}
            >
              <span className="sw" style={{ background: r.color }} />
              <span>{r.label}</span>
              <span className="kind">{r.kind}</span>
            </button>
          ))}
        </div>
      ))}
      {model.actions?.length ? (
        <div className="insp-foot">
          {model.actions.map((a, i) => (
            <button
              key={`act-${i}`}
              type="button"
              className={`insp-btn${a.kind ? ` ${a.kind}` : ""}`}
            >
              {a.label}
            </button>
          ))}
        </div>
      ) : null}
    </>
  );
}
