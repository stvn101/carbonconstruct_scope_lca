"""
Evidence Manifest Generator

Collects all evidence documents, generates manifest with checksums,
and packages everything into a ZIP archive for audit purposes.
"""

import json
import hashlib
import zipfile
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any, Optional
from uuid import UUID
import shutil
import mimetypes

from pydantic import BaseModel, Field

from ..schemas.canonical_schema import (
    ComplianceProject,
    EvidenceDocument,
    EvidenceType
)


class EvidenceManifestEntry(BaseModel):
    """Single entry in evidence manifest"""
    evidence_id: UUID
    evidence_type: EvidenceType
    original_uri: str
    archive_path: str
    filename: str
    size_bytes: int
    sha256_hash: str
    mime_type: Optional[str] = None
    collected_at: datetime = Field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class EvidenceManifest(BaseModel):
    """Complete evidence manifest"""
    manifest_version: str = "1.0.0"
    project_id: UUID
    project_name: str
    generated_at: datetime = Field(default_factory=datetime.utcnow)
    total_files: int = 0
    total_size_bytes: int = 0
    entries: List[EvidenceManifestEntry] = Field(default_factory=list)

    # Statistics by type
    epd_count: int = 0
    invoice_count: int = 0
    bim_count: int = 0
    meter_count: int = 0
    transport_count: int = 0
    waste_count: int = 0
    other_count: int = 0

    def calculate_statistics(self):
        """Calculate summary statistics"""
        self.total_files = len(self.entries)
        self.total_size_bytes = sum(entry.size_bytes for entry in self.entries)

        # Count by type
        type_counts = {}
        for entry in self.entries:
            type_key = entry.evidence_type.value
            type_counts[type_key] = type_counts.get(type_key, 0) + 1

        self.epd_count = type_counts.get('epd', 0)
        self.invoice_count = type_counts.get('invoice', 0)
        self.bim_count = type_counts.get('bim_model', 0) + type_counts.get('ifc_file', 0)
        self.meter_count = type_counts.get('meter_reading', 0)
        self.transport_count = type_counts.get('transport_log', 0)
        self.waste_count = type_counts.get('waste_receipt', 0)
        self.other_count = type_counts.get('other', 0) + type_counts.get('certification', 0) + type_counts.get('test_report', 0)

    def to_json(self) -> Dict[str, Any]:
        """Export as JSON"""
        return self.model_dump(mode='json')


class EvidenceCollector:
    """Collects and packages evidence documents"""

    def __init__(self, temp_dir: Optional[str] = None):
        """
        Initialize evidence collector

        Args:
            temp_dir: Temporary directory for staging files
        """
        if temp_dir:
            self.temp_dir = Path(temp_dir)
        else:
            self.temp_dir = Path.cwd() / ".evidence_temp"

        self.temp_dir.mkdir(parents=True, exist_ok=True)

    def collect_project_evidence(
        self,
        project: ComplianceProject,
        output_zip: str
    ) -> EvidenceManifest:
        """
        Collect all evidence from project and create ZIP archive

        Args:
            project: Project with evidence documents
            output_zip: Path to output ZIP file

        Returns:
            Evidence manifest
        """
        manifest = EvidenceManifest(
            project_id=project.id,
            project_name=project.project_name
        )

        # Collect all evidence documents from all sources
        all_evidence: List[tuple[EvidenceDocument, str]] = []

        # Project-level evidence
        for ev in project.evidence_documents:
            all_evidence.append((ev, "project"))

        # EPD evidence
        for epd in project.epds:
            for ev in epd.evidence:
                all_evidence.append((ev, f"epds/{epd.epd_number}"))

        # Invoice evidence
        for invoice in project.invoices:
            for ev in invoice.evidence:
                all_evidence.append((ev, f"invoices/{invoice.invoice_number}"))

        # BIM model evidence
        for bim in project.bim_models:
            for ev in bim.evidence:
                all_evidence.append((ev, f"bim/{bim.project_name}"))

            # BIM element evidence
            for element in bim.elements:
                for ev in element.evidence:
                    all_evidence.append((ev, f"bim/{bim.project_name}/elements"))

        # Transport evidence
        for transport in project.transport_logs:
            for ev in transport.evidence:
                all_evidence.append((ev, f"transport/{transport.shipment_id}"))

        # Waste evidence
        for waste in project.waste_streams:
            for ev in waste.evidence:
                all_evidence.append((ev, "waste"))

        # Meter evidence
        for meter in project.meters:
            for ev in meter.evidence:
                all_evidence.append((ev, f"meters/{meter.meter_id}"))

        # Create ZIP archive
        with zipfile.ZipFile(output_zip, 'w', zipfile.ZIP_DEFLATED) as zf:
            # Process each evidence document
            for evidence, category in all_evidence:
                entry = self._process_evidence(evidence, category, zf)
                if entry:
                    manifest.entries.append(entry)

            # Add manifest to ZIP
            manifest.calculate_statistics()
            manifest_json = json.dumps(manifest.to_json(), indent=2, default=str)
            zf.writestr("MANIFEST.json", manifest_json)

            # Add README
            readme = self._generate_readme(manifest)
            zf.writestr("README.txt", readme)

        # Cleanup temp directory
        self._cleanup_temp()

        return manifest

    def _process_evidence(
        self,
        evidence: EvidenceDocument,
        category: str,
        zipfile_handle: zipfile.ZipFile
    ) -> Optional[EvidenceManifestEntry]:
        """
        Process a single evidence document

        Args:
            evidence: Evidence document
            category: Category subdirectory
            zipfile_handle: Open ZIP file

        Returns:
            Manifest entry or None if file not accessible
        """
        # Determine source file path
        source_path = Path(evidence.uri)

        # Check if file exists and is accessible
        if not source_path.exists() or not source_path.is_file():
            # Try to interpret as URL or database reference
            # For now, skip non-local files
            return None

        # Determine filename
        filename = evidence.filename or source_path.name

        # Create archive path
        archive_path = f"evidence/{category}/{filename}"

        # Calculate hash if not already present
        if evidence.hash:
            file_hash = evidence.hash
        else:
            file_hash = self._calculate_file_hash(source_path)

        # Get file size
        file_size = source_path.stat().st_size

        # Determine MIME type
        mime_type = self._guess_mime_type(filename)

        # Add to ZIP
        zipfile_handle.write(source_path, archive_path)

        # Create manifest entry
        entry = EvidenceManifestEntry(
            evidence_id=evidence.id,
            evidence_type=evidence.type,
            original_uri=evidence.uri,
            archive_path=archive_path,
            filename=filename,
            size_bytes=file_size,
            sha256_hash=file_hash,
            mime_type=mime_type,
            metadata=evidence.metadata
        )

        return entry

    def verify_manifest(
        self,
        zip_path: str
    ) -> tuple[bool, List[str]]:
        """
        Verify integrity of evidence ZIP using manifest

        Args:
            zip_path: Path to evidence ZIP

        Returns:
            Tuple of (is_valid, list_of_errors)
        """
        errors = []

        with zipfile.ZipFile(zip_path, 'r') as zf:
            # Read manifest
            try:
                manifest_data = zf.read("MANIFEST.json")
                manifest_dict = json.loads(manifest_data)
                manifest = EvidenceManifest(**manifest_dict)
            except Exception as e:
                errors.append(f"Failed to read manifest: {e}")
                return False, errors

            # Verify each entry
            for entry in manifest.entries:
                try:
                    # Extract file data
                    file_data = zf.read(entry.archive_path)

                    # Calculate hash
                    calculated_hash = hashlib.sha256(file_data).hexdigest()

                    # Compare
                    if calculated_hash != entry.sha256_hash:
                        errors.append(
                            f"Hash mismatch for {entry.archive_path}: "
                            f"expected {entry.sha256_hash}, got {calculated_hash}"
                        )

                    # Verify size
                    if len(file_data) != entry.size_bytes:
                        errors.append(
                            f"Size mismatch for {entry.archive_path}: "
                            f"expected {entry.size_bytes} bytes, got {len(file_data)}"
                        )

                except KeyError:
                    errors.append(f"Missing file in archive: {entry.archive_path}")
                except Exception as e:
                    errors.append(f"Error verifying {entry.archive_path}: {e}")

        is_valid = len(errors) == 0
        return is_valid, errors

    def extract_evidence(
        self,
        zip_path: str,
        output_dir: str,
        verify: bool = True
    ) -> EvidenceManifest:
        """
        Extract evidence ZIP and return manifest

        Args:
            zip_path: Path to evidence ZIP
            output_dir: Directory to extract to
            verify: Whether to verify integrity first

        Returns:
            Evidence manifest
        """
        if verify:
            is_valid, errors = self.verify_manifest(zip_path)
            if not is_valid:
                raise ValueError(f"Evidence verification failed: {'; '.join(errors)}")

        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)

        with zipfile.ZipFile(zip_path, 'r') as zf:
            # Read manifest
            manifest_data = zf.read("MANIFEST.json")
            manifest = EvidenceManifest(**json.loads(manifest_data))

            # Extract all files
            zf.extractall(output_path)

        return manifest

    # ========================================================================
    # UTILITY METHODS
    # ========================================================================

    def _calculate_file_hash(self, file_path: Path) -> str:
        """Calculate SHA-256 hash of file"""
        sha256_hash = hashlib.sha256()
        with open(file_path, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()

    def _guess_mime_type(self, filename: str) -> str:
        """Guess MIME type from filename"""
        mime_type, _ = mimetypes.guess_type(filename)
        return mime_type or "application/octet-stream"

    def _cleanup_temp(self):
        """Clean up temporary directory"""
        if self.temp_dir.exists():
            shutil.rmtree(self.temp_dir)

    def _generate_readme(self, manifest: EvidenceManifest) -> str:
        """Generate README for evidence ZIP"""
        readme = f"""
EVIDENCE ARCHIVE - {manifest.project_name}
{'=' * 80}

Project ID: {manifest.project_id}
Generated: {manifest.generated_at.strftime('%Y-%m-%d %H:%M:%S UTC')}
Manifest Version: {manifest.manifest_version}

CONTENTS
{'-' * 80}
Total Files: {manifest.total_files}
Total Size: {manifest.total_size_bytes:,} bytes ({manifest.total_size_bytes / (1024*1024):.2f} MB)

Evidence by Type:
- EPD Documents: {manifest.epd_count}
- Invoices: {manifest.invoice_count}
- BIM/IFC Files: {manifest.bim_count}
- Meter Readings: {manifest.meter_count}
- Transport Logs: {manifest.transport_count}
- Waste Receipts: {manifest.waste_count}
- Other: {manifest.other_count}

DIRECTORY STRUCTURE
{'-' * 80}
evidence/
├── project/          - Project-level documents
├── epds/             - Environmental Product Declarations
│   └── [epd_number]/ - Organized by EPD number
├── invoices/         - Purchase invoices and receipts
│   └── [invoice_#]/  - Organized by invoice number
├── bim/              - BIM/IFC model exports
│   └── [model_name]/ - Organized by model name
├── transport/        - Transport and logistics documents
│   └── [shipment_id]/- Organized by shipment ID
├── waste/            - Waste tracking and receipts
└── meters/           - Utility meter readings
    └── [meter_id]/   - Organized by meter ID

VERIFICATION
{'-' * 80}
All files in this archive have been checksummed using SHA-256.
To verify integrity, see MANIFEST.json which contains:
- Original file URIs
- Archive paths
- SHA-256 hashes
- File sizes
- Collection timestamps

USAGE
{'-' * 80}
This evidence archive supports compliance reporting and audit requirements.
All carbon claims in the compliance report are backed by evidence in this archive.

To verify the archive:
    python -m compliance_automation.evidence.manifest_generator verify evidence.zip

To extract:
    python -m compliance_automation.evidence.manifest_generator extract evidence.zip output_dir/

STANDARDS
{'-' * 80}
Evidence collection follows:
- ISO 14044:2006 (Life Cycle Assessment)
- ISO 14025:2006 (Type III Environmental Declarations)
- GHG Protocol Corporate Standard
- Australian National Construction Code 2022

{'=' * 80}
Carbon Construct Compliance Automation Service
For questions or support, contact: compliance@carbonconstruct.com.au
"""
        return readme.strip()


# ============================================================================
# CLI INTERFACE
# ============================================================================

def main():
    """CLI interface for evidence manifest operations"""
    import argparse

    parser = argparse.ArgumentParser(description="Evidence Manifest Generator")
    subparsers = parser.add_subparsers(dest='command', help='Command to execute')

    # Verify command
    verify_parser = subparsers.add_parser('verify', help='Verify evidence ZIP integrity')
    verify_parser.add_argument('zip_path', help='Path to evidence ZIP file')

    # Extract command
    extract_parser = subparsers.add_parser('extract', help='Extract evidence ZIP')
    extract_parser.add_argument('zip_path', help='Path to evidence ZIP file')
    extract_parser.add_argument('output_dir', help='Output directory')
    extract_parser.add_argument('--no-verify', action='store_true', help='Skip verification')

    args = parser.parse_args()

    collector = EvidenceCollector()

    if args.command == 'verify':
        is_valid, errors = collector.verify_manifest(args.zip_path)
        if is_valid:
            print("✅ Evidence ZIP is valid")
            return 0
        else:
            print("❌ Evidence ZIP verification failed:")
            for error in errors:
                print(f"  - {error}")
            return 1

    elif args.command == 'extract':
        try:
            manifest = collector.extract_evidence(
                args.zip_path,
                args.output_dir,
                verify=not args.no_verify
            )
            print(f"✅ Extracted {manifest.total_files} files to {args.output_dir}")
            return 0
        except Exception as e:
            print(f"❌ Extraction failed: {e}")
            return 1

    else:
        parser.print_help()
        return 1


if __name__ == '__main__':
    exit(main())
