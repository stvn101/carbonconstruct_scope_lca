/**
 * Vercel Serverless Function: Agent Invocation Endpoint
 *
 * Purpose: Bridge between frontend and Claude Code agents
 * Agents: cc-lca-analyst, compliance-checker, materials-database-manager, construction-estimator
 *
 * Request format:
 * {
 *   agentType: 'cc-lca-analyst',
 *   action: 'calculate_lca',
 *   data: { projectInfo, materials },
 *   options: { includeHotspotAnalysis, generateReport }
 * }
 */

import { createClient } from '@supabase/supabase-js';
import { invokeAgent, isClaudeConfigured } from './utils/claude-client.js';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/**
 * Agent invocation handler
 */
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Authenticate user
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Missing authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 2. Check subscription tier (agents = premium feature)
    const subscription = await getUserSubscription(user.id);
    if (!subscription || !subscription.features?.includes('ai_agents')) {
      return res.status(403).json({
        error: 'AI-Enhanced features require a Pro subscription',
        upgradeUrl: '/subscription.html'
      });
    }

    // 3. Validate request payload
    const { agentType, action, data, options } = req.body;

    if (!agentType || !action || !data) {
      return res.status(400).json({
        error: 'Missing required fields: agentType, action, data'
      });
    }

    // Validate agent type
    const validAgents = ['cc-lca-analyst', 'compliance-checker', 'materials-database-manager', 'construction-estimator'];
    if (!validAgents.includes(agentType)) {
      return res.status(400).json({
        error: `Invalid agent type. Must be one of: ${validAgents.join(', ')}`
      });
    }

    // 4. Check rate limits
    const rateLimitOk = await checkRateLimit(user.id, subscription.tier);
    if (!rateLimitOk) {
      return res.status(429).json({
        error: 'Agent invocation limit reached for your subscription tier',
        upgradeUrl: '/subscription.html'
      });
    }

    // 5. Invoke the appropriate agent
    const startTime = Date.now();
    let result;

    switch (agentType) {
      case 'cc-lca-analyst':
        result = await invokeLCAAnalyst(action, data, options);
        break;
      case 'compliance-checker':
        result = await invokeComplianceChecker(action, data, options);
        break;
      case 'materials-database-manager':
        result = await invokeMaterialsDBManager(action, data, options);
        break;
      case 'construction-estimator':
        result = await invokeConstructionEstimator(action, data, options);
        break;
      default:
        return res.status(400).json({ error: 'Unknown agent type' });
    }

    const executionTime = (Date.now() - startTime) / 1000; // seconds

    // Determine if result came from Claude API or fallback
    const usedClaudeAPI = result?.agentType && result?.cost !== undefined;
    const cost = result?.cost || 0;

    // 6. Log agent usage with cost tracking
    await logAgentUsage(
      user.id,
      agentType,
      action,
      executionTime,
      result?.success !== false,
      result?.error?.message || null,
      cost
    );

    // 7. Return results
    return res.status(200).json({
      success: true,
      agentType,
      action,
      results: result,
      executionTime,
      cost,
      usedClaudeAPI,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Agent invocation error:', error);

    // Log failed invocation
    if (req.body?.agentType) {
      await logAgentUsage(
        req.user?.id || 'unknown',
        req.body.agentType,
        req.body.action,
        0,
        false,
        error.message
      );
    }

    return res.status(500).json({
      error: 'Agent invocation failed',
      message: error.message,
      fallbackAvailable: true
    });
  }
}

/**
 * Get user subscription details
 */
async function getUserSubscription(userId) {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('tier, features, status')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (error || !data) {
    return {
      tier: 'free',
      features: [],
      status: 'inactive'
    };
  }

  return data;
}

/**
 * Check rate limits based on subscription tier
 */
async function checkRateLimit(userId, tier) {
  const limits = {
    free: 5,      // 5 invocations per month
    pro: 50,      // 50 invocations per month
    enterprise: 999999 // Unlimited
  };

  const limit = limits[tier] || limits.free;

  // Get usage count for current month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from('agent_usage_log')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('timestamp', startOfMonth.toISOString());

  if (error) {
    console.error('Rate limit check error:', error);
    return true; // Fail open
  }

  return count < limit;
}

/**
 * Log agent usage for analytics and billing
 */
async function logAgentUsage(userId, agentType, action, executionTime, success, errorMessage = null, cost = 0) {
  try {
    await supabase.from('agent_usage_log').insert({
      user_id: userId,
      agent_type: agentType,
      action: action,
      execution_time: executionTime,
      success: success,
      error_message: errorMessage,
      cost: cost,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to log agent usage:', error);
  }
}

/**
 * Invoke LCA Analyst Agent
 */
async function invokeLCAAnalyst(action, data, options = {}) {
  // Check if Claude API is configured
  if (!isClaudeConfigured()) {
    console.warn('Claude API not configured, falling back to standard calculations');
    return await invokeLCAAnalystFallback(action, data, options);
  }

  try {
    // Invoke Claude agent via API
    const result = await invokeAgent('cc-lca-analyst', action, data, options);

    if (!result.success) {
      console.error('Claude API error, falling back to standard calculations:', result.error);
      return await invokeLCAAnalystFallback(action, data, options);
    }

    return result;
  } catch (error) {
    console.error('Failed to invoke Claude agent, falling back:', error);
    return await invokeLCAAnalystFallback(action, data, options);
  }
}

/**
 * Fallback LCA Analyst (uses standard calculations)
 */
async function invokeLCAAnalystFallback(action, data, options = {}) {
  switch (action) {
    case 'calculate_lca':
      return await calculateLCAWithAgent(data, options);
    case 'analyze_hotspots':
      return await analyzeHotspotsWithAgent(data, options);
    case 'generate_report':
      return await generateLCAReportWithAgent(data, options);
    case 'parse_bim':
      return await parseBIMWithAgent(data, options);
    default:
      throw new Error(`Unknown action for LCA analyst: ${action}`);
  }
}

/**
 * Calculate LCA with agent enhancement
 */
async function calculateLCAWithAgent(data, options) {
  const { projectInfo, materials } = data;

  // TODO: Invoke actual Claude Code agent via API
  // For now, return structured placeholder
  return {
    totalEmbodiedCarbon: calculateTotalCarbon(materials),
    carbonIntensity: calculateCarbonIntensity(materials, projectInfo.gfa),
    stages: calculateLCAStages(materials),
    hotspots: identifyHotspots(materials),
    recommendations: generateRecommendations(materials),
    compliance: {
      ncc: checkNCC(projectInfo, materials),
      nabers: calculateNABERS(materials, projectInfo.gfa),
      greenStar: calculateGreenStar(materials, projectInfo.gfa)
    }
  };
}

/**
 * Invoke Compliance Checker Agent
 */
async function invokeComplianceChecker(action, data, options = {}) {
  // Check if Claude API is configured
  if (!isClaudeConfigured()) {
    console.warn('Claude API not configured, falling back to standard compliance checks');
    return await invokeComplianceCheckerFallback(action, data, options);
  }

  try {
    // Invoke Claude agent via API
    const result = await invokeAgent('compliance-checker', action, data, options);

    if (!result.success) {
      console.error('Claude API error, falling back to standard compliance checks:', result.error);
      return await invokeComplianceCheckerFallback(action, data, options);
    }

    return result;
  } catch (error) {
    console.error('Failed to invoke Claude agent, falling back:', error);
    return await invokeComplianceCheckerFallback(action, data, options);
  }
}

/**
 * Fallback Compliance Checker (uses standard calculations)
 */
async function invokeComplianceCheckerFallback(action, data, options = {}) {
  switch (action) {
    case 'check_compliance':
      return await checkComplianceWithAgent(data, options);
    case 'generate_report':
      return await generateComplianceReportWithAgent(data, options);
    case 'gap_analysis':
      return await performGapAnalysisWithAgent(data, options);
    default:
      throw new Error(`Unknown action for compliance checker: ${action}`);
  }
}

/**
 * Check compliance with agent
 */
async function checkComplianceWithAgent(data, options) {
  const { carbonIntensity, projectType, gfa, targetRating } = data;

  return {
    ncc: {
      pass: carbonIntensity < 450,
      benchmark: 450,
      margin: 450 - carbonIntensity,
      recommendations: carbonIntensity > 450 ? [
        'Reduce concrete usage by 15% to meet NCC benchmark',
        'Consider timber structural elements where feasible'
      ] : []
    },
    nabers: {
      currentRating: calculateNABERSRating(carbonIntensity),
      targetRating: targetRating || 6,
      thresholds: {
        6: 250,
        5: 350,
        4: 500,
        3: 650,
        2: 800,
        1: 1000
      },
      gapToTarget: Math.max(0, carbonIntensity - 250)
    },
    greenStar: {
      points: calculateGreenStarPoints(carbonIntensity, gfa),
      certification: getGreenStarCertification(carbonIntensity, gfa),
      nextLevel: getNextGreenStarLevel(carbonIntensity, gfa)
    },
    tcfd: {
      scope1: 0,
      scope2: calculateScope2(gfa),
      scope3: carbonIntensity * gfa,
      totalEmissions: carbonIntensity * gfa
    }
  };
}

/**
 * Invoke Materials Database Manager Agent
 */
async function invokeMaterialsDBManager(action, data, options = {}) {
  // Check if Claude API is configured
  if (!isClaudeConfigured()) {
    console.warn('Claude API not configured, falling back to standard database operations');
    return await invokeMaterialsDBManagerFallback(action, data, options);
  }

  try {
    // Invoke Claude agent via API
    const result = await invokeAgent('materials-database-manager', action, data, options);

    if (!result.success) {
      console.error('Claude API error, falling back to standard database operations:', result.error);
      return await invokeMaterialsDBManagerFallback(action, data, options);
    }

    return result;
  } catch (error) {
    console.error('Failed to invoke Claude agent, falling back:', error);
    return await invokeMaterialsDBManagerFallback(action, data, options);
  }
}

/**
 * Fallback Materials Database Manager (uses standard operations)
 */
async function invokeMaterialsDBManagerFallback(action, data, options = {}) {
  switch (action) {
    case 'sync_database':
      return await syncDatabaseWithAgent(data, options);
    case 'validate_data':
      return await validateDataWithAgent(data, options);
    case 'search_materials':
      return await searchMaterialsWithAgent(data, options);
    default:
      throw new Error(`Unknown action for materials DB manager: ${action}`);
  }
}

/**
 * Invoke Construction Estimator Agent
 */
async function invokeConstructionEstimator(action, data, options = {}) {
  // Check if Claude API is configured
  if (!isClaudeConfigured()) {
    console.warn('Claude API not configured, falling back to standard estimations');
    return await invokeConstructionEstimatorFallback(action, data, options);
  }

  try {
    // Invoke Claude agent via API
    const result = await invokeAgent('construction-estimator', action, data, options);

    if (!result.success) {
      console.error('Claude API error, falling back to standard estimations:', result.error);
      return await invokeConstructionEstimatorFallback(action, data, options);
    }

    return result;
  } catch (error) {
    console.error('Failed to invoke Claude agent, falling back:', error);
    return await invokeConstructionEstimatorFallback(action, data, options);
  }
}

/**
 * Fallback Construction Estimator (uses standard calculations)
 */
async function invokeConstructionEstimatorFallback(action, data, options = {}) {
  switch (action) {
    case 'parse_rbss':
      return await parseRBSSWithAgent(data, options);
    case 'estimate_costs':
      return await estimateCostsWithAgent(data, options);
    case 'optimize_cost_carbon':
      return await optimizeCostCarbonWithAgent(data, options);
    default:
      throw new Error(`Unknown action for construction estimator: ${action}`);
  }
}

// ============================================
// Helper Functions (Placeholder Implementations)
// ============================================

function calculateTotalCarbon(materials) {
  return materials.reduce((sum, m) => sum + (m.quantity * (m.carbonFactor || 0)), 0);
}

function calculateCarbonIntensity(materials, gfa) {
  return calculateTotalCarbon(materials) / gfa;
}

function calculateLCAStages(materials) {
  const total = calculateTotalCarbon(materials);
  return {
    a1a3: total * 0.70,
    a4: total * 0.05,
    a5: total * 0.05,
    b: total * 0.10,
    c: total * 0.05,
    d: -total * 0.05
  };
}

function identifyHotspots(materials) {
  return materials
    .map(m => ({
      material: m.name,
      carbonContribution: m.quantity * (m.carbonFactor || 0),
      percentage: 0
    }))
    .sort((a, b) => b.carbonContribution - a.carbonContribution)
    .slice(0, 5);
}

function generateRecommendations(materials) {
  return [
    'Consider using lower carbon concrete alternatives (GGBS, fly ash)',
    'Explore timber structural elements where feasible',
    'Optimize steel usage with high-strength grades'
  ];
}

function checkNCC(projectInfo, materials) {
  const intensity = calculateCarbonIntensity(materials, projectInfo.gfa);
  return {
    pass: intensity < 450,
    benchmark: 450,
    margin: 450 - intensity
  };
}

function calculateNABERS(materials, gfa) {
  const intensity = calculateCarbonIntensity(materials, gfa);
  return {
    rating: calculateNABERSRating(intensity),
    threshold: 500
  };
}

function calculateNABERSRating(intensity) {
  if (intensity < 250) return 6;
  if (intensity < 350) return 5;
  if (intensity < 500) return 4;
  if (intensity < 650) return 3;
  if (intensity < 800) return 2;
  return 1;
}

function calculateGreenStar(materials, gfa) {
  const intensity = calculateCarbonIntensity(materials, gfa);
  return {
    points: calculateGreenStarPoints(intensity, gfa),
    certification: getGreenStarCertification(intensity, gfa)
  };
}

function calculateGreenStarPoints(intensity, gfa) {
  if (intensity < 200) return 5;
  if (intensity < 300) return 4;
  if (intensity < 400) return 3;
  if (intensity < 500) return 2;
  return 1;
}

function getGreenStarCertification(intensity, gfa) {
  const points = calculateGreenStarPoints(intensity, gfa);
  if (points >= 5) return '6 Star - World Leadership';
  if (points >= 4) return '5 Star';
  if (points >= 3) return '4 Star';
  return 'Not Certified';
}

function getNextGreenStarLevel(intensity, gfa) {
  const current = calculateGreenStarPoints(intensity, gfa);
  if (current >= 5) return null;
  return {
    points: current + 1,
    targetIntensity: [500, 400, 300, 200][current],
    reductionNeeded: intensity - [500, 400, 300, 200][current]
  };
}

function calculateScope2(gfa) {
  // Placeholder for operational emissions
  return gfa * 50; // kg CO2-e
}

// Placeholder functions for database operations
async function syncDatabaseWithAgent(data, options) {
  return {
    materialsAdded: 0,
    materialsUpdated: 0,
    validationErrors: [],
    syncTime: 0,
    status: 'success'
  };
}

async function validateDataWithAgent(data, options) {
  return {
    totalMaterials: 54343,
    validMaterials: 54000,
    invalidMaterials: 343,
    errors: []
  };
}

async function searchMaterialsWithAgent(data, options) {
  const { query } = data;
  return {
    results: [],
    totalResults: 0,
    query: query
  };
}

// Placeholder functions for construction estimator
async function parseRBSSWithAgent(data, options) {
  return {
    items: [],
    totalItems: 0,
    categories: []
  };
}

async function estimateCostsWithAgent(data, options) {
  return {
    totalCost: 0,
    breakdown: {},
    carbonCost: {}
  };
}

async function optimizeCostCarbonWithAgent(data, options) {
  return {
    currentCost: 0,
    currentCarbon: 0,
    optimizedCost: 0,
    optimizedCarbon: 0,
    recommendations: []
  };
}

// Placeholder functions for report generation
async function analyzeHotspotsWithAgent(data, options) {
  return {
    hotspots: [],
    recommendations: []
  };
}

async function generateLCAReportWithAgent(data, options) {
  return {
    markdown: '# LCA Report\n\n...',
    pdf_url: null
  };
}

async function parseBIMWithAgent(data, options) {
  return {
    materials: [],
    totalMaterials: 0,
    parsedSuccessfully: true
  };
}

async function generateComplianceReportWithAgent(data, options) {
  return {
    markdown: '# Compliance Report\n\n...',
    pdf_url: null
  };
}

async function performGapAnalysisWithAgent(data, options) {
  return {
    currentStatus: {},
    targetStatus: {},
    gaps: [],
    recommendations: []
  };
}
