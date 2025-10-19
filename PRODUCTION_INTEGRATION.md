# CarbonConstruct Production Integration Guide

## 🎯 Overview

This guide explains how to integrate the new authentication and subscription management code with your **LIVE** production environment at `carbonconstruct.com.au`.

**Current Status:**
- ✅ Domain: carbonconstruct.com.au (LIVE)
- ✅ Vercel: All environment variables configured
- ✅ Supabase: 54,343+ materials database operational
- ✅ Stripe: Full subscription setup with tiers
- ✅ OAuth: Google & GitHub configured in Supabase
- ✅ Keys: pk, rk, webhook keys all tested

**What We're Updating:**
- Replace demo authentication with real Supabase Auth
- Add subscription management page
- Add Stripe webhook handler
- Add user dashboard
- Add settings page

---

## 📁 New Files Created

### Authentication Files (Replace Demo Code)
```
auth-supabase.js          - Real Supabase Auth client (replaces demo)
signin-new.html           - Production sign-in page
signup-new.html           - Production sign-up page
auth/callback.html        - OAuth callback handler
```

### Dashboard & Management
```
dashboard.html            - User dashboard with projects & stats
subscription.html         - Subscription management page
settings.html            - User profile & account settings
```

### Backend Integration
```
api/stripe-webhook.js     - Stripe webhook handler (Vercel serverless)
SUPABASE_SCHEMA.sql      - Database schema (run in Supabase)
```

### Documentation
```
PRODUCTION_INTEGRATION.md - This file
```

---

## 🚀 Step-by-Step Integration

### Step 1: Update Supabase Database Schema

Your database needs several tables for the new functionality.

**Action Required:**
1. Go to Supabase dashboard → SQL Editor
2. Copy and paste the entire contents of `SUPABASE_SCHEMA.sql`
3. Click "Run" to create all tables

**Tables Created:**
- `user_profiles` - Extended user information
- `subscriptions` - Stripe subscription data
- `invoices` - Billing history
- `projects` - User carbon calculation projects
- `activity_log` - Dashboard activity feed
- `user_preferences` - Notification settings
- `webhook_errors` - Debugging webhook issues

**Note:** Your existing `unified_materials` table (54,343 materials) is NOT modified.

---

### Step 2: Update Supabase Environment Variables

Since your Vercel env vars are already configured, verify these exist:

**In Vercel Dashboard → Settings → Environment Variables:**
```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbG...  # Public key
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...  # Admin key (for webhooks)

# Stripe
STRIPE_PUBLIC_KEY=pk_live_51RKejrP7JT8gu0WngS6oEMcUaQdgGb5XaYcEy5e2kq6Dx75lgaizFV1Fk2lmpgE7nGav6F0fDlMhSYcgecftwpu800mMRyCFJz
STRIPE_SECRET_KEY=rk_live_...  # Your restricted key
STRIPE_WEBHOOK_SECRET=whsec_...  # From Stripe webhook setup
```

✅ You mentioned these are already configured, so this should be complete.

---

### Step 3: Create Webhook Endpoint in Stripe

The webhook handler (`api/stripe-webhook.js`) needs to be registered with Stripe.

**Setup Process:**

1. **Deploy the webhook first** (see Step 5 below)
2. Go to Stripe Dashboard → Developers → Webhooks
3. Click "Add endpoint"
4. **Endpoint URL:** `https://carbonconstruct.com.au/api/stripe-webhook`
5. **Events to send:**
   ```
   customer.subscription.created
   customer.subscription.updated
   customer.subscription.deleted
   customer.subscription.trial_will_end
   invoice.paid
   invoice.payment_failed
   checkout.session.completed
   ```
6. Click "Add endpoint"
7. Copy the **Signing secret** (starts with `whsec_`)
8. Add to Vercel: `STRIPE_WEBHOOK_SECRET=whsec_...`

---

### Step 4: Update Auth Configuration in Code

The new auth files use environment variables, but you need to update one file:

**File:** `auth-supabase.js`

Replace this section at the top:
```javascript
// Initialize Supabase client
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';
```

**With your actual values:**
```javascript
// Initialize Supabase client
const supabaseUrl = 'https://your-project.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

**Note:** In production, you'd typically use environment variables, but since you're deploying to Vercel as static files, hardcoding the **public** anon key is safe (it's designed to be public).

---

### Step 5: Deploy to Production (GitHub → Vercel)

Your GitHub repo is at `github.com/stvn101/carbonconstruct_scope_lca`.

**Deployment Steps:**

1. **Push new files to GitHub:**
   ```bash
   cd /path/to/your/local/repo
   
   # Copy new files (or git add them if already in repo)
   git add auth-supabase.js
   git add signin-new.html signup-new.html
   git add auth/callback.html
   git add dashboard.html subscription.html settings.html
   git add api/stripe-webhook.js
   git add SUPABASE_SCHEMA.sql PRODUCTION_INTEGRATION.md
   
   git commit -m "Add production authentication and subscription management"
   git push origin main
   ```

2. **Vercel will automatically deploy** (if auto-deploy is enabled)
   - Or manually trigger deploy in Vercel dashboard

3. **Verify deployment:**
   - Visit `https://carbonconstruct.com.au/signin-new.html`
   - Should see the new sign-in page
   - Check browser console for any errors

---

### Step 6: Update Navigation Links

Update your existing pages to use the new auth pages:

**Files to Update:**

1. **index.html** - Update sign in button:
   ```html
   <!-- OLD -->
   <a href="signin.html" class="cta-button secondary">Sign In</a>
   
   <!-- NEW -->
   <a href="signin-new.html" class="cta-button secondary">Sign In</a>
   ```

2. **Any other pages** with sign-in/sign-up links:
   - Replace `signin.html` → `signin-new.html`
   - Replace `signup.html` → `signup-new.html`

---

### Step 7: Configure Supabase Auth URLs

In Supabase dashboard, configure OAuth redirect URLs:

**Supabase Dashboard → Authentication → URL Configuration:**

**Site URL:**
```
https://carbonconstruct.com.au
```

**Redirect URLs (Add all of these):**
```
https://carbonconstruct.com.au/auth/callback.html
https://carbonconstruct.com.au/dashboard.html
http://localhost:3000/auth/callback.html  (for local development)
```

**Email Templates:**
Update email templates to use production URLs:
- Confirmation email: `https://carbonconstruct.com.au/dashboard.html`
- Reset password: `https://carbonconstruct.com.au/signin-new.html`

---

### Step 8: Test the Integration

**Test Checklist:**

1. **Email Sign Up:**
   - ✅ Visit `https://carbonconstruct.com.au/signup-new.html`
   - ✅ Create new account with email/password
   - ✅ Check email for confirmation link
   - ✅ Confirm email and login
   - ✅ Redirected to dashboard

2. **Google OAuth:**
   - ✅ Visit sign-in page
   - ✅ Click "Continue with Google"
   - ✅ Authorize with Google
   - ✅ Redirected to dashboard
   - ✅ Profile created in `user_profiles` table

3. **GitHub OAuth:**
   - ✅ Same process as Google
   - ✅ Verify GitHub profile linked

4. **Dashboard:**
   - ✅ View stats (should show 0 projects initially)
   - ✅ Subscription banner shows "No Active Subscription"
   - ✅ Can navigate to subscription page

5. **Subscription Page:**
   - ✅ Shows available plans
   - ✅ "Select Plan" redirects to checkout
   - ✅ Billing history empty

6. **Checkout Flow:**
   - ✅ Visit `https://carbonconstruct.com.au/checkout.html?plan=professional`
   - ✅ Complete test payment with test card: `4242 4242 4242 4242`
   - ✅ Webhook fires and creates subscription in database
   - ✅ Dashboard shows active subscription

7. **Settings Page:**
   - ✅ Update profile information
   - ✅ Change notification preferences
   - ✅ Connected accounts show OAuth providers

---

## 🔧 Troubleshooting

### Issue: "Invalid API key" error

**Solution:** Update `auth-supabase.js` with correct Supabase URL and anon key.

---

### Issue: Webhook not receiving events

**Checklist:**
- ✅ Webhook endpoint deployed: `https://carbonconstruct.com.au/api/stripe-webhook`
- ✅ Webhook secret added to Vercel env vars
- ✅ Stripe webhook registered with correct URL
- ✅ Events selected in Stripe webhook config

**Debug:**
1. Check Vercel logs: Vercel Dashboard → Deployments → Function Logs
2. Check Stripe logs: Stripe Dashboard → Developers → Webhooks → Your endpoint
3. Check `webhook_errors` table in Supabase

---

### Issue: OAuth redirect fails

**Solution:**
1. Verify redirect URLs in Supabase Auth settings
2. Check callback.html is deployed at `/auth/callback.html`
3. Verify Google/GitHub OAuth credentials are correct

---

### Issue: Database queries fail

**Solution:**
1. Check Row Level Security (RLS) policies are enabled
2. Verify user is authenticated (check `auth.uid()`)
3. Check Supabase logs for permission errors

---

### Issue: Materials database not accessible

**Solution:**
Your existing `unified_materials` table should work as-is. Update `supabase-client.js` with production credentials if needed.

---

## 📊 Database Tables Reference

### Quick Overview

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `user_profiles` | Extended user info | full_name, company, stripe_customer_id |
| `subscriptions` | Stripe subscriptions | status, plan_id, current_period_end |
| `invoices` | Billing history | amount, status, invoice_number |
| `projects` | User projects | name, total_carbon, material_count |
| `activity_log` | Recent activity | type, title, created_at |
| `user_preferences` | App settings | email_notifications, theme |
| `unified_materials` | **Your existing 54,343+ materials** | name, category, carbon_value |

---

## 🔒 Security Notes

1. **Row Level Security (RLS):** All tables have RLS enabled
   - Users can only access their own data
   - Service role key bypasses RLS (webhook handler)

2. **Webhook Signature Verification:** 
   - All webhook events are verified with Stripe signature
   - Prevents unauthorized data modification

3. **Environment Variables:**
   - Never commit secret keys to Git
   - Use Vercel environment variables
   - Public keys (pk_, anon key) are safe to expose

4. **OAuth Security:**
   - Callback URLs must be registered in Supabase
   - Prevents authorization code injection attacks

---

## 📈 Next Steps After Integration

### Optional Enhancements

1. **Email Service Integration:**
   - SendGrid, Resend, or Postmark
   - Update email helpers in `api/stripe-webhook.js`

2. **Calculator Page:**
   - Integrate with materials database
   - Save calculations to `projects` table
   - Generate NCC compliance reports

3. **Analytics:**
   - Add Google Analytics
   - Track conversion events
   - Monitor subscription metrics

4. **Custom Material Library:**
   - Allow users to add custom materials
   - Store in separate table with user_id

5. **Team Collaboration:**
   - Share projects with team members
   - Role-based access control

6. **API Access:**
   - Create REST API for programmatic access
   - API key management for Enterprise users

---

## 🆘 Support

**If you encounter issues:**

1. **Check Vercel Logs:**
   - Vercel Dashboard → Deployments → Function Logs
   - Look for errors in API routes

2. **Check Supabase Logs:**
   - Supabase Dashboard → Logs
   - Filter by table or auth events

3. **Check Stripe Events:**
   - Stripe Dashboard → Developers → Events
   - View webhook delivery attempts

4. **Check Browser Console:**
   - F12 → Console tab
   - Look for JavaScript errors

5. **Database Issues:**
   - Supabase Dashboard → SQL Editor
   - Run verification queries from SUPABASE_SCHEMA.sql

---

## ✅ Production Checklist

Before going fully live, verify:

- [ ] All Supabase tables created successfully
- [ ] Environment variables configured in Vercel
- [ ] Webhook endpoint registered in Stripe
- [ ] OAuth redirect URLs configured in Supabase
- [ ] Test sign-up/sign-in flows work
- [ ] Test subscription purchase works
- [ ] Webhook events create database records
- [ ] Dashboard loads user data correctly
- [ ] Settings page updates save
- [ ] Old signin.html/signup.html pages redirected or removed
- [ ] Navigation links updated site-wide
- [ ] Email templates customized (optional)
- [ ] Privacy policy updated with new data handling
- [ ] Terms of service mentions subscriptions

---

## 🎉 Conclusion

You now have a complete, production-ready authentication and subscription management system integrated with your existing CarbonConstruct platform!

**What You Can Do Now:**
- ✅ Users can sign up/sign in with email, Google, or GitHub
- ✅ Users can subscribe to Starter, Professional, or Enterprise plans
- ✅ Subscription status syncs automatically via webhooks
- ✅ Users can manage their profile and preferences
- ✅ Dashboard shows projects and activity
- ✅ Subscription page manages billing and plan changes

**Ready to scale your NCC-compliant embodied carbon calculator!** 🚀
