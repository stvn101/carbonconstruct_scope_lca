# CarbonConstruct - Complete Architecture Documentation

## Application Structure

### Correct User Flow

**This is a SaaS application with authentication-gated features:**

1. **Landing Page (index.html)** → Public marketing page
2. **Sign In/Up** → Authentication
3. **Dashboard** → User's project hub  
4. **Calculator** → The MVP app (accessed from dashboard)

### Page Routing & Purpose

#### Public Pages (No Auth Required)
- **index.html** - Landing/Marketing page
  - Hero section, features, pricing, testimonials
  - CTA buttons: "Start Free Trial" → signup-new.html
  - Links: Sign In, Sign Up
  - Auth: Public
  - Navigation: Simple marketing nav (Features, Pricing, About)

#### Authentication Pages
- **signin-new.html** - Sign in page (Email/Google/GitHub)
  - Uses: auth-supabase.js, js/config.js
  - On success → Redirects to: **dashboard.html**
  - Auth: Public (redirects if already logged in)

- **signup-new.html** - Sign up / Create account
  - Uses: auth-supabase.js, js/config.js  
  - On success → Redirects to: **dashboard.html**
  - Auth: Public (redirects if already logged in)

#### Authenticated Pages (Login Required)

- **dashboard.html** - User Dashboard (First page after login)
  - Shows: Saved projects, stats, recent activity
  - Main CTA: "New Project" button → calculator.html
  - Navigation: Dashboard, Calculator, Settings, Subscription
  - Auth: **REQUIRED** - Redirects to signin if not authenticated

- **calculator.html** - THE MAIN MVP APPLICATION
  - Complete embodied carbon calculator (LCA engine)
  - Project setup, materials database, LCA stages, charts
  - Accessed FROM dashboard, not directly
  - Auth: **REQUIRED** (or demo mode with limited features)
  - Navigation: Dashboard, Calculator sections, User menu

- **operational-carbon.html** - Operational emissions calculator
  - Scope 1 & 2 emissions tracking  
  - Auth: **REQUIRED** (or demo mode)

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

### Navigation Structure & User Flow

```
┌─────────────────────────────────────────────────────────┐
│                    PUBLIC ACCESS                        │
└─────────────────────────────────────────────────────────┘

Home (index.html) - Landing Page
├── Features Section (#features)
├── Pricing Section (#pricing)  
├── About Section (#about)
└── Call-to-Action
    ├── "Start Free Trial" → signup-new.html
    └── "Sign In" → signin-new.html

Sign Up (signup-new.html)
└── On Success → dashboard.html

Sign In (signin-new.html)
└── On Success → dashboard.html

┌─────────────────────────────────────────────────────────┐
│              AUTHENTICATED USER AREA                    │
│              (Requires Login)                           │
└─────────────────────────────────────────────────────────┘

Dashboard (dashboard.html) ← LANDING PAGE AFTER LOGIN
├── My Projects List
│   └── Click Project → calculator.html?id=PROJECT_ID
├── Stats & Metrics
├── Recent Activity
└── Primary Actions
    ├── "New Project" Button → calculator.html
    └── "Operational Carbon" → operational-carbon.html

Calculator (calculator.html) ← MAIN MVP APPLICATION
├── Project Setup (name, type, GFA)
├── Materials Database (54,343+ materials)
├── LCA Calculator (A1-D stages)
├── Scopes Calculator (Scope 1, 2, 3)
├── Compliance Checker (NCC, NABERS, Green Star)
├── Charts & Visualizations
├── Save Project → Back to dashboard.html
└── Export Reports (PDF/JSON)

Operational Carbon (operational-carbon.html)
├── Scope 1 Emissions Tracking
├── Scope 2 Emissions Tracking
├── Site Equipment, Electricity, Transport
└── Back to dashboard.html

Settings (settings.html)
├── Profile Settings
├── Notification Preferences
├── Security Settings
└── Account Management

Subscription (subscription.html)
├── Current Plan
├── Billing History
├── Upgrade/Downgrade
└── Cancel Subscription

┌─────────────────────────────────────────────────────────┐
│              OPTIONAL INTEGRATIONS                      │
└─────────────────────────────────────────────────────────┘

EC3 OAuth (ec3-oauth.html)
└── Connect to Building Transparency EC3 Database
    └── ec3-callback.html (OAuth handler)
```

**Key Principles:**
1. **Landing page is for marketing** - Features, pricing, sign up
2. **Calculator is the product** - Accessed after authentication
3. **Dashboard is the hub** - Users start here after login
4. **Linear flow:** Land → Sign Up → Dashboard → Calculator

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
