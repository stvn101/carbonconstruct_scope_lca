// Static configuration for Vercel static deployment
window.SUPABASE_URL = window?.ENV?.SUPABASE_URL || 'YOUR_SUPABASE_URL_HERE';
window.SUPABASE_ANON_KEY = window?.ENV?.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY_HERE';
window.APP_URL = window?.ENV?.APP_URL || 'https://carbonconstruct.com.au';

console.log("✅ Config loaded");

