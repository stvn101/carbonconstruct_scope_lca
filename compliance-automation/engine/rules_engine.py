"""
Compliance Rules Engine

This module implements a YAML-based rules engine that evaluates compliance checks
and generates structured findings. It does NOT use LLMs for decision-making - all
pass/fail determinations are made by deterministic Python logic.
"""

import yaml
from datetime import datetime, date, timedelta
from decimal import Decimal
from typing import List, Dict, Any, Optional, Union
from uuid import UUID, uuid4
from pathlib import Path
import hashlib
from urllib.parse import urlparse
import re

from pydantic import BaseModel, Field

from ..schemas.canonical_schema import (
    ComplianceProject,
    EPDDocument,
    IFCElement,
    ERPInvoice,
    TransportLog,
    WasteStream,
    UtilityMeter,
    EvidenceDocument,
    Unit
)


# ============================================================================
# FINDINGS SCHEMA
# ============================================================================

class Remediation(BaseModel):
    """Remediation guidance for a finding"""
    action: str
    responsible_party: str
    deadline: Optional[date] = None
    resources: List[str] = Field(default_factory=list)


class ComplianceFinding(BaseModel):
    """Structured finding from compliance check"""
    finding_id: UUID = Field(default_factory=uuid4)
    rule_id: str
    rule_name: str
    severity: str = Field(pattern="^(CRITICAL|HIGH|MEDIUM|LOW|WARNING|INFO)$")

    # Status
    passed: bool
    description: str

    # Context
    entity_id: Optional[UUID] = None
    entity_type: Optional[str] = None  # "epd", "invoice", "transport", etc.

    # Evidence
    evidence_uris: List[str] = Field(default_factory=list)

    # Remediation
    remediation: Remediation

    # Metadata
    checked_at: datetime = Field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = Field(default_factory=dict)

    def to_json(self) -> Dict[str, Any]:
        """Export as JSON for reporting"""
        return self.model_dump(mode='json')


class ComplianceReport(BaseModel):
    """Complete compliance report"""
    report_id: UUID = Field(default_factory=uuid4)
    project_id: UUID
    project_name: str

    # Execution
    generated_at: datetime = Field(default_factory=datetime.utcnow)
    rules_version: str
    engine_version: str = "1.0.0"

    # Findings
    findings: List[ComplianceFinding] = Field(default_factory=list)

    # Summary
    total_checks: int = 0
    passed_checks: int = 0
    failed_checks: int = 0

    critical_count: int = 0
    high_count: int = 0
    medium_count: int = 0
    low_count: int = 0

    # Overall status
    compliant: bool = False

    def calculate_summary(self):
        """Calculate summary statistics"""
        self.total_checks = len(self.findings)
        self.passed_checks = sum(1 for f in self.findings if f.passed)
        self.failed_checks = self.total_checks - self.passed_checks

        self.critical_count = sum(1 for f in self.findings if not f.passed and f.severity == "CRITICAL")
        self.high_count = sum(1 for f in self.findings if not f.passed and f.severity == "HIGH")
        self.medium_count = sum(1 for f in self.findings if not f.passed and f.severity == "MEDIUM")
        self.low_count = sum(1 for f in self.findings if not f.passed and f.severity in ["LOW", "WARNING"])

        # Compliant if no CRITICAL or HIGH failures
        self.compliant = self.critical_count == 0 and self.high_count == 0

    def to_json(self) -> Dict[str, Any]:
        """Export as JSON"""
        return self.model_dump(mode='json')


# ============================================================================
# RULES ENGINE
# ============================================================================

class RulesEngine:
    """
    YAML-based rules engine for compliance automation.

    This engine evaluates compliance rules deterministically without LLM involvement.
    LLMs are only used downstream for narrative generation.
    """

    def __init__(self, rules_path: str):
        """
        Initialize the rules engine

        Args:
            rules_path: Path to YAML rules file
        """
        self.rules_path = Path(rules_path)
        self.rules = self._load_rules()
        self.context: Dict[str, Any] = {}

    def _load_rules(self) -> List[Dict[str, Any]]:
        """Load rules from YAML file"""
        with open(self.rules_path, 'r') as f:
            data = yaml.safe_load(f)

        # Extract rules (list items that are dicts)
        rules = [item for item in data if isinstance(item, dict) and 'rule_id' in item]

        # Store global settings
        self.global_settings = next(
            (item.get('global_settings', {}) for item in data if isinstance(item, dict) and 'global_settings' in item),
            {}
        )

        # Store version info
        self.version = next((item.get('version') for item in data if isinstance(item, dict) and 'version' in item), "1.0.0")

        return rules

    def evaluate_project(self, project: ComplianceProject) -> ComplianceReport:
        """
        Evaluate all rules against a project

        Args:
            project: Project to evaluate

        Returns:
            Compliance report with all findings
        """
        report = ComplianceReport(
            project_id=project.id,
            project_name=project.project_name,
            rules_version=self.version
        )

        # Set context
        self.context = {
            'check_date': date.today(),
            'project': project
        }

        # Evaluate each rule
        for rule in self.rules:
            if not rule.get('enabled', True):
                continue

            rule_id = rule['rule_id']

            # Route to appropriate handler
            handler = getattr(self, f'_check_{rule_id}', None)
            if handler:
                findings = handler(project, rule)
                report.findings.extend(findings)
            else:
                # Generic handler
                findings = self._generic_check(project, rule)
                report.findings.extend(findings)

        # Calculate summary
        report.calculate_summary()

        return report

    # ========================================================================
    # RULE HANDLERS
    # ========================================================================

    def _check_epd_validity(self, project: ComplianceProject, rule: Dict) -> List[ComplianceFinding]:
        """Check 1: EPD Validity and Certification"""
        findings = []
        check_date = self.context['check_date']

        for epd in project.epds:
            passed = True
            issues = []

            # Check validity period
            if not epd.is_valid_on(check_date):
                passed = False
                issues.append(f"EPD expired or not yet valid on {check_date}")

            # Check verification for product-specific EPDs
            if epd.epd_type.value == "product-specific" and not epd.is_verified:
                passed = False
                issues.append("Product-specific EPD must be third-party verified")

            # Check EPD number exists
            if not epd.epd_number:
                passed = False
                issues.append("Missing EPD registration number")

            # Check recognized program operator
            recognized_sources = rule['conditions']['all'][4]['value']
            if epd.source not in recognized_sources:
                passed = False
                issues.append(f"EPD source '{epd.source}' not in recognized list")

            # Determine severity
            severity = "CRITICAL" if epd.epd_type.value == "product-specific" else "WARNING"

            # Collect evidence URIs
            evidence_uris = [ev.uri for ev in epd.evidence]

            # Create finding
            description = f"EPD '{epd.product_name}' ({epd.epd_number})"
            if not passed:
                description += f": {'; '.join(issues)}"
            else:
                description += ": Valid and verified"

            finding = ComplianceFinding(
                rule_id=rule['rule_id'],
                rule_name=rule['name'],
                severity=severity if not passed else "INFO",
                passed=passed,
                description=description,
                entity_id=epd.id,
                entity_type="epd",
                evidence_uris=evidence_uris,
                remediation=Remediation(
                    action=rule['remediation']['action'],
                    responsible_party=rule['remediation']['responsible_party'],
                    resources=rule['remediation']['resources']
                ),
                metadata={
                    'epd_number': epd.epd_number,
                    'epd_type': epd.epd_type.value,
                    'valid_from': epd.valid_from.isoformat(),
                    'valid_until': epd.valid_until.isoformat()
                }
            )

            findings.append(finding)

        return findings

    def _check_material_traceability(self, project: ComplianceProject, rule: Dict) -> List[ComplianceFinding]:
        """Check 2: Material Traceability and Documentation"""
        findings = []

        # Get all invoices and create lookup
        invoice_products = {}
        for invoice in project.invoices:
            for line_item in invoice.line_items:
                product_key = line_item.product_name.lower().strip()
                invoice_products[product_key] = {
                    'line_item': line_item,
                    'invoice': invoice
                }

        # Check each BIM element
        for bim_model in project.bim_models:
            for element in bim_model.elements:
                passed = True
                issues = []

                material_key = element.material_name.lower().strip()

                # Check if links to invoice
                if material_key not in invoice_products:
                    # Try fuzzy match
                    matched = self._fuzzy_match(material_key, list(invoice_products.keys()), threshold=0.8)
                    if not matched:
                        passed = False
                        issues.append(f"No invoice found for BIM material '{element.material_name}'")
                    else:
                        material_key = matched

                if material_key in invoice_products:
                    line_item = invoice_products[material_key]['line_item']
                    invoice = invoice_products[material_key]['invoice']

                    # Check EPD or emissions factor linkage
                    if not line_item.epd_id and 'emissions_factor' not in line_item.metadata:
                        passed = False
                        issues.append("No EPD or emissions factor linked")

                    # Check supplier ABN
                    if not invoice.supplier_abn:
                        passed = False
                        issues.append("Missing supplier ABN")

                    # Check delivery location
                    if invoice.delivery_location:
                        # Would need geospatial calculation here - simplified
                        pass

                    # Check quantity reconciliation (±10%)
                    if line_item.unit == element.unit:
                        variance_pct = abs(float(element.quantity - line_item.quantity)) / float(line_item.quantity) * 100
                        if variance_pct > 10:
                            passed = False
                            issues.append(f"Quantity variance {variance_pct:.1f}% exceeds ±10% tolerance")

                description = f"BIM element '{element.name or element.ifc_type}' ({element.material_name})"
                if not passed:
                    description += f": {'; '.join(issues)}"
                else:
                    description += ": Fully traceable"

                evidence_uris = [ev.uri for ev in element.evidence]

                finding = ComplianceFinding(
                    rule_id=rule['rule_id'],
                    rule_name=rule['name'],
                    severity="HIGH" if not passed else "INFO",
                    passed=passed,
                    description=description,
                    entity_id=element.id,
                    entity_type="ifc_element",
                    evidence_uris=evidence_uris,
                    remediation=Remediation(
                        action=rule['remediation']['action'],
                        responsible_party=rule['remediation']['responsible_party'],
                        resources=rule['remediation']['resources']
                    )
                )

                findings.append(finding)

        return findings

    def _check_ncc_embodied_carbon(self, project: ComplianceProject, rule: Dict) -> List[ComplianceFinding]:
        """Check 3: NCC 2022 Embodied Carbon Compliance"""
        findings = []

        # Get threshold for project type
        thresholds = rule['thresholds']
        threshold = thresholds.get(project.project_type, 850)  # Default to commercial

        self.context['ncc_threshold'] = threshold

        # Calculate carbon intensity
        carbon_intensity = project.carbon_intensity_per_m2()

        if carbon_intensity is None:
            finding = ComplianceFinding(
                rule_id=rule['rule_id'],
                rule_name=rule['name'],
                severity="CRITICAL",
                passed=False,
                description="Cannot calculate carbon intensity - missing gross floor area",
                entity_id=project.id,
                entity_type="project",
                evidence_uris=[],
                remediation=Remediation(
                    action="Provide gross floor area for project",
                    responsible_party="Design team",
                    resources=[]
                )
            )
            findings.append(finding)
            return findings

        # Check against threshold
        passed = carbon_intensity <= Decimal(threshold)

        # Check LCA stage completeness
        incomplete_stages = []
        for epd in project.epds:
            if not epd.lca_stages.a1_a3:
                incomplete_stages.append(f"EPD {epd.epd_number} missing A1-A3")
            if not epd.lca_stages.a4:
                incomplete_stages.append(f"EPD {epd.epd_number} missing A4")
            if not epd.lca_stages.a5:
                incomplete_stages.append(f"EPD {epd.epd_number} missing A5")

        if incomplete_stages:
            passed = False

        description = f"Carbon intensity: {carbon_intensity:.2f} kg CO2-e/m² (threshold: {threshold} kg CO2-e/m²)"
        if not passed:
            if carbon_intensity > Decimal(threshold):
                description += f" - EXCEEDS threshold by {float(carbon_intensity - Decimal(threshold)):.2f} kg CO2-e/m²"
            if incomplete_stages:
                description += f"; Incomplete stages: {'; '.join(incomplete_stages)}"
        else:
            description += " - COMPLIANT"

        finding = ComplianceFinding(
            rule_id=rule['rule_id'],
            rule_name=rule['name'],
            severity="CRITICAL" if not passed else "INFO",
            passed=passed,
            description=description,
            entity_id=project.id,
            entity_type="project",
            evidence_uris=[],
            remediation=Remediation(
                action=rule['remediation']['action'],
                responsible_party=rule['remediation']['responsible_party'],
                resources=rule['remediation']['resources']
            ),
            metadata={
                'carbon_intensity': float(carbon_intensity),
                'threshold': threshold,
                'project_type': project.project_type,
                'gross_floor_area_m2': float(project.gross_floor_area_m2) if project.gross_floor_area_m2 else None
            }
        )

        findings.append(finding)
        return findings

    def _check_transport_verification(self, project: ComplianceProject, rule: Dict) -> List[ComplianceFinding]:
        """Check 4: Transport Distance and Emissions Verification"""
        findings = []

        for transport_log in project.transport_logs:
            for leg in transport_log.legs:
                passed = True
                issues = []

                # Check distance plausibility
                is_international = leg.origin.country != leg.destination.country
                max_distance = 20000 if is_international else 5000

                if leg.distance_km > Decimal(max_distance):
                    passed = False
                    issues.append(f"Distance {leg.distance_km} km exceeds maximum {max_distance} km")

                # Check emissions factor range
                if leg.emissions_factor:
                    if not (Decimal("0.01") <= leg.emissions_factor <= Decimal("2.0")):
                        passed = False
                        issues.append(f"Emissions factor {leg.emissions_factor} outside realistic range (0.01-2.0)")

                # Check load factor
                if not (Decimal("0.3") <= leg.load_factor <= Decimal("1.0")):
                    passed = False
                    issues.append(f"Load factor {leg.load_factor} outside realistic range (0.3-1.0)")

                description = f"Transport leg: {leg.origin.city or 'Unknown'} → {leg.destination.city or 'Unknown'} ({leg.distance_km} km)"
                if not passed:
                    description += f": {'; '.join(issues)}"
                else:
                    description += ": Verified"

                finding = ComplianceFinding(
                    rule_id=rule['rule_id'],
                    rule_name=rule['name'],
                    severity="MEDIUM" if not passed else "INFO",
                    passed=passed,
                    description=description,
                    entity_id=leg.id,
                    entity_type="transport_leg",
                    evidence_uris=[ev.uri for ev in transport_log.evidence],
                    remediation=Remediation(
                        action=rule['remediation']['action'],
                        responsible_party=rule['remediation']['responsible_party'],
                        resources=rule['remediation']['resources']
                    ),
                    metadata={
                        'distance_km': float(leg.distance_km),
                        'transport_mode': leg.transport_mode.value,
                        'emissions_factor': float(leg.emissions_factor) if leg.emissions_factor else None
                    }
                )

                findings.append(finding)

        return findings

    def _check_waste_circularity(self, project: ComplianceProject, rule: Dict) -> List[ComplianceFinding]:
        """Check 5: Waste Reporting and Circularity"""
        findings = []

        total_waste = Decimal(0)
        recycled_reused = Decimal(0)

        for waste_stream in project.waste_streams:
            passed = True
            issues = []

            # Convert to kg for comparison
            waste_kg = waste_stream.quantity
            if waste_stream.unit == Unit.TONNE:
                waste_kg = waste_stream.quantity * Decimal(1000)

            total_waste += waste_kg

            # Track diverted waste
            if waste_stream.waste_type.value in ['recycled', 'reused']:
                recycled_reused += waste_kg

            # Check classification
            if not waste_stream.waste_type:
                passed = False
                issues.append("Missing waste type classification")

            # Check facility identification
            if not waste_stream.disposal_facility:
                passed = False
                issues.append("Missing disposal facility")

            # Check hazardous waste documentation
            if waste_stream.waste_type.value == "hazardous":
                has_receipt = any(ev.type.value == "waste_receipt" for ev in waste_stream.evidence)
                if not has_receipt:
                    passed = False
                    issues.append("Hazardous waste missing special handling documentation")

            # Check recycled content claims
            if waste_stream.recycled_content_pct and waste_stream.recycled_content_pct > 0:
                has_cert = any(ev.type.value == "certification" for ev in waste_stream.evidence)
                if not has_cert:
                    passed = False
                    issues.append("Recycled content claim lacks certification")

            description = f"Waste stream: {waste_stream.material_description} ({waste_stream.quantity} {waste_stream.unit.value})"
            if not passed:
                description += f": {'; '.join(issues)}"
            else:
                description += ": Properly documented"

            finding = ComplianceFinding(
                rule_id=rule['rule_id'],
                rule_name=rule['name'],
                severity="MEDIUM" if not passed else "INFO",
                passed=passed,
                description=description,
                entity_id=waste_stream.id,
                entity_type="waste_stream",
                evidence_uris=[ev.uri for ev in waste_stream.evidence],
                remediation=Remediation(
                    action=rule['remediation']['action'],
                    responsible_party=rule['remediation']['responsible_party'],
                    resources=rule['remediation']['resources']
                )
            )

            findings.append(finding)

        # Calculate overall diversion rate
        if total_waste > 0:
            diversion_rate = (recycled_reused / total_waste) * Decimal(100)
            target_rate = Decimal(70)

            diversion_passed = diversion_rate >= target_rate

            diversion_finding = ComplianceFinding(
                rule_id=rule['rule_id'],
                rule_name=rule['name'] + " - Diversion Rate",
                severity="MEDIUM" if not diversion_passed else "INFO",
                passed=diversion_passed,
                description=f"Waste diversion rate: {diversion_rate:.1f}% (target: {target_rate}%)",
                entity_id=project.id,
                entity_type="project",
                evidence_uris=[],
                remediation=Remediation(
                    action="Increase recycling and reuse to achieve 70% diversion target",
                    responsible_party="Site manager",
                    resources=rule['remediation']['resources']
                ),
                metadata={
                    'total_waste_kg': float(total_waste),
                    'diverted_kg': float(recycled_reused),
                    'diversion_rate_pct': float(diversion_rate)
                }
            )

            findings.append(diversion_finding)

        return findings

    def _check_data_quality(self, project: ComplianceProject, rule: Dict) -> List[ComplianceFinding]:
        """Check 6: Data Completeness and Quality"""
        findings = []

        # Calculate primary data coverage (simplified - would need more context)
        total_materials = len(project.invoices)
        primary_data_count = sum(1 for inv in project.invoices if inv.evidence)

        if total_materials > 0:
            primary_coverage_pct = (primary_data_count / total_materials) * 100
        else:
            primary_coverage_pct = 0

        target_coverage = 80
        passed = primary_coverage_pct >= target_coverage

        description = f"Primary data coverage: {primary_coverage_pct:.1f}% (target: {target_coverage}%)"
        if not passed:
            description += f" - INSUFFICIENT (missing {target_coverage - primary_coverage_pct:.1f}%)"
        else:
            description += " - SUFFICIENT"

        finding = ComplianceFinding(
            rule_id=rule['rule_id'],
            rule_name=rule['name'],
            severity="HIGH" if not passed else "INFO",
            passed=passed,
            description=description,
            entity_id=project.id,
            entity_type="project",
            evidence_uris=[],
            remediation=Remediation(
                action=rule['remediation']['action'],
                responsible_party=rule['remediation']['responsible_party'],
                resources=rule['remediation']['resources']
            ),
            metadata={
                'primary_coverage_pct': primary_coverage_pct,
                'total_materials': total_materials,
                'primary_data_count': primary_data_count
            }
        )

        findings.append(finding)
        return findings

    def _check_temporal_validity(self, project: ComplianceProject, rule: Dict) -> List[ComplianceFinding]:
        """Check 7: Temporal Validity (Timeline Alignment)"""
        findings = []

        # Define project period with tolerance
        project_start = project.start_date - timedelta(days=30)
        project_end = (project.end_date or date.today()) + timedelta(days=30)

        # Check invoices
        for invoice in project.invoices:
            passed = True
            issues = []

            # Check invoice date within project period
            if not (project_start <= invoice.invoice_date <= project_end):
                passed = False
                issues.append(f"Invoice date {invoice.invoice_date} outside project period")

            # Check EPD validity
            for line_item in invoice.line_items:
                if line_item.epd_id:
                    # Find corresponding EPD
                    epd = next((e for e in project.epds if e.id == line_item.epd_id), None)
                    if epd and not epd.is_valid_on(invoice.invoice_date):
                        passed = False
                        issues.append(f"EPD {epd.epd_number} not valid on invoice date")

            description = f"Invoice {invoice.invoice_number} dated {invoice.invoice_date}"
            if not passed:
                description += f": {'; '.join(issues)}"
            else:
                description += ": Dates aligned"

            finding = ComplianceFinding(
                rule_id=rule['rule_id'],
                rule_name=rule['name'],
                severity="MEDIUM" if not passed else "INFO",
                passed=passed,
                description=description,
                entity_id=invoice.id,
                entity_type="invoice",
                evidence_uris=[ev.uri for ev in invoice.evidence],
                remediation=Remediation(
                    action=rule['remediation']['action'],
                    responsible_party=rule['remediation']['responsible_party'],
                    resources=rule['remediation']['resources']
                )
            )

            findings.append(finding)

        return findings

    def _check_scope_boundary(self, project: ComplianceProject, rule: Dict) -> List[ComplianceFinding]:
        """Check 8: Scope Boundary Consistency (GHG Protocol)"""
        findings = []

        # This is a simplified check - would need more metadata in project
        passed = True
        issues = []

        # Check EPDs are accounted as Scope 3 Category 1
        if not project.epds:
            issues.append("No EPDs documented for Scope 3 Category 1")

        # Check transport is documented
        if not project.transport_logs:
            issues.append("No transport logs for Scope 3 Category 4")

        # Check meters are for operational phase (post-construction)
        for meter in project.meters:
            if meter.start_date < project.end_date:
                issues.append(f"Meter {meter.meter_id} readings overlap construction period")

        if issues:
            passed = False

        description = "GHG Protocol scope boundary alignment"
        if not passed:
            description += f": {'; '.join(issues)}"
        else:
            description += ": Properly categorized"

        finding = ComplianceFinding(
            rule_id=rule['rule_id'],
            rule_name=rule['name'],
            severity="HIGH" if not passed else "INFO",
            passed=passed,
            description=description,
            entity_id=project.id,
            entity_type="project",
            evidence_uris=[],
            remediation=Remediation(
                action=rule['remediation']['action'],
                responsible_party=rule['remediation']['responsible_party'],
                resources=rule['remediation']['resources']
            )
        )

        findings.append(finding)
        return findings

    def _check_double_counting(self, project: ComplianceProject, rule: Dict) -> List[ComplianceFinding]:
        """Check 9: Double-Counting Prevention"""
        findings = []

        # Track all material references
        material_refs: Dict[str, List[str]] = {}

        # Index BIM elements
        for bim_model in project.bim_models:
            for element in bim_model.elements:
                key = element.material_name.lower().strip()
                if key not in material_refs:
                    material_refs[key] = []
                material_refs[key].append(f"BIM:{element.id}")

        # Index invoice items
        for invoice in project.invoices:
            for line_item in invoice.line_items:
                key = line_item.product_name.lower().strip()
                if key not in material_refs:
                    material_refs[key] = []
                material_refs[key].append(f"Invoice:{invoice.invoice_number}:{line_item.line_number}")

        # Check for duplicates
        duplicates = {k: v for k, v in material_refs.items() if len(v) > 1}

        if duplicates:
            for material, refs in duplicates.items():
                finding = ComplianceFinding(
                    rule_id=rule['rule_id'],
                    rule_name=rule['name'],
                    severity="CRITICAL",
                    passed=False,
                    description=f"Material '{material}' appears in multiple sources: {', '.join(refs)}",
                    entity_id=project.id,
                    entity_type="project",
                    evidence_uris=[],
                    remediation=Remediation(
                        action=rule['remediation']['action'],
                        responsible_party=rule['remediation']['responsible_party'],
                        resources=rule['remediation']['resources']
                    ),
                    metadata={'material': material, 'references': refs}
                )
                findings.append(finding)
        else:
            # No duplicates found
            finding = ComplianceFinding(
                rule_id=rule['rule_id'],
                rule_name=rule['name'],
                severity="INFO",
                passed=True,
                description="No double-counting detected across data sources",
                entity_id=project.id,
                entity_type="project",
                evidence_uris=[],
                remediation=Remediation(
                    action="Continue monitoring for duplicates",
                    responsible_party=rule['remediation']['responsible_party'],
                    resources=[]
                )
            )
            findings.append(finding)

        return findings

    def _check_evidence_linkage(self, project: ComplianceProject, rule: Dict) -> List[ComplianceFinding]:
        """Check 10: Citation and Evidence Linkage"""
        findings = []

        # Check all EPDs have evidence
        for epd in project.epds:
            passed = True
            issues = []

            if not epd.evidence:
                passed = False
                issues.append("No evidence documents attached")

            # Check evidence has hashes
            for ev in epd.evidence:
                if not ev.hash:
                    passed = False
                    issues.append(f"Evidence '{ev.filename or ev.uri}' missing SHA-256 hash")

            description = f"EPD {epd.epd_number} evidence linkage"
            if not passed:
                description += f": {'; '.join(issues)}"
            else:
                description += f": {len(epd.evidence)} evidence document(s) verified"

            finding = ComplianceFinding(
                rule_id=rule['rule_id'],
                rule_name=rule['name'],
                severity="CRITICAL" if not passed else "INFO",
                passed=passed,
                description=description,
                entity_id=epd.id,
                entity_type="epd",
                evidence_uris=[ev.uri for ev in epd.evidence],
                remediation=Remediation(
                    action=rule['remediation']['action'],
                    responsible_party=rule['remediation']['responsible_party'],
                    resources=rule['remediation']['resources']
                ),
                metadata={'evidence_count': len(epd.evidence)}
            )

            findings.append(finding)

        # Check invoice EPD linkages resolve
        for invoice in project.invoices:
            for line_item in invoice.line_items:
                if line_item.epd_id:
                    epd = next((e for e in project.epds if e.id == line_item.epd_id), None)
                    if not epd:
                        finding = ComplianceFinding(
                            rule_id=rule['rule_id'],
                            rule_name=rule['name'],
                            severity="HIGH",
                            passed=False,
                            description=f"Invoice {invoice.invoice_number} line {line_item.line_number} references non-existent EPD {line_item.epd_id}",
                            entity_id=invoice.id,
                            entity_type="invoice",
                            evidence_uris=[],
                            remediation=Remediation(
                                action="Fix broken EPD reference or provide missing EPD",
                                responsible_party=rule['remediation']['responsible_party'],
                                resources=rule['remediation']['resources']
                            )
                        )
                        findings.append(finding)

        return findings

    def _generic_check(self, project: ComplianceProject, rule: Dict) -> List[ComplianceFinding]:
        """Generic handler for rules without specific implementation"""
        finding = ComplianceFinding(
            rule_id=rule['rule_id'],
            rule_name=rule['name'],
            severity="WARNING",
            passed=False,
            description=f"Rule '{rule['rule_id']}' not yet implemented",
            entity_id=project.id,
            entity_type="project",
            evidence_uris=[],
            remediation=Remediation(
                action="Implement rule handler",
                responsible_party="Development team",
                resources=[]
            )
        )
        return [finding]

    # ========================================================================
    # UTILITY METHODS
    # ========================================================================

    def _fuzzy_match(self, query: str, candidates: List[str], threshold: float = 0.8) -> Optional[str]:
        """
        Simple fuzzy string matching (can be replaced with more sophisticated library)

        Args:
            query: String to match
            candidates: List of candidate strings
            threshold: Similarity threshold (0-1)

        Returns:
            Best matching candidate or None
        """
        from difflib import SequenceMatcher

        best_match = None
        best_ratio = 0.0

        for candidate in candidates:
            ratio = SequenceMatcher(None, query.lower(), candidate.lower()).ratio()
            if ratio > best_ratio and ratio >= threshold:
                best_ratio = ratio
                best_match = candidate

        return best_match

    def calculate_hash(self, file_path: str) -> str:
        """Calculate SHA-256 hash of a file"""
        sha256_hash = hashlib.sha256()
        with open(file_path, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()
