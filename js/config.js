/**
 * Configuration for CarbonConstruct
 * Loads environment variables for browser use
 */

// Environment configuration
window.ENV = {
    // Supabase Configuration
    SUPABASE_URL: 'https://jaqzoyouuzhchuyzafii.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphcXpveW91dXpoY2h1eXphZmlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4MTQyNjgsImV4cCI6MjA1OTM5MDI2OH0.NRKgoHt0rISen_jzkJpztRwmc4DFMeQDAinCu3eCDRE',

    // EC3 API Configuration
    EC3_API_KEY: 'nK72LVKPVJxFb21fMIFpmtaLawqwvg',
    EC3_BEARER_TOKEN: null, // Optional: use if you have a bearer token instead

    // Feature flags
    ENABLE_SUPABASE: true,
    ENABLE_EC3: true,

    // Application settings
    CACHE_EXPIRY_MS: 5 * 60 * 1000, // 5 minutes
    DEBUG: false
};

// Log configuration (only in debug mode)
if (window.ENV.DEBUG) {
    console.log('🔧 CarbonConstruct Configuration loaded');
    console.log('Supabase:', window.ENV.ENABLE_SUPABASE ? '✅ Enabled' : '❌ Disabled');
    console.log('EC3 API:', window.ENV.ENABLE_EC3 ? '✅ Enabled' : '❌ Disabled');
}
