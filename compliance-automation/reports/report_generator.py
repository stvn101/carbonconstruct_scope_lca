"""
Compliance Report Generator

Generates templated reports with citations from compliance findings.
Supports multiple output formats (HTML, PDF, JSON, Markdown).
"""

from datetime import datetime
from typing import List, Dict, Any, Optional
from pathlib import Path
from jinja2 import Environment, FileSystemLoader, Template
import json

from ..engine.rules_engine import ComplianceReport, ComplianceFinding
from ..schemas.canonical_schema import ComplianceProject


class ReportGenerator:
    """Generate compliance reports with citations and evidence"""

    def __init__(self, templates_dir: Optional[str] = None):
        """
        Initialize report generator

        Args:
            templates_dir: Directory containing Jinja2 templates
        """
        if templates_dir:
            self.templates_dir = Path(templates_dir)
        else:
            self.templates_dir = Path(__file__).parent / "templates"

        # Initialize Jinja2 environment
        self.env = Environment(
            loader=FileSystemLoader(str(self.templates_dir)),
            autoescape=True
        )

        # Register custom filters
        self.env.filters['datetime'] = self._format_datetime
        self.env.filters['severity_badge'] = self._severity_badge
        self.env.filters['status_badge'] = self._status_badge

    def generate_html_report(
        self,
        project: ComplianceProject,
        report: ComplianceReport,
        output_path: str
    ) -> str:
        """
        Generate HTML compliance report

        Args:
            project: Project data
            report: Compliance report with findings
            output_path: Output file path

        Returns:
            Path to generated report
        """
        template = self.env.get_template("compliance_report.html")

        # Prepare data
        context = self._prepare_context(project, report)

        # Render template
        html = template.render(**context)

        # Write to file
        output_file = Path(output_path)
        output_file.parent.mkdir(parents=True, exist_ok=True)
        output_file.write_text(html, encoding='utf-8')

        return str(output_file)

    def generate_pdf_report(
        self,
        project: ComplianceProject,
        report: ComplianceReport,
        output_path: str
    ) -> str:
        """
        Generate PDF compliance report (via HTML and weasyprint)

        Args:
            project: Project data
            report: Compliance report
            output_path: Output PDF path

        Returns:
            Path to generated PDF
        """
        try:
            from weasyprint import HTML, CSS
        except ImportError:
            raise ImportError("weasyprint is required for PDF generation. Install with: pip install weasyprint")

        # First generate HTML
        html_content = self._generate_html_string(project, report)

        # Convert to PDF
        output_file = Path(output_path)
        output_file.parent.mkdir(parents=True, exist_ok=True)

        HTML(string=html_content).write_pdf(
            str(output_file),
            stylesheets=[CSS(string=self._get_pdf_styles())]
        )

        return str(output_file)

    def generate_markdown_report(
        self,
        project: ComplianceProject,
        report: ComplianceReport,
        output_path: str
    ) -> str:
        """
        Generate Markdown compliance report

        Args:
            project: Project data
            report: Compliance report
            output_path: Output markdown path

        Returns:
            Path to generated markdown
        """
        template = self.env.get_template("compliance_report.md")

        context = self._prepare_context(project, report)
        markdown = template.render(**context)

        output_file = Path(output_path)
        output_file.parent.mkdir(parents=True, exist_ok=True)
        output_file.write_text(markdown, encoding='utf-8')

        return str(output_file)

    def generate_json_report(
        self,
        project: ComplianceProject,
        report: ComplianceReport,
        output_path: str
    ) -> str:
        """
        Generate JSON compliance report

        Args:
            project: Project data
            report: Compliance report
            output_path: Output JSON path

        Returns:
            Path to generated JSON
        """
        # Convert to JSON-serializable format
        report_data = {
            'report': report.to_json(),
            'project': {
                'id': str(project.id),
                'name': project.project_name,
                'type': project.project_type,
                'location': project.location.model_dump() if project.location else None,
                'start_date': project.start_date.isoformat(),
                'end_date': project.end_date.isoformat() if project.end_date else None,
                'gross_floor_area_m2': float(project.gross_floor_area_m2) if project.gross_floor_area_m2 else None,
                'total_embodied_carbon': float(project.total_embodied_carbon()),
                'carbon_intensity_per_m2': float(project.carbon_intensity_per_m2()) if project.carbon_intensity_per_m2() else None
            }
        }

        output_file = Path(output_path)
        output_file.parent.mkdir(parents=True, exist_ok=True)

        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(report_data, f, indent=2, default=str)

        return str(output_file)

    def generate_executive_summary(
        self,
        project: ComplianceProject,
        report: ComplianceReport
    ) -> str:
        """
        Generate executive summary text

        Args:
            project: Project data
            report: Compliance report

        Returns:
            Executive summary text
        """
        template = self.env.get_template("executive_summary.txt")

        context = self._prepare_context(project, report)
        summary = template.render(**context)

        return summary

    # ========================================================================
    # HELPER METHODS
    # ========================================================================

    def _prepare_context(
        self,
        project: ComplianceProject,
        report: ComplianceReport
    ) -> Dict[str, Any]:
        """Prepare template context data"""

        # Group findings by severity
        critical_findings = [f for f in report.findings if f.severity == "CRITICAL" and not f.passed]
        high_findings = [f for f in report.findings if f.severity == "HIGH" and not f.passed]
        medium_findings = [f for f in report.findings if f.severity == "MEDIUM" and not f.passed]
        low_findings = [f for f in report.findings if f.severity in ["LOW", "WARNING"] and not f.passed]
        passed_findings = [f for f in report.findings if f.passed]

        # Group findings by rule
        findings_by_rule: Dict[str, List[ComplianceFinding]] = {}
        for finding in report.findings:
            if finding.rule_id not in findings_by_rule:
                findings_by_rule[finding.rule_id] = []
            findings_by_rule[finding.rule_id].append(finding)

        # Calculate metrics
        carbon_intensity = project.carbon_intensity_per_m2()

        context = {
            # Project info
            'project': project,
            'project_name': project.project_name,
            'project_type': project.project_type,
            'location': project.location,
            'start_date': project.start_date,
            'end_date': project.end_date,
            'gross_floor_area_m2': project.gross_floor_area_m2,

            # Carbon metrics
            'total_embodied_carbon': project.total_embodied_carbon(),
            'carbon_intensity': carbon_intensity,

            # Report info
            'report': report,
            'report_id': report.report_id,
            'generated_at': report.generated_at,
            'rules_version': report.rules_version,

            # Summary stats
            'total_checks': report.total_checks,
            'passed_checks': report.passed_checks,
            'failed_checks': report.failed_checks,
            'pass_rate': (report.passed_checks / report.total_checks * 100) if report.total_checks > 0 else 0,

            # Severity counts
            'critical_count': report.critical_count,
            'high_count': report.high_count,
            'medium_count': report.medium_count,
            'low_count': report.low_count,

            # Compliance status
            'compliant': report.compliant,
            'compliance_status': 'COMPLIANT' if report.compliant else 'NON-COMPLIANT',

            # Grouped findings
            'critical_findings': critical_findings,
            'high_findings': high_findings,
            'medium_findings': medium_findings,
            'low_findings': low_findings,
            'passed_findings': passed_findings,
            'findings_by_rule': findings_by_rule,

            # Data source counts
            'epd_count': len(project.epds),
            'invoice_count': len(project.invoices),
            'bim_model_count': len(project.bim_models),
            'transport_log_count': len(project.transport_logs),
            'waste_stream_count': len(project.waste_streams),
            'meter_count': len(project.meters),

            # Utility
            'now': datetime.utcnow()
        }

        return context

    def _generate_html_string(
        self,
        project: ComplianceProject,
        report: ComplianceReport
    ) -> str:
        """Generate HTML as string (for PDF conversion)"""
        template = self.env.get_template("compliance_report.html")
        context = self._prepare_context(project, report)
        return template.render(**context)

    def _format_datetime(self, dt: datetime, format: str = "%Y-%m-%d %H:%M:%S") -> str:
        """Format datetime for display"""
        if dt:
            return dt.strftime(format)
        return ""

    def _severity_badge(self, severity: str) -> str:
        """Generate HTML badge for severity"""
        colors = {
            'CRITICAL': 'danger',
            'HIGH': 'warning',
            'MEDIUM': 'info',
            'LOW': 'secondary',
            'WARNING': 'warning',
            'INFO': 'success'
        }
        color = colors.get(severity, 'secondary')
        return f'<span class="badge bg-{color}">{severity}</span>'

    def _status_badge(self, passed: bool) -> str:
        """Generate HTML badge for pass/fail status"""
        if passed:
            return '<span class="badge bg-success">PASS</span>'
        else:
            return '<span class="badge bg-danger">FAIL</span>'

    def _get_pdf_styles(self) -> str:
        """Get additional CSS for PDF generation"""
        return """
        @page {
            size: A4;
            margin: 2cm;
        }

        body {
            font-family: Arial, sans-serif;
            font-size: 10pt;
            line-height: 1.4;
        }

        h1 {
            font-size: 18pt;
            color: #333;
            border-bottom: 2px solid #007bff;
            padding-bottom: 10px;
        }

        h2 {
            font-size: 14pt;
            color: #555;
            margin-top: 20px;
        }

        .badge {
            padding: 4px 8px;
            border-radius: 4px;
            font-weight: bold;
            color: white;
        }

        .bg-danger { background-color: #dc3545; }
        .bg-warning { background-color: #ffc107; color: #000; }
        .bg-info { background-color: #17a2b8; }
        .bg-success { background-color: #28a745; }
        .bg-secondary { background-color: #6c757d; }

        table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
        }

        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }

        th {
            background-color: #f8f9fa;
            font-weight: bold;
        }

        .finding {
            page-break-inside: avoid;
            margin: 10px 0;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        """


# ============================================================================
# CITATION FORMATTER
# ============================================================================

class CitationFormatter:
    """Format citations and references for reports"""

    @staticmethod
    def format_epd_citation(epd) -> str:
        """
        Format EPD as citation

        Args:
            epd: EPDDocument

        Returns:
            Formatted citation string
        """
        citation = f"{epd.manufacturer}. {epd.product_name}. "
        citation += f"Environmental Product Declaration ({epd.epd_number}). "
        citation += f"{epd.source}. "
        citation += f"Valid {epd.valid_from.strftime('%Y-%m-%d')} to {epd.valid_until.strftime('%Y-%m-%d')}."

        if epd.epd_url:
            citation += f" Available at: {epd.epd_url}"

        return citation

    @staticmethod
    def format_invoice_citation(invoice) -> str:
        """
        Format invoice as citation

        Args:
            invoice: ERPInvoice

        Returns:
            Formatted citation string
        """
        citation = f"{invoice.supplier_name}. "
        citation += f"Invoice {invoice.invoice_number}. "
        citation += f"Date: {invoice.invoice_date.strftime('%Y-%m-%d')}."

        if invoice.supplier_abn:
            citation += f" ABN: {invoice.supplier_abn}."

        return citation

    @staticmethod
    def format_evidence_reference(evidence: "EvidenceDocument") -> str:
        """
        Format evidence document as reference

        Args:
            evidence: EvidenceDocument

        Returns:
            Formatted reference string
        """
        ref = f"[{evidence.type.value.upper()}] "

        if evidence.filename:
            ref += evidence.filename
        else:
            ref += Path(evidence.uri).name

        if evidence.hash:
            ref += f" (SHA-256: {evidence.hash[:16]}...)"

        return ref

    @staticmethod
    def generate_bibliography(project: ComplianceProject) -> List[str]:
        """
        Generate bibliography from all project sources

        Args:
            project: ComplianceProject

        Returns:
            List of formatted citations
        """
        citations = []

        # EPDs
        for epd in project.epds:
            citations.append(CitationFormatter.format_epd_citation(epd))

        # Invoices
        for invoice in project.invoices:
            citations.append(CitationFormatter.format_invoice_citation(invoice))

        # Add standard references
        citations.extend([
            "National Construction Code 2022. Australian Building Codes Board. Available at: https://ncc.abcb.gov.au/",
            "GHG Protocol Corporate Accounting and Reporting Standard. World Resources Institute. Available at: https://ghgprotocol.org/",
            "EN 15804:2012+A2:2019. Sustainability of construction works — Environmental product declarations — Core rules for the product category of construction products.",
            "ISO 14044:2006. Environmental management — Life cycle assessment — Requirements and guidelines."
        ])

        return sorted(set(citations))
