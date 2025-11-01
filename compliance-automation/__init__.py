"""
Compliance Automation Service

A comprehensive system for automated compliance checking in construction and
carbon accounting. This service ingests multi-source data, applies deterministic
rules, and generates detailed reports with evidence packages.

Key Features:
- Multi-source data ingestion (BIM, ERP, meters, EPDs, transport, waste)
- Canonical schema with Pydantic validation
- Deterministic rules engine (YAML → Python)
- 10 core compliance checks
- Structured findings output
- Multi-format report generation
- Evidence manifest with SHA-256 hashes
- LLM narrative generation (non-decision making)
- Dagster orchestration
- Regulatory diff bot
- Coverage heatmap

IMPORTANT: The LLM is used ONLY for narrative generation, NOT for pass/fail decisions.
All compliance determinations are made by the deterministic rules engine.
"""

__version__ = "1.0.0"
__author__ = "Carbon Construct"

from .schemas.canonical_schema import (
    ComplianceProject,
    EPDDocument,
    ERPInvoice,
    IFCElement,
    BIMModel,
    TransportLog,
    WasteStream,
    UtilityMeter
)

from .engine.rules_engine import RulesEngine, ComplianceReport, ComplianceFinding

from .reports.report_generator import ReportGenerator

from .evidence.manifest_generator import EvidenceCollector

from .llm.narrative_generator import NarrativeGenerator

__all__ = [
    # Core classes
    "ComplianceProject",
    "EPDDocument",
    "ERPInvoice",
    "IFCElement",
    "BIMModel",
    "TransportLog",
    "WasteStream",
    "UtilityMeter",
    "RulesEngine",
    "ComplianceReport",
    "ComplianceFinding",
    "ReportGenerator",
    "EvidenceCollector",
    "NarrativeGenerator",
]
