// Static configuration for Vercel static deployment
// Supabase credentials from .env.example
window.SUPABASE_URL = window?.ENV?.SUPABASE_URL || 'https://hkgryypdqiyigoztvran.supabase.co';
window.SUPABASE_ANON_KEY = window?.ENV?.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhrZ3J5eXBkcWl5aWdvenR2cmFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk0OTg2NzUsImV4cCI6MjA0NTA3NDY3NX0.wHmEVqs8N2eT-RBpBGgRtmKJuDAXqoV3JiX_1j-uLAo';
window.APP_URL = window?.ENV?.APP_URL || 'https://carbonconstruct.com.au';

console.log("✅ Config loaded - Supabase:", window.SUPABASE_URL?.substring(0, 30) + "...");

