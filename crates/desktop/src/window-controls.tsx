import { getCurrentWindow } from "@tauri-apps/api/window";

const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
export const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent);

function windowAction(action: "close" | "minimize" | "toggleMaximize") {
  if (!isTauri) return;
  const w = getCurrentWindow();
  switch (action) {
    case "close": void w.close(); return;
    case "minimize": void w.minimize(); return;
    case "toggleMaximize": void w.toggleMaximize(); return;
  }
}

export function WindowControls() {
  if (isMac) {
    return (
      <div className="traffic-lights traffic-lights-mac">
        <button type="button" className="dot dot-close" aria-label="Close window" onClick={() => windowAction("close")} />
        <button type="button" className="dot dot-minimize" aria-label="Minimize window" onClick={() => windowAction("minimize")} />
        <button type="button" className="dot dot-maximize" aria-label="Toggle maximize window" onClick={() => windowAction("toggleMaximize")} />
      </div>
    );
  }
  return (
    <div className="window-controls window-controls-winlinux">
      <button type="button" className="win-control win-minimize" aria-label="Minimize window" onClick={() => windowAction("minimize")}>
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M0 5h10" stroke="currentColor" strokeWidth="1" /></svg>
      </button>
      <button type="button" className="win-control win-maximize" aria-label="Toggle maximize window" onClick={() => windowAction("toggleMaximize")}>
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><rect x="0.5" y="0.5" width="9" height="9" fill="none" stroke="currentColor" /></svg>
      </button>
      <button type="button" className="win-control win-close" aria-label="Close window" onClick={() => windowAction("close")}>
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M0 0l10 10M10 0L0 10" stroke="currentColor" strokeWidth="1" /></svg>
      </button>
    </div>
  );
}
