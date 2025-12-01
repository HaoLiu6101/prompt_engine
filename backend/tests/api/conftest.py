import pytest

from tests.conftest import app_client


@pytest.fixture
def api_client(app_client):  # pragma: no cover - fixture plumbing
    return app_client
