/**
 * Data Storage Module using RESTful Table API
 * Handles saving and loading projects to/from the database
 */

class StorageManager {
    constructor() {
        this.tableName = 'carbon_projects';
        this.initialized = false;
        this.client = null;
        this.supabaseUrl = null;
        this.supabaseAnonKey = null;
    }

    /**
     * Initialize the database table schema
     * This needs to be called once when the app first loads
     */
    async initialize() {
        if (this.initialized && this.client) return;

        const { url, key } = this.resolveCredentials();
        if (!url || !key) {
            console.warn('Supabase credentials not provided. Set SUPABASE_URL and SUPABASE_ANON_KEY to enable persistence.');
            this.initialized = false;
            return;
        }

        if (typeof window === 'undefined' || typeof window.supabase === 'undefined') {
            console.error('Supabase client library not loaded. Include https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.');
            this.initialized = false;
            return;
        }

        this.client = window.supabase.createClient(url, key);
        this.supabaseUrl = url;
        this.supabaseAnonKey = key;
        this.initialized = true;
        console.log('Storage initialized successfully with Supabase client');
    }

    /**
     * Resolve Supabase credentials from environment (browser safe)
     */
    resolveCredentials() {
        const env = (typeof window !== 'undefined' && window.ENV) ? window.ENV : {};
        const url = env.SUPABASE_URL || (typeof window !== 'undefined' ? window.SUPABASE_URL : '') ||
            (typeof process !== 'undefined' ? (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '') : '');
        const key = env.SUPABASE_ANON_KEY || (typeof window !== 'undefined' ? window.SUPABASE_ANON_KEY : '') ||
            (typeof process !== 'undefined' ? (process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '') : '');

        return { url, key };
    }

    /**
     * Ensure the Supabase client is ready before issuing queries
     */
    async ensureClient() {
        await this.initialize();
        if (!this.client) {
            throw new Error('Supabase client not initialized. Check SUPABASE_URL and SUPABASE_ANON_KEY configuration.');
        }
    }

    /**
     * Save a project to the database
     * Returns the saved project with ID
     */
    async saveProject(projectData) {
        try {
            await this.ensureClient();

            // Prepare project data for storage
            const dataToSave = {
                projectName: projectData.projectName || 'Untitled Project',
                projectType: projectData.projectType || 'commercial',
                gfa: projectData.gfa || 0,
                designLife: projectData.designLife || 50,
                materials: JSON.stringify(projectData.materials || []),
                totalCarbon: projectData.totalCarbon || 0,
                wholeLifeCarbon: projectData.wholeLifeCarbon || projectData.totalCarbon || 0,
                embodiedCarbon: projectData.embodiedCarbon || projectData.totalCarbon || 0,
                carbonScope: projectData.carbonScope || 'wholeLife',
                carbonIntensity: projectData.carbonIntensity || 0,
                lcaResults: JSON.stringify(projectData.lcaResults || {}),
                scopesResults: JSON.stringify(projectData.scopesResults || {}),
                complianceResults: JSON.stringify(projectData.complianceResults || {}),
                lastModified: new Date().toISOString()
            };

            // If project has an ID, update it; otherwise create new
            if (projectData.id) {
                const { data, error } = await this.client
                    .from(this.tableName)
                    .update(dataToSave)
                    .eq('id', projectData.id)
                    .select()
                    .single();

                if (error) {
                    throw error;
                }

                console.log('Project updated successfully:', data.id);
                return data;
            } else {
                const { data, error } = await this.client
                    .from(this.tableName)
                    .insert(dataToSave)
                    .select()
                    .single();

                if (error) {
                    throw error;
                }

                console.log('Project saved successfully:', data.id);
                return data;
            }
        } catch (error) {
            console.error('Error saving project:', error);
            throw error;
        }
    }

    /**
     * Load all saved projects
     * Returns array of projects
     */
    async loadAllProjects(page = 1, limit = 100) {
        try {
            await this.ensureClient();

            const from = (page - 1) * limit;
            const to = from + limit - 1;
            const { data, error } = await this.client
                .from(this.tableName)
                .select('*')
                .order('lastModified', { ascending: false, nullsFirst: false })
                .range(from, to);

            if (error) {
                throw error;
            }

            const projects = (data || []).map(project => ({
                ...project,
                materials: this.safeJsonParse(project.materials, []),
                lcaResults: this.safeJsonParse(project.lcaResults, {}),
                scopesResults: this.safeJsonParse(project.scopesResults, {}),
                complianceResults: this.safeJsonParse(project.complianceResults, {})
            }));

            console.log(`Loaded ${projects.length} projects`);
            return projects;
        } catch (error) {
            console.error('Error loading projects:', error);
            return [];
        }
    }

    /**
     * Load a specific project by ID
     */
    async loadProject(projectId) {
        try {
            await this.ensureClient();

            const { data, error } = await this.client
                .from(this.tableName)
                .select('*')
                .eq('id', projectId)
                .single();

            if (error) {
                throw error;
            }

            // Parse JSON fields
            return {
                ...data,
                materials: this.safeJsonParse(data.materials, []),
                lcaResults: this.safeJsonParse(data.lcaResults, {}),
                scopesResults: this.safeJsonParse(data.scopesResults, {}),
                complianceResults: this.safeJsonParse(data.complianceResults, {})
            };
        } catch (error) {
            console.error('Error loading project:', error);
            throw error;
        }
    }

    /**
     * Delete a project
     */
    async deleteProject(projectId) {
        try {
            await this.ensureClient();

            const { error } = await this.client
                .from(this.tableName)
                .delete()
                .eq('id', projectId);

            if (error) {
                throw error;
            }

            console.log('Project deleted successfully:', projectId);
            return true;
        } catch (error) {
            console.error('Error deleting project:', error);
            throw error;
        }
    }

    /**
     * Search projects by name
     */
    async searchProjects(searchTerm) {
        try {
            await this.ensureClient();

            const { data, error } = await this.client
                .from(this.tableName)
                .select('*')
                .ilike('projectName', `%${searchTerm}%`)
                .order('lastModified', { ascending: false, nullsFirst: false });

            if (error) {
                throw error;
            }

            const projects = (data || []).map(project => ({
                ...project,
                materials: this.safeJsonParse(project.materials, []),
                lcaResults: this.safeJsonParse(project.lcaResults, {}),
                scopesResults: this.safeJsonParse(project.scopesResults, {}),
                complianceResults: this.safeJsonParse(project.complianceResults, {})
            }));

            return projects;
        } catch (error) {
            console.error('Error searching projects:', error);
            return [];
        }
    }

    /**
     * Helper: Safely parse JSON strings
     */
    safeJsonParse(jsonString, defaultValue) {
        try {
            return typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
        } catch (error) {
            console.warn('Failed to parse JSON:', error);
            return defaultValue;
        }
    }

    /**
     * Export project data as JSON file
     */
    exportProjectAsJSON(projectData) {
        const dataStr = JSON.stringify(projectData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `carbon-project-${projectData.projectName || 'export'}-${Date.now()}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }

    /**
     * Export project report as text
     */
    exportProjectReport(projectData) {
        let report = `EMBODIED CARBON ASSESSMENT REPORT\n`;
        report += `=====================================\n\n`;
        report += `Project: ${projectData.projectName}\n`;
        report += `Type: ${projectData.projectType}\n`;
        report += `Gross Floor Area: ${projectData.gfa} m²\n`;
        report += `Design Life: ${projectData.designLife} years\n`;
        report += `Report Date: ${new Date().toLocaleDateString()}\n\n`;
        
        report += `SUMMARY\n`;
        report += `-------\n`;
        const scope = projectData.carbonScope === 'wholeLife' ? 'Whole Life' : 'Embodied Only';
        report += `${scope} Carbon: ${projectData.totalCarbon.toLocaleString()} kg CO2-e\n`;
        if (projectData.wholeLifeCarbon !== undefined) {
            report += `Whole Life Carbon (A1-A5 + B + C): ${projectData.wholeLifeCarbon.toLocaleString()} kg CO2-e\n`;
        }
        if (projectData.embodiedCarbon !== undefined) {
            report += `Embodied Carbon (A1-A5): ${projectData.embodiedCarbon.toLocaleString()} kg CO2-e\n`;
        }
        report += `Carbon Intensity: ${projectData.carbonIntensity.toFixed(1)} kg CO2-e/m²\n\n`;
        
        if (projectData.lcaResults && projectData.lcaResults.totals) {
            report += `LIFE CYCLE ASSESSMENT\n`;
            report += `---------------------\n`;
            report += `Product Stage (A1-A3): ${projectData.lcaResults.totals.a1a3.toLocaleString()} kg CO2-e\n`;
            report += `Construction Stage (A4-A5): ${projectData.lcaResults.totals.a4a5.toLocaleString()} kg CO2-e\n`;
            report += `Use Stage (B1-B7): ${projectData.lcaResults.totals.b1b7.toLocaleString()} kg CO2-e\n`;
            report += `End of Life (C1-C4): ${projectData.lcaResults.totals.c1c4.toLocaleString()} kg CO2-e\n\n`;
        }
        
        if (projectData.complianceResults) {
            report += `COMPLIANCE STATUS\n`;
            report += `-----------------\n`;
            if (projectData.complianceResults.ncc) {
                report += `NCC 2022: ${projectData.complianceResults.ncc.level}\n`;
            }
            if (projectData.complianceResults.nabers) {
                report += `NABERS Rating: ${projectData.complianceResults.nabers.stars} stars\n`;
            }
            if (projectData.complianceResults.greenStar) {
                report += `Green Star: ${projectData.complianceResults.greenStar.stars} stars (${projectData.complianceResults.greenStar.certification})\n`;
            }
        }
        
        // Create and download
        const dataUri = 'data:text/plain;charset=utf-8,'+ encodeURIComponent(report);
        const exportFileDefaultName = `carbon-report-${projectData.projectName || 'export'}-${Date.now()}.txt`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }
}

// Create global instance
const storageManager = new StorageManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { StorageManager, storageManager };
}
 
