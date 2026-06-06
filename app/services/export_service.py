import csv
import io
import json
from datetime import datetime, timezone
# pyrefly: ignore [missing-import]
from pymongo.database import Database
from app.models.report import ReportExport
from app.repositories.report_repository import ReportRepository
from app.services.audit_service import AuditService

class ExportService:
    @staticmethod
    def generate_minimal_pdf(title: str, content: str) -> bytes:
        # A minimal textual PDF format that is valid and readable by standard PDF parsers
        pdf_template = (
            "%PDF-1.4\n"
            "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
            "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"
            "3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 612 792] /Contents 5 0 R >>\nendobj\n"
            "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n"
        )
        
        # Escape parentheses for safety in PDF stream strings
        safe_title = title.replace("(", "\\(").replace(")", "\\)")
        
        # Build text commands in PDF stream
        stream_commands = [
            "BT",
            "/F1 16 Tf",
            "50 720 Td",
            f"({safe_title}) Tj",
            "/F1 10 Tf",
            "0 -30 Td"
        ]
        
        # Split text content into individual lines and map them with 15pt line leading
        for line in content.split("\n"):
            line = line.strip()
            if not line:
                stream_commands.append("0 -15 Td () Tj")
                continue
            
            # Escape parenthesis
            escaped_line = line.replace("(", "\\(").replace(")", "\\)")
            # If line is very long, wrap it roughly at 80 characters for simple formatting
            chunk_size = 80
            chunks = [escaped_line[i:i+chunk_size] for i in range(0, len(escaped_line), chunk_size)]
            for chunk in chunks:
                stream_commands.append(f"0 -15 Td ({chunk}) Tj")
                
        stream_commands.append("ET")
        stream_content = "\n".join(stream_commands)
        
        stream_bytes = stream_content.encode("utf-8")
        stream_len = len(stream_bytes)
        
        pdf_body = (
            f"5 0 obj\n<< /Length {stream_len} >>\nstream\n"
        ).encode("utf-8") + stream_bytes + f"\nendstream\nendobj\n".encode("utf-8")
        
        pdf_tail = (
            "xref\n"
            "0 6\n"
            "0000000000 65535 f \n"
            "trailer\n<< /Size 6 /Root 1 0 R >>\n"
            "startxref\n"
            "10\n"
            "%%EOF\n"
        )
        
        return pdf_template.encode("utf-8") + pdf_body + pdf_tail.encode("utf-8")

    @classmethod
    def export_report(
        cls,
        db: Database,
        report: dict,
        export_type: str,
        operator_email: str
    ) -> bytes:
        report_id = report.get("report_id", "RPT-UNKNOWN")
        title = report.get("title", "Executive Report")
        
        # 1. Compile file contents in bytes
        if export_type.upper() == "CSV":
            output = io.StringIO()
            writer = csv.writer(output)
            writer.writerow(["Metric Attribute", "Computed Value"])
            for row in report.get("table_data", []):
                writer.writerow([row.get("field"), row.get("val")])
            file_bytes = output.getvalue().encode("utf-8")
            
        elif export_type.upper() == "JSON":
            file_bytes = json.dumps(report, default=str, indent=2).encode("utf-8")
            
        elif export_type.upper() == "PDF":
            # Formulate textual layout
            timestamp = report.get("generated_at")
            if isinstance(timestamp, datetime):
                time_str = timestamp.strftime("%Y-%m-%d %H:%M:%S")
            else:
                time_str = str(timestamp)
                
            report_text = (
                f"Report Type: {report.get('report_type')}\n"
                f"Period timeframe: {report.get('filters', {}).get('timeRange', 'Last 30 Days')}\n"
                f"Compiled by: {report.get('generated_by')}\n"
                f"Generated At: {time_str}\n"
                f"Processing Status: {report.get('status')}\n"
                "--------------------------------------------------------------------------------\n"
                f"EXECUTIVE SUMMARY:\n"
                f"{report.get('summary')}\n"
                "--------------------------------------------------------------------------------\n"
                f"METRICS REGISTRY:\n"
            )
            for k, v in report.get("metrics", {}).items():
                report_text += f" - {k}: {v}\n"
                
            report_text += "--------------------------------------------------------------------------------\n"
            report_text += f"COMPUTED ATTRIBUTES:\n"
            for row in report.get("table_data", []):
                report_text += f" - {row.get('field')}: {row.get('val')}\n"
                
            file_bytes = cls.generate_minimal_pdf(title, report_text)
            
        else:
            raise ValueError(f"Unsupported export type: {export_type}")

        # 2. Persist history log to report_exports
        export_record = ReportExport(
            report_id=report_id,
            export_type=export_type.upper(),
            file_size=len(file_bytes),
            download_count=1,
            generated_by=operator_email,
            created_at=datetime.now(timezone.utc)
        )
        ReportRepository.save_export(db, export_record)

        # 3. Log REPORT_EXPORTED audit event
        AuditService.log_event(
            db=db,
            event_type="REPORT_EXPORTED",
            entity_type="REPORT",
            entity_id=report_id,
            action="EXPORT",
            description=f"Report {report_id} exported to {export_type.upper()} format.",
            performed_by=operator_email,
            metadata={"exportType": export_type.upper()}
        )

        return file_bytes
