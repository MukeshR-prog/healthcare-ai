from datetime import datetime, timezone
from bson import ObjectId
# pyrefly: ignore [missing-import]
from pymongo.database import Database
from app.models.provider import Provider


class ProviderRepository:
    @staticmethod
    def get_base_metrics_pipeline(
        search: str = None,
        watchlisted: bool = None,
        risk_level: str = None
    ) -> list[dict]:
        pipeline = [
            # Local lookup: claims
            {
                "$lookup": {
                    "from": "claims",
                    "localField": "provider_name",
                    "foreignField": "provider",
                    "as": "claims"
                }
            },
            # Local lookup: alerts
            {
                "$lookup": {
                    "from": "alerts",
                    "localField": "provider_name",
                    "foreignField": "provider",
                    "as": "alerts"
                }
            },
            # Local lookup: investigations
            {
                "$lookup": {
                    "from": "investigations",
                    "localField": "provider_name",
                    "foreignField": "provider",
                    "as": "cases"
                }
            },
            # Lookup predictions matching claims
            {
                "$lookup": {
                    "from": "predictions",
                    "let": {"claim_ids": {"$map": {"input": "$claims", "as": "c", "in": {"$toString": "$$c._id"}}}},
                    "pipeline": [
                        {
                            "$match": {
                                "$expr": {
                                    "$and": [
                                        {"$in": ["$claim_id", "$$claim_ids"]},
                                        {"$eq": ["$prediction", 1]}
                                    ]
                                }
                            }
                        }
                    ],
                    "as": "fraud_predictions"
                }
            },
            # Project values
            {
                "$project": {
                    "id": {"$toString": "$_id"},
                    "provider_id": 1,
                    "provider_name": 1,
                    "provider_type": 1,
                    "location": 1,
                    "watchlisted": 1,
                    "flag_reason": 1,
                    "created_at": 1,
                    "updated_at": 1,
                    "claimsCount": {"$size": "$claims"},
                    "totalClaimAmount": {"$sum": "$claims.claim_amount"},
                    "avgClaimAmount": {"$ifNull": [{"$avg": "$claims.claim_amount"}, 0]},
                    "fraudCount": {"$size": "$fraud_predictions"},
                    "alertCount": {"$size": "$alerts"},
                    "investigationCount": {"$size": "$cases"},
                    "resolvedCount": {
                        "$size": {
                            "$filter": {
                                "input": "$cases",
                                "as": "c",
                                "cond": {"$eq": ["$$c.status", "Closed"]}
                            }
                        }
                    }
                }
            },
            # Calculate intermediate scores
            {
                "$addFields": {
                    "fraudRate": {
                        "$cond": [
                            {"$gt": ["$claimsCount", 0]},
                            {"$divide": ["$fraudCount", "$claimsCount"]},
                            0
                        ]
                    },
                    "alertScore": {
                        "$min": [
                            {"$multiply": [{"$divide": ["$alertCount", 5]}, 100]},
                            100
                        ]
                    },
                    "investigationScore": {
                        "$min": [
                            {"$multiply": [{"$divide": ["$investigationCount", 3]}, 100]},
                            100
                        ]
                    },
                    "costScore": {
                        "$min": [
                            {"$multiply": [{"$divide": ["$avgClaimAmount", 15000]}, 100]},
                            100
                        ]
                    }
                }
            },
            # Calculate final riskScore and riskLevel
            {
                "$addFields": {
                    "riskScore": {
                        "$round": {
                          "$min": [
                              {
                                  "$add": [
                                      {"$multiply": ["$fraudRate", 100, 0.40]},
                                      {"$multiply": ["$alertScore", 0.25]},
                                      {"$multiply": ["$investigationScore", 0.20]},
                                      {"$multiply": ["$costScore", 0.15]}
                                  ]
                              },
                              100
                          ]
                        }
                    }
                }
            },
            {
                "$addFields": {
                    "riskLevel": {
                        "$cond": [
                            {"$gte": ["$riskScore", 80]}, "Critical",
                            {"$cond": [
                                {"$gte": ["$riskScore", 60]}, "High",
                                {"$cond": [
                                    {"$gte": ["$riskScore", 30]}, "Medium",
                                    "Low"
                                ]}
                            ]}
                        ]
                    }
                }
            }
        ]

        # Add filtering criteria
        match_stage = {}
        if search:
            match_stage["$or"] = [
                {"provider_name": {"$regex": search, "$options": "i"}},
                {"provider_id": {"$regex": search, "$options": "i"}},
                {"location": {"$regex": search, "$options": "i"}},
            ]
        if watchlisted is not None:
            match_stage["watchlisted"] = watchlisted
        if risk_level:
            match_stage["riskLevel"] = risk_level

        if match_stage:
            pipeline.append({"$match": match_stage})

        return pipeline

    @staticmethod
    def get_providers(
        db: Database,
        search: str = None,
        watchlisted: bool = None,
        risk_level: str = None,
        skip: int = 0,
        limit: int = 10,
        sort_by: str = "riskScore",
        sort_dir: int = -1
    ) -> tuple[int, list[dict]]:
        pipeline = ProviderRepository.get_base_metrics_pipeline(search, watchlisted, risk_level)

        # Determine sort field
        sort_field = "riskScore"
        if sort_by == "name":
            sort_field = "provider_name"
        elif sort_by in ["claimsCount", "totalClaimAmount", "avgClaimAmount", "fraudCount", "alertCount", "investigationCount"]:
            sort_field = sort_by

        pipeline.append({
            "$facet": {
                "metadata": [{"$count": "total"}],
                "data": [{"$sort": {sort_field: sort_dir}}, {"$skip": skip}, {"$limit": limit}]
            }
        })

        res = list(db["providers"].aggregate(pipeline))
        facet = res[0] if res else {}
        total_list = facet.get("metadata", [])
        total = total_list[0]["total"] if total_list else 0
        items = facet.get("data", [])

        return total, items

    @staticmethod
    def get_provider_by_id(db: Database, identifier: str) -> dict | None:
        pipeline = ProviderRepository.get_base_metrics_pipeline()

        match_or = []
        if ObjectId.is_valid(identifier):
            match_or.append({"_id": ObjectId(identifier)})
        else:
            match_or.append({"provider_id": identifier})
            match_or.append({"provider_name": identifier})

        pipeline.insert(0, {"$match": {"$or": match_or}})

        results = list(db["providers"].aggregate(pipeline))
        return results[0] if results else None

    @staticmethod
    def update_watchlist(db: Database, identifier: str, watchlisted: bool) -> dict | None:
        match_or = []
        if ObjectId.is_valid(identifier):
            match_or.append({"_id": ObjectId(identifier)})
        else:
            match_or.append({"provider_id": identifier})
            match_or.append({"provider_name": identifier})

        return db["providers"].find_one_and_update(
            {"$or": match_or},
            {"$set": {"watchlisted": watchlisted, "updated_at": datetime.now(timezone.utc)}},
            return_document=True
        )

    @staticmethod
    def update_flag(db: Database, identifier: str, flag: str) -> dict | None:
        match_or = []
        if ObjectId.is_valid(identifier):
            match_or.append({"_id": ObjectId(identifier)})
        else:
            match_or.append({"provider_id": identifier})
            match_or.append({"provider_name": identifier})

        return db["providers"].find_one_and_update(
            {"$or": match_or},
            {"$set": {"flag_reason": flag, "updated_at": datetime.now(timezone.utc)}},
            return_document=True
        )

    @staticmethod
    def get_leaderboard(db: Database, limit: int = 10) -> list[dict]:
        pipeline = ProviderRepository.get_base_metrics_pipeline()
        pipeline.append({"$sort": {"riskScore": -1}})
        pipeline.append({"$limit": limit})
        return list(db["providers"].aggregate(pipeline))

    @staticmethod
    def compare_providers(db: Database, names: list[str]) -> list[dict]:
        pipeline = ProviderRepository.get_base_metrics_pipeline()
        pipeline.append({"$match": {"provider_name": {"$in": names}}})
        return list(db["providers"].aggregate(pipeline))
