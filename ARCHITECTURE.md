# CarbonConstruct - Complete Architecture Documentation

## Application Structure

###  Page Routing & Purpose

#### Marketing & Landing Pages
- **index.html** - Homepage/Landing page with hero, features, pricing
  - Links: signin-new.html, signup-new.html, operational-carbon.html
  - Auth: Public
  - Navigation: Basic marketing nav

#### Core Application
- **calculator.html** - MAIN APPLICATION PAGE (Complete LCA Calculator)
  - This is the full-featured embodied carbon calculator
  - Includes: Project setup, materials database, LCA stages, charts
  - Auth: Works both public and authenticated
  - Navigation: Full app navigation

- **operational-carbon.html** - Operational emissions calculator
  - Scope 1 & 2 emissions tracking
  - Site equipment, electricity, transport
  - Auth: Works both public and authenticated

#### Authentication & User Management  
- **signin-new.html** - Sign in (Email/Google/GitHub)
  - Uses: auth-supabase.js, js/config.js
  - Redirects to: dashboard.html after login

- **signup-new.html** - Sign up / Create account
  - Uses: auth-supabase.js, js/config.js  
  - Redirects to: dashboard.html after signup

#### Authenticated User Pages
- **dashboard.html** - User dashboard
  - Saved projects, stats, recent activity
  - Requires: Supabase authentication
  - Navigation: Dashboard, Calculator, Settings, Subscription

- **settings.html** - Account settings
  - Profile, preferences, security
  - Requires: Authentication

- **subscription.html** - Manage subscription  
  - Stripe billing, plan changes
  - Requires: Authentication

#### Integrations
- **ec3-oauth.html** - EC3 Database OAuth connection
  - Connect to Building Transparency EC3 (50,000+ EPDs)
  - Public access

- **ec3-callback.html** - OAuth callback handler
  - Processes EC3 OAuth redirect

### JavaScript Architecture

#### Core Modules (Loaded on calculator.html)
```
js/config.js                  - Environment configuration
js/supabase-client.js         - Supabase database client  
js/ec3-client.js              - EC3 API client
js/materials-database.js      - 40+ materials with carbon coefficients
js/lca-calculator.js          - LCA calculation engine (A1-D stages)
js/scopes-calculator.js       - GHG Protocol Scopes calculator
js/compliance.js              - NCC/NABERS/Green Star compliance
js/charts.js                  - Chart.js visualizations
js/storage.js                 - Project persistence (Supabase)
js/main.js                    - Application controller
js/agent-orchestrator.js      - AI agent integration
```

#### Auth Modules
```
auth-supabase.js              - Supabase authentication functions
```

#### Utility Modules
```
js/navigation.js              - Unified navigation component (NEW)
js/operational-carbon-ui.js   - Operational carbon calculator UI
js/emissions-factors.js       - Australian emission factors
```

### Database Schema (Supabase)

**Project:** jaqzoyouuzhchuyzafii.supabase.co

#### Tables
- `unified_materials` - 54,343+ materials (NABERS + EPD AU + EC3)
- `user_profiles` - Extended user info
- `subscriptions` - Stripe subscription tracking
- `invoices` - Billing history
- `projects` - Saved carbon calculations
- `activity_log` - User activity
- `user_preferences` - Settings
- `webhook_errors` - Failed webhook logs

### Authentication Flow

1. User visits signin-new.html or signup-new.html
2. Supabase handles authentication (email/OAuth)
3. On success: redirect to dashboard.html
4. Dashboard loads user projects from Supabase
5. User can navigate to calculator.html to create/edit projects

### Application Workflow

#### Calculator Flow (calculator.html)
1. Load page with all JS modules
2. Initialize Supabase client
3. Load materials database (local + Supabase)
4. User enters project details
5. User adds materials with quantities
6. Click "Calculate All":
   - LCA Calculator processes materials through A1-D stages
   - Scopes Calculator maps to Scope 1/2/3
   - Compliance Checker runs NCC/NABERS/Green Star
7. Charts render results
8. User can save project (requires auth) or export

### Environment Variables

**Required for Production:**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `NEXT_PUBLIC_EC3_API_KEY` - EC3 API key (optional)
- `EC3_CLIENT_SECRET` - EC3 OAuth secret (server-side)
- `STRIPE_SECRET_KEY` - Stripe secret (server-side)
- `STRIPE_WEBHOOK_SECRET` - Webhook verification

### API Endpoints (Vercel Serverless)

```
/api/stripe-webhook.js        - Stripe webhook handler
/api/ec3-oauth-token.js       - EC3 OAuth token exchange
/api/ec3-proxy.js             - EC3 API proxy
/api/invoke-agent.js          - Claude AI agent endpoint
```

### Deployment (Vercel)

1. Build script (`build.js`) injects environment variables into HTML
2. All HTML/JS/CSS served statically from Vercel CDN
3. API routes deployed as serverless functions
4. Auto-deploy on git push to main branch

### Key Features

1. **Complete LCA** - All stages A1-D per EN 15978
2. **GHG Scopes** - Scope 1, 2, 3 per GHG Protocol
3. **Compliance** - NCC 2022, NABERS, GBCA Green Star
4. **Materials Database** - 54,343+ materials with EPDs
5. **Visualizations** - Interactive charts  
6. **Project Management** - Save/load projects
7. **Authentication** - Multi-provider (Supabase)
8. **Subscriptions** - Stripe billing integration

### Navigation Structure

```
Home (index.html)
├── Sign In (signin-new.html)
├── Sign Up (signup-new.html)
├── Calculator (calculator.html) ← MAIN APP
│   └── Materials Database
│   └── LCA Stages
│   └── Compliance Checks
│   └── Charts & Reports
├── Operational Carbon (operational-carbon.html)
└── EC3 Database (ec3-oauth.html)

Authenticated Users:
├── Dashboard (dashboard.html)
│   ├── My Projects
│   ├── Recent Activity
│   └── Stats
├── Settings (settings.html)
└── Subscription (subscription.html)
```

### Current Issues to Fix

1. **Navigation inconsistency** - Some pages have nav, others don't
2. **Routing clarity** - Need clear links between pages
3. **Supabase initialization** - Not consistent across pages
4. **Authentication state** - Not properly checked on all pages
5. **Mobile navigation** - Missing hamburger menu on some pages

### Recommended Fixes

1. **Add unified navigation to ALL pages** using js/navigation.js
2. **Consistent page header** with logo, nav links, user menu
3. **Proper authentication guards** on protected pages
4. **Clear routing** with breadcrumbs where appropriate
5. **Mobile-responsive** navigation on all pages
