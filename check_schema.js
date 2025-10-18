/**
 * Check what schema exists in target database
 */

const TARGET_URL = 'https://jaqzoyouuzhchuyzafii.supabase.co';
const TARGET_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphcXpveW91dXpoY2h1eXphZmlpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzgxNDI2OCwiZXhwIjoyMDU5MzkwMjY4fQ.cXc6pTnP8yEyIeGo9u1RaGV7433oTajbpbBKYtuHV6M';

async function checkSchema() {
    console.log('🔍 Checking schema in target database...\n');

    try {
        // Try to get the table structure by querying for a non-existent ID
        const response = await fetch(`${TARGET_URL}/rest/v1/unified_materials?id=eq.00000000-0000-0000-0000-000000000000`, {
            headers: {
                'apikey': TARGET_KEY,
                'Authorization': `Bearer ${TARGET_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const headers = {};
        response.headers.forEach((value, key) => {
            headers[key] = value;
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', JSON.stringify(headers, null, 2));

        // Try inserting a test record to see what columns are expected
        console.log('\n🧪 Testing insert to see column structure...\n');

        const testData = {
            name: "TEST_MATERIAL",
            category: "TEST",
            unit: "m3"
        };

        const insertResponse = await fetch(`${TARGET_URL}/rest/v1/unified_materials`, {
            method: 'POST',
            headers: {
                'apikey': TARGET_KEY,
                'Authorization': `Bearer ${TARGET_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(testData)
        });

        const insertResult = await insertResponse.text();
        console.log('Insert test status:', insertResponse.status);
        console.log('Insert test response:', insertResult);

        // Try to check OPTIONS to see available columns
        console.log('\n📋 Checking available endpoints...\n');
        const optionsResponse = await fetch(`${TARGET_URL}/rest/v1/unified_materials`, {
            method: 'OPTIONS',
            headers: {
                'apikey': TARGET_KEY,
                'Authorization': `Bearer ${TARGET_KEY}`
            }
        });

        console.log('OPTIONS status:', optionsResponse.status);
        const optionsHeaders = {};
        optionsResponse.headers.forEach((value, key) => {
            optionsHeaders[key] = value;
        });
        console.log('OPTIONS headers:', JSON.stringify(optionsHeaders, null, 2));

    } catch (error) {
        console.error('Error:', error);
    }
}

checkSchema();
