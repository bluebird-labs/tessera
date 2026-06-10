import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { PrismLogo } from "./prism-logo";
import { WindowControls, isMac } from "./window-controls";
import "./title-bar.css";

export interface TitleBarProps {
  projectLabel?: string;
  /** Optional add-panel button + menu wiring. When absent the centre group
   *  collapses to nothing (used by routes that don't host a workspace). */
  addPanel?: {
    open: boolean;
    onToggle: () => void;
    menu: ReactNode;
  };
  onResetLayout?: () => void;
}

export function TitleBar({ projectLabel, addPanel, onResetLayout }: TitleBarProps) {
  return (
    <header className="title-bar" data-tauri-drag-region>
      <div className="tb-left">
        {isMac && <WindowControls />}
        <Link to="/" className="tb-brand" aria-label="Back to projects">
          <PrismLogo size={20} />
          <span className="tb-wordmark">Tessera</span>
        </Link>
        {projectLabel ? (
          <button type="button" className="tb-proj">
            <span className="tb-proj-dot" />
            <span>{projectLabel}</span>
          </button>
        ) : null}
      </div>
      <div className="tb-center">
        {addPanel ? (
          <span className="ws-tool-anchor">
            <button
              type="button"
              className="ws-tool"
              aria-haspopup="menu"
              aria-expanded={addPanel.open}
              onClick={addPanel.onToggle}
            >
              <span className="gl">＋</span>
              <span>Add panel</span>
            </button>
            {addPanel.open ? addPanel.menu : null}
          </span>
        ) : null}
        {onResetLayout ? (
          <button type="button" className="ws-tool" onClick={onResetLayout}>
            <span className="gl">⟲</span>
            <span>Reset layout</span>
          </button>
        ) : null}
      </div>
      <div className="tb-right">
        <button type="button" className="search-btn">
          <kbd>⌘K</kbd>
          <span>Search</span>
        </button>
        <div className="avatar" aria-label="Account">
          EM
        </div>
        {!isMac && <WindowControls />}
      </div>
    </header>
  );
}
