#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::Command;
use std::sync::atomic::{AtomicBool, Ordering};
use std::time::Duration;
use std::thread;
use tauri::{GlobalShortcutManager, Manager};

// Throttle shortcut handling so holding the keys doesn't spam.
static SHORTCUT_BUSY: AtomicBool = AtomicBool::new(false);

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
            // Register the global shortcut to summon the Spotlight-like UI.
            // Shift+L (uppercase L) will emit an event to the frontend.
            let app_handle = app.handle();
            app.global_shortcut_manager()
                .register("Shift+L", move || {
                    if SHORTCUT_BUSY.swap(true, Ordering::SeqCst) {
                        return;
                    }
                    // Notify frontend and also type a sample text to make it visible the shortcut fired.
                    let _ = app_handle.emit_all("show-spotlight", ());

                    // Delay the typing slightly so key-up for Shift+L completes, preventing missing letters.
                    thread::spawn(|| {
                        thread::sleep(Duration::from_millis(200));
                        let _ = type_text("Hello World".to_string());
                        // Release after a short delay to avoid key-repeat spam.
                        thread::sleep(Duration::from_millis(300));
                        SHORTCUT_BUSY.store(false, Ordering::SeqCst);
                    });
                })
                .map_err(|e| e)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![type_text])
        .run(tauri::generate_context!())
        .expect("error while running Prompt Engine");
}
