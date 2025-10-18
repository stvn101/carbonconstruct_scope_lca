-- DROP and CREATE with snake_case column names (PostgreSQL compatible)
DROP TABLE IF EXISTS unified_materials CASCADE;

CREATE TABLE unified_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    subcategory TEXT,
    unit TEXT NOT NULL,
    a1a3_factor DECIMAL(10,3),
    a4_factor DECIMAL(10,3),
    a5_factor DECIMAL(10,3),
    b1b5_factor DECIMAL(10,3),
    c1c4_factor DECIMAL(10,3),
    d_factor DECIMAL(10,3),
    scope1_factor DECIMAL(10,6),
    scope2_factor DECIMAL(10,6),
    scope3_factor DECIMAL(10,6),
    source TEXT,
    region TEXT,
    reliability TEXT,
    publish_date TIMESTAMP,
    expiry_date TIMESTAMP,
    ec3_id TEXT,
    ec3_category TEXT,
    epd_url TEXT,
    manufacturer TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_unified_materials_category ON unified_materials(category);
CREATE INDEX idx_unified_materials_name ON unified_materials(name);
CREATE INDEX idx_unified_materials_subcategory ON unified_materials(subcategory);
CREATE INDEX idx_unified_materials_region ON unified_materials(region);

ALTER TABLE unified_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON unified_materials FOR SELECT USING (true);
CREATE POLICY "Allow service role all" ON unified_materials FOR ALL USING (auth.jwt()->>'role' = 'service_role');
