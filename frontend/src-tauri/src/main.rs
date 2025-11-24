#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::Command;
use tauri::{window::WindowBuilder, GlobalShortcutManager, Manager};

/// Send a text payload to the OS by pasting it, which is more reliable than
/// keystroking each character when modifiers (like Shift) were just pressed.
/// macOS requires Accessibility permission for the keystroke.
#[tauri::command]
fn type_text(text: String) -> Result<(), String> {
    let escaped = text.replace('\\', "\\\\").replace('"', "\\\"");
    let script = format!(
        r#"
set oldClipboard to the clipboard
set the clipboard to "{}"
delay 0.05
tell application "System Events" to keystroke "v" using {{command down}}
delay 0.05
set the clipboard to oldClipboard
"#,
        escaped
    );

    Command::new("osascript")
        .arg("-e")
        .arg(script)
        .status()
        .map_err(|e| e.to_string())
        .and_then(|status| {
            if status.success() {
                Ok(())
            } else {
                Err("osascript exited with error".into())
            }
        })
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            // Create a dedicated launcher window, hidden by default.
            WindowBuilder::new(
                app,
                "launcher",
                tauri::WindowUrl::App("index.html?window=launcher".into()),
            )
            .title("Prompt Engine Launcher")
            .visible(false)
            .decorations(false)
            .always_on_top(true)
            .resizable(false)
            .inner_size(760.0, 520.0)
            .build()
            .ok();

            // Global shortcut: Cmd+Option+L → show launcher window and notify frontend.
            // Keep the handler minimal to avoid prior accelerator issues.
            #[cfg(target_os = "macos")]
            {
                let handle = app.handle();
                let mut shortcuts = app.global_shortcut_manager();
                shortcuts
                    .register("Command+Option+L", move || {
                        if let Some(window) = handle.get_window("launcher") {
                            let _ = window.show();
                            let _ = window.set_focus();
                            let _ = handle.emit_all("show-spotlight", ());
                        }
                    })
                    .map_err(|e| e)?;
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![type_text])
        .run(tauri::generate_context!())
        .expect("error while running Prompt Engine");
}
