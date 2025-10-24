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
    const { endpoint = 'materials', page_size = '1' } = req.query;
    const authHeader = req.headers.authorization;

    // Construct EC3 API URL
    const ec3Url = `https://api.buildingtransparency.org/api/${endpoint}?page_size=${page_size}`;
    
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
    }

    // Make request to EC3 API
    const response = await fetch(ec3Url, fetchOptions);
    
    if (!response.ok) {
      throw new Error(`EC3 API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    // Return the data
    res.status(200).json({
      success: true,
      data: data,
      endpoint: endpoint,
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