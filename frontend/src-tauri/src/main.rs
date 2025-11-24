#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::Command;
use tauri::{window::WindowBuilder, GlobalShortcutManager, Manager};

#[cfg(target_os = "macos")]
use core_graphics::event::CGEvent;
#[cfg(target_os = "macos")]
use core_graphics::{display::CGDisplay, event_source::CGEventSourceStateID};
#[cfg(target_os = "macos")]
use tauri::{PhysicalPosition, Position};

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

/// Move the spotlight window to the monitor under the current cursor and center it.
#[cfg(target_os = "macos")]
fn position_spotlight_on_cursor(window: &tauri::Window) {
    let cursor = match core_graphics::event_source::CGEventSource::new(CGEventSourceStateID::CombinedSessionState)
        .and_then(|src| CGEvent::new(src))
        .map(|event| event.location())
    {
        Ok(point) => point,
        Err(_) => return,
    };

    let displays = match CGDisplay::active_displays() {
        Ok(list) if !list.is_empty() => list,
        _ => return,
    };

    // Use CoreGraphics coordinates directly: origin and size from CGDisplay bounds are in the same
    // space as CGEvent locations. We'll convert to physical pixels using the per-display scale.
    let mut selected = None;
    for display_id in &displays {
        let display = CGDisplay::new(*display_id);
        let bounds = display.bounds();
        let scale = if bounds.size.width > 0.0 {
            display.pixels_wide() as f64 / bounds.size.width
        } else {
            1.0
        };
        if scale <= 0.0 {
            continue;
        }

        let within_x = cursor.x >= bounds.origin.x && cursor.x <= bounds.origin.x + bounds.size.width;
        let within_y = cursor.y >= bounds.origin.y && cursor.y <= bounds.origin.y + bounds.size.height;
        if within_x && within_y {
            selected = Some((bounds, scale));
            break;
        }
    }

    let (bounds, scale) = selected.unwrap_or_else(|| {
        let display = CGDisplay::new(displays[0]);
        let bounds = display.bounds();
        let scale = if bounds.size.width > 0.0 {
            display.pixels_wide() as f64 / bounds.size.width
        } else {
            1.0
        };
        (bounds, scale.max(1.0))
    });

    let window_size = match window.outer_size() {
        Ok(size) => size,
        Err(_) => return,
    };

    let window_w_points = window_size.width as f64 / scale;
    let window_h_points = window_size.height as f64 / scale;

    let target_x_points = bounds.origin.x + ((bounds.size.width - window_w_points) / 2.0);
    let target_y_points = bounds.origin.y + ((bounds.size.height - window_h_points) / 2.0);

    let target_x = (target_x_points * scale).round() as i32;
    let target_y = (target_y_points * scale).round() as i32;

    let _ = window.set_position(Position::Physical(PhysicalPosition { x: target_x, y: target_y }));
}

#[cfg(not(target_os = "macos"))]
fn position_spotlight_on_cursor(_window: &tauri::Window) {}

#[tauri::command]
fn reposition_spotlight(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_window("spotlight") {
        position_spotlight_on_cursor(&window);
        return Ok(());
    }

    Err("spotlight window not found".into())
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            // Create a dedicated spotlight window, hidden by default.
            WindowBuilder::new(
                app,
                "spotlight",
                tauri::WindowUrl::App("index.html?window=spotlight".into()),
            )
            .title("Prompt Engine Spotlight")
            .visible(false)
            .decorations(false)
            .always_on_top(true)
            .resizable(false)
            .inner_size(760.0, 520.0)
            .build()
            .ok();

            // Global shortcut: Cmd+Option+L → show the spotlight window and focus it.
            // Keep the handler minimal to avoid prior accelerator issues.
            #[cfg(target_os = "macos")]
            {
                let handle = app.handle();
                let mut shortcuts = app.global_shortcut_manager();
                shortcuts
                    .register("Command+Option+L", move || {
                        if let Some(window) = handle.get_window("spotlight") {
                            position_spotlight_on_cursor(&window);
                            let _ = window.show();
                            let _ = window.set_focus();
                            let _ = window.emit("show-spotlight", ());
                        }
                    })
                    .map_err(|e| e)?;
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![type_text, reposition_spotlight])
        .run(tauri::generate_context!())
        .expect("error while running Prompt Engine");
}
