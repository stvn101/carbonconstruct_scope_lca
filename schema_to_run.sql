
-- Drop table if exists (for clean install)
DROP TABLE IF EXISTS unified_materials CASCADE;

-- Create the unified_materials table
CREATE TABLE unified_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    subcategory TEXT,
    unit TEXT NOT NULL,
    a1a3Factor DECIMAL(10,3),
    a4Factor DECIMAL(10,3),
    a5Factor DECIMAL(10,3),
    b1b5Factor DECIMAL(10,3),
    c1c4Factor DECIMAL(10,3),
    dFactor DECIMAL(10,3),
    scope1Factor DECIMAL(10,6),
    scope2Factor DECIMAL(10,6),
    scope3Factor DECIMAL(10,6),
    source TEXT,
    region TEXT,
    reliability TEXT,
    publishDate TIMESTAMP,
    expiryDate TIMESTAMP,
    ec3Id TEXT,
    ec3Category TEXT,
    epdUrl TEXT,
    manufacturer TEXT,
    createdAt TIMESTAMP DEFAULT NOW(),
    updatedAt TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_unified_materials_category ON unified_materials(category);
CREATE INDEX idx_unified_materials_name ON unified_materials(name);
CREATE INDEX idx_unified_materials_subcategory ON unified_materials(subcategory);
CREATE INDEX idx_unified_materials_region ON unified_materials(region);

-- Enable RLS
ALTER TABLE unified_materials ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access" ON unified_materials FOR SELECT USING (true);

-- Allow service role full access
CREATE POLICY "Allow service role all" ON unified_materials FOR ALL USING (auth.jwt()->>'role' = 'service_role');
