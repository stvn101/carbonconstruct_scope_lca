/**
 * Materials Database - Embodied Carbon Coefficients
 * 
 * This database contains embodied carbon coefficients for common Australian construction materials.
 * Values are in kg CO2-e per unit (typically per tonne, m³, or m²)
 * 
 * Data sources:
 * - Australian Life Cycle Assessment Database (AusLCI)
 * - ICE Database (Inventory of Carbon & Energy) v3.0
 * - EPD Australasia
 * - GBCA Materials Calculator
 * 
 * Think of this like a material specification sheet, but instead of strength values,
 * we're tracking the carbon "cost" of each material from extraction to factory gate.
 */

const MATERIALS_DATABASE = {
    // CONCRETE PRODUCTS
    // Concrete is like the workhorse of construction - strong and reliable, but carbon-intensive
    concrete: {
        name: "Concrete",
        materials: {
            "concrete-32mpa": {
                name: "32 MPa Concrete (Standard)",
                unit: "m3",
                // This is typical structural concrete - what you'd use for slabs and columns
                embodiedCarbon: 310, // kg CO2-e/m³
                density: 2400, // kg/m³
                lcaStages: {
                    a1a3: 0.90, // 90% happens in production (cement is the killer)
                    a4: 0.05,   // 5% transport
                    a5: 0.05    // 5% installation
                }
            },
            "concrete-40mpa": {
                name: "40 MPa Concrete (High Strength)",
                unit: "m3",
                embodiedCarbon: 370, // kg CO2-e/m³
                density: 2400,
                lcaStages: {
                    a1a3: 0.92,
                    a4: 0.04,
                    a5: 0.04
                }
            },
            "concrete-50mpa": {
                name: "50 MPa Concrete (Very High Strength)",
                unit: "m3",
                embodiedCarbon: 440, // kg CO2-e/m³
                density: 2400,
                lcaStages: {
                    a1a3: 0.93,
                    a4: 0.04,
                    a5: 0.03
                }
            },
            "concrete-gpc-32mpa": {
                name: "32 MPa GPC (Geopolymer - Low Carbon)",
                unit: "m3",
                // This is the future! Geopolymer can cut embodied carbon by 40-80%
                embodiedCarbon: 120, // kg CO2-e/m³
                density: 2400,
                lcaStages: {
                    a1a3: 0.88,
                    a4: 0.06,
                    a5: 0.06
                }
            },
            "concrete-recycled-aggregate": {
                name: "Concrete with 30% Recycled Aggregate",
                unit: "m3",
                embodiedCarbon: 250, // kg CO2-e/m³
                density: 2350,
                lcaStages: {
                    a1a3: 0.85,
                    a4: 0.08,
                    a5: 0.07
                }
            }
        }
    },

    // STEEL PRODUCTS
    // Steel is the backbone of modern construction - strong, durable, but energy-intensive to produce
    steel: {
        name: "Steel",
        materials: {
            "steel-reinforcing-bar": {
                name: "Reinforcing Steel (Rebar)",
                unit: "tonnes",
                // Virgin steel from blast furnace - carbon intensive but incredibly strong
                embodiedCarbon: 2100, // kg CO2-e/tonne
                density: 7850, // kg/m³
                lcaStages: {
                    a1a3: 0.94, // Steel production is the big carbon hit
                    a4: 0.03,
                    a5: 0.03
                }
            },
            "steel-structural-sections": {
                name: "Structural Steel Sections (Beams, Columns)",
                unit: "tonnes",
                embodiedCarbon: 2300, // kg CO2-e/tonne
                density: 7850,
                lcaStages: {
                    a1a3: 0.93,
                    a4: 0.04,
                    a5: 0.03
                }
            },
            "steel-recycled": {
                name: "Recycled Steel (EAF Steel)",
                unit: "tonnes",
                // Electric Arc Furnace steel from scrap - this is the sustainable option!
                // Cuts embodied carbon by about 75% compared to virgin steel
                embodiedCarbon: 550, // kg CO2-e/tonne
                density: 7850,
                lcaStages: {
                    a1a3: 0.90,
                    a4: 0.05,
                    a5: 0.05
                }
            },
            "steel-mesh": {
                name: "Steel Mesh",
                unit: "tonnes",
                embodiedCarbon: 2150, // kg CO2-e/tonne
                density: 7850,
                lcaStages: {
                    a1a3: 0.92,
                    a4: 0.04,
                    a5: 0.04
                }
            }
        }
    },

    // TIMBER PRODUCTS
    // Timber is the carpenter's best friend - and a carbon store!
    // Trees absorb CO2 as they grow, so timber can be carbon-negative in some cases
    timber: {
        name: "Timber",
        materials: {
            "timber-hardwood": {
                name: "Hardwood (Australian Hardwood)",
                unit: "m3",
                // Hardwood has negative embodied carbon because it stores more CO2 than emissions from processing
                embodiedCarbon: -200, // kg CO2-e/m³ (carbon sequestration!)
                density: 900, // kg/m³
                lcaStages: {
                    a1a3: 0.70, // Growing and harvesting
                    a4: 0.20,   // Transport
                    a5: 0.10    // Installation
                }
            },
            "timber-softwood": {
                name: "Softwood (Treated Pine)",
                unit: "m3",
                embodiedCarbon: -150, // kg CO2-e/m³
                density: 550,
                lcaStages: {
                    a1a3: 0.65,
                    a4: 0.25,
                    a5: 0.10
                }
            },
            "timber-lvl": {
                name: "Laminated Veneer Lumber (LVL)",
                unit: "m3",
                // Engineered timber - more processing means higher carbon, but still good
                embodiedCarbon: 350, // kg CO2-e/m³
                density: 650,
                lcaStages: {
                    a1a3: 0.85,
                    a4: 0.08,
                    a5: 0.07
                }
            },
            "timber-glulam": {
                name: "Glue-Laminated Timber (Glulam)",
                unit: "m3",
                embodiedCarbon: 380, // kg CO2-e/m³
                density: 450,
                lcaStages: {
                    a1a3: 0.84,
                    a4: 0.09,
                    a5: 0.07
                }
            },
            "timber-clt": {
                name: "Cross-Laminated Timber (CLT)",
                unit: "m3",
                // CLT is revolutionizing mid-rise construction - strong as steel, light as timber!
                embodiedCarbon: 420, // kg CO2-e/m³
                density: 485,
                lcaStages: {
                    a1a3: 0.86,
                    a4: 0.08,
                    a5: 0.06
                }
            }
        }
    },

    // MASONRY PRODUCTS
    // Bricks and blocks - traditional materials with moderate carbon footprint
    masonry: {
        name: "Masonry",
        materials: {
            "brick-clay-extruded": {
                name: "Clay Brick (Extruded)",
                unit: "tonnes",
                // Firing clay at high temperatures = energy intensive
                embodiedCarbon: 240, // kg CO2-e/tonne
                density: 1800, // kg/m³
                lcaStages: {
                    a1a3: 0.91,
                    a4: 0.05,
                    a5: 0.04
                }
            },
            "brick-clay-pressed": {
                name: "Clay Brick (Pressed)",
                unit: "tonnes",
                embodiedCarbon: 220, // kg CO2-e/tonne
                density: 1900,
                lcaStages: {
                    a1a3: 0.90,
                    a4: 0.05,
                    a5: 0.05
                }
            },
            "block-concrete-hollow": {
                name: "Concrete Block (Hollow)",
                unit: "m2",
                embodiedCarbon: 45, // kg CO2-e/m²
                density: 1400,
                lcaStages: {
                    a1a3: 0.88,
                    a4: 0.06,
                    a5: 0.06
                }
            },
            "block-aac": {
                name: "AAC Block (Autoclaved Aerated Concrete)",
                unit: "m2",
                // AAC is lighter and has better insulation than standard concrete blocks
                embodiedCarbon: 85, // kg CO2-e/m²
                density: 550,
                lcaStages: {
                    a1a3: 0.89,
                    a4: 0.06,
                    a5: 0.05
                }
            }
        }
    },

    // INSULATION PRODUCTS
    // Critical for energy efficiency - saves operational carbon but has embodied carbon
    insulation: {
        name: "Insulation",
        materials: {
            "insulation-glasswool": {
                name: "Glasswool Batts",
                unit: "m2",
                embodiedCarbon: 5.2, // kg CO2-e/m² (R2.5)
                density: 12, // kg/m³
                lcaStages: {
                    a1a3: 0.88,
                    a4: 0.06,
                    a5: 0.06
                }
            },
            "insulation-rockwool": {
                name: "Rockwool/Mineral Wool",
                unit: "m2",
                embodiedCarbon: 6.8, // kg CO2-e/m² (R2.5)
                density: 40,
                lcaStages: {
                    a1a3: 0.87,
                    a4: 0.07,
                    a5: 0.06
                }
            },
            "insulation-polyester": {
                name: "Polyester Insulation",
                unit: "m2",
                embodiedCarbon: 4.5, // kg CO2-e/m² (R2.5)
                density: 15,
                lcaStages: {
                    a1a3: 0.85,
                    a4: 0.08,
                    a5: 0.07
                }
            },
            "insulation-eps": {
                name: "EPS (Expanded Polystyrene)",
                unit: "m2",
                embodiedCarbon: 8.5, // kg CO2-e/m² (per 50mm)
                density: 15,
                lcaStages: {
                    a1a3: 0.92,
                    a4: 0.04,
                    a5: 0.04
                }
            },
            "insulation-xps": {
                name: "XPS (Extruded Polystyrene)",
                unit: "m2",
                embodiedCarbon: 12.5, // kg CO2-e/m² (per 50mm)
                density: 35,
                lcaStages: {
                    a1a3: 0.93,
                    a4: 0.04,
                    a5: 0.03
                }
            }
        }
    },

    // GLAZING & WINDOWS
    // Windows are complex products with high embodied carbon from glass and frames
    glazing: {
        name: "Glazing",
        materials: {
            "glass-float": {
                name: "Float Glass (Single Glazed)",
                unit: "m2",
                embodiedCarbon: 85, // kg CO2-e/m²
                density: 2500, // kg/m³ (6mm glass)
                lcaStages: {
                    a1a3: 0.94,
                    a4: 0.03,
                    a5: 0.03
                }
            },
            "glass-double-glazed": {
                name: "Double Glazed Unit (IGU)",
                unit: "m2",
                embodiedCarbon: 160, // kg CO2-e/m²
                density: 5000,
                lcaStages: {
                    a1a3: 0.93,
                    a4: 0.04,
                    a5: 0.03
                }
            },
            "window-aluminium": {
                name: "Aluminium Window Frame",
                unit: "m2",
                // Aluminium is carbon-intensive but highly recyclable
                embodiedCarbon: 220, // kg CO2-e/m²
                density: 2700,
                lcaStages: {
                    a1a3: 0.95,
                    a4: 0.03,
                    a5: 0.02
                }
            },
            "window-timber": {
                name: "Timber Window Frame",
                unit: "m2",
                embodiedCarbon: 45, // kg CO2-e/m²
                density: 700,
                lcaStages: {
                    a1a3: 0.80,
                    a4: 0.12,
                    a5: 0.08
                }
            },
            "window-upvc": {
                name: "uPVC Window Frame",
                unit: "m2",
                embodiedCarbon: 95, // kg CO2-e/m²
                density: 1400,
                lcaStages: {
                    a1a3: 0.91,
                    a4: 0.05,
                    a5: 0.04
                }
            }
        }
    },

    // FINISHES
    // The stuff that makes buildings look good - often overlooked in carbon calcs!
    finishes: {
        name: "Finishes",
        materials: {
            "plasterboard": {
                name: "Plasterboard / Gypsum Board",
                unit: "m2",
                embodiedCarbon: 6.5, // kg CO2-e/m² (13mm)
                density: 800,
                lcaStages: {
                    a1a3: 0.87,
                    a4: 0.07,
                    a5: 0.06
                }
            },
            "paint-acrylic": {
                name: "Acrylic Paint",
                unit: "m2",
                embodiedCarbon: 0.8, // kg CO2-e/m² (2 coats)
                density: 1300,
                lcaStages: {
                    a1a3: 0.85,
                    a4: 0.05,
                    a5: 0.10
                }
            },
            "ceramic-tiles": {
                name: "Ceramic Floor Tiles",
                unit: "m2",
                embodiedCarbon: 24, // kg CO2-e/m²
                density: 2300,
                lcaStages: {
                    a1a3: 0.91,
                    a4: 0.05,
                    a5: 0.04
                }
            },
            "carpet-nylon": {
                name: "Nylon Carpet",
                unit: "m2",
                embodiedCarbon: 18, // kg CO2-e/m²
                density: 800,
                lcaStages: {
                    a1a3: 0.88,
                    a4: 0.06,
                    a5: 0.06
                }
            },
            "timber-flooring": {
                name: "Timber Flooring (Hardwood)",
                unit: "m2",
                embodiedCarbon: 35, // kg CO2-e/m²
                density: 900,
                lcaStages: {
                    a1a3: 0.75,
                    a4: 0.15,
                    a5: 0.10
                }
            }
        }
    }
};

/**
 * Get all materials for a specific category
 */
function getMaterialsByCategory(category) {
    return MATERIALS_DATABASE[category]?.materials || {};
}

/**
 * Get specific material data
 */
function getMaterialData(category, materialId) {
    return MATERIALS_DATABASE[category]?.materials[materialId];
}

/**
 * Get all categories
 */
function getAllCategories() {
    return Object.keys(MATERIALS_DATABASE).map(key => ({
        id: key,
        name: MATERIALS_DATABASE[key].name
    }));
}

/**
 * Calculate embodied carbon for a material quantity
 */
function calculateMaterialCarbon(category, materialId, quantity) {
    const material = getMaterialData(category, materialId);
    if (!material) return 0;
    
    return material.embodiedCarbon * quantity;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        MATERIALS_DATABASE,
        getMaterialsByCategory,
        getMaterialData,
        getAllCategories,
        calculateMaterialCarbon
    };
}
