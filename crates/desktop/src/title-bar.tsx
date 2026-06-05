import { Link } from "react-router-dom";
import { PrismLogo } from "./prism-logo";
import { WindowControls, isMac } from "./window-controls";
import "./title-bar.css";

export function TitleBar() {
  return (
    <header className="title-bar" data-tauri-drag-region>
      <div className="title-bar-left">
        {isMac && <WindowControls />}
        <Link to="/" className="title-bar-brand" aria-label="Back to projects">
          <PrismLogo size={20} />
          <span className="title-bar-wordmark">Tessera</span>
        </Link>
      </div>
      <div className="title-bar-right">
        {!isMac && <WindowControls />}
      </div>
    </header>
  );
}
