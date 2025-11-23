<!-- architecture.md -->

# Prompt Engine – Architecture

## 1. System Overview

The Prompt Engine is an internal platform that enables ~100 engineers to create, version, approve, and consume reusable prompts across multiple client environments (desktop, web, Codex, future MCP integrations).

High-level goals:
- Single source of truth for prompts and metadata.
- Strong governance (roles, approvals, audit).
- Low-friction consumption from local tools (desktop, editors, Codex).

## 2. Logical Architecture

Layers:

- **Client Layer**
  - Desktop client: Tauri + React (Mac/Windows/Linux).
  - Web admin console (optional, same React codebase).
  - Editor / Codex integration (uses backend APIs + local SDK).

- **Service Layer (FastAPI)**
  - `auth-service`: authentication, authorization, token issuance.
  - `prompt-service`: prompt CRUD, versioning, approval workflows.
  - `catalog-service`: search, tagging, collections, recommendations (later).
  - `usage-service`: logging, analytics, rate limiting, safety checks.

- **Data Layer**
  - PostgreSQL: core data (users, roles, prompts, versions, approvals, usage logs).
  - Redis (optional): caching, rate limiter, ephemeral sessions.
  - Object storage (future): attachments, large artifacts, export/import files.

- **Integration Layer**
  - Feishu MCP: document search, notification, task integration.
  - Codex SDK: local AI agent that calls the backend.
  - Windows/Mac OS injection layer (e.g., system hotkey → local agent → API).

## 3. Deployment Topology

- **Backend**
  - Stateless FastAPI app behind reverse proxy.
  - One PostgreSQL instance (primary + replicas later).
  - Optional Redis cluster for cache/locks.

- **Client**
  - Desktop app deployed via installers; config holds backend base URL + API key / OAuth.
  - Codex projects store local references to Prompt Engine APIs.

### 3.1 Environment Separation

- `dev`: rapid iteration, seeded test data.
- `staging`: mirrors production schema, pre-release validation.
- `prod`: strict migrations, audited changes.

## 4. Key Subsystems

### 4.1 Authentication & Authorization

- Identity options:
  - Internal SSO / OAuth2 or company IdP.
  - Local dev: email+password + API key.
- RBAC model:
  - `admin`: manage users, roles, system config.
  - `prompt_owner`: own specific prompt families.
  - `contributor`: propose/edit prompts, submit for approval.
  - `consumer`: read and use approved prompts only.

### 4.2 Prompt Management

Concepts:
- `Prompt`: logical entity (e.g., "Python code review").
- `PromptVersion`: immutable version with content, parameters, metadata.
- `PromptCollection`: grouping by domain or team.
- `Tag`: free-form labels (e.g., `ml`, `thermal`, `embedded`).

Lifecycle:
1. Draft created by contributor.
2. Owner / approver reviews.
3. Approved version published as `active`.
4. Deprecation or replacement tracked via status.

### 4.3 Approval Workflow

- Configurable approval rules:
  - Simple: single approver (prompt owner or admin).
  - Strict: dual approval required for “global” prompts.
- All transitions logged:
  - who, when, from status → to status, comment.

### 4.4 Usage & Analytics

- Log each usage:
  - `user_id`, `prompt_id`, `version_id`, `client_type`, `timestamp`, optional context.
- Expose aggregated metrics:
  - Top prompts, per-team usage, error rates, unsafe content flags.

## 5. Client Architecture (Tauri + React)

- Architecture:
  - React SPA embedded in Tauri.
  - IPC between UI and Rust side for:
    - Secure storage of tokens.
    - OS integration (global shortcut, clipboard, foreground window access).
  - API layer in front-end:
    - Typed client for `/api/v1/...`.
    - Centralized error handling & retry logic.

Key flows:
- Login → token stored securely via Tauri API.
- Prompt search → select → preview → copy/insert into active window.
- Offline behavior (future): local cache of favorites and recent prompts.

## 6. Codex / Tooling Integration

- Local projects reference prompts via:
  - Prompt IDs, aliases, or tags.
- Codex agent:
  - Queries backend for relevant prompts given repo + task context.
  - Enforces usage of approved prompts by default.
  - Optional “experimental” channel gated by role/flag.

## 7. Non-Functional Requirements

- Reliability: target 99.9% uptime for core APIs.
- Performance:
  - Prompt search: p95 < 200 ms for typical queries.
  - List endpoints paginated; no unbounded responses.
- Security:
  - All external calls over TLS.
  - Row-level security for multi-team scenarios (future).
- Observability:
  - Structured logs, correlation IDs.
  - Metrics on API latency, error rate, and auth failures.

