/**
 * Load Materials with snake_case columns
 * Compatible with PostgreSQL naming conventions
 */

const fs = require('fs');
const path = require('path');

const TARGET_URL = 'https://jaqzoyouuzhchuyzafii.supabase.co';
const TARGET_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphcXpveW91dXpoY2h1eXphZmlpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzgxNDI2OCwiZXhwIjoyMDU5MzkwMjY4fQ.cXc6pTnP8yEyIeGo9u1RaGV7433oTajbpbBKYtuHV6M';

async function postToSupabase(endpoint, data) {
    const response = await fetch(`${TARGET_URL}/rest/v1/${endpoint}`, {
        method: 'POST',
        headers: {
            'apikey': TARGET_KEY,
            'Authorization': `Bearer ${TARGET_KEY}`,
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

async function fetchFromSupabase(query) {
    const response = await fetch(`${TARGET_URL}/rest/v1/${query}`, {
        headers: {
            'apikey': TARGET_KEY,
            'Authorization': `Bearer ${TARGET_KEY}`,
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
    console.log('📦 Loading Materials with snake_case columns\n');

    try {
        // Load the exported data
        console.log('📊 Step 1: Loading exported data...');
        const exportPath = path.join(__dirname, 'all_materials_export.json');

        if (!fs.existsSync(exportPath)) {
            throw new Error('all_materials_export.json not found!');
        }

        const exportData = JSON.parse(fs.readFileSync(exportPath, 'utf8'));
        const materials = exportData.materials;
        console.log(`✅ Loaded ${materials.length} materials\n`);

        // Check if schema exists and cache is ready
        console.log('🔍 Step 2: Testing schema cache...');
        try {
            const testQuery = await fetchFromSupabase('unified_materials?select=id&limit=1');
            console.log('✅ Schema cache is ready\n');
        } catch (error) {
            console.log('❌ Schema cache not ready!');
            console.log('\n⚠️  The table might not exist or the cache needs more time.');
            console.log('Error:', error.message);
            console.log('\nPlease:');
            console.log('1. Make sure you ran the FINAL_SCHEMA.sql');
            console.log('2. Wait 30 more seconds and try again\n');
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
                // Convert camelCase to snake_case
                const cleanedBatch = batch.map(material => ({
                    id: material.id,
                    name: material.name,
                    category: material.category,
                    subcategory: material.subcategory,
                    unit: material.unit,
                    a1a3_factor: material.a1a3Factor,
                    a4_factor: material.a4Factor,
                    a5_factor: material.a5Factor,
                    b1b5_factor: material.b1b5Factor,
                    c1c4_factor: material.c1c4Factor,
                    d_factor: material.dFactor,
                    scope1_factor: material.scope1Factor,
                    scope2_factor: material.scope2Factor,
                    scope3_factor: material.scope3Factor,
                    source: material.source,
                    region: material.region,
                    reliability: material.reliability,
                    publish_date: material.publishDate,
                    expiry_date: material.expiryDate,
                    ec3_id: material.ec3Id,
                    ec3_category: material.ec3Category,
                    epd_url: material.epdUrl,
                    manufacturer: material.manufacturer
                }));

                await postToSupabase('unified_materials', cleanedBatch);
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
                            a1a3_factor: material.a1a3Factor,
                            a4_factor: material.a4Factor,
                            a5_factor: material.a5Factor,
                            b1b5_factor: material.b1b5Factor,
                            c1c4_factor: material.c1c4Factor,
                            d_factor: material.dFactor,
                            scope1_factor: material.scope1Factor,
                            scope2_factor: material.scope2Factor,
                            scope3_factor: material.scope3Factor,
                            source: material.source,
                            region: material.region,
                            reliability: material.reliability,
                            publish_date: material.publishDate,
                            expiry_date: material.expiryDate,
                            ec3_id: material.ec3Id,
                            ec3_category: material.ec3Category,
                            epd_url: material.epdUrl,
                            manufacturer: material.manufacturer
                        };

                        await postToSupabase('unified_materials', [cleaned]);
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
            const targetCount = await fetchFromSupabase('unified_materials?select=id');
            console.log(`✅ Database now contains: ${targetCount.length} materials\n`);

            // Get category breakdown
            const categories = await fetchFromSupabase('unified_materials?select=category');
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
            console.log('   https://supabase.com/dashboard/project/jaqzoyouuzhchuyzafii/editor');

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
