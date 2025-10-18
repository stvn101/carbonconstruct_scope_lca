/**
 * Direct PostgreSQL Migration
 * Bypasses REST API cache issues by connecting directly to Postgres
 */

const fs = require('fs');
const path = require('path');

// Target database connection string - Session mode
const TARGET_CONNECTION_STRING = 'postgres://postgres:kMazoLUQg9k7Xp0n@db.jaqzoyouuzhchuyzafii.supabase.co:6543/postgres';

async function importWithPg() {
    console.log('🚀 Direct PostgreSQL Migration...\n');

    // Check if pg is installed
    let pg;
    try {
        pg = require('pg');
    } catch (error) {
        console.error('❌ PostgreSQL driver not installed!');
        console.log('\nPlease install it first:');
        console.log('  npm install pg');
        console.log('\nThen run this script again.\n');
        process.exit(1);
    }

    const { Client } = pg;

    // Load data
    console.log('📊 Loading exported data...');
    const exportPath = path.join(__dirname, 'all_materials_export.json');
    const exportData = JSON.parse(fs.readFileSync(exportPath, 'utf8'));
    const materials = exportData.materials;
    console.log(`✅ Loaded ${materials.length} materials\n`);

    // Connect to database
    console.log('🔌 Connecting to PostgreSQL...');
    console.log('⚠️  You need to set the connection string with your database password!\n');

    if (TARGET_CONNECTION_STRING.includes('[YOUR_PASSWORD]')) {
        console.error('❌ Please edit this script and replace [YOUR_PASSWORD] with your actual database password.');
        console.log('\nTo find your password:');
        console.log('1. Go to: https://supabase.com/dashboard/project/jaqzoyouuzhchuyzafii/settings/database');
        console.log('2. Look for "Connection string" > "URI"');
        console.log('3. Copy the connection string (it includes the password)');
        console.log('4. Replace the TARGET_CONNECTION_STRING in this file\n');
        process.exit(1);
    }

    // Disable Node's SSL verification for self-signed certs
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

    const client = new Client({
        connectionString: TARGET_CONNECTION_STRING,
        ssl: true
    });

    try {
        await client.connect();
        console.log('✅ Connected to database\n');

        console.log('📥 Importing materials...');
        let successCount = 0;
        let errorCount = 0;

        const BATCH_SIZE = 500;

        for (let i = 0; i < materials.length; i += BATCH_SIZE) {
            const batch = materials.slice(i, i + BATCH_SIZE);
            const progress = ((i / materials.length) * 100).toFixed(1);

            process.stdout.write(`\rProgress: ${progress}% (${successCount} succeeded, ${errorCount} failed)`);

            // Build batch insert
            const values = [];
            const placeholders = [];
            let paramIndex = 1;

            for (const material of batch) {
                const params = [
                    material.id,
                    material.name,
                    material.category,
                    material.subcategory,
                    material.unit,
                    material.a1a3Factor,
                    material.a4Factor,
                    material.a5Factor,
                    material.b1b5Factor,
                    material.c1c4Factor,
                    material.dFactor,
                    material.scope1Factor,
                    material.scope2Factor,
                    material.scope3Factor,
                    material.source,
                    material.region,
                    material.reliability,
                    material.publishDate,
                    material.expiryDate,
                    material.ec3Id,
                    material.ec3Category,
                    material.epdUrl,
                    material.manufacturer
                ];

                const placeholder = `($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`;
                placeholders.push(placeholder);
                values.push(...params);
            }

            const sql = `
                INSERT INTO unified_materials (
                    id, name, category, subcategory, unit,
                    a1a3Factor, a4Factor, a5Factor, b1b5Factor, c1c4Factor, dFactor,
                    scope1Factor, scope2Factor, scope3Factor,
                    source, region, reliability, publishDate, expiryDate,
                    ec3Id, ec3Category, epdUrl, manufacturer
                ) VALUES ${placeholders.join(', ')}
                ON CONFLICT (id) DO NOTHING
            `;

            try {
                const result = await client.query(sql, values);
                successCount += batch.length;
            } catch (error) {
                // Try individual inserts if batch fails
                for (const material of batch) {
                    try {
                        await client.query(`
                            INSERT INTO unified_materials (
                                id, name, category, subcategory, unit,
                                a1a3Factor, a4Factor, a5Factor, b1b5Factor, c1c4Factor, dFactor,
                                scope1Factor, scope2Factor, scope3Factor,
                                source, region, reliability, publishDate, expiryDate,
                                ec3Id, ec3Category, epdUrl, manufacturer
                            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
                            ON CONFLICT (id) DO NOTHING
                        `, [
                            material.id, material.name, material.category, material.subcategory, material.unit,
                            material.a1a3Factor, material.a4Factor, material.a5Factor, material.b1b5Factor,
                            material.c1c4Factor, material.dFactor, material.scope1Factor, material.scope2Factor,
                            material.scope3Factor, material.source, material.region, material.reliability,
                            material.publishDate, material.expiryDate, material.ec3Id, material.ec3Category,
                            material.epdUrl, material.manufacturer
                        ]);
                        successCount++;
                    } catch (err) {
                        errorCount++;
                    }
                }
            }
        }

        console.log('\n\n📊 Migration Complete!\n');
        console.log(`✅ Successfully imported: ${successCount} materials`);
        console.log(`❌ Failed: ${errorCount} materials`);
        console.log(`📝 Total attempted: ${materials.length} materials\n`);

        // Verify
        const result = await client.query('SELECT COUNT(*) FROM unified_materials');
        console.log(`✅ Database now contains: ${result.rows[0].count} materials\n`);

    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        console.error(error.stack);
    } finally {
        await client.end();
    }
}

importWithPg();
