-- ============================================================================
-- UNIFIED_MATERIALS TABLE - SUPABASE DATABASE SCHEMA
-- ============================================================================
--
-- This is the complete schema for the unified_materials table containing
-- 4,500+ Australian construction materials including 3,500+ EPD Australasia
-- verified Environmental Product Declarations (EPDs).
--
-- Database: Supabase (PostgreSQL)
-- Table Name: unified_materials (or 'materials')
-- Purpose: Comprehensive materials database for CarbonConstruct LCA calculator
--
-- ============================================================================

-- Create the unified_materials table
CREATE TABLE IF NOT EXISTS unified_materials (
    -- ========================================================================
    -- PRIMARY KEY
    -- ========================================================================
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- ========================================================================
    -- BASIC IDENTIFICATION FIELDS
    -- ========================================================================

    -- Material name (e.g., "32 MPa Concrete", "Reinforcing Steel Bar")
    name TEXT NOT NULL,

    -- Main category (e.g., "concrete", "steel", "timber", "masonry", "insulation")
    category TEXT NOT NULL,

    -- Subcategory for finer classification (e.g., "structural", "reinforcing", "engineered")
    subcategory TEXT,

    -- Detailed description of the material and its typical uses
    description TEXT,

    -- Manufacturer or brand name (if applicable)
    manufacturer TEXT,

    -- Product code or SKU
    product_code TEXT,

    -- ========================================================================
    -- EMBODIED CARBON DATA (CORE METRICS)
    -- ========================================================================

    -- Total embodied carbon coefficient (kg CO2-e per unit)
    -- This is the PRIMARY value used in calculations
    embodied_carbon DECIMAL(10,3) NOT NULL,

    -- Unit of measurement (e.g., "m3", "tonnes", "m2", "kg", "each")
    unit TEXT NOT NULL,

    -- Alternative units (JSON array) - e.g., ["kg", "tonnes", "m3"]
    alternative_units JSONB,

    -- ========================================================================
    -- LCA STAGE BREAKDOWN (Life Cycle Assessment)
    -- ========================================================================
    -- These percentages should add up to 1.0 (100%)

    -- A1-A3: Product stage (raw material extraction, transport, manufacturing)
    -- This is typically 85-95% of total embodied carbon
    a1_a3 DECIMAL(4,3) DEFAULT 0.90,

    -- A4: Transport to site
    -- Typically 3-10% depending on distance
    a4 DECIMAL(4,3) DEFAULT 0.05,

    -- A5: Construction/Installation process
    -- Typically 3-10%
    a5 DECIMAL(4,3) DEFAULT 0.05,

    -- Optional: End of life stages (if you have data)
    c1_c4 DECIMAL(4,3), -- Deconstruction, transport, waste processing, disposal
    d DECIMAL(4,3),      -- Benefits beyond system boundary (recycling credits)

    -- ========================================================================
    -- EPD (ENVIRONMENTAL PRODUCT DECLARATION) DATA
    -- ========================================================================

    -- Data source (e.g., "EPD Australasia", "ICE Database", "AusLCI", "EC3")
    source TEXT NOT NULL,

    -- Official EPD reference number (if EPD Australasia verified)
    epd_number TEXT,

    -- EPD document URL or reference
    epd_url TEXT,

    -- EPD valid from date
    valid_from DATE,

    -- EPD valid until date (EPDs typically expire after 5 years)
    valid_until DATE,

    -- Is this an EPD Australasia verified material?
    is_epd_verified BOOLEAN DEFAULT FALSE,

    -- Is this an industry-wide EPD or product-specific?
    epd_type TEXT, -- "product-specific", "industry-average", "generic"

    -- ========================================================================
    -- PHYSICAL PROPERTIES
    -- ========================================================================

    -- Density (kg/m3) - used for unit conversions
    density DECIMAL(8,2),

    -- Strength (MPa) - for concrete/steel/structural materials
    strength_mpa DECIMAL(8,2),

    -- Thermal conductivity (W/mK) - for insulation materials
    thermal_conductivity DECIMAL(6,4),

    -- R-value (m2K/W) - for insulation materials
    r_value DECIMAL(6,3),

    -- ========================================================================
    -- SUSTAINABILITY ATTRIBUTES
    -- ========================================================================

    -- Percentage of recycled content (0-100)
    recycled_content DECIMAL(5,2),

    -- Percentage recyclable at end of life (0-100)
    recyclability DECIMAL(5,2),

    -- Is material FSC/PEFC certified? (for timber)
    certified_sustainable BOOLEAN DEFAULT FALSE,

    -- Carbon sequestration (negative carbon) - for timber products
    carbon_sequestration DECIMAL(10,3),

    -- Biogenic carbon content (kg CO2) - carbon stored in material
    biogenic_carbon DECIMAL(10,3),

    -- ========================================================================
    -- AUSTRALIAN SPECIFIC DATA
    -- ========================================================================

    -- Australian state/territory of manufacture (NSW, VIC, QLD, SA, WA, TAS, NT, ACT)
    state_origin TEXT,

    -- Is this manufactured in Australia?
    australian_made BOOLEAN DEFAULT FALSE,

    -- Regional availability (JSON array of states where available)
    regional_availability JSONB,

    -- ========================================================================
    -- COST & ECONOMIC DATA (Optional)
    -- ========================================================================

    -- Typical cost per unit (AUD) - helps with cost-carbon tradeoff analysis
    typical_cost DECIMAL(10,2),

    -- Currency
    currency TEXT DEFAULT 'AUD',

    -- Cost reference year
    cost_year INTEGER,

    -- ========================================================================
    -- SEARCH & FILTERING
    -- ========================================================================

    -- Tags for search (JSON array) - e.g., ["low-carbon", "recycled", "sustainable"]
    tags JSONB,

    -- Full-text search vector (auto-generated)
    search_vector TSVECTOR,

    -- ========================================================================
    -- DATA QUALITY & PROVENANCE
    -- ========================================================================

    -- Data quality rating (1-5 stars)
    -- 5 = Product-specific EPD, 3 = Industry average, 1 = Generic estimate
    data_quality INTEGER CHECK (data_quality BETWEEN 1 AND 5),

    -- Data source organization
    data_source_org TEXT,

    -- Reference document or standard (e.g., "AS/NZS ISO 14025:2013")
    reference_standard TEXT,

    -- Geographic validity (e.g., "Australia", "Global", "NSW only")
    geographic_validity TEXT DEFAULT 'Australia',

    -- Technology/process description
    technology TEXT,

    -- ========================================================================
    -- ADDITIONAL METADATA
    -- ========================================================================

    -- Notes or special considerations
    notes TEXT,

    -- Internal reference or ID from original database
    original_id TEXT,

    -- Is this material active/available?
    is_active BOOLEAN DEFAULT TRUE,

    -- Created timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Last updated timestamp
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Created by (user ID or system)
    created_by TEXT,

    -- Last updated by
    updated_by TEXT
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Primary search indexes
CREATE INDEX idx_unified_materials_category ON unified_materials(category);
CREATE INDEX idx_unified_materials_name ON unified_materials(name);
CREATE INDEX idx_unified_materials_source ON unified_materials(source);

-- EPD filtering
CREATE INDEX idx_unified_materials_epd_verified ON unified_materials(is_epd_verified) WHERE is_epd_verified = TRUE;
CREATE INDEX idx_unified_materials_epd_number ON unified_materials(epd_number) WHERE epd_number IS NOT NULL;

-- Australian materials filtering
CREATE INDEX idx_unified_materials_australian ON unified_materials(australian_made) WHERE australian_made = TRUE;
CREATE INDEX idx_unified_materials_state ON unified_materials(state_origin);

-- Active materials only
CREATE INDEX idx_unified_materials_active ON unified_materials(is_active) WHERE is_active = TRUE;

-- Full-text search index
CREATE INDEX idx_unified_materials_search ON unified_materials USING GIN(search_vector);

-- Composite indexes for common queries
CREATE INDEX idx_unified_materials_category_active ON unified_materials(category, is_active);
CREATE INDEX idx_unified_materials_category_epd ON unified_materials(category, is_epd_verified);

-- ============================================================================
-- FULL-TEXT SEARCH TRIGGER
-- ============================================================================

-- Create function to update search vector
CREATE OR REPLACE FUNCTION update_unified_materials_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.category, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(NEW.manufacturer, '')), 'D');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_update_search_vector
BEFORE INSERT OR UPDATE ON unified_materials
FOR EACH ROW
EXECUTE FUNCTION update_unified_materials_search_vector();

-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_update_timestamp
BEFORE UPDATE ON unified_materials
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE unified_materials ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for calculator users)
CREATE POLICY "Allow public read access"
ON unified_materials
FOR SELECT
USING (is_active = TRUE);

-- Only authenticated users can insert/update/delete
CREATE POLICY "Allow authenticated insert"
ON unified_materials
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update"
ON unified_materials
FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated delete"
ON unified_materials
FOR DELETE
USING (auth.role() = 'authenticated');

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- Active EPD-verified materials only
CREATE VIEW v_epd_materials AS
SELECT *
FROM unified_materials
WHERE is_epd_verified = TRUE
  AND is_active = TRUE
  AND (valid_until IS NULL OR valid_until > CURRENT_DATE);

-- Australian-made materials only
CREATE VIEW v_australian_materials AS
SELECT *
FROM unified_materials
WHERE australian_made = TRUE
  AND is_active = TRUE;

-- Materials by category with counts
CREATE VIEW v_materials_by_category AS
SELECT
    category,
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE is_epd_verified = TRUE) as epd_count,
    COUNT(*) FILTER (WHERE australian_made = TRUE) as australian_count,
    AVG(embodied_carbon) as avg_embodied_carbon
FROM unified_materials
WHERE is_active = TRUE
GROUP BY category;

-- ============================================================================
-- EXAMPLE QUERIES
-- ============================================================================

-- Search for materials
-- SELECT * FROM unified_materials
-- WHERE search_vector @@ to_tsquery('english', 'concrete & 32mpa');

-- Get all active EPD-verified concrete materials
-- SELECT * FROM unified_materials
-- WHERE category = 'concrete'
--   AND is_epd_verified = TRUE
--   AND is_active = TRUE;

-- Get materials by state
-- SELECT * FROM unified_materials
-- WHERE state_origin = 'NSW'
--   AND is_active = TRUE;

-- Get low-carbon alternatives (< 200 kg CO2-e per unit)
-- SELECT * FROM unified_materials
-- WHERE embodied_carbon < 200
--   AND unit = 'm3'
--   AND category = 'concrete';

-- ============================================================================
-- BACKUP & EXPORT
-- ============================================================================

-- To backup the entire table:
-- COPY unified_materials TO '/path/to/backup_unified_materials.csv' WITH CSV HEADER;

-- To restore from backup:
-- COPY unified_materials FROM '/path/to/backup_unified_materials.csv' WITH CSV HEADER;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
