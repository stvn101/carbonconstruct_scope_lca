/**
 * Final Supabase Migration Script
 * Migrates ALL 4346 materials from source to target Supabase project
 */

const fs = require('fs');
const path = require('path');

// Target Supabase (jaqzoyouuzhchuyzafii)
const TARGET_URL = 'https://jaqzoyouuzhchuyzafii.supabase.co';
const TARGET_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphcXpveW91dXpoY2h1eXphZmlpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzgxNDI2OCwiZXhwIjoyMDU5MzkwMjY4fQ.cXc6pTnP8yEyIeGo9u1RaGV7433oTajbpbBKYtuHV6M';

async function postToSupabase(url, key, endpoint, data) {
    const response = await fetch(`${url}/rest/v1/${endpoint}`, {
        method: 'POST',
        headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
        },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Supabase post failed: ${response.status} - ${error}`);
    }

    return true;
}

async function fetchFromSupabase(url, key, query) {
    const response = await fetch(`${url}/rest/v1/${query}`, {
        headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Supabase fetch failed: ${response.status} - ${error}`);
    }

    return response.json();
}

async function main() {
    console.log('🚀 Final Migration - Importing 4346 materials...\n');

    try {
        // Load the exported data
        console.log('📊 Step 1: Loading exported data...');
        const exportPath = path.join(__dirname, 'all_materials_export.json');

        if (!fs.existsSync(exportPath)) {
            throw new Error('all_materials_export.json not found! Run fetch_all_materials.js first.');
        }

        const exportData = JSON.parse(fs.readFileSync(exportPath, 'utf8'));
        const materials = exportData.materials;
        console.log(`✅ Loaded ${materials.length} materials\n`);

        // Check if schema exists
        console.log('🔍 Step 2: Checking target database schema...');
        try {
            const testQuery = await fetchFromSupabase(TARGET_URL, TARGET_KEY, 'unified_materials?select=id&limit=1');
            console.log('✅ Schema exists\n');
        } catch (error) {
            console.log('❌ Schema not found!');
            console.log('\n⚠️  IMPORTANT: Please create the schema first!');
            console.log('1. Go to: https://supabase.com/dashboard/project/jaqzoyouuzhchuyzafii/sql/new');
            console.log('2. Copy and paste the SQL from: unified_materials_actual_schema.sql');
            console.log('3. Run the SQL');
            console.log('4. Then run this script again\n');
            process.exit(1);
        }

        // Import data in batches
        console.log('📥 Step 3: Importing materials...');
        console.log('This will take several minutes. Please be patient.\n');

        const BATCH_SIZE = 100;
        let successCount = 0;
        let errorCount = 0;
        const failedMaterials = [];

        for (let i = 0; i < materials.length; i += BATCH_SIZE) {
            const batch = materials.slice(i, i + BATCH_SIZE);
            const batchNum = Math.floor(i / BATCH_SIZE) + 1;
            const totalBatches = Math.ceil(materials.length / BATCH_SIZE);
            const progress = ((i / materials.length) * 100).toFixed(1);

            process.stdout.write(`\rBatch ${batchNum}/${totalBatches} (${progress}%) - Success: ${successCount}, Failed: ${errorCount}`);

            try {
                // Clean up the data
                const cleanedBatch = batch.map(material => ({
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
                }));

                await postToSupabase(TARGET_URL, TARGET_KEY, 'unified_materials', cleanedBatch);
                successCount += batch.length;

                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 50));

            } catch (error) {
                // Try individual inserts for failed batch
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
                    } catch (individualError) {
                        errorCount++;
                        failedMaterials.push({
                            name: material.name,
                            error: individualError.message
                        });
                    }
                }
            }
        }

        console.log('\n\n📊 Migration Complete!\n');
        console.log(`✅ Successfully imported: ${successCount} materials`);
        console.log(`❌ Failed: ${errorCount} materials`);
        console.log(`📝 Total attempted: ${materials.length} materials\n`);

        if (failedMaterials.length > 0) {
            console.log(`Writing failed materials to failed_materials.json...`);
            fs.writeFileSync(
                path.join(__dirname, 'failed_materials.json'),
                JSON.stringify(failedMaterials, null, 2)
            );
        }

        // Verify migration
        console.log('🔍 Step 4: Verifying migration...');
        try {
            const targetCount = await fetchFromSupabase(TARGET_URL, TARGET_KEY, 'unified_materials?select=id');
            console.log(`✅ Target database contains: ${targetCount.length} materials\n`);

            // Get category breakdown
            const categories = await fetchFromSupabase(TARGET_URL, TARGET_KEY, 'unified_materials?select=category');
            const categoryCount = {};
            categories.forEach(m => {
                categoryCount[m.category] = (categoryCount[m.category] || 0) + 1;
            });

            console.log('📊 Top 10 categories by count:');
            Object.entries(categoryCount)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .forEach(([cat, count]) => {
                    console.log(`  ${cat}: ${count} materials`);
                });

            console.log('\n✅ Migration successful!\n');
            console.log('🔗 View your data:');
            console.log('   https://supabase.com/dashboard/project/jaqzoyouuzhchuyzafii/editor/29332/unified_materials');

        } catch (error) {
            console.log('⚠️ Could not verify - please check manually\n');
        }

    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        console.error(error.stack);
        process.exit(1);
    }
}

main();
