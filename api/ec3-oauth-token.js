// EC3 OAuth Token Exchange API Endpoint
// This should be deployed as a serverless function or API route

const CLIENT_ID = process.env.EC3_CLIENT_ID;
const CLIENT_SECRET = process.env.EC3_CLIENT_SECRET;
const REDIRECT_URI = process.env.EC3_REDIRECT_URI;

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // CORS headers for browser requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const { code } = req.body;

        // Validate required parameters
        if (!code) {
            return res.status(400).json({
                error: 'Missing required parameter: code'
            });
        }

        // Use environment variables only for security
        const finalClientId = CLIENT_ID;
        const finalRedirectUri = REDIRECT_URI;

        if (!finalClientId || !CLIENT_SECRET || !finalRedirectUri) {
            console.error('EC3 OAuth environment variables not fully configured:', {
                hasClientId: !!finalClientId,
                hasClientSecret: !!CLIENT_SECRET,
                hasRedirectUri: !!finalRedirectUri
            });
            return res.status(500).json({
                error: 'Server configuration error',
                message: 'EC3_CLIENT_ID, EC3_CLIENT_SECRET, and EC3_REDIRECT_URI must be set in environment variables'
            });
        }

        // EC3 OAuth configuration
        const EC3_TOKEN_URL = 'https://buildingtransparency.org/api/oauth/token/';

        console.log('Exchanging authorization code for access token...', {
            clientId: finalClientId.substring(0, 10) + '...',
            redirectUri: finalRedirectUri,
            codeLength: code.length
        });

        // Exchange authorization code for access token
        const tokenResponse = await fetch(EC3_TOKEN_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
                'User-Agent': 'CarbonConstruct/1.0'
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                client_id: finalClientId,
                client_secret: CLIENT_SECRET,
                code: code,
                redirect_uri: finalRedirectUri
            })
        });

        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            console.error('EC3 token exchange failed:', tokenResponse.status, errorText);

            let errorMessage = 'Failed to exchange authorization code';
            if (tokenResponse.status === 400) {
                errorMessage = 'Invalid authorization code or client credentials';
            } else if (tokenResponse.status === 401) {
                errorMessage = 'Client authentication failed. Check EC3_CLIENT_SECRET';
            } else if (tokenResponse.status === 403) {
                errorMessage = 'Access forbidden. Check OAuth app permissions';
            }

            return res.status(tokenResponse.status).json({
                error: errorMessage,
                details: errorText,
                status: tokenResponse.status
            });
        }

        const tokenData = await tokenResponse.json();

        console.log('Token exchange successful!', {
            hasAccessToken: !!tokenData.access_token,
            hasRefreshToken: !!tokenData.refresh_token,
            expiresIn: tokenData.expires_in
        });

        // Return the token data to the client
        return res.status(200).json({
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            expires_in: tokenData.expires_in,
            token_type: tokenData.token_type || 'Bearer'
        });

    } catch (error) {
        console.error('OAuth token exchange error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
}