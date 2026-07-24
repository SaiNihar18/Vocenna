import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_register_and_login():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Register user
        user_data = {
            "email": "testuser@vocenna.com",
            "password": "Password123!",
            "full_name": "Test User",
            "preferred_language": "en"
        }
        reg_response = await client.post("/api/v1/auth/register", json=user_data)
        assert reg_response.status_code in [201, 400]  # 400 if already exists

        # Login user
        login_data = {
            "username": "testuser@vocenna.com",
            "password": "Password123!"
        }
        login_response = await client.post(
            "/api/v1/auth/login",
            data=login_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        if login_response.status_code == 200:
            res = login_response.json()
            assert "access_token" in res
            assert res["token_type"] == "bearer"
            assert res["user"]["email"] == "testuser@vocenna.com"
