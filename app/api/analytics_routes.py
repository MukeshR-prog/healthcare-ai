from fastapi import APIRouter, Depends
from pymongo.database import Database

from app.db.connection import get_database
from app.services.ml_service import HIGH_RISK_CONFIDENCE_THRESHOLD, get_model_metrics

router = APIRouter()


@router.get("/model-metrics")
def model_metrics():
    return get_model_metrics()


@router.get("/analytics")
def analytics(db: Database = Depends(get_database)):
    total_claims = db["claims"].count_documents({})

    avg_pipeline = [
        {"$group": {"_id": None, "avg_claim_amount": {"$avg": "$claim_amount"}}}
    ]
    avg_result = list(db["claims"].aggregate(avg_pipeline))
    avg_claim_amount = float(avg_result[0]["avg_claim_amount"]) if avg_result else 0.0

    fraud_cases = db["predictions"].count_documents({"prediction": 1})
    non_fraud_cases = max(0, total_claims - fraud_cases)
    fraud_rate_pct = (float(fraud_cases) / float(total_claims) * 100.0) if total_claims else 0.0

    provider_pipeline = [
        {
            "$group": {
                "_id": "$provider",
                "avg_claim_amount": {"$avg": "$claim_amount"},
                "claims_count": {"$sum": 1},
            }
        },
        {"$sort": {"avg_claim_amount": -1}},
    ]
    provider_rows = list(db["claims"].aggregate(provider_pipeline))
    avg_claim_by_provider = [
        {
            "provider": row["_id"],
            "avg_claim_amount": float(row["avg_claim_amount"]),
            "claims_count": int(row["claims_count"]),
        }
        for row in provider_rows
    ]

    gender_pipeline = [
        {"$group": {"_id": "$gender", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]
    gender_rows = list(db["claims"].aggregate(gender_pipeline))
    gender_distribution = [
        {
            "gender": row["_id"],
            "count": int(row["count"]),
            "percentage": (float(row["count"]) / float(total_claims) * 100.0) if total_claims else 0.0,
        }
        for row in gender_rows
    ]

    high_risk_claims_count = db["predictions"].count_documents(
        {
            "prediction": 1,
            "confidence": {"$gte": HIGH_RISK_CONFIDENCE_THRESHOLD},
        }
    )

    return {
        "total_claims": int(total_claims),
        "avg_claim_amount": avg_claim_amount,
        "fraud_cases": int(fraud_cases),
        "summary": {
            "total_claims": int(total_claims),
            "avg_claim_amount": avg_claim_amount,
            "fraud_cases": int(fraud_cases),
            "non_fraud_cases": int(non_fraud_cases),
            "fraud_rate_pct": fraud_rate_pct,
            "high_risk_claims_count": int(high_risk_claims_count),
            "high_risk_threshold": HIGH_RISK_CONFIDENCE_THRESHOLD,
        },
        "charts": {
            "average_claim_by_provider": avg_claim_by_provider,
            "gender_distribution": gender_distribution,
            "fraud_breakdown": {
                "fraud_cases": int(fraud_cases),
                "non_fraud_cases": int(non_fraud_cases),
            },
        },
    }
