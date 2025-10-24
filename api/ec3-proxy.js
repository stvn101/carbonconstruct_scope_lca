// EC3 API Proxy - Serverless function to bypass CORS

const CLIENT_ID = process.env.EC3_CLIENT_ID;
const CLIENT_SECRET = process.env.EC3_CLIENT_SECRET;
const REDIRECT_URI = process.env.EC3_REDIRECT_URI;
const EC3_API_KEY = process.env.NEXT_PUBLIC_EC3_API_KEY;

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
        console.warn('EC3 OAuth environment variables are not fully configured. Public EC3 requests will still proceed.');
    }

    try {
        const { endpoint = 'materials', page_size = '1', public_only = 'true' } = req.query;
        const authHeader = req.headers.authorization;

        // For public access, try without authentication first
        const params = new URLSearchParams({
            page_size: page_size
        });

        // Add public filter if specified
        if (public_only === 'true') {
            params.append('open_xpd_uuid__isnull', 'false');
        }

        // Construct EC3 API URL
        const ec3Url = `https://api.buildingtransparency.org/api/${endpoint}?${params.toString()}`;

        const fetchOptions = {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'CarbonConstruct/1.0',
                ...(EC3_API_KEY ? { 'x-api-key': EC3_API_KEY } : {})
            }
        };

        // Add authorization header if provided
        if (authHeader) {
            fetchOptions.headers['Authorization'] = authHeader;
        }

        // Make request to EC3 API
        const response = await fetch(ec3Url, fetchOptions);

        if (!response.ok) {
            throw new Error(`EC3 API responded with status: ${response.status} - ${response.statusText}`);
        }
        const data = await response.json();

        // Return the data
        res.status(200).json({
            success: true,
            data: data,
            endpoint: endpoint,
            authenticated: !!authHeader,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('EC3 API Proxy Error:', error);

        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}