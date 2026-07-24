import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_websocket_requires_auth():
    """Verify that WebSocket rejects unauthenticated connection requests."""
    with pytest.raises(Exception):
        with client.websocket_connect("/ws/rooms/00000000-0000-0000-0000-000000000000"):
            pass
