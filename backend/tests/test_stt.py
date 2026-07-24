import pytest
from app.services.stt import get_stt_service, FasterWhisperSTTService, CloudOpenAISTTService
from app.core.config import settings


@pytest.mark.asyncio
async def test_stt_service_factory():
    service = get_stt_service()
    assert service is not None

    # Test transcribing empty or sample bytes
    res = await service.transcribe_bytes(b"dummy_wav_header_and_sample_pcm_data")
    assert "text" in res
    assert "language" in res


@pytest.mark.asyncio
async def test_stt_abstract_drivers():
    local_stt = FasterWhisperSTTService(model_size="base")
    res_local = await local_stt.transcribe_bytes(b"sample_data")
    assert "text" in res_local

    cloud_stt = CloudOpenAISTTService(api_key="")
    res_cloud = await cloud_stt.transcribe_bytes(b"sample_data")
    assert "text" in res_cloud
