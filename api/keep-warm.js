/**
 * Keep-Warm Endpoint
 *
 * This serverless function is pinged every 5 minutes by Vercel Cron to:
 * 1. Keep serverless functions warm (prevent cold starts)
 * 2. Maintain Supabase connection pool
 * 3. Reduce initial load time for users
 *
 * Scheduled via vercel.json crons configuration
 */

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

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
        const startTime = Date.now();

        // Optional: Ping Supabase to keep database connections warm
        // Only if credentials are available
        let dbStatus = 'skipped';
        if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
            try {
                // Light database query to keep connection warm
                const response = await fetch(
                    `${process.env.SUPABASE_URL}/rest/v1/unified_materials?select=id&limit=1`,
                    {
                        headers: {
                            'apikey': process.env.SUPABASE_ANON_KEY,
                            'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`
                        }
                    }
                );

                dbStatus = response.ok ? 'warm' : 'error';
            } catch (dbError) {
                console.warn('Database ping failed:', dbError.message);
                dbStatus = 'unavailable';
            }
        }

        const responseTime = Date.now() - startTime;

        res.status(200).json({
            status: 'warm',
            timestamp: new Date().toISOString(),
            responseTime: `${responseTime}ms`,
            database: dbStatus,
            message: 'Functions are warm and ready'
        });

    } catch (error) {
        console.error('Keep-warm error:', error);

        res.status(200).json({
            status: 'partial',
            timestamp: new Date().toISOString(),
            error: error.message,
            message: 'Function responded but encountered an error'
        });
    }
}
