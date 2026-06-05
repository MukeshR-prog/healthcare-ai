from datetime import datetime, timezone
from pymongo.database import Database
from app.models.report import ScheduledReport, Report
from app.repositories.report_repository import ReportRepository
from app.services.report_service import ReportService
from app.services.audit_service import AuditService

class ScheduledReportService:
    @staticmethod
    def register_schedule(db: Database, report_type: str, frequency: str, created_by: str) -> ScheduledReport:
        schedule = ScheduledReport(
            report_type=report_type,
            frequency=frequency,
            enabled=True,
            created_by=created_by,
            created_at=datetime.now(timezone.utc)
        )
        inserted_id = ReportRepository.save_schedule(db, schedule)
        schedule.id = inserted_id
        
        AuditService.log_event(
            db=db,
            event_type="REPORT_SCHEDULE_CREATED",
            entity_type="REPORT",
            entity_id=inserted_id,
            action="CREATE",
            description=f"Automated schedule registered: {report_type} ({frequency}).",
            performed_by=created_by,
            metadata={"frequency": frequency, "reportType": report_type}
        )
        return schedule

    @staticmethod
    def get_schedules(db: Database) -> list[dict]:
        return ReportRepository.get_schedules(db)

    @staticmethod
    def execute_scheduled_runs(db: Database, operator_email: str = "system") -> list[Report]:
        schedules = list(db["scheduled_reports"].find({"enabled": True}))
        generated_reports = []
        for s in schedules:
            report_type = s.get("report_type")
            frequency = s.get("frequency")
            created_by = s.get("created_by", operator_email)
            
            title = f"Automated {frequency} {report_type} Report"
            time_range = "Last 30 Days"
            if frequency == "Monthly":
                time_range = "Year to Date"
            
            report = ReportService.generate_report(
                db=db,
                title=title,
                report_type=report_type,
                time_range=time_range,
                operator_email=created_by
            )
            
            ReportRepository.create_report(db, report)
            generated_reports.append(report)
            
            AuditService.log_event(
                db=db,
                event_type="REPORT_SCHEDULE_EXECUTED",
                entity_type="REPORT",
                entity_id=report.report_id,
                action="CREATE",
                description=f"Scheduled execution succeeded for report: {title}.",
                performed_by="system",
                metadata={"scheduleId": str(s.get("_id")), "frequency": frequency}
            )
        return generated_reports
