/**
 * Configuration bootstrap for CarbonConstruct.
 * Resolves environment variables from multiple providers without hard-coded secrets.
 * Provide NEXT_PUBLIC_* or VITE_* variables via build system (Vite, Netlify, etc.).
 */
(function configureEnvironment(globalObj) {
    const envSources = [
        (typeof process !== 'undefined' && process.env) || {},
        globalObj.__ENV__ || {},
        globalObj.ENV || {}
    ];

    const lookup = (keys, fallback) => {
        const keyList = Array.isArray(keys) ? keys : [keys];
        for (const key of keyList) {
            for (const source of envSources) {
                if (source && typeof source[key] !== 'undefined') {
                    return source[key];
                }
            }
        }
        return fallback;
    };

    const toBoolean = (value, fallback = false) => {
        if (typeof value === 'boolean') return value;
        if (typeof value === 'string') {
            const normalised = value.trim().toLowerCase();
            if (['true', '1', 'yes', 'on'].includes(normalised)) return true;
            if (['false', '0', 'no', 'off'].includes(normalised)) return false;
        }
        return fallback;
    };

    const toNumber = (value, fallback) => {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    };

    const mergedEnv = {
        SUPABASE_URL: lookup(['NEXT_PUBLIC_SUPABASE_URL', 'VITE_SUPABASE_URL'], ''),
        SUPABASE_ANON_KEY: lookup(['NEXT_PUBLIC_SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY'], ''),
        EC3_API_BASE: lookup(['NEXT_PUBLIC_EC3_API_BASE', 'VITE_EC3_API_BASE'], 'https://api.buildingtransparency.org/api'),
        EC3_API_KEY: lookup(['NEXT_PUBLIC_EC3_API_KEY', 'VITE_EC3_API_KEY'], ''),
        EC3_BEARER_TOKEN: lookup(['NEXT_PUBLIC_EC3_BEARER_TOKEN', 'VITE_EC3_BEARER_TOKEN'], ''),
        ENABLE_SUPABASE: toBoolean(lookup(['NEXT_PUBLIC_ENABLE_SUPABASE', 'VITE_ENABLE_SUPABASE'], true)),
        ENABLE_EC3: toBoolean(lookup(['NEXT_PUBLIC_ENABLE_EC3', 'VITE_ENABLE_EC3'], false)),
        CACHE_EXPIRY_MS: toNumber(lookup(['NEXT_PUBLIC_CACHE_EXPIRY_MS', 'VITE_CACHE_EXPIRY_MS'], 5 * 60 * 1000), 5 * 60 * 1000),
        DEBUG: toBoolean(lookup(['NEXT_PUBLIC_DEBUG', 'VITE_DEBUG'], false))
    };

    globalObj.ENV = mergedEnv;

    // Also expose APP_URL constants
    globalObj.APP_URL = "https://carbonconstruct.com.au";
    globalObj.NEXT_PUBLIC_APP_URL = "https://carbonconstruct.com.au";
    globalObj.VITE_APP_URL = "https://carbonconstruct.com.au";

    if (mergedEnv.DEBUG) {
        console.log('CarbonConstruct configuration', mergedEnv);
    }
})(typeof window !== 'undefined' ? window : globalThis);

// For ES modules compatibility (when loaded as type="module")
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        APP_URL: "https://carbonconstruct.com.au",
        NEXT_PUBLIC_APP_URL: "https://carbonconstruct.com.au",
        VITE_APP_URL: "https://carbonconstruct.com.au"
    };
}