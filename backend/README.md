# Prompt Engine Backend (skeleton)

FastAPI + PostgreSQL backend scaffold for prompt sync/submit flows. Implements basic prompt listing, retrieval, and creation with Alembic migrations ready.

## Quickstart

```bash
cd backend
cp .env.example .env
pip install -r requirements-dev.txt
# start Postgres + API
docker-compose up --build
# or run locally
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## Environment

- `DATABASE_URL` (required): e.g. `postgresql+asyncpg://prompt_engine:prompt_engine@localhost:5432/prompt_engine`
- `APP_ENV`: `dev` enables auto table creation on startup (for local only).
- `API_V1_PREFIX`: defaults to `/api/v1`.

## API (initial)

- `GET /health` – liveness.
- `GET /api/v1/prompts?since=<iso8601>` – list prompts (supports incremental sync via `since` updated_at cursor; returns `next_cursor`).
- `GET /api/v1/prompts/{id}` – prompt detail with current version.
- `POST /api/v1/prompts` – create prompt + initial approved version. Request body:
  ```json
  {
    "name": "python-review",
    "display_name": "Python Review",
    "description": "Code review helper",
    "content": "...prompt text...",
    "notes": "seeded from client"
  }
  ```

JWT/auth is stubbed for now; dependency hooks can be added in `app/api/deps.py`.

## Migrations

- Generate: `make revision`
- Apply: `make migrate`

Alembic config reads `DATABASE_URL` from `.env`.
