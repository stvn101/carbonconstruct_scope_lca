/**
 * Reload Supabase PostgREST schema cache
 * This is required after creating new tables
 */

const TARGET_URL = process.env.SUPABASE_URL || 'supabase-url-not-configured';
const TARGET_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'service-role-key-not-configured';

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
