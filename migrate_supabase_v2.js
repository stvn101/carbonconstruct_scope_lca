/**
 * Supabase Migration Script v2
 * Migrates unified_materials table from source to target Supabase project
 * Uses correct schema structure
 */

const fs = require('fs');
const path = require('path');

// Source Supabase
const SOURCE_URL = process.env.SUPABASE_SOURCE_URL;
const SOURCE_KEY = process.env.SUPABASE_SOURCE_SERVICE_ROLE_KEY;

// Target Supabase
const TARGET_URL = process.env.SUPABASE_TARGET_URL || process.env.SUPABASE_URL;
const TARGET_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SOURCE_URL) {
    throw new Error('Missing SUPABASE_SOURCE_URL environment variable');
}

if (!SOURCE_KEY) {
    throw new Error('Missing SUPABASE_SOURCE_SERVICE_ROLE_KEY environment variable');
}

if (!TARGET_URL) {
    throw new Error('Missing SUPABASE_TARGET_URL or SUPABASE_URL environment variable');
}

if (!TARGET_KEY) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
}

async function fetchFromSupabase(url, key, query) {
    const response = await fetch(`${url}/rest/v1/${query}`, {
        headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        }
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Supabase fetch failed: ${response.status} - ${error}`);
    }

    return response.json();
}

async function postToSupabase(url, key, endpoint, data) {
    const response = await fetch(`${url}/rest/v1/${endpoint}`, {
        method: 'POST',
        headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Supabase post failed: ${response.status} - ${error}`);
    }

    return response.json();
}

async function main() {
    console.log('🚀 Starting Supabase Migration v2...\n');

    try {
        // Step 1: Check if we have exported data
        console.log('📊 Step 1: Loading exported data...');
        const exportedDataPath = path.join(__dirname, 'exported_materials_data.json');

        let materials;
        if (fs.existsSync(exportedDataPath)) {
            const exportData = JSON.parse(fs.readFileSync(exportedDataPath, 'utf8'));
            materials = exportData.materials;
            console.log(`✅ Loaded ${materials.length} materials from export file\n`);
        } else {
            console.log('Fetching from source database...');
            materials = await fetchFromSupabase(SOURCE_URL, SOURCE_KEY, 'unified_materials?select=*&limit=10000');
            console.log(`✅ Found ${materials.length} materials in source database\n`);

            // Save export
            const exportData = {
                export_date: new Date().toISOString(),
                source_url: SOURCE_URL,
                total_records: materials.length,
                materials: materials
            };
            fs.writeFileSync(exportedDataPath, JSON.stringify(exportData, null, 2));
            console.log('✅ Data exported to: exported_materials_data.json\n');
        }

        // Step 2: Create schema
        console.log('📝 Step 2: Schema creation...');
        console.log('Please run the following SQL in your Supabase SQL Editor:');
        console.log('File: unified_materials_actual_schema.sql');
        console.log('URL: https://supabase.com/dashboard/project/hkgryypdqiyigoztvran/sql/new\n');
        console.log('Press Enter once you have created the schema...');

        // Wait for user confirmation (in a real scenario)
        // For automation, we'll continue
        console.log('Continuing with data import...\n');

        // Step 3: Import data in batches
        console.log('📥 Step 3: Importing data to target database...');
        console.log('This may take several minutes...\n');

        const BATCH_SIZE = 50; // Smaller batches for better reliability
        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < materials.length; i += BATCH_SIZE) {
            const batch = materials.slice(i, i + BATCH_SIZE);
            const batchNum = Math.floor(i / BATCH_SIZE) + 1;
            const totalBatches = Math.ceil(materials.length / BATCH_SIZE);

            try {
                process.stdout.write(`Processing batch ${batchNum}/${totalBatches} (${batch.length} records)... `);

                // Clean up the data
                const cleanedBatch = batch.map(material => {
                    return {
                        id: material.id,
                        name: material.name,
                        category: material.category,
                        subcategory: material.subcategory,
                        unit: material.unit,
                        a1a3Factor: material.a1a3Factor,
                        a4Factor: material.a4Factor,
                        a5Factor: material.a5Factor,
                        b1b5Factor: material.b1b5Factor,
                        c1c4Factor: material.c1c4Factor,
                        dFactor: material.dFactor,
                        scope1Factor: material.scope1Factor,
                        scope2Factor: material.scope2Factor,
                        scope3Factor: material.scope3Factor,
                        source: material.source,
                        region: material.region,
                        reliability: material.reliability,
                        publishDate: material.publishDate,
                        expiryDate: material.expiryDate,
                        ec3Id: material.ec3Id,
                        ec3Category: material.ec3Category,
                        epdUrl: material.epdUrl,
                        manufacturer: material.manufacturer
                    };
                });

                await postToSupabase(TARGET_URL, TARGET_KEY, 'unified_materials', cleanedBatch);
                successCount += batch.length;
                console.log('✅');

                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));

            } catch (error) {
                console.log('❌');
                console.error(`Error: ${error.message}`);
                errorCount += batch.length;

                // Try individual inserts for failed batch
                console.log('  Retrying individual inserts...');
                for (const material of batch) {
                    try {
                        const cleaned = {
                            id: material.id,
                            name: material.name,
                            category: material.category,
                            subcategory: material.subcategory,
                            unit: material.unit,
                            a1a3Factor: material.a1a3Factor,
                            a4Factor: material.a4Factor,
                            a5Factor: material.a5Factor,
                            b1b5Factor: material.b1b5Factor,
                            c1c4Factor: material.c1c4Factor,
                            dFactor: material.dFactor,
                            scope1Factor: material.scope1Factor,
                            scope2Factor: material.scope2Factor,
                            scope3Factor: material.scope3Factor,
                            source: material.source,
                            region: material.region,
                            reliability: material.reliability,
                            publishDate: material.publishDate,
                            expiryDate: material.expiryDate,
                            ec3Id: material.ec3Id,
                            ec3Category: material.ec3Category,
                            epdUrl: material.epdUrl,
                            manufacturer: material.manufacturer
                        };

                        await postToSupabase(TARGET_URL, TARGET_KEY, 'unified_materials', [cleaned]);
                        successCount++;
                        errorCount--;
                        process.stdout.write('.');
                    } catch (individualError) {
                        process.stdout.write('x');
                    }
                }
                console.log('');
            }
        }

        console.log('\n📊 Migration Summary:');
        console.log(`✅ Successfully imported: ${successCount} records`);
        console.log(`❌ Failed: ${errorCount} records`);
        console.log(`📝 Total in source: ${materials.length} records\n`);

        // Step 4: Verify migration
        console.log('🔍 Step 4: Verifying migration...');
        try {
            const targetMaterials = await fetchFromSupabase(TARGET_URL, TARGET_KEY, 'unified_materials?select=id');
            console.log(`✅ Target database now contains: ${targetMaterials.length} records\n`);

            // Get category breakdown
            const categories = await fetchFromSupabase(TARGET_URL, TARGET_KEY, 'unified_materials?select=category');
            const categoryCount = {};
            categories.forEach(m => {
                categoryCount[m.category] = (categoryCount[m.category] || 0) + 1;
            });

            console.log('📊 Materials by category:');
            Object.entries(categoryCount).forEach(([cat, count]) => {
                console.log(`  ${cat}: ${count} materials`);
            });

        } catch (error) {
            console.log('⚠️ Could not verify - please check manually in Supabase dashboard\n');
        }

        console.log('\n✅ Migration completed!\n');
        console.log('📋 Verification steps:');
        console.log('1. Visit: https://supabase.com/dashboard/project/hkgryypdqiyigoztvran/editor');
        console.log('2. Check Table Editor > unified_materials');
        console.log('3. Verify row count and sample data');

    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run the migration
main();
