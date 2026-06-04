use std::path::PathBuf;

use serde::Serialize;
use tauri::{AppHandle, Manager, State};
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
            last_opened: project
                .last_opened
                .format(&time::format_description::well_known::Iso8601::DEFAULT)
                .unwrap_or_default(),
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

fn error_to_string(err: ProjectStoreError) -> String {
    err.to_string()
}

fn project_store(app: &AppHandle) -> Result<ProjectStore, Box<dyn std::error::Error>> {
    let base = app.path().app_data_dir()?;
    let db_path = base.join("tessera").join("projects.db");
    ProjectStore::open(&db_path).map_err(Into::into)
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
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
        ])
        .run(tauri::generate_context!())
        .expect("failed to run Tessera desktop app");
}
