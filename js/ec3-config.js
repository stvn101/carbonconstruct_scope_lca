/**
 * EC3 OAuth Configuration
 * Centralized configuration for EC3 integration
 * Can be overridden by environment variables
 */

(function(window) {
    'use strict';

    // Default EC3 OAuth Configuration
    const EC3_CONFIG = {
        // OAuth Endpoints
        authUrl: 'https://buildingtransparency.org/api/oauth/authorize/',
        tokenUrl: 'https://buildingtransparency.org/api/oauth/token/',
        apiBaseUrl: 'https://api.buildingtransparency.org/api',

        // OAuth Client Configuration
        // These can be overridden by environment variables
        clientId: (function() {
            if (!window.ENV?.EC3_CLIENT_ID) {
                throw new Error('EC3_CLIENT_ID environment variable must be set for EC3 OAuth configuration.');
            }
            return window.ENV.EC3_CLIENT_ID;
        })(),

        // Redirect URI - automatically detects current domain
        redirectUri: (function() {
            // Check if environment variable is set
            if (window.ENV?.EC3_REDIRECT_URI) {
                return window.ENV.EC3_REDIRECT_URI;
            }

            // For local development
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                return `${window.location.origin}/ec3-callback.html`;
            }

            // For production - use carbonconstruct.com.au
            return 'https://carbonconstruct.com.au/ec3-callback.html';
        })(),

        // OAuth scope
        scope: 'read',

        // API endpoints (relative to apiBaseUrl)
        endpoints: {
            materials: 'materials',
            epds: 'epds',
            categories: 'categories',
            organizations: 'organizations',
            stats: 'stats'
        },

        // Cache settings
        cacheExpiry: 24 * 60 * 60 * 1000, // 24 hours

        // Rate limiting
        rateLimitMs: 100, // 100ms between requests

        // Token refresh settings
        tokenRefreshBuffer: 5 * 60 * 1000, // Refresh 5 minutes before expiry
        maxRefreshRetries: 3
    };

    // Validation function
    EC3_CONFIG.validate = function() {
        const issues = [];

        if (!this.clientId) {
            issues.push('EC3_CLIENT_ID is not configured');
        }

        if (!this.redirectUri) {
            issues.push('EC3_REDIRECT_URI could not be determined');
        }

        if (issues.length > 0) {
            console.warn('EC3 Configuration Issues:', issues);
            return false;
        }

        return true;
    };

    // Helper function to check if running in development mode
    EC3_CONFIG.isDevelopment = function() {
        return window.location.hostname === 'localhost' ||
               window.location.hostname === '127.0.0.1' ||
               window.location.hostname.includes('vercel.app');
    };

    // Helper function to get full API URL
    EC3_CONFIG.getApiUrl = function(endpoint) {
        if (endpoint.startsWith('http')) {
            return endpoint;
        }
        return `${this.apiBaseUrl}/${endpoint}`;
    };

    // Helper function to generate OAuth authorization URL
    EC3_CONFIG.getAuthorizationUrl = function(state) {
        const params = new URLSearchParams({
            response_type: 'code',
            client_id: this.clientId,
            redirect_uri: this.redirectUri,
            scope: this.scope,
            state: state || this.generateState()
        });

        return `${this.authUrl}?${params.toString()}`;
    };

    // Helper function to generate random state for OAuth security
    EC3_CONFIG.generateState = function() {
        return Math.random().toString(36).substring(2, 15) +
               Math.random().toString(36).substring(2, 15);
    };

    // Export to window
    window.EC3_CONFIG = EC3_CONFIG;

    // Log configuration status
    if (EC3_CONFIG.isDevelopment()) {
        console.log('EC3 Configuration:', {
            clientId: EC3_CONFIG.clientId ? `${EC3_CONFIG.clientId.substring(0, 10)}...` : 'NOT SET',
            redirectUri: EC3_CONFIG.redirectUri,
            environment: EC3_CONFIG.isDevelopment() ? 'Development' : 'Production',
            valid: EC3_CONFIG.validate()
        });
    }

})(window);
