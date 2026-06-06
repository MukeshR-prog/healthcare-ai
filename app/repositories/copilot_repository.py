from pymongo.database import Database
from app.models.copilot import CopilotConversation, CopilotMessage, CopilotInsight

class CopilotRepository:
    @staticmethod
    def save_conversation(db: Database, conv: CopilotConversation) -> str:
        payload = conv.model_dump(by_alias=True, exclude={"id"})
        result = db["copilot_conversations"].insert_one(payload)
        return str(result.inserted_id)

    @staticmethod
    def get_conversation(db: Database, conversation_id: str) -> dict | None:
        return db["copilot_conversations"].find_one({"conversation_id": conversation_id})

    @staticmethod
    def get_conversations(db: Database, user_id: str) -> list[dict]:
        return list(db["copilot_conversations"].find({"user_id": user_id}).sort("updated_at", -1))

    @staticmethod
    def delete_conversation(db: Database, conversation_id: str) -> bool:
        db["copilot_messages"].delete_many({"conversation_id": conversation_id})
        db["copilot_insights"].delete_many({"conversation_id": conversation_id})
        res = db["copilot_conversations"].delete_one({"conversation_id": conversation_id})
        return res.deleted_count > 0

    @staticmethod
    def save_message(db: Database, message: CopilotMessage) -> str:
        payload = message.model_dump(by_alias=True, exclude={"id"})
        result = db["copilot_messages"].insert_one(payload)
        return str(result.inserted_id)

    @staticmethod
    def get_messages(db: Database, conversation_id: str) -> list[dict]:
        return list(db["copilot_messages"].find({"conversation_id": conversation_id}).sort("created_at", 1))

    @staticmethod
    def save_insight(db: Database, insight: CopilotInsight) -> str:
        payload = insight.model_dump(by_alias=True, exclude={"id"})
        result = db["copilot_insights"].insert_one(payload)
        return str(result.inserted_id)

    @staticmethod
    def get_insights(db: Database, conversation_id: str) -> list[dict]:
        return list(db["copilot_insights"].find({"conversation_id": conversation_id}).sort("generated_at", -1))
