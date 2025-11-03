# CarbonConstruct Environment Setup Guide

## 🔐 Security First Approach

**NO HARDCODED KEYS IN CODE** - All sensitive credentials are loaded from environment variables only.

## Quick Start

### For Local Development

1. **Copy the example file:**
   ```bash
   cp .env.local.example .env.local
   ```

2. **Fill in your actual credentials in `.env.local`:**
   - Get Supabase credentials from: https://supabase.com/dashboard/project/jaqzoyouuzhchuyzafii/settings/api
   - Get EC3 credentials from: https://buildingtransparency.org/
   - Get Stripe keys from: https://dashboard.stripe.com/apikeys

3. **Start the development server:**
   ```bash
   npm start
   ```

### For Vercel Production

1. **Go to Vercel Dashboard:**
   - Navigate to: Project > Settings > Environment Variables

2. **Add the following environment variables:**

   | Variable Name | Description | Example |
   |--------------|-------------|---------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | `https://jaqzoyouuzhchuyzafii.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key (client-safe) | `eyJhbGci...` |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) | `eyJhbGci...` |
   | `NEXT_PUBLIC_EC3_API_KEY` | EC3 API key for materials database | `Mc8RCk...` |
   | `EC3_CLIENT_SECRET` | EC3 OAuth client secret (server-only) | Secret value |
   | `STRIPE_SECRET_KEY` | Stripe secret key (server-only) | `sk_live_...` |
   | `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | `whsec_...` |
   | `APP_URL` | Your production URL | `https://carbonconstruct.com.au` |

3. **Deploy:**
   ```bash
   npm run deploy
   ```

## Environment Variable Types

### 🌍 Client-Side Variables (Prefix: `NEXT_PUBLIC_`)

These are safe to expose in the browser and will be bundled into your HTML:

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key (has RLS protection)
- `NEXT_PUBLIC_EC3_API_KEY` - EC3 API key for read-only access
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key

### 🔒 Server-Side Variables (No Prefix)

These should NEVER be exposed to the browser:

- `SUPABASE_SERVICE_ROLE_KEY` - Bypasses RLS, server-only
- `EC3_CLIENT_SECRET` - OAuth secret
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Webhook verification secret
- `ANTHROPIC_API_KEY` - Claude API key

## How It Works

### Build Time Injection

1. During build, `build.js` reads environment variables from Vercel
2. It injects them into HTML files as `window.ENV` object
3. JavaScript files read from `window.ENV` instead of hardcoded values

### Runtime Configuration

JavaScript files use this pattern:

```javascript
// js/config.js
window.SUPABASE_URL = window?.ENV?.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
window.SUPABASE_ANON_KEY = window?.ENV?.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validate
if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
    console.error('⚠️ Missing Supabase configuration');
}
```

## Verification Checklist

### ✅ Before Committing

- [ ] No API keys in any `.js`, `.html`, or `.css` files
- [ ] `.env.local` is in `.gitignore`
- [ ] All hardcoded values replaced with `process.env.VAR_NAME`
- [ ] Build script validates required environment variables

### ✅ Before Deploying

- [ ] All environment variables set in Vercel dashboard
- [ ] Test build runs successfully: `npm run build` or `node build.js`
- [ ] No warnings about missing environment variables
- [ ] Verify on production that keys are loaded correctly

## Troubleshooting

### "Missing Supabase configuration" Error

**Cause:** Environment variables not set or not being injected

**Fix:**
1. Check `.env.local` exists and has correct values (local dev)
2. Check Vercel environment variables are set (production)
3. Run build script manually: `node build.js` and check for warnings

### "EC3 connection failed" Error

**Cause:** EC3 API key or OAuth configuration missing

**Fix:**
1. Verify `NEXT_PUBLIC_EC3_API_KEY` is set
2. Verify `EC3_CLIENT_SECRET` is set for OAuth
3. Check EC3 redirect URI matches your domain

### Build Warnings

If you see warnings like:
```
⚠️ WARNING: NEXT_PUBLIC_SUPABASE_URL not set
```

**Fix:** Set the missing environment variable in:
- `.env.local` (local development)
- Vercel Dashboard (production)

## Files That Use Environment Variables

### JavaScript Files
- `js/config.js` - Main configuration
- `js/navigation.js` - App navigation
- `supabase-client.js` - Database client
- `api/` folder - All serverless functions

### HTML Files (Build Injection)
All HTML files receive `window.ENV` injection during build:
- `index.html`, `dashboard.html`, `calculator.html`
- `operational-carbon.html`
- `signin-new.html`, `signup-new.html`
- `settings.html`, `subscription.html`
- `ec3-oauth.html`, `ec3-callback.html`

## Security Best Practices

1. **Never commit `.env.local`** - It's in `.gitignore` for a reason
2. **Rotate keys regularly** - Especially after team changes
3. **Use different keys for dev/staging/prod** - Never reuse production keys
4. **Review git history** - If you accidentally committed keys, rotate them immediately
5. **Use Vercel's environment variable encryption** - Keys are encrypted at rest

## Getting Credentials

### Supabase
1. Go to: https://supabase.com/dashboard
2. Select project: `jaqzoyouuzhchuyzafii`
3. Settings > API
4. Copy `URL` and `anon/public` key

### EC3 (Building Transparency)
1. Go to: https://buildingtransparency.org/
2. Create account or sign in
3. API Settings > Generate API Key
4. For OAuth: Register your app and get client credentials

### Stripe
1. Go to: https://dashboard.stripe.com/
2. Developers > API keys
3. Copy publishable and secret keys
4. Webhooks > Add endpoint for webhook secret

## Support

If you encounter issues:
1. Check this guide first
2. Verify all environment variables are set correctly
3. Check browser console for configuration errors
4. Review build logs in Vercel for warnings

## Summary

✅ **NO KEYS IN CODE** - Everything from environment variables
✅ **SECURE BY DEFAULT** - Server secrets never exposed to client
✅ **EASY TO ROTATE** - Change keys in one place (Vercel dashboard)
✅ **DEVELOPMENT FRIENDLY** - `.env.local` for local testing
✅ **BUILD-TIME INJECTION** - Automatic during Vercel deployment
