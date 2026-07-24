import hashlib
import math
from typing import List


class EmbeddingService:
    """Service to generate dense 384-dimensional vector embeddings for semantic search."""

    def __init__(self):
        self._st_model = None

    def _get_st_model(self):
        if self._st_model is None:
            try:
                from sentence_transformers import SentenceTransformer
                self._st_model = SentenceTransformer("all-MiniLM-L6-v2")
            except Exception:
                self._st_model = "fallback"
        return self._st_model

    def generate_embedding(self, text: str) -> List[float]:
        """Generate a 384-dimensional float vector for input text."""
        if not text:
            return [0.0] * 384

        model = self._get_st_model()
        if model != "fallback":
            try:
                vec = model.encode(text)
                return vec.tolist()
            except Exception:
                pass

        # Deterministic 384-dimensional embedding generator for local/lightweight fallback
        vec = []
        words = text.lower().split()
        for i in range(384):
            val = 0.0
            for w in words:
                h = int(hashlib.md5(f"{w}_{i}".encode()).hexdigest(), 16)
                val += math.sin((h % 10000) / 1000.0)
            vec.append(val / (len(words) or 1))

        # Normalize vector to unit length
        norm = math.sqrt(sum(x * x for x in vec)) or 1.0
        return [x / norm for x in vec]


# Singleton instance
embedding_service = EmbeddingService()
