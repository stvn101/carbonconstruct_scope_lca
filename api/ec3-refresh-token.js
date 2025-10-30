// EC3 OAuth Token Refresh API Endpoint
// Refreshes expired access tokens using refresh token

const CLIENT_ID = process.env.EC3_CLIENT_ID;
const CLIENT_SECRET = process.env.EC3_CLIENT_SECRET;

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // CORS headers
    const allowedOrigins = ['https://carbonconstruct.com.au', 'http://localhost:3000'];
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const { refresh_token } = req.body;

        // Validate required parameters
        if (!refresh_token) {
            return res.status(400).json({
                error: 'Missing required parameter: refresh_token'
            });
        }

        if (!CLIENT_ID || !CLIENT_SECRET) {
            console.error('EC3 OAuth environment variables not configured');
            return res.status(500).json({
                error: 'Server configuration error',
                message: 'EC3_CLIENT_ID and EC3_CLIENT_SECRET must be set in environment variables'
            });
        }

        const EC3_TOKEN_URL = 'https://buildingtransparency.org/api/oauth/token/';

        // Request new access token using refresh token
        const tokenResponse = await fetch(EC3_TOKEN_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
                'User-Agent': 'CarbonConstruct/1.0'
            },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                refresh_token: refresh_token
            })
        });

        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            console.error('EC3 token refresh failed:', tokenResponse.status, errorText);

            return res.status(tokenResponse.status).json({
                error: 'Failed to refresh token',
                details: tokenResponse.status === 400
                    ? 'Invalid or expired refresh token. Please reconnect through OAuth portal.'
                    : 'Token service unavailable'
            });
        }

        const tokenData = await tokenResponse.json();

        // Return the new token data
        return res.status(200).json({
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token || refresh_token, // Some APIs don't issue new refresh token
            expires_in: tokenData.expires_in,
            token_type: tokenData.token_type || 'Bearer'
        });

    } catch (error) {
        console.error('Token refresh error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
}
