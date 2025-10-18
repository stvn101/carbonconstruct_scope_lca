/**
 * Fetch ALL materials from source database
 */

const fs = require('fs');
const path = require('path');

// Source Supabase (hkgryypdqiyigoztvran)
const SOURCE_URL = 'https://hkgryypdqiyigoztvran.supabase.co';
const SOURCE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhrZ3J5eXBkcWl5aWdvenR2cmFuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkwNjg4NiwiZXhwIjoyMDcwNDgyODg2fQ.IKOMZmT6waRegWgXE2glpJ0Am3_1KUu0TVKnNw2ULS0';

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

async function main() {
    console.log('🔍 Fetching ALL materials from source database...\n');

    try {
        // First, get the total count
        console.log('📊 Getting total count...');
        const countResponse = await fetch(`${SOURCE_URL}/rest/v1/unified_materials?select=id`, {
            method: 'HEAD',
            headers: {
                'apikey': SOURCE_KEY,
                'Authorization': `Bearer ${SOURCE_KEY}`,
                'Prefer': 'count=exact'
            }
        });

        const contentRange = countResponse.headers.get('content-range');
        const totalCount = contentRange ? parseInt(contentRange.split('/')[1]) : null;
        console.log(`✅ Total materials in source: ${totalCount || 'Unknown'}\n`);

        // Fetch all materials in batches
        const BATCH_SIZE = 1000;
        let allMaterials = [];
        let offset = 0;

        while (true) {
            console.log(`Fetching batch starting at ${offset}...`);
            const batch = await fetchFromSupabase(
                SOURCE_URL,
                SOURCE_KEY,
                `unified_materials?select=*&offset=${offset}&limit=${BATCH_SIZE}`
            );

            if (batch.length === 0) {
                break;
            }

            allMaterials = allMaterials.concat(batch);
            console.log(`  Retrieved ${batch.length} materials (total so far: ${allMaterials.length})`);

            if (batch.length < BATCH_SIZE) {
                // Last batch
                break;
            }

            offset += BATCH_SIZE;
        }

        console.log(`\n✅ Total fetched: ${allMaterials.length} materials\n`);

        // Save to file
        const exportData = {
            export_date: new Date().toISOString(),
            source_url: SOURCE_URL,
            total_records: allMaterials.length,
            materials: allMaterials
        };

        const outputPath = path.join(__dirname, 'all_materials_export.json');
        fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));
        console.log(`💾 Saved to: all_materials_export.json`);

        // Also create a summary
        const categories = {};
        allMaterials.forEach(m => {
            categories[m.category] = (categories[m.category] || 0) + 1;
        });

        console.log('\n📊 Materials by category:');
        Object.entries(categories).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
            console.log(`  ${cat}: ${count} materials`);
        });

        console.log('\n✅ Complete! Ready for migration.');

    } catch (error) {
        console.error('❌ Error:', error);
        console.error(error.stack);
        process.exit(1);
    }
}

main();
