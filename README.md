# Prompt Engine

Internal platform for authoring, approving, and consuming reusable prompts. Current status: desktop spotlight prototype (React + Vite + Tauri/Rust with a local SQLite library and global shortcut on macOS), architecture/data model specs, backend not yet implemented.

## Structure
- `frontend/`: React + TypeScript + Vite desktop app with a Tauri host in `src-tauri/` (Rust). The host seeds and queries a local SQLite library, exposes IPC commands, and registers a macOS global shortcut for the Spotlight window.
- `specs/`: Architecture, data models, and placeholders for API/flows.
- `backend/`: Empty placeholder for FastAPI backend.

## Quickstart (frontend)
```bash
cd frontend
npm install
# Desktop (Tauri) with global shortcut + local library
npm run tauri dev

# Web-only fallback (no global shortcut; uses in-memory fallback items)
npm run dev
```
Then open the shown URL (defaults to `http://localhost:5173`) or use the spawned desktop window. The default route is a Welcome screen; additional routes: `/home`, `/prompts`.

Spotlight:
- Press `Cmd+Option+L` (macOS) to open the Spotlight window, centered on the monitor under the cursor. If the dedicated Tauri window is unavailable, the inline overlay opens instead.
- Type to search the local library (SQLite via Rust IPC `search_library`), merged with in-memory fallback data so web mode still works.
- Navigate results with Arrow keys or click; Esc closes. Dev builds auto-open devtools for the spotlight window.
- Press `Enter` or use "Copy & close" to copy the selected prompt/snippet; clipboard uses Tauri in desktop mode and the browser Clipboard API on the web.

Spotlight flows (intended behavior):
- Activation: macOS global shortcut `Cmd+Option+L` triggers `reposition_spotlight` and shows the spotlight window; web-only mode relies on the inline overlay.
- Query + search: 220ms debounced search that preserves the last query when reopening so you can refine results; empty query shows recents.
- Selection: Arrow keys move the active row; clicking a row previews it and updates the active item.
- Copy + close: Enter copies the active item, flashes feedback, and closes after success; errors surface inline and keep focus on the input.
- Close: Esc (capture listener) or clicking the backdrop hides the overlay/window without touching the host shell.

## Tauri
Config lives at `frontend/src-tauri/tauri.conf.json`. The Rust host already wires IPC commands for library search/reseed and clipboard handling; macOS-only text insertion uses AppleScript and requires Accessibility permission if enabled later.

## Coding standards
- React + TypeScript, Vite.
- Zustand for client state, React Router for navigation.
- Lint via `npm run lint` (ESLint with TypeScript + React Hooks; import plugin is available if we later enable its rules).

## Next steps
- Implement backend (FastAPI + Postgres) per `specs/`.
- Wire frontend API client to real endpoints and add auth flows.
- Build Tauri Rust host and OS integrations (secure token storage, shortcuts).
