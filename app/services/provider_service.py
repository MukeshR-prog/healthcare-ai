from datetime import datetime, timezone
# pyrefly: ignore [missing-import]
from pymongo.database import Database
from app.repositories.provider_repository import ProviderRepository
from app.services.audit_service import AuditService


class ProviderService:
    @staticmethod
    def sync_providers(db: Database) -> None:
        """Find unique provider names from claims, alerts, and investigations

        and ensure they exist in the providers collection.
        """
        provider_names = set()
        
        # 1. Gather from claims
        for claim in db["claims"].find({}, {"provider": 1}):
            if "provider" in claim and claim["provider"]:
                provider_names.add(claim["provider"])
                
        # 2. Gather from alerts
        for alert in db["alerts"].find({}, {"provider": 1}):
            if "provider" in alert and alert["provider"]:
                provider_names.add(alert["provider"])
                
        # 3. Gather from investigations
        for case in db["investigations"].find({}, {"provider": 1}):
            if "provider" in case and case["provider"]:
                provider_names.add(case["provider"])

        # Default fallbacks if empty
        if not provider_names:
            provider_names = {"Provider A", "Provider B", "Provider C", "Provider D"}

        # Sync database
        for name in provider_names:
            existing = db["providers"].find_one({"provider_name": name})
            if not existing:
                db["providers"].insert_one({
                    "provider_id": name.replace(" ", "_").lower(),
                    "provider_name": name,
                    "provider_type": "Healthcare Provider",
                    "location": "Global",
                    "watchlisted": False,
                    "flag_reason": "",
                    "created_at": datetime.now(timezone.utc),
                    "updated_at": datetime.now(timezone.utc)
                })

    @staticmethod
    def get_provider_detail(db: Database, identifier: str) -> dict | None:
        # Sync providers first to ensure details exist
        ProviderService.sync_providers(db)
        
        provider = ProviderRepository.get_provider_by_id(db, identifier)
        if not provider:
            return None

        provider_name = provider["provider_name"]

        # Fetch timelines
        alerts = list(db["alerts"].find({"provider": provider_name}))
        cases = list(db["investigations"].find({"provider": provider_name}))

        timeline = []
        for a in alerts:
            timeline.append({
                "date": a.get("created_at") or datetime.now(timezone.utc),
                "title": "Alert Raised",
                "desc": f"Fraud alert flagged for claim ID {a.get('claim_id') or '-'}.",
                "type": "alert"
            })
        for c in cases:
            timeline.append({
                "date": c.get("created_at") or datetime.now(timezone.utc),
                "title": "Investigation Started",
                "desc": f"Case {c.get('case_id') or '-'} escalated for provider inspection.",
                "type": "case"
            })
            if c.get("status") == "Closed":
                timeline.append({
                    "date": c.get("updated_at") or datetime.now(timezone.utc),
                    "title": "Investigation Concluded",
                    "desc": f"Case {c.get('case_id') or '-'} closed and marked resolved.",
                    "type": "resolution"
                })

        # Sort descending by date
        timeline.sort(key=lambda x: x["date"], reverse=True)
        provider["riskTimeline"] = timeline

        return provider

    @staticmethod
    def update_watchlist(db: Database, identifier: str, watchlisted: bool, operator_email: str) -> dict | None:
        provider = ProviderRepository.update_watchlist(db, identifier, watchlisted)
        if provider:
            # Audit log
            event_type = "PROVIDER_WATCHLIST_UPDATED"
            action = "UPDATE"
            desc = f"Provider watchlisted state updated to {watchlisted}."
            AuditService.log_event(
                db=db,
                event_type=event_type,
                entity_type="PROVIDER",
                entity_id=provider["provider_id"],
                action=action,
                description=desc,
                performed_by=operator_email,
                metadata={"watchlisted": watchlisted}
            )
        return provider

    @staticmethod
    def update_flag(db: Database, identifier: str, flag: str, operator_email: str) -> dict | None:
        provider = ProviderRepository.update_flag(db, identifier, flag)
        if provider:
            # Audit log
            event_type = "PROVIDER_FLAGGED" if flag else "PROVIDER_UNFLAGGED"
            action = "UPDATE"
            desc = f"Provider compliance flag recorded: {flag}" if flag else "Provider compliance flag removed."
            AuditService.log_event(
                db=db,
                event_type=event_type,
                entity_type="PROVIDER",
                entity_id=provider["provider_id"],
                action=action,
                description=desc,
                performed_by=operator_email,
                metadata={"flag": flag}
            )
        return provider

    @staticmethod
    def get_kpi_metrics(db: Database) -> dict:
        ProviderService.sync_providers(db)
        
        pipeline = ProviderRepository.get_base_metrics_pipeline()
        providers = list(db["providers"].aggregate(pipeline))

        total = len(providers)
        high_risk_count = 0
        active_cases = 0
        sum_risk = 0

        for p in providers:
            sum_risk += p["riskScore"]
            if p["riskScore"] >= 70:
                high_risk_count += 1
            active_cases += (p["investigationCount"] - p["resolvedCount"])

        avg_risk = (sum_risk / total) if total > 0 else 0

        return {
            "total": total,
            "highRiskCount": high_risk_count,
            "activeCases": active_cases,
            "avgRisk": avg_risk
        }

    @staticmethod
    def get_trends(db: Database) -> list[dict]:
        # Aggregate claims and predicted fraud by month
        claims_pipeline = [
            {
                "$lookup": {
                    "from": "predictions",
                    "let": {"claim_id_str": {"$toString": "$_id"}},
                    "pipeline": [
                        {"$match": {"$expr": {"$eq": ["$claim_id", "$$claim_id_str"]}}}
                    ],
                    "as": "preds"
                }
            },
            {
                "$project": {
                    "year_month": {"$dateToString": {"format": "%Y-%m", "date": "$created_at"}},
                    "is_fraud": {
                        "$cond": [
                            {"$eq": [{"$arrayElemAt": ["$preds.prediction", 0]}, 1]},
                            1,
                            0
                        ]
                    }
                }
            },
            {
                "$group": {
                    "_id": "$year_month",
                    "claims": {"$sum": 1},
                    "fraud": {"$sum": "$is_fraud"}
                }
            },
            {"$sort": {"_id": 1}}
        ]

        claims_monthly = list(db["claims"].aggregate(claims_pipeline))

        # Aggregate investigations by month
        cases_pipeline = [
            {
                "$project": {
                    "year_month": {"$dateToString": {"format": "%Y-%m", "date": "$created_at"}}
                }
            },
            {
                "$group": {
                    "_id": "$year_month",
                    "investigations": {"$sum": 1}
                }
            },
            {"$sort": {"_id": 1}}
        ]
        cases_monthly = list(db["investigations"].aggregate(cases_pipeline))

        # Merge into unified format
        merged = {}
        for r in claims_monthly:
            m = r["_id"] or "Unknown"
            merged[m] = {
                "month": m,
                "claims": r["claims"],
                "fraud": r["fraud"],
                "investigations": 0
            }
        for r in cases_monthly:
            m = r["_id"] or "Unknown"
            if m not in merged:
                merged[m] = {
                    "month": m,
                    "claims": 0,
                    "fraud": 0,
                    "investigations": r["investigations"]
                }
            else:
                merged[m]["investigations"] = r["investigations"]

        # Convert to list and sort by month
        result_list = list(merged.values())
        result_list.sort(key=lambda x: x["month"])
        return result_list

    @staticmethod
    def get_providers(
        db: Database,
        search: str = None,
        watchlisted: bool = None,
        risk_level: str = None,
        skip: int = 0,
        limit: int = 100,
        sort_by: str = "riskScore",
        sort_dir: int = -1
    ) -> tuple[int, list[dict]]:
        return ProviderRepository.get_providers(db, search, watchlisted, risk_level, skip, limit, sort_by, sort_dir)
