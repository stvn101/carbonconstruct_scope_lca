/**
 * Local Configuration - DO NOT COMMIT THIS FILE!
 *
 * This file contains your actual API keys and should be:
 * 1. Added to .gitignore
 * 2. Never committed to version control
 * 3. Only used for local development
 */

// Override the default config with your actual keys
window.ENV = {
    DEVELOPMENT_MODE: true,

    // Supabase Configuration
    SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',

    // EC3 API Configuration
    EC3_API_BASE: 'https://api.buildingtransparency.org/api',
    EC3_API_KEY: process.env.NEXT_PUBLIC_EC3_API_KEY || '',
    EC3_BEARER_TOKEN: process.env.NEXT_PUBLIC_EC3_BEARER_TOKEN || '',

    // OAuth credentials
    EC3_CLIENT_ID: process.env.EC3_CLIENT_ID || '',
    EC3_CLIENT_SECRET: process.env.EC3_CLIENT_SECRET || '',

    // Feature flags
    ENABLE_SUPABASE: true,
    ENABLE_EC3: true,

    // Application settings
    CACHE_EXPIRY_MS: 5 * 60 * 1000,
    DEBUG: true
};

console.log('✅ Local config loaded');
