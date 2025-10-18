/**
 * EC3 OAuth Token Generator (Simple Version)
 *
 * USAGE:
 * 1. Edit this file and add your Client ID and Secret below
 * 2. Run: node get-ec3-token-simple.js
 * 3. Copy the Bearer token to your config
 */

// ========================================
// EDIT THESE VALUES:
// ========================================
const CLIENT_ID = 'YOUR_CLIENT_ID_HERE';
const CLIENT_SECRET = 'YOUR_CLIENT_SECRET_HERE';

// OR if you have username/password instead:
const USERNAME = ''; // Optional
const PASSWORD = ''; // Optional
// ========================================

async function getToken() {
    console.log('🔐 EC3 Bearer Token Generator\n');

    // Method 1: Try Client Credentials
    if (CLIENT_ID !== 'YOUR_CLIENT_ID_HERE' && CLIENT_SECRET !== 'YOUR_CLIENT_SECRET_HERE') {
        console.log('Attempting Client ID/Secret authentication...\n');

        try {
            // Try OAuth2 Client Credentials flow
            const response = await fetch('https://buildingtransparency.org/api/rest-auth/login/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    grant_type: 'client_credentials',
                    client_id: CLIENT_ID,
                    client_secret: CLIENT_SECRET
                })
            });

            if (response.ok) {
                const data = await response.json();
                console.log('✅ SUCCESS!\n');
                console.log('Response:', JSON.stringify(data, null, 2));
                console.log('\nYour Bearer Token:', data.access_token || data.token || data.key);
                return;
            } else {
                console.log('❌ Method 1 failed:', response.status, response.statusText);
                const errorText = await response.text();
                console.log('Error:', errorText);
            }
        } catch (error) {
            console.log('Error:', error.message);
        }

        // Try Basic Auth
        console.log('\nTrying Basic Authentication...\n');
        try {
            const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
            const response = await fetch('https://buildingtransparency.org/api/materials?page_size=1', {
                headers: {
                    'Authorization': `Basic ${credentials}`
                }
            });

            if (response.ok) {
                console.log('✅ Basic Auth works!\n');
                console.log('Use this in your headers:');
                console.log(`Authorization: Basic ${credentials}`);
                console.log('\nTo use in EC3 client, update the getAuthHeaders() method.');
                return;
            } else {
                console.log('❌ Basic Auth failed:', response.status);
            }
        } catch (error) {
            console.log('Error:', error.message);
        }
    }

    // Method 2: Try Username/Password
    if (USERNAME && PASSWORD) {
        console.log('\nTrying Username/Password authentication...\n');

        try {
            const response = await fetch('https://buildingtransparency.org/api/rest-auth/login/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: USERNAME,
                    password: PASSWORD
                })
            });

            if (response.ok) {
                const data = await response.json();
                console.log('✅ SUCCESS!\n');
                console.log('Your Bearer Token:', data.key || data.token);
                console.log('\nAdd this to your config files!');
                return;
            } else {
                console.log('❌ Login failed:', response.status);
                const errorText = await response.text();
                console.log('Error:', errorText);
            }
        } catch (error) {
            console.log('Error:', error.message);
        }
    }

    // If nothing worked
    console.log('\n📚 Manual Steps:');
    console.log('1. Log in to: https://buildingtransparency.org/');
    console.log('2. Go to your account/API settings');
    console.log('3. Look for "API Keys" or "Bearer Token"');
    console.log('4. Copy the token and add to your config\n');

    console.log('📧 Or contact Building Transparency support:');
    console.log('   https://buildingtransparency.org/support\n');
}

getToken();
