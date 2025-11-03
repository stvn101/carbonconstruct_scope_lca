// Configuration loaded from environment variables
// Set these in Vercel dashboard under Settings > Environment Variables
// For local development, these will be empty strings and features will be disabled
window.SUPABASE_URL = window?.ENV?.NEXT_PUBLIC_SUPABASE_URL || '';
window.SUPABASE_ANON_KEY = window?.ENV?.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
window.APP_URL = window?.ENV?.APP_URL || window.location.origin;

// Validate configuration
if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
    console.error('⚠️ Missing Supabase configuration. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.');
} else {
    console.log("✅ Config loaded - Supabase:", window.SUPABASE_URL?.substring(0, 30) + "...");
}

