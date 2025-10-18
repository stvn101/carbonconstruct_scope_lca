/**
 * Generate EC3 Bearer Token
 */

const CLIENT_SECRET = 'UfKIX9yTjbmYsCnGBfhwtRykzHXasggIt1AhaTHQ';

async function getToken() {
    console.log('🔐 Generating EC3 Bearer Token...\n');

    // Method 1: Try with just the secret as Bearer token
    console.log('Test 1: Using secret directly as Bearer token...');
    try {
        const response = await fetch('https://buildingtransparency.org/api/materials?page_size=1', {
            headers: {
                'Authorization': `Bearer ${CLIENT_SECRET}`,
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            console.log('✅ SUCCESS! Your secret IS the Bearer token!\n');
            console.log('Bearer Token:', CLIENT_SECRET);
            console.log('\nAdd this to your .env.local:');
            console.log(`NEXT_PUBLIC_EC3_BEARER_TOKEN=${CLIENT_SECRET}`);
            console.log('\nAnd to js/config.js:');
            console.log(`EC3_BEARER_TOKEN: '${CLIENT_SECRET}',`);
            return;
        } else {
            console.log(`❌ Failed: ${response.status} ${response.statusText}`);
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
    }

    // Method 2: Try as API Key header
    console.log('\nTest 2: Using secret as X-API-Key...');
    try {
        const response = await fetch('https://buildingtransparency.org/api/materials?page_size=1', {
            headers: {
                'X-API-Key': CLIENT_SECRET,
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            console.log('✅ SUCCESS! Use as X-API-Key header!\n');
            console.log('API Key:', CLIENT_SECRET);
            return;
        } else {
            console.log(`❌ Failed: ${response.status} ${response.statusText}`);
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
    }

    // Method 3: Try as query parameter
    console.log('\nTest 3: Using secret as query parameter...');
    try {
        const response = await fetch(`https://buildingtransparency.org/api/materials?page_size=1&api_key=${CLIENT_SECRET}`, {
            headers: {
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            console.log('✅ SUCCESS! Use as query parameter!\n');
            return;
        } else {
            console.log(`❌ Failed: ${response.status} ${response.statusText}`);
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
    }

    // Method 4: Try different endpoint for token exchange
    console.log('\nTest 4: Trying token endpoint...');
    try {
        const response = await fetch('https://buildingtransparency.org/api/api-token-auth/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token: CLIENT_SECRET
            })
        });

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Token response:', data);
            return;
        } else {
            console.log(`❌ Failed: ${response.status}`);
            const text = await response.text();
            console.log('Response:', text);
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
    }

    console.log('\n📋 Summary:');
    console.log('Could not authenticate with any method.');
    console.log('Your Client Secret:', CLIENT_SECRET);
    console.log('\nNext steps:');
    console.log('1. Check EC3 documentation: https://buildingtransparency.org/api/docs');
    console.log('2. Or contact support: https://buildingtransparency.org/support');
}

getToken();
