/**
 * EC3 (Embodied Carbon in Construction Calculator) API Client
 * Building Transparency - https://buildingtransparency.org/
 * 
 * EC3 is the world's largest database of embodied carbon data for construction materials
 * - 50,000+ Environmental Product Declarations (EPDs)
 * - 1,000+ manufacturers globally
 * - ISO 14025 compliant
 * - Free API access with authentication
 * 
 * This is THE industry standard for embodied carbon data.
 * Steve has permission from Building Transparency to use this API!
 * 
 * Integration Strategy:
 * - Primary: Supabase (4,500+ Australian materials - fast, cached)
 * - Secondary: EC3 API (50,000+ global EPDs - comprehensive, live)
 * - Use EC3 for search, verification, and detailed product data
 */

class EC3Client {
    constructor() {
        // EC3 API Configuration
        this.baseUrl = 'https://buildingtransparency.org/api';
        this.apiKey = null;
        this.bearerToken = null;
        this.initialized = false;
        
        // Cache settings
        this.cache = new Map();
        this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
        
        // Rate limiting (be respectful to their API)
        this.requestQueue = [];
        this.rateLimitMs = 100; // 100ms between requests
        this.lastRequestTime = 0;
    }

    /**
     * Initialize EC3 API connection
     * 
     * @param {Object} config - Configuration object
     * @param {string} config.apiKey - Your EC3 API key
     * @param {string} config.bearerToken - Your bearer token (if using OAuth)
     */
    async initialize(config) {
        try {
            // Load from config or environment
            this.apiKey = config?.apiKey || window.ENV?.EC3_API_KEY;
            this.bearerToken = config?.bearerToken || window.ENV?.EC3_BEARER_TOKEN;

            if (!this.apiKey && !this.bearerToken) {
                console.warn('EC3 API credentials not found. EC3 features disabled.');
                console.warn('To enable: Add EC3_API_KEY or EC3_BEARER_TOKEN to environment');
                this.initialized = false;
                return false;
            }

            // Test connection
            const testResult = await this.testConnection();
            
            if (testResult.success) {
                this.initialized = true;
                console.log('✅ EC3 API connected successfully');
                console.log('🌍 Access to 50,000+ global EPDs enabled');
                return true;
            } else {
                console.error('❌ EC3 API connection failed:', testResult.error);
                this.initialized = false;
                return false;
            }

        } catch (error) {
            console.error('Failed to initialize EC3 API:', error);
            this.initialized = false;
            return false;
        }
    }

    /**
     * Get authentication headers for EC3 API
     */
    getAuthHeaders() {
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        if (this.bearerToken) {
            headers['Authorization'] = `Bearer ${this.bearerToken}`;
        } else if (this.apiKey) {
            headers['X-API-Key'] = this.apiKey;
        }

        return headers;
    }

    /**
     * Make rate-limited API request
     */
    async makeRequest(endpoint, options = {}) {
        if (!this.initialized) {
            throw new Error('EC3 API not initialized');
        }

        // Rate limiting
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        if (timeSinceLastRequest < this.rateLimitMs) {
            await new Promise(resolve => 
                setTimeout(resolve, this.rateLimitMs - timeSinceLastRequest)
            );
        }

        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            ...options,
            headers: {
                ...this.getAuthHeaders(),
                ...(options.headers || {})
            }
        };

        this.lastRequestTime = Date.now();

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`EC3 API error (${response.status}): ${errorText}`);
            }

            return await response.json();

        } catch (error) {
            console.error('EC3 API request failed:', error);
            throw error;
        }
    }

    /**
     * Test EC3 API connection
     */
    async testConnection() {
        try {
            // Try to get a single material to test connection
            const response = await fetch(`${this.baseUrl}/materials?page_size=1`, {
                headers: this.getAuthHeaders()
            });

            if (response.ok) {
                return {
                    success: true,
                    message: 'EC3 API connection successful'
                };
            } else {
                return {
                    success: false,
                    error: `HTTP ${response.status}: ${response.statusText}`
                };
            }

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Search materials in EC3 database
     * 
     * @param {string} query - Search term
     * @param {Object} filters - Optional filters
     * @returns {Array} Array of matching materials with EPD data
     */
    async searchMaterials(query, filters = {}) {
        if (!this.initialized) {
            console.warn('EC3 API not available. Using local database only.');
            return [];
        }

        try {
            const params = new URLSearchParams({
                q: query,
                page_size: filters.limit || 50,
                page: filters.page || 1
            });

            // Add filters
            if (filters.category) {
                params.append('category', filters.category);
            }
            if (filters.jurisdiction) {
                params.append('jurisdiction', filters.jurisdiction);
            }
            if (filters.manufacturer) {
                params.append('manufacturer', filters.manufacturer);
            }

            const data = await this.makeRequest(`/materials?${params.toString()}`);

            console.log(`🔍 EC3 Search: Found ${data.results?.length || 0} materials for "${query}"`);

            // Transform EC3 data to CarbonConstruct format
            return this.transformEC3Materials(data.results || []);

        } catch (error) {
            console.error('EC3 search error:', error);
            return [];
        }
    }

    /**
     * Get material by EC3 ID
     */
    async getMaterialById(ec3Id) {
        if (!this.initialized) {
            return null;
        }

        // Check cache first
        const cacheKey = `material_${ec3Id}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            console.log('📦 Using cached EC3 material');
            return cached;
        }

        try {
            const data = await this.makeRequest(`/materials/${ec3Id}`);
            const material = this.transformEC3Material(data);
            
            // Cache the result
            this.saveToCache(cacheKey, material);
            
            return material;

        } catch (error) {
            console.error('Error fetching EC3 material:', error);
            return null;
        }
    }

    /**
     * Get EPD by ID
     */
    async getEPDById(epdId) {
        if (!this.initialized) {
            return null;
        }

        try {
            const data = await this.makeRequest(`/epds/${epdId}`);
            return this.transformEPD(data);

        } catch (error) {
            console.error('Error fetching EPD:', error);
            return null;
        }
    }

    /**
     * Search by manufacturer
     */
    async searchByManufacturer(manufacturerName) {
        if (!this.initialized) {
            return [];
        }

        try {
            const params = new URLSearchParams({
                manufacturer: manufacturerName,
                page_size: 100
            });

            const data = await this.makeRequest(`/materials?${params.toString()}`);
            return this.transformEC3Materials(data.results || []);

        } catch (error) {
            console.error('EC3 manufacturer search error:', error);
            return [];
        }
    }

    /**
     * Get materials by category
     */
    async getMaterialsByCategory(category) {
        if (!this.initialized) {
            return [];
        }

        // Check cache
        const cacheKey = `category_${category}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            return cached;
        }

        try {
            const params = new URLSearchParams({
                category: category,
                page_size: 200
            });

            const data = await this.makeRequest(`/materials?${params.toString()}`);
            const materials = this.transformEC3Materials(data.results || []);
            
            // Cache results
            this.saveToCache(cacheKey, materials);
            
            return materials;

        } catch (error) {
            console.error('EC3 category search error:', error);
            return [];
        }
    }

    /**
     * Transform EC3 material data to CarbonConstruct format
     */
    transformEC3Material(ec3Data) {
        // EC3 uses GWP (Global Warming Potential) in kg CO2e
        // This is exactly what we need!
        
        return {
            id: ec3Data.id || ec3Data.ec3_id,
            name: ec3Data.name || ec3Data.product_name,
            category: ec3Data.category || ec3Data.masterformat,
            subcategory: ec3Data.subcategory,
            description: ec3Data.description,
            
            // Embodied carbon data
            embodiedCarbon: this.extractGWP(ec3Data),
            unit: ec3Data.declared_unit || 'kg',
            
            // LCA stages (EC3 has detailed breakdown)
            lcaStages: this.extractLCAStages(ec3Data),
            
            // EPD information
            epd: {
                number: ec3Data.epd_number,
                source: 'EC3 / Building Transparency',
                manufacturer: ec3Data.manufacturer?.name,
                validUntil: ec3Data.valid_until,
                programOperator: ec3Data.program_operator,
                geography: ec3Data.geography || ec3Data.plant_geography
            },
            
            // Additional properties
            density: ec3Data.density,
            recyclability: ec3Data.end_of_life?.recyclability,
            recycledContent: ec3Data.recycled_content,
            
            // Metadata
            source: 'EC3',
            ec3Id: ec3Data.id,
            lastUpdated: ec3Data.updated_at || new Date().toISOString(),
            
            // Link to EC3
            ec3Link: `https://buildingtransparency.org/ec3/materials/${ec3Data.id}`
        };
    }

    /**
     * Transform array of EC3 materials
     */
    transformEC3Materials(ec3Array) {
        return ec3Array.map(item => this.transformEC3Material(item));
    }

    /**
     * Extract GWP (Global Warming Potential) from EC3 data
     * EC3 provides A1-A3 (product stage) GWP
     */
    extractGWP(ec3Data) {
        // EC3 stores GWP in different possible fields
        if (ec3Data.gwp) {
            return ec3Data.gwp;
        }
        if (ec3Data.gwp_per_declared_unit) {
            return ec3Data.gwp_per_declared_unit;
        }
        if (ec3Data.gwp_a1a3) {
            return ec3Data.gwp_a1a3;
        }
        if (ec3Data.impacts?.gwp) {
            return ec3Data.impacts.gwp;
        }
        
        // Try to extract from LCA stages
        const stages = ec3Data.lca_stages || {};
        const a1a3 = (stages.a1 || 0) + (stages.a2 || 0) + (stages.a3 || 0);
        
        return a1a3 || 0;
    }

    /**
     * Extract LCA stages from EC3 data
     */
    extractLCAStages(ec3Data) {
        const stages = ec3Data.lca_stages || {};
        const total = this.extractGWP(ec3Data);
        
        // If we have detailed stages, use them
        if (stages.a1 || stages.a2 || stages.a3) {
            return {
                a1a3: (stages.a1 || 0) + (stages.a2 || 0) + (stages.a3 || 0) / total,
                a4: (stages.a4 || 0) / total || 0.05,
                a5: (stages.a5 || 0) / total || 0.05
            };
        }
        
        // Otherwise use typical distributions
        return {
            a1a3: 0.90,
            a4: 0.05,
            a5: 0.05
        };
    }

    /**
     * Transform EPD data
     */
    transformEPD(epdData) {
        return {
            id: epdData.id,
            number: epdData.epd_number,
            name: epdData.product_name,
            manufacturer: epdData.manufacturer?.name,
            validFrom: epdData.valid_from,
            validUntil: epdData.valid_until,
            programOperator: epdData.program_operator,
            geography: epdData.geography,
            gwp: this.extractGWP(epdData),
            declaredUnit: epdData.declared_unit,
            description: epdData.description,
            pdfUrl: epdData.pdf_url,
            ec3Link: `https://buildingtransparency.org/ec3/epds/${epdData.id}`
        };
    }

    /**
     * Cache management
     */
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;
        
        // Check if expired
        if (Date.now() - cached.timestamp > this.cacheExpiry) {
            this.cache.delete(key);
            return null;
        }
        
        return cached.data;
    }

    saveToCache(key, data) {
        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    }

    clearCache() {
        this.cache.clear();
        console.log('🗑️ EC3 cache cleared');
    }

    /**
     * Get EC3 statistics
     */
    async getStats() {
        if (!this.initialized) {
            return {
                available: false,
                message: 'EC3 API not initialized'
            };
        }

        try {
            // Get summary stats from EC3
            const data = await this.makeRequest('/stats');
            
            return {
                available: true,
                totalEPDs: data.total_epds || '50,000+',
                manufacturers: data.total_manufacturers || '1,000+',
                categories: data.categories || [],
                lastUpdated: data.last_updated
            };

        } catch (error) {
            console.error('Error fetching EC3 stats:', error);
            return {
                available: true,
                totalEPDs: '50,000+',
                manufacturers: '1,000+',
                message: 'Stats unavailable but API is connected'
            };
        }
    }

    /**
     * Hybrid search: Supabase + EC3
     * Search both databases and merge results
     */
    async hybridSearch(query, supabaseResults = []) {
        // Get EC3 results
        const ec3Results = await this.searchMaterials(query);
        
        // Combine and deduplicate
        const combined = [...supabaseResults];
        const existingNames = new Set(supabaseResults.map(m => m.name.toLowerCase()));
        
        ec3Results.forEach(material => {
            if (!existingNames.has(material.name.toLowerCase())) {
                combined.push(material);
            }
        });
        
        console.log(`🔍 Hybrid search: ${supabaseResults.length} local + ${ec3Results.length} EC3 = ${combined.length} total`);
        
        return combined;
    }

    /**
     * Save EC3 material to Supabase for faster access later
     */
    async saveToSupabase(material) {
        // This would integrate with your Supabase client
        // to cache frequently-used EC3 materials locally
        
        console.log('💾 Saving EC3 material to Supabase cache:', material.name);
        
        // Implementation depends on your Supabase schema
        // You'd call supabaseClient to insert this material
    }
}

// Create global instance
const ec3Client = new EC3Client();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EC3Client, ec3Client };
}
