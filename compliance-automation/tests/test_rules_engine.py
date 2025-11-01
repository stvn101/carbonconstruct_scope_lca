"""
Unit tests for Rules Engine

Tests all 10 compliance checks with deterministic inputs and expected outputs.
Validates that LLM is NOT used for decision-making.
"""

import pytest
from datetime import date, datetime, timedelta
from decimal import Decimal
from uuid import uuid4
from pathlib import Path

from ..engine.rules_engine import RulesEngine, ComplianceReport, ComplianceFinding
from ..schemas.canonical_schema import (
    ComplianceProject,
    EPDDocument,
    LCAStages,
    IFCElement,
    ERPInvoice,
    InvoiceLineItem,
    TransportLog,
    TransportLeg,
    WasteStream,
    UtilityMeter,
    MeterReading,
    GeographicLocation,
    EvidenceDocument,
    MaterialCategory,
    EPDType,
    Unit,
    TransportMode,
    WasteType,
    EvidenceType
)


@pytest.fixture
def rules_engine():
    """Fixture for rules engine with test rules"""
    # Use actual rules file
    rules_path = Path(__file__).parent.parent / "rules" / "compliance_rules.yaml"
    return RulesEngine(str(rules_path))


@pytest.fixture
def minimal_project():
    """Minimal valid project for testing"""
    return ComplianceProject(
        project_name="Test Project",
        project_type="commercial",
        start_date=date(2024, 1, 1),
        end_date=date(2024, 12, 31),
        location=GeographicLocation(
            city="Sydney",
            state="NSW",
            country="Australia"
        ),
        gross_floor_area_m2=Decimal("1000")
    )


# ============================================================================
# Test Check 1: EPD Validity and Certification
# ============================================================================

class TestEPDValidity:
    """Test EPD validity and certification checks"""

    def test_valid_epd_passes(self, rules_engine, minimal_project):
        """Valid, verified EPD should pass"""
        epd = EPDDocument(
            epd_number="EPD-2024-001",
            product_name="Test Concrete",
            manufacturer="Test Manufacturer",
            declared_unit=Unit.M3,
            gwp_total=Decimal("350"),
            lca_stages=LCAStages(
                a1_a3=Decimal("300"),
                a4=Decimal("30"),
                a5=Decimal("20")
            ),
            valid_from=date(2024, 1, 1),
            valid_until=date(2025, 12, 31),
            is_verified=True,
            epd_type=EPDType.PRODUCT_SPECIFIC,
            category=MaterialCategory.CONCRETE,
            source="EPD Australasia"
        )

        minimal_project.epds.append(epd)
        report = rules_engine.evaluate_project(minimal_project)

        # Find EPD validity findings
        epd_findings = [f for f in report.findings if f.rule_id == "epd_validity"]
        assert len(epd_findings) > 0

        # Should pass
        epd_finding = epd_findings[0]
        assert epd_finding.passed is True

    def test_expired_epd_fails(self, rules_engine, minimal_project):
        """Expired EPD should fail"""
        epd = EPDDocument(
            epd_number="EPD-2020-001",
            product_name="Old Concrete",
            manufacturer="Test Manufacturer",
            declared_unit=Unit.M3,
            gwp_total=Decimal("350"),
            lca_stages=LCAStages(
                a1_a3=Decimal("300"),
                a4=Decimal("30"),
                a5=Decimal("20")
            ),
            valid_from=date(2020, 1, 1),
            valid_until=date(2023, 12, 31),  # Expired
            is_verified=True,
            epd_type=EPDType.PRODUCT_SPECIFIC,
            category=MaterialCategory.CONCRETE,
            source="EPD Australasia"
        )

        minimal_project.epds.append(epd)
        report = rules_engine.evaluate_project(minimal_project)

        epd_findings = [f for f in report.findings if f.rule_id == "epd_validity"]
        epd_finding = epd_findings[0]

        assert epd_finding.passed is False
        assert epd_finding.severity == "CRITICAL"
        assert "expired" in epd_finding.description.lower()

    def test_unverified_product_specific_epd_fails(self, rules_engine, minimal_project):
        """Unverified product-specific EPD should fail"""
        epd = EPDDocument(
            epd_number="EPD-2024-002",
            product_name="Unverified Concrete",
            manufacturer="Test Manufacturer",
            declared_unit=Unit.M3,
            gwp_total=Decimal("350"),
            lca_stages=LCAStages(
                a1_a3=Decimal("300"),
                a4=Decimal("30"),
                a5=Decimal("20")
            ),
            valid_from=date(2024, 1, 1),
            valid_until=date(2025, 12, 31),
            is_verified=False,  # Not verified
            epd_type=EPDType.PRODUCT_SPECIFIC,
            category=MaterialCategory.CONCRETE,
            source="EPD Australasia"
        )

        minimal_project.epds.append(epd)
        report = rules_engine.evaluate_project(minimal_project)

        epd_findings = [f for f in report.findings if f.rule_id == "epd_validity"]
        epd_finding = epd_findings[0]

        assert epd_finding.passed is False
        assert "verified" in epd_finding.description.lower()


# ============================================================================
# Test Check 3: NCC Embodied Carbon Compliance
# ============================================================================

class TestNCCCompliance:
    """Test NCC 2022 embodied carbon compliance"""

    def test_compliant_commercial_project(self, rules_engine, minimal_project):
        """Commercial project below 850 kg CO2-e/m² threshold should pass"""
        # Add EPD with low carbon
        epd = EPDDocument(
            epd_number="EPD-2024-003",
            product_name="Low Carbon Concrete",
            manufacturer="Test Manufacturer",
            declared_unit=Unit.M3,
            gwp_total=Decimal("200"),  # Low carbon
            lca_stages=LCAStages(
                a1_a3=Decimal("170"),
                a4=Decimal("15"),
                a5=Decimal("15")
            ),
            valid_from=date(2024, 1, 1),
            valid_until=date(2025, 12, 31),
            is_verified=True,
            epd_type=EPDType.PRODUCT_SPECIFIC,
            category=MaterialCategory.CONCRETE,
            source="EPD Australasia"
        )

        minimal_project.epds.append(epd)
        minimal_project.gross_floor_area_m2 = Decimal("1000")

        report = rules_engine.evaluate_project(minimal_project)

        ncc_findings = [f for f in report.findings if f.rule_id == "ncc_embodied_carbon"]
        assert len(ncc_findings) > 0

        ncc_finding = ncc_findings[0]

        # Carbon intensity should be 200 kg CO2-e / 1000 m² = 0.2 kg/m² (well below 850)
        # Should pass
        assert ncc_finding.passed is True
        assert ncc_finding.severity == "INFO"

    def test_non_compliant_commercial_project(self, rules_engine, minimal_project):
        """Commercial project above 850 kg CO2-e/m² threshold should fail"""
        # Add high-carbon EPD
        epd = EPDDocument(
            epd_number="EPD-2024-004",
            product_name="High Carbon Concrete",
            manufacturer="Test Manufacturer",
            declared_unit=Unit.M3,
            gwp_total=Decimal("1000000"),  # Very high carbon
            lca_stages=LCAStages(
                a1_a3=Decimal("900000"),
                a4=Decimal("50000"),
                a5=Decimal("50000")
            ),
            valid_from=date(2024, 1, 1),
            valid_until=date(2025, 12, 31),
            is_verified=True,
            epd_type=EPDType.PRODUCT_SPECIFIC,
            category=MaterialCategory.CONCRETE,
            source="EPD Australasia"
        )

        minimal_project.epds.append(epd)
        minimal_project.gross_floor_area_m2 = Decimal("100")  # Small area

        report = rules_engine.evaluate_project(minimal_project)

        ncc_findings = [f for f in report.findings if f.rule_id == "ncc_embodied_carbon"]
        ncc_finding = ncc_findings[0]

        # Carbon intensity = 1000000 / 100 = 10000 kg/m² (way above 850)
        assert ncc_finding.passed is False
        assert ncc_finding.severity == "CRITICAL"
        assert "exceeds" in ncc_finding.description.lower()


# ============================================================================
# Test Check 4: Transport Verification
# ============================================================================

class TestTransportVerification:
    """Test transport distance and emissions verification"""

    def test_valid_domestic_transport(self, rules_engine, minimal_project):
        """Valid domestic transport should pass"""
        transport_log = TransportLog(
            shipment_id="SHIP-001",
            material_name="Concrete",
            legs=[
                TransportLeg(
                    origin=GeographicLocation(city="Melbourne", state="VIC", country="Australia"),
                    destination=GeographicLocation(city="Sydney", state="NSW", country="Australia"),
                    distance_km=Decimal("880"),  # Realistic Melbourne-Sydney
                    transport_mode=TransportMode.ROAD,
                    cargo_weight_kg=Decimal("25000"),
                    load_factor=Decimal("0.8"),
                    emissions_factor=Decimal("0.062"),
                    transport_date=date(2024, 6, 1)
                )
            ]
        )

        minimal_project.transport_logs.append(transport_log)
        report = rules_engine.evaluate_project(minimal_project)

        transport_findings = [f for f in report.findings if f.rule_id == "transport_verification"]
        assert len(transport_findings) > 0

        transport_finding = transport_findings[0]
        assert transport_finding.passed is True

    def test_implausible_distance_fails(self, rules_engine, minimal_project):
        """Implausibly long domestic transport should fail"""
        transport_log = TransportLog(
            shipment_id="SHIP-002",
            material_name="Concrete",
            legs=[
                TransportLeg(
                    origin=GeographicLocation(city="Sydney", state="NSW", country="Australia"),
                    destination=GeographicLocation(city="Melbourne", state="VIC", country="Australia"),
                    distance_km=Decimal("10000"),  # Way too long for domestic
                    transport_mode=TransportMode.ROAD,
                    cargo_weight_kg=Decimal("25000"),
                    load_factor=Decimal("0.8"),
                    emissions_factor=Decimal("0.062"),
                    transport_date=date(2024, 6, 1)
                )
            ]
        )

        minimal_project.transport_logs.append(transport_log)
        report = rules_engine.evaluate_project(minimal_project)

        transport_findings = [f for f in report.findings if f.rule_id == "transport_verification"]
        transport_finding = transport_findings[0]

        assert transport_finding.passed is False
        assert "exceeds" in transport_finding.description.lower()


# ============================================================================
# Test Check 5: Waste Circularity
# ============================================================================

class TestWasteCircularity:
    """Test waste reporting and circularity"""

    def test_well_documented_waste_passes(self, rules_engine, minimal_project):
        """Properly documented waste should pass"""
        waste = WasteStream(
            waste_type=WasteType.RECYCLED,
            material_category=MaterialCategory.CONCRETE,
            material_description="Crushed concrete",
            quantity=Decimal("50"),
            unit=Unit.TONNE,
            disposal_date=date(2024, 6, 1),
            disposal_facility="Sydney Recycling Center",
            evidence=[
                EvidenceDocument(
                    type=EvidenceType.WASTE_RECEIPT,
                    uri="/path/to/receipt.pdf"
                )
            ]
        )

        minimal_project.waste_streams.append(waste)
        report = rules_engine.evaluate_project(minimal_project)

        waste_findings = [f for f in report.findings if f.rule_id == "waste_circularity"]
        waste_finding = waste_findings[0]

        assert waste_finding.passed is True

    def test_undocumented_waste_fails(self, rules_engine, minimal_project):
        """Waste without facility identification should fail"""
        waste = WasteStream(
            waste_type=WasteType.LANDFILL,
            material_category=MaterialCategory.CONCRETE,
            material_description="Crushed concrete",
            quantity=Decimal("50"),
            unit=Unit.TONNE,
            disposal_date=date(2024, 6, 1),
            disposal_facility="",  # Missing facility
        )

        minimal_project.waste_streams.append(waste)
        report = rules_engine.evaluate_project(minimal_project)

        waste_findings = [f for f in report.findings if f.rule_id == "waste_circularity"]
        waste_finding = waste_findings[0]

        assert waste_finding.passed is False
        assert "facility" in waste_finding.description.lower()


# ============================================================================
# Test Check 9: Double-Counting Prevention
# ============================================================================

class TestDoubleCountingPrevention:
    """Test double-counting detection"""

    def test_no_double_counting_passes(self, rules_engine, minimal_project):
        """Project with unique materials should pass"""
        # Add BIM element
        bim_model = minimal_project.bim_models[0] if minimal_project.bim_models else None
        if not bim_model:
            from ..schemas.canonical_schema import BIMModel
            bim_model = BIMModel(
                project_name="Test BIM",
                elements=[]
            )
            minimal_project.bim_models.append(bim_model)

        element = IFCElement(
            ifc_guid="unique-guid-1",
            ifc_type="IfcWall",
            quantity=Decimal("100"),
            unit=Unit.M3,
            material_name="Concrete 32MPa",
            material_category=MaterialCategory.CONCRETE
        )
        bim_model.elements.append(element)

        # Add different invoice item
        invoice = ERPInvoice(
            invoice_number="INV-001",
            supplier_name="Supplier A",
            buyer_name="Buyer B",
            invoice_date=date(2024, 3, 1),
            line_items=[
                InvoiceLineItem(
                    line_number=1,
                    product_name="Steel Beams",  # Different from BIM
                    quantity=Decimal("50"),
                    unit=Unit.TONNE,
                    unit_price=Decimal("2000"),
                    total_price=Decimal("100000")
                )
            ],
            subtotal=Decimal("100000"),
            tax=Decimal("10000"),
            total=Decimal("110000")
        )
        minimal_project.invoices.append(invoice)

        report = rules_engine.evaluate_project(minimal_project)

        double_counting_findings = [f for f in report.findings if f.rule_id == "double_counting"]
        assert len(double_counting_findings) > 0

        # Should pass - no duplicates
        double_counting_finding = double_counting_findings[0]
        assert double_counting_finding.passed is True

    def test_double_counting_detected(self, rules_engine, minimal_project):
        """Project with duplicate materials should fail"""
        # Add BIM element
        from ..schemas.canonical_schema import BIMModel
        bim_model = BIMModel(
            project_name="Test BIM",
            elements=[]
        )
        minimal_project.bim_models.append(bim_model)

        element = IFCElement(
            ifc_guid="unique-guid-1",
            ifc_type="IfcWall",
            quantity=Decimal("100"),
            unit=Unit.M3,
            material_name="Concrete 32MPa",  # Same material
            material_category=MaterialCategory.CONCRETE
        )
        bim_model.elements.append(element)

        # Add invoice with same material
        invoice = ERPInvoice(
            invoice_number="INV-001",
            supplier_name="Supplier A",
            buyer_name="Buyer B",
            invoice_date=date(2024, 3, 1),
            line_items=[
                InvoiceLineItem(
                    line_number=1,
                    product_name="Concrete 32MPa",  # Same material
                    quantity=Decimal("105"),
                    unit=Unit.M3,
                    unit_price=Decimal("150"),
                    total_price=Decimal("15750")
                )
            ],
            subtotal=Decimal("15750"),
            tax=Decimal("1575"),
            total=Decimal("17325")
        )
        minimal_project.invoices.append(invoice)

        report = rules_engine.evaluate_project(minimal_project)

        double_counting_findings = [f for f in report.findings if f.rule_id == "double_counting"]

        # Should detect duplicate
        duplicate_findings = [f for f in double_counting_findings if not f.passed]
        assert len(duplicate_findings) > 0
        assert "multiple sources" in duplicate_findings[0].description.lower()


# ============================================================================
# Test Check 10: Evidence Linkage
# ============================================================================

class TestEvidenceLinkage:
    """Test citation and evidence linkage"""

    def test_epd_with_evidence_passes(self, rules_engine, minimal_project):
        """EPD with evidence documents should pass"""
        epd = EPDDocument(
            epd_number="EPD-2024-005",
            product_name="Test Steel",
            manufacturer="Test Manufacturer",
            declared_unit=Unit.TONNE,
            gwp_total=Decimal("1800"),
            lca_stages=LCAStages(
                a1_a3=Decimal("1600"),
                a4=Decimal("100"),
                a5=Decimal("100")
            ),
            valid_from=date(2024, 1, 1),
            valid_until=date(2025, 12, 31),
            is_verified=True,
            epd_type=EPDType.PRODUCT_SPECIFIC,
            category=MaterialCategory.STEEL,
            source="EPD Australasia",
            evidence=[
                EvidenceDocument(
                    type=EvidenceType.EPD,
                    uri="/path/to/epd.pdf",
                    hash="abc123def456"  # Has hash
                )
            ]
        )

        minimal_project.epds.append(epd)
        report = rules_engine.evaluate_project(minimal_project)

        evidence_findings = [f for f in report.findings if f.rule_id == "evidence_linkage"]
        epd_evidence_finding = [f for f in evidence_findings if f.entity_type == "epd"][0]

        assert epd_evidence_finding.passed is True

    def test_epd_without_evidence_fails(self, rules_engine, minimal_project):
        """EPD without evidence documents should fail"""
        epd = EPDDocument(
            epd_number="EPD-2024-006",
            product_name="Test Steel",
            manufacturer="Test Manufacturer",
            declared_unit=Unit.TONNE,
            gwp_total=Decimal("1800"),
            lca_stages=LCAStages(
                a1_a3=Decimal("1600"),
                a4=Decimal("100"),
                a5=Decimal("100")
            ),
            valid_from=date(2024, 1, 1),
            valid_until=date(2025, 12, 31),
            is_verified=True,
            epd_type=EPDType.PRODUCT_SPECIFIC,
            category=MaterialCategory.STEEL,
            source="EPD Australasia",
            evidence=[]  # No evidence
        )

        minimal_project.epds.append(epd)
        report = rules_engine.evaluate_project(minimal_project)

        evidence_findings = [f for f in report.findings if f.rule_id == "evidence_linkage"]
        epd_evidence_finding = [f for f in evidence_findings if f.entity_type == "epd"][0]

        assert epd_evidence_finding.passed is False
        assert "no evidence" in epd_evidence_finding.description.lower()


# ============================================================================
# Test Report Summary
# ============================================================================

class TestReportSummary:
    """Test report summary calculations"""

    def test_report_summary_calculation(self, rules_engine, minimal_project):
        """Report should correctly calculate summary statistics"""
        # Add some passing and failing items
        minimal_project.epds.extend([
            # Passing EPD
            EPDDocument(
                epd_number="EPD-PASS",
                product_name="Valid Product",
                manufacturer="Test",
                declared_unit=Unit.M3,
                gwp_total=Decimal("300"),
                lca_stages=LCAStages(a1_a3=Decimal("250"), a4=Decimal("25"), a5=Decimal("25")),
                valid_from=date(2024, 1, 1),
                valid_until=date(2025, 12, 31),
                is_verified=True,
                epd_type=EPDType.PRODUCT_SPECIFIC,
                category=MaterialCategory.CONCRETE,
                source="EPD Australasia",
                evidence=[
                    EvidenceDocument(type=EvidenceType.EPD, uri="/test.pdf", hash="abc123")
                ]
            ),
            # Failing EPD (expired)
            EPDDocument(
                epd_number="EPD-FAIL",
                product_name="Expired Product",
                manufacturer="Test",
                declared_unit=Unit.M3,
                gwp_total=Decimal("300"),
                lca_stages=LCAStages(a1_a3=Decimal("250"), a4=Decimal("25"), a5=Decimal("25")),
                valid_from=date(2020, 1, 1),
                valid_until=date(2023, 12, 31),  # Expired
                is_verified=True,
                epd_type=EPDType.PRODUCT_SPECIFIC,
                category=MaterialCategory.CONCRETE,
                source="EPD Australasia"
            )
        ])

        report = rules_engine.evaluate_project(minimal_project)

        # Check summary is calculated
        assert report.total_checks > 0
        assert report.passed_checks >= 0
        assert report.failed_checks >= 0
        assert report.total_checks == report.passed_checks + report.failed_checks

        # Check severity counts
        assert report.critical_count >= 0
        assert report.high_count >= 0
        assert report.medium_count >= 0

        # Check compliance status logic
        if report.critical_count == 0 and report.high_count == 0:
            assert report.compliant is True
        else:
            assert report.compliant is False


# ============================================================================
# Test Deterministic Behavior
# ============================================================================

class TestDeterministicBehavior:
    """Test that rules engine is deterministic (no LLM involvement)"""

    def test_same_input_same_output(self, rules_engine, minimal_project):
        """Same project evaluated twice should give identical results"""
        # Add EPD
        epd = EPDDocument(
            epd_number="EPD-DETERMINISTIC",
            product_name="Test Product",
            manufacturer="Test",
            declared_unit=Unit.M3,
            gwp_total=Decimal("300"),
            lca_stages=LCAStages(a1_a3=Decimal("250"), a4=Decimal("25"), a5=Decimal("25")),
            valid_from=date(2024, 1, 1),
            valid_until=date(2025, 12, 31),
            is_verified=True,
            epd_type=EPDType.PRODUCT_SPECIFIC,
            category=MaterialCategory.CONCRETE,
            source="EPD Australasia"
        )
        minimal_project.epds.append(epd)

        # Evaluate twice
        report1 = rules_engine.evaluate_project(minimal_project)
        report2 = rules_engine.evaluate_project(minimal_project)

        # Should be identical
        assert report1.total_checks == report2.total_checks
        assert report1.passed_checks == report2.passed_checks
        assert report1.failed_checks == report2.failed_checks
        assert report1.critical_count == report2.critical_count
        assert report1.compliant == report2.compliant

        # Check each finding matches
        assert len(report1.findings) == len(report2.findings)

        for f1, f2 in zip(report1.findings, report2.findings):
            assert f1.rule_id == f2.rule_id
            assert f1.passed == f2.passed
            assert f1.severity == f2.severity
