class PromptService:
    @staticmethod
    def format_provider_context(providers: list[dict]) -> str:
        text = "Top Risk Providers:\n"
        for p in providers[:5]:
            name = p.get("provider_name", p.get("name", "Unknown"))
            score = p.get("riskScore", p.get("score", 0))
            claims = p.get("claimsCount", p.get("claims", 0))
            amount = p.get("totalClaimAmount", p.get("amount", 0))
            text += f"- {name}: Composite Score={score}%, Claims Billed={claims}, Billed Amount=${amount:,.2f}\n"
        return text

    @staticmethod
    def format_cases_context(cases: list[dict]) -> str:
        text = "Open/Critical Cases:\n"
        for c in cases[:5]:
            cid = c.get("case_id", c.get("id", "Unknown"))
            provider = c.get("provider", "Unknown")
            priority = c.get("priority", "Medium")
            status = c.get("status", "New")
            amount = c.get("amount", c.get("claim_amount", 0))
            score = c.get("riskScore", c.get("risk_score", 0))
            text += f"- Case {cid}: Provider={provider}, Priority={priority}, Status={status}, Risk={score}%, Claim Amount=${amount:,.2f}\n"
        return text

    @staticmethod
    def format_alerts_context(alerts: list[dict]) -> str:
        text = "Recent Alerts:\n"
        for a in alerts[:5]:
            aid = a.get("id", a.get("_id", "Unknown"))
            provider = a.get("provider", "Unknown")
            severity = a.get("severity", "Medium")
            status = a.get("status", "New")
            amount = a.get("claim_amount", a.get("claimAmount", 0))
            text += f"- Alert {aid}: Provider={provider}, Severity={severity}, Status={status}, Amount=${amount:,.2f}\n"
        return text

    @staticmethod
    def format_documents_context(documents: list[dict]) -> str:
        text = "Document Verifications & Mismatches:\n"
        mismatches = [d for d in documents if d.get("status") == "Mismatch"]
        for d in mismatches[:5]:
            did = d.get("document_id", d.get("id", "Unknown"))
            filename = d.get("file_name", d.get("fileName", "Unknown"))
            status = d.get("status", "Unknown")
            discrepancy = d.get("discrepancy", "No details")
            text += f"- Doc {did} ({filename}): Status={status}, Discrepancy={discrepancy}\n"
        return text

    @staticmethod
    def format_explainability_context(explanations: list[dict]) -> str:
        text = "Model Explainability Summary:\n"
        for e in explanations[:5]:
            pid = e.get("prediction_id", "Unknown")
            risk = e.get("risk_level", "Unknown")
            score = e.get("confidence_score", 0.0)
            text += f"- Prediction {pid}: Risk={risk}, Confidence={score * 100:.1f}%\n"
        return text

    @staticmethod
    def format_reports_context(reports: list[dict]) -> str:
        text = "Executive Reports archive:\n"
        for r in reports[:3]:
            rid = r.get("report_id", r.get("id", "Unknown"))
            title = r.get("title", "Unknown")
            rtype = r.get("report_type", "Unknown")
            text += f"- Report {rid}: Title='{title}', Type={rtype}\n"
        return text

    @classmethod
    def build_prompt(cls, intent: str, context: dict, query: str) -> str:
        system_instruction = (
            "You are the Healthcare AI Fraud Copilot, a context-aware AI fraud analyst assisting investigators. "
            "Use the provided context records to give highly detailed, metrics-based explanations and recommendations. "
            "Be precise, professional, and clear. Format output in readable markdown lists/headings where appropriate.\n\n"
        )
        
        context_str = "--- CONTEXT DATABASE RECORDS ---\n"
        context_str += cls.format_provider_context(context.get("providers", [])) + "\n"
        context_str += cls.format_cases_context(context.get("cases", [])) + "\n"
        context_str += cls.format_alerts_context(context.get("alerts", [])) + "\n"
        context_str += cls.format_documents_context(context.get("documents", [])) + "\n"
        context_str += cls.format_explainability_context(context.get("explanations", [])) + "\n"
        context_str += cls.format_reports_context(context.get("reports", [])) + "\n"
        context_str += "---------------------------------\n\n"
        
        prompt = f"{system_instruction}{context_str}Intent Class: {intent}\nUser Request: {query}\n\nAI Response:"
        return prompt
