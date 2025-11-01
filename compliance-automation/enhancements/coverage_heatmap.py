"""
Coverage Heatmap

Generates a visual heatmap showing which carbon claims have primary evidence
vs. secondary data or estimates. Helps drive targeted data collection efforts.

Heatmap dimensions:
- X-axis: Project packages/phases (foundations, structure, envelope, MEP, etc.)
- Y-axis: Data quality level (primary, secondary, estimate)
- Color: Percentage coverage
- Hover: Specific materials lacking evidence
"""

from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, field
from enum import Enum
from decimal import Decimal
import json
from pathlib import Path

from ..schemas.canonical_schema import (
    ComplianceProject,
    EPDDocument,
    ERPInvoice,
    IFCElement,
    MaterialCategory,
    EPDType
)


class DataQuality(Enum):
    """Data quality levels"""
    PRIMARY = "primary"  # Invoice + product-specific EPD
    SECONDARY = "secondary"  # Industry-average EPD or manufacturer data
    ESTIMATE = "estimate"  # Generic factors or assumptions
    MISSING = "missing"  # No data


class ProjectPackage(Enum):
    """Construction project packages"""
    FOUNDATIONS = "foundations"
    STRUCTURE = "structure"
    ENVELOPE = "envelope"
    FINISHES = "finishes"
    MEP = "mep"  # Mechanical, Electrical, Plumbing
    SITE_WORKS = "site_works"
    OTHER = "other"


@dataclass
class CoverageCell:
    """Single cell in coverage heatmap"""
    package: ProjectPackage
    data_quality: DataQuality
    mass_kg: Decimal = Decimal(0)
    carbon_kg: Decimal = Decimal(0)
    material_count: int = 0
    materials: List[str] = field(default_factory=list)


@dataclass
class CoverageGap:
    """Identified gap in data coverage"""
    package: ProjectPackage
    material_name: str
    material_category: MaterialCategory
    quantity: Decimal
    unit: str
    current_quality: DataQuality
    target_quality: DataQuality
    priority: str  # "high", "medium", "low"
    recommended_action: str
    estimated_carbon_kg: Optional[Decimal] = None


class CoverageHeatmap:
    """
    Generate coverage heatmap for data quality analysis
    """

    def __init__(self, project: ComplianceProject):
        """
        Initialize coverage heatmap

        Args:
            project: Project to analyze
        """
        self.project = project

        # Initialize heatmap grid
        self.grid: Dict[Tuple[ProjectPackage, DataQuality], CoverageCell] = {}
        for pkg in ProjectPackage:
            for quality in DataQuality:
                self.grid[(pkg, quality)] = CoverageCell(
                    package=pkg,
                    data_quality=quality
                )

    def analyze_coverage(self) -> Dict[str, Any]:
        """
        Analyze data coverage across project

        Returns:
            Coverage analysis results
        """
        # Analyze BIM elements
        for bim_model in self.project.bim_models:
            for element in bim_model.elements:
                self._classify_element(element)

        # Analyze invoices
        for invoice in self.project.invoices:
            for line_item in invoice.line_items:
                self._classify_invoice_item(invoice, line_item)

        # Calculate statistics
        total_mass = sum(cell.mass_kg for cell in self.grid.values())
        total_carbon = sum(cell.carbon_kg for cell in self.grid.values())

        # Calculate coverage by quality
        quality_breakdown = {}
        for quality in DataQuality:
            quality_mass = sum(
                cell.mass_kg for (pkg, q), cell in self.grid.items() if q == quality
            )
            quality_carbon = sum(
                cell.carbon_kg for (pkg, q), cell in self.grid.items() if q == quality
            )

            quality_breakdown[quality.value] = {
                'mass_kg': float(quality_mass),
                'mass_pct': float((quality_mass / total_mass * 100) if total_mass > 0 else 0),
                'carbon_kg': float(quality_carbon),
                'carbon_pct': float((quality_carbon / total_carbon * 100) if total_carbon > 0 else 0)
            }

        # Calculate coverage by package
        package_breakdown = {}
        for package in ProjectPackage:
            package_mass = sum(
                cell.mass_kg for (pkg, q), cell in self.grid.items() if pkg == package
            )
            package_carbon = sum(
                cell.carbon_kg for (pkg, q), cell in self.grid.items() if pkg == package
            )

            # Calculate quality distribution for this package
            quality_dist = {}
            for quality in DataQuality:
                cell = self.grid[(package, quality)]
                quality_dist[quality.value] = {
                    'mass_kg': float(cell.mass_kg),
                    'mass_pct': float((cell.mass_kg / package_mass * 100) if package_mass > 0 else 0),
                    'material_count': cell.material_count,
                    'materials': cell.materials[:5]  # Top 5 materials
                }

            package_breakdown[package.value] = {
                'total_mass_kg': float(package_mass),
                'total_carbon_kg': float(package_carbon),
                'quality_distribution': quality_dist
            }

        return {
            'project_name': self.project.project_name,
            'total_mass_kg': float(total_mass),
            'total_carbon_kg': float(total_carbon),
            'quality_breakdown': quality_breakdown,
            'package_breakdown': package_breakdown,
            'grid': self._export_grid()
        }

    def identify_gaps(self, min_primary_pct: float = 80.0) -> List[CoverageGap]:
        """
        Identify data quality gaps requiring attention

        Args:
            min_primary_pct: Minimum primary data coverage target (default 80%)

        Returns:
            List of prioritized coverage gaps
        """
        gaps = []

        # Calculate current primary coverage
        total_mass = sum(cell.mass_kg for cell in self.grid.values())
        primary_mass = sum(
            cell.mass_kg for (pkg, q), cell in self.grid.items()
            if q == DataQuality.PRIMARY
        )
        current_primary_pct = (primary_mass / total_mass * 100) if total_mass > 0 else 0

        # If already meeting target, return early
        if current_primary_pct >= min_primary_pct:
            return gaps

        # Identify materials needing better data
        for (package, quality), cell in self.grid.items():
            # Skip primary data (already good)
            if quality == DataQuality.PRIMARY:
                continue

            # Focus on significant contributors
            if cell.mass_kg < (total_mass * Decimal("0.01")):  # < 1% of total
                continue

            for material_name in cell.materials:
                # Determine priority based on mass and carbon
                if cell.carbon_kg > (sum(c.carbon_kg for c in self.grid.values()) * Decimal("0.1")):
                    priority = "high"  # >10% of carbon
                elif cell.carbon_kg > (sum(c.carbon_kg for c in self.grid.values()) * Decimal("0.05")):
                    priority = "medium"  # 5-10% of carbon
                else:
                    priority = "low"

                # Determine recommended action
                if quality == DataQuality.MISSING:
                    action = "Obtain invoice and product-specific EPD from supplier"
                    target = DataQuality.PRIMARY
                elif quality == DataQuality.ESTIMATE:
                    action = "Request manufacturer EPD or industry-average data"
                    target = DataQuality.SECONDARY
                elif quality == DataQuality.SECONDARY:
                    action = "Request product-specific EPD to upgrade to primary data"
                    target = DataQuality.PRIMARY
                else:
                    continue

                gap = CoverageGap(
                    package=package,
                    material_name=material_name,
                    material_category=self._categorize_material(material_name),
                    quantity=cell.mass_kg / Decimal(len(cell.materials) or 1),  # Rough estimate
                    unit="kg",
                    current_quality=quality,
                    target_quality=target,
                    priority=priority,
                    recommended_action=action,
                    estimated_carbon_kg=cell.carbon_kg / Decimal(len(cell.materials) or 1)
                )

                gaps.append(gap)

        # Sort by priority and carbon impact
        priority_order = {"high": 0, "medium": 1, "low": 2}
        gaps.sort(key=lambda g: (
            priority_order[g.priority],
            -(g.estimated_carbon_kg or Decimal(0))
        ))

        return gaps

    def generate_action_plan(self, gaps: List[CoverageGap]) -> str:
        """
        Generate prioritized action plan for data collection

        Args:
            gaps: Coverage gaps to address

        Returns:
            Formatted action plan
        """
        plan = f"""# Data Coverage Improvement Plan - {self.project.project_name}

## Executive Summary

Current Status:
- {len(gaps)} data quality gaps identified
- {sum(1 for g in gaps if g.priority == 'high')} high-priority items
- {sum(1 for g in gaps if g.priority == 'medium')} medium-priority items

Target: Achieve 80%+ primary data coverage

## Priority Actions

"""

        # Group by priority
        high_priority = [g for g in gaps if g.priority == "high"]
        medium_priority = [g for g in gaps if g.priority == "medium"]
        low_priority = [g for g in gaps if g.priority == "low"]

        if high_priority:
            plan += "### 🔴 High Priority (Immediate Action Required)\n\n"
            for i, gap in enumerate(high_priority[:10], 1):  # Top 10
                plan += f"{i}. **{gap.material_name}** ({gap.package.value})\n"
                plan += f"   - Current: {gap.current_quality.value}\n"
                plan += f"   - Target: {gap.target_quality.value}\n"
                plan += f"   - Carbon Impact: ~{float(gap.estimated_carbon_kg or 0):.0f} kg CO2-e\n"
                plan += f"   - Action: {gap.recommended_action}\n\n"

        if medium_priority:
            plan += "\n### 🟡 Medium Priority (Address within 2 weeks)\n\n"
            for i, gap in enumerate(medium_priority[:10], 1):
                plan += f"{i}. **{gap.material_name}** ({gap.package.value})\n"
                plan += f"   - Action: {gap.recommended_action}\n\n"

        if low_priority:
            plan += "\n### 🟢 Low Priority (Nice to have)\n\n"
            plan += f"- {len(low_priority)} additional items with lower carbon impact\n"
            plan += "- Review after addressing high and medium priorities\n\n"

        plan += "\n## Data Collection Resources\n\n"
        plan += "- EPD Australasia: https://epd-australasia.com/search\n"
        plan += "- Building Transparency (EC3): https://buildingtransparency.org\n"
        plan += "- International EPD System: https://www.environdec.com\n"
        plan += "- Contact suppliers directly for product-specific EPDs\n"

        return plan

    def generate_heatmap_html(self, analysis: Dict[str, Any]) -> str:
        """
        Generate HTML visualization of coverage heatmap

        Args:
            analysis: Coverage analysis results

        Returns:
            HTML string with heatmap visualization
        """
        html = """<!DOCTYPE html>
<html>
<head>
    <title>Coverage Heatmap - {project_name}</title>
    <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
    <style>
        body {{ font-family: Arial, sans-serif; padding: 20px; }}
        h1 {{ color: #333; }}
        .summary {{ background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; }}
        .metric {{ display: inline-block; margin-right: 30px; }}
        .metric-value {{ font-size: 24px; font-weight: bold; color: #007bff; }}
        .metric-label {{ font-size: 14px; color: #666; }}
    </style>
</head>
<body>
    <h1>📊 Data Coverage Heatmap</h1>
    <h2>{project_name}</h2>

    <div class="summary">
        <div class="metric">
            <div class="metric-value">{primary_pct:.1f}%</div>
            <div class="metric-label">Primary Data</div>
        </div>
        <div class="metric">
            <div class="metric-value">{secondary_pct:.1f}%</div>
            <div class="metric-label">Secondary Data</div>
        </div>
        <div class="metric">
            <div class="metric-value">{estimate_pct:.1f}%</div>
            <div class="metric-label">Estimates</div>
        </div>
    </div>

    <div id="heatmap"></div>

    <script>
        var data = [{
            z: {z_values},
            x: {x_labels},
            y: {y_labels},
            type: 'heatmap',
            colorscale: [
                [0, '#d73027'],      // Red for low coverage
                [0.5, '#fee08b'],    // Yellow for medium
                [1, '#1a9850']       // Green for high coverage
            ],
            hovertemplate: '%{{y}} - %{{x}}<br>Coverage: %{{z:.1f}}%<extra></extra>'
        }]];

        var layout = {{
            title: 'Data Quality Coverage by Project Package',
            xaxis: {{ title: 'Project Package' }},
            yaxis: {{ title: 'Data Quality Level' }},
            height: 500
        }};

        Plotly.newPlot('heatmap', data, layout);
    </script>
</body>
</html>
""".format(
            project_name=analysis['project_name'],
            primary_pct=analysis['quality_breakdown'].get('primary', {}).get('mass_pct', 0),
            secondary_pct=analysis['quality_breakdown'].get('secondary', {}).get('mass_pct', 0),
            estimate_pct=analysis['quality_breakdown'].get('estimate', {}).get('mass_pct', 0),
            z_values=self._prepare_heatmap_data(analysis),
            x_labels=json.dumps([p.value for p in ProjectPackage]),
            y_labels=json.dumps([q.value for q in DataQuality])
        )

        return html

    # ========================================================================
    # HELPER METHODS
    # ========================================================================

    def _classify_element(self, element: IFCElement):
        """Classify a BIM element's data quality"""
        package = self._categorize_to_package(element.material_category)

        # Determine data quality
        # For now, simplified logic - would be more sophisticated in production
        if element.evidence:
            quality = DataQuality.PRIMARY
        else:
            quality = DataQuality.SECONDARY

        # Find matching EPD
        epd = next((e for e in self.project.epds if element.material_name.lower() in e.product_name.lower()), None)

        if epd:
            if epd.epd_type == EPDType.PRODUCT_SPECIFIC and epd.is_verified:
                quality = DataQuality.PRIMARY
            elif epd.epd_type == EPDType.INDUSTRY_AVERAGE:
                quality = DataQuality.SECONDARY
            else:
                quality = DataQuality.ESTIMATE
        elif not element.evidence:
            quality = DataQuality.MISSING

        # Estimate mass (simplified)
        mass_kg = element.quantity  # Would use density lookup in production

        # Estimate carbon
        carbon_kg = mass_kg * Decimal("2.5")  # Placeholder

        # Add to grid
        cell = self.grid[(package, quality)]
        cell.mass_kg += mass_kg
        cell.carbon_kg += carbon_kg
        cell.material_count += 1
        if element.material_name not in cell.materials:
            cell.materials.append(element.material_name)

    def _classify_invoice_item(self, invoice, line_item):
        """Classify an invoice line item's data quality"""
        material_category = line_item.material_category or MaterialCategory.OTHER
        package = self._categorize_to_package(material_category)

        # Check for EPD linkage
        if line_item.epd_id:
            epd = next((e for e in self.project.epds if e.id == line_item.epd_id), None)
            if epd and epd.epd_type == EPDType.PRODUCT_SPECIFIC:
                quality = DataQuality.PRIMARY
            else:
                quality = DataQuality.SECONDARY
        else:
            quality = DataQuality.ESTIMATE

        # Use line item data
        mass_kg = line_item.quantity  # Would convert units in production
        carbon_kg = mass_kg * Decimal("2.5")  # Placeholder

        cell = self.grid[(package, quality)]
        cell.mass_kg += mass_kg
        cell.carbon_kg += carbon_kg
        cell.material_count += 1
        if line_item.product_name not in cell.materials:
            cell.materials.append(line_item.product_name)

    def _categorize_to_package(self, category: MaterialCategory) -> ProjectPackage:
        """Map material category to project package"""
        mapping = {
            MaterialCategory.CONCRETE: ProjectPackage.STRUCTURE,
            MaterialCategory.STEEL: ProjectPackage.STRUCTURE,
            MaterialCategory.TIMBER: ProjectPackage.STRUCTURE,
            MaterialCategory.ALUMINUM: ProjectPackage.ENVELOPE,
            MaterialCategory.GLASS: ProjectPackage.ENVELOPE,
            MaterialCategory.INSULATION: ProjectPackage.ENVELOPE,
            MaterialCategory.MASONRY: ProjectPackage.ENVELOPE,
            MaterialCategory.FINISHES: ProjectPackage.FINISHES,
            MaterialCategory.MEP: ProjectPackage.MEP,
            MaterialCategory.OTHER: ProjectPackage.OTHER
        }
        return mapping.get(category, ProjectPackage.OTHER)

    def _categorize_material(self, material_name: str) -> MaterialCategory:
        """Categorize material by name"""
        name_lower = material_name.lower()
        if 'concrete' in name_lower or 'cement' in name_lower:
            return MaterialCategory.CONCRETE
        elif 'steel' in name_lower:
            return MaterialCategory.STEEL
        elif 'timber' in name_lower or 'wood' in name_lower:
            return MaterialCategory.TIMBER
        elif 'aluminum' in name_lower or 'aluminium' in name_lower:
            return MaterialCategory.ALUMINUM
        elif 'glass' in name_lower:
            return MaterialCategory.GLASS
        elif 'insulation' in name_lower:
            return MaterialCategory.INSULATION
        else:
            return MaterialCategory.OTHER

    def _export_grid(self) -> List[Dict[str, Any]]:
        """Export grid as list of dicts"""
        return [
            {
                'package': pkg.value,
                'data_quality': quality.value,
                'mass_kg': float(cell.mass_kg),
                'carbon_kg': float(cell.carbon_kg),
                'material_count': cell.material_count,
                'materials': cell.materials
            }
            for (pkg, quality), cell in self.grid.items()
        ]

    def _prepare_heatmap_data(self, analysis: Dict[str, Any]) -> str:
        """Prepare data for Plotly heatmap"""
        # Create 2D array: rows = data quality, cols = packages
        z_values = []

        for quality in DataQuality:
            row = []
            for package in ProjectPackage:
                # Get mass percentage for this cell
                pkg_data = analysis['package_breakdown'].get(package.value, {})
                quality_dist = pkg_data.get('quality_distribution', {})
                mass_pct = quality_dist.get(quality.value, {}).get('mass_pct', 0)
                row.append(mass_pct)
            z_values.append(row)

        return json.dumps(z_values)


# ============================================================================
# CLI
# ============================================================================

def main():
    """CLI interface for coverage heatmap"""
    import argparse

    parser = argparse.ArgumentParser(description="Coverage Heatmap Generator")
    parser.add_argument('project_json', help='Project JSON file')
    parser.add_argument('--output', default='coverage_heatmap.html', help='Output HTML file')
    parser.add_argument('--gaps', action='store_true', help='Generate gaps report')
    parser.add_argument('--action-plan', default='action_plan.md', help='Action plan output')

    args = parser.parse_args()

    # Load project
    with open(args.project_json, 'r') as f:
        from ..schemas.canonical_schema import ComplianceProject
        project_data = json.load(f)
        project = ComplianceProject(**project_data)

    # Generate heatmap
    heatmap = CoverageHeatmap(project)
    analysis = heatmap.analyze_coverage()

    # Generate HTML
    html = heatmap.generate_heatmap_html(analysis)
    with open(args.output, 'w') as f:
        f.write(html)
    print(f"✅ Generated heatmap: {args.output}")

    # Generate gaps report
    if args.gaps:
        gaps = heatmap.identify_gaps(min_primary_pct=80.0)
        print(f"\n📊 Identified {len(gaps)} coverage gaps")

        action_plan = heatmap.generate_action_plan(gaps)
        with open(args.action_plan, 'w') as f:
            f.write(action_plan)
        print(f"✅ Generated action plan: {args.action_plan}")

    # Print summary
    print("\n📈 Coverage Summary:")
    for quality, data in analysis['quality_breakdown'].items():
        print(f"  {quality:12s}: {data['mass_pct']:5.1f}% of mass ({data['mass_kg']:,.0f} kg)")


if __name__ == '__main__':
    main()
