/**
 * Test both EC3 keys
 */

const KEY1 = process.env.NEXT_PUBLIC_EC3_API_KEY || process.env.EC3_API_KEY;
const KEY2 = process.env.EC3_CLIENT_SECRET;

if (!KEY1) {
    throw new Error('Missing NEXT_PUBLIC_EC3_API_KEY or EC3_API_KEY environment variable');
}

if (!KEY2) {
    throw new Error('Missing EC3_CLIENT_SECRET environment variable');
}

async function testKey(key, name) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing ${name}: ${key}`);
    console.log('='.repeat(60));

    // Test 1: Bearer token
    console.log('\n1️⃣ Testing as Bearer token...');
    try {
        const response = await fetch('https://buildingtransparency.org/api/materials?page_size=1', {
            headers: {
                'Authorization': `Bearer ${key}`,
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            console.log('✅ SUCCESS! Bearer token works!');
            console.log('Sample material:', data.results?.[0]?.name || 'Data received');
            return true;
        } else {
            console.log(`❌ Failed: ${response.status} ${response.statusText}`);
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
    }

    // Test 2: X-API-Key
    console.log('\n2️⃣ Testing as X-API-Key header...');
    try {
        const response = await fetch('https://buildingtransparency.org/api/materials?page_size=1', {
            headers: {
                'X-API-Key': key,
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            console.log('✅ SUCCESS! X-API-Key works!');
            console.log('Sample material:', data.results?.[0]?.name || 'Data received');
            return true;
        } else {
            console.log(`❌ Failed: ${response.status} ${response.statusText}`);
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
    }

    // Test 3: Token header
    console.log('\n3️⃣ Testing as Token header...');
    try {
        const response = await fetch('https://buildingtransparency.org/api/materials?page_size=1', {
            headers: {
                'Token': key,
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            console.log('✅ SUCCESS! Token header works!');
            return true;
        } else {
            console.log(`❌ Failed: ${response.status} ${response.statusText}`);
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
    }

    // Test 4: As query parameter
    console.log('\n4️⃣ Testing as query parameter...');
    try {
        const response = await fetch(`https://buildingtransparency.org/api/materials?page_size=1&token=${key}`, {
            headers: {
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            console.log('✅ SUCCESS! Query parameter works!');
            return true;
        } else {
            console.log(`❌ Failed: ${response.status} ${response.statusText}`);
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
    }

    return false;
}

async function main() {
    console.log('\n🧪 Testing Both EC3 Keys');

    const result1 = await testKey(KEY1, 'KEY 1 (nK72...)');
    const result2 = await testKey(KEY2, 'KEY 2 (UfKI...)');

    console.log('\n' + '='.repeat(60));
    console.log('📋 RESULTS SUMMARY');
    console.log('='.repeat(60));
    console.log(`Key 1 (nK72...): ${result1 ? '✅ WORKS' : '❌ FAILED'}`);
    console.log(`Key 2 (UfKI...): ${result2 ? '✅ WORKS' : '❌ FAILED'}`);
    console.log('='.repeat(60));

    if (result1 || result2) {
        const workingKey = result1 ? KEY1 : KEY2;
        console.log('\n🎉 SUCCESS! Working key found:');
        console.log(workingKey);
        console.log('\n📋 Add this to your config:');
        console.log(`EC3_BEARER_TOKEN: '${workingKey}',`);
    } else {
        console.log('\n⚠️  Neither key works with standard auth methods.');
        console.log('You may need to check Building Transparency documentation.');
    }
}

main();
