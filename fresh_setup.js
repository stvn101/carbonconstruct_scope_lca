/**
 * Fresh Setup - Drop, Recreate, and Load Materials
 * This script will completely reset the unified_materials table
 */

const fs = require('fs');
const path = require('path');

const TARGET_URL = 'https://jaqzoyouuzhchuyzafii.supabase.co';
const TARGET_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphcXpveW91dXpoY2h1eXphZmlpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzgxNDI2OCwiZXhwIjoyMDU5MzkwMjY4fQ.cXc6pTnP8yEyIeGo9u1RaGV7433oTajbpbBKYtuHV6M';

async function runSQL(sql) {
    const response = await fetch(`${TARGET_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
            'apikey': TARGET_KEY,
            'Authorization': `Bearer ${TARGET_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: sql })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`SQL execution failed: ${response.status} - ${error}`);
    }

    return response.json();
}

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
    console.log('🔄 Fresh Setup - Complete Reset and Migration\n');

    try {
        // Step 1: Read and execute the CLEAN_SCHEMA.sql
        console.log('📋 Step 1: Reading schema file...');
        const schemaPath = path.join(__dirname, 'CLEAN_SCHEMA.sql');

        if (!fs.existsSync(schemaPath)) {
            throw new Error('CLEAN_SCHEMA.sql not found!');
        }

        const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
        console.log('✅ Schema file loaded\n');

        console.log('🗑️  Step 2: Dropping old table and creating new one...');
        console.log('   Please run this SQL manually in Supabase SQL Editor:');
        console.log('   https://supabase.com/dashboard/project/jaqzoyouuzhchuyzafii/sql/new\n');
        console.log('=' .repeat(80));
        console.log(schemaSQL);
        console.log('=' .repeat(80));
        console.log('\n⏸️  After running the SQL above, press Ctrl+C to stop this script,');
        console.log('   then wait 30 seconds for cache to refresh, then run:');
        console.log('   node load_materials_only.js\n');

    } catch (error) {
        console.error('\n❌ Setup failed:', error);
        console.error(error.stack);
        process.exit(1);
    }
}

main();
