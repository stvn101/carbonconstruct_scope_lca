/**
 * Supabase Client Integration
 * 
 * Connects to your Supabase database with 4,500+ Australian construction materials
 * including 3,500+ EPD Australasia verified Environmental Product Declarations
 * 
 * This replaces the hardcoded materials database with real, production data!
 */

class SupabaseClient {
    constructor() {
        // These will be loaded from environment variables or config
        this.supabaseUrl = null;
        this.supabaseKey = null;
        this.client = null;
        this.initialized = false;
        
        // Cache for materials to reduce API calls
        this.materialsCache = null;
        this.cacheTimestamp = null;
        this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
    }

    /**
     * Initialize Supabase connection
     * Call this once when app loads
     */
    async initialize(config) {
        try {
            // Allow config to be passed in or use environment variables
            this.supabaseUrl = config?.url || window.ENV?.SUPABASE_URL;
            this.supabaseKey = config?.key || window.ENV?.SUPABASE_ANON_KEY;

            if (!this.supabaseUrl || !this.supabaseKey) {
                console.warn('Supabase credentials not found. Falling back to local database.');
                this.initialized = false;
                return false;
            }

            // Load Supabase client library from CDN if not already loaded
            if (typeof supabase === 'undefined') {
                await this.loadSupabaseLibrary();
            }

            // Initialize Supabase client
            this.client = supabase.createClient(this.supabaseUrl, this.supabaseKey);
            this.initialized = true;
            
            console.log('✅ Supabase connected successfully');
            console.log(`📊 Ready to access 4,500+ materials database`);
            
            return true;
        } catch (error) {
            console.error('Failed to initialize Supabase:', error);
            this.initialized = false;
            return false;
        }
    }

    /**
     * Load Supabase client library from CDN
     */
    async loadSupabaseLibrary() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * Get all materials from Supabase
     * Assumes your table structure - adjust based on actual schema
     */
    async getAllMaterials(options = {}) {
        if (!this.initialized) {
            console.warn('Supabase not initialized. Using fallback data.');
            return this.getFallbackMaterials();
        }

        // Check cache first
        if (this.isCacheValid()) {
            console.log('📦 Using cached materials');
            return this.materialsCache;
        }

        try {
            const {
                category = null,
                search = null,
                limit = 1000,
                offset = 0
            } = options;

            // Build query
            let query = this.client
                .from('materials') // Adjust table name to match your schema
                .select('*')
                .order('name', { ascending: true });

            // Add filters
            if (category) {
                query = query.eq('category', category);
            }

            if (search) {
                query = query.ilike('name', `%${search}%`);
            }

            // Add pagination
            query = query.range(offset, offset + limit - 1);

            const { data, error } = await query;

            if (error) {
                throw error;
            }

            // Cache the results
            this.materialsCache = data;
            this.cacheTimestamp = Date.now();

            console.log(`✅ Loaded ${data.length} materials from Supabase`);
            return data;

        } catch (error) {
            console.error('Error fetching materials from Supabase:', error);
            return this.getFallbackMaterials();
        }
    }

    /**
     * Get materials by category
     */
    async getMaterialsByCategory(category) {
        if (!this.initialized) {
            return this.getFallbackMaterials().filter(m => m.category === category);
        }

        try {
            const { data, error } = await this.client
                .from('materials')
                .select('*')
                .eq('category', category)
                .order('name', { ascending: true });

            if (error) throw error;

            console.log(`✅ Loaded ${data.length} materials in category: ${category}`);
            return data;

        } catch (error) {
            console.error('Error fetching materials by category:', error);
            return [];
        }
    }

    /**
     * Search materials by name or description
     */
    async searchMaterials(searchTerm) {
        if (!this.initialized) {
            const fallback = this.getFallbackMaterials();
            return fallback.filter(m => 
                m.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        try {
            const { data, error } = await this.client
                .from('materials')
                .select('*')
                .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
                .order('name', { ascending: true })
                .limit(100);

            if (error) throw error;

            console.log(`🔍 Found ${data.length} materials matching: ${searchTerm}`);
            return data;

        } catch (error) {
            console.error('Error searching materials:', error);
            return [];
        }
    }

    /**
     * Get a specific material by ID
     */
    async getMaterialById(materialId) {
        if (!this.initialized) {
            return this.getFallbackMaterials().find(m => m.id === materialId);
        }

        try {
            const { data, error } = await this.client
                .from('materials')
                .select('*')
                .eq('id', materialId)
                .single();

            if (error) throw error;

            return data;

        } catch (error) {
            console.error('Error fetching material by ID:', error);
            return null;
        }
    }

    /**
     * Get all unique categories from database
     */
    async getCategories() {
        if (!this.initialized) {
            // Return hardcoded categories from fallback
            return [
                { id: 'concrete', name: 'Concrete' },
                { id: 'steel', name: 'Steel' },
                { id: 'timber', name: 'Timber' },
                { id: 'masonry', name: 'Masonry' },
                { id: 'insulation', name: 'Insulation' },
                { id: 'glazing', name: 'Glazing' },
                { id: 'finishes', name: 'Finishes' }
            ];
        }

        try {
            const { data, error } = await this.client
                .from('materials')
                .select('category')
                .order('category', { ascending: true });

            if (error) throw error;

            // Get unique categories
            const uniqueCategories = [...new Set(data.map(m => m.category))];
            
            return uniqueCategories.map(cat => ({
                id: cat.toLowerCase().replace(/\s+/g, '-'),
                name: cat
            }));

        } catch (error) {
            console.error('Error fetching categories:', error);
            return [];
        }
    }

    /**
     * Get EPD Australasia materials only
     * These are your 3,500+ verified EPDs
     */
    async getEPDMaterials(options = {}) {
        if (!this.initialized) {
            return [];
        }

        try {
            const {
                category = null,
                limit = 1000,
                offset = 0
            } = options;

            let query = this.client
                .from('materials')
                .select('*')
                .eq('source', 'EPD Australasia') // Adjust field name as needed
                .order('name', { ascending: true });

            if (category) {
                query = query.eq('category', category);
            }

            query = query.range(offset, offset + limit - 1);

            const { data, error } = await query;

            if (error) throw error;

            console.log(`✅ Loaded ${data.length} EPD Australasia materials`);
            return data;

        } catch (error) {
            console.error('Error fetching EPD materials:', error);
            return [];
        }
    }

    /**
     * Get material statistics
     */
    async getMaterialStats() {
        if (!this.initialized) {
            return {
                total: 40,
                categories: 7,
                epdCount: 0,
                source: 'fallback'
            };
        }

        try {
            // Total count
            const { count: totalCount } = await this.client
                .from('materials')
                .select('*', { count: 'exact', head: true });

            // EPD count
            const { count: epdCount } = await this.client
                .from('materials')
                .select('*', { count: 'exact', head: true })
                .eq('source', 'EPD Australasia');

            // Categories count
            const { data: categories } = await this.client
                .from('materials')
                .select('category');

            const uniqueCategories = [...new Set(categories.map(m => m.category))];

            return {
                total: totalCount,
                categories: uniqueCategories.length,
                epdCount: epdCount,
                source: 'supabase'
            };

        } catch (error) {
            console.error('Error fetching material stats:', error);
            return null;
        }
    }

    /**
     * Check if cache is still valid
     */
    isCacheValid() {
        if (!this.materialsCache || !this.cacheTimestamp) {
            return false;
        }
        return (Date.now() - this.cacheTimestamp) < this.cacheExpiry;
    }

    /**
     * Clear cache (force refresh)
     */
    clearCache() {
        this.materialsCache = null;
        this.cacheTimestamp = null;
        console.log('🗑️ Materials cache cleared');
    }

    /**
     * Fallback to local materials database if Supabase unavailable
     */
    getFallbackMaterials() {
        console.log('⚠️ Using fallback materials database (limited to ~40 materials)');
        
        // This returns the materials from the existing materials-database.js
        // Convert MATERIALS_DATABASE to array format
        const materials = [];
        
        if (typeof MATERIALS_DATABASE !== 'undefined') {
            Object.entries(MATERIALS_DATABASE).forEach(([categoryKey, categoryData]) => {
                Object.entries(categoryData.materials).forEach(([materialKey, materialData]) => {
                    materials.push({
                        id: `${categoryKey}-${materialKey}`,
                        category: categoryKey,
                        name: materialData.name,
                        unit: materialData.unit,
                        embodiedCarbon: materialData.embodiedCarbon,
                        density: materialData.density,
                        lcaStages: materialData.lcaStages,
                        source: 'local'
                    });
                });
            });
        }
        
        return materials;
    }

    /**
     * Test connection to Supabase
     */
    async testConnection() {
        if (!this.initialized) {
            return {
                connected: false,
                message: 'Supabase not initialized'
            };
        }

        try {
            const { data, error } = await this.client
                .from('materials')
                .select('id')
                .limit(1);

            if (error) throw error;

            return {
                connected: true,
                message: 'Successfully connected to Supabase',
                materialsAvailable: true
            };

        } catch (error) {
            return {
                connected: false,
                message: error.message
            };
        }
    }
}

// Create global instance
const supabaseClient = new SupabaseClient();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SupabaseClient, supabaseClient };
}
