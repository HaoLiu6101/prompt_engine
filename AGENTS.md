# Repository Guidelines

## Project Structure & Modules
- Root: docs and specs live in `README.md` and `specs/` (architecture, data models). `tools/` holds local helpers; `backend/` is a placeholder for the future FastAPI service.
- Frontend desktop app: `frontend/` with React + TypeScript + Vite; Tauri host in `frontend/src-tauri/`; routes/components/features under `frontend/src/` (`app`, `components`, `features`, `routes`, `services`, `stores`). Tests live alongside code (e.g., `*.test.tsx`).
- Assets: static files in `frontend/public/`; build artifacts land in `frontend/dist/` and `frontend/src-tauri/target/` (do not commit).

## Build, Test, and Development
- Install deps: `cd frontend && npm install`.
- Web dev server: `npm run dev` (opens http://localhost:5173).
- Desktop (Tauri) dev: `npm run tauri dev` (desktop window + global shortcut).
- Production build: `npm run build`; preview with `npm run preview`.
- Lint: `npm run lint` (ESLint with TypeScript + React Hooks).
- Tests: `npm run test` (Vitest), `npm run test:watch`, `npm run test:coverage` for coverage reports.

## Coding Style & Naming
- TypeScript + React; prefer function components and hooks. Keep state in local components or Zustand stores in `frontend/src/stores/`.
- File naming: components `PascalCase.tsx`; hooks/utilities `camelCase.ts`; tests mirror source (`FeatureName.test.tsx`).
- Indentation: 2 spaces; stick to Prettier defaults; keep imports ordered logically (third-party → internal).
- Use ESLint rules from `frontend/.eslintrc.cjs`; fixable issues should be resolved (`npm run lint -- --fix`).

## Testing Guidelines
- Framework: Vitest + React Testing Library. Place tests near the code under test.
- Cover user-visible behavior (rendered headings/labels, keyboard flows, IPC calls). Prefer role/label queries over text literals.
- Name tests descriptively (`it('copies the selected prompt on Enter')`). Aim to keep async flows wrapped with `waitFor`.

## Commit & Pull Request Practices
- Follow Conventional Commit prefixes (`feat:`, `fix:`, `refactor:`, `test:`, `chore:`); keep subjects imperative and scoped.
- Commits should be focused (one logical change). Include tests or note why not.
- PRs: describe the change, linked issues, and how to verify (commands, routes). Add screenshots/GIFs for UI changes (web + desktop views). Call out risk areas (keyboard shortcuts, IPC, SQLite access).

## Security & Configuration Tips
- Tauri/clipboard/Search IPC lives in `frontend/src-tauri/`; avoid new IPC without validation. Never log secrets; sanitize errors before surfacing.
- macOS global shortcut defaults to `Cmd+Option+L`; keep consistency unless feature-flagged.
- Before shipping desktop changes, validate both web-only mode (`npm run dev`) and Tauri mode (`npm run tauri dev`) to ensure fallback behaviors remain intact.
