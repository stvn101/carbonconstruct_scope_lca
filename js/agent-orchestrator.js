/**
 * Agent Orchestrator
 *
 * Manages invocations of Claude Code agents from the frontend.
 * Handles request formatting, response parsing, error handling, and fallback logic.
 *
 * Available Agents:
 * - cc-lca-analyst: LCA calculations with ISO compliance
 * - compliance-checker: NCC, NABERS, Green Star, TCFD validation
 * - materials-database-manager: Database sync and management
 * - construction-estimator: Cost estimation with carbon integration
 */

class AgentOrchestrator {
  constructor() {
    this.apiEndpoint = '/api/invoke-agent';
    this.cache = new Map();
    this.cacheTimeout = 3600000; // 1 hour
    this.requestTimeout = 30000; // 30 seconds
  }

  /**
   * Invoke LCA Analyst Agent
   *
   * @param {Object} projectData - Project information
   * @param {Array} materials - List of materials with quantities
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} LCA calculation results
   */
  async invokeLCAAgent(projectData, materials, options = {}) {
    const payload = {
      agentType: 'cc-lca-analyst',
      action: options.action || 'calculate_lca',
      data: {
        projectInfo: {
          name: projectData.name || 'Untitled Project',
          gfa: projectData.gfa,
          designLife: projectData.designLife || 50,
          location: projectData.location || 'Australia',
          buildingType: projectData.buildingType || 'commercial'
        },
        materials: materials.map(m => ({
          name: m.name,
          category: m.category,
          quantity: m.quantity,
          unit: m.unit,
          carbonFactor: m.carbonFactor || m.embodiedCarbon
        }))
      },
      options: {
        includeHotspotAnalysis: options.includeHotspotAnalysis !== false,
        generateReport: options.generateReport || false,
        complianceFrameworks: options.complianceFrameworks || ['NCC', 'NABERS', 'GreenStar']
      }
    };

    return this.invokeAgent(payload);
  }

  /**
   * Invoke Compliance Checker Agent
   *
   * @param {Object} carbonResults - LCA calculation results
   * @param {string} projectType - Type of project (residential, commercial, etc.)
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Compliance check results
   */
  async invokeComplianceAgent(carbonResults, projectType, options = {}) {
    const payload = {
      agentType: 'compliance-checker',
      action: options.action || 'check_compliance',
      data: {
        carbonIntensity: carbonResults.carbonIntensity,
        totalEmbodiedCarbon: carbonResults.totalEmbodiedCarbon,
        projectType: projectType,
        gfa: carbonResults.gfa,
        targetRating: options.targetRating
      },
      options: {
        frameworks: options.frameworks || ['NCC', 'NABERS', 'GreenStar', 'TCFD'],
        generateReport: options.generateReport || false,
        includeGapAnalysis: options.includeGapAnalysis !== false
      }
    };

    return this.invokeAgent(payload);
  }

  /**
   * Invoke Materials Database Manager Agent
   *
   * @param {string} action - Action to perform (sync_database, validate_data, search_materials)
   * @param {Object} data - Action-specific data
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Action results
   */
  async invokeMaterialsDBAgent(action, data = {}, options = {}) {
    const payload = {
      agentType: 'materials-database-manager',
      action: action,
      data: data,
      options: options
    };

    return this.invokeAgent(payload);
  }

  /**
   * Invoke Construction Estimator Agent
   *
   * @param {File} rbssFile - RBSS extract file
   * @param {Object} projectSpecs - Project specifications
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Cost estimation results
   */
  async invokeEstimatorAgent(rbssFile, projectSpecs, options = {}) {
    // Parse RBSS file if needed
    let rbssData = rbssFile;
    if (rbssFile instanceof File) {
      rbssData = await this.parseRBSSFile(rbssFile);
    }

    const payload = {
      agentType: 'construction-estimator',
      action: options.action || 'estimate_costs',
      data: {
        rbssData: rbssData,
        projectSpecs: projectSpecs
      },
      options: {
        includeCarbon: options.includeCarbon !== false,
        optimizeCostCarbon: options.optimizeCostCarbon || false
      }
    };

    return this.invokeAgent(payload);
  }

  /**
   * Generic agent invocation method
   *
   * @param {Object} payload - Complete payload for agent invocation
   * @returns {Promise<Object>} Agent response
   */
  async invokeAgent(payload) {
    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(payload);
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          console.log(`[AgentOrchestrator] Cache hit for ${payload.agentType}`);
          return cached.data;
        } else {
          this.cache.delete(cacheKey);
        }
      }

      // Get auth token
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('Authentication required. Please sign in.');
      }

      // Show loading indicator
      this.showLoadingIndicator(payload.agentType);

      // Make API request with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);

      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Agent invocation failed: ${response.status}`);
      }

      const result = await response.json();

      // Cache successful result
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      this.hideLoadingIndicator();
      return result;

    } catch (error) {
      this.hideLoadingIndicator();

      // Handle specific error types
      if (error.name === 'AbortError') {
        console.warn('[AgentOrchestrator] Request timeout, falling back to standard mode');
        this.showNotification('AI analysis timed out. Using standard calculation.', 'warning');
        throw new AgentTimeoutError('Agent request timed out');
      }

      console.error('[AgentOrchestrator] Agent invocation failed:', error);
      this.showNotification(error.message || 'AI analysis failed. Please try again.', 'error');
      throw error;
    }
  }

  /**
   * Parse BIM file (CSV, Excel, IFC)
   *
   * @param {File} file - BIM schedule file
   * @returns {Promise<Array>} Parsed materials list
   */
  async parseBIMFile(file) {
    const payload = {
      agentType: 'cc-lca-analyst',
      action: 'parse_bim',
      data: {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        fileContent: await this.readFileAsText(file)
      },
      options: {
        autoMatchMaterials: true
      }
    };

    const result = await this.invokeAgent(payload);
    return result.results.materials;
  }

  /**
   * Generate AI-powered LCA report
   *
   * @param {Object} lcaResults - LCA calculation results
   * @param {Object} options - Report options
   * @returns {Promise<Object>} Generated report
   */
  async generateLCAReport(lcaResults, options = {}) {
    const payload = {
      agentType: 'cc-lca-analyst',
      action: 'generate_report',
      data: lcaResults,
      options: {
        format: options.format || 'markdown',
        includePDF: options.includePDF || false,
        includeCharts: options.includeCharts !== false,
        includeRecommendations: options.includeRecommendations !== false
      }
    };

    const result = await this.invokeAgent(payload);
    return result.results.report;
  }

  /**
   * Analyze carbon hotspots with AI insights
   *
   * @param {Array} materials - Materials list
   * @param {Object} lcaResults - LCA results
   * @returns {Promise<Object>} Hotspot analysis
   */
  async analyzeHotspots(materials, lcaResults) {
    const payload = {
      agentType: 'cc-lca-analyst',
      action: 'analyze_hotspots',
      data: {
        materials: materials,
        lcaResults: lcaResults
      },
      options: {
        includeAlternatives: true,
        includeRecommendations: true
      }
    };

    const result = await this.invokeAgent(payload);
    return result.results;
  }

  /**
   * Generate compliance report
   *
   * @param {Object} complianceResults - Compliance check results
   * @param {Object} options - Report options
   * @returns {Promise<Object>} Compliance report
   */
  async generateComplianceReport(complianceResults, options = {}) {
    const payload = {
      agentType: 'compliance-checker',
      action: 'generate_report',
      data: complianceResults,
      options: {
        format: options.format || 'markdown',
        includeCertificationRoadmap: options.includeCertificationRoadmap !== false,
        includeGapAnalysis: options.includeGapAnalysis !== false
      }
    };

    const result = await this.invokeAgent(payload);
    return result.results.report;
  }

  /**
   * Perform gap analysis for target rating
   *
   * @param {Object} currentStatus - Current compliance status
   * @param {string} targetRating - Target rating (e.g., '6-star NABERS')
   * @returns {Promise<Object>} Gap analysis results
   */
  async performGapAnalysis(currentStatus, targetRating) {
    const payload = {
      agentType: 'compliance-checker',
      action: 'gap_analysis',
      data: {
        currentStatus: currentStatus,
        targetRating: targetRating
      },
      options: {
        includeActionPlan: true,
        includeCostEstimate: false
      }
    };

    const result = await this.invokeAgent(payload);
    return result.results;
  }

  /**
   * Search materials database with natural language
   *
   * @param {string} query - Natural language search query
   * @returns {Promise<Array>} Matched materials
   */
  async searchMaterials(query) {
    const payload = {
      agentType: 'materials-database-manager',
      action: 'search_materials',
      data: {
        query: query
      },
      options: {
        limit: 10,
        includeAlternatives: true
      }
    };

    const result = await this.invokeAgent(payload);
    return result.results.results;
  }

  // ============================================
  // Helper Methods
  // ============================================

  /**
   * Generate cache key for request
   */
  generateCacheKey(payload) {
    return JSON.stringify({
      agent: payload.agentType,
      action: payload.action,
      data: payload.data
    });
  }

  /**
   * Get authentication token from Supabase
   */
  async getAuthToken() {
    if (typeof window.supabase !== 'undefined') {
      const { data: { session } } = await window.supabase.auth.getSession();
      return session?.access_token;
    }
    return null;
  }

  /**
   * Read file as text
   */
  async readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  }

  /**
   * Parse RBSS file
   */
  async parseRBSSFile(file) {
    const content = await this.readFileAsText(file);
    // Simple CSV parser (expand as needed)
    const lines = content.split('\n');
    const headers = lines[0].split(',');
    return lines.slice(1).map(line => {
      const values = line.split(',');
      return headers.reduce((obj, header, i) => {
        obj[header.trim()] = values[i]?.trim();
        return obj;
      }, {});
    });
  }

  /**
   * Show loading indicator
   */
  showLoadingIndicator(agentType) {
    const agentNames = {
      'cc-lca-analyst': 'LCA Analysis',
      'compliance-checker': 'Compliance Check',
      'materials-database-manager': 'Database Operation',
      'construction-estimator': 'Cost Estimation'
    };

    const message = `AI ${agentNames[agentType] || 'Analysis'} in progress...`;

    // Check if notification system exists
    if (typeof window.showNotification === 'function') {
      window.showNotification(message, 'info', 0); // 0 = don't auto-hide
    } else {
      console.log(`[AgentOrchestrator] ${message}`);
    }

    // Show loading overlay if available
    if (typeof window.showLoadingOverlay === 'function') {
      window.showLoadingOverlay(message);
    }
  }

  /**
   * Hide loading indicator
   */
  hideLoadingIndicator() {
    if (typeof window.hideLoadingOverlay === 'function') {
      window.hideLoadingOverlay();
    }
  }

  /**
   * Show notification to user
   */
  showNotification(message, type = 'info') {
    if (typeof window.showNotification === 'function') {
      window.showNotification(message, type);
    } else {
      console.log(`[AgentOrchestrator] ${type.toUpperCase()}: ${message}`);
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    console.log('[AgentOrchestrator] Cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

/**
 * Custom error for agent timeouts
 */
class AgentTimeoutError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AgentTimeoutError';
  }
}

/**
 * Custom error for subscription limits
 */
class SubscriptionLimitError extends Error {
  constructor(message) {
    super(message);
    this.name = 'SubscriptionLimitError';
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AgentOrchestrator, AgentTimeoutError, SubscriptionLimitError };
}

// Create global instance
window.agentOrchestrator = new AgentOrchestrator();

console.log('[AgentOrchestrator] Initialized successfully');
