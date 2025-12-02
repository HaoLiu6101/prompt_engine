# Prompt Engine – Codex Agent Specification

This file consolidates the agent specification and repository working rules for contributors. Use it as the single source of truth (replaces the former `AGENTS.md`).

## 1. Project Overview
The Prompt Engine is a cross-platform system that enables 100+ engineers to
create, manage, version, approve, and consume reusable prompts for software
development and internal R&D workflows.

The system includes:
- Desktop client (Tauri + React) for Mac/Windows/Linux.
- Backend service (FastAPI) including user management, prompt registry,
  versioning, approval workflow, and access control.
- Local Codex integration for authoring prompts and managing project structure.
- Future MCP integration for Feishu and internal tools.

The Agent’s responsibility:
- Generate production-grade code.
- Enforce architecture & coding conventions.
- Produce incremental changes (diff-based) when touching existing modules.
- Ask for missing functional requirements before generating code.

The Agent does NOT:
- Invent unapproved API endpoints, schema fields, or UX flows.
- Rewrite or refactor major components unless explicitly instructed.
- Assume unspecified business logic.

---

## 2. Architecture Requirements

### 2.1 Frontend (Desktop Client)
- Framework: React + TypeScript + Tauri
- Structure:
  /src
    /app
    /components
    /features
    /services
    /stores (Zustand)
    /routes
  /public
  /tauri

Design principles:
- Unidirectional data flow.
- Clean separation between UI, services, and data stores.
- All API calls go through a typed API layer.

### 2.2 Backend (FastAPI)
- Python 3.11
- Structure:
  /app
    /api
    /core
    /models
    /schemas
    /services
    /repository
    /auth
    /tests

Key backend requirements:
- Use Pydantic Model for all schemas.
- Use SQLAlchemy ORM.
- Always follow Dependency Injection for DB sessions.
- Implement RBAC: admin / contributor / viewer.
- Prompt objects must support versioning & approval workflow.

### 2.3 Future Integrations
- MCP endpoints (Feishu)
- RAG-based prompt search (optional)
- Codex CLI local integration (prompt authoring)

Agent must generate code that keeps flexibility for these integrations.

---

# Repository Working Rules

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

---

## 3. Coding and Output Standards

### 3.1 General Code Rules
- Must be production-grade.
- Always type-safe (mypy-compliant).
- Use clear naming aligned to business domain.

### 3.2 API Standards
- REST-style endpoints.
- JSON only.
- Error structure: { "error": "message", "code": int }.

### 3.3 Documentation
The agent must generate:
- API docstrings
- Module-level comments
- Inline comments for complex logic

### 3.4 Testing Standards
- pytest + coverage
- For each backend service, include at least one unit test and one integration test.

---

## 4. Agent Workflow Rules

### 4.1 Task Processing Model
When receiving tasks, the agent shall:
1. Clarify ambiguous requirements.
2. Propose short architecture options if relevant.
3. Generate code in incremental steps:
   - Scaffold
   - Domain models
   - Services
   - API layer
   - UI integration

### 4.2 Diff Mode for Existing Files
When modifying existing files:
- Use unified diff format.
- Only modify the minimum required code.
- Explain the rationale concisely.

### 4.3 Multi-file Tasks
If multiple files change:
- Report file list
- Provide separate blocks per file
- Ensure path correctness

---

## 5. Guardrails

### 5.1 Things the Agent Must Not Do
- Must not create unapproved features.
- Must not assume backend schemas not defined by user.
- Must not bypass architecture rules.
- Must not generate placeholder code without timestamps or explicit TODO tags.

### 5.2 When Uncertain
The agent must ask questions and request clarification.

### 5.3 Output Restrictions
- No long-winded explanations.
- No high-level fluff.
- All answers must be actionable and technically correct.

---

## 6. Project Preferences (Important)

### 6.1 Style
- Concise, deterministic, engineering-driven output.
- Non-speculative architecture proposals.

### 6.2 Innovation / Forward-thinking
When designing architecture, always consider:
- Plugin ecosystem
- Scalability to 1M prompts
- Offline capability in desktop client
- Compatibility with internal AI agents
