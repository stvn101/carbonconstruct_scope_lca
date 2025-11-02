# Agent Integration Architecture

## Overview

This document outlines the architecture for integrating Claude Code agents into CarbonConstruct, enabling AI-powered LCA calculations, compliance checking, and database management.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend Layer                           │
│  (calculator.html, operational-carbon.html, dashboard.html)     │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ UI Controls  │  │ File Upload  │  │ Report View  │          │
│  │ • Agent Mode │  │ • BIM/CSV    │  │ • AI Reports │          │
│  │ • Settings   │  │ • Plans      │  │ • Insights   │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                  │                  │                   │
│         └──────────────────┴──────────────────┘                  │
│                            │                                      │
│                  ┌─────────▼──────────┐                          │
│                  │ Agent Orchestrator │                          │
│                  │ (js/agent-orchestrator.js)                   │
│                  └─────────┬──────────┘                          │
└────────────────────────────┼─────────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │  Vercel Edge    │
                    │  API Functions  │
                    │ /api/invoke-agent│
                    └────────┬────────┘
                             │
        ┏━━━━━━━━━━━━━━━━━━━━┻━━━━━━━━━━━━━━━━━━━━┓
        ┃                                           ┃
  ┌─────▼─────┐  ┌──────▼──────┐  ┌──────▼──────┐ ┃
  │ cc-lca-   │  │compliance-  │  │ materials-  │ ┃
  │ analyst   │  │ checker     │  │ database-   │ ┃
  │           │  │             │  │ manager     │ ┃
  └─────┬─────┘  └──────┬──────┘  └──────┬──────┘ ┃
        │               │                 │        ┃
        │  ┌────────────▼─────────────────┘        ┃
        │  │                                        ┃
        └──┼────────────────────────────────────────┃
           │                                        ┃
     ┌─────▼────────────────────────────────────┐  ┃
     │         Claude Code Agent System         │  ┃
     │  (Runs in Claude Code environment)       │  ┃
     └─────┬────────────────────────────────────┘  ┃
           │                                        ┃
           ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
           │
     ┌─────▼─────┐
     │ Supabase  │
     │ Database  │
     │ • Materials│
     │ • Projects│
     │ • Results │
     └───────────┘
```

## Component Specifications

### 1. Agent Orchestrator (`js/agent-orchestrator.js`)

**Purpose**: Manages agent invocations from the frontend and handles response processing.

**Key Responsibilities**:
- Route calculation requests to appropriate agents
- Handle file uploads (BIM, CSV, plans)
- Parse agent responses
- Update UI with results
- Error handling and retries

**API**:
```javascript
class AgentOrchestrator {
  // Invoke LCA calculation agent
  async invokeLCAAgent(projectData, materials, options)

  // Invoke compliance checking agent
  async invokeComplianceAgent(carbonResults, projectType)

  // Invoke materials database manager
  async invokeMaterialsDBAgent(action, data)

  // Invoke construction estimator
  async invokeEstimatorAgent(rbssFile, projectSpecs)

  // Generic agent invocation
  async invokeAgent(agentType, payload)
}
```

### 2. API Endpoint (`/api/invoke-agent.js`)

**Purpose**: Vercel serverless function that bridges frontend requests to Claude Code agents.

**Request Format**:
```json
{
  "agentType": "cc-lca-analyst",
  "action": "calculate_lca",
  "data": {
    "projectInfo": {
      "name": "Office Building A",
      "gfa": 5000,
      "designLife": 50,
      "location": "Sydney, NSW"
    },
    "materials": [
      {
        "name": "Concrete 32MPa",
        "quantity": 150,
        "unit": "m³"
      }
    ]
  },
  "options": {
    "includeHotspotAnalysis": true,
    "generateReport": true,
    "complianceFrameworks": ["NCC", "NABERS", "GreenStar"]
  }
}
```

**Response Format**:
```json
{
  "success": true,
  "agentType": "cc-lca-analyst",
  "results": {
    "totalEmbodiedCarbon": 1875000,
    "carbonIntensity": 375,
    "stages": {
      "a1a3": 1575000,
      "a4": 93750,
      "a5": 93750,
      "b": 75000,
      "c": 37500,
      "d": -75000
    },
    "hotspots": [
      {
        "material": "Concrete 32MPa",
        "carbonContribution": 46500,
        "percentage": 82.4,
        "recommendation": "Consider specifying concrete with 30% GGBS replacement to reduce embodied carbon by ~25%"
      }
    ],
    "compliance": {
      "ncc": { "pass": true, "margin": 75 },
      "nabers": { "rating": 4, "threshold": 500 },
      "greenStar": { "points": 3, "certification": "5 Star" }
    }
  },
  "report": {
    "markdown": "# LCA Report...",
    "pdf_url": "https://..."
  },
  "timestamp": "2025-11-02T10:30:00Z",
  "executionTime": 2.3
}
```

### 3. Agent Integration Modes

#### Mode A: **Enhanced Mode** (AI-Powered)
- User selects "AI-Enhanced Calculation"
- Agents provide:
  - Natural language material matching
  - Hotspot analysis with recommendations
  - Automated compliance reports
  - What-if scenario generation

#### Mode B: **Standard Mode** (Current)
- Uses existing JavaScript calculation modules
- No agent invocation
- Faster, deterministic results
- Maintains backward compatibility

**UI Toggle**:
```html
<div class="calculation-mode-selector">
  <label>
    <input type="radio" name="calcMode" value="standard" checked>
    Standard Calculation
  </label>
  <label>
    <input type="radio" name="calcMode" value="ai-enhanced">
    AI-Enhanced (Beta) 🤖
  </label>
</div>
```

## Agent-Specific Integration Details

### Agent 1: cc-lca-analyst

**Trigger Points**:
1. **BIM Upload**: User uploads Revit schedule → agent parses and calculates
2. **Manual Entry**: User clicks "Get AI Analysis" → agent provides insights
3. **Material Search**: Natural language query → agent matches to database

**Integration Points**:
- `js/lca-calculator.js` - Enhance with agent calls
- `calculator.html` - Add "AI Analysis" button
- `js/main.js` - Modify `calculateAll()` function

**Data Flow**:
```
User Input (BIM/CSV)
  ↓
AgentOrchestrator.invokeLCAAgent()
  ↓
/api/invoke-agent (agentType: cc-lca-analyst)
  ↓
Claude Code executes agent prompt
  ↓
Agent returns JSON + Markdown report
  ↓
Frontend displays results + insights
  ↓
Save to Supabase projects table
```

### Agent 2: compliance-checker

**Trigger Points**:
1. **After Calculation**: Automatic compliance check post-LCA
2. **Manual Check**: User clicks "Generate Compliance Report"
3. **Certification Assistant**: User targets specific rating (e.g., "Achieve 6★ NABERS")

**Integration Points**:
- `js/compliance.js` - Add agent-enhanced reporting
- `calculator.html` - Add "Compliance Report" section
- `dashboard.html` - Show compliance status for saved projects

**Data Flow**:
```
LCA Results (carbon intensity)
  ↓
AgentOrchestrator.invokeComplianceAgent()
  ↓
/api/invoke-agent (agentType: compliance-checker)
  ↓
Agent calculates all ratings (NCC, NABERS, Green Star, TCFD)
  ↓
Agent generates gap analysis + recommendations
  ↓
Frontend displays certification roadmap
```

### Agent 3: materials-database-manager

**Trigger Points**:
1. **Database Sync**: Admin clicks "Sync Materials Database"
2. **Data Quality Check**: Scheduled validation runs
3. **Migration**: Database schema updates

**Integration Points**:
- `dashboard.html` - Admin panel for database management
- Migration scripts - Automated via agent
- `js/materials-database.js` - Dynamic loading from Supabase

**Data Flow**:
```
Admin triggers "Sync Database"
  ↓
AgentOrchestrator.invokeMaterialsDBAgent('sync')
  ↓
/api/invoke-agent (agentType: materials-database-manager)
  ↓
Agent runs fetch_all_materials.js + migrate_supabase.js
  ↓
Agent validates data quality
  ↓
Agent generates sync report
  ↓
Admin sees updated material count + statistics
```

### Agent 4: construction-estimator

**Trigger Points**:
1. **RBSS Upload**: User uploads RBSS extract file
2. **Cost-Carbon Analysis**: User requests integrated cost + carbon estimate
3. **Design Optimization**: "Find lowest cost-carbon option"

**Integration Points**:
- New page: `estimator.html` (or integrate into calculator.html)
- Link with `cc-lca-analyst` for combined reports
- Cost database integration (future)

**Data Flow**:
```
User uploads RBSS file
  ↓
AgentOrchestrator.invokeEstimatorAgent(rbssFile)
  ↓
/api/invoke-agent (agentType: construction-estimator)
  ↓
Agent parses quantities + applies Australian rates
  ↓
Agent calls cc-lca-analyst for carbon calculations
  ↓
Returns combined cost + carbon breakdown
  ↓
Frontend displays cost-carbon optimization chart
```

## Security & Authentication

### API Key Management
```javascript
// /api/invoke-agent.js
export default async function handler(req, res) {
  // 1. Verify Supabase auth token
  const token = req.headers.authorization;
  const { user, error } = await supabase.auth.getUser(token);

  if (error) return res.status(401).json({ error: 'Unauthorized' });

  // 2. Check subscription tier (agents = premium feature)
  const subscription = await getUserSubscription(user.id);
  if (!subscription.features.includes('ai_agents')) {
    return res.status(403).json({ error: 'Upgrade to access AI features' });
  }

  // 3. Invoke agent via Claude Code API
  const result = await invokeClaudeAgent(req.body);

  return res.status(200).json(result);
}
```

### Rate Limiting
- Free tier: 5 agent invocations/month
- Pro tier: 50 agent invocations/month
- Enterprise: Unlimited

## Performance Considerations

### Caching Strategy
```javascript
// Cache agent responses for identical inputs
const cacheKey = generateCacheKey(agentType, payload);
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

// Invoke agent
const result = await invokeAgent(agentType, payload);

// Cache for 1 hour
await redis.set(cacheKey, JSON.stringify(result), 'EX', 3600);
```

### Fallback to Standard Mode
```javascript
// If agent invocation fails, fall back to standard calculation
try {
  const agentResult = await invokeAgent(agentType, payload);
  return agentResult;
} catch (error) {
  console.warn('Agent invocation failed, using standard mode:', error);
  return standardLCACalculator.calculate(payload);
}
```

## Error Handling

### Error Types
1. **Agent Timeout**: Agent takes >30s → fallback to standard
2. **Agent Error**: Agent returns error → show error message + fallback
3. **Network Error**: API unreachable → queue for retry
4. **Validation Error**: Invalid input → show user-friendly message

### User Experience
```javascript
// Show loading state
showLoadingOverlay('AI Analysis in progress...');

try {
  const result = await orchestrator.invokeLCAAgent(data);
  displayResults(result);
} catch (error) {
  if (error.type === 'TIMEOUT') {
    showNotification('AI analysis is taking longer than expected. Using standard calculation.', 'warning');
    const standardResult = await standardCalculator.calculate(data);
    displayResults(standardResult);
  } else {
    showNotification('AI analysis failed. Please try again.', 'error');
  }
} finally {
  hideLoadingOverlay();
}
```

## Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Create `js/agent-orchestrator.js`
- [ ] Create `/api/invoke-agent.js`
- [ ] Add UI toggle for AI-Enhanced mode
- [ ] Implement basic agent invocation

### Phase 2: LCA Agent Integration (Week 2)
- [ ] Integrate `cc-lca-analyst` with calculator
- [ ] Add BIM/CSV file upload
- [ ] Implement hotspot analysis UI
- [ ] Add "AI Insights" panel

### Phase 3: Compliance Agent Integration (Week 3)
- [ ] Integrate `compliance-checker` agent
- [ ] Add compliance report generation
- [ ] Implement certification roadmap UI
- [ ] Add gap analysis visualization

### Phase 4: Database Management (Week 4)
- [ ] Integrate `materials-database-manager` agent
- [ ] Add admin panel for database sync
- [ ] Implement automated data quality checks
- [ ] Add database statistics dashboard

### Phase 5: Construction Estimator (Future)
- [ ] Create `estimator.html` page
- [ ] Integrate `construction-estimator` agent
- [ ] Add RBSS file parser
- [ ] Implement cost-carbon optimization charts

## Testing Strategy

### Unit Tests
- Test `AgentOrchestrator` methods
- Mock API responses
- Verify error handling

### Integration Tests
- Test end-to-end agent invocation
- Verify Supabase data persistence
- Test subscription tier checks

### User Acceptance Tests
- Upload sample BIM files
- Generate compliance reports
- Verify calculation accuracy
- Test fallback scenarios

## Monitoring & Analytics

### Metrics to Track
- Agent invocation count (by type)
- Average execution time
- Success/failure rates
- User adoption rate (AI-Enhanced vs Standard)
- Cost per invocation (Anthropic API usage)

### Logging
```javascript
// Log all agent invocations
await supabase.from('agent_usage_log').insert({
  user_id: user.id,
  agent_type: agentType,
  execution_time: executionTime,
  success: true,
  timestamp: new Date().toISOString()
});
```

## Cost Management

### Estimated Costs (Anthropic API)
- LCA analysis: ~$0.10 per invocation (1,000 tokens input, 2,000 output)
- Compliance check: ~$0.05 per invocation
- Database sync: ~$0.02 per invocation

### Cost Optimization
- Cache repeated queries
- Batch operations where possible
- Use smaller models for simple tasks (Haiku vs Sonnet)
- Implement usage quotas by subscription tier

## Documentation

### User Documentation
- Add "AI-Enhanced Features" section to README
- Create video tutorials for BIM upload
- Document compliance report interpretation
- FAQ for agent-powered features

### Developer Documentation
- API reference for `agent-orchestrator.js`
- Agent payload schemas (JSON)
- Error code reference
- Integration examples

## Future Enhancements

### Conversational Interface
```javascript
// Natural language queries
const response = await orchestrator.query("What if I replace 50% of concrete with lower carbon alternative?");
```

### Multi-Agent Collaboration
```javascript
// Agents working together
const optimization = await orchestrator.optimize({
  goal: "Achieve 6★ NABERS with minimal cost increase",
  agents: ['cc-lca-analyst', 'construction-estimator', 'compliance-checker']
});
```

### Continuous Learning
- Agents learn from user feedback
- Build project-specific benchmarks
- Improve material matching accuracy

---

**Last Updated**: 2025-11-02
**Author**: Claude Code
**Status**: Architecture Design Phase
