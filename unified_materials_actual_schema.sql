-- ============================================================================
-- UNIFIED_MATERIALS TABLE - ACTUAL SCHEMA FROM SOURCE DATABASE
-- ============================================================================
-- This matches the actual structure from hkgryypdqiyigoztvran.supabase.co
-- ============================================================================

-- Create the unified_materials table
CREATE TABLE IF NOT EXISTS unified_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Material identification
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    subcategory TEXT,
    unit TEXT NOT NULL,

    -- LCA stage factors (kg CO2-e)
    a1a3Factor DECIMAL(10,3),      -- Product stage (raw material, transport, manufacturing)
    a4Factor DECIMAL(10,3),         -- Transport to site
    a5Factor DECIMAL(10,3),         -- Construction/Installation
    b1b5Factor DECIMAL(10,3),       -- Use stage
    c1c4Factor DECIMAL(10,3),       -- End of life (deconstruction, transport, waste, disposal)
    dFactor DECIMAL(10,3),          -- Benefits beyond system boundary

    -- Scope breakdown factors
    scope1Factor DECIMAL(10,6),     -- Direct emissions
    scope2Factor DECIMAL(10,6),     -- Indirect emissions (electricity)
    scope3Factor DECIMAL(10,6),     -- Other indirect emissions

    -- Data source and metadata
    source TEXT,
    region TEXT,
    reliability TEXT,
    publishDate TIMESTAMP,
    expiryDate TIMESTAMP,

    -- EC3 integration
    ec3Id TEXT,
    ec3Category TEXT,
    epdUrl TEXT,

    -- Additional fields
    manufacturer TEXT,

    -- Timestamps
    createdAt TIMESTAMP DEFAULT NOW(),
    updatedAt TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_unified_materials_category ON unified_materials(category);
CREATE INDEX IF NOT EXISTS idx_unified_materials_name ON unified_materials(name);
CREATE INDEX IF NOT EXISTS idx_unified_materials_subcategory ON unified_materials(subcategory);
CREATE INDEX IF NOT EXISTS idx_unified_materials_region ON unified_materials(region);
CREATE INDEX IF NOT EXISTS idx_unified_materials_manufacturer ON unified_materials(manufacturer);
CREATE INDEX IF NOT EXISTS idx_unified_materials_source ON unified_materials(source);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_unified_materials_category_region ON unified_materials(category, region);
CREATE INDEX IF NOT EXISTS idx_unified_materials_category_subcategory ON unified_materials(category, subcategory);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_unified_materials_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updatedAt = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_unified_materials_timestamp
BEFORE UPDATE ON unified_materials
FOR EACH ROW
EXECUTE FUNCTION update_unified_materials_timestamp();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS
ALTER TABLE unified_materials ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access"
ON unified_materials
FOR SELECT
USING (true);

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
-- VIEWS
-- ============================================================================

-- Materials by category with stats
CREATE OR REPLACE VIEW v_materials_by_category AS
SELECT
    category,
    COUNT(*) as total_count,
    AVG(a1a3Factor) as avg_a1a3,
    COUNT(DISTINCT region) as region_count,
    COUNT(DISTINCT manufacturer) as manufacturer_count
FROM unified_materials
GROUP BY category;

-- High reliability materials
CREATE OR REPLACE VIEW v_high_reliability_materials AS
SELECT *
FROM unified_materials
WHERE reliability = 'High';

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
