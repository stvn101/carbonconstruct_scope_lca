# 🏗️ Compliance Automation Report

**Project:** {{ project_name }}
**Type:** {{ project_type|capitalize }}
{% if location %}**Location:** {{ location.city }}, {{ location.state }}{% endif %}
**Report ID:** {{ report_id }}
**Generated:** {{ generated_at|datetime('%d/%m/%Y %H:%M') }}
**Rules Version:** {{ rules_version }}

---

## 📊 Executive Summary

| Metric | Value |
|--------|-------|
| **Overall Status** | **{{ compliance_status }}** |
| **Pass Rate** | {{ pass_rate|round(1) }}% ({{ passed_checks }}/{{ total_checks }} checks) |
| **Total Embodied Carbon** | {{ total_embodied_carbon|round(0) }} kg CO2-e |
| **Carbon Intensity** | {% if carbon_intensity %}{{ carbon_intensity|round(1) }} kg CO2-e/m²{% else %}N/A{% endif %} |

### Issues Summary

{% if critical_count > 0 %}
- 🚨 **{{ critical_count }} CRITICAL** issues require immediate attention
{% endif %}
{% if high_count > 0 %}
- ⚠️ **{{ high_count }} HIGH** severity issues found
{% endif %}
{% if medium_count > 0 %}
- ℹ️ **{{ medium_count }} MEDIUM** severity issues found
{% endif %}
{% if low_count > 0 %}
- 📝 **{{ low_count }} LOW** priority items noted
{% endif %}
{% if critical_count == 0 and high_count == 0 %}
- ✅ **No critical or high-severity issues detected**
{% endif %}

### Data Sources

- **EPDs:** {{ epd_count }}
- **Invoices:** {{ invoice_count }}
- **BIM Models:** {{ bim_model_count }}
- **Transport Logs:** {{ transport_log_count }}
- **Waste Streams:** {{ waste_stream_count }}
- **Meters:** {{ meter_count }}

---

{% if critical_findings %}
## 🚨 Critical Findings

**These issues must be resolved before certification.**

{% for finding in critical_findings %}
### {{ finding.rule_name }}

**Severity:** CRITICAL
**Status:** FAIL

**Description:** {{ finding.description }}

{% if finding.evidence_uris %}
**Evidence:**
{% for uri in finding.evidence_uris %}
- `{{ uri }}`
{% endfor %}
{% endif %}

**Remediation:**
- **Action:** {{ finding.remediation.action }}
- **Responsible Party:** {{ finding.remediation.responsible_party }}
{% if finding.remediation.resources %}
- **Resources:**
{% for resource in finding.remediation.resources %}
  - {{ resource }}
{% endfor %}
{% endif %}

---
{% endfor %}
{% endif %}

{% if high_findings %}
## ⚠️ High Severity Findings

**These issues should be addressed before final reporting.**

{% for finding in high_findings %}
### {{ finding.rule_name }}

**Severity:** HIGH
**Status:** FAIL

**Description:** {{ finding.description }}

{% if finding.evidence_uris %}
**Evidence:**
{% for uri in finding.evidence_uris %}
- `{{ uri }}`
{% endfor %}
{% endif %}

**Remediation:**
- **Action:** {{ finding.remediation.action }}
- **Responsible Party:** {{ finding.remediation.responsible_party }}

---
{% endfor %}
{% endif %}

{% if medium_findings %}
## ℹ️ Medium Severity Findings

{% for finding in medium_findings %}
### {{ finding.rule_name }}

**Severity:** MEDIUM
**Status:** FAIL

**Description:** {{ finding.description }}

**Remediation:** {{ finding.remediation.action }}

---
{% endfor %}
{% endif %}

## ✅ Passed Checks

{% for rule_id, findings in findings_by_rule.items() %}
{% set passed_findings_for_rule = findings|selectattr('passed', 'equalto', true)|list %}
{% if passed_findings_for_rule %}
### {{ passed_findings_for_rule[0].rule_name }} ({{ passed_findings_for_rule|length }} checks)

{% for finding in passed_findings_for_rule %}
- ✅ {{ finding.description }}
{% endfor %}

{% endif %}
{% endfor %}

---

## 📋 Detailed Findings Table

| Rule | Severity | Status | Description | Entity Type |
|------|----------|--------|-------------|-------------|
{% for finding in report.findings %}
| {{ finding.rule_name }} | {{ finding.severity }} | {% if finding.passed %}PASS{% else %}FAIL{% endif %} | {{ finding.description }} | {{ finding.entity_type or 'N/A' }} |
{% endfor %}

---

## 📚 Compliance Framework

This report evaluates compliance against the following standards and frameworks:

- **NCC 2022** - National Construction Code (Section J: Energy Efficiency)
- **GHG Protocol** - Corporate Accounting and Reporting Standard
- **EN 15804** - EPD Core Rules for Construction Products
- **ISO 14044** - Life Cycle Assessment Requirements

---

**Report Generated:** {{ generated_at|datetime('%Y-%m-%d %H:%M:%S UTC') }}
**Carbon Construct Compliance Automation Service** | Version {{ rules_version }}
