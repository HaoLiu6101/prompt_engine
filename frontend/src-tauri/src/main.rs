#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{io, process::Command};
use tauri::{window::WindowBuilder, GlobalShortcutManager, Manager};

mod library;

#[cfg(target_os = "macos")]
use core_graphics::event::CGEvent;
#[cfg(target_os = "macos")]
use core_graphics::{display::CGDisplay, event_source::CGEventSourceStateID, geometry::CGPoint};
#[cfg(target_os = "macos")]
use objc::{msg_send, sel, sel_impl};
#[cfg(target_os = "macos")]
use objc::runtime::{Object, NO};
#[cfg(target_os = "macos")]
use tauri::{PhysicalPosition, Position};

/// Send a text payload to the OS by pasting it, which is more reliable than
/// keystroking each character when modifiers (like Shift) were just pressed.
/// macOS requires Accessibility permission for the keystroke. Includes guardrails
/// to ensure a text cursor exists before attempting to paste.
#[tauri::command]
fn type_text(text: String) -> Result<(), String> {
    #[cfg(not(target_os = "macos"))]
    {
        let _ = text;
        return Err("Insert is only supported on macOS right now.".into());
    }

    #[cfg(target_os = "macos")]
    {
        if text.trim().is_empty() {
            return Err("No text provided to insert.".into());
        }

        let script = r#"on run argv
    if (count of argv) is 0 then
        return "ERROR:MissingText"
    end if

    set textToInsert to item 1 of argv
    tell application "System Events"
        if not (UI elements enabled) then
            return "ERROR:UIAccessDisabled"
        end if
    end tell

    set targetAppName to "Prompt Engine"
    set timeoutDate to (current date) + 1
    repeat
        tell application "System Events"
            set frontApp to first process whose frontmost is true
            set frontAppName to name of frontApp
        end tell

        if frontAppName is not targetAppName then
            exit repeat
        end if

        if (current date) > timeoutDate then
            return "ERROR:PromptEngineFocused"
        end if
        delay 0.05
    end repeat

    tell application "System Events"
        try
            set focusedElement to value of attribute "AXFocusedUIElement" of frontApp
        on error errMsg
            return "ERROR:FocusLookupFailed|" & errMsg
        end try
    end tell

    if focusedElement is missing value then
        return "ERROR:NoFocusedElement"
    end if

    set oldClipboard to the clipboard
    set the clipboard to textToInsert
    delay 0.06
    try
        tell application "System Events" to keystroke "v" using {command down}
    on error errMsg
        set the clipboard to oldClipboard
        return "ERROR:PasteFailed|" & errMsg
    end try
    delay 0.06
    set the clipboard to oldClipboard
    return "OK:" & frontAppName
end run"#;

        let output = Command::new("osascript")
            .args(["-l", "AppleScript", "-e", script, &text])
            .output()
            .map_err(|e| e.to_string())?;

        if !output.status.success() {
            let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
            let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
            let message = if !stdout.is_empty() {
                stdout
            } else if !stderr.is_empty() {
                stderr
            } else {
                "osascript exited with error".into()
            };

            return Err(message);
        }

        let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();

        if stdout.starts_with("OK:") {
            return Ok(());
        }

        if let Some(rest) = stdout.strip_prefix("ERROR:") {
            let message = match rest {
                code if code.starts_with("UIAccessDisabled") => {
                    "Enable accessibility permissions for Prompt Engine to insert text.".to_string()
                }
                code if code.starts_with("PromptEngineFocused") => {
                    "Place the cursor in the app where you want to insert, then try again.".to_string()
                }
                code if code.starts_with("NoFocusedElement") => {
                    "No text cursor detected. Click into a text field and try again.".to_string()
                }
                code if code.starts_with("PasteFailed") => format!(
                    "Failed to paste using the clipboard: {}",
                    code.trim_start_matches("PasteFailed|")
                ),
                code if code.starts_with("FocusLookupFailed") => format!(
                    "Could not inspect the focused element: {}",
                    code.trim_start_matches("FocusLookupFailed|")
                ),
                code if code.starts_with("MissingText") => "No text provided to insert.".to_string(),
                other => other.to_string(),
            };

            return Err(message);
        }

        Err("Unexpected response from clipboard insert.".into())
    }
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

    let (bounds, target_scale) = selected.unwrap_or_else(|| {
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

    let window_scale = window.scale_factor().unwrap_or(1.0);
    if window_scale <= 0.0 {
        return;
    }

    // Convert the window size to logical points using the window's current DPI, then project
    // into the target display's physical pixels to avoid drifting when moving across monitors.
    let window_size_points = window_size.to_logical::<f64>(window_scale);

    // Center of the target display in points (CoreGraphics uses a bottom-left origin).
    let center_x_points = bounds.origin.x + (bounds.size.width / 2.0);
    let center_y_points = bounds.origin.y + (bounds.size.height / 2.0);

    // Desired top-left in points. We set the Cocoa window directly to avoid extra transforms.
    let left_points = (center_x_points - window_size_points.width / 2.0).round();
    let top_points = (center_y_points + window_size_points.height / 2.0).round();

    if let Ok(ns_window_ptr) = window.ns_window() {
        unsafe {
            let ns_window: *mut Object = ns_window_ptr as *mut _;
            let point = CGPoint::new(left_points, top_points);
            let _: () = msg_send![ns_window, setFrameTopLeftPoint: point];
        }
    } else {
        // Fallback: convert back to physical pixels using the target display scale.
        let _ = window.set_position(Position::Physical(PhysicalPosition {
            x: (left_points * target_scale) as i32,
            y: ((top_points - window_size_points.height) * target_scale) as i32,
        }));
    }
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
            let library = library::Library::initialize(&app.handle())
                .map_err(|e| io::Error::new(io::ErrorKind::Other, e))?;
            app.manage(library);

            // Create a dedicated spotlight window, hidden by default.
            WindowBuilder::new(
                app,
                "spotlight",
                tauri::WindowUrl::App("index.html?window=spotlight".into()),
            )
            .title("Prompt Engine Spotlight")
            .visible(false)
            .decorations(false)
            .transparent(true)
            .always_on_top(true)
            .resizable(false)
            .inner_size(760.0, 520.0)
            .build()
            .map(|window| {
                #[cfg(target_os = "macos")]
                unsafe {
                    if let Ok(ns_window_ptr) = window.ns_window() {
                        let ns_window: *mut Object = ns_window_ptr as *mut _;
                        // Remove the native window shadow so transparent corners
                        // around the rounded overlay don't show a square outline.
                        let _: () = msg_send![ns_window, setHasShadow: NO];
                    }
                }

                window
            })
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
        .invoke_handler(tauri::generate_handler![
            type_text,
            reposition_spotlight,
            library::search_library,
            library::list_library,
            library::reseed_library,
            library::sync_library_from_backend
        ])
        .run(tauri::generate_context!())
        .expect("error while running Prompt Engine");
}
