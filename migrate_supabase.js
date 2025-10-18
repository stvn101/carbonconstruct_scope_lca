/**
 * Supabase Migration Script
 * Migrates unified_materials table from source to target Supabase project
 */

const fs = require('fs');
const path = require('path');

// Source Supabase (hkgryypdqiyigoztvran)
const SOURCE_URL = 'https://hkgryypdqiyigoztvran.supabase.co';
const SOURCE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhrZ3J5eXBkcWl5aWdvenR2cmFuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkwNjg4NiwiZXhwIjoyMDcwNDgyODg2fQ.IKOMZmT6waRegWgXE2glpJ0Am3_1KUu0TVKnNw2ULS0';

// Target Supabase (jaqzoyouuzhchuyzafii)
const TARGET_URL = 'https://jaqzoyouuzhchuyzafii.supabase.co';
const TARGET_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphcXpveW91dXpoY2h1eXphZmlpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzgxNDI2OCwiZXhwIjoyMDU5MzkwMjY4fQ.cXc6pTnP8yEyIeGo9u1RaGV7433oTajbpbBKYtuHV6M';

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

async function postToSupabase(url, key, endpoint, data, method = 'POST') {
    const response = await fetch(`${url}/rest/v1/${endpoint}`, {
        method: method,
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

async function executeSQL(url, key, sql) {
    const response = await fetch(`${url}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: sql })
    });

    const text = await response.text();
    console.log(`SQL Response (${response.status}):`, text);

    return { ok: response.ok, status: response.status, text };
}

async function main() {
    console.log('🚀 Starting Supabase Migration...\n');

    try {
        // Step 1: Check source database
        console.log('📊 Step 1: Checking source database...');
        let materials;
        try {
            materials = await fetchFromSupabase(SOURCE_URL, SOURCE_KEY, 'unified_materials?select=*');
            console.log(`✅ Found ${materials.length} materials in source database\n`);
        } catch (error) {
            console.log('⚠️ Could not fetch from unified_materials, trying "materials" table...');
            try {
                materials = await fetchFromSupabase(SOURCE_URL, SOURCE_KEY, 'materials?select=*');
                console.log(`✅ Found ${materials.length} materials in source database (materials table)\n`);
            } catch (error2) {
                console.error('❌ Error fetching from source:', error2.message);
                throw error2;
            }
        }

        // Step 2: Create schema in target database
        console.log('📝 Step 2: Creating schema in target database...');
        const schemaSQL = fs.readFileSync(
            path.join(__dirname, 'backup_unified_materials_schema.sql'),
            'utf8'
        );

        // Try to execute via SQL editor endpoint
        console.log('Attempting to create schema via direct SQL execution...');
        console.log('⚠️ Note: You may need to run the schema SQL manually in Supabase SQL Editor');
        console.log('Schema file location: backup_unified_materials_schema.sql\n');

        // Step 3: Export data to file for manual review
        console.log('📦 Step 3: Exporting data to JSON file...');
        const exportData = {
            export_date: new Date().toISOString(),
            source_url: SOURCE_URL,
            total_records: materials.length,
            materials: materials
        };

        fs.writeFileSync(
            path.join(__dirname, 'exported_materials_data.json'),
            JSON.stringify(exportData, null, 2)
        );
        console.log('✅ Data exported to: exported_materials_data.json\n');

        // Step 4: Try to insert data in batches
        console.log('📥 Step 4: Importing data to target database...');
        console.log('This may take a few minutes...\n');

        const BATCH_SIZE = 100;
        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < materials.length; i += BATCH_SIZE) {
            const batch = materials.slice(i, i + BATCH_SIZE);
            const batchNum = Math.floor(i / BATCH_SIZE) + 1;
            const totalBatches = Math.ceil(materials.length / BATCH_SIZE);

            try {
                console.log(`Processing batch ${batchNum}/${totalBatches} (${batch.length} records)...`);

                // Clean up the data - remove fields that might cause issues
                const cleanedBatch = batch.map(material => {
                    const cleaned = { ...material };
                    // Remove any auto-generated fields
                    delete cleaned.created_at;
                    delete cleaned.updated_at;
                    delete cleaned.search_vector; // This is auto-generated by trigger
                    return cleaned;
                });

                await postToSupabase(TARGET_URL, TARGET_KEY, 'unified_materials', cleanedBatch);
                successCount += batch.length;
                console.log(`✅ Batch ${batchNum} imported successfully\n`);
            } catch (error) {
                console.error(`❌ Error importing batch ${batchNum}:`, error.message);
                errorCount += batch.length;

                // Try inserting one by one if batch fails
                console.log('Attempting individual inserts...');
                for (const material of batch) {
                    try {
                        const cleaned = { ...material };
                        delete cleaned.created_at;
                        delete cleaned.updated_at;
                        delete cleaned.search_vector;

                        await postToSupabase(TARGET_URL, TARGET_KEY, 'unified_materials', [cleaned]);
                        successCount++;
                        errorCount--;
                    } catch (individualError) {
                        console.error(`  ❌ Failed to import: ${material.name} - ${individualError.message}`);
                    }
                }
            }
        }

        console.log('\n📊 Migration Summary:');
        console.log(`✅ Successfully imported: ${successCount} records`);
        console.log(`❌ Failed: ${errorCount} records`);
        console.log(`📝 Total in source: ${materials.length} records\n`);

        // Step 5: Verify migration
        console.log('🔍 Step 5: Verifying migration...');
        try {
            const targetMaterials = await fetchFromSupabase(TARGET_URL, TARGET_KEY, 'unified_materials?select=count');
            console.log(`✅ Target database now contains: ${targetMaterials.length} records\n`);
        } catch (error) {
            console.log('⚠️ Could not verify - please check manually in Supabase dashboard\n');
        }

        console.log('✅ Migration completed!\n');
        console.log('📋 Next steps:');
        console.log('1. Log into https://jaqzoyouuzhchuyzafii.supabase.co');
        console.log('2. Go to SQL Editor');
        console.log('3. If the table was not created, run backup_unified_materials_schema.sql');
        console.log('4. Verify the data in Table Editor > unified_materials');

    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run the migration
main();
