"""
Regulatory Diff Bot

Monitors source standards (NCC, ISO, GHG Protocol, etc.) for updates and automatically
opens pull requests with updated rules and redlined summaries.

This bot:
1. Watches regulatory document sources (RSS, APIs, web scraping)
2. Detects changes in standards
3. Generates diff/redline of changes
4. Updates YAML rules to reflect new requirements
5. Creates GitHub PR with summary and evidence
"""

import re
from typing import List, Dict, Any, Optional
from datetime import datetime, date
from pathlib import Path
import yaml
import json
import hashlib
from dataclasses import dataclass, asdict
from enum import Enum
import anthropic
import os
import requests
from bs4 import BeautifulSoup


class StandardType(Enum):
    """Types of regulatory standards"""
    NCC = "ncc"  # National Construction Code
    ISO = "iso"  # ISO standards
    GHG_PROTOCOL = "ghg_protocol"  # GHG Protocol
    EN_STANDARD = "en"  # European Norms
    REGIONAL = "regional"  # Regional building codes


@dataclass
class RegulatoryStandard:
    """Regulatory standard metadata"""
    standard_id: str
    name: str
    type: StandardType
    version: str
    effective_date: date
    source_url: str
    monitoring_enabled: bool = True
    last_checked: Optional[datetime] = None
    content_hash: Optional[str] = None


@dataclass
class StandardChange:
    """Detected change in a standard"""
    standard_id: str
    change_date: datetime
    change_type: str  # "amendment", "new_section", "clarification", "threshold_change"
    section: str
    old_content: str
    new_content: str
    impact_level: str  # "critical", "high", "medium", "low"
    affected_rules: List[str]  # Rule IDs that need updating


@dataclass
class RulePatch:
    """Proposed patch to a compliance rule"""
    rule_id: str
    field: str  # Which field to update
    old_value: Any
    new_value: Any
    justification: str
    standard_reference: str


class RegulatoryDiffBot:
    """
    Bot that monitors regulatory standards and proposes rule updates
    """

    def __init__(self, config_path: str, anthropic_api_key: Optional[str] = None):
        """
        Initialize regulatory diff bot

        Args:
            config_path: Path to bot configuration file
            anthropic_api_key: Anthropic API key for change analysis
        """
        self.config_path = Path(config_path)
        self.config = self._load_config()

        self.api_key = anthropic_api_key or os.getenv("ANTHROPIC_API_KEY")
        if self.api_key:
            self.client = anthropic.Anthropic(api_key=self.api_key)

        # Load tracked standards
        self.standards = self._load_standards()

    def _load_config(self) -> Dict[str, Any]:
        """Load bot configuration"""
        if self.config_path.exists():
            with open(self.config_path, 'r') as f:
                return yaml.safe_load(f)
        return {
            'check_interval_hours': 24,
            'pr_auto_create': True,
            'require_human_review': True
        }

    def _load_standards(self) -> Dict[str, RegulatoryStandard]:
        """Load tracked regulatory standards"""
        # Default standards to monitor
        default_standards = {
            'ncc_2022': RegulatoryStandard(
                standard_id='ncc_2022',
                name='National Construction Code 2022',
                type=StandardType.NCC,
                version='2022',
                effective_date=date(2022, 10, 1),
                source_url='https://ncc.abcb.gov.au/latest',
                monitoring_enabled=True
            ),
            'ghg_protocol_corporate': RegulatoryStandard(
                standard_id='ghg_protocol_corporate',
                name='GHG Protocol Corporate Standard',
                type=StandardType.GHG_PROTOCOL,
                version='Revised Edition',
                effective_date=date(2015, 1, 1),
                source_url='https://ghgprotocol.org/corporate-standard',
                monitoring_enabled=True
            ),
            'iso_14044': RegulatoryStandard(
                standard_id='iso_14044',
                name='ISO 14044:2006 LCA Requirements',
                type=StandardType.ISO,
                version='2006',
                effective_date=date(2006, 7, 1),
                source_url='https://www.iso.org/standard/38498.html',
                monitoring_enabled=True
            ),
            'en_15804': RegulatoryStandard(
                standard_id='en_15804',
                name='EN 15804:2012+A2:2019 EPD Core Rules',
                type=StandardType.EN_STANDARD,
                version='2019',
                effective_date=date(2019, 1, 1),
                source_url='https://www.en-standard.eu/bs-en-15804-2012-a2-2019/',
                monitoring_enabled=True
            )
        }

        return default_standards

    def check_for_updates(self) -> List[StandardChange]:
        """
        Check all monitored standards for updates

        Returns:
            List of detected changes
        """
        changes = []

        for standard_id, standard in self.standards.items():
            if not standard.monitoring_enabled:
                continue

            print(f"Checking {standard.name} for updates...")

            # Fetch current version
            current_content = self._fetch_standard_content(standard)

            if current_content is None:
                print(f"  ⚠️  Could not fetch content for {standard.name}")
                continue

            # Calculate content hash
            current_hash = self._calculate_hash(current_content)

            # Compare with stored hash
            if standard.content_hash and standard.content_hash != current_hash:
                print(f"  🔍 Change detected in {standard.name}")

                # Analyze changes
                detected_changes = self._analyze_changes(
                    standard,
                    standard.content_hash,
                    current_hash,
                    current_content
                )

                changes.extend(detected_changes)

            # Update hash and timestamp
            standard.content_hash = current_hash
            standard.last_checked = datetime.utcnow()

        return changes

    def _fetch_standard_content(self, standard: RegulatoryStandard) -> Optional[str]:
        """
        Fetch current content of standard

        Args:
            standard: Standard to fetch

        Returns:
            Standard content or None if unavailable
        """
        try:
            # For demonstration, we'd implement actual fetching here
            # This could involve:
            # - Web scraping
            # - API calls
            # - PDF parsing
            # - RSS feed monitoring

            if standard.type == StandardType.NCC:
                return self._fetch_ncc_content(standard.source_url)
            elif standard.type == StandardType.GHG_PROTOCOL:
                return self._fetch_ghg_protocol_content(standard.source_url)
            else:
                # Generic web fetch
                response = requests.get(standard.source_url, timeout=30)
                return response.text if response.ok else None

        except Exception as e:
            print(f"Error fetching {standard.name}: {e}")
            return None

    def _fetch_ncc_content(self, url: str) -> Optional[str]:
        """Fetch NCC content (specialized handler)"""
        # In production, this would parse NCC's specific format
        # For now, return placeholder
        return f"NCC Section J - Energy Efficiency (simulated content) - {datetime.now()}"

    def _fetch_ghg_protocol_content(self, url: str) -> Optional[str]:
        """Fetch GHG Protocol content"""
        # In production, monitor for updates to PDF or web version
        return f"GHG Protocol Corporate Standard (simulated content) - {datetime.now()}"

    def _calculate_hash(self, content: str) -> str:
        """Calculate SHA-256 hash of content"""
        return hashlib.sha256(content.encode('utf-8')).hexdigest()

    def _analyze_changes(
        self,
        standard: RegulatoryStandard,
        old_hash: str,
        new_hash: str,
        new_content: str
    ) -> List[StandardChange]:
        """
        Analyze changes between versions using LLM

        Args:
            standard: Standard that changed
            old_hash: Old content hash
            new_hash: New content hash
            new_content: New content

        Returns:
            List of structured changes
        """
        if not self.api_key:
            print("No API key - skipping LLM analysis")
            return []

        # Use LLM to analyze changes
        prompt = f"""You are analyzing changes to a building/sustainability regulatory standard.

Standard: {standard.name}
Type: {standard.type.value}
Previous Version Hash: {old_hash[:16]}...
New Version Hash: {new_hash[:16]}...

New content preview:
{new_content[:2000]}

Identify specific changes that would impact compliance rules:
1. Threshold changes (e.g., carbon limits)
2. New requirements
3. Clarifications or interpretations
4. Effective date changes

For each change, provide:
- Section/clause reference
- Type of change (amendment/new_section/clarification/threshold_change)
- Old requirement (if applicable)
- New requirement
- Impact level (critical/high/medium/low)
- Which compliance rules might be affected

Format as JSON array."""

        try:
            response = self.client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=2000,
                temperature=0.1,
                messages=[{"role": "user", "content": prompt}]
            )

            analysis_text = response.content[0].text

            # Parse JSON response
            # Extract JSON from markdown code blocks if present
            json_match = re.search(r'```json\s*([\s\S]*?)\s*```', analysis_text)
            if json_match:
                analysis_text = json_match.group(1)

            changes_data = json.loads(analysis_text)

            # Convert to StandardChange objects
            changes = []
            for change_data in changes_data:
                change = StandardChange(
                    standard_id=standard.standard_id,
                    change_date=datetime.utcnow(),
                    change_type=change_data.get('type', 'unknown'),
                    section=change_data.get('section', 'unknown'),
                    old_content=change_data.get('old_requirement', ''),
                    new_content=change_data.get('new_requirement', ''),
                    impact_level=change_data.get('impact_level', 'medium'),
                    affected_rules=change_data.get('affected_rules', [])
                )
                changes.append(change)

            return changes

        except Exception as e:
            print(f"Error analyzing changes: {e}")
            return []

    def generate_rule_patches(
        self,
        changes: List[StandardChange],
        rules_path: str
    ) -> List[RulePatch]:
        """
        Generate proposed patches to compliance rules

        Args:
            changes: Detected standard changes
            rules_path: Path to rules YAML file

        Returns:
            List of proposed rule patches
        """
        # Load current rules
        with open(rules_path, 'r') as f:
            rules_data = yaml.safe_load(f)

        patches = []

        for change in changes:
            # Identify affected rules
            for rule in rules_data:
                if not isinstance(rule, dict) or 'rule_id' not in rule:
                    continue

                rule_id = rule['rule_id']

                # Check if this rule is affected
                if rule_id in change.affected_rules or self._rule_references_standard(rule, change.standard_id):
                    # Generate patch
                    patch = self._create_patch_for_rule(rule, change)
                    if patch:
                        patches.append(patch)

        return patches

    def _rule_references_standard(self, rule: Dict, standard_id: str) -> bool:
        """Check if rule references a standard"""
        rule_str = json.dumps(rule).lower()
        standard_keywords = {
            'ncc_2022': ['ncc', 'national construction code', 'section j'],
            'ghg_protocol_corporate': ['ghg protocol', 'scope 1', 'scope 2', 'scope 3'],
            'iso_14044': ['iso 14044', 'lca', 'life cycle'],
            'en_15804': ['en 15804', 'epd', 'environmental product declaration']
        }

        keywords = standard_keywords.get(standard_id, [])
        return any(kw in rule_str for kw in keywords)

    def _create_patch_for_rule(
        self,
        rule: Dict,
        change: StandardChange
    ) -> Optional[RulePatch]:
        """Create a patch for a specific rule based on a change"""
        # This would use LLM to intelligently propose rule updates

        if not self.api_key:
            return None

        prompt = f"""You are updating a compliance rule based on a regulatory change.

Current Rule:
{yaml.dump(rule, default_flow_style=False)}

Regulatory Change:
- Section: {change.section}
- Type: {change.change_type}
- Old: {change.old_content}
- New: {change.new_content}
- Impact: {change.impact_level}

Propose a specific patch to update this rule. Consider:
- Threshold values in 'conditions'
- Severity levels
- Evidence requirements
- Remediation actions

Respond with JSON:
{{
  "field": "path.to.field",
  "old_value": "current value",
  "new_value": "proposed value",
  "justification": "reason for change"
}}
"""

        try:
            response = self.client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=1000,
                temperature=0.1,
                messages=[{"role": "user", "content": prompt}]
            )

            patch_text = response.content[0].text
            json_match = re.search(r'```json\s*([\s\S]*?)\s*```', patch_text)
            if json_match:
                patch_text = json_match.group(1)

            patch_data = json.loads(patch_text)

            return RulePatch(
                rule_id=rule['rule_id'],
                field=patch_data['field'],
                old_value=patch_data['old_value'],
                new_value=patch_data['new_value'],
                justification=patch_data['justification'],
                standard_reference=f"{change.standard_id}:{change.section}"
            )

        except Exception as e:
            print(f"Error creating patch: {e}")
            return None

    def create_pull_request(
        self,
        changes: List[StandardChange],
        patches: List[RulePatch],
        repo_path: str
    ) -> str:
        """
        Create GitHub pull request with proposed updates

        Args:
            changes: Detected standard changes
            patches: Proposed rule patches
            repo_path: Path to git repository

        Returns:
            PR markdown content
        """
        # Generate PR description
        pr_title = f"Update compliance rules for regulatory changes ({datetime.now().strftime('%Y-%m-%d')})"

        pr_body = f"""## Regulatory Changes Detected

This PR proposes updates to compliance rules based on detected changes in regulatory standards.

### Standards Updated

"""

        # Group changes by standard
        changes_by_standard: Dict[str, List[StandardChange]] = {}
        for change in changes:
            if change.standard_id not in changes_by_standard:
                changes_by_standard[change.standard_id] = []
            changes_by_standard[change.standard_id].append(change)

        for standard_id, std_changes in changes_by_standard.items():
            standard = self.standards[standard_id]
            pr_body += f"\n#### {standard.name}\n\n"

            for change in std_changes:
                pr_body += f"**{change.section}** - {change.change_type}\n"
                pr_body += f"- Impact: {change.impact_level.upper()}\n"
                pr_body += f"- Change: {change.new_content[:200]}...\n\n"

        pr_body += "\n### Proposed Rule Patches\n\n"

        for patch in patches:
            pr_body += f"#### Rule: `{patch.rule_id}`\n\n"
            pr_body += f"- Field: `{patch.field}`\n"
            pr_body += f"- Old Value: `{patch.old_value}`\n"
            pr_body += f"- New Value: `{patch.new_value}`\n"
            pr_body += f"- Justification: {patch.justification}\n"
            pr_body += f"- Reference: {patch.standard_reference}\n\n"

        pr_body += "\n### Review Checklist\n\n"
        pr_body += "- [ ] Verify standard changes are accurately reflected\n"
        pr_body += "- [ ] Check that rule patches maintain logic integrity\n"
        pr_body += "- [ ] Run test suite to ensure no regressions\n"
        pr_body += "- [ ] Update documentation if needed\n"
        pr_body += "- [ ] Verify effective dates\n\n"

        pr_body += f"\n---\n*Automated by Regulatory Diff Bot* | {datetime.now().strftime('%Y-%m-%d %H:%M UTC')}*\n"

        return pr_body

    def apply_patches(
        self,
        patches: List[RulePatch],
        rules_path: str,
        output_path: Optional[str] = None
    ) -> str:
        """
        Apply patches to rules file

        Args:
            patches: Rule patches to apply
            rules_path: Path to rules file
            output_path: Output path (if None, overwrites original)

        Returns:
            Path to updated rules file
        """
        with open(rules_path, 'r') as f:
            rules_data = yaml.safe_load(f)

        # Apply each patch
        for patch in patches:
            for rule in rules_data:
                if isinstance(rule, dict) and rule.get('rule_id') == patch.rule_id:
                    # Navigate to field and update
                    field_parts = patch.field.split('.')
                    target = rule
                    for part in field_parts[:-1]:
                        target = target.get(part, {})
                    target[field_parts[-1]] = patch.new_value

                    print(f"Applied patch to {patch.rule_id}.{patch.field}")

        # Write updated rules
        output_file = output_path or rules_path
        with open(output_file, 'w') as f:
            yaml.dump(rules_data, f, default_flow_style=False, sort_keys=False)

        return output_file


# ============================================================================
# CLI
# ============================================================================

def main():
    """CLI interface for regulatory diff bot"""
    import argparse

    parser = argparse.ArgumentParser(description="Regulatory Diff Bot")
    parser.add_argument('--config', default='regulatory_bot_config.yaml', help='Bot configuration file')
    parser.add_argument('--rules', default='compliance-automation/rules/compliance_rules.yaml', help='Rules file')
    parser.add_argument('--check', action='store_true', help='Check for updates')
    parser.add_argument('--generate-pr', action='store_true', help='Generate PR description')

    args = parser.parse_args()

    bot = RegulatoryDiffBot(args.config)

    if args.check:
        print("🔍 Checking for regulatory updates...")
        changes = bot.check_for_updates()

        if changes:
            print(f"\n✅ Found {len(changes)} changes")
            for change in changes:
                print(f"  - {change.standard_id}: {change.section} ({change.impact_level})")

            # Generate patches
            print("\n🔧 Generating rule patches...")
            patches = bot.generate_rule_patches(changes, args.rules)
            print(f"  Generated {len(patches)} patches")

            if args.generate_pr:
                print("\n📝 Generating PR description...")
                pr_body = bot.create_pull_request(changes, patches, ".")
                print("\n" + "=" * 80)
                print(pr_body)
                print("=" * 80)
        else:
            print("\n✅ No changes detected")


if __name__ == '__main__':
    main()
