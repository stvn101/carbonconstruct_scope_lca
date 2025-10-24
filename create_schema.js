/**
 * Create schema in target Supabase using direct SQL execution
 */

const fs = require('fs');
const path = require('path');

const TARGET_URL = process.env.SUPABASE_TARGET_URL || process.env.SUPABASE_URL;
const TARGET_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!TARGET_URL) {
    throw new Error('Missing SUPABASE_TARGET_URL or SUPABASE_URL environment variable');
}

if (!TARGET_KEY) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
}

// Simplified schema that will definitely work
const SCHEMA_SQL = `
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
`;

async function executeSQL(sql) {
    // Try different endpoints for SQL execution
    const endpoints = [
        '/rest/v1/rpc/query',
        '/rest/v1/rpc/exec',
        '/rest/v1/rpc/exec_sql'
    ];

    for (const endpoint of endpoints) {
        try {
            console.log(`Trying endpoint: ${endpoint}...`);
            const response = await fetch(`${TARGET_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'apikey': TARGET_KEY,
                    'Authorization': `Bearer ${TARGET_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ query: sql })
            });

            const text = await response.text();
            console.log(`Response (${response.status}):`, text.substring(0, 200));

            if (response.ok) {
                return { success: true, response: text };
            }
        } catch (error) {
            console.log(`Failed: ${error.message}`);
        }
    }

    return { success: false };
}

async function main() {
    console.log('🔧 Creating schema in target database...\n');

    console.log('⚠️  Note: Direct SQL execution may not work via REST API.');
    console.log('If this fails, you will need to run the SQL manually.\n');

    const result = await executeSQL(SCHEMA_SQL);

    if (result.success) {
        console.log('\n✅ Schema created successfully!\n');
        console.log('You can now run: node final_migration.js');
    } else {
        console.log('\n❌ Could not create schema via API.\n');
        console.log('Please create the schema manually:');
        console.log('1. Go to: https://supabase.com/dashboard/project/jaqzoyouuzhchuyzafii/sql/new');
        console.log('2. Copy and paste the following SQL:\n');
        console.log('---START SQL---');
        console.log(SCHEMA_SQL);
        console.log('---END SQL---\n');
        console.log('3. Click "Run"');
        console.log('4. Then run: node final_migration.js');

        // Also save to file
        fs.writeFileSync(path.join(__dirname, 'schema_to_run.sql'), SCHEMA_SQL);
        console.log('\nSQL also saved to: schema_to_run.sql');
    }
}

main();
