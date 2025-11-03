// Static configuration for Vercel static deployment
// Supabase credentials from .env.example
window.SUPABASE_URL = window?.ENV?.SUPABASE_URL || 'https://jaqzoyouuzhchuyzafii.supabase.co';
window.SUPABASE_ANON_KEY = window?.ENV?.SUPABASE_ANON_KEY || 'your-supabase-anon-key-here';
window.APP_URL = window?.ENV?.APP_URL || 'https://carbonconstruct.com.au';

console.log("✅ Config loaded - Supabase:", window.SUPABASE_URL?.substring(0, 30) + "...");

