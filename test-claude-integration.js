/**
 * Claude API Integration Test Script
 *
 * This script tests the Claude API integration without requiring
 * a full app deployment. Run it to verify your setup.
 *
 * Usage:
 *   node test-claude-integration.js
 *
 * Requirements:
 *   - .env.local file with ANTHROPIC_API_KEY
 *   - Node.js 18+
 */

import { invokeAgent, isClaudeConfigured, getConfiguration } from './api/utils/claude-client.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env.local') });

// Test data
const testData = {
  lca: {
    projectInfo: {
      name: 'Test Office Building',
      location: 'Sydney, NSW',
      gfa: 1000,
      buildingType: 'Commercial'
    },
    materials: [
      {
        name: 'Ready-mix concrete 32MPa',
        quantity: 100,
        unit: 'm³',
        carbonFactor: 0.451
      },
      {
        name: 'Reinforcing steel',
        quantity: 8000,
        unit: 'kg',
        carbonFactor: 1.85
      }
    ]
  },
  compliance: {
    carbonIntensity: 380,
    projectType: 'Commercial',
    gfa: 5000,
    targetRating: 6
  }
};

// Color output helpers
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log('cyan', title);
  console.log('='.repeat(60));
}

async function testConfiguration() {
  logSection('1. Configuration Check');

  const config = getConfiguration();

  console.log('\n📋 Current Configuration:');
  console.log(`   - Is Configured: ${config.isConfigured ? '✅ Yes' : '❌ No'}`);
  console.log(`   - Model: ${config.model}`);
  console.log(`   - Max Tokens: ${config.maxTokens}`);
  console.log(`   - Temperature: ${config.temperature}`);
  console.log(`   - Available Agents: ${config.availableAgents.length}`);
  config.availableAgents.forEach(agent => {
    console.log(`     • ${agent}`);
  });

  if (!config.isConfigured) {
    log('yellow', '\n⚠️  WARNING: ANTHROPIC_API_KEY not configured');
    log('yellow', '   Set it in .env.local to enable Claude API');
    log('yellow', '   Tests will use fallback mode');
  } else {
    log('green', '\n✅ Claude API is configured!');
  }

  return config.isConfigured;
}

async function testLCAAnalyst(configured) {
  logSection('2. Testing LCA Analyst Agent');

  console.log('\n📊 Input Data:');
  console.log(JSON.stringify(testData.lca, null, 2));

  log('blue', '\n🚀 Invoking cc-lca-analyst...');

  try {
    const startTime = Date.now();
    const result = await invokeAgent(
      'cc-lca-analyst',
      'calculate_lca',
      testData.lca,
      { includeHotspotAnalysis: true }
    );
    const duration = Date.now() - startTime;

    console.log('\n📈 Results:');
    console.log(`   - Success: ${result.success ? '✅' : '❌'}`);
    console.log(`   - Execution Time: ${duration}ms`);

    if (result.success) {
      console.log(`   - Input Tokens: ${result.usage?.inputTokens || 'N/A'}`);
      console.log(`   - Output Tokens: ${result.usage?.outputTokens || 'N/A'}`);
      console.log(`   - Total Tokens: ${result.usage?.totalTokens || 'N/A'}`);
      console.log(`   - Cost: $${result.cost?.toFixed(4) || '0.0000'}`);

      if (result.data) {
        log('green', '\n✅ Received structured data from agent');
        console.log('   Sample output:', JSON.stringify(result.data, null, 2).substring(0, 200) + '...');
      }

      if (result.explanation) {
        log('green', '\n✅ Received explanation from agent');
        console.log('   Sample:', result.explanation.substring(0, 150) + '...');
      }
    } else {
      log('red', `\n❌ Agent invocation failed: ${result.error?.message}`);
      if (result.error?.type) {
        console.log(`   - Error Type: ${result.error.type}`);
        console.log(`   - Rate Limited: ${result.error.isRateLimited ? 'Yes' : 'No'}`);
        console.log(`   - Auth Error: ${result.error.isAuthError ? 'Yes' : 'No'}`);
      }
    }

    return result.success;
  } catch (error) {
    log('red', `\n❌ Test failed with exception: ${error.message}`);
    console.error(error);
    return false;
  }
}

async function testComplianceChecker(configured) {
  logSection('3. Testing Compliance Checker Agent');

  console.log('\n📋 Input Data:');
  console.log(JSON.stringify(testData.compliance, null, 2));

  log('blue', '\n🚀 Invoking compliance-checker...');

  try {
    const startTime = Date.now();
    const result = await invokeAgent(
      'compliance-checker',
      'check_compliance',
      testData.compliance
    );
    const duration = Date.now() - startTime;

    console.log('\n📈 Results:');
    console.log(`   - Success: ${result.success ? '✅' : '❌'}`);
    console.log(`   - Execution Time: ${duration}ms`);

    if (result.success) {
      console.log(`   - Cost: $${result.cost?.toFixed(4) || '0.0000'}`);
      log('green', '\n✅ Compliance check completed');

      if (result.data) {
        console.log('   Sample output:', JSON.stringify(result.data, null, 2).substring(0, 200) + '...');
      }
    } else {
      log('red', `\n❌ Agent invocation failed: ${result.error?.message}`);
    }

    return result.success;
  } catch (error) {
    log('red', `\n❌ Test failed with exception: ${error.message}`);
    console.error(error);
    return false;
  }
}

async function runAllTests() {
  console.clear();
  log('cyan', '╔════════════════════════════════════════════════════════════╗');
  log('cyan', '║     Claude API Integration Test Suite                     ║');
  log('cyan', '╚════════════════════════════════════════════════════════════╝');

  const results = {
    configured: false,
    lcaTest: false,
    complianceTest: false
  };

  try {
    // Test 1: Configuration
    results.configured = await testConfiguration();

    // Test 2: LCA Analyst
    results.lcaTest = await testLCAAnalyst(results.configured);

    // Test 3: Compliance Checker
    results.complianceTest = await testComplianceChecker(results.configured);

    // Summary
    logSection('Test Summary');

    const totalTests = 3;
    const passedTests = Object.values(results).filter(Boolean).length;

    console.log('\n📊 Results:');
    console.log(`   Configuration: ${results.configured ? '✅ PASS' : '⚠️  NOT CONFIGURED'}`);
    console.log(`   LCA Analyst:   ${results.lcaTest ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Compliance:    ${results.complianceTest ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`\n   Total: ${passedTests}/${totalTests} tests passed`);

    if (!results.configured) {
      log('yellow', '\n⚠️  Claude API not configured - tests ran in fallback mode');
      log('yellow', '   To enable Claude API:');
      log('yellow', '   1. Get API key from console.anthropic.com');
      log('yellow', '   2. Add to .env.local: ANTHROPIC_API_KEY=sk-ant-...');
      log('yellow', '   3. Re-run this test script');
    } else if (passedTests === totalTests) {
      log('green', '\n✅ All tests passed! Claude API integration is working.');
    } else {
      log('yellow', '\n⚠️  Some tests failed. Check the output above for details.');
    }

  } catch (error) {
    log('red', '\n❌ Test suite failed with error:');
    console.error(error);
    process.exit(1);
  }

  console.log('\n' + '='.repeat(60) + '\n');
}

// Run tests
runAllTests().catch(error => {
  log('red', '\n❌ Fatal error:');
  console.error(error);
  process.exit(1);
});
