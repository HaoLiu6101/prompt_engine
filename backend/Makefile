PYTHON=python3
PIP=$(PYTHON) -m pip

install:
	$(PIP) install -r requirements-dev.txt

run:
	uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

lint:
	ruff check app

format:
	ruff check --select I app
	black app

test:
	pytest --maxfail=1 --disable-warnings --cov=app --cov-report=xml

migrate:
	alembic upgrade head

revision:
	alembic revision --autogenerate -m "auto"

.PHONY: install run lint format test migrate revision
