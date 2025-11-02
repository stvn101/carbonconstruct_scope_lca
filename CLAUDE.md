# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CarbonConstruct is a web-based embodied carbon calculator for Australian construction projects. It provides comprehensive Life Cycle Assessment (LCA) and GHG Protocol Scopes reporting with compliance checking for NCC, NABERS, GBCA Green Star, and TCFD requirements.

**Tech Stack**: Vanilla JavaScript (ES6+), HTML5, CSS3, Tailwind CSS, Chart.js, Supabase (database/auth), Stripe (payments), Vercel (hosting)

## Development Commands

### Local Development
```bash
# Start local development server
npm start
# or
pnpm dev

# Starts http-server on port 8000 with auto-open
```

### Testing
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run manual test suite in browser
npm run test:manual
```

### Code Quality
```bash
# Run ESLint (max warnings: 0)
npm run lint
```

### Deployment
```bash
# Deploy to Vercel production
npm run deploy
# or
vercel --prod
```

## Architecture Overview

### Frontend Structure

The application follows a **modular vanilla JavaScript architecture** without frameworks:

- **Entry Point**: `index.html` - Homepage with navigation to all features
- **Main Calculator**: `calculator.html` - Single-page embodied carbon calculator
- **Operational Carbon**: `operational-carbon.html` - Separate operational emissions calculator
- **Authentication**: `signin-new.html`, `signup-new.html` - Supabase-powered auth
- **User Features**: `dashboard.html`, `subscription.html`, `settings.html` - Logged-in user interface

### JavaScript Module Organization

Located in `/js/`, modules are loaded via `<script>` tags (no build step required):

**Core Calculation Engines:**
- `materials-database.js` - 40+ construction materials with carbon coefficients
- `lca-calculator.js` - Full lifecycle assessment (A1-D stages per EN 15978)
- `scopes-calculator.js` - GHG Protocol Scopes 1, 2, 3 calculations
- `compliance.js` - Australian compliance checking (NCC, NABERS, Green Star, TCFD)
- `emissions-factors.js` - Australian state-based grid emission factors

**Visualization & UI:**
- `charts.js` - Chart.js visualizations (LCA stages, Scopes, materials breakdown)
- `main.js` - Application controller and event handlers
- `operational-carbon-ui.js` - Operational carbon calculator UI logic

**Data & Integration:**
- `storage.js` - Supabase database integration for project persistence
- `supabase-client.js` - Supabase client configuration
- `ec3-client.js`, `ec3-oauth-client.js` - EC3 database integration (50,000+ EPDs)
- `config.js` - Environment configuration (Supabase URLs, API keys)

### API Routes (Serverless Functions)

Located in `/api/`, deployed as Vercel serverless functions:

- `stripe-webhook.js` - Stripe webhook handler for subscription events
- `ec3-proxy.js` - Proxy for EC3 API requests
- `ec3-oauth-token.js` - OAuth token handler for EC3 integration

### Database Architecture (Supabase)

**Primary Table**: `unified_materials` (54,343+ materials)
- Combines NABERS, EPD Australasia, and EC3 databases
- Schema: id, material_name, category, subcategory, carbon_factor, unit, source, epd_id, manufacturer, description, region

**User Tables** (from SUPABASE_SCHEMA.sql):
- `user_profiles` - Extended user information
- `subscriptions` - Stripe subscription tracking
- `invoices` - Billing history
- `projects` - Saved carbon calculations
- `activity_log` - User activity tracking
- `user_preferences` - Settings and notifications
- `webhook_errors` - Failed webhook logging

### Key Architectural Patterns

1. **No Build Step**: All JavaScript is ES6+ modules loaded directly in browser
2. **Progressive Enhancement**: Core functionality works without JavaScript, enhanced with JS
3. **Modular Calculation Engines**: Each calculator (LCA, Scopes, Compliance) is independent
4. **Data Layer Separation**: `storage.js` abstracts all database operations
5. **Serverless Backend**: Vercel functions handle webhooks and external API proxying

## Configuration Management

### Environment Setup

**Required Environment Variables** (Vercel):
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Client-Side Configuration**:
- Edit `js/config.js` for Supabase client setup
- OR create `js/config.local.js` (gitignored) for local development
- Uses fallback pattern: `window?.ENV?.VARIABLE || 'DEFAULT'`

### Local Development Setup

1. Copy `.env.example` to `.env.local`
2. Add Supabase credentials to `js/config.local.js` (or edit `js/config.js`)
3. Run `npm start` or `pnpm dev`
4. Access at `http://localhost:8000`

## Common Development Tasks

### Adding New Materials to Database

Use migration scripts in root directory:
```bash
# Fetch all materials from EC3 (requires API access)
node fetch_all_materials.js

# Migrate to Supabase with proper schema
node migrate_supabase.js

# Check schema integrity
node check_schema.js
```

### Working with Calculations

**LCA Calculator Flow**:
1. User inputs project details (GFA, design life, building type)
2. User adds materials with quantities
3. `lca-calculator.js` processes each material through stages A1-D
4. Results aggregated and passed to `charts.js` for visualization
5. `compliance.js` runs benchmark checks
6. `storage.js` saves to Supabase `projects` table

**Key Formula** (in `lca-calculator.js`):
```javascript
// Total Carbon = Sum of (Quantity × Carbon Factor × Stage Coefficients)
totalCarbon = materials.reduce((sum, material) => {
  return sum + (material.quantity * material.carbonFactor * stageCoefficients);
}, 0);
```

### Stripe Integration

**Webhook Testing**:
1. Use Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe-webhook`
2. Trigger test events: `stripe trigger customer.subscription.created`
3. Check `webhook_errors` table in Supabase for failures
4. Logs available in Vercel Functions dashboard

**Subscription Flow**:
1. User selects plan on `subscription.html`
2. Redirects to Stripe Checkout (managed by Stripe)
3. Webhook fires on `checkout.session.completed`
4. `api/stripe-webhook.js` updates `subscriptions` table
5. Dashboard reflects new subscription status

### Supabase Row Level Security (RLS)

All tables use RLS policies. When adding new tables:
1. Create table in Supabase dashboard or via SQL
2. Add RLS policies for user-specific data
3. Use `auth.uid()` for user-scoped queries
4. Test with `supabase-client.js` queries

Example policy pattern:
```sql
CREATE POLICY "Users can view own data"
ON projects FOR SELECT
USING (auth.uid() = user_id);
```

## Integration Points

### EC3 Database Integration
- **Purpose**: Access to 50,000+ Environmental Product Declarations
- **OAuth Flow**: `ec3-oauth.html` → `ec3-callback.html` → `api/ec3-oauth-token.js`
- **Data Access**: Proxied through `api/ec3-proxy.js` to avoid CORS
- **Local Testing**: Use `ec3-debug.html` for OAuth troubleshooting

### Materials Database Sync
- **Primary Sources**: NABERS, EPD Australasia, EC3
- **Update Frequency**: Manual via migration scripts
- **Search Performance**: Indexed on material_name, category, source
- **Access Pattern**: Read-only from `js/materials-database.js` (local) or Supabase query

## Compliance Standards Implementation

### NCC 2022 (National Construction Code)
- Benchmarks defined in `compliance.js`
- Carbon intensity limits per building type
- Section J energy efficiency requirements

### NABERS (0-6 Star Rating)
- Algorithm in `compliance.js`: `calculateNABERSRating()`
- Based on carbon intensity (kg CO2-e/m²)
- Thresholds: 6★ (<250), 5★ (250-350), 4★ (350-500), etc.

### Green Star (GBCA)
- Points calculation in `compliance.js`: `calculateGreenStarPoints()`
- Materials credit based on embodied carbon reduction
- Certification levels: 4★, 5★, 6★ (World Leadership)

### GHG Protocol Scopes
- **Scope 1**: Direct emissions (construction equipment, site operations)
- **Scope 2**: Purchased electricity (grid emissions by state)
- **Scope 3**: Value chain (15 categories including materials, transport, waste)
- Mapping to LCA stages automated in `scopes-calculator.js`

## Testing Strategy

### Manual Testing
- Load `js/tests/manual-test-suite.html` in browser
- Interactive tests for each calculator module
- Visual verification of charts and outputs

### Unit Testing (Jest)
- Test files: `**/*.test.js` or `**/*.spec.js`
- Coverage target: `js/**/*.js` excluding vendor and tests
- DOM testing: jsdom environment configured

### Integration Testing
- Test full workflow: material input → calculation → database save → report export
- Verify Stripe webhook → database update flow
- Check OAuth flow: EC3, Google, GitHub

## Deployment Checklist

Before deploying to production:

1. **Environment Variables**: Verify all secrets in Vercel dashboard
2. **Database Schema**: Run `SUPABASE_SCHEMA.sql` if not already applied
3. **RLS Policies**: Ensure all tables have appropriate security policies
4. **Stripe Webhooks**: Configure endpoint URL in Stripe dashboard
5. **OAuth Redirects**: Add production URLs to Supabase auth settings
6. **API Keys**: Rotate any committed secrets (check `SECRET_REMOVAL_LOG.md`)
7. **CNAME/DNS**: Verify domain points to Vercel
8. **Security Headers**: Configured in `vercel.json`
9. **Test Cards**: Remove Stripe test mode keys before production

Refer to `DEPLOYMENT_CHECKLIST.md` for detailed steps.

## Important Notes

### Materials Database
- **54,343+ materials** available in Supabase `unified_materials` table
- Local `js/materials-database.js` contains subset of 40+ common materials for offline use
- Production should query Supabase for full database access

### Australian Focus
- All emission factors are Australian-specific (NGER, state grid factors)
- Compliance frameworks are Australian standards only
- Benchmarks calibrated for Australian construction industry

### No Framework Philosophy
- Intentionally uses vanilla JavaScript for transparency and learning
- No webpack, no React, no complex build chains
- Trade-off: Manual module loading, no hot reload (refresh page to see changes)

### File Naming Conventions
- `*-new.html` = Production-ready Supabase auth pages
- `*.html` (no suffix) = Legacy demo pages or static marketing pages
- `*-supabase.js` = Supabase integration modules
- Scripts in root = Migration/setup utilities (not deployed)

## Support Documentation

For detailed information, refer to:
- `README.md` - Comprehensive project documentation
- `PROJECT_SUMMARY.md` - Feature overview and metrics
- `QUICK_START.md` - 30-minute production setup guide
- `DEPLOYMENT.md` - Deployment configuration details
- `SUPABASE_INTEGRATION.md` - Database integration guide
- `UNIFIED_MATERIALS_DATABASE_GUIDE.md` - Materials database documentation
