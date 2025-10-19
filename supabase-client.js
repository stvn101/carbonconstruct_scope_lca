/**
 * CARBONCONSTRUCT - SUPABASE CLIENT
 * 
 * Database: 54,343+ materials
 * - NABERS materials
 * - EPD Australasia
 * - EC3 Database (50,000+ EPDs)
 */

// ============================================
// CONFIGURATION
// ============================================

// TODO: Replace these with your actual Supabase credentials
const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // e.g., https://abcdefgh.supabase.co
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // Your anon/public key

// Initialize Supabase client
let supabaseClient = null;

function initSupabase() {
    if (typeof window.supabase === 'undefined') {
        console.error('Supabase library not loaded. Include: <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>');
        return false;
    }
    
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase client initialized');
    return true;
}

// ============================================
// MATERIALS DATABASE FUNCTIONS
// ============================================

/**
 * Search materials by name
 * @param {string} query - Search query
 * @param {string|null} category - Optional category filter
 * @param {number} limit - Max results (default: 50)
 * @returns {Promise<Array>} Array of materials
 */
async function searchMaterials(query, category = null, limit = 50) {
    if (!supabaseClient) {
        console.error('Supabase not initialized');
        return [];
    }
    
    try {
        let request = supabaseClient
            .from('unified_materials')
            .select('*')
            .ilike('material_name', `%${query}%`)
            .limit(limit);
        
        if (category) {
            request = request.eq('category', category);
        }
        
        const { data, error } = await request;
        
        if (error) throw error;
        
        console.log(`Found ${data.length} materials for "${query}"`);
        return data;
    } catch (error) {
        console.error('Error searching materials:', error);
        return [];
    }
}

/**
 * Get material by ID
 * @param {string} id - Material UUID
 * @returns {Promise<Object|null>} Material object
 */
async function getMaterialById(id) {
    if (!supabaseClient) {
        console.error('Supabase not initialized');
        return null;
    }
    
    try {
        const { data, error } = await supabaseClient
            .from('unified_materials')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        return data;
    } catch (error) {
        console.error('Error fetching material:', error);
        return null;
    }
}

/**
 * Get all unique categories
 * @returns {Promise<Array>} Array of category names
 */
async function getCategories() {
    if (!supabaseClient) {
        console.error('Supabase not initialized');
        return [];
    }
    
    try {
        const { data, error } = await supabaseClient
            .from('unified_materials')
            .select('category')
            .not('category', 'is', null);
        
        if (error) throw error;
        
        // Get unique categories
        const categories = [...new Set(data.map(item => item.category))];
        console.log(`Found ${categories.length} categories`);
        return categories.sort();
    } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
    }
}

/**
 * Get materials by category
 * @param {string} category - Category name
 * @param {number} limit - Max results (default: 100)
 * @returns {Promise<Array>} Array of materials
 */
async function getMaterialsByCategory(category, limit = 100) {
    if (!supabaseClient) {
        console.error('Supabase not initialized');
        return [];
    }
    
    try {
        const { data, error } = await supabaseClient
            .from('unified_materials')
            .select('*')
            .eq('category', category)
            .limit(limit);
        
        if (error) throw error;
        
        return data;
    } catch (error) {
        console.error('Error fetching materials by category:', error);
        return [];
    }
}

/**
 * Get materials by source (NABERS, EPD_AU, EC3)
 * @param {string} source - Source identifier
 * @param {number} limit - Max results (default: 100)
 * @returns {Promise<Array>} Array of materials
 */
async function getMaterialsBySource(source, limit = 100) {
    if (!supabaseClient) {
        console.error('Supabase not initialized');
        return [];
    }
    
    try {
        const { data, error } = await supabaseClient
            .from('unified_materials')
            .select('*')
            .eq('source', source)
            .limit(limit);
        
        if (error) throw error;
        
        return data;
    } catch (error) {
        console.error('Error fetching materials by source:', error);
        return [];
    }
}

/**
 * Get database statistics
 * @returns {Promise<Object>} Stats object
 */
async function getDatabaseStats() {
    if (!supabaseClient) {
        console.error('Supabase not initialized');
        return null;
    }
    
    try {
        // Total materials count
        const { count: totalCount, error: countError } = await supabaseClient
            .from('unified_materials')
            .select('*', { count: 'exact', head: true });
        
        if (countError) throw countError;
        
        // Count by source
        const { data: sourceCounts, error: sourceError } = await supabaseClient
            .from('unified_materials')
            .select('source');
        
        if (sourceError) throw sourceError;
        
        const sources = sourceCounts.reduce((acc, item) => {
            acc[item.source] = (acc[item.source] || 0) + 1;
            return acc;
        }, {});
        
        return {
            total: totalCount,
            bySource: sources
        };
    } catch (error) {
        console.error('Error fetching database stats:', error);
        return null;
    }
}

// ============================================
// USER PROJECTS FUNCTIONS
// ============================================

/**
 * Save a project
 * @param {Object} projectData - Project details
 * @returns {Promise<Object|null>} Saved project
 */
async function saveProject(projectData) {
    if (!supabaseClient) {
        console.error('Supabase not initialized');
        return null;
    }
    
    try {
        const { data, error } = await supabaseClient
            .from('projects')
            .insert([projectData])
            .select()
            .single();
        
        if (error) throw error;
        
        console.log('Project saved successfully:', data.id);
        return data;
    } catch (error) {
        console.error('Error saving project:', error);
        return null;
    }
}

/**
 * Get user's projects
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of projects
 */
async function getUserProjects(userId) {
    if (!supabaseClient) {
        console.error('Supabase not initialized');
        return [];
    }
    
    try {
        const { data, error } = await supabaseClient
            .from('projects')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        return data;
    } catch (error) {
        console.error('Error fetching user projects:', error);
        return [];
    }
}

/**
 * Update a project
 * @param {string} projectId - Project ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object|null>} Updated project
 */
async function updateProject(projectId, updates) {
    if (!supabaseClient) {
        console.error('Supabase not initialized');
        return null;
    }
    
    try {
        const { data, error } = await supabaseClient
            .from('projects')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', projectId)
            .select()
            .single();
        
        if (error) throw error;
        
        console.log('Project updated successfully');
        return data;
    } catch (error) {
        console.error('Error updating project:', error);
        return null;
    }
}

/**
 * Delete a project
 * @param {string} projectId - Project ID
 * @returns {Promise<boolean>} Success status
 */
async function deleteProject(projectId) {
    if (!supabaseClient) {
        console.error('Supabase not initialized');
        return false;
    }
    
    try {
        const { error } = await supabaseClient
            .from('projects')
            .delete()
            .eq('id', projectId);
        
        if (error) throw error;
        
        console.log('Project deleted successfully');
        return true;
    } catch (error) {
        console.error('Error deleting project:', error);
        return false;
    }
}

// ============================================
// EXPORT PUBLIC API
// ============================================

window.materialsDB = {
    // Initialization
    init: initSupabase,
    
    // Materials
    search: searchMaterials,
    getById: getMaterialById,
    getCategories: getCategories,
    getByCategory: getMaterialsByCategory,
    getBySource: getMaterialsBySource,
    getStats: getDatabaseStats,
    
    // Projects
    saveProject: saveProject,
    getUserProjects: getUserProjects,
    updateProject: updateProject,
    deleteProject: deleteProject
};

// Auto-initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSupabase);
} else {
    initSupabase();
}

console.log('🗄️ Materials Database API loaded. Access via: window.materialsDB');
console.log('📊 Database: 54,343+ materials (NABERS + EPD AU + EC3)');
