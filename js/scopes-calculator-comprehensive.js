/**
 * COMPREHENSIVE GHG PROTOCOL SCOPES CALCULATOR
 * 
 * This handles ALL construction site emissions across Scopes 1, 2, and 3.
 * Built for Australian construction compliance (TCFD, NGER, CDP).
 * 
 * Author: CarbonConstruct Team
 * Last Updated: 2024
 */

const EMPTY_FACTORS = Object.freeze({
    fuels: {},
    equipment: {},
    electricity: { states: {}, siteUsage: {} },
    transport: { road: {}, rail: {}, sea: {} },
    waste: { landfill: {}, recycling: {} },
    water: {},
    commuting: {},
    temporaryWorks: {}
});

let FACTORS_SOURCE;

if (typeof EMISSIONS_FACTORS !== 'undefined') {
    FACTORS_SOURCE = EMISSIONS_FACTORS;
} else if (typeof require === 'function') {
    try {
        FACTORS_SOURCE = require('./emissions-factors.js');
    } catch (err) {
        if (err && err.code !== 'MODULE_NOT_FOUND') {
            throw err;
        }
    }
}

if (!FACTORS_SOURCE) {
    FACTORS_SOURCE = EMPTY_FACTORS;
    if (typeof console !== 'undefined' && typeof console.warn === 'function') {
        console.warn('Emissions factors dataset unavailable; calculator will use empty defaults.');
    }
}

class ComprehensiveScopesCalculator {
    constructor() {
        // Load emissions factors
        this.factors = FACTORS_SOURCE;
        
        // Storage for all tracked emissions
        this.scope1Items = [];
        this.scope2Items = [];
        this.scope3Items = [];
    }
    
    // ============================================================================
    // SCOPE 1: DIRECT EMISSIONS CALCULATION
    // ============================================================================
    
    /**
     * Add equipment usage to Scope 1
     * @param {Object} equipment - Equipment details
     * @returns {Object} - Calculated emissions
     */
    addScope1Equipment(equipment) {
        const { category, type, operatingHours, fuelUsed, customFuelRate } = equipment;
        
        let emissions = 0;
        let fuelType = 'diesel';
        let consumption = 0;
        
        // Get equipment fuel consumption rate
        if (customFuelRate) {
            // User provided custom fuel rate
            consumption = customFuelRate * operatingHours;
        } else {
            // Use database fuel consumption rates
            const equipmentData = this.getEquipmentData(category, type);
            if (equipmentData) {
                fuelType = equipmentData.fuelType;
                consumption = equipmentData.consumption * operatingHours;
            }
        }
        
        // Calculate emissions
        if (fuelUsed) {
            // User provided actual fuel used
            const factor = this.factors.fuels[fuelType] || this.factors.fuels.diesel;
            emissions = fuelUsed * factor;
        } else if (consumption > 0) {
            // Calculate from consumption rate
            if (fuelType === 'electricity') {
                // Electric equipment goes to Scope 2, not Scope 1
                return { error: 'Electric equipment should be tracked in Scope 2' };
            }
            const factor = this.factors.fuels[fuelType] || this.factors.fuels.diesel;
            emissions = consumption * factor;
        }
        
        const item = {
            id: Date.now() + Math.random(),
            category,
            type,
            operatingHours,
            fuelType,
            fuelConsumed: consumption,
            emissionFactor: this.factors.fuels[fuelType],
            emissions: emissions / 1000  // Convert to tonnes CO2-e
        };
        
        this.scope1Items.push(item);
        return item;
    }
    
    /**
     * Get equipment fuel consumption data from database
     */
    getEquipmentData(category, type) {
        try {
            if (this.factors.equipment[category]) {
                // Handle nested categories (e.g., cranes.towerCrane)
                if (typeof this.factors.equipment[category] === 'object') {
                    // Check if it's directly a type
                    if (this.factors.equipment[category][type]) {
                        return this.factors.equipment[category][type];
                    }
                    // Or if it's a nested category
                    for (let subCategory in this.factors.equipment[category]) {
                        if (this.factors.equipment[category][subCategory][type]) {
                            return this.factors.equipment[category][subCategory][type];
                        }
                    }
                }
            }
        } catch (e) {
            console.warn('Equipment data not found:', category, type);
        }
        return null;
    }
    
    /**
     * Add vehicle usage to Scope 1
     */
    addScope1Vehicle(vehicle) {
        const { type, fuelType, distance, fuelUsed } = vehicle;
        
        let emissions = 0;
        
        if (fuelUsed) {
            // Actual fuel used provided
            const factor = this.factors.fuels[fuelType] || this.factors.fuels.diesel;
            emissions = fuelUsed * factor;
        } else if (distance) {
            // Calculate from distance
            const vehicleData = this.factors.equipment.vehicles[type];
            if (vehicleData) {
                // consumption is L/100km, so: (distance / 100) * consumption
                const fuelConsumed = (distance / 100) * vehicleData.consumption;
                const factor = this.factors.fuels[vehicleData.fuelType];
                emissions = fuelConsumed * factor;
            }
        }
        
        const item = {
            id: Date.now() + Math.random(),
            category: 'vehicles',
            type,
            fuelType: fuelType || 'diesel',
            distance: distance || 0,
            fuelConsumed: fuelUsed || 0,
            emissions: emissions / 1000  // Convert to tonnes CO2-e
        };
        
        this.scope1Items.push(item);
        return item;
    }
    
    /**
     * Calculate total Scope 1 emissions
     */
    calculateScope1Total() {
        const total = this.scope1Items.reduce((sum, item) => sum + item.emissions, 0);
        
        // Breakdown by category
        const breakdown = {};
        this.scope1Items.forEach(item => {
            if (!breakdown[item.category]) {
                breakdown[item.category] = 0;
            }
            breakdown[item.category] += item.emissions;
        });
        
        return {
            total: total,
            breakdown: breakdown,
            items: this.scope1Items,
            percentage: 0  // Will be calculated when total project emissions known
        };
    }
    
    // ============================================================================
    // SCOPE 2: INDIRECT ENERGY EMISSIONS
    // ============================================================================
    
    /**
     * Add electricity usage to Scope 2
     */
    addScope2Electricity(usage) {
        const { description, kWh, state, days } = usage;
        
        const emissionFactor = this.factors.electricity.states[state] || this.factors.electricity.states.national;
        const emissions = kWh * emissionFactor;
        
        const item = {
            id: Date.now() + Math.random(),
            category: 'electricity',
            description,
            kWh,
            state,
            emissionFactor,
            emissions: emissions / 1000,  // Convert to tonnes CO2-e
            days: days || 0
        };
        
        this.scope2Items.push(item);
        return item;
    }
    
    /**
     * Add site facility electricity usage
     */
    addScope2SiteFacility(facility) {
        const { type, days, state } = facility;
        
        const dailyUsage = this.factors.electricity.siteUsage[type] || 0;
        const totalKWh = dailyUsage * days;
        const emissionFactor = this.factors.electricity.states[state] || this.factors.electricity.states.national;
        const emissions = totalKWh * emissionFactor;
        
        const item = {
            id: Date.now() + Math.random(),
            category: 'siteFacility',
            type,
            days,
            dailyUsage,
            totalKWh,
            state,
            emissionFactor,
            emissions: emissions / 1000  // Convert to tonnes CO2-e
        };
        
        this.scope2Items.push(item);
        return item;
    }
    
    /**
     * Add electric equipment usage (hoists, lifts, etc.)
     */
    addScope2ElectricEquipment(equipment) {
        const { type, operatingHours, state, kWhPerHour } = equipment;
        
        // Get kWh consumption
        let totalKWh = 0;
        if (kWhPerHour) {
            totalKWh = kWhPerHour * operatingHours;
        } else {
            // Look up in equipment database
            const equipmentData = this.getEquipmentData(equipment.category, type);
            if (equipmentData && equipmentData.fuelType === 'electricity') {
                totalKWh = equipmentData.consumption * operatingHours;
            }
        }
        
        const emissionFactor = this.factors.electricity.states[state] || this.factors.electricity.states.national;
        const emissions = totalKWh * emissionFactor;
        
        const item = {
            id: Date.now() + Math.random(),
            category: 'electricEquipment',
            type,
            operatingHours,
            totalKWh,
            state,
            emissionFactor,
            emissions: emissions / 1000  // Convert to tonnes CO2-e
        };
        
        this.scope2Items.push(item);
        return item;
    }
    
    /**
     * Calculate total Scope 2 emissions
     */
    calculateScope2Total() {
        const total = this.scope2Items.reduce((sum, item) => sum + item.emissions, 0);
        
        // Breakdown by category
        const breakdown = {};
        this.scope2Items.forEach(item => {
            if (!breakdown[item.category]) {
                breakdown[item.category] = 0;
            }
            breakdown[item.category] += item.emissions;
        });
        
        return {
            total: total,
            breakdown: breakdown,
            items: this.scope2Items,
            percentage: 0
        };
    }
    
    // ============================================================================
    // SCOPE 3: VALUE CHAIN EMISSIONS
    // ============================================================================
    
    /**
     * Add material transport emissions
     */
    addScope3Transport(transport) {
        const { material, weight, distance, transportMode } = transport;
        
        let emissionFactor = 0;
        let emissions = 0;
        
        // Get transport emission factor
        if (transportMode === 'rigidTruck') {
            emissionFactor = this.factors.transport.road.rigidTruck;
        } else if (transportMode === 'articulatedTruck') {
            emissionFactor = this.factors.transport.road.articulatedTruck;
        } else if (transportMode === 'rail') {
            emissionFactor = this.factors.transport.rail.freight;
        } else if (transportMode === 'sea') {
            emissionFactor = this.factors.transport.sea.container;
        }
        
        // Calculate: weight (tonnes) × distance (km) × emission factor (kg CO2-e per tonne-km)
        emissions = weight * distance * emissionFactor;
        
        const item = {
            id: Date.now() + Math.random(),
            category: 'transport',
            material,
            weight,
            distance,
            transportMode,
            emissionFactor,
            emissions: emissions / 1000  // Convert to tonnes CO2-e
        };
        
        this.scope3Items.push(item);
        return item;
    }
    
    /**
     * Add construction waste emissions
     */
    addScope3Waste(waste) {
        const { material, weight, disposalMethod } = waste;
        
        let emissionFactor = 0;
        
        // Get waste disposal emission factor
        if (disposalMethod === 'landfill_general') {
            emissionFactor = this.factors.waste.landfill.general;
        } else if (disposalMethod === 'landfill_inert') {
            emissionFactor = this.factors.waste.landfill.inert;
        } else if (disposalMethod === 'recycling') {
            emissionFactor = this.factors.waste.recycling.general;
        } else if (disposalMethod === 'recycling_metal') {
            emissionFactor = this.factors.waste.recycling.metal;
        } else if (disposalMethod === 'recycling_concrete') {
            emissionFactor = this.factors.waste.recycling.concrete;
        }
        
        // Calculate: weight (kg) × emission factor (kg CO2-e per kg)
        const emissions = weight * emissionFactor;
        
        const item = {
            id: Date.now() + Math.random(),
            category: 'waste',
            material,
            weight,
            disposalMethod,
            emissionFactor,
            emissions: emissions / 1000  // Convert to tonnes CO2-e
        };
        
        this.scope3Items.push(item);
        return item;
    }
    
    /**
     * Add water usage emissions
     */
    addScope3Water(water) {
        const { type, volume } = water;  // volume in kL (kilolitres)
        
        let emissionFactor = 0;
        if (type === 'potable') {
            emissionFactor = this.factors.water.potable;
        } else if (type === 'recycled') {
            emissionFactor = this.factors.water.recycled;
        } else if (type === 'wastewater') {
            emissionFactor = this.factors.water.wastewater;
        }
        
        const emissions = volume * emissionFactor;
        
        const item = {
            id: Date.now() + Math.random(),
            category: 'water',
            type,
            volume,
            emissionFactor,
            emissions: emissions / 1000  // Convert to tonnes CO2-e
        };
        
        this.scope3Items.push(item);
        return item;
    }
    
    /**
     * Add employee commuting emissions
     */
    addScope3Commuting(commute) {
        const { employees, avgDistance, days, mode } = commute;
        
        let emissionFactor = this.factors.commuting[mode] || this.factors.commuting.car_solo;
        
        // Calculate: employees × distance per day (km) × days × emission factor × 2 (return trip)
        const totalKm = employees * avgDistance * days * 2;
        const emissions = totalKm * emissionFactor;
        
        const item = {
            id: Date.now() + Math.random(),
            category: 'commuting',
            employees,
            avgDistance,
            days,
            mode,
            totalKm,
            emissionFactor,
            emissions: emissions / 1000  // Convert to tonnes CO2-e
        };
        
        this.scope3Items.push(item);
        return item;
    }
    
    /**
     * Add temporary works emissions
     */
    addScope3TemporaryWorks(tempWorks) {
        const { type, area, uses } = tempWorks;  // area in m², uses = number of times reused
        
        const emissionPerUse = this.factors.temporaryWorks[type] || 5.0;
        
        // Amortize embodied carbon over number of uses
        const emissions = (area * emissionPerUse) / uses;
        
        const item = {
            id: Date.now() + Math.random(),
            category: 'temporaryWorks',
            type,
            area,
            uses,
            emissionPerUse,
            emissions: emissions / 1000  // Convert to tonnes CO2-e
        };
        
        this.scope3Items.push(item);
        return item;
    }
    
    /**
     * Calculate total Scope 3 emissions
     */
    calculateScope3Total() {
        const total = this.scope3Items.reduce((sum, item) => sum + item.emissions, 0);
        
        // Breakdown by category
        const breakdown = {};
        this.scope3Items.forEach(item => {
            if (!breakdown[item.category]) {
                breakdown[item.category] = 0;
            }
            breakdown[item.category] += item.emissions;
        });
        
        return {
            total: total,
            breakdown: breakdown,
            items: this.scope3Items,
            percentage: 0
        };
    }
    
    // ============================================================================
    // OVERALL CALCULATIONS
    // ============================================================================
    
    /**
     * Calculate all scopes and return comprehensive summary
     */
    calculateAllScopes() {
        const scope1 = this.calculateScope1Total();
        const scope2 = this.calculateScope2Total();
        const scope3 = this.calculateScope3Total();
        
        const grandTotal = scope1.total + scope2.total + scope3.total;
        
        // Calculate percentages
        if (grandTotal > 0) {
            scope1.percentage = (scope1.total / grandTotal * 100).toFixed(1);
            scope2.percentage = (scope2.total / grandTotal * 100).toFixed(1);
            scope3.percentage = (scope3.total / grandTotal * 100).toFixed(1);
        }
        
        return {
            scope1,
            scope2,
            scope3,
            total: grandTotal,
            summary: {
                directEmissions: scope1.total,
                indirectEnergyEmissions: scope2.total,
                valueChainEmissions: scope3.total,
                totalEmissions: grandTotal
            }
        };
    }
    
    /**
     * Clear all tracked emissions
     */
    reset() {
        this.scope1Items = [];
        this.scope2Items = [];
        this.scope3Items = [];
    }
    
    /**
     * Remove specific item
     */
    removeItem(scope, itemId) {
        if (scope === 1) {
            this.scope1Items = this.scope1Items.filter(item => item.id !== itemId);
        } else if (scope === 2) {
            this.scope2Items = this.scope2Items.filter(item => item.id !== itemId);
        } else if (scope === 3) {
            this.scope3Items = this.scope3Items.filter(item => item.id !== itemId);
        }
    }
    
    /**
     * Export data for reporting
     */
    exportData() {
        return {
            scope1: this.scope1Items,
            scope2: this.scope2Items,
            scope3: this.scope3Items,
            calculated: this.calculateAllScopes(),
            timestamp: new Date().toISOString()
        };
    }
}

// Initialize global calculator
const scopesCalc = new ComprehensiveScopesCalculator();

if (typeof window !== 'undefined') {
    window.scopesCalc = scopesCalc;
    window.ComprehensiveScopesCalculator = ComprehensiveScopesCalculator;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ComprehensiveScopesCalculator,
        EMISSIONS_FACTORS: FACTORS
    };
}
