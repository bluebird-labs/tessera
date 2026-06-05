// Tauri's `#[tauri::command]` extracts `State<'_, T>` by value from the
// invoke handler; the pedantic `needless_pass_by_value` lint can't see
// through the macro, so we silence it module-wide for the handlers.
#![allow(clippy::needless_pass_by_value)]

use std::path::PathBuf;

use serde::Serialize;
use tauri::{AppHandle, Manager, State, WebviewWindow};
use tessera_projects::time::OffsetDateTime;
use tessera_projects::time::format_description::well_known::Iso8601;
use tessera_projects::{Project, ProjectStore, ProjectStoreError};

#[tauri::command]
const fn app_name() -> &'static str {
    tessera_core::APP_NAME
}

#[derive(Debug, Serialize)]
struct ProjectDto {
    id: i64,
    path: String,
    last_opened: String,
}

impl From<Project> for ProjectDto {
    fn from(project: Project) -> Self {
        Self {
            id: project.id,
            path: project.path.to_string_lossy().into_owned(),
            last_opened: format_iso8601(project.last_opened),
        }
    }
}

#[tauri::command]
fn list_projects(store: State<'_, ProjectStore>) -> Result<Vec<ProjectDto>, String> {
    store
        .list()
        .map(|projects| projects.into_iter().map(ProjectDto::from).collect())
        .map_err(error_to_string)
}

#[tauri::command]
fn add_project(store: State<'_, ProjectStore>, path: String) -> Result<ProjectDto, String> {
    store
        .add(&PathBuf::from(path))
        .map(ProjectDto::from)
        .map_err(error_to_string)
}

#[tauri::command]
fn remove_project(store: State<'_, ProjectStore>, id: i64) -> Result<(), String> {
    store.remove(id).map_err(error_to_string)
}

#[tauri::command]
fn touch_project(store: State<'_, ProjectStore>, id: i64) -> Result<(), String> {
    store.touch(id).map_err(error_to_string)
}

// Native folder picker. We bypass `tauri-plugin-dialog` here because its
// `open(directory)` path posts the dialog through `run_on_main_thread` +
// `std::thread::spawn` + `block_on`, which on macOS starves the WebView
// compositor for ~500-800ms between click and first paint frame after the
// IPC. Awaiting `rfd::AsyncFileDialog` directly on Tauri's async runtime
// keeps the main thread free; `set_parent(&window)` triggers the
// `beginSheetModalForWindow:` (sheet) presentation on macOS and is the
// canonical lever for window-attached dialogs on Windows and Linux too.
#[tauri::command]
async fn pick_project_folder(window: WebviewWindow) -> Option<String> {
    rfd::AsyncFileDialog::new()
        .set_parent(&window)
        .pick_folder()
        .await
        .map(|handle| handle.path().to_string_lossy().into_owned())
}

#[tauri::command]
fn get_project(store: State<'_, ProjectStore>, id: i64) -> Result<ProjectDto, String> {
    store
        .get(id)
        .map(ProjectDto::from)
        .map_err(|err| match err {
            ProjectStoreError::NotFound(_) => "project not found".to_owned(),
            other => other.to_string(),
        })
}

fn error_to_string(err: ProjectStoreError) -> String {
    err.to_string()
}

fn format_iso8601(ts: OffsetDateTime) -> String {
    ts.format(&Iso8601::DEFAULT).unwrap_or_default()
}

fn project_store(app: &AppHandle) -> Result<ProjectStore, Box<dyn std::error::Error>> {
    let base = app.path().app_data_dir()?;
    let db_path = base.join("tessera").join("projects.db");
    ProjectStore::open(&db_path).map_err(Into::into)
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let store = project_store(app.handle())?;
            app.manage(store);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            app_name,
            list_projects,
            add_project,
            remove_project,
            touch_project,
            get_project,
            pick_project_folder,
        ])
        .run(tauri::generate_context!())
        .expect("failed to run Tessera desktop app");
}
