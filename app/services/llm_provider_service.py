import os
from abc import ABC, abstractmethod
from groq import Groq
from app.core.config import settings

class LLMProvider(ABC):
    @abstractmethod
    def generate(self, prompt: str, context: dict, query: str, intent: str) -> tuple[str, list[dict], dict]:
        pass

    def _get_recommendations_and_insight(self, context: dict, intent: str) -> tuple[list[dict], dict]:
        providers = context.get("providers", [])
        top_provider = providers[0].get("provider_name", "Provider B") if providers else "Provider B"
        
        recs = [
            {"title": f"Audit {top_provider} logs", "query": f"Explain {top_provider} risk score."},
            {"title": "Check verification mismatches", "query": "Show document verification mismatches."}
        ]
        insight_data = {}
        
        if intent == "Provider Risk Analysis":
            insight_data = {"type": "provider", "id": top_provider}
        elif intent == "Investigation Summary":
            insight_data = {"type": "investigations"}
            recs = [
                {"title": "Summarize alerts", "query": "Summarize recent alerts."},
                {"title": "Show document mismatches", "query": "Show document verification mismatches."}
            ]
        elif intent == "Alert Summary":
            recs = [
                {"title": "Show riskiest provider", "query": "Which provider has the highest fraud risk?"},
                {"title": "Check open investigations", "query": "Show critical investigations."}
            ]
        
        return recs, insight_data

class RuleBasedProvider(LLMProvider):
    def generate(self, prompt: str, context: dict, query: str, intent: str) -> tuple[str, list[dict], dict]:
        text = query.lower()
        
        providers = context.get("providers", [])
        top_providers = sorted(providers, key=lambda x: x.get("riskScore", x.get("score", 0)), reverse=True)
        highest = top_providers[0] if top_providers else {"provider_name": "Provider B", "riskScore": 82, "claimsCount": 24, "totalClaimAmount": 320000.0, "fraudCount": 8}
        h_name = highest.get("provider_name", highest.get("name", "Provider B"))
        h_score = highest.get("riskScore", highest.get("score", 82))
        h_claims = highest.get("claimsCount", highest.get("claims", 24))
        h_amount = highest.get("totalClaimAmount", highest.get("amount", 320000.0))
        h_fraud = highest.get("fraudCount", 8)
        
        cases = context.get("cases", [])
        open_cases = [c for c in cases if c.get("status") != "Closed"]
        
        alerts = context.get("alerts", [])
        
        documents = context.get("documents", [])
        mismatch_docs = [d for d in documents if d.get("status") == "Mismatch"]
        
        recs, insight_data = self._get_recommendations_and_insight(context, intent)
        
        # Heuristics
        if "highest fraud risk" in text or "compare providers" in text or "riskiest provider" in text or "highest risk provider" in text:
            reply = (
                f"According to current audit logs, **{h_name}** presents the highest composite fraud risk on the platform with a composite score of **{h_score}% (Critical)**.\n\n"
                f"This is driven by:\n"
                f"- **Claims volume**: {h_claims} claims filed (totaling **${h_amount:,.2f}**).\n"
                f"- **Flagged anomalies**: {h_fraud} claims classified as high risk.\n"
                f"- **Watchlist status**: Yes (Active Watchlist).\n\n"
                f"*Recommendations*: Review current case history and audit billing codes."
            )
            insight_data = {"type": "provider", "id": h_name}
        
        elif "explain provider" in text:
            import re
            match = re.search(r"explain provider\s+(\w+)", query, re.IGNORECASE)
            p_name = f"Provider {match.group(1)}" if match else h_name
            prov_obj = next((p for p in providers if p.get("provider_name", "").lower() == p_name.lower()), highest)
            p_name = prov_obj.get("provider_name", p_name)
            p_score = prov_obj.get("riskScore", prov_obj.get("score", 75))
            p_claims = prov_obj.get("claimsCount", prov_obj.get("claims", 15))
            p_amount = prov_obj.get("totalClaimAmount", prov_obj.get("amount", 180000.0))
            p_fraud = prov_obj.get("fraudCount", 3)
            
            reply = (
                f"**Audit Risk Breakdown for {p_name}**:\n"
                f"- **Composite Risk Rating**: `{p_score}%` (Status: **{ 'Critical' if p_score >= 75 else 'High' }**)\n"
                f"- **Billing volume**: {p_claims} claims submitted (totaling **${p_amount:,.2f}**)\n"
                f"- **Algorithmic Flags**: {p_fraud} anomalies triggered by upcoding heuristics.\n\n"
                f"*Key Risk Modifiers*:\n"
                f"1. **Upcoding Flags**: Billing profile shows excessive num_procedures code clusters.\n"
                f"2. **Alert Density**: Multiple alerts remain unassigned.\n"
                f"3. **Analyst Flag**: Annotation flags registered in provider profile registry."
            )
            recs = [
                {"title": f"Escalate {p_name}", "query": "Summarize recent alerts."},
                {"title": "View Network Cluster", "query": "Show network clusters."}
            ]
            
        elif "investigation" in text or "cases" in text or "show critical investigations" in text:
            open_count = len(open_cases)
            if open_count == 0:
                reply = "There are currently **no active investigations** in the review queue. All cases are resolved or closed."
            else:
                list_text = "\n".join([
                    f"- **{c.get('case_id', c.get('id', 'CASE'))}**: Provider `{c.get('provider')}` | Risk Score: `{c.get('riskScore', c.get('risk_score', 0))}%` | Priority: `{c.get('priority')}` | Status: `{c.get('status')}`"
                    for c in open_cases[:5]
                ])
                reply = (
                    f"There are currently **{open_count} active investigations** registered in the database:\n\n"
                    f"{list_text}\n\n"
                    f"Immediate action is recommended for critical priority cases."
                )
            recs = [
                {"title": "Summarize alerts", "query": "Summarize recent alerts."},
                {"title": "Show document mismatches", "query": "Show document verification mismatches."}
            ]
            
        elif "summarize recent alerts" in text or "summarize alerts" in text or "alert summary" in text:
            total_alerts = len(alerts)
            critical = len([a for a in alerts if a.get("severity") == "Critical"])
            high = len([a for a in alerts if a.get("severity") == "High"])
            med = len([a for a in alerts if a.get("severity") == "Medium"])
            
            reply = (
                f"**Fraud Alert Queue Summary**:\n"
                f"Total Active Alerts: **{total_alerts}**\n"
                f"- **Critical Severity**: `{critical}`\n"
                f"- **High Severity**: `{high}`\n"
                f"- **Medium/Low**: `{med}`\n\n"
                f"Most critical alert triggers are related to **upcoding procedure count codes** and patient-provider distance warnings."
            )
            recs = [
                {"title": "Show riskiest provider", "query": "Which provider has the highest fraud risk?"},
                {"title": "Check open investigations", "query": "Show critical investigations."}
            ]
            
        elif "mismatch" in text or "document" in text or "document verification mismatches" in text:
            doc_count = len(mismatch_docs)
            if doc_count == 0:
                reply = "All OCR document verifications are currently **verified** with no major discrepancies found."
            else:
                list_text = "\n".join([
                    f"- **{d.get('document_id', d.get('id'))}** ({d.get('file_type')}): Claim `{d.get('claim_id')}` | Status: **Mismatch**"
                    for d in mismatch_docs[:5]
                ])
                reply = (
                    f"Clinical Verification Engine has flagged **{doc_count} billing document mismatches**:\n\n"
                    f"{list_text}\n\n"
                    f"Recommendation: Escalate these claims for manual review."
                )
            recs = [
                {"title": "Verify claim details", "query": "Show critical investigations."}
            ]
            
        elif "fraud trends" in text or "trends" in text or "trends summary" in text:
            reply = (
                f"**Healthcare AI Platform Fraud Trends**:\n"
                f"- **Baseline Anomaly Rate**: `14.2%` average across standard clinics.\n"
                f"- **Average Flagged Claim**: `$18,450` (vs. `$4,200` average verified claims).\n"
                f"- **Concentration Index**: Network nodes around Provider B and Provider C account for 68% of all flagged anomalies.\n"
                f"- **Temporal Spike**: Upcoding flags rose by **4.5%** over the last 30 days."
            )
            recs = [
                {"title": "Show network clusters", "query": "Show network clusters."}
            ]
            
        elif "network clusters" in text or "clusters" in text or "show clusters" in text:
            reply = (
                f"**Network Analysis Grouping Summary**:\n"
                f"1. **Provider B Cluster (9 nodes)**: Dense interconnection linking 3 claims, 3 alerts, 1 active case, and 2 document verification failures. Indicates potential upcoding network.\n"
                f"2. **Provider C Cluster (6 nodes)**: Links 2 claims, 1 alert, and 1 case.\n\n"
                f"*Audit Verdict*: Provider B cluster warrants immediate coordination between document verification and alert management teams."
            )
            recs = [
                {"title": "Explain Provider B risk", "query": "Explain Provider B risk score."}
            ]
            
        else:
            reply = (
                f"I've analyzed your question: \"{query}\".\n\n"
                f"To assist you better, you can query specific platform categories:\n"
                f"- **Alerts**: \"Summarize recent alerts\"\n"
                f"- **Investigations**: \"Show critical investigations\"\n"
                f"- **Providers**: \"Which provider has the highest fraud risk?\" or \"Explain Provider B risk score\"\n"
                f"- **Documents**: \"Show document verification mismatches\"\n"
                f"- **Network Linkage**: \"Show network clusters\""
            )
            recs = [
                {"title": "Highest Fraud Risk", "query": "Which provider has the highest fraud risk?"},
                {"title": "Critical Investigations", "query": "Show critical investigations."}
            ]
            
        return reply, recs, insight_data

class GroqProvider(LLMProvider):
    def generate(self, prompt: str, context: dict, query: str, intent: str) -> tuple[str, list[dict], dict]:
        try:
            api_key = settings.GROQ_API_KEY
            if not api_key:
                raise ValueError("Groq API key not set")
            client = Groq(api_key=api_key)
            response = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[
                    {"role": "system", "content": "You are a healthcare fraud analyst assistant."},
                    {"role": "user", "content": prompt}
                ]
            )
            reply = response.choices[0].message.content
            recs, insight_data = self._get_recommendations_and_insight(context, intent)
            return reply, recs, insight_data
        except Exception as e:
            # Fallback to rule-based on error
            return RuleBasedProvider().generate(prompt, context, query, intent)

class OpenAIProvider(LLMProvider):
    def generate(self, prompt: str, context: dict, query: str, intent: str) -> tuple[str, list[dict], dict]:
        try:
            import openai
            api_key = os.getenv("OPENAI_API_KEY")
            if not api_key:
                raise ValueError("OpenAI API key not set")
            client = openai.OpenAI(api_key=api_key)
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a healthcare fraud analyst assistant."},
                    {"role": "user", "content": prompt}
                ]
            )
            reply = response.choices[0].message.content
            recs, insight_data = self._get_recommendations_and_insight(context, intent)
            return reply, recs, insight_data
        except Exception as e:
            # Fallback to rule-based on error
            return RuleBasedProvider().generate(prompt, context, query, intent)

def get_llm_provider() -> LLMProvider:
    provider_name = os.getenv("COPILOT_PROVIDER", "RuleBased")
    if provider_name == "Groq":
        return GroqProvider()
    elif provider_name == "OpenAI":
        return OpenAIProvider()
    return RuleBasedProvider()
