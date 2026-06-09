import os
import sys
import requests
from bson import ObjectId

sys.path.append(os.path.abspath("d:/ML/healthcare-ai"))

from app.db.connection import connect_to_mongo, get_mongo_database, close_mongo_connection
from app.services.auth_service import create_access_token

def test_live():
    connect_to_mongo()
    db = get_mongo_database()
    
    # Get a user
    user = db["users"].find_one()
    if not user:
        print("No user found in database.")
        close_mongo_connection()
        return
    
    print(f"Using user: {user.get('email')} ({user.get('_id')})")
    
    token = create_access_token(str(user["_id"]), user["email"])
    
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    payload = {
        "message": "Is Provider B high risk?",
        "conversationId": None
    }
    
    url = "http://127.0.0.1:8000/api/copilot/chat"
    print(f"Sending POST to {url}...")
    try:
        response = requests.post(url, json=payload, headers=headers)
        print(f"Status Code: {response.status_code}")
        print(f"Headers: {response.headers}")
        print(f"Body: {response.text}")
    except Exception as e:
        print(f"Request failed: {e}")
        
    close_mongo_connection()

if __name__ == "__main__":
    test_live()
