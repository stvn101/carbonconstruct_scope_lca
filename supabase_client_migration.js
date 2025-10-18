/**
 * Migration using Supabase JavaScript client
 * This should work better with authentication
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const TARGET_URL = 'https://jaqzoyouuzhchuyzafii.supabase.co';
const TARGET_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphcXpveW91dXpoY2h1eXphZmlpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzgxNDI2OCwiZXhwIjoyMDU5MzkwMjY4fQ.cXc6pTnP8yEyIeGo9u1RaGV7433oTajbpbBKYtuHV6M';

async function migrate() {
    console.log('🚀 Supabase Client Migration...\n');

    // Load data
    console.log('📊 Loading exported data...');
    const exportPath = path.join(__dirname, 'all_materials_export.json');
    const exportData = JSON.parse(fs.readFileSync(exportPath, 'utf8'));
    const materials = exportData.materials;
    console.log(`✅ Loaded ${materials.length} materials\n`);

    // Create Supabase client
    console.log('🔌 Connecting to Supabase...');
    const supabase = createClient(TARGET_URL, TARGET_KEY, {
        auth: {
            persistSession: false
        }
    });
    console.log('✅ Connected\n');

    console.log('📥 Importing materials...');
    console.log('This will take several minutes. Please be patient.\n');

    let successCount = 0;
    let errorCount = 0;
    const BATCH_SIZE = 500;

    for (let i = 0; i < materials.length; i += BATCH_SIZE) {
        const batch = materials.slice(i, i + BATCH_SIZE);
        const progress = ((i / materials.length) * 100).toFixed(1);

        process.stdout.write(`\rProgress: ${progress}% (${successCount} succeeded, ${errorCount} failed)     `);

        // Clean the batch
        const cleanedBatch = batch.map(m => ({
            id: m.id,
            name: m.name,
            category: m.category,
            subcategory: m.subcategory,
            unit: m.unit,
            a1a3Factor: m.a1a3Factor,
            a4Factor: m.a4Factor,
            a5Factor: m.a5Factor,
            b1b5Factor: m.b1b5Factor,
            c1c4Factor: m.c1c4Factor,
            dFactor: m.dFactor,
            scope1Factor: m.scope1Factor,
            scope2Factor: m.scope2Factor,
            scope3Factor: m.scope3Factor,
            source: m.source,
            region: m.region,
            reliability: m.reliability,
            publishDate: m.publishDate,
            expiryDate: m.expiryDate,
            ec3Id: m.ec3Id,
            ec3Category: m.ec3Category,
            epdUrl: m.epdUrl,
            manufacturer: m.manufacturer
        }));

        // Try batch insert
        const { data, error } = await supabase
            .from('unified_materials')
            .upsert(cleanedBatch, { onConflict: 'id' });

        if (error) {
            // Try individual inserts
            for (const material of cleanedBatch) {
                const { error: individualError } = await supabase
                    .from('unified_materials')
                    .upsert([material], { onConflict: 'id' });

                if (individualError) {
                    errorCount++;
                } else {
                    successCount++;
                }
            }
        } else {
            successCount += batch.length;
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n\n📊 Migration Complete!\n');
    console.log(`✅ Successfully imported: ${successCount} materials`);
    console.log(`❌ Failed: ${errorCount} materials`);
    console.log(`📝 Total attempted: ${materials.length} materials\n`);

    // Verify
    const { count, error } = await supabase
        .from('unified_materials')
        .select('*', { count: 'exact', head: true });

    if (!error) {
        console.log(`✅ Database now contains: ${count} materials\n`);
    }

    console.log('🔗 View your data:');
    console.log('   https://supabase.com/dashboard/project/jaqzoyouuzhchuyzafii/editor\n');
}

migrate().catch(console.error);
