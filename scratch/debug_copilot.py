import os
import sys
from fastapi.testclient import TestClient

sys.path.append(os.path.abspath("d:/ML/healthcare-ai"))

from app.main import app
from app.db.connection import connect_to_mongo, get_mongo_database, close_mongo_connection
from app.services.auth_service import get_current_user

def debug():
    connect_to_mongo()
    db = get_mongo_database()
    
    client = TestClient(app)
    
    # Mock user login
    app.dependency_overrides[get_current_user] = lambda: {"email": "test_analyst@platform.com", "role": "Analyst"}
    
    print("Sending POST /api/copilot/chat...")
    try:
        response = client.post("/api/copilot/chat", json={
            "message": "Which provider has the highest fraud risk?",
            "conversationId": None
        })
        print(f"Status Code: {response.status_code}")
        print(f"Response Body: {response.text}")
    except Exception as e:
        import traceback
        traceback.print_exc()
        
    app.dependency_overrides.clear()
    close_mongo_connection()

if __name__ == "__main__":
    debug()
