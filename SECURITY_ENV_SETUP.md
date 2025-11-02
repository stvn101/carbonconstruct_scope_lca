# SECURITY_ENV_SETUP.md

## Security Environment Setup Guide

## 🔒 CRITICAL: Key Rotation Complete

After the accidental exposure of API keys in the git repository, all keys have been rotated and the system has been secured.

## 🛡️ Environment Variables Required

### Vercel Environment Variables

Set these in your Vercel dashboard (Project Settings → Environment Variables):

#### 1. EC3 Access Token

```
Variable: EC3_ACCESS_TOKEN
Value: [Your new EC3 Bearer token]
Environment: Production, Preview, Development
```

#### 2. EC3 OAuth Client Secret

```
Variable: EC3_CLIENT_SECRET
Value: [Your EC3 OAuth client secret]
Environment: Production, Preview, Development
```

#### 3. Supabase Configuration

```
Variable: SUPABASE_URL
Value: [Your Supabase project URL]
Environment: Production, Preview, Development

Variable: SUPABASE_SERVICE_ROLE_KEY
Value: [Your new Supabase service role key]
Environment: Production, Preview, Development

Variable: SUPABASE_ANON_KEY
Value: [Your new Supabase anon key]
Environment: Production, Preview, Development
```

## 🔧 How to Set Vercel Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your `carbonconstruct-scope-lca` project
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. Enter variable name and value
6. Select all environments (Production, Preview, Development)
7. Click **Save**

## 🚀 Deployment

After setting all environment variables:

```bash
# Redeploy to pick up new environment variables
vercel --prod
```

## ✅ Security Checklist

- [x] Removed hardcoded tokens from code
- [ ] Set EC3_ACCESS_TOKEN in Vercel
- [ ] Set EC3_CLIENT_SECRET in Vercel
- [ ] Set SUPABASE_URL in Vercel
- [ ] Set SUPABASE_SERVICE_ROLE_KEY in Vercel
- [ ] Set SUPABASE_ANON_KEY in Vercel
- [ ] Redeploy application
- [ ] Test EC3 integration
- [ ] Test Supabase integration

## 🧪 Testing

1. **Test EC3 Proxy**: <https://carbonconstruct.com.au/ec3-debug.html>
2. **Test OAuth Flow**: <https://carbonconstruct.com.au/ec3-oauth.html>
3. **Test Main App**: <https://carbonconstruct.com.au>

## 🔐 Security Best Practices Applied

1. **No secrets in code**: All tokens moved to environment variables
2. **Key rotation**: All exposed keys have been regenerated
3. **Least privilege**: Using appropriate scoped tokens
4. **Environment isolation**: Separate keys for different environments

## 🚨 If You See Errors

If the EC3 integration stops working after this update:

1. Check that `EC3_ACCESS_TOKEN` is set in Vercel
2. Verify the token has the correct permissions
3. Use the debug page to test connectivity
4. Redeploy if environment variables were added after deployment

## 📞 Support

If you need help with any of these steps, the debug page at <https://carbonconstruct.com.au/ec3-debug.html> will show detailed error messages to help troubleshoot.

**Purpose:** ensure only safe, public configuration exists in Vercel and all secrets remain server‑side.

---

### ✅ 1. Environment Variables (Vercel)

Keep exactly these three:

```
NEXT_PUBLIC_EC3_API_KEY
SUPABASE_URL
SUPABASE_ANON_KEY
```

All others must be deleted.

---

### ✅ 2. Supabase Console

Private credentials remain only inside Supabase. Rotate and keep these **out of Vercel**:

```
POSTGRES_HOST
POSTGRES_DATABASE
POSTGRES_PASSWORD
SERVICE_ROLE_KEY
JWT_SECRET
```

Rotate them once, store only within Supabase.

---

### ✅ 3. Stripe / EC3 / Other APIs

Store their **secret keys** in each provider's dashboard or a local `.env` file for backend functions — never public.

---

### ✅ 4. Verification After Redeploy

- Application loads normally
- Supabase login and save/load succeed
- No `process.env undefined` errors
- No secrets visible in page source or DevTools

---

### ✅ 5. Ongoing Best Practice

- Only variables prefixed with `NEXT_PUBLIC_` belong in Vercel.
- All others are server-only.
- Rotate API keys every 90 days or after exposure.
- Keep this checklist in root of repo for future audits.

---

**Last Updated:** 2025‑10‑24
S
