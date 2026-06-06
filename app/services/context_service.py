from pymongo.database import Database
from app.services.alert_service import AlertService
from app.services.investigation_service import InvestigationService
from app.services.provider_service import ProviderService
from app.services.document_service import DocumentService
from app.services.explainability_service import ExplainabilityService
from app.services.report_service import ReportService

class ContextService:
    @staticmethod
    def build_copilot_context(db: Database) -> dict:
        # Fetch data using service layers to avoid direct collection access
        _, alerts = AlertService.get_alerts(db, limit=100)
        _, cases = InvestigationService.get_cases(db, limit=100)
        _, providers = ProviderService.get_providers(db, limit=100)
        _, documents = DocumentService.get_documents(db, limit=100)
        explanations = ExplainabilityService.get_explanations(db, limit=100)
        reports = ReportService.get_reports(db, limit=100)
        
        return {
            "alerts": alerts,
            "cases": cases,
            "providers": providers,
            "documents": documents,
            "explanations": explanations,
            "reports": reports
        }
