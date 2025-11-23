# Prompt Engine – Codex Agent Specification

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

