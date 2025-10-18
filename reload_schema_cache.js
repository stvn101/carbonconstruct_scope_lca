/**
 * Reload Supabase PostgREST schema cache
 * This is required after creating new tables
 */

const TARGET_URL = 'https://jaqzoyouuzhchuyzafii.supabase.co';
const TARGET_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphcXpveW91dXpoY2h1eXphZmlpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzgxNDI2OCwiZXhwIjoyMDU5MzkwMjY4fQ.cXc6pTnP8yEyIeGo9u1RaGV7433oTajbpbBKYtuHV6M';

async function reloadCache() {
    console.log('🔄 Attempting to reload PostgREST schema cache...\n');

    // Try the schema reload endpoint
    try {
        const response = await fetch(`${TARGET_URL}/rest/v1/`, {
            method: 'POST',
            headers: {
                'apikey': TARGET_KEY,
                'Authorization': `Bearer ${TARGET_KEY}`,
                'Content-Type': 'application/json',
                'X-Reload-Schema': 'true'
            }
        });

        console.log('Response status:', response.status);
        const text = await response.text();
        console.log('Response:', text.substring(0, 200));

    } catch (error) {
        console.log('Error:', error.message);
    }

    console.log('\n⚠️  If this didn\'t work, you need to reload the schema manually:');
    console.log('\n📋 Manual Schema Reload Steps:');
    console.log('1. Go to Supabase Dashboard > Settings > API');
    console.log('2. Look for "Reload schema" or "Restart project" button');
    console.log('3. Click it and wait 30 seconds');
    console.log('4. Then run: node final_migration.js');
    console.log('\nOR simply wait 1-2 minutes - Supabase auto-reloads schema cache periodically.');
}

reloadCache();
