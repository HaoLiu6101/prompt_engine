<!-- code_guidelines.md -->

# Prompt Engine – Code Guidelines

Audience: contributors across backend (FastAPI/Python), frontend (React/Tauri), and shared infra. Keep changes small, observable, and reversible.

## 1) General Principles

- Prefer clarity over cleverness; choose explicit names and fail loudly.
- Small, focused PRs with tests; avoid cross-cutting refactors without RFC.
- Default to immutability; avoid shared mutable state across threads/tasks.
- Guardrails first: input validation, type hints, bounds, and invariants.
- Log with context (ids, actor, environment), not raw payloads or secrets.
- Feature flags for risky changes; defaults safe for production.
- Treat errors as data: structured errors, machine-parsable codes.

## 2) Backend (FastAPI / Python)

- Python: 3.11+, `ruff` + `black` style; `mypy --strict` for core modules.
- Dependency hygiene: pin in `requirements*.txt`; avoid heavy deps in hot paths.
- API shape:
  - Request/response models via `pydantic` v2; strict types, no `Any` in schemas.
  - Stable enums/ids in public contracts; versioned routes under `/api/v1`.
  - Return 4xx for client issues, 5xx for server faults; include `error_code`.
- AuthZ/AuthN:
  - Enforce RBAC in handlers; never trust client-sent role/owner fields.
  - Propagate `request_id`, `user_id`, `env` through service calls and logs.
- Data access:
  - Use repository layer; no raw SQL in handlers. Transactions for multi-step writes.
  - Concurrency-safe operations for versioning/approvals (optimistic locking).
- Testing:
  - Fast unit tests with fixtures/fakes; integration tests hit ephemeral Postgres.
  - Contract tests for APIs consumed by clients/Codex.

## 3) Frontend (React / Tauri)

- TypeScript strict mode; no `any`. Prefer discriminated unions for state.
- State management:
  - Server cache: `react-query` (or equivalent). Local UI: `useState`/`useReducer`.
  - Avoid global singletons; scopes per window/feature.
- Networking:
  - Typed client generated from OpenAPI; handle 401/403/5xx with toasts + retry/backoff.
  - Never store secrets in localStorage; use secure OS keychain via Tauri API.
- UI/UX:
  - Keep primary flows keyboard-first; loading/skeletons for list/detail panes.
  - Diff views use monospaced fonts and syntax highlighting; wrap long lines.
  - Accessibility: focus traps in dialogs, aria labels for inputs/buttons.
- Desktop specifics:
  - Guard clipboard/keystroke injection behind explicit user action and setting.
  - Hotkey handlers debounced; ensure clean unregister on window close.

## 4) Data & Schema Governance

- Schema changes go through migration files with up/down steps; no destructive alters without data plan.
- Versioned prompt content: append-only versions; never mutate approved versions in place.
- Soft-delete entities; keep audit columns (created_by/at, updated_by/at, status).
- Tagging/collections: enforce referential integrity and uniqueness constraints.

## 5) Observability & Operations

- Structured logging (JSON) with redaction for PII/secrets; sampling for noisy paths.
- Metrics: latency, error rate, approvals throughput, prompt usage counters.
- Tracing: propagate trace/span ids across client ↔ server ↔ DB where available.
- Health checks: liveness (process), readiness (DB/cache), feature flags.
- Feature toggles and config read from env; single source of truth per environment.

## 6) Security & Privacy

- Inputs sanitized; block prompt content that contains secrets or credentials.
- Rate limiting on public-ish endpoints; per-user and per-project where relevant.
- Least privilege for service accounts/API keys; rotate keys; avoid embedding tokens in prompts.
- Do not log prompt bodies or user-provided inputs in plain text; hash when needed for joins.

## 7) Testing & Quality Gates

- CI gates: lint (`ruff`/`eslint`), format check, type check, unit tests, API contract tests.
- New features require tests; regressions require reproduction + guard test.
- Snapshots limited to stable UI pieces; prefer screen queries over testids.

## 8) Documentation & DX

- Every public API/resource documented in `specs/api_spec.md` (OpenAPI source of truth when available).
- README snippets must be runnable; include minimal setup steps and sample calls.
- Add `ADR` entries for major architectural decisions; link to PRs and owners.
- Comment complex flows; avoid redundant comments. Keep inline docs close to code.

## 9) Performance Hints

- Avoid N+1 queries; batch or prefetch. Cache read-mostly metadata (collections/tags).
- Use streaming for large prompt exports; paginate lists (default 20–50).
- Prefer async I/O for API calls; avoid CPU-bound work on request threads.

## 10) Release & Rollback

- Backend: blue/green or canary where possible; db migrations forward-compatible.
- Frontend: versioned API clients; feature flags to hide in-flight features.
- Keep rollback scripts/checklists in release notes; ensure migrations reversible.
