from pymongo.database import Database
from app.models.report import Report, ReportTemplate, ReportExport

class ReportRepository:
    @staticmethod
    def create_report(db: Database, report: Report) -> str:
        payload = report.model_dump(by_alias=True, exclude={"id"})
        result = db["reports"].insert_one(payload)
        return str(result.inserted_id)

    @staticmethod
    def get_report(db: Database, report_id: str) -> dict | None:
        return db["reports"].find_one({"report_id": report_id})

    @staticmethod
    def get_reports(db: Database, skip: int = 0, limit: int = 100) -> list[dict]:
        return list(db["reports"].find().sort("generated_at", -1).skip(skip).limit(limit))

    @staticmethod
    def delete_report(db: Database, report_id: str) -> bool:
        res = db["reports"].delete_one({"report_id": report_id})
        return res.deleted_count > 0

    @staticmethod
    def save_template(db: Database, template: ReportTemplate) -> str:
        payload = template.model_dump(by_alias=True, exclude={"id"})
        result = db["report_templates"].insert_one(payload)
        return str(result.inserted_id)

    @staticmethod
    def get_templates(db: Database) -> list[dict]:
        return list(db["report_templates"].find().sort("created_at", -1))

    @staticmethod
    def save_export(db: Database, export: ReportExport) -> str:
        payload = export.model_dump(by_alias=True, exclude={"id"})
        result = db["report_exports"].insert_one(payload)
        return str(result.inserted_id)

    @staticmethod
    def get_exports(db: Database) -> list[dict]:
        return list(db["report_exports"].find().sort("created_at", -1))
