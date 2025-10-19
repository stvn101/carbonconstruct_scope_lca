# 🚀 CarbonConstruct - Quick Start Guide

## 30-Minute Production Deployment

This guide gets your production authentication and subscription management live in **30 minutes**.

---

## ⚡ Prerequisites (Already Done ✅)

- [x] Domain: carbonconstruct.com.au (LIVE)
- [x] Vercel: Environment variables configured
- [x] Supabase: 54,343+ materials database
- [x] Stripe: Subscriptions & tiers configured
- [x] OAuth: Google & GitHub set up

**You're ready to integrate!**

---

## 📋 5-Step Integration (30 minutes)

### Step 1: Database Setup (5 minutes)

**Action:** Create database tables in Supabase

1. Open [Supabase Dashboard](https://app.supabase.com)
2. Click your project
3. Click "SQL Editor" in left sidebar
4. Click "New Query"
5. Open `SUPABASE_SCHEMA.sql` file
6. Copy **entire contents** (Ctrl+A, Ctrl+C)
7. Paste into Supabase SQL Editor
8. Click **"Run"** button (or F5)
9. Wait for "Success" message
10. Verify tables created:
    ```sql
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public';
    ```
    Should see: user_profiles, subscriptions, invoices, projects, activity_log, user_preferences, webhook_errors, unified_materials

**Expected Result:** 8 tables created (7 new + 1 existing unified_materials)

---

### Step 2: Update Auth Credentials (2 minutes)

**Action:** Configure Supabase connection in code

1. Open `auth-supabase.js` in your code editor
2. Find lines 6-7:
   ```javascript
   const supabaseUrl = 'YOUR_SUPABASE_URL';
   const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';
   ```
3. Get your credentials from Supabase:
   - Dashboard → Settings → API
   - Copy "Project URL" (looks like: https://xxx.supabase.co)
   - Copy "anon public" key (starts with: eyJhbG...)
4. Replace in code:
   ```javascript
   const supabaseUrl = 'https://your-actual-project.supabase.co';
   const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
   ```
5. Save file

**Expected Result:** Auth client configured with your Supabase project

---

### Step 3: Deploy to Production (3 minutes)

**Action:** Push to GitHub and let Vercel auto-deploy

```bash
# Navigate to your project
cd /path/to/carbonconstruct

# Add all new files
git add .

# Commit with descriptive message
git commit -m "Add production authentication and subscription management

- Real Supabase Auth (email, Google, GitHub OAuth)
- User dashboard with projects and stats
- Subscription management page
- Stripe webhook handler
- Settings page (profile, notifications, security)
- Complete database schema with RLS"

# Push to main branch
git push origin main
```

**Expected Result:** 
- Files pushed to GitHub
- Vercel automatically deploys
- New pages live at carbonconstruct.com.au

**Verify deployment:**
- Go to [Vercel Dashboard](https://vercel.com/dashboard)
- Check latest deployment shows "Ready"
- Visit `https://carbonconstruct.com.au/signin-new.html` (should load)

---

### Step 4: Configure Stripe Webhook (10 minutes)

**Action:** Set up webhook to sync subscription data

1. **Get Webhook Secret First:**
   - Go to [Stripe Dashboard](https://dashboard.stripe.com)
   - Developers → Webhooks
   - Click "Add endpoint"
   - **Endpoint URL:** `https://carbonconstruct.com.au/api/stripe-webhook`
   - **Description:** "CarbonConstruct subscription sync"
   - **Events to send:** Click "Select events", then select these 7:
     - [x] `customer.subscription.created`
     - [x] `customer.subscription.updated`
     - [x] `customer.subscription.deleted`
     - [x] `customer.subscription.trial_will_end`
     - [x] `invoice.paid`
     - [x] `invoice.payment_failed`
     - [x] `checkout.session.completed`
   - Click "Add endpoint"
   - **Copy the signing secret** (starts with `whsec_...`)

2. **Add Secret to Vercel:**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Select carbonconstruct project
   - Settings → Environment Variables
   - Click "Add New"
   - **Name:** `STRIPE_WEBHOOK_SECRET`
   - **Value:** `whsec_...` (paste the secret you copied)
   - Click "Save"

3. **Redeploy Vercel:**
   - Go to Deployments tab
   - Click "..." menu on latest deployment
   - Click "Redeploy"
   - Wait for "Ready" status

**Expected Result:** Stripe events now sync to your database automatically

**Test the webhook:**
- Stripe Dashboard → Developers → Webhooks
- Click your endpoint
- Click "Send test webhook"
- Select "customer.subscription.created"
- Click "Send test webhook"
- Check "Recent deliveries" - should show 200 success

---

### Step 5: Configure Supabase Auth URLs (5 minutes)

**Action:** Allow OAuth redirects

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click your project
3. Authentication → URL Configuration
4. **Site URL:** Change to `https://carbonconstruct.com.au`
5. **Redirect URLs:** Click "Add URL" for each:
   - `https://carbonconstruct.com.au/auth/callback.html`
   - `https://carbonconstruct.com.au/dashboard.html`
   - `http://localhost:3000/auth/callback.html` (for local testing)
6. Click "Save"

**Expected Result:** OAuth providers (Google, GitHub) can now redirect back to your site

---

### Step 6: Update Navigation (3 minutes)

**Action:** Point existing links to new auth pages

1. Open `index.html`
2. Find sign-in links (Ctrl+F: `signin.html`)
3. Replace all instances:
   ```html
   <!-- OLD -->
   <a href="signin.html">Sign In</a>
   
   <!-- NEW -->
   <a href="signin-new.html">Sign In</a>
   ```
4. Find sign-up links (Ctrl+F: `signup.html`)
5. Replace all instances:
   ```html
   <!-- OLD -->
   <a href="signup.html">Sign Up</a>
   
   <!-- NEW -->
   <a href="signup-new.html">Sign Up</a>
   ```
6. Save file
7. Commit and push:
   ```bash
   git add index.html
   git commit -m "Update navigation to use new auth pages"
   git push origin main
   ```

**Expected Result:** Homepage now links to production auth pages

---

### Step 7: Test Everything (2 minutes)

**Quick verification checklist:**

**Authentication:**
- [ ] Visit `https://carbonconstruct.com.au/signup-new.html`
- [ ] Create test account with email + password
- [ ] Check email for confirmation link
- [ ] Click confirmation → Redirected to dashboard
- [ ] Dashboard loads without errors (check browser console F12)

**OAuth:**
- [ ] Logout (click Logout button)
- [ ] Visit `https://carbonconstruct.com.au/signin-new.html`
- [ ] Click "Continue with Google"
- [ ] Authorize → Redirected to dashboard
- [ ] Check Settings → Account (shows "Google: Connected")

**Dashboard:**
- [ ] Subscription banner shows "No Active Subscription"
- [ ] Stats show 0 projects
- [ ] Navigation works (Dashboard, Calculator, Subscription, Settings)

**Subscription:**
- [ ] Click "Subscription" in nav
- [ ] See 3 plans: Starter ($29), Professional ($79), Enterprise ($199)
- [ ] Click "Select Plan" on Professional → Redirects to checkout

**Done!** You're live! 🎉

---

## ✅ You're Production Ready!

### What Works Now:
- ✅ Email authentication (sign-up, sign-in, password reset)
- ✅ Google OAuth (one-click sign-in)
- ✅ GitHub OAuth (one-click sign-in)
- ✅ User dashboard with projects and stats
- ✅ Subscription management (view plans, billing history)
- ✅ Settings page (profile, notifications, security)
- ✅ Stripe webhook sync (subscriptions auto-update)

### Your Live URLs:
- Homepage: https://carbonconstruct.com.au
- Sign Up: https://carbonconstruct.com.au/signup-new.html
- Sign In: https://carbonconstruct.com.au/signin-new.html
- Dashboard: https://carbonconstruct.com.au/dashboard.html
- Subscription: https://carbonconstruct.com.au/subscription.html
- Settings: https://carbonconstruct.com.au/settings.html

---

## 🧪 Complete Test Flow (Optional - 5 minutes)

Test the entire user journey:

### 1. New User Sign-Up
```
Visit signup-new.html
→ Create account (email + password)
→ Verify email
→ Redirected to dashboard
→ Subscription banner: "No Active Subscription"
```

### 2. Subscribe to Plan
```
Click "Choose a Plan"
→ Select "Professional" ($79)
→ Complete checkout (use test card: 4242 4242 4242 4242)
→ Return to dashboard
→ Subscription banner: "Professional Plan Active"
```

### 3. Verify Webhook Sync
```
Open Supabase Dashboard
→ Table Editor → subscriptions
→ See new row with status: "active", plan_id: "professional"
→ Table Editor → invoices
→ See invoice record
```

### 4. Manage Settings
```
Dashboard → Settings
→ Update full name, company
→ Click "Save Changes"
→ See "Profile updated successfully"
→ Navigate to Notifications
→ Toggle email preferences
→ Save
```

### 5. Cancel Subscription (Optional)
```
Dashboard → Subscription
→ Click "Cancel Subscription"
→ Confirm cancellation
→ See "You will retain access until..."
→ Subscription banner: "Trial - X Days Left"
```

**All working?** You're 100% production ready! 🚀

---

## 🆘 Troubleshooting

### Issue: Webhook returns 404
**Fix:** Verify webhook URL is exactly: `https://carbonconstruct.com.au/api/stripe-webhook` (no trailing slash)

### Issue: OAuth redirect fails
**Fix:** Double-check redirect URLs in Supabase match exactly (including https://)

### Issue: "Invalid API key" in console
**Fix:** Verify you updated auth-supabase.js with correct Supabase URL and key

### Issue: Database query returns empty
**Fix:** Check RLS policies are enabled. Run in SQL Editor:
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```
All tables should show `t` (true) for rowsecurity.

### Issue: User can't access dashboard after login
**Fix:** Check browser console (F12) for errors. Verify user is authenticated:
```javascript
// In browser console:
const { data } = await supabase.auth.getUser();
console.log(data);
```

---

## 📞 Need Help?

**Check These Resources:**
1. `DEPLOYMENT_CHECKLIST.md` - Detailed step-by-step guide
2. `PRODUCTION_INTEGRATION.md` - Full integration documentation
3. `INTEGRATION_COMPLETE.md` - Complete feature overview
4. `SUPABASE_SCHEMA.sql` - Database reference

**Check Logs:**
- Vercel: Dashboard → Deployments → Function Logs
- Supabase: Dashboard → Logs
- Stripe: Dashboard → Developers → Webhooks → Endpoint logs
- Browser: F12 → Console tab

**Verify Environment:**
- Supabase keys correct in auth-supabase.js
- Stripe webhook secret in Vercel env vars
- All 8 database tables exist
- OAuth redirect URLs configured

---

## 🎉 Success Checklist

After completing all steps, you should have:

- [x] 8 database tables created in Supabase
- [x] auth-supabase.js updated with credentials
- [x] All files pushed to GitHub
- [x] Vercel deployed successfully
- [x] Stripe webhook configured and tested
- [x] Supabase redirect URLs configured
- [x] Navigation links updated
- [x] Test account created and working
- [x] Dashboard loads correctly
- [x] Subscription page shows plans
- [x] Settings page updates profile

**All checked?** Congratulations! Your production SaaS is live! 🎊

---

## 📈 Next Steps

Now that you're live, consider:

1. **Launch Announcement**
   - Update homepage with live sign-up CTA
   - Announce on social media
   - Email existing contacts

2. **Monitor Performance**
   - Set up error tracking (Sentry, LogRocket)
   - Add analytics (Google Analytics, Plausible)
   - Monitor Vercel and Supabase dashboards

3. **Build Calculator**
   - Integrate with 54,343+ materials database
   - Save calculations to projects table
   - Generate NCC compliance reports

4. **Collect Feedback**
   - Add feedback form
   - Monitor support emails
   - Track user behavior

5. **Optimize Conversion**
   - A/B test pricing
   - Improve onboarding flow
   - Add testimonials and case studies

---

**🚀 You're Live! Welcome to production!**

Your NCC-compliant embodied carbon calculator is ready to help Australian construction professionals reduce their environmental impact! 🌏♻️
