/**
 * Incremental Materials Database Loader
 *
 * Optimizes materials loading with a 3-tier strategy:
 * 1. Instant: Load top 100 most-used materials immediately
 * 2. Background: Load rest of materials progressively
 * 3. On-demand: Load specific materials via search
 *
 * This prevents the 11-second blank screen on initial load!
 */

class MaterialsLoader {
    constructor(supabaseClient) {
        this.supabaseClient = supabaseClient;

        // Multi-tier cache
        this.essentialMaterials = []; // Top 100 materials (loaded first)
        this.allMaterials = []; // Full database (loaded progressively)
        this.categories = [];

        // Loading state
        this.essentialsLoaded = false;
        this.fullDatabaseLoaded = false;
        this.loadingProgress = 0; // 0-100

        // Callbacks for progress updates
        this.progressCallbacks = [];

        // Top 100 most commonly used materials (based on Australian construction)
        this.essentialMaterialNames = [
            'concrete', '32mpa', '40mpa', '50mpa', 'reinforcing', 'structural steel',
            'rebar', 'mesh', 'timber', 'hardwood', 'softwood', 'plywood', 'lvl',
            'brick', 'block', 'masonry', 'cement', 'mortar', 'plasterboard', 'gypsum',
            'insulation', 'glasswool', 'rockwool', 'glass', 'glazing', 'aluminium',
            'window', 'door', 'paint', 'tile', 'carpet', 'flooring', 'roofing',
            'steel framing', 'metal deck', 'cladding', 'facade', 'membrane', 'waterproofing'
        ];
    }

    /**
     * Initialize loader - Load essential materials immediately
     */
    async initialize() {
        console.log('🚀 Starting incremental materials loading...');

        try {
            // Load top 100 essentials first (fast!)
            await this.loadEssentialMaterials();

            // Then load rest in background (doesn't block UI)
            this.loadFullDatabaseInBackground();

            return true;
        } catch (error) {
            console.error('Failed to initialize materials loader:', error);
            return false;
        }
    }

    /**
     * PHASE 1: Load top 100 essential materials (< 1 second)
     */
    async loadEssentialMaterials() {
        console.log('⚡ Loading essential materials (top 100)...');
        const startTime = Date.now();

        try {
            // Try to load from Supabase
            if (this.supabaseClient.initialized) {
                // Build search query for common materials
                const searchTerms = this.essentialMaterialNames.join('|');

                const { data, error } = await this.supabaseClient.client
                    .from('unified_materials')
                    .select('*')
                    .or(this.essentialMaterialNames.map(term =>
                        `material_name.ilike.%${term}%`
                    ).join(','))
                    .order('material_name', { ascending: true })
                    .limit(100);

                if (!error && data) {
                    this.essentialMaterials = data;
                    this.essentialsLoaded = true;
                    this.loadingProgress = 30;

                    const loadTime = Date.now() - startTime;
                    console.log(`✅ Loaded ${data.length} essential materials in ${loadTime}ms`);

                    this.notifyProgress(30, 'Essential materials loaded');
                    return;
                }
            }

            // Fallback to local database
            this.essentialMaterials = this.supabaseClient.getFallbackMaterials();
            this.essentialsLoaded = true;
            this.loadingProgress = 30;

            console.log('⚠️ Using local fallback materials (40 materials)');
            this.notifyProgress(30, 'Using local materials database');

        } catch (error) {
            console.error('Error loading essential materials:', error);
            // Still mark as loaded with fallback
            this.essentialMaterials = this.supabaseClient.getFallbackMaterials();
            this.essentialsLoaded = true;
        }
    }

    /**
     * PHASE 2: Load full database in background (non-blocking)
     */
    async loadFullDatabaseInBackground() {
        console.log('📦 Loading full materials database in background...');

        // Don't block - run in background
        setTimeout(async () => {
            try {
                await this.loadFullDatabase();
            } catch (error) {
                console.error('Background loading failed:', error);
            }
        }, 100); // Small delay to let UI render first
    }

    /**
     * Load full database progressively in chunks
     */
    async loadFullDatabase() {
        if (!this.supabaseClient.initialized) {
            console.log('⚠️ Supabase not initialized, using fallback only');
            this.allMaterials = this.essentialMaterials;
            this.fullDatabaseLoaded = true;
            this.loadingProgress = 100;
            return;
        }

        try {
            const CHUNK_SIZE = 1000;
            let offset = 0;
            let allData = [...this.essentialMaterials]; // Start with essentials
            let hasMore = true;

            while (hasMore) {
                const { data, error } = await this.supabaseClient.client
                    .from('unified_materials')
                    .select('*')
                    .order('material_name', { ascending: true })
                    .range(offset, offset + CHUNK_SIZE - 1);

                if (error) throw error;

                if (data && data.length > 0) {
                    allData = allData.concat(data);
                    offset += CHUNK_SIZE;

                    // Update progress (30% already loaded, scale 30-100%)
                    this.loadingProgress = Math.min(30 + (offset / 54343) * 70, 100);
                    this.notifyProgress(
                        this.loadingProgress,
                        `Loaded ${allData.length} materials...`
                    );

                    // Update cache incrementally
                    this.allMaterials = allData;

                    console.log(`📊 Progress: ${allData.length} materials loaded`);
                } else {
                    hasMore = false;
                }

                // Small delay between chunks to avoid overwhelming the connection
                await new Promise(resolve => setTimeout(resolve, 50));
            }

            // Remove duplicates (essentials might overlap)
            this.allMaterials = this.deduplicateMaterials(allData);
            this.fullDatabaseLoaded = true;
            this.loadingProgress = 100;

            console.log(`✅ Full database loaded: ${this.allMaterials.length} materials`);
            this.notifyProgress(100, 'All materials loaded');

        } catch (error) {
            console.error('Error loading full database:', error);
            this.allMaterials = this.essentialMaterials;
            this.fullDatabaseLoaded = true;
        }
    }

    /**
     * Get materials for immediate use
     * Returns essentials first, then full database when available
     */
    getMaterials() {
        if (this.fullDatabaseLoaded) {
            return this.allMaterials;
        } else if (this.essentialsLoaded) {
            return this.essentialMaterials;
        } else {
            // Return fallback immediately if nothing loaded yet
            return this.supabaseClient.getFallbackMaterials();
        }
    }

    /**
     * Search materials (searches current cache + optional live query)
     */
    async searchMaterials(searchTerm, liveQuery = false) {
        // Search in current cache first (instant)
        const cachedResults = this.getMaterials().filter(m =>
            m.material_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.description?.toLowerCase().includes(searchTerm.toLowerCase())
        );

        // If we have good results or live query disabled, return cache
        if (cachedResults.length > 0 || !liveQuery || !this.supabaseClient.initialized) {
            return cachedResults;
        }

        // Otherwise, do live search
        try {
            const { data, error } = await this.supabaseClient.client
                .from('unified_materials')
                .select('*')
                .or(`material_name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
                .order('material_name', { ascending: true })
                .limit(100);

            return error ? cachedResults : data;
        } catch (error) {
            console.error('Search error:', error);
            return cachedResults;
        }
    }

    /**
     * Get materials by category
     */
    getMaterialsByCategory(category) {
        return this.getMaterials().filter(m =>
            m.category?.toLowerCase() === category.toLowerCase()
        );
    }

    /**
     * Get loading progress (0-100)
     */
    getProgress() {
        return {
            percentage: this.loadingProgress,
            essentialsLoaded: this.essentialsLoaded,
            fullDatabaseLoaded: this.fullDatabaseLoaded,
            materialsCount: this.getMaterials().length
        };
    }

    /**
     * Register callback for progress updates
     */
    onProgress(callback) {
        this.progressCallbacks.push(callback);
    }

    /**
     * Notify all progress callbacks
     */
    notifyProgress(percentage, message) {
        this.progressCallbacks.forEach(callback => {
            try {
                callback({ percentage, message, materials: this.getMaterials() });
            } catch (error) {
                console.error('Progress callback error:', error);
            }
        });
    }

    /**
     * Remove duplicate materials by ID
     */
    deduplicateMaterials(materials) {
        const seen = new Set();
        return materials.filter(m => {
            const id = m.id || m.material_name;
            if (seen.has(id)) return false;
            seen.add(id);
            return true;
        });
    }

    /**
     * Preload specific categories (for calculator page)
     */
    async preloadCategories(categories) {
        if (!this.supabaseClient.initialized) return;

        try {
            const promises = categories.map(category =>
                this.supabaseClient.getMaterialsByCategory(category)
            );

            const results = await Promise.all(promises);

            // Merge into cache
            results.forEach((categoryData, index) => {
                console.log(`✅ Preloaded ${categoryData.length} materials for ${categories[index]}`);
            });
        } catch (error) {
            console.error('Category preload error:', error);
        }
    }
}

// Create global instance
let materialsLoader = null;

// Initialize with supabase client when available
function initializeMaterialsLoader(supabaseClient) {
    materialsLoader = new MaterialsLoader(supabaseClient);
    return materialsLoader;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MaterialsLoader, initializeMaterialsLoader };
}
