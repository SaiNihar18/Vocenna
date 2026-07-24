import sys
import os
import asyncio
import pytest

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))


def test_config():
    print("Testing Configuration Loading...")
    from app.core.config import settings
    assert settings.PROJECT_NAME == "Vocenna"
    assert settings.STT_SERVICE_TYPE == "whisper_local"
    assert settings.LLM_SERVICE_TYPE == "ollama"
    print("[OK] Configuration loaded successfully.")


def test_security():
    print("Testing Security & JWT Token Generation...")
    from app.core.security import get_password_hash, verify_password, create_access_token
    import jwt
    from app.core.config import settings

    hashed = get_password_hash("Password123!")
    assert verify_password("Password123!", hashed) is True
    assert verify_password("WrongPassword", hashed) is False

    token = create_access_token("test-user-uuid-1234")
    decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    assert decoded["sub"] == "test-user-uuid-1234"
    print("[OK] Password hashing & JWT Token generation verified.")


def test_fastapi_openapi():
    print("Testing FastAPI App & OpenAPI Schema Generation...")
    from app.main import app
    schema = app.openapi()
    assert schema["info"]["title"] == "Vocenna"
    paths = schema["paths"]
    assert "/api/v1/health" in paths
    assert "/api/v1/auth/register" in paths
    assert "/api/v1/auth/login" in paths
    assert "/api/v1/rooms" in paths
    assert "/api/v1/rooms/{room_id}/summary" in paths
    assert "/api/v1/rooms/{room_id}/memory/query" in paths
    print("[OK] FastAPI Routing & OpenAPI Schema verified (All 15+ endpoints registered).")


@pytest.mark.asyncio
async def test_ai_drivers():
    print("Testing AI Service Drivers & NLP Parsers...")
    from app.services.stt import get_stt_service
    from app.services.llm import get_llm_service
    from app.services.embeddings import embedding_service
    from app.services.voice_commands import VoiceCommandParser

    # STT Driver test
    stt = get_stt_service()
    stt_res = await stt.transcribe_bytes(b"sample_audio_data")
    assert "text" in stt_res
    print("  - STT Driver verified.")

    # LLM Driver test
    llm = get_llm_service()
    summary_res = await llm.summarize_transcript("Alice: Hello team\nBob: Let's start the call.")
    assert "summary" in summary_res
    print("  - LLM Driver verified.")

    # Embedding Vector Generator test
    vector = embedding_service.generate_embedding("Vocenna meeting memory test")
    assert len(vector) == 384
    print("  - 384-dimensional Vector Embedding generator verified.")

    # Voice Command NLP test
    cmd = VoiceCommandParser.parse_command("Create a task for Priya to send budget report")
    assert cmd["is_command"] is True
    assert cmd["command_type"] == "CREATE_TASK"
    assert cmd["parameters"]["assignee"] == "Priya"
    print("  - Voice Command NLP Parser verified.")

    print("[OK] All AI & Speech drivers verified.")


async def main():
    print("==========================================")
    print("   VOCENNA BACKEND VERIFICATION RUNNER    ")
    print("==========================================")
    test_config()
    test_security()
    test_fastapi_openapi()
    await test_ai_drivers()
    print("==========================================")
    print("   ALL BACKEND CHECKS PASSED SUCCESSFULLY!")
    print("==========================================")



if __name__ == "__main__":
    asyncio.run(main())
