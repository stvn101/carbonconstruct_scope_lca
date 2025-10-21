/**
 * Enhanced EC3 OAuth Client for CarbonConstruct
 * Integrates with OAuth portal for secure authentication
 */

class EC3OAuthClient {
    constructor() {
        // EC3 API Configuration
        this.baseUrl = 'https://api.buildingtransparency.org/api';
        this.oauthState = {
            connected: false,
            accessToken: null,
            refreshToken: null,
            expiresAt: null
        };

        // Cache settings
        this.cache = new Map();
        this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours

        // Rate limiting
        this.rateLimitMs = 100; // 100ms between requests
        this.lastRequestTime = 0;

        // Initialize from localStorage
        this.loadOAuthState();
    }

    /**
     * Load OAuth state from localStorage
     */
    loadOAuthState() {
        try {
            const saved = localStorage.getItem('ec3_oauth_state');
            if (saved) {
                this.oauthState = JSON.parse(saved);

                // Check if token is still valid
                if (this.oauthState.expiresAt && new Date() > new Date(this.oauthState.expiresAt)) {
                    console.log('EC3 token expired, clearing state');
                    this.clearOAuthState();
                }
            }
        } catch (error) {
            console.error('Error loading OAuth state:', error);
            this.clearOAuthState();
        }
    }

    /**
     * Save OAuth state to localStorage
     */
    saveOAuthState() {
        try {
            localStorage.setItem('ec3_oauth_state', JSON.stringify(this.oauthState));
        } catch (error) {
            console.error('Error saving OAuth state:', error);
        }
    }

    /**
     * Clear OAuth state
     */
    clearOAuthState() {
        this.oauthState = {
            connected: false,
            accessToken: null,
            refreshToken: null,
            expiresAt: null
        };
        localStorage.removeItem('ec3_oauth_state');
    }

    /**
     * Check if client is authenticated and ready
     */
    isAuthenticated() {
        return this.oauthState.connected &&
            this.oauthState.accessToken &&
            this.oauthState.expiresAt &&
            new Date() < new Date(this.oauthState.expiresAt);
    }

    /**
     * Get authentication headers for API requests
     */
    getAuthHeaders() {
        if (!this.isAuthenticated()) {
            throw new Error('Not authenticated with EC3. Please connect through the OAuth portal.');
        }

        return {
            'Authorization': `Bearer ${this.oauthState.accessToken}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'CarbonConstruct/1.0'
        };
    }

    /**
     * Make authenticated request to EC3 API with rate limiting
     */
    async makeRequest(endpoint, options = {}) {
        if (!this.isAuthenticated()) {
            throw new Error('Not authenticated with EC3. Please visit the OAuth portal to connect.');
        }

        // Rate limiting
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        if (timeSinceLastRequest < this.rateLimitMs) {
            await new Promise(resolve => setTimeout(resolve, this.rateLimitMs - timeSinceLastRequest));
        }
        this.lastRequestTime = Date.now();

        // Check cache first (for GET requests)
        const method = options.method || 'GET';
        const cacheKey = `${method}:${endpoint}`;
        if (method === 'GET' && this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheExpiry) {
                return cached.data;
            }
            this.cache.delete(cacheKey);
        }

        try {
            const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}/${endpoint}`;
            const response = await fetch(url, {
                ...options,
                headers: {
                    ...this.getAuthHeaders(),
                    ...options.headers
                }
            });

            if (response.status === 401) {
                // Token expired or invalid
                this.clearOAuthState();
                throw new Error('Authentication expired. Please reconnect through the OAuth portal.');
            }

            if (!response.ok) {
                throw new Error(`EC3 API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            // Cache successful GET requests
            if (method === 'GET') {
                this.cache.set(cacheKey, {
                    data,
                    timestamp: Date.now()
                });
            }

            return data;

        } catch (error) {
            console.error('EC3 API request failed:', error);
            throw error;
        }
    }

    /**
     * Search materials in EC3 database
     */
    async searchMaterials(query, options = {}) {
        const params = new URLSearchParams({
            search: query,
            page_size: options.limit || 20,
            page: options.page || 1,
            ordering: options.ordering || '-created',
            ...options.filters
        });

        return await this.makeRequest(`materials?${params.toString()}`);
    }

    /**
     * Get specific material by ID
     */
    async getMaterial(materialId) {
        return await this.makeRequest(`materials/${materialId}`);
    }

    /**
     * Get Environmental Product Declaration (EPD) details
     */
    async getEPD(epdId) {
        return await this.makeRequest(`epds/${epdId}`);
    }

    /**
     * Search EPDs
     */
    async searchEPDs(query, options = {}) {
        const params = new URLSearchParams({
            search: query,
            page_size: options.limit || 20,
            page: options.page || 1,
            ...options.filters
        });

        return await this.makeRequest(`epds?${params.toString()}`);
    }

    /**
     * Get carbon factors for a material category
     */
    async getCarbonFactors(category, options = {}) {
        const params = new URLSearchParams({
            category: category,
            page_size: options.limit || 50,
            ...options.filters
        });

        return await this.makeRequest(`materials?${params.toString()}`);
    }

    /**
     * Get material categories
     */
    async getCategories() {
        return await this.makeRequest('categories');
    }

    /**
     * Get manufacturers
     */
    async getManufacturers(options = {}) {
        const params = new URLSearchParams({
            page_size: options.limit || 50,
            page: options.page || 1
        });

        return await this.makeRequest(`organizations?${params.toString()}`);
    }

    /**
     * Get statistics about the EC3 database
     */
    async getStats() {
        try {
            const [materialsResponse, epdsResponse, orgsResponse] = await Promise.all([
                this.makeRequest('materials?page_size=1'),
                this.makeRequest('epds?page_size=1'),
                this.makeRequest('organizations?page_size=1')
            ]);

            return {
                totalMaterials: materialsResponse.count || 0,
                totalEPDs: epdsResponse.count || 0,
                totalManufacturers: orgsResponse.count || 0,
                lastUpdated: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error getting EC3 stats:', error);
            // Return fallback stats
            return {
                totalMaterials: 50000,
                totalEPDs: 50000,
                totalManufacturers: 1000,
                lastUpdated: new Date().toISOString()
            };
        }
    }

    /**
     * Search for specific product types
     */
    async searchByProductType(productType, options = {}) {
        const params = new URLSearchParams({
            product_classes: productType,
            page_size: options.limit || 20,
            page: options.page || 1,
            ...options.filters
        });

        return await this.makeRequest(`materials?${params.toString()}`);
    }

    /**
     * Get materials by geographic region
     */
    async getRegionalMaterials(region, options = {}) {
        const params = new URLSearchParams({
            geography: region,
            page_size: options.limit || 20,
            page: options.page || 1,
            ...options.filters
        });

        return await this.makeRequest(`materials?${params.toString()}`);
    }

    /**
     * Get connection status information
     */
    getConnectionStatus() {
        return {
            connected: this.isAuthenticated(),
            hasToken: !!this.oauthState.accessToken,
            tokenExpiry: this.oauthState.expiresAt,
            minutesUntilExpiry: this.oauthState.expiresAt ?
                Math.floor((new Date(this.oauthState.expiresAt) - new Date()) / (1000 * 60)) : null
        };
    }

    /**
     * Refresh access token if refresh token is available
     */
    async refreshAccessToken() {
        if (!this.oauthState.refreshToken) {
            throw new Error('No refresh token available');
        }

        try {
            // This would need to be implemented with your backend
            const response = await fetch('/api/ec3-refresh-token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    refresh_token: this.oauthState.refreshToken
                })
            });

            if (!response.ok) {
                throw new Error('Token refresh failed');
            }

            const tokenData = await response.json();

            this.oauthState.accessToken = tokenData.access_token;
            this.oauthState.expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString();

            if (tokenData.refresh_token) {
                this.oauthState.refreshToken = tokenData.refresh_token;
            }

            this.saveOAuthState();
            return true;

        } catch (error) {
            console.error('Token refresh failed:', error);
            this.clearOAuthState();
            throw error;
        }
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            entries: this.cache.size,
            memory: JSON.stringify([...this.cache.entries()]).length
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EC3OAuthClient;
} else {
    window.EC3OAuthClient = EC3OAuthClient;
}

// Auto-initialize global instance
if (typeof window !== 'undefined') {
    window.ec3Client = new EC3OAuthClient();

    // Helper function to check if EC3 is connected
    window.isEC3Connected = () => window.ec3Client.isAuthenticated();

    // Helper function to redirect to OAuth portal if not connected
    window.requireEC3Connection = () => {
        if (!window.ec3Client.isAuthenticated()) {
            const currentPage = encodeURIComponent(window.location.pathname + window.location.search);
            window.location.href = `ec3-oauth.html?return=${currentPage}`;
            return false;
        }
        return true;
    };
}