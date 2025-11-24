<!-- ui_flow.md -->

# Prompt Engine – UI Flow Specification (Desktop Client)

Target client: Tauri + React  
Primary persona: internal engineer (consumer/contributor), prompt owner, admin.

## 1. Global Layout & Navigation

- **Global Shell**
  - Left sidebar: navigation + filters.
  - Top bar: environment label, user avatar, quick search.
  - Main content: list/detail/panel pattern.
- Primary navigation:
  - `Library` (all prompts)
  - `My Prompts`
  - `Approvals`
  - `Usage`
  - `Settings`

## 2. Core Flows

### 2.1 Prompt Discovery & Use

**Entry point:** `Library` tab.

Flow:
1. User opens `Library`.
2. Main panel shows prompt list:
   - Columns: name, collection, tags, status, owner, last used.
   - Filters: collection, tag, status, owner, “Only approved”.
3. User types in global search bar:
   - Searches by name, description, tags, content snippets.
4. User clicks a prompt row:
   - Right-side drawer opens with:
     - Metadata (collection, tags, status, owner).
     - Current version details (content, input schema).
     - Template preview: “Inputs” form based on `input_schema`.
5. User fills in form fields (e.g., `code`, `focus`).
6. User clicks `Generate snippet`:
   - Client runs local expansion (optional) or just builds a ready-to-paste template for Codex/ChatGPT.
7. User clicks:
   - `Copy to clipboard` OR
   - `Insert into active window` (through OS integration if permitted).

States:
- Prompt without approved version → show warning “No approved versions; you see latest draft.”
- Permission: consumers only see `approved` versions by default.

### 2.2 Prompt Creation & Drafting

**Entry point:** `My Prompts` → `New Prompt`.

Flow:
1. User clicks `New Prompt`.
2. Modal or dedicated page with steps:
   - Step 1: Basic info (name, display name, description, collection, tags).
   - Step 2: Prompt content:
     - System prompt area (main content).
     - Optional sections for input instructions, output style.
   - Step 3: Input schema:
     - JSON editor or form builder for request schema.
   - Step 4: Parameters:
     - Temperature, max tokens, model hints (optional).
3. User clicks `Save draft`.
4. System creates:
   - `Prompt` (if first time).
   - Initial `PromptVersion` with `status = draft`.
5. After saving:
   - Show `Submit for approval` button.

### 2.3 Versioning & Diff View

From a prompt detail page:

1. `Versions` tab lists all versions:
   - Columns: version number, status, created by, created at, approved by.
2. User selects two versions and clicks `Compare`:
   - Side-by-side diff view:
     - Content diff (syntax highlighting).
     - Schema diff (JSON diff).
     - Parameter diff.
3. Owner can:
   - Mark `approved` version as `current` (if multi-approved).
   - Deprecate older versions.

### 2.4 Approval Workflow

**Entry point:** `Approvals` tab for approvers/admins.

Flow:
1. `Approvals` shows:
   - List of pending requests with columns: prompt, version, requester, created at, collection.
2. Approver clicks row:
   - Detail panel with:
     - Version content.
     - Schema, parameters.
     - Change notes and diff vs previous version.
3. Approver actions:
   - `Approve` (optionally “set as current version” toggle).
   - `Reject` (with mandatory comment).
4. After action:
   - Status updated.
   - Request removed from pending list.
   - Notification hook (future: Feishu).

### 2.5 Usage & Analytics View

**Entry point:** `Usage` tab (owners/admins).

Flow:
1. Default view:
   - Top prompts by usage in current period.
   - Filters: time range, collection, team (via `project_key`), client type.
2. Selecting a prompt:
   - Trend chart (usage over time).
   - Breakdown by client type and project.
   - Top consumers (if allowed by policy).
3. Owner can:
   - Spot unused or overused prompts.
   - Identify candidates for deprecation or refactoring.

### 2.6 Settings & Environment

**Entry point:** `Settings` → `Environment`.

Features:
- Backend URL (read-only or editable for dev).
- Current environment label (dev/staging/prod).
- Token management:
  - Show “Connected to SSO” or “API key configured”.
- Integration toggles (future):
  - Enable/disable OS-level hotkey.
  - MCP/Feishu connection.

---

## 3. OS Integration Flow (Desktop Injection)

Goal: Minimal, predictable behavior.

### 3.1 Global Hotkey Use

Flow:
1. User in any application (IDE, browser, editor).
2. Press global hotkey (e.g., `Ctrl+Shift+P`):
   - Small overlay opens (Tauri window):
     - Search bar.
     - Recent prompts list.
3. User searches and selects prompt.
4. If prompt has schema:
   - Inline form pops up with required fields.
5. On submit:
   - Client expands prompt template.
   - Option:
     - `Copy only`.
     - `Insert into active window` (simulate keystrokes / clipboard paste).
6. Overlay closes.

Constraints:
- Must be non-intrusive, fast, and keyboard driven.
- Respect security/IT policies regarding keystroke automation.

---

### 3.2 Spotlight Flow (Ctrl+Alt+Space)

Target: sub-3s from hotkey to prompt delivery, offline-friendly.

Flow:
1. User presses global hotkey `Ctrl+Alt+Space` (configurable).
2. Spotlight overlay appears (no mouse required):
   - Input box focused by default.
   - List shows recent + cached prompts (approved-only unless user toggles).
3. User types keywords:
   - Primary search hits local cache immediately (name/description/tags/content snippets).
   - If cache miss and online: background fetch to refresh list; show “syncing…” hint.
   - If offline: keep cache-only results; show offline badge.
4. User selects a prompt:
   - If prompt has no variables → instantly compose final string → write to clipboard.
   - If prompt has variables → show inline form for required fields (keyboard-first).
5. User confirms:
   - Compose final prompt string (system prompt + filled variables).
   - Write to clipboard via Tauri; optional “Auto-paste” toggle triggers simulated `Ctrl+V`.
6. Spotlight closes and returns focus to previous app; on failure, keep overlay and show error toast.

Constraints & guardrails:
- Latency budget: open + initial results ≤ 300ms from cache; background fetch must not block typing.
- Security: clipboard write and keystroke simulation require explicit user opt-in; persist preference.
- Governance: default to approved versions; if draft/experimental selected, surface warning chip.
- Accessibility: full keyboard navigation (arrow/enter), escape to close, screen-reader labels for controls.

States to handle:
- Empty results: show guidance to open full Library or clear filters.
- Partially filled variables: block submit with inline validation hints.
- Sync failure: degrade gracefully to cache, show retry.

Instrumentation:
- Log hotkey opens, search latency, cache hits/misses, clipboard success/fail, auto-paste usage.

## 4. UX Principles

- Default to **approved** prompts for safety and consistency.
- Make **status, owner, and last update** always visible.
- Emphasize **diff and history** for trust and governance.
- Optimize for **speed**:
  - All core flows ≤ 3 clicks + minimal input.
- Avoid overwhelming non-technical users:
  - Hide complex schema details by default with “Advanced” sections.
