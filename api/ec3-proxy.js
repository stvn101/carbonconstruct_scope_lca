// EC3 API Proxy - Serverless function to bypass CORS
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
                'User-Agent': 'CarbonConstruct/1.0'
            }
        };

        // Add authorization header if provided
        if (authHeader) {
            fetchOptions.headers['Authorization'] = authHeader;
        } else if (process.env.EC3_ACCESS_TOKEN) {
            // Use environment variable for API access
            fetchOptions.headers['Authorization'] = `Bearer ${process.env.EC3_ACCESS_TOKEN}`;
        }

        // Make request to EC3 API
        const response = await fetch(ec3Url, fetchOptions);

        if (!response.ok) {
            throw new Error(`EC3 API responded with status: ${response.status} - ${response.statusText}`);
        } const data = await response.json();

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