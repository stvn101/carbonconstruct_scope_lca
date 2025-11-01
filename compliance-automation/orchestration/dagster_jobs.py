"""
Dagster Job Orchestration for Compliance Automation

This module defines Dagster jobs for orchestrating the compliance automation pipeline:
1. Data ingestion (BIM, ERP, meters, EPDs, transport, waste)
2. Rules engine evaluation
3. Evidence collection and manifest generation
4. Report generation (HTML, PDF, JSON)
5. LLM narrative generation
6. Notification and delivery
"""

from dagster import (
    job, op, Out, In, Output, DynamicOutput, DynamicOut,
    Field, String, Dict, List, Bool, Int, Float,
    resource, ConfigurableResource,
    get_dagster_logger, AssetMaterialization, MetadataValue,
    RetryPolicy, Backoff
)
from pathlib import Path
from typing import Any, Dict, Optional
import json
from datetime import datetime

from ..schemas.canonical_schema import ComplianceProject
from ..engine.rules_engine import RulesEngine, ComplianceReport
from ..reports.report_generator import ReportGenerator
from ..evidence.manifest_generator import EvidenceCollector
from ..llm.narrative_generator import NarrativeGenerator


# ============================================================================
# RESOURCES
# ============================================================================

class ComplianceAutomationConfig(ConfigurableResource):
    """Configuration for compliance automation"""
    rules_path: str = Field(description="Path to YAML rules file")
    output_dir: str = Field(description="Output directory for reports")
    evidence_dir: str = Field(description="Directory for evidence files")
    templates_dir: Optional[str] = Field(default=None, description="Templates directory")
    anthropic_api_key: Optional[str] = Field(default=None, description="Anthropic API key for LLM")
    enable_llm_narratives: bool = Field(default=True, description="Enable LLM narrative generation")
    generate_pdf: bool = Field(default=True, description="Generate PDF reports")


# ============================================================================
# OPS - DATA INGESTION
# ============================================================================

@op(
    description="Load project data from JSON file",
    out=Out(ComplianceProject),
    tags={"stage": "ingestion"}
)
def load_project_data(context, project_json_path: str) -> ComplianceProject:
    """Load and validate project data"""
    logger = get_dagster_logger()
    logger.info(f"Loading project data from {project_json_path}")

    with open(project_json_path, 'r') as f:
        data = json.load(f)

    project = ComplianceProject(**data)

    context.log_event(
        AssetMaterialization(
            asset_key="project_data",
            description=f"Loaded project: {project.project_name}",
            metadata={
                "project_id": str(project.id),
                "project_name": project.project_name,
                "project_type": project.project_type,
                "epd_count": len(project.epds),
                "invoice_count": len(project.invoices),
                "bim_model_count": len(project.bim_models)
            }
        )
    )

    return Output(project)


@op(
    description="Validate project data completeness",
    ins={"project": In(ComplianceProject)},
    out=Out(Dict),
    tags={"stage": "validation"}
)
def validate_project_data(context, project: ComplianceProject) -> Dict[str, Any]:
    """Validate project data meets minimum requirements"""
    logger = get_dagster_logger()

    validation_results = {
        "valid": True,
        "errors": [],
        "warnings": []
    }

    # Check required fields
    if not project.project_name:
        validation_results["errors"].append("Missing project name")
        validation_results["valid"] = False

    if not project.location:
        validation_results["warnings"].append("Missing project location")

    if not project.gross_floor_area_m2:
        validation_results["warnings"].append("Missing gross floor area - carbon intensity cannot be calculated")

    # Check data sources
    if not project.epds and not project.invoices:
        validation_results["errors"].append("No EPDs or invoices provided")
        validation_results["valid"] = False

    if validation_results["errors"]:
        logger.error(f"Validation failed: {'; '.join(validation_results['errors'])}")
    elif validation_results["warnings"]:
        logger.warning(f"Validation warnings: {'; '.join(validation_results['warnings'])}")
    else:
        logger.info("Project data validation passed")

    return Output(validation_results)


# ============================================================================
# OPS - RULES ENGINE
# ============================================================================

@op(
    description="Initialize rules engine with YAML rules",
    config_schema={"rules_path": Field(String)},
    out=Out(RulesEngine),
    tags={"stage": "engine"}
)
def initialize_rules_engine(context) -> RulesEngine:
    """Initialize the rules engine"""
    logger = get_dagster_logger()
    rules_path = context.op_config["rules_path"]

    logger.info(f"Initializing rules engine from {rules_path}")
    engine = RulesEngine(rules_path)

    logger.info(f"Loaded {len(engine.rules)} rules, version {engine.version}")

    return Output(engine)


@op(
    description="Evaluate compliance rules against project",
    ins={
        "project": In(ComplianceProject),
        "engine": In(RulesEngine)
    },
    out=Out(ComplianceReport),
    tags={"stage": "evaluation"},
    retry_policy=RetryPolicy(max_retries=2, delay=5, backoff=Backoff.EXPONENTIAL)
)
def evaluate_compliance(context, project: ComplianceProject, engine: RulesEngine) -> ComplianceReport:
    """Evaluate all compliance rules"""
    logger = get_dagster_logger()
    logger.info(f"Evaluating compliance for project {project.project_name}")

    report = engine.evaluate_project(project)

    context.log_event(
        AssetMaterialization(
            asset_key="compliance_report",
            description=f"Compliance evaluation completed",
            metadata={
                "project_name": project.project_name,
                "compliant": report.compliant,
                "total_checks": report.total_checks,
                "passed_checks": report.passed_checks,
                "failed_checks": report.failed_checks,
                "critical_count": report.critical_count,
                "high_count": report.high_count,
                "pass_rate_pct": round((report.passed_checks / report.total_checks * 100) if report.total_checks > 0 else 0, 1)
            }
        )
    )

    logger.info(f"Evaluation complete: {report.passed_checks}/{report.total_checks} checks passed")
    if report.critical_count > 0:
        logger.warning(f"Found {report.critical_count} CRITICAL issues")

    return Output(report)


# ============================================================================
# OPS - EVIDENCE COLLECTION
# ============================================================================

@op(
    description="Collect and package evidence documents",
    ins={"project": In(ComplianceProject)},
    out=Out(str),
    config_schema={
        "output_path": Field(String, description="Output ZIP file path")
    },
    tags={"stage": "evidence"}
)
def collect_evidence(context, project: ComplianceProject) -> str:
    """Collect all evidence and create ZIP manifest"""
    logger = get_dagster_logger()
    output_path = context.op_config["output_path"]

    logger.info(f"Collecting evidence for project {project.project_name}")

    collector = EvidenceCollector()
    manifest = collector.collect_project_evidence(project, output_path)

    context.log_event(
        AssetMaterialization(
            asset_key="evidence_package",
            description=f"Evidence collected and packaged",
            metadata={
                "project_name": project.project_name,
                "total_files": manifest.total_files,
                "total_size_mb": round(manifest.total_size_bytes / (1024 * 1024), 2),
                "epd_count": manifest.epd_count,
                "invoice_count": manifest.invoice_count,
                "zip_path": output_path
            }
        )
    )

    logger.info(f"Collected {manifest.total_files} evidence files ({manifest.total_size_bytes / (1024*1024):.2f} MB)")

    return Output(output_path)


@op(
    description="Verify evidence package integrity",
    ins={"evidence_zip_path": In(str)},
    out=Out(bool),
    tags={"stage": "verification"}
)
def verify_evidence(context, evidence_zip_path: str) -> bool:
    """Verify evidence package integrity"""
    logger = get_dagster_logger()

    collector = EvidenceCollector()
    is_valid, errors = collector.verify_manifest(evidence_zip_path)

    if is_valid:
        logger.info("Evidence package verified successfully")
    else:
        logger.error(f"Evidence verification failed: {'; '.join(errors)}")

    return Output(is_valid)


# ============================================================================
# OPS - REPORT GENERATION
# ============================================================================

@op(
    description="Generate JSON compliance report",
    ins={
        "project": In(ComplianceProject),
        "report": In(ComplianceReport)
    },
    out=Out(str),
    config_schema={
        "output_path": Field(String)
    },
    tags={"stage": "reporting"}
)
def generate_json_report(context, project: ComplianceProject, report: ComplianceReport) -> str:
    """Generate JSON report"""
    logger = get_dagster_logger()
    output_path = context.op_config["output_path"]

    generator = ReportGenerator()
    report_path = generator.generate_json_report(project, report, output_path)

    logger.info(f"Generated JSON report: {report_path}")

    return Output(report_path)


@op(
    description="Generate HTML compliance report",
    ins={
        "project": In(ComplianceProject),
        "report": In(ComplianceReport)
    },
    out=Out(str),
    config_schema={
        "output_path": Field(String),
        "templates_dir": Field(String, is_required=False)
    },
    tags={"stage": "reporting"}
)
def generate_html_report(context, project: ComplianceProject, report: ComplianceReport) -> str:
    """Generate HTML report"""
    logger = get_dagster_logger()
    output_path = context.op_config["output_path"]
    templates_dir = context.op_config.get("templates_dir")

    generator = ReportGenerator(templates_dir=templates_dir)
    report_path = generator.generate_html_report(project, report, output_path)

    context.log_event(
        AssetMaterialization(
            asset_key="html_report",
            description=f"HTML report generated",
            metadata={
                "project_name": project.project_name,
                "report_path": report_path
            }
        )
    )

    logger.info(f"Generated HTML report: {report_path}")

    return Output(report_path)


@op(
    description="Generate PDF compliance report",
    ins={
        "project": In(ComplianceProject),
        "report": In(ComplianceReport)
    },
    out=Out(str),
    config_schema={
        "output_path": Field(String),
        "templates_dir": Field(String, is_required=False)
    },
    tags={"stage": "reporting"}
)
def generate_pdf_report(context, project: ComplianceProject, report: ComplianceReport) -> str:
    """Generate PDF report"""
    logger = get_dagster_logger()
    output_path = context.op_config["output_path"]
    templates_dir = context.op_config.get("templates_dir")

    generator = ReportGenerator(templates_dir=templates_dir)
    report_path = generator.generate_pdf_report(project, report, output_path)

    context.log_event(
        AssetMaterialization(
            asset_key="pdf_report",
            description=f"PDF report generated",
            metadata={
                "project_name": project.project_name,
                "report_path": report_path
            }
        )
    )

    logger.info(f"Generated PDF report: {report_path}")

    return Output(report_path)


@op(
    description="Generate Markdown compliance report",
    ins={
        "project": In(ComplianceProject),
        "report": In(ComplianceReport)
    },
    out=Out(str),
    config_schema={
        "output_path": Field(String)
    },
    tags={"stage": "reporting"}
)
def generate_markdown_report(context, project: ComplianceProject, report: ComplianceReport) -> str:
    """Generate Markdown report"""
    logger = get_dagster_logger()
    output_path = context.op_config["output_path"]

    generator = ReportGenerator()
    report_path = generator.generate_markdown_report(project, report, output_path)

    logger.info(f"Generated Markdown report: {report_path}")

    return Output(report_path)


# ============================================================================
# OPS - LLM NARRATIVE GENERATION
# ============================================================================

@op(
    description="Generate LLM narrative for executive summary",
    ins={
        "project": In(ComplianceProject),
        "report": In(ComplianceReport)
    },
    out=Out(str),
    config_schema={
        "anthropic_api_key": Field(String)
    },
    tags={"stage": "llm", "narrative": "executive_summary"}
)
def generate_executive_narrative(context, project: ComplianceProject, report: ComplianceReport) -> str:
    """Generate executive summary narrative using LLM"""
    logger = get_dagster_logger()
    api_key = context.op_config["anthropic_api_key"]

    logger.info("Generating executive summary narrative with LLM")

    generator = NarrativeGenerator(api_key=api_key)
    narrative = generator.generate_executive_summary(project, report)

    logger.info(f"Generated executive summary ({len(narrative)} chars)")

    return Output(narrative)


@op(
    description="Generate LLM narrative for remediation guidance",
    ins={
        "project": In(ComplianceProject),
        "report": In(ComplianceReport)
    },
    out=Out(str),
    config_schema={
        "anthropic_api_key": Field(String)
    },
    tags={"stage": "llm", "narrative": "remediation"}
)
def generate_remediation_narrative(context, project: ComplianceProject, report: ComplianceReport) -> str:
    """Generate remediation guidance narrative using LLM"""
    logger = get_dagster_logger()
    api_key = context.op_config["anthropic_api_key"]

    # Get failed findings
    failed_findings = [f for f in report.findings if not f.passed]

    if not failed_findings:
        return Output("No remediation required - all checks passed.")

    logger.info(f"Generating remediation narrative for {len(failed_findings)} issues")

    generator = NarrativeGenerator(api_key=api_key)
    narrative = generator.generate_remediation_guidance(failed_findings, project)

    logger.info(f"Generated remediation guidance ({len(narrative)} chars)")

    return Output(narrative)


@op(
    description="Generate certification readiness assessment",
    ins={
        "project": In(ComplianceProject),
        "report": In(ComplianceReport)
    },
    out=Out(str),
    config_schema={
        "anthropic_api_key": Field(String)
    },
    tags={"stage": "llm", "narrative": "certification"}
)
def generate_certification_narrative(context, project: ComplianceProject, report: ComplianceReport) -> str:
    """Generate certification readiness assessment using LLM"""
    logger = get_dagster_logger()
    api_key = context.op_config["anthropic_api_key"]

    logger.info("Generating certification readiness assessment")

    generator = NarrativeGenerator(api_key=api_key)
    narrative = generator.generate_certification_readiness_assessment(project, report)

    logger.info(f"Generated certification assessment ({len(narrative)} chars)")

    return Output(narrative)


# ============================================================================
# OPS - DELIVERY
# ============================================================================

@op(
    description="Package all reports and evidence for delivery",
    ins={
        "json_report": In(str),
        "html_report": In(str),
        "markdown_report": In(str),
        "evidence_zip": In(str)
    },
    out=Out(Dict),
    config_schema={
        "output_dir": Field(String)
    },
    tags={"stage": "delivery"}
)
def package_deliverables(
    context,
    json_report: str,
    html_report: str,
    markdown_report: str,
    evidence_zip: str
) -> Dict[str, str]:
    """Package all deliverables"""
    logger = get_dagster_logger()

    deliverables = {
        "json_report": json_report,
        "html_report": html_report,
        "markdown_report": markdown_report,
        "evidence_package": evidence_zip
    }

    context.log_event(
        AssetMaterialization(
            asset_key="deliverables_package",
            description="All deliverables packaged",
            metadata={
                "files": len(deliverables),
                "json_report": json_report,
                "html_report": html_report,
                "evidence_package": evidence_zip
            }
        )
    )

    logger.info(f"Packaged {len(deliverables)} deliverables")

    return Output(deliverables)


# ============================================================================
# JOB DEFINITIONS
# ============================================================================

@job(
    description="Complete compliance automation pipeline",
    tags={"pipeline": "compliance_automation"}
)
def compliance_automation_job():
    """
    Complete compliance automation job graph:

    1. Load and validate project data
    2. Initialize rules engine
    3. Evaluate compliance rules
    4. Collect evidence and create manifest
    5. Generate reports (JSON, HTML, Markdown)
    6. Generate LLM narratives
    7. Package deliverables
    """
    # Load data
    project = load_project_data()
    validation = validate_project_data(project)

    # Initialize engine
    engine = initialize_rules_engine()

    # Evaluate compliance
    report = evaluate_compliance(project, engine)

    # Collect evidence
    evidence_zip = collect_evidence(project)
    evidence_verified = verify_evidence(evidence_zip)

    # Generate reports
    json_report = generate_json_report(project, report)
    html_report = generate_html_report(project, report)
    markdown_report = generate_markdown_report(project, report)

    # Generate LLM narratives
    exec_narrative = generate_executive_narrative(project, report)
    remediation_narrative = generate_remediation_narrative(project, report)
    cert_narrative = generate_certification_narrative(project, report)

    # Package deliverables
    deliverables = package_deliverables(
        json_report,
        html_report,
        markdown_report,
        evidence_zip
    )


@job(
    description="Quick compliance check without LLM narratives",
    tags={"pipeline": "compliance_check_fast"}
)
def quick_compliance_check_job():
    """
    Fast compliance check without LLM processing:

    1. Load project data
    2. Evaluate compliance rules
    3. Generate JSON report
    """
    project = load_project_data()
    engine = initialize_rules_engine()
    report = evaluate_compliance(project, engine)
    json_report = generate_json_report(project, report)


@job(
    description="Evidence collection and verification only",
    tags={"pipeline": "evidence_collection"}
)
def evidence_collection_job():
    """
    Evidence collection and verification only:

    1. Load project data
    2. Collect evidence
    3. Verify evidence package
    """
    project = load_project_data()
    evidence_zip = collect_evidence(project)
    evidence_verified = verify_evidence(evidence_zip)


# ============================================================================
# SCHEDULES (Optional)
# ============================================================================

from dagster import ScheduleDefinition

# Run daily compliance checks
daily_compliance_schedule = ScheduleDefinition(
    job=quick_compliance_check_job,
    cron_schedule="0 2 * * *",  # 2 AM daily
    description="Daily automated compliance check"
)

# Weekly full report generation
weekly_report_schedule = ScheduleDefinition(
    job=compliance_automation_job,
    cron_schedule="0 3 * * 0",  # 3 AM Sundays
    description="Weekly full compliance report with narratives"
)
