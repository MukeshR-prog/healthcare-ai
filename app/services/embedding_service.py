import os
import hashlib
import numpy as np
from abc import ABC, abstractmethod
from app.core.config import settings

class EmbeddingProvider(ABC):
    @abstractmethod
    def embed_query(self, text: str) -> list[float]:
        pass

    @abstractmethod
    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        pass

    @abstractmethod
    def get_dimension(self) -> int:
        pass


def generate_numpy_fallback_embedding(text: str, dimension: int = 384) -> list[float]:
    """Generates a deterministic pseudo-semantic vector using token-based hashing and NumPy."""
    tokens = text.lower().split()
    if not tokens:
        tokens = [text.lower()]
    
    vec = np.zeros(dimension, dtype=np.float32)
    for token in tokens:
        h = hashlib.sha256(token.encode('utf-8')).hexdigest()
        seed = int(h[:8], 16) % (2**32)
        rng = np.random.default_rng(seed)
        vec += rng.normal(0.0, 1.0, dimension)
        
    norm = np.linalg.norm(vec)
    if norm > 0:
        vec = vec / norm
    return vec.tolist()


class SentenceTransformersEmbeddingProvider(EmbeddingProvider):
    def __init__(self):
        self.model_name = "sentence-transformers/all-MiniLM-L6-v2"
        self.dimension = 384
        self.model = None
        self._initialized = False
        self._use_fallback = False
        
        try:
            # Try to load SentenceTransformers if installed
            # pyrefly: ignore [missing-import]
            from sentence_transformers import SentenceTransformer
            self.model = SentenceTransformer(self.model_name)
            self._initialized = True
        except Exception:
            self._use_fallback = True

    def embed_query(self, text: str) -> list[float]:
        if self._use_fallback:
            return generate_numpy_fallback_embedding(text, self.dimension)
        # Native model embedding
        return self.model.encode(text, convert_to_tensor=False).tolist()

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        if self._use_fallback:
            return [generate_numpy_fallback_embedding(t, self.dimension) for t in texts]
        # Native model embeddings
        embeddings = self.model.encode(texts, convert_to_tensor=False)
        return embeddings.tolist()

    def get_dimension(self) -> int:
        return self.dimension


class OpenAIEmbeddingProvider(EmbeddingProvider):
    def __init__(self):
        self.dimension = 1536
        self.model = "text-embedding-3-small"
        self.client = None
        
        api_key = os.getenv("OPENAI_API_KEY") or getattr(settings, "OPENAI_API_KEY", None)
        if api_key:
            try:
                import openai
                self.client = openai.OpenAI(api_key=api_key)
            except Exception:
                pass

    def embed_query(self, text: str) -> list[float]:
        if not self.client:
            # Graceful fallback to numpy vector projected to 1536 dimensions
            return generate_numpy_fallback_embedding(text, self.dimension)
        
        response = self.client.embeddings.create(input=[text], model=self.model)
        return response.data[0].embedding

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        if not self.client:
            return [generate_numpy_fallback_embedding(t, self.dimension) for t in texts]
        
        response = self.client.embeddings.create(input=texts, model=self.model)
        return [item.embedding for item in response.data]

    def get_dimension(self) -> int:
        return self.dimension


class GeminiEmbeddingProvider(EmbeddingProvider):
    def __init__(self):
        self.dimension = 768
        self.model = "models/embedding-001"
        self.has_sdk = False
        
        api_key = os.getenv("GEMINI_API_KEY") or getattr(settings, "GEMINI_API_KEY", None)
        if api_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=api_key)
                self.has_sdk = True
            except Exception:
                pass

    def embed_query(self, text: str) -> list[float]:
        if not self.has_sdk:
            return generate_numpy_fallback_embedding(text, self.dimension)
        
        import google.generativeai as genai
        result = genai.embed_content(
            model=self.model,
            content=text,
            task_type="retrieval_query"
        )
        return result['embedding']

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        if not self.has_sdk:
            return [generate_numpy_fallback_embedding(t, self.dimension) for t in texts]
        
        import google.generativeai as genai
        result = genai.embed_content(
            model=self.model,
            content=texts,
            task_type="retrieval_document"
        )
        return result['embedding']

    def get_dimension(self) -> int:
        return self.dimension


class CohereEmbeddingProvider(EmbeddingProvider):
    def __init__(self):
        self.dimension = 1024

    def embed_query(self, text: str) -> list[float]:
        # Simple local simulation for Cohere
        return generate_numpy_fallback_embedding(text, self.dimension)

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return [generate_numpy_fallback_embedding(t, self.dimension) for t in texts]

    def get_dimension(self) -> int:
        return self.dimension


def get_embedding_provider() -> EmbeddingProvider:
    provider_name = os.getenv("RAG_EMBEDDING_PROVIDER", "SentenceTransformers")
    if provider_name == "OpenAI":
        return OpenAIEmbeddingProvider()
    elif provider_name == "Gemini":
        return GeminiEmbeddingProvider()
    elif provider_name == "Cohere":
        return CohereEmbeddingProvider()
    
    return SentenceTransformersEmbeddingProvider()
