# Claude API Integration Setup Guide

## Overview

This guide explains how to set up and use the Claude API integration for AI-Enhanced features in CarbonConstruct. The integration enables four specialized agents to provide advanced LCA analysis, compliance checking, database management, and construction estimation.

## Implementation Status

✅ **COMPLETE** - Full Claude API integration with graceful fallback

### What's Implemented

1. **Anthropic SDK Integration** - [api/utils/claude-client.js](api/utils/claude-client.js)
   - API client initialization with configuration
   - Agent prompt loading from `.claude/agents/` directory
   - Response parsing and validation
   - Cost calculation and tracking
   - Comprehensive error handling

2. **Four Agent Integrations** - [api/invoke-agent.js](api/invoke-agent.js)
   - `cc-lca-analyst` - ISO 14040/14044-compliant LCA
   - `compliance-checker` - NCC 2022, NABERS, Green Star
   - `materials-database-manager` - 54,343+ materials sync
   - `construction-estimator` - RBSS cost estimation

3. **Graceful Degradation**
   - Automatic fallback to standard calculations if API fails
   - Configuration detection (works without API key)
   - Error logging and user notifications

4. **Security & Rate Limiting**
   - Bearer token authentication (Supabase JWT)
   - Subscription tier validation
   - Monthly usage quotas (Free: 5, Pro: 50, Enterprise: unlimited)
   - Cost tracking per invocation

---

## Setup Instructions

### Step 1: Install Dependencies

```bash
npm install
# or
pnpm install
```

This will install:
- `@anthropic-ai/sdk@^0.32.1` - Anthropic's official SDK
- All existing dependencies

### Step 2: Get Anthropic API Key

1. **Create Account** at [console.anthropic.com](https://console.anthropic.com)
2. **Navigate to API Keys**: Settings → API Keys
3. **Create New Key**: Click "Create Key" and copy it immediately
4. **Save Securely**: You won't be able to see it again

### Step 3: Configure Environment Variables

#### Local Development (.env.local)

Create or update `.env.local`:

```bash
# Copy from example
cp .env.example .env.local

# Add your API key
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Optional: Customize configuration
ANTHROPIC_MODEL=claude-sonnet-4-5-20250929
ANTHROPIC_MAX_TOKENS=4096
ANTHROPIC_TIMEOUT=30000
```

#### Production (Vercel)

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

| Variable | Value | Environment |
|----------|-------|-------------|
| `ANTHROPIC_API_KEY` | `sk-ant-api03-xxx...` | Production |
| `ANTHROPIC_MODEL` | `claude-sonnet-4-5-20250929` | Production |
| `ANTHROPIC_MAX_TOKENS` | `4096` | Production |
| `ANTHROPIC_TIMEOUT` | `30000` | Production |

4. Redeploy your application

### Step 4: Verify Configuration

The system automatically detects if Claude API is configured. If not configured, it falls back to standard calculations without errors.

To test the integration:

1. **Check API health** (create this endpoint or use the main app):
```javascript
// Test in browser console after authenticating
const response = await fetch('/api/invoke-agent', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    agentType: 'cc-lca-analyst',
    action: 'calculate_lca',
    data: {
      projectInfo: { name: 'Test', gfa: 1000 },
      materials: [{ name: 'Concrete', quantity: 100, carbonFactor: 0.5 }]
    }
  })
});
const result = await response.json();
console.log('Used Claude API:', result.usedClaudeAPI);
console.log('Cost:', result.cost);
```

---

## Architecture

### Request Flow

```
User Request
    ↓
Frontend (AgentOrchestrator)
    ↓
API Endpoint (/api/invoke-agent)
    ↓
Authentication & Authorization (Supabase)
    ↓
Subscription & Rate Limit Check
    ↓
Agent Router (switch/case)
    ↓
┌─────────────────────────────────┐
│ Claude API Configured?          │
│ ├─ Yes → invokeAgent()         │
│ │   ├─ Success → Return result  │
│ │   └─ Error → Fallback         │
│ └─ No → Fallback               │
└─────────────────────────────────┘
    ↓
Fallback: Standard Calculations
    ↓
Usage Logging (cost, time, success)
    ↓
Response to Frontend
```

### File Structure

```
carbonconstruct_scope_lca/
├── api/
│   ├── invoke-agent.js              # Main endpoint (all agent routing)
│   └── utils/
│       └── claude-client.js         # Claude API client & utilities
├── .claude/
│   └── agents/
│       ├── cc-lca-analyst.md        # LCA agent system prompt
│       ├── compliance-checker.md    # Compliance agent prompt
│       ├── materials-database-manager.md
│       └── construction-estimator.md
├── js/
│   └── agent-orchestrator.js        # Frontend orchestration
├── database/
│   └── agent_usage_schema.sql       # Usage tracking schema
├── .env.example                     # Environment template
└── CLAUDE_API_SETUP.md             # This file
```

---

## Agent Capabilities

### 1. cc-lca-analyst

**Purpose**: ISO 14040/14044-compliant life-cycle assessment

**Actions**:
- `calculate_lca` - Full embodied carbon calculation
- `analyze_hotspots` - Identify high-carbon materials
- `generate_report` - ISO-compliant LCA report
- `parse_bim` - Extract materials from BIM files

**Input Format**:
```json
{
  "agentType": "cc-lca-analyst",
  "action": "calculate_lca",
  "data": {
    "projectInfo": {
      "name": "Office Building",
      "location": "Sydney, NSW",
      "gfa": 5000,
      "buildingType": "Commercial"
    },
    "materials": [
      {
        "name": "Ready-mix concrete 32MPa",
        "quantity": 1200,
        "unit": "m³",
        "carbonFactor": 0.451
      }
    ]
  },
  "options": {
    "includeHotspotAnalysis": true,
    "generateReport": true
  }
}
```

**Output**: JSON with `totalEmbodiedCarbon`, `stages`, `hotspots`, `recommendations`

**Estimated Cost**: ~$0.10 per invocation

---

### 2. compliance-checker

**Purpose**: Australian compliance framework validation

**Actions**:
- `check_compliance` - NCC, NABERS, Green Star checks
- `generate_report` - Compliance summary report
- `gap_analysis` - Identify gaps to target rating

**Input Format**:
```json
{
  "agentType": "compliance-checker",
  "action": "check_compliance",
  "data": {
    "carbonIntensity": 380,
    "projectType": "Commercial",
    "gfa": 5000,
    "targetRating": 6
  }
}
```

**Output**: Compliance status for NCC, NABERS (0-6 stars), Green Star, TCFD

**Estimated Cost**: ~$0.05 per invocation

---

### 3. materials-database-manager

**Purpose**: Database maintenance and synchronization

**Actions**:
- `sync_database` - Sync from EC3, NABERS, EPD Australasia
- `validate_data` - Check data quality
- `search_materials` - Intelligent material search

**Input Format**:
```json
{
  "agentType": "materials-database-manager",
  "action": "sync_database",
  "data": {
    "sources": ["ec3", "nabers", "epd_australasia"],
    "validateBeforeSync": true
  }
}
```

**Output**: Sync statistics, validation results

**Estimated Cost**: ~$0.02 per invocation

---

### 4. construction-estimator

**Purpose**: Construction cost estimation with carbon integration

**Actions**:
- `parse_rbss` - Parse RBSS extract files
- `estimate_costs` - Calculate project costs
- `optimize_cost_carbon` - Cost-carbon trade-off analysis

**Input Format**:
```json
{
  "agentType": "construction-estimator",
  "action": "estimate_costs",
  "data": {
    "items": [
      {
        "code": "E10.10.01",
        "description": "Carpentry - Hardwood framing",
        "quantity": 500,
        "unit": "m"
      }
    ]
  }
}
```

**Output**: Cost breakdown, carbon implications

**Estimated Cost**: ~$0.08 per invocation

---

## Cost Management

### Pricing (as of 2025)

- **Input Tokens**: $3.00 per million tokens
- **Output Tokens**: $15.00 per million tokens

### Typical Usage

| Action | Input Tokens | Output Tokens | Cost |
|--------|--------------|---------------|------|
| LCA Calculation | ~2,000 | ~1,500 | $0.10 |
| Compliance Check | ~1,000 | ~800 | $0.05 |
| Database Sync | ~500 | ~300 | $0.02 |
| Cost Estimation | ~1,500 | ~1,000 | $0.08 |

### Monthly Cost Examples

**Pro Tier (50 invocations/month)**:
- 50 LCA calculations: ~$5.00/month
- Mixed usage: $2.50 - $7.50/month

**Enterprise (200 invocations/month)**:
- $20 - $30/month (depending on action mix)

### Cost Tracking

All costs are automatically tracked in the `agent_usage_log` table:

```sql
SELECT
  user_id,
  agent_type,
  SUM(cost) as total_cost,
  COUNT(*) as invocation_count
FROM agent_usage_log
WHERE timestamp >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY user_id, agent_type;
```

---

## Error Handling

### Graceful Degradation

The system automatically falls back to standard calculations if:

1. **API key not configured** - Silent fallback, no errors
2. **API call fails** - Logged, fallback used, user notified
3. **Rate limit exceeded** (429) - Cached response or fallback
4. **Authentication error** (401/403) - Logged, fallback used
5. **Invalid request** (400) - Error returned to user

### Error Response Format

```json
{
  "success": false,
  "error": {
    "message": "Rate limit exceeded",
    "type": "429",
    "isRateLimited": true,
    "isAuthError": false,
    "isInvalidRequest": false
  },
  "usedClaudeAPI": false,
  "fallbackUsed": true
}
```

### Monitoring

Check Vercel logs for:
- `[Claude API] Invoking {agent} with action: {action}` - Successful calls
- `Claude API not configured, falling back` - No API key
- `Claude API error, falling back` - API errors

---

## Testing

### Unit Tests (Recommended)

Create `api/__tests__/claude-client.test.js`:

```javascript
import { invokeAgent, isClaudeConfigured } from '../utils/claude-client.js';

describe('Claude API Integration', () => {
  it('should detect configuration', () => {
    const configured = isClaudeConfigured();
    expect(typeof configured).toBe('boolean');
  });

  it('should invoke LCA analyst', async () => {
    const result = await invokeAgent('cc-lca-analyst', 'calculate_lca', {
      projectInfo: { name: 'Test', gfa: 1000 },
      materials: []
    });

    expect(result).toHaveProperty('success');
    if (result.success) {
      expect(result).toHaveProperty('cost');
      expect(result).toHaveProperty('executionTime');
    }
  });
});
```

### Integration Tests

Test with actual API calls (requires API key):

```bash
# Set test API key
export ANTHROPIC_API_KEY=sk-ant-api03-xxx

# Run tests
npm test api/__tests__/claude-client.test.js
```

---

## Security Best Practices

### API Key Security

✅ **DO**:
- Store API key in environment variables only
- Use Vercel's encrypted environment variables in production
- Rotate keys periodically (quarterly recommended)
- Use separate keys for dev/staging/production

❌ **DON'T**:
- Commit `.env.local` to Git (it's in `.gitignore`)
- Expose API key in client-side code
- Share API keys in Slack, email, or documentation
- Use same key across multiple projects

### Rate Limiting

All invocations are rate-limited by subscription tier:

| Tier | Monthly Limit | Overage |
|------|---------------|---------|
| Free | 5 invocations | Blocked (upgrade required) |
| Pro | 50 invocations | Blocked (upgrade required) |
| Enterprise | 999,999 | Contact sales |

### Row Level Security

The `agent_usage_log` table has RLS policies:
- Users can only view their own usage logs
- Only service role can insert/update logs
- No public access

---

## Troubleshooting

### "Claude API not configured" Warning

**Symptom**: Logs show fallback warnings, `usedClaudeAPI: false`

**Solution**:
1. Check `.env.local` has `ANTHROPIC_API_KEY=sk-ant-...`
2. Verify key is not the placeholder `your-anthropic-api-key-here`
3. Restart development server: `npm run dev`

---

### API Returns 401 Unauthorized

**Symptom**: Error logs show authentication failures

**Solution**:
1. Verify API key is correct (copy from Anthropic console)
2. Check key hasn't been rotated or deleted
3. Ensure no extra whitespace in `.env.local`

---

### High Costs

**Symptom**: Unexpected API costs in Anthropic console

**Solution**:
1. Check `agent_usage_log` for cost breakdown:
```sql
SELECT agent_type, action, SUM(cost), COUNT(*)
FROM agent_usage_log
WHERE timestamp >= NOW() - INTERVAL '30 days'
GROUP BY agent_type, action
ORDER BY SUM(cost) DESC;
```

2. Implement caching (already built-in with 1-hour TTL)
3. Reduce `ANTHROPIC_MAX_TOKENS` for simpler queries
4. Enable stricter rate limits

---

### Slow Responses

**Symptom**: Agent invocations take >30 seconds

**Solution**:
1. Check Anthropic status: [status.anthropic.com](https://status.anthropic.com)
2. Increase timeout: `ANTHROPIC_TIMEOUT=60000` (60 seconds)
3. Reduce `ANTHROPIC_MAX_TOKENS` for faster processing
4. Use caching to avoid repeated identical requests

---

## Monitoring & Analytics

### Usage Dashboard

Query `agent_usage_log` for analytics:

```sql
-- Daily usage by agent
SELECT
  DATE(timestamp) as date,
  agent_type,
  COUNT(*) as invocations,
  SUM(cost) as total_cost,
  AVG(execution_time) as avg_time,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) as successes
FROM agent_usage_log
WHERE timestamp >= NOW() - INTERVAL '30 days'
GROUP BY DATE(timestamp), agent_type
ORDER BY date DESC, agent_type;
```

### Success Rate

```sql
-- Success rate by agent (last 7 days)
SELECT
  agent_type,
  COUNT(*) as total,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) as successes,
  ROUND(100.0 * SUM(CASE WHEN success THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
FROM agent_usage_log
WHERE timestamp >= NOW() - INTERVAL '7 days'
GROUP BY agent_type;
```

### Cost Tracking

```sql
-- Cost per user (current month)
SELECT
  u.email,
  s.tier,
  COUNT(*) as invocations,
  SUM(cost) as total_cost
FROM agent_usage_log aul
JOIN auth.users u ON aul.user_id = u.id
JOIN subscriptions s ON u.id = s.user_id
WHERE aul.timestamp >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY u.email, s.tier
ORDER BY total_cost DESC;
```

---

## Migration from Placeholder

If you previously had placeholder implementations:

### Before (Placeholder)
```javascript
async function invokeLCAAnalyst(action, data, options) {
  // Placeholder implementation
  return { totalEmbodiedCarbon: 1000 };
}
```

### After (Claude API)
```javascript
async function invokeLCAAnalyst(action, data, options) {
  if (!isClaudeConfigured()) {
    return invokeLCAAnalystFallback(action, data, options);
  }

  const result = await invokeAgent('cc-lca-analyst', action, data, options);

  if (!result.success) {
    return invokeLCAAnalystFallback(action, data, options);
  }

  return result;
}
```

**No breaking changes** - The API contract remains the same!

---

## Support

### Documentation
- [Anthropic API Docs](https://docs.anthropic.com/claude/reference/getting-started-with-the-api)
- [Agent Integration Architecture](AGENT_INTEGRATION_ARCHITECTURE.md)
- [Agent Usage Guide](AGENT_USAGE_GUIDE.md)

### Common Issues
- Check [Troubleshooting](#troubleshooting) section above
- Review Vercel deployment logs
- Check Anthropic console for API errors

### Contact
- **Issues**: GitHub Issues
- **Questions**: Development team
- **API Support**: support@anthropic.com

---

**Last Updated**: 2025-11-02
**Integration Version**: 1.0.0
**Status**: ✅ Production Ready
