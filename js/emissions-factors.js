/**
 * COMPREHENSIVE EMISSIONS FACTORS DATABASE
 * 
 * This is the heart of carbon calculation - emission factors for EVERYTHING used on a construction site.
 * All factors are in kg CO2-e (carbon dioxide equivalent) per unit.
 * 
 * Sources:
 * - Australian Government National Greenhouse Accounts Factors 2023
 * - ICE Database (Circular Ecology)
 * - Equipment manufacturer specifications
 * - Industry averages for Australian construction
 * 
 * Why this matters: Without accurate emission factors, your carbon calculations are just guesses.
 * These numbers let builders track REAL emissions, not estimates.
 */

const EMISSIONS_FACTORS = {
    
    // ============================================================================
    // SCOPE 1: DIRECT EMISSIONS (Fuel you burn on site)
    // ============================================================================
    
    fuels: {
        // Liquid fuels (kg CO2-e per litre)
        diesel: 2.68,           // Most common - excavators, cranes, generators
        petrol: 2.31,           // Light vehicles, small equipment
        lpg: 1.51,              // Forklifts, heaters
        bioDiesel: 2.45,        // Renewable diesel blend (still has emissions)
        e10: 2.22,              // 10% ethanol petrol blend
        
        // Gaseous fuels (kg CO2-e per unit)
        naturalGas: 1.89,       // per m³ - site heating, hot water
        propane: 1.51,          // per litre - portable heaters
        butane: 1.48,           // per litre - site equipment
        
        // Specialty fuels
        aviation: 2.53,         // per litre (helicopter lifts, remote sites)
        kerosene: 2.52          // per litre (heaters, lamps)
    },
    
    // ============================================================================
    // EQUIPMENT FUEL CONSUMPTION RATES
    // Based on manufacturer specs and industry averages
    // All rates are per operating hour unless specified
    // ============================================================================
    
    equipment: {
        // CRANES
        cranes: {
            towerCrane: {
                '6t': { fuelType: 'diesel', consumption: 8 },      // L/hour
                '10t': { fuelType: 'diesel', consumption: 12 },
                '16t': { fuelType: 'diesel', consumption: 16 },
                '25t': { fuelType: 'diesel', consumption: 20 }
            },
            mobileCrane: {
                '20t': { fuelType: 'diesel', consumption: 15 },
                '50t': { fuelType: 'diesel', consumption: 25 },
                '100t': { fuelType: 'diesel', consumption: 35 },
                '200t': { fuelType: 'diesel', consumption: 50 },
                '300t': { fuelType: 'diesel', consumption: 70 }
            },
            crawlerCrane: {
                '100t': { fuelType: 'diesel', consumption: 40 },
                '200t': { fuelType: 'diesel', consumption: 60 },
                '300t': { fuelType: 'diesel', consumption: 80 }
            }
        },
        
        // EXCAVATORS & EARTHMOVING
        excavators: {
            mini_3t: { fuelType: 'diesel', consumption: 4 },
            midi_5t: { fuelType: 'diesel', consumption: 6 },
            standard_13t: { fuelType: 'diesel', consumption: 12 },
            large_20t: { fuelType: 'diesel', consumption: 18 },
            xlarge_30t: { fuelType: 'diesel', consumption: 25 },
            xxlarge_50t: { fuelType: 'diesel', consumption: 40 }
        },
        
        loaders: {
            skidSteer: { fuelType: 'diesel', consumption: 8 },
            frontEndLoader_3m3: { fuelType: 'diesel', consumption: 15 },
            frontEndLoader_5m3: { fuelType: 'diesel', consumption: 25 },
            wheelLoader_7m3: { fuelType: 'diesel', consumption: 35 }
        },
        
        // MATERIAL HANDLING
        forklifts: {
            diesel_2_5t: { fuelType: 'diesel', consumption: 4 },
            diesel_5t: { fuelType: 'diesel', consumption: 6 },
            diesel_10t: { fuelType: 'diesel', consumption: 10 },
            lpg_2_5t: { fuelType: 'lpg', consumption: 3 },
            electric_2_5t: { fuelType: 'electricity', consumption: 8 }    // kWh/hour
        },
        
        telehandlers: {
            '3t_6m': { fuelType: 'diesel', consumption: 5 },
            '4t_12m': { fuelType: 'diesel', consumption: 7 },
            '5t_18m': { fuelType: 'diesel', consumption: 10 }
        },
        
        // ACCESS EQUIPMENT
        accessEquipment: {
            scissorLift_electric_6m: { fuelType: 'electricity', consumption: 3 },      // kWh/hour
            scissorLift_electric_12m: { fuelType: 'electricity', consumption: 5 },
            scissorLift_diesel_12m: { fuelType: 'diesel', consumption: 4 },
            boomLift_diesel_15m: { fuelType: 'diesel', consumption: 6 },
            boomLift_diesel_25m: { fuelType: 'diesel', consumption: 10 },
            cherryPicker_diesel: { fuelType: 'diesel', consumption: 8 }
        },
        
        // CONCRETE EQUIPMENT
        concrete: {
            concretePump_boom: { fuelType: 'diesel', consumption: 15 },
            concretePump_line: { fuelType: 'diesel', consumption: 10 },
            concreteVibrator_electric: { fuelType: 'electricity', consumption: 2 },
            concreteMixer_350L: { fuelType: 'diesel', consumption: 5 },
            concreteMixer_700L: { fuelType: 'diesel', consumption: 8 }
        },
        
        // COMPACTION EQUIPMENT
        compaction: {
            vibratoryRoller_single: { fuelType: 'diesel', consumption: 8 },
            vibratoryRoller_double: { fuelType: 'diesel', consumption: 12 },
            plateCompactor_small: { fuelType: 'petrol', consumption: 2 },
            plateCompactor_large: { fuelType: 'diesel', consumption: 4 },
            padFootRoller: { fuelType: 'diesel', consumption: 15 },
            sheepFootRoller: { fuelType: 'diesel', consumption: 15 }
        },
        
        // GENERATORS
        generators: {
            '20kVA': { fuelType: 'diesel', consumption: 5 },
            '45kVA': { fuelType: 'diesel', consumption: 10 },
            '100kVA': { fuelType: 'diesel', consumption: 20 },
            '200kVA': { fuelType: 'diesel', consumption: 35 },
            '300kVA': { fuelType: 'diesel', consumption: 50 },
            '500kVA': { fuelType: 'diesel', consumption: 80 }
        },
        
        // SITE VEHICLES
        vehicles: {
            ute_petrol: { fuelType: 'petrol', consumption: 10 },          // L/100km
            ute_diesel: { fuelType: 'diesel', consumption: 8 },
            van_petrol: { fuelType: 'petrol', consumption: 12 },
            van_diesel: { fuelType: 'diesel', consumption: 9 },
            lightTruck_3_5t: { fuelType: 'diesel', consumption: 12 },
            mediumTruck_10t: { fuelType: 'diesel', consumption: 20 },
            semiTrailer: { fuelType: 'diesel', consumption: 35 },
            dumpTruck_6x4: { fuelType: 'diesel', consumption: 40 },
            waterCart: { fuelType: 'diesel', consumption: 25 },
            serviceTruck: { fuelType: 'diesel', consumption: 18 }
        },
        
        // HOISTS & LIFTS
        hoists: {
            alimakHoist_single: { fuelType: 'electricity', consumption: 12 },     // kWh/hour
            alimakHoist_double: { fuelType: 'electricity', consumption: 18 },
            goodsHoist_500kg: { fuelType: 'electricity', consumption: 8 },
            goodsHoist_1000kg: { fuelType: 'electricity', consumption: 12 },
            personnelHoist: { fuelType: 'electricity', consumption: 10 }
        },
        
        // COMPRESSORS & PUMPS
        compressors: {
            portable_diesel_185cfm: { fuelType: 'diesel', consumption: 12 },
            portable_diesel_375cfm: { fuelType: 'diesel', consumption: 20 },
            portable_diesel_750cfm: { fuelType: 'diesel', consumption: 35 },
            electric_100cfm: { fuelType: 'electricity', consumption: 15 }
        },
        
        pumps: {
            waterPump_3inch: { fuelType: 'diesel', consumption: 5 },
            waterPump_6inch: { fuelType: 'diesel', consumption: 10 },
            dewateringPump_electric: { fuelType: 'electricity', consumption: 8 },
            sewagePump: { fuelType: 'electricity', consumption: 6 }
        },
        
        // PILING & DRILLING
        piling: {
            pilingRig_small: { fuelType: 'diesel', consumption: 25 },
            pilingRig_large: { fuelType: 'diesel', consumption: 50 },
            cfa_rig: { fuelType: 'diesel', consumption: 45 },
            drillRig_rotary: { fuelType: 'diesel', consumption: 30 }
        },
        
        // HEATING & DRYING
        heating: {
            dieselHeater_small: { fuelType: 'diesel', consumption: 2 },
            dieselHeater_large: { fuelType: 'diesel', consumption: 6 },
            lpgHeater_portable: { fuelType: 'lpg', consumption: 3 },
            electricHeater_10kW: { fuelType: 'electricity', consumption: 10 },
            dehumidifier_diesel: { fuelType: 'diesel', consumption: 4 },
            dehumidifier_electric: { fuelType: 'electricity', consumption: 5 }
        },
        
        // GRADING & FINISHING
        grading: {
            grader: { fuelType: 'diesel', consumption: 18 },
            scraper: { fuelType: 'diesel', consumption: 35 },
            bulldozer_d6: { fuelType: 'diesel', consumption: 25 },
            bulldozer_d8: { fuelType: 'diesel', consumption: 40 },
            bulldozer_d10: { fuelType: 'diesel', consumption: 60 }
        }
    },
    
    // ============================================================================
    // SCOPE 2: PURCHASED ELECTRICITY
    // ============================================================================
    
    electricity: {
        // State-specific grid emission factors (kg CO2-e per kWh)
        // Updated 2023 - Australian Government National Greenhouse Accounts
        states: {
            nsw: 0.81,          // New South Wales
            vic: 1.02,          // Victoria (brown coal - highest emissions)
            qld: 0.79,          // Queensland
            sa: 0.43,           // South Australia (renewables heavy)
            wa: 0.70,           // Western Australia
            tas: 0.14,          // Tasmania (hydro - very low!)
            act: 0.0,           // ACT (100% renewable target achieved)
            nt: 0.62,           // Northern Territory
            national: 0.81      // National average
        },
        
        // Typical site power consumption (kWh per day)
        siteUsage: {
            siteOffice_small: 30,           // Small demountable
            siteOffice_large: 80,           // Large office complex
            lunchRoom: 25,                  // With fridge, microwave, kettle
            toolCharging: 15,               // Battery tools charging
            siteLighting_basic: 20,         // Basic site lighting
            siteLighting_full: 60,          // Full flood lighting
            securityLighting: 10,           // 24/7 security lights
            waterHeater_electric: 35,       // Hot water for amenities
            hvac_portable: 40               // Heating/cooling units
        }
    },
    
    // ============================================================================
    // SCOPE 3: VALUE CHAIN EMISSIONS
    // ============================================================================
    
    // TRANSPORT EMISSIONS
    transport: {
        // Road transport (kg CO2-e per tonne-km)
        road: {
            rigidTruck: 0.62,               // Small-medium trucks
            articulatedTruck: 0.097,        // Semi-trailers (more efficient per tonne)
            lightCommercial: 0.27           // Vans, utes (per km, not tonne-km)
        },
        
        // Rail (kg CO2-e per tonne-km)
        rail: {
            freight: 0.017                  // Much more efficient than trucks
        },
        
        // Sea freight (kg CO2-e per tonne-km)
        sea: {
            container: 0.008,               // Shipping containers
            bulk: 0.005                     // Bulk carriers
        },
        
        // Air freight (kg CO2-e per tonne-km)
        air: {
            domestic: 1.13,
            international: 0.63             // More efficient over long distances
        },
        
        // Typical transport distances (default assumptions, user can override)
        typicalDistances: {
            concrete: 30,                   // km from batch plant
            steel: 50,                      // km from supplier
            precast: 80,                    // km from precast yard
            timber: 100,                    // km from supplier
            bricks: 60,                     // km from brickworks
            aggregates: 40,                 // km from quarry
            glass: 150                      // km from processor
        }
    },
    
    // WASTE EMISSIONS
    waste: {
        // Disposal emissions (kg CO2-e per kg waste)
        landfill: {
            general: 0.94,                  // Includes methane production
            inert: 0.05,                    // Clean fill, concrete rubble
            hazardous: 1.2                  // Special disposal required
        },
        
        recycling: {
            general: 0.15,                  // Processing emissions
            metal: 0.08,                    // Metal recycling
            concrete: 0.05,                 // Crushing for aggregate
            timber: 0.12                    // Chipping/processing
        },
        
        incineration: {
            energyRecovery: 0.40,           // Waste-to-energy
            noRecovery: 0.85                // Just burning
        },
        
        // Typical waste factors (% of material that becomes waste)
        wastageFactors: {
            concrete: 3,                    // 3% over-order typical
            rebar: 8,                       // Offcuts & overlaps
            timber: 12,                     // Offcuts significant
            plasterboard: 10,               // Cutting waste
            tiles: 7,                       // Cutting & breakage
            paint: 5,                       // Spillage, leftover
            bricks: 5,                      // Cutting & breakage
            cables: 6,                      // Offcuts
            pipes: 8                        // Offcuts
        }
    },
    
    // WATER & CONSUMABLES
    water: {
        // Water treatment & supply (kg CO2-e per kL)
        potable: 0.33,                      // Treated drinking water
        recycled: 0.18,                     // Recycled water (less treatment)
        
        // Wastewater treatment (kg CO2-e per kL)
        wastewater: 0.70                    // Sewage treatment
    },
    
    // EMPLOYEE COMMUTING
    commuting: {
        // Per km per employee (kg CO2-e)
        car_solo: 0.27,                     // Single occupancy
        car_carpool: 0.09,                  // Average 3 people
        publicTransport: 0.04,              // Bus/train
        motorbike: 0.15                     // Motorcycle
    },
    
    // TEMPORARY WORKS (embodied carbon amortized over uses)
    temporaryWorks: {
        // Embodied carbon per use (kg CO2-e per m² per use)
        scaffolding: 2.5,                   // Amortized over ~100 uses
        formwork_timber: 8.0,               // Amortized over ~8 uses
        formwork_steel: 3.0,                // Amortized over ~50 uses
        formwork_aluminum: 2.0,             // Amortized over ~100 uses
        shoring: 3.5,                       // Steel props, amortized over ~80 uses
        hoarding_timber: 12.0,              // Lower reuse rate
        hoarding_steel: 4.0                 // Higher reuse rate
    },
    
    // REFRIGERANTS (for HVAC equipment)
    // These have VERY high Global Warming Potential (GWP)
    refrigerants: {
        r410a: 2088,                        // kg CO2-e per kg refrigerant
        r32: 675,                           // Lower GWP replacement
        r134a: 1430,                        // Common in mobile AC
        r404a: 3922,                        // High GWP, being phased out
        r407c: 1774,                        // Medium GWP
        r290: 3,                            // Propane - very low GWP!
        r744: 1                             // CO2 refrigerant - lowest possible
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EMISSIONS_FACTORS;
}
