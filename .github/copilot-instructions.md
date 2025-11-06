# CarbonConstruct Copilot Instructions

## Project Context

CarbonConstruct is an Australian-focused embodied carbon calculator for construction projects. It implements **full Life Cycle Assessment (LCA)** following ISO 14040/14044 and EN 15978 standards, **GHG Protocol Scopes 1-3** calculations, and **Australian compliance** (NCC 2022, NABERS, GBCA Green Star, TCFD).

**Tech Stack**: Vanilla JavaScript (ES6+), HTML5, CSS3, Supabase (database/auth), Stripe (payments), Vercel (hosting)

**Critical Architecture**: SaaS application with **authentication-gated calculator** - the main MVP is `calculator.html` accessed via `dashboard.html` after login

## Core Architecture Principles

### 1. SaaS User Flow (Authentication-First)
- **Landing**: `index.html` (marketing) → `signup-new.html` → `dashboard.html` → `calculator.html` (MVP)
- **Pattern**: Calculator requires auth; dashboard is user hub; landing is public marketing
- **Navigation**: `js/navigation.js` provides unified navigation across authenticated pages
- **Auth Guard**: Protected pages redirect to signin if not authenticated

### 2. Environment Injection Build System
- **Build Script**: `build.js` injects environment variables into HTML at deployment
- **Pattern**: `window.ENV = { SUPABASE_URL: '...' }` injected into `<head>` tags
- **Config**: `js/config.js` reads from `window.ENV` with fallbacks
- **Security**: NO hardcoded keys in code - all from Vercel environment variables

### 3. AI Agent Integration Architecture
- **Frontend**: `js/agent-orchestrator.js` manages Claude Code agent invocations
- **Backend**: `api/invoke-agent.js` bridges to Claude API with fallback logic
- **Utils**: `api/utils/claude-client.js` handles direct Claude API communication
- **Pattern**: Premium feature with subscription tier checking and rate limiting
- **Agents**: `cc-lca-analyst`, `compliance-checker`, `materials-database-manager`, `construction-estimator`

### 4. No-Build Vanilla JavaScript
- **Pattern**: ES6+ modules loaded directly via `<script>` tags
- **Rationale**: Transparency, simplicity, educational value
- **Trade-off**: Manual module loading, no hot reload (refresh to see changes)
- **Example**: `js/lca-calculator.js` is a self-contained calculator class

### 5. Modular Calculation Engines
Each calculator is an independent module with clear responsibilities:
- `js/lca-calculator.js` - LCA stages A1-D with Australian standards
- `js/scopes-calculator.js` - GHG Protocol Scopes 1-3 mapping
- `js/compliance.js` - NCC/NABERS/Green Star compliance checking
- `js/materials-database.js` - 40+ construction materials with carbon coefficients

## Development Workflow

### Commands (npm/pnpm)
```bash
npm start              # Local dev server (http-server port 8000)
npm run lint           # ESLint (max warnings: 0)  
npm run deploy         # Vercel production deployment (runs build.js)
npm test               # Jest unit tests
npm run test:manual    # Manual test suite in browser (js/tests/manual-test-suite.html)
npm run test:claude    # Test Claude AI integration
```

### Build & Deployment Pattern
```bash
# Vercel runs this on deployment:
node build.js          # Injects ENV vars into HTML files
# Then serves static files + serverless functions
```

### Testing Strategy & Workflows
- **Manual Testing**: Load `js/tests/manual-test-suite.html` - comprehensive UI test runner
- **Unit Testing**: Jest for calculation engines with Australian compliance verification
- **Test Pattern**: `test(name, fn)` with `assert()` and `assertCloseTo()` helpers
- **Coverage**: Target `js/**/*.js` excluding vendor/tests directories

### File Structure Conventions
- `*-new.html` = Production-ready Supabase auth pages
- `*.html` (no suffix) = Legacy demo pages or static marketing  
- `*-supabase.js` = Supabase integration modules
- Root scripts = Migration/setup utilities (not deployed)

### Configuration Management
**Environment Variables** (Vercel dashboard):
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (database)
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (payments)
- `ANTHROPIC_API_KEY` (Claude AI agents)

**Client Config**: `js/config.js` reads from injected `window.ENV`

## Key Calculation Patterns

### LCA Calculation Flow
```javascript
// Pattern used throughout js/lca-calculator.js
const productStageTotal = materialData.embodiedCarbon * quantity;
const a1a3 = productStageTotal * materialData.lcaStages.a1a3;
// Calculate B stages (maintenance/replacement over design life)
const useStage = this.calculateUseStage(category, productStageTotal, designLife);
```

### Australian Compliance Standards
```javascript
// Pattern in js/compliance.js
function calculateNABERSRating(carbonIntensity) {
    if (carbonIntensity < 250) return { stars: 6, level: 'Market Leading' };
    if (carbonIntensity < 350) return { stars: 5, level: 'Excellent' };
    // ... Australian-specific thresholds
}
```

### AI Agent Invocation Pattern
```javascript
// Frontend pattern in js/agent-orchestrator.js
const result = await agentOrchestrator.invokeLCAAgent(projectData, materials, {
    includeHotspotAnalysis: true,
    complianceFrameworks: ['NCC', 'NABERS', 'GreenStar']
});
// Backend automatically falls back to standard calculations if Claude API fails
```

### Comprehensive Testing Pattern
```javascript
// Manual test suite pattern in js/tests/manual-test-suite.html
test('Scope 1: Add excavator with fuel consumption', () => {
    const calc = new ComprehensiveScopesCalculator();
    const result = calc.addScope1Equipment({
        category: 'excavators',
        type: 'standard_13t',
        operatingHours: 100
    });
    assert(result.emissions > 0, 'Emissions should be greater than 0');
    assertCloseTo(result.fuelConsumed, 1200, 0); // 12L/hr * 100hr
});
```

## Database Architecture (Supabase)

### Key Tables & RLS Patterns
```sql
-- Pattern: All user data uses RLS with auth.uid()
CREATE POLICY "Users can view own data" ON projects 
FOR SELECT USING (auth.uid() = user_id);
```

**Primary Tables**:
- `unified_materials` - Master materials database (54k+ materials)
- `projects` - Saved carbon calculations with JSON results
- `user_profiles`, `subscriptions`, `invoices` - User management
- `agent_usage_log` - AI agent invocation tracking
- `webhook_errors` - Failed Stripe webhook logging

### Data Flow Pattern
```javascript
// js/storage.js abstracts all database operations
const saveProject = async (projectData) => {
    const { data, error } = await supabase
        .from('projects')
        .upsert([projectData]);
    // Handle error cases consistently
};
```

## Integration Points

### Stripe Subscription Flow
1. User selects plan → Stripe Checkout (managed)
2. `checkout.session.completed` webhook
3. `api/stripe-webhook.js` updates `subscriptions` table
4. Dashboard reflects new status

### Claude AI Agent Flow  
1. Frontend calls `js/agent-orchestrator.js`
2. Orchestrator calls `api/invoke-agent.js` with auth token
3. Server checks subscription tier & rate limits
4. Invokes Claude API via `api/utils/claude-client.js` or falls back to standard calculations
5. Returns enhanced results with AI insights

### Serverless Functions (api/ directory)
- `api/stripe-webhook.js` - Webhook handler for subscription events
- `api/invoke-agent.js` - Claude AI integration with fallback logic
- `api/utils/claude-client.js` - Direct Claude API communication utilities
- Pattern: Vercel serverless functions with environment variables

## Deployment & Production Workflows

### Pre-Deployment Checklist (from DEPLOYMENT_CHECKLIST.md)
1. **Database Setup**: Run `SUPABASE_SCHEMA.sql` to create 8 tables
2. **Auth URLs**: Configure Supabase redirect URLs for production domain
3. **Stripe Webhooks**: Set endpoint to `https://domain.com/api/stripe-webhook`
4. **Environment Variables**: Verify all keys in Vercel dashboard

### Production Testing Pattern
```bash
# Test sequence after deployment:
1. Email auth signup → dashboard redirect
2. OAuth providers (Google, GitHub) → dashboard redirect  
3. Subscription checkout → webhook delivery → database sync
4. Settings page → profile updates → persistence
5. Calculator → project save → Supabase storage
```

### Monitoring & Troubleshooting
- **Webhook Health**: Check `webhook_errors` table for Stripe integration issues
- **AI Agent Usage**: Monitor `agent_usage_log` for rate limiting and cost tracking
- **Auth Flow**: Verify Supabase redirect URLs and OAuth provider configuration
- **Database Performance**: Monitor RLS policy performance on large queries

## Testing Strategy

### Manual Testing Suite
- **Location**: `js/tests/manual-test-suite.html` - comprehensive browser-based test runner
- **Coverage**: Scope 1-3 calculations, LCA engines, Australian compliance standards
- **Pattern**: Visual test results with pass/fail status and detailed error reporting

### Unit Testing (Jest)
- **Target**: Calculation engines in isolation
- **Focus**: Australian standards compliance verification
- **Coverage**: `js/**/*.js` excluding vendor/tests directories

### Integration Testing
- **Auth Flow**: Signup → dashboard → calculator → project save
- **Payment Flow**: Checkout → webhook → subscription activation
- **AI Agent Flow**: Request → fallback → result validation

## Australian Construction Focus

### Standards Implementation
- **NCC 2022**: Carbon intensity benchmarks per building type
- **NABERS**: 0-6 star rating based on kg CO2-e/m²
- **Green Star**: Points calculation for materials credit
- **GHG Protocol**: Scope 1-3 mapping to LCA stages

### Material Coefficients & Data Sources
- **Source**: AusLCI, EPD Australasia, NABERS databases
- **Units**: kg CO2-e per material unit (m³, tonne, m²)
- **Regional Factors**: Australian state-based grid emissions
- **Local Database**: 40+ materials in `js/materials-database.js` for offline use
- **Production Database**: 54,343+ materials in Supabase `unified_materials` table

## Common Development Patterns

### Progressive Enhancement with Auth Gates
```javascript
// Pattern: Check auth state, degrade gracefully
if (await isAuthenticated()) {
    enableFullFeatures();
    loadUserProjects();
} else {
    enableDemoMode();
    showSignupPrompt();
}
```

### Error Handling with Fallbacks
```javascript
// Pattern: AI features fall back to standard calculations
try {
    const result = await agentOrchestrator.invokeLCAAgent(data);
    return result; // Enhanced AI results
} catch (error) {
    console.warn('AI unavailable, using standard calculations');
    return lcaCalculator.calculateProjectLCA(data); // Standard fallback
}
```

### Environment-Aware Configuration
```javascript
// Pattern: Build-time injection with runtime fallbacks
const supabaseUrl = window?.ENV?.NEXT_PUBLIC_SUPABASE_URL || '';
if (!supabaseUrl) {
    console.error('Supabase not configured - features disabled');
    showConfigurationError();
}
```

### Webhook Error Handling
```javascript
// Pattern: Log failed webhooks for debugging
try {
    await processStripeWebhook(event);
} catch (error) {
    await supabase.from('webhook_errors').insert({
        event_type: event.type,
        error_message: error.message,
        timestamp: new Date().toISOString()
    });
    throw error; // Re-throw for Stripe retry logic
}
```

When working on this codebase, prioritize **Australian standards compliance**, **authentication-first user flows**, **graceful AI fallbacks**, **comprehensive testing coverage**, and **build-time environment injection** patterns.