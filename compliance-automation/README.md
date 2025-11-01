# Compliance Automation Service

A comprehensive compliance automation system for carbon accounting and construction compliance verification. This service ingests data from multiple sources (BIM/IFC, ERP invoices, meters, EPDs, transport logs, waste records), applies deterministic compliance rules, and generates detailed reports with evidence packages.

## 🎯 Key Features

### Core Functionality

1. **Multi-Source Data Ingestion**
   - BIM/IFC models
   - ERP purchase invoices
   - Environmental Product Declarations (EPDs)
   - Utility meter readings
   - Transport/logistics data
   - Waste tracking records

2. **Canonical Schema**
   - Unified data model (Pydantic)
   - Type-safe data validation
   - Automatic unit conversion
   - Evidence linkage

3. **Deterministic Rules Engine**
   - YAML-based rule definitions
   - Python rules engine (no LLM decision-making)
   - 10 core compliance checks
   - Extensible rule system

4. **Structured Findings Output**
   - JSON findings with `rule_id`, `severity`, `evidence_uris`, `remediation`
   - Pass/fail determined by rules, not LLM
   - Actionable remediation guidance

5. **Report Generation**
   - HTML, PDF, Markdown, JSON formats
   - Citations and references
   - Evidence manifest ZIP archive
   - Executive summaries

6. **LLM Narrative Generation** (Non-Decision Making)
   - Draft narratives from deterministic findings
   - Executive summaries
   - Stakeholder communications
   - **LLM does NOT make pass/fail decisions**

7. **Dagster Orchestration**
   - Complete job graph
   - Parallel processing
   - Retry policies
   - Asset materialization

8. **Comprehensive Testing**
   - Unit tests for all 10 checks
   - Evidence collector tests
   - Deterministic behavior validation

### Enhancements

1. **Regulatory Diff Bot**
   - Monitors NCC, ISO, GHG Protocol, EN standards
   - Detects regulatory changes
   - Generates rule update PRs
   - Redlined change summaries

2. **Coverage Heatmap**
   - Visualizes data quality by project package
   - Identifies evidence gaps
   - Generates prioritized action plans
   - Drives targeted data collection

## 📋 10 Core Compliance Checks

| Check | Rule ID | Description | Severity |
|-------|---------|-------------|----------|
| 1 | `epd_validity` | EPD validity and certification | CRITICAL |
| 2 | `material_traceability` | BIM → Invoice → EPD traceability | HIGH |
| 3 | `ncc_embodied_carbon` | NCC 2022 carbon threshold compliance | CRITICAL |
| 4 | `transport_verification` | Transport distance and emissions | MEDIUM |
| 5 | `waste_circularity` | Waste reporting and circularity | MEDIUM |
| 6 | `data_quality` | Data completeness (≥80% primary) | HIGH |
| 7 | `temporal_validity` | Timeline alignment | MEDIUM |
| 8 | `scope_boundary` | GHG Protocol scope consistency | HIGH |
| 9 | `double_counting` | Prevent double-counting | CRITICAL |
| 10 | `evidence_linkage` | Citation and evidence backing | CRITICAL |

## 🚀 Quick Start

### Installation

```bash
# Clone repository
git clone <repo-url>
cd carbonconstruct_scope_lca/compliance-automation

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables
export ANTHROPIC_API_KEY="your-api-key"
```

### Basic Usage

```python
from compliance_automation.schemas.canonical_schema import ComplianceProject
from compliance_automation.engine.rules_engine import RulesEngine
from compliance_automation.reports.report_generator import ReportGenerator

# Load project data
project = ComplianceProject(
    project_name="Example Tower",
    project_type="commercial",
    # ... add your data
)

# Initialize rules engine
engine = RulesEngine("rules/compliance_rules.yaml")

# Evaluate compliance
report = engine.evaluate_project(project)

print(f"Compliance Status: {report.compliant}")
print(f"Pass Rate: {report.passed_checks}/{report.total_checks}")
print(f"Critical Issues: {report.critical_count}")

# Generate reports
generator = ReportGenerator()
generator.generate_html_report(project, report, "report.html")
generator.generate_pdf_report(project, report, "report.pdf")
generator.generate_json_report(project, report, "report.json")
```

### Running with Dagster

```bash
# Launch Dagster UI
dagster dev -f compliance-automation/orchestration/dagster_jobs.py

# Run complete pipeline
dagster job execute -f orchestration/dagster_jobs.py -j compliance_automation_job

# Quick compliance check (no LLM)
dagster job execute -f orchestration/dagster_jobs.py -j quick_compliance_check_job
```

## 📁 Directory Structure

```
compliance-automation/
├── schemas/
│   └── canonical_schema.py        # Pydantic models for all input types
├── rules/
│   └── compliance_rules.yaml      # YAML rule definitions
├── engine/
│   └── rules_engine.py            # Deterministic rules engine
├── reports/
│   ├── report_generator.py        # Multi-format report generator
│   └── templates/                 # Jinja2 templates
│       ├── compliance_report.html
│       ├── compliance_report.md
│       └── executive_summary.txt
├── evidence/
│   └── manifest_generator.py      # Evidence ZIP with SHA-256 hashes
├── llm/
│   └── narrative_generator.py     # LLM narratives (no decisions)
├── orchestration/
│   └── dagster_jobs.py            # Dagster job graph
├── enhancements/
│   ├── regulatory_diff_bot.py     # Monitor standards updates
│   └── coverage_heatmap.py        # Data quality visualization
├── tests/
│   ├── test_rules_engine.py       # Unit tests for all 10 checks
│   └── test_evidence_collector.py # Evidence tests
├── COMPLIANCE_CHECKS.md           # Detailed check documentation
└── README.md                      # This file
```

## 🧪 Testing

```bash
# Run all tests
pytest tests/ -v

# Run specific test module
pytest tests/test_rules_engine.py -v

# Run with coverage
pytest tests/ --cov=compliance_automation --cov-report=html
```

## 🔧 Configuration

### Rules Configuration

Edit `rules/compliance_rules.yaml` to customize:
- Threshold values (e.g., NCC carbon limits)
- Severity levels
- Evidence requirements
- Remediation actions

### Environment Variables

```bash
# Required for LLM narratives
ANTHROPIC_API_KEY=your-key-here

# Optional
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-key
```

## 📊 Enhancements

### Regulatory Diff Bot

Monitor regulatory standards and auto-generate PRs:

```bash
# Check for updates
python -m compliance_automation.enhancements.regulatory_diff_bot --check

# Generate PR
python -m compliance_automation.enhancements.regulatory_diff_bot --check --generate-pr
```

Configure monitored standards in `regulatory_bot_config.yaml`.

### Coverage Heatmap

Generate data quality heatmap:

```bash
# Generate heatmap
python -m compliance_automation.enhancements.coverage_heatmap project.json --output heatmap.html

# Generate action plan for gaps
python -m compliance_automation.enhancements.coverage_heatmap project.json --gaps
```

## 📚 Documentation

- [Compliance Checks](COMPLIANCE_CHECKS.md) - Detailed description of all 10 checks
- [Canonical Schema](schemas/canonical_schema.py) - Data model documentation
- [Rules Engine](engine/rules_engine.py) - Engine implementation details

## 🔐 Security & Integrity

- **SHA-256 hashes** for all evidence documents
- **Evidence manifest** with checksums
- **Deterministic rules** - no LLM involved in pass/fail
- **LLM output validation** - prevent decision-making language
- **Row-level security** in database

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Make changes and add tests
4. Ensure tests pass (`pytest tests/ -v`)
5. Commit changes (`git commit -m 'Add amazing feature'`)
6. Push to branch (`git push origin feature/amazing-feature`)
7. Open Pull Request

## 📝 License

Copyright © 2025 Carbon Construct. All rights reserved.

## 🆘 Support

For questions or issues:
- Open a GitHub issue
- Email: compliance@carbonconstruct.com.au
- Documentation: See inline docstrings and `COMPLIANCE_CHECKS.md`

## 🎯 Roadmap

- [ ] IFC file parser integration
- [ ] Real-time BIM model monitoring
- [ ] Machine learning for material classification (non-compliance)
- [ ] Multi-language support (report generation)
- [ ] REST API for external integrations
- [ ] Power BI / Tableau dashboard connectors
- [ ] Blockchain evidence anchoring
- [ ] Real-time compliance dashboard

---

**Built with:**
- Python 3.11+
- Pydantic for data validation
- Dagster for orchestration
- Anthropic Claude for narratives (no decision-making)
- Jinja2 for templating
- pytest for testing
