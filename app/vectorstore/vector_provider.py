import os
import pickle
import numpy as np
from abc import ABC, abstractmethod

class VectorProvider(ABC):
    @abstractmethod
    def upsert(self, chunk_id: str, vector: list[float]) -> None:
        pass

    @abstractmethod
    def search(self, query_vector: list[float], limit: int = 5) -> list[tuple[str, float]]:
        pass

    @abstractmethod
    def delete(self, chunk_id: str) -> None:
        pass


class FAISSProvider(VectorProvider):
    def __init__(self, index_path: str = "storage/vectorstore/faiss_index.pkl"):
        self.index_path = index_path
        self.vectors = {}  # Map chunk_id -> list[float]
        self._faiss_index = None
        self._id_map = []  # Map index position -> chunk_id
        self._use_fallback = True
        
        os.makedirs(os.path.dirname(self.index_path), exist_ok=True)
        self.load()
        
        try:
            # pyrefly: ignore [missing-import]
            import faiss
            self._use_fallback = False
            self._rebuild_faiss()
        except ImportError:
            self._use_fallback = True

    def _rebuild_faiss(self):
        if self._use_fallback or not self.vectors:
            return
            
        import faiss
        self._id_map = list(self.vectors.keys())
        first_vec = next(iter(self.vectors.values()))
        dim = len(first_vec)
        
        self._faiss_index = faiss.IndexFlatL2(dim)
        arr = np.array([self.vectors[cid] for cid in self._id_map], dtype=np.float32)
        self._faiss_index.add(arr)

    def upsert(self, chunk_id: str, vector: list[float]) -> None:
        self.vectors[chunk_id] = vector
        self.save()
        if not self._use_fallback:
            self._rebuild_faiss()

    def delete(self, chunk_id: str) -> None:
        if chunk_id in self.vectors:
            del self.vectors[chunk_id]
            self.save()
            if not self._use_fallback:
                self._rebuild_faiss()

    def search(self, query_vector: list[float], limit: int = 5) -> list[tuple[str, float]]:
        if not self.vectors:
            return []
            
        q_arr = np.array(query_vector, dtype=np.float32)
        
        if not self._use_fallback and self._faiss_index is not None:
            # Native FAISS search
            distances, indices = self._faiss_index.search(q_arr.reshape(1, -1), limit)
            results = []
            for dist, idx in zip(distances[0], indices[0]):
                if idx < 0 or idx >= len(self._id_map):
                    continue
                cid = self._id_map[idx]
                confidence = float(1.0 / (1.0 + float(dist)))
                results.append((cid, confidence))
            return results
        else:
            # NumPy L2 flat similarity fallback
            results = []
            for cid, vec in self.vectors.items():
                v_arr = np.array(vec, dtype=np.float32)
                dist = np.linalg.norm(q_arr - v_arr)
                confidence = float(1.0 / (1.0 + float(dist)))
                results.append((cid, confidence))
                
            results.sort(key=lambda x: x[1], reverse=True)
            return results[:limit]

    def save(self) -> None:
        with open(self.index_path, "wb") as f:
            pickle.dump(self.vectors, f)

    def load(self) -> None:
        if os.path.exists(self.index_path):
            try:
                with open(self.index_path, "rb") as f:
                    self.vectors = pickle.load(f)
            except Exception:
                self.vectors = {}


class ChromaProvider(VectorProvider):
    def __init__(self):
        self.provider = FAISSProvider(index_path="storage/vectorstore/chroma_index.pkl")

    def upsert(self, chunk_id: str, vector: list[float]) -> None:
        self.provider.upsert(chunk_id, vector)

    def delete(self, chunk_id: str) -> None:
        self.provider.delete(chunk_id)

    def search(self, query_vector: list[float], limit: int = 5) -> list[tuple[str, float]]:
        return self.provider.search(query_vector, limit)


def get_vector_provider() -> VectorProvider:
    provider_name = os.getenv("RAG_VECTOR_PROVIDER", "FAISS")
    if provider_name == "Chroma":
        return ChromaProvider()
    return FAISSProvider()
