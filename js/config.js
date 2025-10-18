/**
 * Configuration for CarbonConstruct
 *
 * ⚠️  DEVELOPMENT MODE - NOT FOR PRODUCTION
 *
 * IMPORTANT: DO NOT use these keys in production!
 * Replace with your own keys from environment variables.
 */

// Environment configuration
window.ENV = {
    // ⚠️  DEVELOPMENT MODE
    DEVELOPMENT_MODE: true,

    // Supabase Configuration
    // REPLACE THESE WITH YOUR OWN KEYS!
    SUPABASE_URL: '',  // Add your Supabase URL
    SUPABASE_ANON_KEY: '',  // Add your Supabase anon key

    // EC3 API Configuration
    // Get your own keys from https://buildingtransparency.org/
    EC3_API_BASE: 'https://api.buildingtransparency.org/api',
    EC3_API_KEY: '',  // Add your EC3 API key
    EC3_BEARER_TOKEN: '',  // Add your EC3 Bearer token

    // OAuth credentials (optional)
    EC3_CLIENT_ID: '',
    EC3_CLIENT_SECRET: '',

    // Feature flags
    ENABLE_SUPABASE: false,  // Enable when you add your keys
    ENABLE_EC3: false,  // Enable when you add your keys

    // Application settings
    CACHE_EXPIRY_MS: 5 * 60 * 1000, // 5 minutes
    DEBUG: true
};

// Log configuration
if (window.ENV.DEBUG) {
    console.log('🔧 CarbonConstruct Configuration');
    console.log('⚠️  DEVELOPMENT MODE - Configure your API keys!');
    console.log('Supabase:', window.ENV.ENABLE_SUPABASE ? '✅ Enabled' : '❌ Disabled - Add your keys to config.js');
    console.log('EC3 API:', window.ENV.ENABLE_EC3 ? '✅ Enabled' : '❌ Disabled - Add your keys to config.js');
    console.log('\n📚 See README.md for setup instructions');
}
