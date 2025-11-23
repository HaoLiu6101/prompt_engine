<!-- api_spec.md -->

# Prompt Engine – API Specification (v1)

Base URL (example):
- `https://prompt-engine.internal/api/v1`

Auth:
- Header: `Authorization: Bearer <token>`
- For CLI/service tokens: `X-Api-Key: <key>` (optional mode)

Common response envelope for errors:
```json
{ "error": "message", "code": 1234 }
```

## 1. Authentication and Users APIs

### 1.1 POST /auth/login
- Purpose: Issue JWT for email/password or SSO token
- Request: (email/password)
```json
{"email": "...", "password": "..."}
```
- Response:
```json
{"access_token": "...", "token_type": "bearer", "expires_in": 3600}
```

### 1.2 GET /auth/me
- Purpose: Returns current user info
- Response:
```json
{
    "id": "uuid",
    "email": "user@example.com",
    "display_name": "User",
    "roles": ["admin", "contributor"]
}
```
### 1.3 GET /users
- Roles: admin 
- Query:
    - `page`: int, default 1
    - `page_size`: int, default 20
    - `roles`: string, comma-separated list of roles
- Response: paginated list of users

### 1.4 PATCH /users/{user_id}
- Roles: admin
- Fields: roles, is_active, display_name

## 2. Prompts API

### 2.1 GET /prompts
- Purpose: Search/list prompts
- Query:
    - `q` search term 
    - `tags`: string, comma-separated list of tags
    - `collection_id`
    - `status`: string, draft/pending/approved/deprecated
    - `owner_id`: string, user ID
    - `page`: int, default 1
    - `page_size`: int, default 20
- Response: paginated list of prompts

``` json
{
    "items": [
        {
            "id": "uuid",
            "name": "python_code_review",
            "display_name": "Python Code Review",
            "description": "Review Python code with focus on correctness and performance.",
            "current_version_id": "uuid",
            "status": "approved",
            "owner_id": "uuid",
            "tags": ["python", "code-review"]
        }
    ],
    "total": 1,
    "page": 1,
    "page_size": 20
}
```

### 2.2 POST /prompts
- Roles: admin, contributor
- Request:
``` json
{
  "name": "python_code_review",
  "display_name": "Python Code Review",
  "description": "Review Python code...",
  "collection_id": "uuid-or-null",
  "tags": ["python", "code-review"],
  "initial_version": {
    "content": "You are a senior Python reviewer...",
    "input_schema": {
      "type": "object",
      "properties": {
        "code": { "type": "string" },
        "focus": { "type": "string" }
      },
      "required": ["code"]
    },
    "parameters": {
      "temperature": 0.2
    },
    "notes": "Initial version."
  }
}
```
- Response: `prompt` with `PromptVersion`

### 2.3 GET /prompts/{prompt_id}
- Purpose: Get prompt with its `current_version` and minimal metadata 

### 2.4 PATCH /prompts/{prompt_id}
- Roles: admin, contributor
- Updatable fields: `display_name`, `description`, `collection_id`, `tags`, `status`(limited)

### 2.5 POST /prompts/{prompt_id}/versions
- Roles: `contributor` with rights 
- Purpose: Create new prompt version (draft)
- Request:
``` json
{
  "content": "Updated system prompt...",
  "input_schema": {...},
  "parameters": {...},
  "notes": "Tweaked output style."
}
```
- Response: `PromptVersion` (status = `draft`)

### 2.6 GET /prompts/{prompt_id}/versions
- Query: status, page, page_size.
- Response: list of versions.

### 2.7 GET /prompt-versions/{version_id}
- Full version info

## 3 Approval Workflow API

### 3.1 POST /prompt-versions/{version_id}/submit
- Purpose: Mark version as pending_approval.
- Roles: author or owner.
- Response: updated version with status.

### 3.2 POST /prompt-versions/{version_id}/approve
- Roles: admin / approver
- Request:
``` json
{
  "decision": "approve",
  "comment": "Looks good for global use."
}
```
- Effects:
    - Version status = `approved`
    - Optionally becomes `current_version` of its prompt

### 3.3 POST /prompt-versions/{version_id}/reject
- Roles: admin / approver
- Request:
``` json
{
    "decision": "reject",
    "comment": "Needs more details."
}
```

### 3.4 GET /approval-requests
- Roles: admin/ approver
- List pending approvals assigned to user or role 

## 4 Collections & Tags
### 4.1 GET /collections

- List collections (e.g., thermal, embedded, ml).

### 4.2 POST /collections

- Roles: admin or specific collection_admin.

### 4.3 GET /tags

- Returns all tags with usage counts.


## 5. Usage & Analytics

### 5.1 POST /usage
- Purpose: Log usage event.
- Client types: desktop, web, codex, other.
- Request:
``` json
{
  "prompt_id": "uuid",
  "version_id": "uuid",
  "client_type": "desktop",
  "project_key": "thermal-hvac-2025",
  "context": {
    "language": "python",
    "repo": "git@...",
    "file": "src/...",
    "branch": "feature/x"
  }
}
```

### 5.2 GET /usage/summary

- Roles: admin, owner.
- Query: prompt_id, from, to, group_by (user, team, collection).
- Returns aggregated data.

## 6 Admin/Configuration

### 6.1 GET /config/client
- Returns client-relevant config:
    - Feature flags.
    - Environment label.
    - Recommended model hints per domain (optional).

### 6.2 GET /health
- liveness check
- returns {"status": "ok"}

### 6.3 GET /ready
- readiness check: DB, cache connectivity
- returns {"status": "ok"}
