import os
import sys
import requests

sys.path.append(os.path.abspath("d:/ML/healthcare-ai"))

from app.db.connection import connect_to_mongo, get_mongo_database, close_mongo_connection
from app.services.auth_service import create_access_token

def test_all_endpoints():
    connect_to_mongo()
    db = get_mongo_database()
    
    # Get a user
    user = db["users"].find_one()
    if not user:
        print("No user found in database.")
        close_mongo_connection()
        return
    
    token = create_access_token(str(user["_id"]), user["email"])
    headers = {"Authorization": f"Bearer {token}"}
    base_url = "http://127.0.0.1:8000/api/copilot"
    
    # 1. Test Suggestions
    print("\n--- Testing GET /suggestions ---")
    r = requests.get(f"{base_url}/suggestions", headers=headers)
    print(f"Status: {r.status_code}")
    print(f"Body: {r.json()[:3]}...")
    
    # 2. Test Conversations
    print("\n--- Testing GET /conversations ---")
    r = requests.get(f"{base_url}/conversations", headers=headers)
    print(f"Status: {r.status_code}")
    convs = r.json()
    print(f"Body: Found {len(convs)} conversations.")
    
    # 3. Test Metrics
    print("\n--- Testing GET /metrics ---")
    r = requests.get(f"{base_url}/metrics", headers=headers)
    print(f"Status: {r.status_code}")
    print(f"Body: {r.json()}")
    
    if convs:
        # 4. Test Get Conversation Messages
        conv_id = convs[0]["conversationId"]
        print(f"\n--- Testing GET /conversations/{conv_id} ---")
        r = requests.get(f"{base_url}/conversations/{conv_id}", headers=headers)
        print(f"Status: {r.status_code}")
        print(f"Body: Found {len(r.json())} messages.")
        
    close_mongo_connection()

if __name__ == "__main__":
    test_all_endpoints()
