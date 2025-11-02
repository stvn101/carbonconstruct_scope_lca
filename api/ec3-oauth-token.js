// EC3 OAuth Token Exchange API Endpoint
// This should be deployed as a serverless function or API route

const CLIENT_ID = process.env.EC3_CLIENT_ID;
const CLIENT_SECRET = process.env.EC3_CLIENT_SECRET;
const REDIRECT_URI = process.env.EC3_REDIRECT_URI;
const EC3_API_KEY = process.env.NEXT_PUBLIC_EC3_API_KEY;

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

        if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
            console.error('EC3 OAuth environment variables not fully configured');
            return res.status(500).json({
                error: 'Server configuration error'
            });
        }

        // EC3 OAuth configuration
        const EC3_TOKEN_URL = 'https://buildingtransparency.org/api/oauth/token/';

        // Exchange authorization code for access token
        const tokenResponse = await fetch(EC3_TOKEN_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
                'User-Agent': 'CarbonConstruct/1.0',
                ...(EC3_API_KEY ? { 'x-api-key': EC3_API_KEY } : {})
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                code: code,
                redirect_uri: REDIRECT_URI
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