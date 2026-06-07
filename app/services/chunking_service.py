class ChunkingService:
    @staticmethod
    def chunk_text(text: str, chunk_size: int = 800, overlap: int = 100) -> list[str]:
        if not text:
            return []
        
        chunks = []
        start = 0
        text_len = len(text)
        
        while start < text_len:
            end = min(start + chunk_size, text_len)
            
            # If we are not at the end, try to align with word or sentence boundary
            if end < text_len:
                boundary = -1
                # Check for sentence endings in the last 120 chars
                search_start = max(end - 120, start)
                for i in range(end, search_start, -1):
                    if text[i - 1] in ['.', '\n', '?']:
                        boundary = i
                        break
                # Check for word space boundary in last 60 chars if no sentence ending
                if boundary == -1:
                    search_start = max(end - 60, start)
                    for i in range(end, search_start, -1):
                        if text[i - 1] == ' ':
                            boundary = i
                            break
                if boundary != -1:
                    end = boundary
                    
            chunk = text[start:end].strip()
            if chunk:
                chunks.append(chunk)
            
            # Advance start pointer back by overlap to ensure continuity
            start = end - overlap
            if start >= text_len or end >= text_len:
                break
                
        return chunks
