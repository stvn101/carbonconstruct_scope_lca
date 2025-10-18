/**
 * EC3 OAuth Token Generator
 * Use your Client ID and Client Secret to get a Bearer Token
 */

const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function getEC3Token() {
    console.log('🔐 EC3 OAuth Token Generator\n');
    console.log('This will help you get a Bearer Token for the EC3 API.\n');

    try {
        // Get credentials from user
        const clientId = await question('Enter your EC3 Client ID: ');
        const clientSecret = await question('Enter your EC3 Client Secret: ');

        console.log('\n🔄 Requesting Bearer Token from EC3...\n');

        // EC3 OAuth token endpoint
        const tokenUrl = 'https://buildingtransparency.org/api/rest-auth/login/';

        // Try different OAuth flows
        console.log('Attempting OAuth Client Credentials flow...\n');

        // Method 1: Client Credentials Grant
        try {
            const response = await fetch(tokenUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    grant_type: 'client_credentials',
                    client_id: clientId,
                    client_secret: clientSecret
                })
            });

            if (response.ok) {
                const data = await response.json();

                if (data.access_token || data.token || data.key) {
                    const token = data.access_token || data.token || data.key;
                    console.log('✅ SUCCESS! Your Bearer Token:\n');
                    console.log('─'.repeat(60));
                    console.log(token);
                    console.log('─'.repeat(60));
                    console.log('\n📋 Next Steps:');
                    console.log('1. Copy the token above');
                    console.log('2. Add it to your .env.local:');
                    console.log(`   NEXT_PUBLIC_EC3_BEARER_TOKEN=${token}`);
                    console.log('3. Update js/config.js:');
                    console.log(`   EC3_BEARER_TOKEN: '${token}',`);
                    console.log('\n4. Test with: node test-connections.js\n');

                    if (data.expires_in) {
                        console.log(`⏰ Token expires in: ${data.expires_in} seconds\n`);
                    }

                    rl.close();
                    return;
                }
            }
        } catch (error) {
            console.log('Method 1 failed, trying alternative...\n');
        }

        // Method 2: Try direct authentication endpoint
        console.log('Trying direct authentication endpoint...\n');

        const authResponse = await fetch('https://buildingtransparency.org/api/api-token-auth/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                client_id: clientId,
                client_secret: clientSecret
            })
        });

        if (authResponse.ok) {
            const data = await authResponse.json();
            const token = data.token || data.access_token || data.key;

            if (token) {
                console.log('✅ SUCCESS! Your Bearer Token:\n');
                console.log('─'.repeat(60));
                console.log(token);
                console.log('─'.repeat(60));
                console.log('\n📋 Add this to your configuration files.\n');
                rl.close();
                return;
            }
        }

        // Method 3: Basic Auth with Client Credentials
        console.log('Trying Basic Authentication...\n');

        const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
        const basicAuthResponse = await fetch('https://buildingtransparency.org/api/materials?page_size=1', {
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Accept': 'application/json'
            }
        });

        if (basicAuthResponse.ok) {
            console.log('✅ Basic Auth works! You can use this format:\n');
            console.log('Authorization: Basic ' + credentials);
            console.log('\n📋 Update js/ec3-client.js to use Basic Auth instead.\n');
            rl.close();
            return;
        }

        // If all methods fail
        console.log('❌ Could not authenticate with provided credentials.\n');
        console.log('📚 Please check:');
        console.log('1. Client ID and Secret are correct');
        console.log('2. EC3 API documentation: https://buildingtransparency.org/api/docs');
        console.log('3. Your account has API access enabled');
        console.log('\n💡 Alternative: You may need to:');
        console.log('   - Log in to Building Transparency dashboard');
        console.log('   - Navigate to your API settings');
        console.log('   - Look for "Generate Token" or "API Keys" section');
        console.log('   - Copy the Bearer token directly from there\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.log('\nTry getting the token manually from:');
        console.log('https://buildingtransparency.org/api/docs\n');
    } finally {
        rl.close();
    }
}

// Alternative: If you already have username/password
async function getTokenWithPassword() {
    console.log('\n🔄 Alternative: Username/Password Authentication\n');

    const username = await question('Enter your EC3 username/email: ');
    const password = await question('Enter your EC3 password: ');

    try {
        const response = await fetch('https://buildingtransparency.org/api/rest-auth/login/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        if (response.ok) {
            const data = await response.json();
            const token = data.key || data.token || data.access_token;

            console.log('✅ SUCCESS! Your Bearer Token:\n');
            console.log('─'.repeat(60));
            console.log(token);
            console.log('─'.repeat(60));
            console.log('\n📋 Save this token in your config!\n');
        } else {
            const error = await response.text();
            console.log('❌ Authentication failed:', error);
        }
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        rl.close();
    }
}

// Main menu
async function main() {
    console.log('Choose authentication method:');
    console.log('1. Client ID + Client Secret (recommended)');
    console.log('2. Username + Password');

    const choice = await question('\nEnter choice (1 or 2): ');

    if (choice === '2') {
        await getTokenWithPassword();
    } else {
        await getEC3Token();
    }
}

main();
