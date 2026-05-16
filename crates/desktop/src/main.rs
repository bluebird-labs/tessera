#[tauri::command]
const fn app_name() -> &'static str {
    tessera_core::APP_NAME
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![app_name])
        .run(tauri::generate_context!())
        .expect("failed to run Tessera desktop app");
}
