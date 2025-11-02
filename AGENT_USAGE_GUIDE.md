# Agent Integration Usage Guide

## Overview

CarbonConstruct now supports **AI-Enhanced Calculation Mode** powered by Claude Code agents. This feature provides advanced analysis, automated insights, and intelligent recommendations for your construction carbon calculations.

## Available Agents

### 1. cc-lca-analyst
**Purpose**: Life Cycle Assessment calculations with ISO 14040/14044 compliance

**Capabilities**:
- Parse BIM schedules and CSV files automatically
- Natural language material search
- Carbon hotspot analysis with optimization recommendations
- Automated LCA report generation
- Multi-standard validation (EN 15978, PAS 2080)

**Use Cases**:
- Upload Revit material schedules for instant carbon calculations
- Get AI-powered recommendations for carbon reduction
- Generate client-ready LCA reports in markdown/PDF

### 2. compliance-checker
**Purpose**: Australian compliance framework validation

**Capabilities**:
- NCC 2022 compliance checking
- NABERS star rating calculation (0-6 stars)
- GBCA Green Star certification assessment
- TCFD climate disclosure reporting
- Gap analysis with actionable recommendations

**Use Cases**:
- Check project compliance against multiple frameworks
- Get certification roadmap (e.g., "How to achieve 6★ NABERS?")
- Generate compliance documentation packages

### 3. materials-database-manager
**Purpose**: Materials database maintenance and synchronization

**Capabilities**:
- Sync 54,343+ materials from EC3, NABERS, EPD Australasia
- Validate data quality (carbon factors, units, regions)
- Run migration scripts automatically
- Generate database statistics and coverage reports

**Use Cases**:
- Keep materials database up-to-date
- Validate carbon factor accuracy
- Monitor database coverage

### 4. construction-estimator
**Purpose**: Construction cost estimation with carbon integration

**Capabilities**:
- Parse RBSS extract files
- Calculate costs for carpentry, partitions, ceilings, glazing
- Apply Australian construction rates
- Integrate with LCA calculations for cost-carbon trade-offs

**Use Cases**:
- Upload RBSS files for cost + carbon analysis
- Find optimal cost-carbon balance
- Design optimization recommendations

## Getting Started

### Step 1: Subscription

AI-Enhanced features require a **Pro subscription** or higher. Visit [subscription.html](/subscription.html) to upgrade.

**Subscription Tiers**:
- **Free**: 0 agent invocations/month
- **Pro**: 50 agent invocations/month
- **Enterprise**: Unlimited

### Step 2: Enable AI Mode

1. Open [calculator.html](/calculator.html)
2. Find the "AI-Enhanced Calculation" section (purple/blue gradient box)
3. Toggle the "AI Mode" switch to ON
4. If subscribed, you'll see:
   - AI Features grid (3 feature cards)
   - BIM file upload section
   - Usage statistics counter

### Step 3: Upload BIM Schedule (Optional)

**Supported Formats**:
- CSV (.csv)
- Excel (.xlsx)
- IFC (.ifc) - Industry Foundation Classes
- Revit (.rvt) - Export as CSV first

**Upload Process**:
1. Click "Choose File" in the BIM upload section
2. Select your material schedule file
3. AI will parse and extract materials automatically
4. Materials are added to the calculator instantly

**Expected CSV Format**:
```csv
Material Name,Category,Quantity,Unit
Concrete 32MPa,Concrete,150,m3
Structural Steel,Steel,50,tonnes
GLT Beams,Timber,25,m3
```

### Step 4: Run AI-Enhanced Calculation

Once AI mode is enabled:
1. Add materials manually or via BIM upload
2. Click "Calculate" as usual
3. Behind the scenes:
   - `cc-lca-analyst` agent enhances calculation
   - Hotspot analysis identifies top carbon contributors
   - Recommendations are generated automatically
4. Results include AI-powered insights panel

## Using Agent Features

### Natural Language Material Search

When AI mode is enabled, the material search supports natural language:

**Standard Search** (AI Mode OFF):
```
Category: Concrete
Material: Concrete 32MPa
```

**AI Search** (AI Mode ON):
```
Search: "low carbon concrete for commercial building foundations"
Result: AI suggests "Concrete 32MPa with 30% GGBS" (lower carbon)
```

### Hotspot Analysis

After calculation, the AI identifies carbon hotspots:

**Example Output**:
```
Top Carbon Contributors:
1. Concrete (structural) - 1,575,000 kg CO2-e (83%)
   → Recommendation: Specify 30% GGBS to reduce by 450,000 kg CO2-e

2. Steel (reinforcement) - 195,000 kg CO2-e (10%)
   → Recommendation: Use high-strength steel to reduce quantity by 15%

3. Glazing (facade) - 78,000 kg CO2-e (4%)
   → Recommendation: Consider recycled aluminum frames
```

### Compliance Report Generation

**Automatic Compliance Check**:
1. Run calculation with AI mode enabled
2. Agent automatically checks:
   - NCC 2022 benchmarks
   - NABERS rating (0-6 stars)
   - Green Star points (1-5)
   - TCFD disclosure requirements
3. Results displayed in "Compliance" section

**Generate Detailed Report**:
```javascript
// In browser console
const report = await window.agentOrchestrator.generateComplianceReport(
  complianceResults,
  { format: 'markdown', includeCertificationRoadmap: true }
);
console.log(report);
```

### Gap Analysis

**Scenario**: "I want to achieve 6★ NABERS rating"

1. Run calculation with AI mode
2. Current rating: 4★ (500 kg CO2-e/m²)
3. Target rating: 6★ (<250 kg CO2-e/m²)
4. AI generates gap analysis:

```
Gap to 6★ NABERS: 250 kg CO2-e/m² reduction needed

Action Plan:
1. Replace 50% concrete with lower carbon mix → -120 kg CO2-e/m²
2. Increase timber usage in structure → -80 kg CO2-e/m²
3. Optimize glazing specifications → -50 kg CO2-e/m²

Total reduction: 250 kg CO2-e/m² ✓
Achieves 6★ NABERS rating
```

## API Usage (Advanced)

### Invoking Agents Programmatically

```javascript
// Get the agent orchestrator instance
const orchestrator = window.agentOrchestrator;

// Example 1: Invoke LCA Agent
const lcaResult = await orchestrator.invokeLCAAgent(
  {
    name: 'Office Building',
    gfa: 5000,
    designLife: 50,
    location: 'Sydney, NSW',
    buildingType: 'commercial'
  },
  [
    { name: 'Concrete 32MPa', quantity: 150, unit: 'm3', carbonFactor: 310 },
    { name: 'Structural Steel', quantity: 50, unit: 'tonnes', carbonFactor: 1900 }
  ],
  {
    includeHotspotAnalysis: true,
    generateReport: false,
    complianceFrameworks: ['NCC', 'NABERS']
  }
);

console.log('Total Carbon:', lcaResult.results.totalEmbodiedCarbon);
console.log('Hotspots:', lcaResult.results.hotspots);

// Example 2: Invoke Compliance Checker
const complianceResult = await orchestrator.invokeComplianceAgent(
  {
    carbonIntensity: 375,
    totalEmbodiedCarbon: 1875000,
    projectType: 'commercial',
    gfa: 5000
  },
  'commercial',
  {
    frameworks: ['NCC', 'NABERS', 'GreenStar'],
    includeGapAnalysis: true
  }
);

console.log('NABERS Rating:', complianceResult.results.nabers.currentRating);

// Example 3: Search Materials with AI
const materials = await orchestrator.searchMaterials(
  'low embodied carbon insulation for external walls'
);

console.log('Found materials:', materials);

// Example 4: Parse BIM File
const bimMaterials = await orchestrator.parseBIMFile(fileInputElement.files[0]);
console.log('Parsed materials:', bimMaterials);

// Example 5: Generate LCA Report
const report = await orchestrator.generateLCAReport(lcaResults, {
  format: 'markdown',
  includePDF: true,
  includeRecommendations: true
});

console.log('Report:', report.markdown);
```

## Rate Limiting

### Usage Quotas

Each subscription tier has monthly agent invocation limits:

| Tier | Invocations/Month | Cost per Extra |
|------|-------------------|----------------|
| Free | 0 | N/A |
| Pro | 50 | $2.00 |
| Enterprise | Unlimited | Included |

### Checking Usage

**In UI**: Look at "AI Usage This Month" counter in the AI-Enhanced section

**In Console**:
```javascript
// Check usage via Supabase
const { data: { user } } = await supabase.auth.getUser();
const { data } = await supabase.rpc('get_user_monthly_usage', { p_user_id: user.id });
console.log('Usage:', data);
```

### Handling Rate Limits

If you exceed your limit:
1. Error message: `"Agent invocation limit reached for your subscription tier"`
2. Options:
   - Wait until next month
   - Upgrade to higher tier
   - Purchase additional invocations (Pro tier only)

## Troubleshooting

### Issue: AI Mode Toggle Disabled

**Symptoms**: Toggle switches ON then immediately OFF

**Solutions**:
1. Check subscription status: Visit [subscription.html](/subscription.html)
2. Verify Pro subscription is active
3. Check browser console for errors:
   ```
   [AI Mode] Pro subscription required
   ```

### Issue: BIM Upload Fails

**Symptoms**: "Failed to parse file" error

**Solutions**:
1. **Check file format**: Must be CSV, Excel, IFC, or Revit export
2. **Verify CSV structure**: Should have columns: Material Name, Category, Quantity, Unit
3. **Check file size**: Max 10MB
4. **Review console logs**:
   ```javascript
   console.log('BIM Parser error:', error.message);
   ```

### Issue: Agent Timeout

**Symptoms**: "AI analysis timed out. Using standard calculation."

**Solutions**:
1. **Reduce file size**: Large BIM files may timeout
2. **Simplify materials list**: Break into smaller batches
3. **Check network**: Slow connection may cause timeout
4. **Fallback**: Standard calculation runs automatically

### Issue: Usage Stats Not Loading

**Symptoms**: "AI Usage This Month: 0 / 50" never updates

**Solutions**:
1. **Check Supabase connection**:
   ```javascript
   const { data, error } = await supabase.from('agent_usage_log').select('count');
   console.log('Connection test:', data, error);
   ```
2. **Verify database schema**: Run `database/agent_usage_schema.sql`
3. **Check RLS policies**: Ensure user has SELECT permissions
4. **Refresh page**: Stats load on page load

## Database Setup

### Apply Agent Usage Schema

**Step 1: Run SQL in Supabase**

1. Open Supabase dashboard: https://app.supabase.com
2. Navigate to SQL Editor
3. Copy contents of `database/agent_usage_schema.sql`
4. Execute SQL

**Step 2: Verify Tables Created**

```sql
-- Check agent_usage_log table
SELECT * FROM agent_usage_log LIMIT 1;

-- Check agent_cache table
SELECT * FROM agent_cache LIMIT 1;

-- Test usage function
SELECT * FROM get_user_monthly_usage(auth.uid());
```

**Step 3: Verify RLS Policies**

```sql
-- List policies
SELECT * FROM pg_policies WHERE tablename = 'agent_usage_log';
```

Expected policies:
- `Users can view own agent usage`
- `Service role can insert agent usage`
- `Service role can update agent usage`

## Cost Management

### Estimated Costs

Based on Anthropic API pricing (Claude Sonnet):

| Agent | Avg Tokens (Input/Output) | Cost per Invocation |
|-------|---------------------------|---------------------|
| cc-lca-analyst | 1,000 / 2,000 | ~$0.10 |
| compliance-checker | 500 / 1,000 | ~$0.05 |
| materials-database-manager | 200 / 500 | ~$0.02 |
| construction-estimator | 800 / 1,500 | ~$0.08 |

**Monthly Cost Examples**:
- Pro tier (50 invocations): $5-10/month
- Enterprise (unlimited): Variable, contact sales

### Cost Optimization

**Best Practices**:
1. **Use caching**: Identical requests return cached results (free)
2. **Batch operations**: Upload BIM once instead of adding materials individually
3. **Standard mode**: Use for quick checks, AI mode for detailed analysis
4. **Targeted analysis**: Only request features you need (e.g., skip report generation)

## Security & Privacy

### Data Handling

**What is sent to agents**:
- Project metadata (name, GFA, location)
- Material quantities and types
- Calculation results for analysis

**What is NOT sent**:
- User personal information (name, email)
- Payment details
- Other projects' data

### Authentication

All agent requests require:
1. **Supabase auth token**: User must be logged in
2. **Active subscription**: Pro or Enterprise tier
3. **Rate limit check**: Within monthly quota

### Data Storage

**Agent Usage Log** (`agent_usage_log` table):
- Stores metadata only (agent type, timestamp, success/failure)
- Optional: Full input/output for debugging (disabled by default)
- Retention: 90 days (configurable)

**Cache** (`agent_cache` table):
- Stores results for 1 hour
- No personal identifiers
- Automatic cleanup of expired entries

## Support

### Getting Help

**Documentation**:
- Architecture: See `AGENT_INTEGRATION_ARCHITECTURE.md`
- API Reference: See `js/agent-orchestrator.js` inline docs
- Database: See `database/agent_usage_schema.sql` comments

**Community**:
- GitHub Issues: [Report bugs](https://github.com/yourusername/carbonconstruct/issues)
- Discussions: Share use cases and feedback

**Enterprise Support**:
- Email: support@carbonconstruct.com
- SLA: 24-hour response time

## Changelog

### Version 1.0.0 (2025-11-02)
- ✅ Initial agent integration
- ✅ cc-lca-analyst agent (LCA calculations)
- ✅ compliance-checker agent (NCC, NABERS, Green Star)
- ✅ materials-database-manager agent (database sync)
- ✅ construction-estimator agent (cost estimation)
- ✅ BIM file upload (CSV, Excel, IFC)
- ✅ AI-Enhanced UI controls
- ✅ Subscription tier gating
- ✅ Usage tracking and rate limiting
- ✅ Response caching (1 hour)

### Roadmap

**Version 1.1.0** (Q1 2026):
- Natural language queries ("What if I use timber instead of steel?")
- Multi-agent collaboration (LCA + Estimator working together)
- PDF report generation with charts
- IFC native parsing (no CSV export needed)

**Version 1.2.0** (Q2 2026):
- Conversational interface (chat with agents)
- Project-specific learning (agents improve with usage)
- Carbon reduction scenarios (automated what-if analysis)
- Integration with BIM software plugins

**Version 2.0.0** (Q3 2026):
- Autonomous agent workflows (agents plan and execute tasks)
- Multi-project benchmarking
- Industry-specific recommendations (commercial vs residential)
- Real-time collaboration features

---

**Last Updated**: 2025-11-02
**Version**: 1.0.0
**Author**: CarbonConstruct Team
