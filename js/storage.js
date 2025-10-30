/**
 * Data Storage Module using RESTful Table API
 * Handles saving and loading projects to/from the database
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
     * Save a project to the database
     * Returns the saved project with ID
     */
    async saveProject(projectData) {
        try {
            await this.initialize();
            
            // Prepare project data for storage
            const dataToSave = {
                projectName: projectData.projectName || 'Untitled Project',
                projectType: projectData.projectType || 'commercial',
                gfa: projectData.gfa || 0,
                designLife: projectData.designLife || 50,
                materials: JSON.stringify(projectData.materials || []),
                totalCarbon: projectData.totalCarbon || 0,
                carbonIntensity: projectData.carbonIntensity || 0,
                lcaResults: JSON.stringify(projectData.lcaResults || {}),
                scopesResults: JSON.stringify(projectData.scopesResults || {}),
                complianceResults: JSON.stringify(projectData.complianceResults || {}),
                lastModified: new Date().toISOString()
            };

            // If project has an ID, update it; otherwise create new
            if (projectData.id) {
                const response = await fetch(`tables/${this.tableName}/${projectData.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(dataToSave)
                });

                if (!response.ok) {
                    throw new Error(`Failed to update project: ${response.statusText}`);
                }

                const result = await response.json();
                console.log('Project updated successfully:', result.id);
                return result;
            } else {
                const response = await fetch(`tables/${this.tableName}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(dataToSave)
                });

                if (!response.ok) {
                    throw new Error(`Failed to save project: ${response.statusText}`);
                }

                const result = await response.json();
                console.log('Project saved successfully:', result.id);
                return result;
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
            await this.initialize();
            
            const response = await fetch(`tables/${this.tableName}?page=${page}&limit=${limit}&sort=-updated_at`);
            
            if (!response.ok) {
                throw new Error(`Failed to load projects: ${response.statusText}`);
            }

            const result = await response.json();
            
            // Parse JSON fields back to objects
            const projects = result.data.map(project => ({
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
            await this.initialize();
            
            const response = await fetch(`tables/${this.tableName}/${projectId}`);
            
            if (!response.ok) {
                throw new Error(`Failed to load project: ${response.statusText}`);
            }

            const project = await response.json();
            
            // Parse JSON fields
            return {
                ...project,
                materials: this.safeJsonParse(project.materials, []),
                lcaResults: this.safeJsonParse(project.lcaResults, {}),
                scopesResults: this.safeJsonParse(project.scopesResults, {}),
                complianceResults: this.safeJsonParse(project.complianceResults, {})
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
            await this.initialize();
            
            const response = await fetch(`tables/${this.tableName}/${projectId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error(`Failed to delete project: ${response.statusText}`);
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
            await this.initialize();
            
            const response = await fetch(`tables/${this.tableName}?search=${encodeURIComponent(searchTerm)}`);
            
            if (!response.ok) {
                throw new Error(`Failed to search projects: ${response.statusText}`);
            }

            const result = await response.json();
            
            const projects = result.data.map(project => ({
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
