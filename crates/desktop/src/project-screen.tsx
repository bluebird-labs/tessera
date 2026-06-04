import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import parchmentLogo from "./assets/tessera-logo-parchment.svg";
import "./project-screen.css";

type ProjectDto = {
  id: number;
  path: string;
  last_opened: string;
};

const TILE_COLORS = ["--indigo", "--cyan", "--magenta", "--violet"] as const;

type State =
  | { status: "loading" }
  | { status: "ready"; project: ProjectDto }
  | { status: "not-found" };

const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

function basename(path: string): string {
  const trimmed = path.replace(/[\\/]+$/, "");
  const idx = Math.max(trimmed.lastIndexOf("/"), trimmed.lastIndexOf("\\"));
  return idx >= 0 ? trimmed.slice(idx + 1) : trimmed;
}

export function projectInitials(folderBasename: string): string {
  const tokens = folderBasename.split(/[\s_\-.]+/).filter(Boolean);
  if (tokens.length === 0) return "?";
  if (tokens.length === 1) {
    return tokens[0].slice(0, 2).toUpperCase();
  }
  return (tokens[0][0] + tokens[1][0]).toUpperCase();
}

export function projectColorVar(canonicalPath: string): (typeof TILE_COLORS)[number] {
  let hash = 5381;
  for (let i = 0; i < canonicalPath.length; i++) {
    hash = ((hash << 5) + hash + canonicalPath.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % TILE_COLORS.length;
  return TILE_COLORS[index];
}

export function ProjectScreen() {
  const { id: idParam } = useParams<{ id: string }>();
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    const id = Number(idParam);
    if (!Number.isFinite(id) || !isTauri) {
      setState({ status: "not-found" });
      return;
    }
    invoke<ProjectDto>("get_project", { id })
      .then((project) => setState({ status: "ready", project }))
      .catch(() => setState({ status: "not-found" }));
  }, [idParam]);

  return (
    <div className="project-shell">
      <header className="project-titlebar" data-tauri-drag-region>
        <Link to="/" className="project-logo-link" aria-label="Back to projects">
          <img className="project-logo" src={parchmentLogo} alt="" />
        </Link>
      </header>

      <main className="project-body">
        {state.status === "ready" && <ProjectTile project={state.project} />}
        {state.status === "not-found" && <NotFound />}
      </main>
    </div>
  );
}

function ProjectTile({ project }: { project: ProjectDto }) {
  const name = basename(project.path);
  const initials = projectInitials(name);
  const colorVar = projectColorVar(project.path);
  return (
    <>
      <div className="project-tile" style={{ background: `var(${colorVar})` }}>
        <span className="project-initials">{initials}</span>
      </div>
      <p className="project-name">{name}</p>
    </>
  );
}

function NotFound() {
  return (
    <div className="project-missing">
      <p className="project-missing-text">Project not found</p>
      <Link to="/" className="project-missing-link">
        Back to projects
      </Link>
    </div>
  );
}
