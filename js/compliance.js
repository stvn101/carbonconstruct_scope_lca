/**
 * Australian Compliance Standards Checker
 * 
 * This module checks project compliance against:
 * - NCC (National Construction Code) 2022
 * - NABERS (National Australian Built Environment Rating System)
 * - GBCA Green Star
 * - TCFD (Task Force on Climate-related Financial Disclosures)
 * - NGER (National Greenhouse and Energy Reporting)
 */

class ComplianceChecker {
    constructor() {
        // NCC 2022 benchmarks for embodied carbon intensity (kg CO2-e/m² GFA)
        this.nccBenchmarks = {
            residential: {
                excellent: 300,
                good: 450,
                average: 600,
                minimum: 800
            },
            commercial: {
                excellent: 350,
                good: 500,
                average: 650,
                minimum: 850
            },
            industrial: {
                excellent: 400,
                good: 550,
                average: 700,
                minimum: 900
            },
            infrastructure: {
                excellent: 250,
                good: 400,
                average: 550,
                minimum: 750
            }
        };

        // NABERS rating thresholds (based on carbon intensity)
        this.nabersThresholds = {
            6: 250,  // 6 stars = excellent
            5.5: 300,
            5: 350,
            4.5: 400,
            4: 500,
            3.5: 600,
            3: 700,
            2.5: 800,
            2: 900,
            1.5: 1000,
            1: 1200,
            0: Infinity
        };

        // GBCA Green Star points calculation
        this.greenStarCategories = {
            materials: {
                maxPoints: 12,
                criteria: {
                    embodiedCarbon: 4,
                    responsibleSourcing: 3,
                    materialReuse: 2,
                    recycledContent: 3
                }
            }
        };
    }

    /**
     * Check NCC 2022 Compliance
     * Section J - Energy Efficiency
     * JV3 - Greenhouse and Energy Minimum Standards
     */
    checkNCC(carbonIntensity, projectType, gfa) {
        const benchmarks = this.nccBenchmarks[projectType] || this.nccBenchmarks.commercial;
        
        let status = 'non-compliant';
        let level = 'Poor';
        
        if (carbonIntensity <= benchmarks.excellent) {
            status = 'excellent';
            level = 'Excellent - Exceeds Standards';
        } else if (carbonIntensity <= benchmarks.good) {
            status = 'good';
            level = 'Good - Above Average';
        } else if (carbonIntensity <= benchmarks.average) {
            status = 'compliant';
            level = 'Compliant - Industry Average';
        } else if (carbonIntensity <= benchmarks.minimum) {
            status = 'minimum';
            level = 'Minimum Compliance';
        } else {
            status = 'non-compliant';
            level = 'Non-Compliant - Review Required';
        }

        // Calculate embodied energy (approximation: 1 kg CO2-e ≈ 12 MJ)
        const embodiedEnergy = carbonIntensity * 12;
        
        return {
            standard: 'NCC 2022',
            status: status,
            level: level,
            compliant: status !== 'non-compliant',
            metrics: {
                carbonIntensity: carbonIntensity.toFixed(1),
                embodiedEnergy: embodiedEnergy.toFixed(1),
                benchmark: benchmarks.average,
                percentageDifference: ((carbonIntensity - benchmarks.average) / benchmarks.average * 100).toFixed(1)
            },
            requirements: [
                'Section J - Energy Efficiency Requirements',
                'JV3 - Greenhouse and Energy Minimum Standards',
                'DTS Provisions or Performance Solution'
            ],
            recommendations: this.getNccRecommendations(carbonIntensity, benchmarks)
        };
    }

    /**
     * Calculate NABERS Rating
     * NABERS Energy + Carbon Neutral ratings
     */
    calculateNABERS(carbonIntensity, operationalCarbon = null, scope = 'Embodied') {
        // Find rating based on embodied carbon intensity
        let rating = 0;
        for (const [stars, threshold] of Object.entries(this.nabersThresholds).reverse()) {
            if (carbonIntensity <= threshold) {
                rating = parseFloat(stars);
                break;
            }
        }

        // Get certification level
        let certification = 'Not Rated';
        if (rating >= 5) certification = 'Excellent - Carbon Neutral Potential';
        else if (rating >= 4) certification = 'Good - Above Average Performance';
        else if (rating >= 3) certification = 'Average - Industry Standard';
        else if (rating >= 2) certification = 'Below Average - Improvement Needed';
        else certification = 'Poor - Significant Improvement Required';

        return {
            standard: 'NABERS',
            rating: rating,
            stars: rating,
            certification: certification,
            metrics: {
                carbonIntensity: carbonIntensity.toFixed(1),
                targetRating: 5.0,
                benchmarkForTarget: this.nabersThresholds[5],
                improvementNeeded: carbonIntensity > this.nabersThresholds[5] ?
                    (carbonIntensity - this.nabersThresholds[5]).toFixed(1) : 0,
                reportingScope: scope
            },
            requirements: [
                'Whole Building Assessment',
                'Energy Rating Certification',
                'Carbon Neutral Pathway (optional)'
            ],
            recommendations: this.getNabersRecommendations(rating, carbonIntensity)
        };
    }

    /**
     * Calculate GBCA Green Star Rating
     * Focus on Materials category
     */
    calculateGreenStar(carbonIntensity, materialData) {
        const maxPoints = 100;
        let earnedPoints = 0;

        // Materials Category (up to 12 points)
        const materialsCategory = this.greenStarCategories.materials;
        
        // Embodied carbon points (4 points available)
        // Based on reduction vs. benchmark
        const benchmarkCarbon = 650; // kg CO2-e/m²
        const reduction = ((benchmarkCarbon - carbonIntensity) / benchmarkCarbon) * 100;
        
        let embodiedCarbonPoints = 0;
        if (reduction >= 30) embodiedCarbonPoints = 4;
        else if (reduction >= 20) embodiedCarbonPoints = 3;
        else if (reduction >= 10) embodiedCarbonPoints = 2;
        else if (reduction >= 5) embodiedCarbonPoints = 1;
        
        earnedPoints += embodiedCarbonPoints;

        // Calculate recycled content percentage
        let recycledContent = this.estimateRecycledContent(materialData);
        let recycledPoints = 0;
        if (recycledContent >= 30) recycledPoints = 3;
        else if (recycledContent >= 20) recycledPoints = 2;
        else if (recycledContent >= 10) recycledPoints = 1;
        
        earnedPoints += recycledPoints;

        // Estimate other categories (simplified)
        earnedPoints += 25; // Management
        earnedPoints += 15; // IEQ (Indoor Environment Quality)
        earnedPoints += 12; // Energy
        earnedPoints += 8;  // Water
        earnedPoints += 6;  // Transport
        earnedPoints += 5;  // Land Use
        earnedPoints += 4;  // Emissions
        earnedPoints += 3;  // Innovation

        // Calculate star rating
        let stars = 0;
        if (earnedPoints >= 75) stars = 6; // World Leadership
        else if (earnedPoints >= 60) stars = 5; // Australian Excellence
        else if (earnedPoints >= 45) stars = 4; // Best Practice
        else if (earnedPoints >= 30) stars = 3; // Good Practice
        else if (earnedPoints >= 15) stars = 2; // Average Practice
        else if (earnedPoints >= 10) stars = 1; // Minimum Practice

        let certification = 'Not Certified';
        if (stars === 6) certification = 'World Leadership';
        else if (stars === 5) certification = 'Australian Excellence';
        else if (stars === 4) certification = 'Best Practice';
        else if (stars === 3) certification = 'Good Practice';
        else certification = 'Below Standards';

        return {
            standard: 'GBCA Green Star',
            rating: stars,
            stars: stars,
            points: earnedPoints,
            maxPoints: maxPoints,
            certification: certification,
            breakdown: {
                materials: embodiedCarbonPoints + recycledPoints,
                embodiedCarbon: embodiedCarbonPoints,
                recycledContent: recycledPoints,
                materialsMax: materialsCategory.maxPoints
            },
            metrics: {
                carbonReduction: reduction.toFixed(1),
                recycledContent: recycledContent.toFixed(1),
                pointsNeededFor4Star: Math.max(0, 45 - earnedPoints),
                pointsNeededFor5Star: Math.max(0, 60 - earnedPoints)
            },
            requirements: [
                'Life Cycle Assessment',
                'Material Selection Methodology',
                'Responsible Materials Sourcing',
                'Waste Management Plan'
            ],
            recommendations: this.getGreenStarRecommendations(stars, earnedPoints)
        };
    }

    /**
     * Check TCFD Compliance
     * Climate-related Financial Disclosures (required from Jan 2025)
     */
    checkTCFD(totalEmissions, companySize = 'large') {
        const thresholds = {
            large: 50000,    // tonnes CO2-e/year (mandatory reporting)
            medium: 25000,   // tonnes CO2-e/year (encouraged)
            small: 10000     // tonnes CO2-e/year (voluntary)
        };

        const threshold = thresholds[companySize] || thresholds.large;
        const reportingRequired = totalEmissions / 1000 >= threshold; // Convert kg to tonnes

        return {
            standard: 'TCFD',
            reportingRequired: reportingRequired,
            threshold: threshold,
            currentEmissions: (totalEmissions / 1000).toFixed(2),
            requirements: [
                'Governance: Board oversight of climate risks',
                'Strategy: Climate-related risks and opportunities',
                'Risk Management: Identify and manage climate risks',
                'Metrics & Targets: Track and report emissions'
            ],
            disclosures: [
                'Scope 1, 2, 3 GHG Emissions',
                'Climate-related Financial Impacts',
                'Scenario Analysis',
                'Transition Plans'
            ]
        };
    }

    /**
     * Helper: Get NCC recommendations
     */
    getNccRecommendations(carbonIntensity, benchmarks) {
        const recommendations = [];
        
        if (carbonIntensity > benchmarks.average) {
            recommendations.push('Consider lower-carbon concrete alternatives (e.g., geopolymer)');
            recommendations.push('Increase use of recycled steel');
            recommendations.push('Maximize timber content where structurally feasible');
        }
        
        if (carbonIntensity > benchmarks.good) {
            recommendations.push('Review structural design for material efficiency');
            recommendations.push('Consider off-site prefabrication to reduce waste');
        }
        
        if (carbonIntensity <= benchmarks.excellent) {
            recommendations.push('Excellent performance! Document for case studies');
            recommendations.push('Consider EPD certification for key materials');
        }
        
        return recommendations;
    }

    /**
     * Helper: Get NABERS recommendations
     */
    getNabersRecommendations(rating, carbonIntensity) {
        const recommendations = [];
        
        if (rating < 4) {
            recommendations.push('Target 5 stars or higher for competitive advantage');
            recommendations.push('Focus on high-carbon materials (concrete, steel)');
            recommendations.push('Implement comprehensive waste management');
        }
        
        if (rating >= 5) {
            recommendations.push('Excellent! Consider Carbon Neutral certification');
            recommendations.push('Document methodology for future projects');
        }
        
        return recommendations;
    }

    /**
     * Helper: Get Green Star recommendations
     */
    getGreenStarRecommendations(stars, points) {
        const recommendations = [];
        
        if (stars < 4) {
            recommendations.push('Aim for 4 stars minimum for "Best Practice"');
            recommendations.push('Focus on materials with EPDs');
            recommendations.push('Increase recycled content in specifications');
        }
        
        if (stars >= 4 && stars < 5) {
            recommendations.push('Push for 5 stars to achieve "Australian Excellence"');
            recommendations.push('Need ' + (60 - points) + ' more points');
        }
        
        if (stars >= 5) {
            recommendations.push('Outstanding! Market this achievement');
            recommendations.push('Consider 6 star "World Leadership" target');
        }
        
        return recommendations;
    }

    /**
     * Helper: Estimate recycled content percentage
     */
    estimateRecycledContent(materialData) {
        if (!materialData || !materialData.length) return 0;
        
        let totalWeight = 0;
        let recycledWeight = 0;
        
        materialData.forEach(material => {
            const weight = material.quantity; // Simplified
            totalWeight += weight;
            
            // Estimate recycled content by material type
            if (material.category === 'steel' && material.type.includes('recycled')) {
                recycledWeight += weight;
            } else if (material.category === 'concrete' && material.type.includes('recycled')) {
                recycledWeight += weight * 0.3; // 30% recycled aggregate
            }
        });
        
        return totalWeight > 0 ? (recycledWeight / totalWeight * 100) : 0;
    }

    /**
     * Generate comprehensive compliance report
     */
    generateComplianceReport(projectData) {
        const scope = projectData.carbonScope === 'wholeLife' ? 'Whole Life' : 'Embodied';
        const reportingTotal = scope === 'Whole Life'
            ? (projectData.wholeLifeCarbon ?? projectData.totalCarbon)
            : (projectData.embodiedCarbon ?? projectData.totalCarbon);
        const carbonIntensity = projectData.gfa > 0 ? (reportingTotal / projectData.gfa) : 0;

        // EN 15978 requires clarity on scope selection when benchmarking
        const ncc = this.checkNCC(carbonIntensity, projectData.projectType, projectData.gfa);
        const nabers = this.calculateNABERS(carbonIntensity, projectData.operationalCarbon, scope);
        const greenStar = this.calculateGreenStar(carbonIntensity, projectData.materials);
        const tcfd = this.checkTCFD(reportingTotal, projectData.companySize);

        return {
            summary: {
                carbonIntensity: carbonIntensity.toFixed(1),
                totalCarbon: reportingTotal.toFixed(0),
                gfa: projectData.gfa,
                scope: scope,
                overallCompliance: ncc.compliant ? 'Compliant' : 'Non-Compliant'
            },
            standards: {
                ncc,
                nabers,
                greenStar,
                tcfd
            },
            benchmarking: {
                industryAverage: 650,
                bestPractice: 350,
                yourProject: carbonIntensity,
                percentile: this.calculatePercentile(carbonIntensity)
            }
        };
    }

    /**
     * Calculate industry percentile
     */
    calculatePercentile(carbonIntensity) {
        // Simplified percentile calculation
        // Lower is better!
        if (carbonIntensity <= 300) return '90th (Top 10%)';
        if (carbonIntensity <= 400) return '75th (Top 25%)';
        if (carbonIntensity <= 500) return '50th (Median)';
        if (carbonIntensity <= 650) return '25th (Below Average)';
        return '10th (Bottom 10%)';
    }
}

// Create global instance
const complianceChecker = new ComplianceChecker();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ComplianceChecker, complianceChecker };
}
