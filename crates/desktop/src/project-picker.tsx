import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { TitleBar } from "./title-bar";
import "./project-picker.css";

type ProjectDto = {
  id: number;
  path: string;
  last_opened: string;
};

const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

function basename(path: string): string {
  const trimmed = path.replace(/[\\/]+$/, "");
  const idx = Math.max(trimmed.lastIndexOf("/"), trimmed.lastIndexOf("\\"));
  return idx >= 0 ? trimmed.slice(idx + 1) : trimmed;
}

function relativeTime(iso: string): string {
  const ts = Date.parse(iso);
  if (Number.isNaN(ts)) return "";
  const diffSec = Math.round((Date.now() - ts) / 1000);
  if (diffSec < 60) return "just now";
  if (diffSec < 3600) {
    const m = Math.round(diffSec / 60);
    return `${m} minute${m === 1 ? "" : "s"} ago`;
  }
  if (diffSec < 86400) {
    const h = Math.round(diffSec / 3600);
    return `${h} hour${h === 1 ? "" : "s"} ago`;
  }
  const d = Math.round(diffSec / 86400);
  return `${d} day${d === 1 ? "" : "s"} ago`;
}

export function ProjectPicker() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isTauri) {
      setProjects([]);
      return;
    }
    invoke<ProjectDto[]>("list_projects")
      .then(setProjects)
      .catch((err) => {
        setError(String(err));
        setProjects([]);
      });
  }, []);

  const onPickFolder = useCallback(async () => {
    if (!isTauri) {
      setError("Native folder picker is only available in the desktop app.");
      return;
    }
    // Fire the dialog IPC before any React state work so the native modal
    // appears within one frame of the click. setError(null) below would
    // otherwise schedule a re-render that runs ahead of the IPC.
    const dialog = invoke<string | null>("pick_project_folder");
    setError(null);
    try {
      const selected = await dialog;
      if (selected === null) return;
      const dto = await invoke<ProjectDto>("add_project", { path: selected });
      navigate(`/project/${dto.id}`);
    } catch (err) {
      setError(String(err));
    }
  }, [navigate]);

  const onOpenExisting = useCallback(
    async (id: number) => {
      try {
        if (isTauri) {
          await invoke("touch_project", { id });
        }
        navigate(`/project/${id}`);
      } catch (err) {
        setError(String(err));
      }
    },
    [navigate],
  );

  const onRemove = useCallback(async (id: number) => {
    try {
      if (isTauri) {
        await invoke("remove_project", { id });
      }
      setProjects((prev) => (prev ? prev.filter((p) => p.id !== id) : prev));
    } catch (err) {
      setError(String(err));
    }
  }, []);

  const isEmpty = useMemo(
    () => projects !== null && projects.length === 0,
    [projects],
  );

  return (
    <div className="picker-shell">
      <TitleBar />

      <main className="picker-body">
        {projects === null ? (
          <div className="picker-loading">Loading projects…</div>
        ) : isEmpty ? (
          <EmptyState onOpen={onPickFolder} />
        ) : (
          <ProjectList
            projects={projects}
            onOpen={onOpenExisting}
            onRemove={onRemove}
            onAdd={onPickFolder}
          />
        )}
        {error && <div className="picker-error">{error}</div>}
      </main>
    </div>
  );
}

function EmptyState({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="picker-empty">
      <h1 className="picker-empty-title">No projects yet</h1>
      <p className="picker-empty-hint">
        Open a folder to start indexing it into Tessera.
      </p>
      <button type="button" className="picker-cta" onClick={onOpen}>
        Open a folder
      </button>
    </div>
  );
}

function ProjectList({
  projects,
  onOpen,
  onRemove,
  onAdd,
}: {
  projects: ProjectDto[];
  onOpen: (id: number) => void;
  onRemove: (id: number) => void;
  onAdd: () => void;
}) {
  return (
    <div className="picker-list-wrap">
      <div className="picker-list-header">
        <div>
          <h1 className="picker-list-title">Projects</h1>
          <p className="picker-list-hint">{projects.length} indexed folder{projects.length === 1 ? "" : "s"}</p>
        </div>
        <button type="button" className="picker-cta picker-cta-compact" onClick={onAdd}>
          Open a folder
        </button>
      </div>
      <ul className="picker-list">
        {projects.map((p) => (
          <ProjectRow key={p.id} project={p} onOpen={onOpen} onRemove={onRemove} />
        ))}
      </ul>
    </div>
  );
}

function ProjectRow({
  project,
  onOpen,
  onRemove,
}: {
  project: ProjectDto;
  onOpen: (id: number) => void;
  onRemove: (id: number) => void;
}) {
  const onRowClick = useCallback(() => onOpen(project.id), [onOpen, project.id]);
  const onRemoveClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      onRemove(project.id);
    },
    [onRemove, project.id],
  );
  const name = basename(project.path);
  const when = relativeTime(project.last_opened);
  return (
    <li>
      <button type="button" className="picker-row" onClick={onRowClick}>
        <div className="picker-row-main">
          <div className="picker-row-name">{name}</div>
          <div className="picker-row-path">{project.path}</div>
        </div>
        {when && <span className="picker-row-time">{when}</span>}
        <button
          type="button"
          className="picker-row-remove"
          aria-label={`Remove ${name} from list`}
          onClick={onRemoveClick}
        >
          ✕
        </button>
      </button>
    </li>
  );
}

