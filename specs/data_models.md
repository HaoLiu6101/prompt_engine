<!-- data_models.md -->

# Prompt Engine – Data Models

Target DB: PostgreSQL  

Notation:
- `PK` primary key
- `FK` foreign key
- `idx_*` index
- Timestamps in UTC

## 1. User & Role Model

### 1.1 users

- `id` UUID PK
- `email` text, unique, not null
- `display_name` text, not null
- `is_active` bool, default true
- `created_at` timestamptz, not null
- `updated_at` timestamptz, not null

Indexes:
- `idx_users_email_unique` (email, unique)

### 1.2 roles

- `id` UUID PK
- `name` text, unique (`admin`, `contributor`, `consumer`, `approver`, etc.)
- `description` text

### 1.3 user_roles

- `user_id` UUID FK → users.id
- `role_id` UUID FK → roles.id
- Composite PK: (`user_id`, `role_id`)

---

## 2. Prompt Domain Model

### 2.1 prompts

- `id` UUID PK
- `name` text, unique, not null (machine name; immutable)
- `display_name` text, not null
- `description` text
- `collection_id` UUID FK → prompt_collections.id (nullable)
- `owner_id` UUID FK → users.id
- `status` text, enum: `active`, `archived` (prompt-level lifecycle)
- `current_version_id` UUID FK → prompt_versions.id (nullable)
- `created_at` timestamptz
- `updated_at` timestamptz

Indexes:
- `idx_prompts_name_unique` (name, unique)
- `idx_prompts_collection` (collection_id)
- `idx_prompts_owner` (owner_id)

### 2.2 prompt_versions

- `id` UUID PK
- `prompt_id` UUID FK → prompts.id
- `version_number` int, not null (1, 2, 3, ...)
- `status` text enum:
  - `draft`
  - `pending_approval`
  - `approved`
  - `rejected`
  - `deprecated`
- `content` text (full prompt text, includes system/user role template)
- `input_schema` jsonb (JSON Schema)
- `parameters` jsonb (model hints, temperature, etc.)
- `notes` text
- `created_by` UUID FK → users.id
- `created_at` timestamptz
- `updated_at` timestamptz
- `approved_at` timestamptz (nullable)
- `approved_by` UUID FK → users.id (nullable)

Constraints:
- Unique (`prompt_id`, `version_number`)

Indexes:
- `idx_prompt_versions_prompt` (prompt_id)
- `idx_prompt_versions_status` (status)

### 2.3 prompt_collections

- `id` UUID PK
- `name` text, unique
- `display_name` text
- `description` text
- `created_at` timestamptz

### 2.4 tags

- `id` UUID PK
- `name` text, unique
- `description` text

### 2.5 prompt_tags

- `prompt_id` UUID FK → prompts.id
- `tag_id` UUID FK → tags.id
- PK: (`prompt_id`, `tag_id`)

---

## 3. Approval Workflow

### 3.1 approval_requests

Represents a single approval cycle for a given `prompt_version`.

- `id` UUID PK
- `prompt_version_id` UUID FK → prompt_versions.id
- `requested_by` UUID FK → users.id
- `requested_at` timestamptz
- `status` text enum: `pending`, `approved`, `rejected`
- `resolved_by` UUID FK → users.id (nullable)
- `resolved_at` timestamptz (nullable)
- `decision_comment` text (nullable)

Indexes:
- `idx_approval_requests_prompt_version` (prompt_version_id)
- `idx_approval_requests_status` (status)

---

## 4. Usage & Analytics

### 4.1 usage_events

- `id` bigserial PK
- `prompt_id` UUID FK → prompts.id
- `version_id` UUID FK → prompt_versions.id
- `user_id` UUID FK → users.id
- `client_type` text enum: `desktop`, `web`, `codex`, `cli`, `other`
- `project_key` text (optional label; free-form)
- `context` jsonb (language/repo/file, etc.)
- `created_at` timestamptz

Indexes:
- `idx_usage_prompt` (prompt_id, created_at DESC)
- `idx_usage_user` (user_id, created_at DESC)
- `idx_usage_project_key` (project_key)

---

## 5. Client & Integration Config

### 5.1 client_configs

Stores environment-level switches for clients.

- `id` UUID PK
- `name` text unique (e.g., `default`, `thermal_team`)
- `config` jsonb (feature flags, default filters, UI preferences)
- `created_at` timestamptz
- `updated_at` timestamptz

---

## 6. Auditing & System

### 6.1 audit_logs

- `id` bigserial PK
- `entity_type` text (`prompt`, `prompt_version`, `user`, etc.)
- `entity_id` UUID
- `action` text (`create`, `update`, `delete`, `approve`, `reject`, `login`, etc.)
- `performed_by` UUID FK → users.id
- `old_values` jsonb (nullable)
- `new_values` jsonb (nullable)
- `created_at` timestamptz

Indexes:
- `idx_audit_entity` (entity_type, entity_id, created_at DESC)

---

## 7. Future Extensions (Reserved)

Reserved tables/fields for future capabilities:

- `prompt_variants` (A/B regions, per-team overrides).
- `tenant_id` columns on all entities for multi-tenant scenario.
- `safety_policies` and associated `prompt_policy_links`.