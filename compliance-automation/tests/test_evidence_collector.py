"""
Unit tests for Evidence Collector and Manifest Generator
"""

import pytest
from pathlib import Path
from tempfile import TemporaryDirectory
import json

from ..evidence.manifest_generator import EvidenceCollector, EvidenceManifest
from ..schemas.canonical_schema import (
    ComplianceProject,
    EPDDocument,
    LCAStages,
    EvidenceDocument,
    GeographicLocation,
    Unit,
    MaterialCategory,
    EPDType,
    EvidenceType
)
from datetime import date
from decimal import Decimal


@pytest.fixture
def test_project():
    """Create test project with evidence"""
    project = ComplianceProject(
        project_name="Test Evidence Project",
        project_type="commercial",
        start_date=date(2024, 1, 1),
        location=GeographicLocation(city="Sydney", state="NSW", country="Australia"),
        gross_floor_area_m2=Decimal("1000")
    )

    # Add EPD with evidence
    epd = EPDDocument(
        epd_number="EPD-TEST-001",
        product_name="Test Product",
        manufacturer="Test Manufacturer",
        declared_unit=Unit.M3,
        gwp_total=Decimal("300"),
        lca_stages=LCAStages(
            a1_a3=Decimal("250"),
            a4=Decimal("25"),
            a5=Decimal("25")
        ),
        valid_from=date(2024, 1, 1),
        valid_until=date(2025, 12, 31),
        is_verified=True,
        epd_type=EPDType.PRODUCT_SPECIFIC,
        category=MaterialCategory.CONCRETE,
        source="EPD Australasia"
    )

    project.epds.append(epd)

    return project


class TestEvidenceCollector:
    """Test evidence collection and manifest generation"""

    def test_collect_evidence_creates_zip(self, test_project):
        """Should create ZIP file with evidence"""
        with TemporaryDirectory() as tmpdir:
            output_zip = Path(tmpdir) / "evidence.zip"

            collector = EvidenceCollector()
            manifest = collector.collect_project_evidence(test_project, str(output_zip))

            # ZIP should exist
            assert output_zip.exists()

            # Manifest should have project info
            assert manifest.project_name == test_project.project_name
            assert manifest.project_id == test_project.id

    def test_manifest_has_statistics(self, test_project):
        """Manifest should calculate statistics"""
        with TemporaryDirectory() as tmpdir:
            output_zip = Path(tmpdir) / "evidence.zip"

            collector = EvidenceCollector()
            manifest = collector.collect_project_evidence(test_project, str(output_zip))

            # Should have total files and size
            assert manifest.total_files >= 0
            assert manifest.total_size_bytes >= 0

            # Should have counts by type
            assert hasattr(manifest, 'epd_count')
            assert hasattr(manifest, 'invoice_count')

    def test_verify_evidence_zip(self, test_project):
        """Should verify evidence ZIP integrity"""
        with TemporaryDirectory() as tmpdir:
            output_zip = Path(tmpdir) / "evidence.zip"

            collector = EvidenceCollector()
            manifest = collector.collect_project_evidence(test_project, str(output_zip))

            # Verify
            is_valid, errors = collector.verify_manifest(str(output_zip))

            # Should be valid
            assert is_valid is True
            assert len(errors) == 0

    def test_extract_evidence(self, test_project):
        """Should extract evidence from ZIP"""
        with TemporaryDirectory() as tmpdir:
            output_zip = Path(tmpdir) / "evidence.zip"
            extract_dir = Path(tmpdir) / "extracted"

            collector = EvidenceCollector()

            # Collect
            manifest_created = collector.collect_project_evidence(test_project, str(output_zip))

            # Extract
            manifest_extracted = collector.extract_evidence(
                str(output_zip),
                str(extract_dir),
                verify=True
            )

            # Should have extracted
            assert extract_dir.exists()

            # Manifests should match
            assert manifest_created.project_id == manifest_extracted.project_id
            assert manifest_created.total_files == manifest_extracted.total_files


class TestManifestStructure:
    """Test manifest JSON structure"""

    def test_manifest_to_json(self, test_project):
        """Manifest should serialize to JSON"""
        manifest = EvidenceManifest(
            project_id=test_project.id,
            project_name=test_project.project_name
        )

        manifest.calculate_statistics()

        # Should serialize
        json_data = manifest.to_json()

        assert json_data is not None
        assert 'project_id' in json_data
        assert 'project_name' in json_data
        assert 'total_files' in json_data

    def test_manifest_from_json_roundtrip(self, test_project):
        """Manifest should survive JSON roundtrip"""
        manifest_original = EvidenceManifest(
            project_id=test_project.id,
            project_name=test_project.project_name
        )

        # Serialize
        json_str = json.dumps(manifest_original.to_json(), default=str)

        # Deserialize
        json_data = json.loads(json_str)
        manifest_restored = EvidenceManifest(**json_data)

        assert str(manifest_restored.project_id) == str(manifest_original.project_id)
        assert manifest_restored.project_name == manifest_original.project_name
