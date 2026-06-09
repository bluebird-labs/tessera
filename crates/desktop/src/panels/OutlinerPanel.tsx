import { select, useSelected, useView } from "../state/app-store";
import { projectionMeta, projectionOutliner } from "./meta";

export function OutlinerPanel() {
  const view = useView();
  const selected = useSelected();
  const meta = projectionMeta(view);
  const groups = projectionOutliner(view);

  return (
    <div className="ol">
      <div className="ol-head">
        <div className="ol-eyebrow">{meta?.eyebrow ?? "View"}</div>
        <div className="ol-title">{meta?.title ?? "Atlas Stays"}</div>
      </div>
      <div className="ol-body">
        {groups.map((g, gi) => (
          <div key={g.section ?? `g-${gi}`}>
            {g.section ? <div className="ol-section">{g.section}</div> : null}
            {g.rows.map((row, ri) => {
              const active = row.id !== null && row.id === selected;
              const clickable = row.id !== null;
              const className = `ol-row${active ? " active" : ""}${clickable ? "" : " static"}`;
              const content = (
                <>
                  <span className="swatch" style={{ background: row.color ?? "transparent" }} />
                  <div>
                    <div className="lbl">{row.label}</div>
                    {row.sub ? <div className="sub">{row.sub}</div> : null}
                  </div>
                  {row.badge ? (
                    <span
                      className="badge"
                      style={{
                        color: row.badge.color,
                        background: row.badge.bg ?? "transparent",
                        border: `1px solid ${row.badge.color}55`,
                      }}
                    >
                      {row.badge.label}
                    </span>
                  ) : (
                    <span />
                  )}
                </>
              );
              if (clickable) {
                return (
                  <button
                    type="button"
                    key={`${row.id ?? "x"}-${ri}`}
                    className={className}
                    onClick={() => select(row.id)}
                  >
                    {content}
                  </button>
                );
              }
              return (
                <div key={`row-${gi}-${ri}`} className={className}>
                  {content}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
