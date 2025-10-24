/**
 * GHG Protocol Scopes Calculator
 * 
 * This module calculates greenhouse gas emissions following the GHG Protocol Corporate Standard.
 * This is the global standard for corporate carbon accounting and is required for:
 * - TCFD (Task Force on Climate-related Financial Disclosures)
 * - NGER (National Greenhouse and Energy Reporting)
 * - CDP (Carbon Disclosure Project)
 * 
 * THE THREE SCOPES EXPLAINED:
 * 
 * SCOPE 1: Direct emissions from owned/controlled sources
 * Think: Your company's fuel, your fleet, your generators
 * Examples: Diesel in excavators, natural gas in site offices, company utes
 * 
 * SCOPE 2: Indirect emissions from purchased energy
 * Think: The electricity bill
 * Examples: Power to your site office, workshop electricity, electric tool charging
 * 
 * SCOPE 3: All other indirect emissions in your value chain
 * Think: Everything else - this is the BIG one for construction!
 * Examples: Material production, transport, waste, employee commuting, subcontractors
 * 
 * For construction, Scope 3 is typically 80-95% of total emissions!
 */

class ScopesCalculator {
    constructor() {
        // Australian emission factors (kg CO2-e per unit)
        this.emissionFactors = {
            // SCOPE 1: Direct emissions
            fuels: {
                diesel: 2.68,           // kg CO2-e per litre
                petrol: 2.31,           // kg CO2-e per litre
                naturalGas: 1.89,       // kg CO2-e per m³
                lpg: 1.51               // kg CO2-e per litre
            },
            
            // SCOPE 2: Purchased electricity (by Australian state)
            electricity: {
                nsw: 0.81,      // New South Wales
                vic: 1.02,      // Victoria (brown coal = high emissions)
                qld: 0.79,      // Queensland
                sa: 0.43,       // South Australia (lots of renewables!)
                wa: 0.70,       // Western Australia
                tas: 0.14,      // Tasmania (hydro power = very low!)
                act: 0.0,       // ACT (100% renewable electricity)
                nt: 0.62,       // Northern Territory
                national: 0.81  // National average
            },
            
            // SCOPE 3: Value chain emissions
            materials: {
                // These come from our materials database
                // This links Scope 3 to embodied carbon calculations
            },
            transport: {
                lightVehicle: 0.27,     // kg CO2-e per km (subcontractor vehicles)
                heavyVehicle: 1.14,     // kg CO2-e per km (material delivery trucks)
                air: 0.18               // kg CO2-e per passenger-km
            },
            waste: {
                landfill: 0.94,         // kg CO2-e per kg waste (includes methane)
                recycling: 0.15,        // kg CO2-e per kg (processing)
                incineration: 0.40      // kg CO2-e per kg
            }
        };
    }

    /**
     * SCOPE 1: Calculate direct emissions
     * This is fuel you burn directly on site or in your vehicles
     */
    calculateScope1(inputs) {
        const scope1Emissions = {
            categories: {},
            total: 0,
            breakdown: []
        };

        // Fuel combustion on site
        if (inputs.fuels) {
            let fuelTotal = 0;
            inputs.fuels.forEach(fuel => {
                const factor = this.emissionFactors.fuels[fuel.type];
                const emissions = fuel.quantity * factor;
                fuelTotal += emissions;
                
                scope1Emissions.breakdown.push({
                    category: 'Fuel Combustion',
                    subcategory: fuel.type,
                    description: fuel.description || `${fuel.type} combustion`,
                    quantity: fuel.quantity,
                    unit: fuel.type === 'naturalGas' ? 'm³' : 'litres',
                    factor: factor,
                    emissions: emissions
                });
            });
            scope1Emissions.categories.fuelCombustion = fuelTotal;
        }

        // Mobile combustion (company vehicles)
        if (inputs.vehicles) {
            let vehicleTotal = 0;
            inputs.vehicles.forEach(vehicle => {
                const factor = this.emissionFactors.fuels[vehicle.fuelType];
                const emissions = vehicle.fuelUsed * factor;
                vehicleTotal += emissions;
                
                scope1Emissions.breakdown.push({
                    category: 'Mobile Combustion',
                    subcategory: vehicle.type,
                    description: `${vehicle.type} - ${vehicle.fuelType}`,
                    quantity: vehicle.fuelUsed,
                    unit: 'litres',
                    factor: factor,
                    emissions: emissions
                });
            });
            scope1Emissions.categories.mobileCombustion = vehicleTotal;
        }

        // Fugitive emissions (refrigerants, etc.)
        if (inputs.fugitive) {
            let fugitiveTotal = 0;
            inputs.fugitive.forEach(emission => {
                fugitiveTotal += emission.emissions;
                scope1Emissions.breakdown.push({
                    category: 'Fugitive Emissions',
                    subcategory: emission.type,
                    description: emission.description,
                    quantity: emission.quantity,
                    unit: 'kg',
                    factor: emission.gwp || 1,
                    emissions: emission.emissions
                });
            });
            scope1Emissions.categories.fugitiveEmissions = fugitiveTotal;
        }

        // Calculate total
        scope1Emissions.total = Object.values(scope1Emissions.categories).reduce((sum, val) => sum + val, 0);
        
        return scope1Emissions;
    }

    /**
     * SCOPE 2: Calculate indirect emissions from purchased energy
     * This is primarily electricity, but can include steam, heating, cooling
     */
    calculateScope2(inputs, state = 'national') {
        const scope2Emissions = {
            categories: {},
            total: 0,
            breakdown: [],
            methodology: 'location-based' // or 'market-based' with renewable certificates
        };

        // Purchased electricity
        if (inputs.electricity) {
            const factor = this.emissionFactors.electricity[state.toLowerCase()] || 
                          this.emissionFactors.electricity.national;
            
            const emissions = inputs.electricity.kwh * factor;
            
            scope2Emissions.categories.electricity = emissions;
            scope2Emissions.breakdown.push({
                category: 'Purchased Electricity',
                subcategory: state.toUpperCase(),
                description: `Grid electricity (${state})`,
                quantity: inputs.electricity.kwh,
                unit: 'kWh',
                factor: factor,
                emissions: emissions
            });
        }

        // Purchased heating/cooling (if applicable)
        if (inputs.districtEnergy) {
            let districtTotal = 0;
            inputs.districtEnergy.forEach(energy => {
                districtTotal += energy.emissions;
                scope2Emissions.breakdown.push({
                    category: 'District Energy',
                    subcategory: energy.type,
                    description: energy.description,
                    quantity: energy.quantity,
                    unit: energy.unit,
                    factor: energy.factor,
                    emissions: energy.emissions
                });
            });
            scope2Emissions.categories.districtEnergy = districtTotal;
        }

        scope2Emissions.total = Object.values(scope2Emissions.categories).reduce((sum, val) => sum + val, 0);
        
        return scope2Emissions;
    }

    /**
     * SCOPE 3: Calculate value chain emissions
     * This is the BIG one for construction - includes materials, transport, waste
     * 
     * GHG Protocol has 15 categories for Scope 3. We'll focus on the most relevant for construction:
     * 1. Purchased goods & services (materials!)
     * 2. Capital goods
     * 3. Fuel & energy related (not in Scope 1 or 2)
     * 4. Upstream transportation
     * 5. Waste generated
     * 6. Business travel
     * 7. Employee commuting
     * 8. Downstream transportation
     * 11. Use of sold products (operational phase)
     * 12. End-of-life treatment
     */
    calculateScope3(inputs) {
        const scope3Emissions = {
            categories: {},
            total: 0,
            breakdown: []
        };

        // Category 1: Purchased goods and services (MATERIALS - the biggest for construction)
        if (inputs.materials) {
            let materialsTotal = 0;
            inputs.materials.forEach(material => {
                const materialData = getMaterialData(material.category, material.type);
                if (materialData) {
                    // The embodied carbon of materials IS Scope 3, Category 1!
                    const emissions = materialData.embodiedCarbon * material.quantity;
                    materialsTotal += Math.abs(emissions); // Use absolute value
                    
                    scope3Emissions.breakdown.push({
                        category: 'Purchased Goods & Services',
                        subcategory: material.category,
                        description: materialData.name,
                        quantity: material.quantity,
                        unit: materialData.unit,
                        factor: materialData.embodiedCarbon,
                        emissions: Math.abs(emissions)
                    });
                }
            });
            scope3Emissions.categories.purchasedGoods = materialsTotal;
        }

        // Category 4: Upstream transportation and distribution
        if (inputs.transport) {
            let transportTotal = 0;
            inputs.transport.forEach(transport => {
                const factor = this.emissionFactors.transport[transport.type] || 0;
                const emissions = transport.distance * transport.weight * factor / 1000; // Convert to tonne-km
                transportTotal += emissions;
                
                scope3Emissions.breakdown.push({
                    category: 'Upstream Transportation',
                    subcategory: transport.type,
                    description: transport.description || `${transport.type} transport`,
                    quantity: transport.distance,
                    unit: 'km',
                    factor: factor,
                    emissions: emissions
                });
            });
            scope3Emissions.categories.upstreamTransport = transportTotal;
        }

        // Category 5: Waste generated in operations
        if (inputs.waste) {
            let wasteTotal = 0;
            inputs.waste.forEach(waste => {
                const factor = this.emissionFactors.waste[waste.disposalMethod] || 0.5;
                const emissions = waste.quantity * factor;
                wasteTotal += emissions;
                
                scope3Emissions.breakdown.push({
                    category: 'Waste Generated',
                    subcategory: waste.type,
                    description: `${waste.type} - ${waste.disposalMethod}`,
                    quantity: waste.quantity,
                    unit: 'kg',
                    factor: factor,
                    emissions: emissions
                });
            });
            scope3Emissions.categories.waste = wasteTotal;
        }

        // Category 6: Business travel
        if (inputs.businessTravel) {
            let travelTotal = 0;
            inputs.businessTravel.forEach(travel => {
                const factor = this.emissionFactors.transport[travel.mode] || 0.2;
                const emissions = travel.distance * factor;
                travelTotal += emissions;
                
                scope3Emissions.breakdown.push({
                    category: 'Business Travel',
                    subcategory: travel.mode,
                    description: travel.description || `${travel.mode} travel`,
                    quantity: travel.distance,
                    unit: 'km',
                    factor: factor,
                    emissions: emissions
                });
            });
            scope3Emissions.categories.businessTravel = travelTotal;
        }

        // Category 7: Employee commuting
        if (inputs.employeeCommuting) {
            let commutingTotal = 0;
            const factor = this.emissionFactors.transport.lightVehicle;
            const emissions = inputs.employeeCommuting.totalKm * factor;
            commutingTotal += emissions;
            
            scope3Emissions.breakdown.push({
                category: 'Employee Commuting',
                subcategory: 'Commute',
                description: `${inputs.employeeCommuting.employees} employees`,
                quantity: inputs.employeeCommuting.totalKm,
                unit: 'km',
                factor: factor,
                emissions: emissions
            });
            scope3Emissions.categories.employeeCommuting = commutingTotal;
        }

        // Category 11: Use of sold products (operational energy for buildings)
        if (inputs.operationalEnergy) {
            const emissions = inputs.operationalEnergy.annualEmissions;
            scope3Emissions.categories.useOfProducts = emissions;
            scope3Emissions.breakdown.push({
                category: 'Use of Products',
                subcategory: 'Operational Energy',
                description: 'Building operational emissions (annual)',
                quantity: inputs.operationalEnergy.annualEnergy,
                unit: 'kWh',
                factor: inputs.operationalEnergy.gridFactor,
                emissions: emissions
            });
        }

        // Category 12: End-of-life treatment
        if (inputs.endOfLife) {
            let eolTotal = 0;
            inputs.endOfLife.forEach(material => {
                eolTotal += material.emissions;
                scope3Emissions.breakdown.push({
                    category: 'End-of-Life Treatment',
                    subcategory: material.type,
                    description: material.description,
                    quantity: material.quantity,
                    unit: material.unit,
                    factor: material.factor,
                    emissions: material.emissions
                });
            });
            scope3Emissions.categories.endOfLife = eolTotal;
        }

        scope3Emissions.total = Object.values(scope3Emissions.categories).reduce((sum, val) => sum + val, 0);
        
        return scope3Emissions;
    }

    /**
     * Calculate all three scopes and return comprehensive report
     */
    calculateAllScopes(inputs, state = 'national') {
        const scope1 = this.calculateScope1(inputs.scope1 || {});
        const scope2 = this.calculateScope2(inputs.scope2 || {}, state);
        const scope3 = this.calculateScope3(inputs.scope3 || {});
        
        const total = scope1.total + scope2.total + scope3.total;
        
        return {
            scope1,
            scope2,
            scope3,
            total,
            percentages: {
                scope1: total > 0 ? (scope1.total / total * 100) : 0,
                scope2: total > 0 ? (scope2.total / total * 100) : 0,
                scope3: total > 0 ? (scope3.total / total * 100) : 0
            },
            summary: {
                totalEmissions: total,
                largestScope: this.getLargestScope(scope1.total, scope2.total, scope3.total),
                materialsImpact: scope3.categories.purchasedGoods || 0,
                materialsPercentage: total > 0 ? ((scope3.categories.purchasedGoods || 0) / total * 100) : 0
            }
        };
    }

    /**
     * Helper: Identify which scope contributes most
     */
    getLargestScope(s1, s2, s3) {
        if (s1 >= s2 && s1 >= s3) return 'Scope 1';
        if (s2 >= s1 && s2 >= s3) return 'Scope 2';
        return 'Scope 3';
    }

    /**
     * Map LCA stages to GHG Protocol Scopes
     * This is the connection between LCA and Scopes reporting
     */
    mapLCAToScopes(lcaResults) {
        return {
            scope1: {
                // Typically minimal for materials themselves
                // Would come from on-site activities during construction (A5)
                fuels: [],
                vehicles: [],
                fugitive: []
            },
            scope2: {
                // Construction site electricity
                electricity: { kwh: 0 }
            },
            scope3: {
                // This is where embodied carbon fits!
                materials: lcaResults.materials.map(m => ({
                    category: this.resolveScopeCategory(m),
                    type: m.type || m.materialName,
                    quantity: m.quantity,
                    unit: m.unit,
                    emissions: Math.abs(m.totals?.embodiedCarbon || 0)
                })),
                transport: [], // A4 transport
                waste: [],     // C stages
                endOfLife: []  // C stages
            }
        };
    }

    /**
     * Resolve Scope 3 material category using metadata (GHG Protocol category 1)
     */
    resolveScopeCategory(material) {
        if (material.category) {
            return material.category;
        }
        if (material.type) {
            return material.type;
        }
        return material.materialName ? material.materialName.split(' ')[0].toLowerCase() : 'materials';
    }
}

// Create global instance
const scopesCalculator = new ScopesCalculator();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ScopesCalculator, scopesCalculator };
}
