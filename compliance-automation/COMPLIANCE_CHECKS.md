# Compliance Automation Service - 10 Core Checks

This document defines the 10 compliance checks implemented by the rules engine.

## Check 1: EPD Validity and Certification

**Rule ID**: `epd_validity`

**Description**: Validates that all Environmental Product Declarations are current, verified, and properly certified.

**Criteria**:
- EPD must be valid on the date of material procurement/use
- EPD must be third-party verified for product-specific claims
- EPD must have a verifiable registration number
- EPD must be from recognized program operator (EPD Australasia, International EPD System, etc.)

**Severity**: CRITICAL for product-specific EPDs, WARNING for industry-average

**Evidence Required**:
- EPD document (PDF)
- Verification statement
- Registration in EPD database

---

## Check 2: Material Traceability and Documentation

**Rule ID**: `material_traceability`

**Description**: Ensures complete traceability from BIM/IFC model through procurement to installation.

**Criteria**:
- Each BIM element must link to an invoice line item
- Invoice must link to an EPD or emissions factor
- Supplier must be identified with ABN
- Delivery location must match project location
- Quantities must reconcile (BIM ±10% of invoiced)

**Severity**: HIGH

**Evidence Required**:
- BIM/IFC export with element IDs
- Purchase invoices
- Delivery receipts
- EPD or material certificate

---

## Check 3: Embodied Carbon Threshold Compliance (NCC 2022)

**Rule ID**: `ncc_embodied_carbon`

**Description**: Validates compliance with NCC 2022 Section J embodied carbon benchmarks.

**Criteria**:
- Carbon intensity (kg CO2-e/m² GFA) must be below regulatory threshold:
  - Residential: ≤800 kg CO2-e/m²
  - Commercial: ≤850 kg CO2-e/m²
  - Industrial: ≤900 kg CO2-e/m²
  - Infrastructure: ≤750 kg CO2-e/m²
- Must include A1-A3 stages (mandatory)
- Should include A4-A5 stages (recommended)
- C1-C4 optional but encouraged

**Severity**: CRITICAL (regulatory requirement)

**Evidence Required**:
- Complete LCA calculation
- EPDs for all major materials (>80% by mass or carbon)
- Calculation methodology documentation

---

## Check 4: Transport Distance and Emissions Verification

**Rule ID**: `transport_verification`

**Description**: Validates transport emissions calculations and distance plausibility.

**Criteria**:
- Transport distance must be verified against GPS/logistics data
- Distance must be plausible (max 20,000 km for international, 5,000 km domestic)
- Emissions factor must match transport mode and region
- Multi-modal transport must have separate legs
- Load factors must be realistic (0.3-1.0)

**Severity**: MEDIUM

**Evidence Required**:
- Transport invoices or bills of lading
- Route documentation
- Carrier certification for emissions factors

---

## Check 5: Waste Reporting and Circularity

**Rule ID**: `waste_circularity`

**Description**: Validates waste data completeness and circularity metrics.

**Criteria**:
- All construction waste must be classified and quantified
- Waste disposal facility must be identified
- Diversion from landfill rate must be calculated
- Hazardous waste must have special handling documentation
- Recycled content claims must be substantiated

**Severity**: MEDIUM

**Evidence Required**:
- Waste dockets/receipts
- Recycling facility certifications
- Material composition declarations

---

## Check 6: Data Completeness and Quality

**Rule ID**: `data_quality`

**Description**: Assesses completeness and quality of carbon accounting data.

**Criteria**:
- Primary data (invoices, meters) covers ≥80% of materials by mass
- Secondary data (generic EPDs, estimates) clearly labeled
- All data sources dated within project timeline
- Uncertain data flagged with conservative assumptions
- Material quantities reconcile across sources (BIM, invoices, waste)

**Severity**: HIGH

**Evidence Required**:
- Data quality register
- Assumptions log
- Reconciliation spreadsheet

---

## Check 7: Temporal Validity (Timeline Alignment)

**Rule ID**: `temporal_validity`

**Description**: Ensures all data corresponds to the correct project phase and timeline.

**Criteria**:
- Invoice dates must fall within project construction period (±30 days tolerance)
- Meter readings must align with operational phase
- EPDs must be valid on date of material procurement
- Transport logs must match invoice delivery dates (±7 days)
- Waste dates must be within construction period

**Severity**: MEDIUM

**Evidence Required**:
- Project timeline documentation
- Dated evidence for all transactions

---

## Check 8: Scope Boundary Consistency (GHG Protocol)

**Rule ID**: `scope_boundary`

**Description**: Validates that emissions are correctly categorized per GHG Protocol and ISO 14044.

**Criteria**:
- Embodied carbon (Scope 3 Category 1: Purchased Goods)
- Transport (Scope 3 Category 4: Upstream Transportation)
- Operational carbon clearly separated (Scope 1, 2, 3)
- No overlap between scopes (double-counting prevention)
- System boundary clearly documented
- Biogenic carbon reported separately

**Severity**: HIGH

**Evidence Required**:
- Scope boundary diagram
- GHG inventory report
- Allocation methodology

---

## Check 9: Double-Counting Prevention

**Rule ID**: `double_counting`

**Description**: Detects and prevents double-counting of emissions across data sources.

**Criteria**:
- Same material not counted in both BIM and invoices (unless reconciled)
- Transport emissions (A4) not added twice if already in EPD
- Electricity for equipment not in both meters and fuel logs
- Waste emissions vs. end-of-life stage (C1-C4) reconciled
- Cross-reference all evidence URIs for duplicates

**Severity**: CRITICAL

**Evidence Required**:
- Unique identifiers for all materials
- Cross-reference matrix
- Reconciliation notes

---

## Check 10: Citation and Evidence Linkage

**Rule ID**: `evidence_linkage`

**Description**: Ensures every carbon claim is backed by verifiable evidence.

**Criteria**:
- Every EPD must have document URI
- Every invoice line item must link to material or EPD
- Every emissions factor must cite source
- All evidence documents must be accessible
- Evidence must have integrity hash (SHA-256)
- Broken links flagged as HIGH severity

**Severity**: CRITICAL

**Evidence Required**:
- Evidence manifest (ZIP archive)
- SHA-256 checksums
- Hyperlinks to external databases (EC3, EPD Australasia)

---

## Severity Levels

| Severity | Description | Action Required |
|----------|-------------|-----------------|
| **CRITICAL** | Regulatory non-compliance or data integrity failure | Must fix before certification |
| **HIGH** | Significant data quality issue or incomplete evidence | Should fix before final report |
| **MEDIUM** | Minor gap or conservative assumption needed | Recommend fixing |
| **LOW** | Informational or best practice | Optional improvement |

---

## Remediation Templates

Each finding includes a structured remediation suggestion:

```json
{
  "finding_id": "uuid",
  "rule_id": "epd_validity",
  "severity": "CRITICAL",
  "description": "EPD for 'Concrete 32MPa' expired 2024-03-15",
  "evidence_uris": ["invoices/INV-2024-001.pdf", "epds/EPD-2019-123.pdf"],
  "remediation": {
    "action": "Obtain current EPD from manufacturer",
    "responsible_party": "Procurement team",
    "deadline": "2025-11-15",
    "resources": [
      "https://epd-australasia.com/search",
      "Contact: supplier@example.com"
    ]
  }
}
```

---

## Integration with LLM Narrative Generation

**Important**: The LLM **does NOT decide** pass/fail. It only:
1. Receives findings from rules engine
2. Drafts human-readable narratives
3. Suggests remediation language
4. Generates executive summaries

The rules engine (deterministic Python code) makes all compliance decisions.
