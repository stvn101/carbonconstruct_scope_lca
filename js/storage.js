/**
 * Data Storage Module using localStorage
 * Handles saving and loading projects to/from browser localStorage
 * All data is stored client-side and persists across browser sessions
 */

class StorageManager {
    constructor() {
        this.tableName = 'carbon_projects';
        this.initialized = false;
    }

    /**
     * Initialize the database table schema
     * This needs to be called once when the app first loads
     */
    async initialize() {
        if (this.initialized) return;
        
        try {
            // The table schema is already defined in the project
            // We just need to verify we can access it
            this.initialized = true;
            console.log('Storage initialized successfully');
        } catch (error) {
            console.error('Failed to initialize storage:', error);
        }
    }

    /**
     * Save a project to localStorage
     * Returns the saved project with ID
     */
    async saveProject(projectData) {
        try {
            await this.initialize();

            // Get existing projects
            const projects = this.getProjectsFromLocalStorage();

            // Prepare project data for storage
            const dataToSave = {
                id: projectData.id || this.generateId(),
                projectName: projectData.projectName || 'Untitled Project',
                projectType: projectData.projectType || 'commercial',
                gfa: projectData.gfa || 0,
                designLife: projectData.designLife || 50,
                materials: projectData.materials || [],
                totalCarbon: projectData.totalCarbon || 0,
                carbonIntensity: projectData.carbonIntensity || 0,
                lcaResults: projectData.lcaResults || {},
                scopesResults: projectData.scopesResults || {},
                complianceResults: projectData.complianceResults || {},
                lastModified: new Date().toISOString(),
                createdAt: projectData.createdAt || new Date().toISOString()
            };

            // If project has an ID, update it; otherwise create new
            const existingIndex = projects.findIndex(p => p.id === dataToSave.id);
            if (existingIndex >= 0) {
                projects[existingIndex] = dataToSave;
                console.log('Project updated successfully:', dataToSave.id);
            } else {
                projects.push(dataToSave);
                console.log('Project saved successfully:', dataToSave.id);
            }

            // Save back to localStorage
            localStorage.setItem(this.tableName, JSON.stringify(projects));

            return dataToSave;
        } catch (error) {
            console.error('Error saving project:', error);
            throw error;
        }
    }

    /**
     * Get all projects from localStorage
     */
    getProjectsFromLocalStorage() {
        try {
            const data = localStorage.getItem(this.tableName);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return [];
        }
    }

    /**
     * Generate a unique ID
     */
    generateId() {
        return 'proj_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Load all saved projects from localStorage
     * Returns array of projects
     */
    async loadAllProjects(page = 1, limit = 100) {
        try {
            await this.initialize();

            // Get all projects from localStorage
            const projects = this.getProjectsFromLocalStorage();

            // Sort by lastModified (newest first)
            projects.sort((a, b) => {
                const dateA = new Date(a.lastModified || a.createdAt || 0);
                const dateB = new Date(b.lastModified || b.createdAt || 0);
                return dateB - dateA;
            });

            // Apply pagination
            const start = (page - 1) * limit;
            const paginatedProjects = projects.slice(start, start + limit);

            console.log(`Loaded ${paginatedProjects.length} of ${projects.length} projects`);
            return paginatedProjects;
        } catch (error) {
            console.error('Error loading projects:', error);
            return [];
        }
    }

    /**
     * Load a specific project by ID from localStorage
     */
    async loadProject(projectId) {
        try {
            await this.initialize();

            const projects = this.getProjectsFromLocalStorage();
            const project = projects.find(p => p.id === projectId);

            if (!project) {
                throw new Error(`Project not found: ${projectId}`);
            }

            console.log('Project loaded:', projectId);
            return project;
        } catch (error) {
            console.error('Error loading project:', error);
            throw error;
        }
    }

    /**
     * Delete a project from localStorage
     */
    async deleteProject(projectId) {
        try {
            await this.initialize();

            const projects = this.getProjectsFromLocalStorage();
            const filteredProjects = projects.filter(p => p.id !== projectId);

            if (projects.length === filteredProjects.length) {
                throw new Error(`Project not found: ${projectId}`);
            }

            localStorage.setItem(this.tableName, JSON.stringify(filteredProjects));
            console.log('Project deleted successfully:', projectId);
            return true;
        } catch (error) {
            console.error('Error deleting project:', error);
            throw error;
        }
    }

    /**
     * Search projects by name in localStorage
     */
    async searchProjects(searchTerm) {
        try {
            await this.initialize();

            const projects = this.getProjectsFromLocalStorage();
            const searchLower = searchTerm.toLowerCase();

            const filteredProjects = projects.filter(project =>
                project.projectName.toLowerCase().includes(searchLower) ||
                (project.projectType && project.projectType.toLowerCase().includes(searchLower))
            );

            console.log(`Found ${filteredProjects.length} projects matching "${searchTerm}"`);
            return filteredProjects;
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
        report += `Total Embodied Carbon: ${projectData.totalCarbon.toLocaleString()} kg CO2-e\n`;
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
