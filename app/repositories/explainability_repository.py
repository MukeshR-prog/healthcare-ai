from pymongo.database import Database
from app.models.explainability import Explanation, FeatureContribution, PredictionInsight

class ExplainabilityRepository:
    @staticmethod
    def create_explanation(db: Database, explanation: Explanation) -> str:
        payload = explanation.model_dump(by_alias=True, exclude={"id"})
        result = db["explanations"].insert_one(payload)
        return str(result.inserted_id)

    @staticmethod
    def update_explanation(db: Database, prediction_id: str, explanation: Explanation) -> bool:
        payload = explanation.model_dump(by_alias=True, exclude={"id"})
        res = db["explanations"].update_one(
            {"prediction_id": prediction_id},
            {"$set": payload}
        )
        return res.modified_count > 0

    @staticmethod
    def get_explanation(db: Database, prediction_id: str) -> dict | None:
        return db["explanations"].find_one({"prediction_id": prediction_id})

    @staticmethod
    def get_explanations(db: Database, skip: int = 0, limit: int = 100) -> list[dict]:
        return list(db["explanations"].find().skip(skip).limit(limit))

    @staticmethod
    def save_feature_contributions(db: Database, contributions: list[FeatureContribution]) -> None:
        if not contributions:
            return
        pred_id = contributions[0].prediction_id
        # Delete existing ones to overwrite cleanly
        db["feature_contributions"].delete_many({"prediction_id": pred_id})
        
        payloads = [c.model_dump(by_alias=True, exclude={"id"}) for c in contributions]
        db["feature_contributions"].insert_many(payloads)

    @staticmethod
    def get_feature_contributions(db: Database, prediction_id: str) -> list[dict]:
        return list(db["feature_contributions"].find({"prediction_id": prediction_id}))

    @staticmethod
    def save_prediction_insight(db: Database, insight: PredictionInsight) -> None:
        payload = insight.model_dump(by_alias=True, exclude={"id"})
        db["prediction_insights"].update_one(
            {"prediction_id": insight.prediction_id},
            {"$set": payload},
            upsert=True
        )

    @staticmethod
    def get_prediction_insights(db: Database, prediction_id: str) -> dict | None:
        return db["prediction_insights"].find_one({"prediction_id": prediction_id})

    @staticmethod
    def delete_explanation(db: Database, prediction_id: str) -> bool:
        db["feature_contributions"].delete_many({"prediction_id": prediction_id})
        db["prediction_insights"].delete_many({"prediction_id": prediction_id})
        res = db["explanations"].delete_one({"prediction_id": prediction_id})
        return res.deleted_count > 0

    @staticmethod
    def get_metrics(db: Database) -> dict:
        total = db["explanations"].count_documents({})
        if total == 0:
            return {
                "totalExplanations": 0,
                "highRiskPredictions": 0,
                "avgConfidenceScore": 0.0,
                "criticalPredictions": 0
            }
        
        pipeline = [
            {
                "$group": {
                    "_id": None,
                    "total_explanations": {"$sum": 1},
                    "high_risk_predictions": {"$sum": {"$cond": [{"$eq": ["$risk_level", "High"]}, 1, 0]}},
                    "critical_predictions": {"$sum": {"$cond": [{"$eq": ["$risk_level", "Critical"]}, 1, 0]}},
                    "avg_confidence_score": {"$avg": "$confidence_score"}
                }
            }
        ]
        res = list(db["explanations"].aggregate(pipeline))
        if not res:
            return {
                "totalExplanations": total,
                "highRiskPredictions": 0,
                "avgConfidenceScore": 0.0,
                "criticalPredictions": 0
            }
            
        return {
            "totalExplanations": res[0].get("total_explanations", total),
            "highRiskPredictions": res[0].get("high_risk_predictions", 0),
            "avgConfidenceScore": round(res[0].get("avg_confidence_score", 0.0), 3),
            "criticalPredictions": res[0].get("critical_predictions", 0)
        }
