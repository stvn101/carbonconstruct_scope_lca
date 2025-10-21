// EC3 OAuth Token Exchange API Endpoint
// This should be deployed as a serverless function or API route

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
        const { code, client_id, redirect_uri } = req.body;

        // Validate required parameters
        if (!code || !client_id || !redirect_uri) {
            return res.status(400).json({
                error: 'Missing required parameters: code, client_id, redirect_uri'
            });
        }

        // EC3 OAuth configuration (store these as environment variables)
        const EC3_CLIENT_SECRET = process.env.EC3_CLIENT_SECRET;
        const EC3_TOKEN_URL = 'https://buildingtransparency.org/api/oauth/token/';

        if (!EC3_CLIENT_SECRET) {
            console.error('EC3_CLIENT_SECRET environment variable not set');
            return res.status(500).json({
                error: 'Server configuration error'
            });
        }

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
                client_id: client_id,
                client_secret: EC3_CLIENT_SECRET,
                code: code,
                redirect_uri: redirect_uri
            })
        });

        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            console.error('EC3 token exchange failed:', tokenResponse.status, errorText);

            return res.status(tokenResponse.status).json({
                error: 'Failed to exchange authorization code',
                details: tokenResponse.status === 400 ? 'Invalid authorization code' : 'Token service unavailable'
            });
        }

        const tokenData = await tokenResponse.json();

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