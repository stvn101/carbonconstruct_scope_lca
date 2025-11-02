/**
 * Claude API Client
 * Handles all interactions with the Anthropic Claude API
 *
 * This module provides:
 * - API client initialization with configuration
 * - Agent-specific message formatting
 * - Response parsing and validation
 * - Error handling with graceful degradation
 * - Cost tracking and logging
 */

import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';
import { join } from 'path';

// Initialize Anthropic client with configuration
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  timeout: parseInt(process.env.ANTHROPIC_TIMEOUT || '30000'),
});

// Configuration
const CONFIG = {
  model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929',
  maxTokens: parseInt(process.env.ANTHROPIC_MAX_TOKENS || '4096'),
  temperature: 0.7,
};

// Agent definitions mapping
const AGENT_CONFIGS = {
  'cc-lca-analyst': {
    model: 'claude-sonnet-4-5-20250929',
    maxTokens: 4096,
    description: 'ISO 14040/14044-compliant life-cycle assessment',
    promptFile: 'cc-lca-analyst.md',
  },
  'compliance-checker': {
    model: 'claude-sonnet-4-5-20250929',
    maxTokens: 4096,
    description: 'Australian compliance framework validation',
    promptFile: 'compliance-checker.md',
  },
  'materials-database-manager': {
    model: 'claude-sonnet-4-5-20250929',
    maxTokens: 4096,
    description: 'Database maintenance and synchronization',
    promptFile: 'materials-database-manager.md',
  },
  'construction-estimator': {
    model: 'claude-sonnet-4-5-20250929',
    maxTokens: 4096,
    description: 'Construction cost estimation with carbon integration',
    promptFile: 'construction-estimator.md',
  },
};

/**
 * Load agent prompt from .claude/agents/ directory
 * @param {string} agentType - The agent type identifier
 * @returns {string} The agent's system prompt
 */
function loadAgentPrompt(agentType) {
  const agentConfig = AGENT_CONFIGS[agentType];
  if (!agentConfig) {
    throw new Error(`Unknown agent type: ${agentType}`);
  }

  try {
    const promptPath = join(process.cwd(), '.claude', 'agents', agentConfig.promptFile);
    const promptContent = readFileSync(promptPath, 'utf-8');
    return promptContent;
  } catch (error) {
    console.error(`Failed to load agent prompt for ${agentType}:`, error);
    throw new Error(`Agent prompt not found: ${agentType}`);
  }
}

/**
 * Format user message for agent invocation
 * @param {string} action - The action to perform
 * @param {object} data - Input data for the action
 * @param {object} options - Additional options
 * @returns {string} Formatted user message
 */
function formatUserMessage(action, data, options = {}) {
  const message = {
    action,
    data,
    options,
    timestamp: new Date().toISOString(),
  };

  return `Please perform the following action:

ACTION: ${action}

INPUT DATA:
${JSON.stringify(data, null, 2)}

${options.instructions ? `SPECIAL INSTRUCTIONS:\n${options.instructions}\n` : ''}
Please respond with a valid JSON object containing the results, followed by any markdown explanation.`;
}

/**
 * Parse Claude's response and extract JSON + markdown
 * @param {object} response - The Anthropic API response
 * @returns {object} Parsed response with data and explanation
 */
function parseAgentResponse(response) {
  if (!response || !response.content || response.content.length === 0) {
    throw new Error('Empty response from Claude API');
  }

  const textContent = response.content
    .filter(block => block.type === 'text')
    .map(block => block.text)
    .join('\n');

  // Try to extract JSON from the response
  const jsonMatch = textContent.match(/\{[\s\S]*\}/);
  let parsedData = null;
  let explanation = textContent;

  if (jsonMatch) {
    try {
      parsedData = JSON.parse(jsonMatch[0]);
      // Remove JSON from explanation
      explanation = textContent.replace(jsonMatch[0], '').trim();
    } catch (error) {
      console.warn('Failed to parse JSON from response:', error);
      // Continue with text-only response
    }
  }

  return {
    success: true,
    data: parsedData,
    explanation,
    rawResponse: textContent,
    usage: {
      inputTokens: response.usage?.input_tokens || 0,
      outputTokens: response.usage?.output_tokens || 0,
      totalTokens: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0),
    },
  };
}

/**
 * Calculate estimated cost for API call
 * @param {number} inputTokens - Number of input tokens
 * @param {number} outputTokens - Number of output tokens
 * @param {string} model - Model identifier
 * @returns {number} Estimated cost in USD
 */
function calculateCost(inputTokens, outputTokens, model = 'claude-sonnet-4-5-20250929') {
  // Pricing as of 2025 (update as needed)
  const pricing = {
    'claude-sonnet-4-5-20250929': {
      input: 0.003 / 1000,  // $3 per million input tokens
      output: 0.015 / 1000, // $15 per million output tokens
    },
  };

  const modelPricing = pricing[model] || pricing['claude-sonnet-4-5-20250929'];
  return (inputTokens * modelPricing.input) + (outputTokens * modelPricing.output);
}

/**
 * Invoke a Claude agent with the specified action and data
 * @param {string} agentType - The type of agent to invoke
 * @param {string} action - The action to perform
 * @param {object} data - Input data for the action
 * @param {object} options - Additional options
 * @returns {Promise<object>} Agent response with parsed data
 */
export async function invokeAgent(agentType, action, data, options = {}) {
  const startTime = Date.now();

  try {
    // Validate agent type
    if (!AGENT_CONFIGS[agentType]) {
      throw new Error(`Invalid agent type: ${agentType}`);
    }

    // Load agent prompt
    const systemPrompt = loadAgentPrompt(agentType);
    const agentConfig = AGENT_CONFIGS[agentType];

    // Format user message
    const userMessage = formatUserMessage(action, data, options);

    console.log(`[Claude API] Invoking ${agentType} with action: ${action}`);

    // Call Claude API
    const response = await anthropic.messages.create({
      model: agentConfig.model,
      max_tokens: agentConfig.maxTokens,
      temperature: CONFIG.temperature,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: userMessage,
      }],
    });

    // Parse response
    const parsedResponse = parseAgentResponse(response);

    // Calculate execution metrics
    const executionTime = Date.now() - startTime;
    const cost = calculateCost(
      parsedResponse.usage.inputTokens,
      parsedResponse.usage.outputTokens,
      agentConfig.model
    );

    console.log(`[Claude API] ${agentType} completed in ${executionTime}ms, cost: $${cost.toFixed(4)}`);

    return {
      ...parsedResponse,
      executionTime,
      cost,
      agentType,
      action,
      timestamp: new Date().toISOString(),
    };

  } catch (error) {
    const executionTime = Date.now() - startTime;

    console.error(`[Claude API] Error invoking ${agentType}:`, error);

    // Determine error type for better handling
    const errorType = error.status || error.code || 'UNKNOWN_ERROR';
    const isRateLimited = errorType === 429;
    const isAuthError = errorType === 401 || errorType === 403;
    const isInvalidRequest = errorType === 400;

    return {
      success: false,
      error: {
        message: error.message || 'Unknown error occurred',
        type: errorType,
        isRateLimited,
        isAuthError,
        isInvalidRequest,
        details: error.error?.message || error.toString(),
      },
      executionTime,
      agentType,
      action,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Check if Claude API is properly configured
 * @returns {boolean} True if API key is configured
 */
export function isClaudeConfigured() {
  return !!process.env.ANTHROPIC_API_KEY &&
         process.env.ANTHROPIC_API_KEY !== 'your-anthropic-api-key-here';
}

/**
 * Get current API configuration
 * @returns {object} Configuration details (without sensitive data)
 */
export function getConfiguration() {
  return {
    isConfigured: isClaudeConfigured(),
    model: CONFIG.model,
    maxTokens: CONFIG.maxTokens,
    temperature: CONFIG.temperature,
    availableAgents: Object.keys(AGENT_CONFIGS),
  };
}

export { AGENT_CONFIGS, CONFIG };
