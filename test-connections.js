/**
 * Test Database Connections
 * Run this with Node.js to test Supabase and EC3 connections
 */

const TARGET_URL = 'https://jaqzoyouuzhchuyzafii.supabase.co';
const TARGET_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphcXpveW91dXpoY2h1eXphZmlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4MTQyNjgsImV4cCI6MjA1OTM5MDI2OH0.NRKgoHt0rISen_jzkJpztRwmc4DFMeQDAinCu3eCDRE';
const EC3_API_KEY = 'nK72LVKPVJxFb21fMIFpmtaLawqwvg';

async function testSupabase() {
    console.log('\n📊 Testing Supabase Connection...\n');

    try {
        // Test 1: Get count of materials
        console.log('Test 1: Getting material count...');
        const countResponse = await fetch(`${TARGET_URL}/rest/v1/unified_materials?select=id`, {
            headers: {
                'apikey': TARGET_KEY,
                'Authorization': `Bearer ${TARGET_KEY}`
            }
        });

        if (!countResponse.ok) {
            throw new Error(`HTTP ${countResponse.status}: ${countResponse.statusText}`);
        }

        const materials = await countResponse.json();
        console.log(`✅ Found ${materials.length} materials (limited by pagination)`);

        // Test 2: Get a sample material
        console.log('\nTest 2: Getting sample material...');
        const sampleResponse = await fetch(`${TARGET_URL}/rest/v1/unified_materials?select=*&limit=1`, {
            headers: {
                'apikey': TARGET_KEY,
                'Authorization': `Bearer ${TARGET_KEY}`
            }
        });

        const sampleMaterials = await sampleResponse.json();
        if (sampleMaterials.length > 0) {
            console.log('✅ Sample material retrieved:');
            console.log(`   Name: ${sampleMaterials[0].name}`);
            console.log(`   Category: ${sampleMaterials[0].category}`);
            console.log(`   Unit: ${sampleMaterials[0].unit}`);
            console.log(`   A1-A3 Factor: ${sampleMaterials[0].a1a3_factor}`);
        }

        // Test 3: Get categories
        console.log('\nTest 3: Getting unique categories...');
        const categoriesResponse = await fetch(`${TARGET_URL}/rest/v1/unified_materials?select=category`, {
            headers: {
                'apikey': TARGET_KEY,
                'Authorization': `Bearer ${TARGET_KEY}`
            }
        });

        const allMaterials = await categoriesResponse.json();
        const categories = [...new Set(allMaterials.map(m => m.category))];
        console.log(`✅ Found ${categories.length} unique categories:`);
        categories.slice(0, 10).forEach(cat => console.log(`   - ${cat}`));
        if (categories.length > 10) {
            console.log(`   ... and ${categories.length - 10} more`);
        }

        console.log('\n✅ Supabase: All tests passed!');
        return true;

    } catch (error) {
        console.error('\n❌ Supabase Error:', error.message);
        return false;
    }
}

async function testEC3() {
    console.log('\n🌍 Testing EC3 API Connection...\n');

    try {
        // Test 1: Simple API call
        console.log('Test 1: Testing authentication...');
        const response = await fetch('https://api.buildingtransparency.org/api/materials?page_size=1', {
            headers: {
                'Authorization': `Bearer ${EC3_API_KEY}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log('✅ EC3 API authentication successful');

        if (data.results && data.results.length > 0) {
            console.log('\nTest 2: Sample material from EC3:');
            const material = data.results[0];
            console.log(`   Name: ${material.name || material.product_name}`);
            console.log(`   Category: ${material.category || material.masterformat}`);
            console.log(`   Manufacturer: ${material.manufacturer?.name || 'N/A'}`);
        }

        console.log('\n✅ EC3: All tests passed!');
        return true;

    } catch (error) {
        console.error('\n❌ EC3 Error:', error.message);
        console.log('\nNote: EC3 API might require different authentication method.');
        console.log('Check https://buildingtransparency.org/api/docs for details.');
        return false;
    }
}

async function main() {
    console.log('🧪 CarbonConstruct - Database Connection Tests');
    console.log('=' .repeat(50));

    const supabaseResult = await testSupabase();
    const ec3Result = await testEC3();

    console.log('\n' + '=' .repeat(50));
    console.log('📋 Test Summary:');
    console.log(`   Supabase: ${supabaseResult ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   EC3 API:  ${ec3Result ? '✅ PASS' : '❌ FAIL'}`);
    console.log('=' .repeat(50));

    if (supabaseResult && ec3Result) {
        console.log('\n🎉 All connections working! You can use the app now.');
        console.log('👉 Open http://localhost:8000 to see the application\n');
    } else {
        console.log('\n⚠️  Some connections failed. Check errors above.\n');
    }
}

main();
