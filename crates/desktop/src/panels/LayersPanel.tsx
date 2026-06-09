import { toggleFilter, useFilters, useView } from "../state/app-store";
import { projectionMeta } from "./meta";

export function LayersPanel() {
  const view = useView();
  const filters = useFilters(view);
  const meta = projectionMeta(view);
  const filterList = meta?.filters ?? [];
  const legend = meta?.legend ?? [];

  return (
    <div className="layers">
      {filterList.length > 0 ? (
        <>
          <h4>Types · click to filter</h4>
          {filterList.map((f) => {
            const off = filters.has(f.id);
            return (
              <button
                type="button"
                key={f.id}
                className={`lyr-row${off ? " off" : ""}`}
                onClick={() => toggleFilter(view, f.id)}
              >
                <span className="sw" style={{ background: f.color }} />
                <span className="nm">{f.label}</span>
                <span className="ct">{f.count}</span>
              </button>
            );
          })}
          <div className="lyr-sep" />
        </>
      ) : (
        <>
          <h4>Types · this view has no per-type filters</h4>
          <div className="lyr-empty">drag tables to rearrange · click to focus</div>
          <div className="lyr-sep" />
        </>
      )}
      <h4>{meta?.legendTitle ?? "Legend"}</h4>
      {legend.map((l, i) => (
        <div className="lyr-leg" key={`leg-${i}`}>
          {/* glyph may contain inline HTML in the reference; render as HTML */}
          <span className="gl" dangerouslySetInnerHTML={{ __html: l.glyph }} />
          <span>{l.label}</span>
        </div>
      ))}
    </div>
  );
}
