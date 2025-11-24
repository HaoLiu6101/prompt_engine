# Prompt Engine

Internal platform for authoring, approving, and consuming reusable prompts. Current status: frontend scaffold (React + Vite, Tauri shell placeholder), architecture and data model specs, backend not yet implemented.

## Structure
- `frontend/`: React + TypeScript + Vite app scaffolded for Tauri.
- `specs/`: Architecture, data models, and placeholders for API/flows.
- `backend/`: Empty placeholder for FastAPI backend.

## Quickstart (frontend)
```bash
cd frontend
npm install
npm run dev
```
Then open the shown URL (defaults to `http://localhost:5173`). The default route is a Welcome screen; additional routes: `/home`, `/prompts`.

## Tauri
`frontend/tauri/tauri.conf.json` is a placeholder. Initialize Rust side later (e.g., `cargo tauri init`) and wire the Vite dist output.

## Coding standards
- React + TypeScript, Vite.
- Zustand for client state, React Router for navigation.
- Lint via `npm run lint` (ESLint + TypeScript).

## Next steps
- Implement backend (FastAPI + Postgres) per `specs/`.
- Wire frontend API client to real endpoints and add auth flows.
- Build Tauri Rust host and OS integrations (secure token storage, shortcuts).
