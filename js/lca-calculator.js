/**
 * Life Cycle Assessment (LCA) Calculator
 * 
 * This module calculates embodied carbon across all life cycle stages following:
 * - ISO 14040/14044 (LCA Standards)
 * - EN 15978 (Assessment of environmental performance of buildings)
 * - AS 5334 (Climate change adaptation for settlements and infrastructure)
 * 
 * LCA STAGES EXPLAINED (Like the lifecycle of a building):
 * 
 * PRODUCT STAGE (A1-A3): Raw materials → Factory gate
 *   A1: Raw material extraction (mining, quarrying, harvesting)
 *   A2: Transport of raw materials to factory
 *   A3: Manufacturing the product
 * 
 * CONSTRUCTION STAGE (A4-A5): Factory → Building site
 *   A4: Transport to construction site
 *   A5: Construction/installation process
 * 
 * USE STAGE (B1-B7): Building in operation
 *   B1: Use (no emissions from product itself)
 *   B2: Maintenance
 *   B3: Repair
 *   B4: Replacement
 *   B5: Refurbishment
 *   B6: Operational energy use (heating, cooling, lighting)
 *   B7: Operational water use
 * 
 * END OF LIFE STAGE (C1-C4): Demolition → Disposal
 *   C1: Deconstruction/demolition
 *   C2: Transport to waste processing
 *   C3: Waste processing
 *   C4: Disposal (landfill, incineration)
 * 
 * BEYOND LIFE CYCLE (D): Benefits beyond system boundary
 *   D: Reuse, recovery, recycling potential
 */

class LCACalculator {
    constructor() {
        // Default transport distances (km) for Australian context
        this.transportDistance = {
            localMaterials: 50,      // Local quarries, timber mills
            regionalMaterials: 250,   // Within state
            nationalMaterials: 1000,  // Interstate
            imported: 15000          // Overseas (average)
        };
        
        // Transport emissions factors (kg CO2-e per tonne-km)
        this.transportEmissions = {
            truck: 0.097,    // Road freight (common for construction)
            rail: 0.022,     // More efficient for long distances
            ship: 0.008      // International shipping
        };
        
        // Construction process emissions (kg CO2-e per m² GFA)
        this.constructionProcess = {
            excavation: 5,           // Earthworks
            formwork: 3,             // Temporary structures
            cranage: 4,              // Tower crane operation
            siteEstablishment: 2,    // Site offices, fencing
            wastage: 1.5            // Material waste (typically 5-10%)
        };
        
        // End of life factors (% of product stage emissions)
        this.endOfLifeFactors = {
            concrete: 0.05,      // Low - mostly inert, can be crushed
            steel: 0.08,         // Moderate - valuable for recycling
            timber: 0.03,        // Low - biodegradable or combustible
            masonry: 0.04,       // Low - can be crushed
            insulation: 0.10,    // Higher - synthetic materials
            glazing: 0.12,       // Higher - glass processing
            finishes: 0.08       // Moderate - varies by material
        };
        
        // Maintenance & replacement schedules (years)
        this.maintenanceCycles = {
            concrete: { maintenance: 10, replacement: 100 },
            steel: { maintenance: 15, replacement: 100 },
            timber: { maintenance: 5, replacement: 30 },
            masonry: { maintenance: 15, replacement: 100 },
            insulation: { maintenance: 20, replacement: 50 },
            glazing: { maintenance: 10, replacement: 30 },
            finishes: { maintenance: 5, replacement: 15 }
        };
    }

    /**
     * Calculate complete LCA for a material
     * This is the main engine - it takes a material and calculates carbon across all stages
     */
    calculateFullLCA(material, quantity, designLife = 50) {
        const materialData = getMaterialData(material.category, material.type);
        if (!materialData) {
            console.error(`Material not found: ${material.category} - ${material.type}`);
            return null;
        }

        // Base embodied carbon (A1-A3: Product stage)
        const productStageTotal = materialData.embodiedCarbon * quantity;
        
        // Break down using the material's specific LCA stage percentages
        const a1a3 = productStageTotal * materialData.lcaStages.a1a3;
        const a4 = productStageTotal * materialData.lcaStages.a4;
        const a5 = productStageTotal * materialData.lcaStages.a5;
        
        // B stages (Use stage) - maintenance and replacement
        const useStage = this.calculateUseStage(
            material.category, 
            productStageTotal, 
            designLife
        );
        
        // C stages (End of life)
        const endOfLife = this.calculateEndOfLife(
            material.category,
            productStageTotal
        );
        
        // D stage (Benefits from recycling) - typically negative
        const recyclingBenefit = this.calculateRecyclingBenefit(
            material.category,
            materialData,
            quantity
        );

        return {
            materialName: materialData.name,
            quantity: quantity,
            unit: materialData.unit,
            stages: {
                // Product Stage
                a1: a1a3 * 0.4,  // Rough split: 40% raw materials
                a2: a1a3 * 0.1,  // 10% raw material transport
                a3: a1a3 * 0.5,  // 50% manufacturing
                a1a3Total: a1a3,
                
                // Construction Stage
                a4: a4,
                a5: a5,
                a4a5Total: a4 + a5,
                
                // Use Stage
                b1: 0, // No emissions from passive use
                b2: useStage.maintenance,
                b3: useStage.repair,
                b4: useStage.replacement,
                b5: useStage.refurbishment,
                b6: 0, // Operational energy calculated separately
                b7: 0, // Operational water calculated separately
                b1b7Total: useStage.total,
                
                // End of Life Stage
                c1: endOfLife.demolition,
                c2: endOfLife.transport,
                c3: endOfLife.processing,
                c4: endOfLife.disposal,
                c1c4Total: endOfLife.total,
                
                // Beyond Life Cycle
                d: recyclingBenefit
            },
            totals: {
                embodiedCarbon: a1a3 + a4 + a5,
                wholeLifeCarbon: a1a3 + a4 + a5 + useStage.total + endOfLife.total,
                netCarbon: a1a3 + a4 + a5 + useStage.total + endOfLife.total + recyclingBenefit
            }
        };
    }

    /**
     * Calculate Use Stage (B1-B7)
     * This covers maintenance, repair, and replacement over the building's life
     */
    calculateUseStage(category, productStageEmissions, designLife) {
        const cycles = this.maintenanceCycles[category];
        if (!cycles) return { total: 0, maintenance: 0, repair: 0, replacement: 0, refurbishment: 0 };
        
        // How many times do we need to replace this material?
        const replacementCycles = Math.floor(designLife / cycles.replacement);
        const maintenanceCycles = Math.floor(designLife / cycles.maintenance);
        
        // Maintenance: typically 2% of product stage per cycle
        const maintenance = maintenanceCycles * (productStageEmissions * 0.02);
        
        // Repair: typically 5% of product stage emissions every 15 years
        const repairCycles = Math.floor(designLife / 15);
        const repair = repairCycles * (productStageEmissions * 0.05);
        
        // Replacement: full product stage emissions for each replacement
        const replacement = replacementCycles * productStageEmissions;
        
        // Refurbishment: assume one major refurb at 50% of design life
        const refurbishment = designLife >= 30 ? (productStageEmissions * 0.3) : 0;
        
        const total = maintenance + repair + replacement + refurbishment;
        
        return {
            maintenance,
            repair,
            replacement,
            refurbishment,
            total
        };
    }

    /**
     * Calculate End of Life Stage (C1-C4)
     * What happens when we tear it all down?
     */
    calculateEndOfLife(category, productStageEmissions) {
        const eolFactor = this.endOfLifeFactors[category] || 0.08;
        const total = productStageEmissions * eolFactor;
        
        // Typical breakdown of end-of-life emissions
        return {
            demolition: total * 0.40,      // C1: Demolition equipment and process
            transport: total * 0.30,        // C2: Transport to disposal/processing
            processing: total * 0.20,       // C3: Waste processing (crushing, sorting)
            disposal: total * 0.10,         // C4: Final disposal (landfill)
            total: total
        };
    }

    /**
     * Calculate Recycling Benefits (Stage D)
     * Materials that can be recycled provide carbon benefits beyond the building life
     */
    calculateRecyclingBenefit(category, materialData, quantity) {
        // Recycling rates and benefits for Australian context
        const recyclingPotential = {
            concrete: { rate: 0.80, benefit: 0.05 },  // 80% can be crushed to aggregate
            steel: { rate: 0.95, benefit: 0.70 },     // 95% recyclable, high benefit
            timber: { rate: 0.40, benefit: 0.20 },    // Can be reused or chipped
            masonry: { rate: 0.60, benefit: 0.05 },   // Can be crushed
            insulation: { rate: 0.20, benefit: 0.10 }, // Limited recycling
            glazing: { rate: 0.70, benefit: 0.30 },    // Glass is recyclable
            finishes: { rate: 0.10, benefit: 0.05 }    // Most go to landfill
        };
        
        const potential = recyclingPotential[category];
        if (!potential) return 0;
        
        // Benefit = (embodied carbon) * (recycling rate) * (benefit factor)
        // Negative value = carbon saving
        const totalEmbodied = Math.abs(materialData.embodiedCarbon * quantity);
        return -(totalEmbodied * potential.rate * potential.benefit);
    }

    /**
     * Calculate project-level LCA summary
     * Rolls up all materials into overall project numbers
     */
    calculateProjectLCA(materials, designLife = 50) {
        const results = {
            materials: [],
            totals: {
                a1a3: 0,
                a4a5: 0,
                b1b7: 0,
                c1c4: 0,
                d: 0,
                embodiedCarbon: 0,
                wholeLifeCarbon: 0,
                netCarbon: 0
            }
        };

        // Calculate LCA for each material
        materials.forEach(material => {
            const lca = this.calculateFullLCA(material, material.quantity, designLife);
            if (lca) {
                results.materials.push(lca);
                
                // Add to totals
                results.totals.a1a3 += lca.stages.a1a3Total;
                results.totals.a4a5 += lca.stages.a4a5Total;
                results.totals.b1b7 += lca.stages.b1b7Total;
                results.totals.c1c4 += lca.stages.c1c4Total;
                results.totals.d += lca.stages.d;
                results.totals.embodiedCarbon += lca.totals.embodiedCarbon;
                results.totals.wholeLifeCarbon += lca.totals.wholeLifeCarbon;
                results.totals.netCarbon += lca.totals.netCarbon;
            }
        });

        return results;
    }

    /**
     * Calculate operational carbon (not embodied, but important for whole-of-life)
     * This is B6 (operational energy) in the LCA stages
     */
    calculateOperationalCarbon(gfa, buildingType, energyRating = 'average') {
        // Annual energy intensity (kWh/m²/year) for Australian commercial buildings
        const energyIntensity = {
            residential: { excellent: 50, good: 80, average: 120, poor: 180 },
            commercial: { excellent: 100, good: 150, average: 220, poor: 350 },
            industrial: { excellent: 80, good: 120, average: 180, poor: 280 },
            infrastructure: { excellent: 30, good: 50, average: 80, poor: 120 }
        };
        
        // Australian grid emission factor (kg CO2-e/kWh)
        // This varies by state - using national average
        const gridEmissionFactor = 0.81; // kg CO2-e/kWh
        
        const intensity = energyIntensity[buildingType]?.[energyRating] || 220;
        const annualEnergy = gfa * intensity;
        const annualEmissions = annualEnergy * gridEmissionFactor;
        
        return {
            annualEnergy: annualEnergy, // kWh/year
            annualEmissions: annualEmissions, // kg CO2-e/year
            intensity: intensity, // kWh/m²/year
            gridFactor: gridEmissionFactor
        };
    }
}

// Create global instance
const lcaCalculator = new LCACalculator();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LCACalculator, lcaCalculator };
}
