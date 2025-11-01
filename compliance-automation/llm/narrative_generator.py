"""
LLM Narrative Generator

CRITICAL: This module uses LLMs ONLY for narrative generation, NOT for decision-making.
All pass/fail determinations are made by the deterministic rules engine.
The LLM only drafts human-readable narratives from pre-determined findings.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
import anthropic
import os

from ..engine.rules_engine import ComplianceReport, ComplianceFinding
from ..schemas.canonical_schema import ComplianceProject


class NarrativeGenerator:
    """
    Generate human-readable narratives from compliance findings using LLM.

    IMPORTANT: This class receives findings that have already been evaluated
    by the deterministic rules engine. It does NOT make pass/fail decisions.
    """

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize narrative generator

        Args:
            api_key: Anthropic API key (defaults to ANTHROPIC_API_KEY env var)
        """
        self.api_key = api_key or os.getenv("ANTHROPIC_API_KEY")
        if not self.api_key:
            raise ValueError("ANTHROPIC_API_KEY must be provided or set in environment")

        self.client = anthropic.Anthropic(api_key=self.api_key)

    def generate_executive_summary(
        self,
        project: ComplianceProject,
        report: ComplianceReport
    ) -> str:
        """
        Generate executive summary narrative

        Args:
            project: Project data
            report: Compliance report with findings

        Returns:
            Executive summary text
        """
        # Prepare context from findings (already evaluated)
        context = self._prepare_context(project, report)

        prompt = f"""You are a sustainability consultant writing an executive summary for a compliance report.

IMPORTANT: All compliance decisions have already been made by the rules engine. You are ONLY writing a narrative summary of the findings. Do NOT re-evaluate or make new pass/fail determinations.

Project: {project.project_name}
Type: {project.project_type}
Overall Status: {'COMPLIANT' if report.compliant else 'NON-COMPLIANT'}

Findings Summary:
- Total Checks: {report.total_checks}
- Passed: {report.passed_checks}
- Failed: {report.failed_checks}
- Critical Issues: {report.critical_count}
- High Issues: {report.high_count}
- Medium Issues: {report.medium_count}

Carbon Metrics:
- Total Embodied Carbon: {project.total_embodied_carbon()} kg CO2-e
- Carbon Intensity: {project.carbon_intensity_per_m2() or 'N/A'} kg CO2-e/m²

Top Issues:
{self._format_top_issues(report)}

Write a concise executive summary (3-4 paragraphs) covering:
1. Overall compliance status and key metrics
2. Most significant findings and their implications
3. Recommended priority actions
4. Overall readiness for certification

Use professional but accessible language. Focus on facts from the findings, not new evaluations."""

        response = self.client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=1500,
            temperature=0.3,  # Low temperature for consistency
            messages=[{"role": "user", "content": prompt}]
        )

        return response.content[0].text

    def generate_finding_narrative(
        self,
        finding: ComplianceFinding,
        project: ComplianceProject
    ) -> str:
        """
        Generate narrative description for a single finding

        Args:
            finding: Compliance finding (already evaluated)
            project: Project context

        Returns:
            Narrative text
        """
        prompt = f"""You are a compliance specialist explaining a finding to a project team.

IMPORTANT: This finding has already been evaluated by the rules engine. You are ONLY explaining it in clear language. Do NOT re-evaluate or change the pass/fail status.

Finding:
- Rule: {finding.rule_name}
- Status: {'PASS' if finding.passed else 'FAIL'}
- Severity: {finding.severity}
- Description: {finding.description}

Remediation:
- Action: {finding.remediation.action}
- Responsible: {finding.remediation.responsible_party}

Context:
- Project: {project.project_name}
- Project Type: {project.project_type}

Write a 2-3 sentence narrative explaining:
1. What this finding means in practical terms
2. Why it matters for the project
3. (If failed) What specific action is needed

Use clear, non-technical language where possible."""

        response = self.client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=300,
            temperature=0.3,
            messages=[{"role": "user", "content": prompt}]
        )

        return response.content[0].text

    def generate_remediation_guidance(
        self,
        findings: List[ComplianceFinding],
        project: ComplianceProject
    ) -> str:
        """
        Generate detailed remediation guidance for multiple findings

        Args:
            findings: List of failed findings (already evaluated)
            project: Project context

        Returns:
            Remediation guidance text
        """
        if not findings:
            return "No remediation required - all checks passed."

        # Group by severity
        critical = [f for f in findings if f.severity == "CRITICAL"]
        high = [f for f in findings if f.severity == "HIGH"]
        medium = [f for f in findings if f.severity == "MEDIUM"]

        findings_summary = []
        if critical:
            findings_summary.append(f"- {len(critical)} CRITICAL issues")
        if high:
            findings_summary.append(f"- {len(high)} HIGH severity issues")
        if medium:
            findings_summary.append(f"- {len(medium)} MEDIUM severity issues")

        prompt = f"""You are a compliance consultant creating an action plan to resolve compliance findings.

IMPORTANT: All findings have already been evaluated by the rules engine. You are ONLY organizing the remediation actions into a clear plan. Do NOT re-evaluate or change any findings.

Project: {project.project_name}

Issues to Address:
{chr(10).join(findings_summary)}

Detailed Issues:
{self._format_findings_for_llm(findings[:10])}  # Top 10 issues

Create a practical remediation plan with:
1. Priority timeline (immediate, short-term, long-term)
2. Responsible parties and their tasks
3. Resources needed
4. Estimated effort/complexity
5. Dependencies between actions

Format as a clear, actionable plan that a project team can follow."""

        response = self.client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=2000,
            temperature=0.3,
            messages=[{"role": "user", "content": prompt}]
        )

        return response.content[0].text

    def generate_certification_readiness_assessment(
        self,
        project: ComplianceProject,
        report: ComplianceReport
    ) -> str:
        """
        Generate assessment of readiness for certification

        Args:
            project: Project data
            report: Compliance report with findings

        Returns:
            Assessment text
        """
        prompt = f"""You are a certification assessor reviewing a project's readiness for green building certification.

IMPORTANT: All compliance checks have already been completed by the rules engine. You are ONLY writing an assessment narrative based on the results. Do NOT make new compliance decisions.

Project: {project.project_name}
Type: {project.project_type}

Compliance Status:
- Overall: {'COMPLIANT' if report.compliant else 'NON-COMPLIANT'}
- Pass Rate: {(report.passed_checks / report.total_checks * 100):.1f}%
- Critical Issues: {report.critical_count}
- High Issues: {report.high_count}

Carbon Performance:
- Total: {project.total_embodied_carbon()} kg CO2-e
- Intensity: {project.carbon_intensity_per_m2() or 'N/A'} kg CO2-e/m²

Data Coverage:
- EPDs: {len(project.epds)}
- Invoices: {len(project.invoices)}
- BIM Models: {len(project.bim_models)}

Write a 3-4 paragraph certification readiness assessment covering:
1. Current compliance status against standards (NCC, GHG Protocol)
2. Completeness and quality of documentation
3. Outstanding issues and their impact on certification
4. Recommended next steps and timeline to certification

Be specific about what is needed before the project can proceed to certification."""

        response = self.client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=1500,
            temperature=0.3,
            messages=[{"role": "user", "content": prompt}]
        )

        return response.content[0].text

    def generate_stakeholder_communication(
        self,
        report: ComplianceReport,
        project: ComplianceProject,
        audience: str = "executive"
    ) -> str:
        """
        Generate stakeholder communication tailored to audience

        Args:
            report: Compliance report
            project: Project data
            audience: Target audience ("executive", "technical", "client")

        Returns:
            Communication text
        """
        audience_guidance = {
            "executive": "senior executives (focus on business impact, risk, timeline)",
            "technical": "technical team members (focus on specific issues, data, actions)",
            "client": "client stakeholders (focus on outcomes, certification readiness)"
        }

        guidance = audience_guidance.get(audience, audience_guidance["executive"])

        prompt = f"""You are writing a compliance update for {guidance}.

IMPORTANT: All findings have been determined by the rules engine. You are ONLY communicating the results effectively. Do NOT re-evaluate or make new compliance decisions.

Project: {project.project_name}
Compliance Status: {'COMPLIANT' if report.compliant else 'NON-COMPLIANT'}
Critical Issues: {report.critical_count}
High Issues: {report.high_count}

Write a concise update (2-3 paragraphs) appropriate for this audience, covering:
- Current status
- Key findings relevant to this audience
- Implications and next steps
- Timeline considerations

Adjust tone and technical depth for the audience."""

        response = self.client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=800,
            temperature=0.3,
            messages=[{"role": "user", "content": prompt}]
        )

        return response.content[0].text

    # ========================================================================
    # HELPER METHODS
    # ========================================================================

    def _prepare_context(
        self,
        project: ComplianceProject,
        report: ComplianceReport
    ) -> Dict[str, Any]:
        """Prepare context data for LLM prompts"""
        return {
            'project_name': project.project_name,
            'project_type': project.project_type,
            'compliant': report.compliant,
            'total_checks': report.total_checks,
            'passed_checks': report.passed_checks,
            'failed_checks': report.failed_checks,
            'critical_count': report.critical_count,
            'high_count': report.high_count,
            'medium_count': report.medium_count,
            'total_carbon': project.total_embodied_carbon(),
            'carbon_intensity': project.carbon_intensity_per_m2()
        }

    def _format_top_issues(self, report: ComplianceReport, limit: int = 5) -> str:
        """Format top issues for LLM prompt"""
        failed_findings = [f for f in report.findings if not f.passed]

        # Sort by severity
        severity_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3, "WARNING": 4}
        failed_findings.sort(key=lambda f: severity_order.get(f.severity, 99))

        lines = []
        for i, finding in enumerate(failed_findings[:limit], 1):
            lines.append(f"{i}. [{finding.severity}] {finding.rule_name}: {finding.description[:100]}...")

        return "\n".join(lines) if lines else "No issues found"

    def _format_findings_for_llm(self, findings: List[ComplianceFinding]) -> str:
        """Format findings for LLM prompt"""
        lines = []
        for finding in findings:
            lines.append(f"""
- Rule: {finding.rule_name}
  Severity: {finding.severity}
  Issue: {finding.description}
  Action: {finding.remediation.action}
  Responsible: {finding.remediation.responsible_party}
""")
        return "\n".join(lines)


# ============================================================================
# SAFETY VALIDATOR
# ============================================================================

class LLMOutputValidator:
    """
    Validates that LLM output does not contain compliance decisions.

    This ensures the LLM stayed in its lane and only generated narrative,
    not new pass/fail determinations.
    """

    FORBIDDEN_PATTERNS = [
        r"this (passes|fails|is compliant|is non-compliant)",
        r"I (determine|conclude|find) that",
        r"(should be|must be) marked as (pass|fail)",
        r"my analysis (shows|indicates|suggests) (pass|fail)",
        r"based on (my|the) evaluation, this (passes|fails)"
    ]

    @staticmethod
    def validate(text: str) -> tuple[bool, List[str]]:
        """
        Validate LLM output doesn't contain compliance decisions

        Args:
            text: LLM generated text

        Returns:
            Tuple of (is_valid, list_of_violations)
        """
        import re

        violations = []
        text_lower = text.lower()

        for pattern in LLMOutputValidator.FORBIDDEN_PATTERNS:
            matches = re.finditer(pattern, text_lower, re.IGNORECASE)
            for match in matches:
                violations.append(f"Forbidden pattern found: '{match.group()}'")

        # Check for explicit decision language
        if "i determined" in text_lower or "i evaluated" in text_lower:
            violations.append("LLM appears to be making independent evaluations")

        is_valid = len(violations) == 0
        return is_valid, violations

    @staticmethod
    def sanitize(text: str) -> str:
        """
        Remove any decision-making language from LLM output

        Args:
            text: LLM generated text

        Returns:
            Sanitized text
        """
        import re

        # Replace decision-making language with neutral phrasing
        replacements = {
            r"I (determine|conclude|find) that": "The rules engine determined that",
            r"my analysis": "the analysis",
            r"based on my evaluation": "based on the evaluation",
            r"I (recommend|suggest)": "It is recommended"
        }

        sanitized = text
        for pattern, replacement in replacements.items():
            sanitized = re.sub(pattern, replacement, sanitized, flags=re.IGNORECASE)

        return sanitized
