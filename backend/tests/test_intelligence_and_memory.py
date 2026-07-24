import pytest
from app.services.llm import get_llm_service, OllamaLLMService
from app.services.embeddings import embedding_service
from app.services.voice_commands import VoiceCommandParser


@pytest.mark.asyncio
async def test_llm_service():
    llm = get_llm_service()
    res = await llm.summarize_transcript("Alice: We need to finalize the Q3 marketing budget.\nBob: I agree, let's cap it at $50k.")
    assert "summary" in res
    assert "key_decisions" in res
    assert "action_items" in res


def test_embedding_service():
    vec = embedding_service.generate_embedding("Test meeting summary text")
    assert len(vec) == 384
    assert isinstance(vec[0], float)


def test_voice_command_parser():
    cmd1 = VoiceCommandParser.parse_command("Please summarize the discussion")
    assert cmd1["is_command"] is True
    assert cmd1["command_type"] == "SUMMARIZE"

    cmd2 = VoiceCommandParser.parse_command("Create a task for Priya to prepare budget slides")
    assert cmd2["is_command"] is True
    assert cmd2["command_type"] == "CREATE_TASK"
    assert cmd2["parameters"]["assignee"] == "Priya"

    cmd3 = VoiceCommandParser.parse_command("Hello everyone welcome to the meeting")
    assert cmd3["is_command"] is False
