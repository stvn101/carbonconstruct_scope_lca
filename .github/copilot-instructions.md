# CarbonConstruct Copilot Instructions

## Project Context

CarbonConstruct is an Australian-focused embodied carbon calculator for construction projects. It implements **full Life Cycle Assessment (LCA)** following ISO 14040/14044 and EN 15978 standards, **GHG Protocol Scopes 1-3** calculations, and **Australian compliance** (NCC 2022, NABERS, GBCA Green Star, TCFD).

**Tech Stack**: Vanilla JavaScript (ES6+), HTML5, CSS3, Supabase (database/auth), Stripe (payments), Vercel (hosting)

## Core Architecture Principles

### 1. No-Build Vanilla JavaScript
- **Pattern**: ES6+ modules loaded directly via `<script>` tags
- **Rationale**: Transparency, simplicity, educational value
- **Trade-off**: Manual module loading, no hot reload (refresh to see changes)
- **Example**: `js/lca-calculator.js` is a self-contained calculator class

### 2. Modular Calculation Engines
Each calculator is an independent module with clear responsibilities:
- `js/lca-calculator.js` - LCA stages A1-D with Australian standards
- `js/scopes-calculator.js` - GHG Protocol Scopes 1-3 mapping
- `js/compliance.js` - NCC/NABERS/Green Star compliance checking
- `js/materials-database.js` - 40+ construction materials with carbon coefficients

### 3. Progressive Enhancement Pattern
- Core functionality works without JavaScript
- JavaScript enhances with calculations, visualizations, persistence
- Example: Material input forms work as static HTML, enhanced with real-time calculations

### 4. Data Layer Abstraction
- `js/storage.js` abstracts all database operations (Supabase)
- `js/config.js` handles environment configuration with fallbacks
- Pattern: `window?.ENV?.VARIABLE || 'DEFAULT'` for client-side config

## Development Workflow

### Commands (npm/pnpm)
```bash
npm start              # Local dev server (http-server port 8000)
npm run lint           # ESLint (max warnings: 0)
npm run deploy         # Vercel production deployment
npm test               # Jest unit tests
npm run test:manual    # Manual test suite in browser
```

### File Structure Conventions
- `*-new.html` = Production-ready Supabase auth pages
- `*.html` (no suffix) = Legacy demo pages or static marketing
- `*-supabase.js` = Supabase integration modules
- Root scripts = Migration/setup utilities (not deployed)

### Configuration Management
**Environment Variables** (Vercel dashboard):
- `SUPABASE_URL`, `SUPABASE_ANON_KEY` (database)
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (payments)

**Client Config**: Edit `js/config.js` or create `js/config.local.js` (gitignored)

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

### Material Database Access
- **Local**: `js/materials-database.js` (40+ materials for offline)
- **Production**: Supabase `unified_materials` table (54,343+ materials)
- **Pattern**: `getMaterialData(category, type)` function

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

### Serverless Functions (api/ directory)
- `api/stripe-webhook.js` - Webhook handler for subscription events
- `api/invoke-agent.js` - Claude AI integration for advanced features
- Pattern: Vercel serverless functions with environment variables

### Visualization Pattern
```javascript
// js/charts.js uses Chart.js for all visualizations
const createLCAChart = (canvasId, lcaData) => {
    return new Chart(ctx, {
        type: 'doughnut',
        data: formatLCAData(lcaData), // Australian-specific formatting
        options: australianChartOptions
    });
};
```

## Testing Strategy

### Manual Testing
- Load `js/tests/manual-test-suite.html` for interactive tests
- Test each calculator module independently
- Verify Australian compliance calculations

### Unit Testing (Jest)
- Test calculation engines in isolation
- Verify Australian standards compliance
- Coverage target: `js/**/*.js` excluding vendor/tests

## Australian Construction Focus

### Standards Implementation
- **NCC 2022**: Carbon intensity benchmarks per building type
- **NABERS**: 0-6 star rating based on kg CO2-e/m²
- **Green Star**: Points calculation for materials credit
- **GHG Protocol**: Scope 1-3 mapping to LCA stages

### Material Coefficients
- Source: AusLCI, EPD Australasia, NABERS databases
- Units: kg CO2-e per material unit (m³, tonne, m²)
- Regional factors: Australian state-based grid emissions

## Common Development Patterns

### Error Handling
```javascript
// Pattern: Graceful degradation with user feedback
try {
    const result = await calculateLCA(materials);
    updateUI(result);
} catch (error) {
    console.error('LCA calculation failed:', error);
    showUserMessage('Calculation error. Please check your inputs.');
}
```

### State Management
- No complex state management framework
- Project state held in JavaScript objects
- Persistence via `js/storage.js` to Supabase
- Local storage fallback for offline operation

### UI Update Pattern
```javascript
// Real-time calculation updates
function onMaterialChange() {
    const updatedResults = lcaCalculator.calculateProjectLCA(materials);
    updateChartsAndTables(updatedResults);
    updateComplianceStatus(updatedResults);
}
```

When working on this codebase, prioritize **Australian standards compliance**, **transparent calculations**, and **vanilla JavaScript simplicity** over complex frameworks or build tools.