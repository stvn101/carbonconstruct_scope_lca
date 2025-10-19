# CarbonConstruct Production Deployment Checklist

## 🚀 Pre-Deployment (Do First)

### 1. Database Setup
- [ ] Open Supabase Dashboard → SQL Editor
- [ ] Copy entire contents of `SUPABASE_SCHEMA.sql`
- [ ] Paste and click "Run"
- [ ] Verify 8 tables created: Run `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';`
- [ ] Confirm material count: `SELECT COUNT(*) FROM unified_materials;` (should show 54,343+)

### 2. Update Authentication Code
- [ ] Open `auth-supabase.js`
- [ ] Line 6: Replace `YOUR_SUPABASE_URL` with: `https://your-project.supabase.co`
- [ ] Line 7: Replace `YOUR_SUPABASE_ANON_KEY` with: `eyJhbG...` (your actual anon key)
- [ ] Save file

### 3. Verify Vercel Environment Variables
Go to Vercel Dashboard → Settings → Environment Variables. Confirm these exist:

- [ ] `SUPABASE_URL` = https://your-project.supabase.co
- [ ] `SUPABASE_ANON_KEY` = eyJhbG... (public anon key)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` = eyJhbG... (admin key, for webhooks)
- [ ] `STRIPE_PUBLIC_KEY` = pk_live_51RKejrP7JT8gu0WngS6oEMcUaQdgGb5XaYcEy5e2kq6Dx75lgaizFV1Fk2lmpgE7nGav6F0fDlMhSYcgecftwpu800mMRyCFJz
- [ ] `STRIPE_SECRET_KEY` = rk_live_... (your restricted key)
- [ ] `STRIPE_WEBHOOK_SECRET` = whsec_... (will get after deploying webhook)

---

## 📤 Deployment

### 4. Push to GitHub
```bash
cd /path/to/carbonconstruct

# Add all new files
git add .

# Commit
git commit -m "Add production authentication and subscription management

- Real Supabase Auth (email, Google, GitHub OAuth)
- User dashboard with projects and stats
- Subscription management page
- Stripe webhook handler
- Settings page (profile, notifications, security)
- Complete database schema with RLS
- Production integration documentation"

# Push to main
git push origin main
```

### 5. Verify Vercel Deployment
- [ ] Go to Vercel Dashboard
- [ ] Check latest deployment status
- [ ] Wait for "Ready" status
- [ ] Click "Visit" to open site
- [ ] Confirm no build errors in logs

### 6. Install NPM Dependencies (if needed)
If Vercel didn't auto-install dependencies:
```bash
npm install
```

---

## 🔧 Post-Deployment Configuration

### 7. Configure Supabase Auth URLs
Go to Supabase Dashboard → Authentication → URL Configuration:

**Site URL:**
- [ ] Set to: `https://carbonconstruct.com.au`

**Redirect URLs (click "Add URL" for each):**
- [ ] `https://carbonconstruct.com.au/auth/callback.html`
- [ ] `https://carbonconstruct.com.au/dashboard.html`
- [ ] `http://localhost:3000/auth/callback.html` (for local testing)

**Additional Settings:**
- [ ] Confirm email enabled: Settings → Auth → Email
- [ ] Confirm Google OAuth enabled: Settings → Auth → Google
- [ ] Confirm GitHub OAuth enabled: Settings → Auth → GitHub

### 8. Set Up Stripe Webhook
Go to Stripe Dashboard → Developers → Webhooks:

- [ ] Click "Add endpoint"
- [ ] **Endpoint URL:** `https://carbonconstruct.com.au/api/stripe-webhook`
- [ ] **Description:** "CarbonConstruct subscription sync"
- [ ] **Events to send:** Select these 7 events:
  - [ ] `customer.subscription.created`
  - [ ] `customer.subscription.updated`
  - [ ] `customer.subscription.deleted`
  - [ ] `customer.subscription.trial_will_end`
  - [ ] `invoice.paid`
  - [ ] `invoice.payment_failed`
  - [ ] `checkout.session.completed`
- [ ] Click "Add endpoint"
- [ ] **Copy webhook signing secret** (starts with `whsec_`)
- [ ] Go to Vercel → Settings → Environment Variables
- [ ] Add: `STRIPE_WEBHOOK_SECRET` = `whsec_...` (paste the secret)
- [ ] Redeploy Vercel (trigger new deployment to load new env var)

### 9. Update Navigation Links
Edit `index.html` (and any other pages with auth links):

**Find and replace:**
```html
<!-- OLD -->
<a href="signin.html">Sign In</a>
<a href="signup.html">Sign Up</a>

<!-- NEW -->
<a href="signin-new.html">Sign In</a>
<a href="signup-new.html">Sign Up</a>
```

Commit and push:
```bash
git add index.html
git commit -m "Update navigation to use new auth pages"
git push origin main
```

---

## ✅ Testing

### 10. Test Email Authentication
- [ ] Visit: `https://carbonconstruct.com.au/signup-new.html`
- [ ] Create account with email + password
- [ ] Check email inbox for confirmation link
- [ ] Click confirmation link
- [ ] Verify redirected to dashboard
- [ ] Check Supabase: Dashboard → Authentication → Users (new user appears)
- [ ] Check database: `SELECT * FROM user_profiles;` (profile created)

### 11. Test Google OAuth
- [ ] Visit: `https://carbonconstruct.com.au/signin-new.html`
- [ ] Click "Continue with Google"
- [ ] Authorize with your Google account
- [ ] Verify redirected to dashboard
- [ ] Check Settings → Account (shows Google connected)

### 12. Test GitHub OAuth
- [ ] Visit: `https://carbonconstruct.com.au/signin-new.html`
- [ ] Click "Continue with GitHub"
- [ ] Authorize with your GitHub account
- [ ] Verify redirected to dashboard
- [ ] Check Settings → Account (shows GitHub connected)

### 13. Test Dashboard
- [ ] Dashboard loads without errors (check browser console)
- [ ] Subscription banner shows "No Active Subscription"
- [ ] Stats show 0 projects, 0 materials, etc.
- [ ] "Recent Projects" shows empty state
- [ ] "Recent Activity" shows empty state or placeholder
- [ ] Navigation works (Dashboard, Calculator, Subscription, Settings)

### 14. Test Subscription Page
- [ ] Visit: `https://carbonconstruct.com.au/subscription.html`
- [ ] Current plan shows "Inactive" or "No Active Subscription"
- [ ] All 3 plans display (Starter, Professional, Enterprise)
- [ ] "Select Plan" buttons work (redirect to checkout)
- [ ] Billing history shows empty state

### 15. Test Stripe Checkout + Webhook
**Use Stripe test mode first!**

- [ ] Visit: `https://carbonconstruct.com.au/checkout.html?plan=professional`
- [ ] Fill out form
- [ ] Use test card: `4242 4242 4242 4242`, any future expiry, any CVC
- [ ] Complete checkout
- [ ] Verify redirected to success page
- [ ] **Check Stripe Dashboard** → Payments (payment appears)
- [ ] **Check Stripe Dashboard** → Webhooks → Your endpoint (event delivered)
- [ ] **Check Supabase** → Table Editor → subscriptions (new row created)
- [ ] **Check Supabase** → Table Editor → invoices (invoice recorded)
- [ ] **Refresh dashboard** → Subscription banner shows "Professional Plan Active"

### 16. Test Settings Page
- [ ] Visit: `https://carbonconstruct.com.au/settings.html`
- [ ] **Profile Tab:**
  - [ ] Update full name, company, phone, bio
  - [ ] Click "Save Changes"
  - [ ] Verify "Profile updated successfully" message
  - [ ] Refresh page - changes persist
- [ ] **Account Tab:**
  - [ ] Verify connected OAuth providers show "Connected"
- [ ] **Notifications Tab:**
  - [ ] Toggle email notification switches
  - [ ] Click "Save Preferences"
  - [ ] Verify saved successfully
- [ ] **Security Tab:**
  - [ ] Change password (enter new password twice)
  - [ ] Click "Change Password"
  - [ ] Verify success message
  - [ ] Logout and login with new password

### 17. Test Logout
- [ ] Click "Logout" in navigation
- [ ] Confirm logout prompt
- [ ] Verify redirected to homepage
- [ ] Try visiting `dashboard.html` directly - should redirect to signin

---

## 🐛 Troubleshooting

### Issue: "Invalid API key" error in console
**Fix:**
1. Check `auth-supabase.js` has correct Supabase URL and anon key
2. Redeploy: `git commit --allow-empty -m "Trigger redeploy" && git push`

### Issue: Webhook not receiving events
**Fix:**
1. Verify webhook URL in Stripe: `https://carbonconstruct.com.au/api/stripe-webhook`
2. Check webhook secret in Vercel env vars: `STRIPE_WEBHOOK_SECRET`
3. Check Stripe logs: Dashboard → Developers → Webhooks → Your endpoint → Recent deliveries
4. Check Vercel logs: Dashboard → Deployments → Latest → Function Logs
5. Check webhook_errors table: `SELECT * FROM webhook_errors ORDER BY created_at DESC;`

### Issue: OAuth redirect fails
**Fix:**
1. Verify callback URL in Supabase: `https://carbonconstruct.com.au/auth/callback.html`
2. Check file deployed: Visit `https://carbonconstruct.com.au/auth/callback.html` (should show loading screen)
3. Check browser console for errors during OAuth flow

### Issue: Database queries return empty/error
**Fix:**
1. Check RLS policies enabled: Supabase → Table Editor → Select table → "RLS enabled" should be green
2. Verify user authenticated: `SELECT auth.uid();` in SQL editor (should return UUID when logged in)
3. Check table permissions: Supabase → Authentication → Policies

### Issue: Materials database not accessible
**Fix:**
1. Verify table exists: `SELECT COUNT(*) FROM unified_materials;`
2. Add RLS policy if needed:
   ```sql
   CREATE POLICY "Anyone can read materials" ON unified_materials
       FOR SELECT USING (true);
   ```

---

## 🎯 Production Readiness Checklist

### Security
- [ ] All Supabase tables have Row Level Security (RLS) enabled
- [ ] Webhook signature verification working
- [ ] Environment variables secured (not in Git)
- [ ] HTTPS enforced (Vercel does this automatically)
- [ ] Email confirmation required for new signups
- [ ] Password strength requirements enforced

### Performance
- [ ] Database indexes created (from SUPABASE_SCHEMA.sql)
- [ ] Dashboard loads in < 1 second
- [ ] Auth pages load in < 500ms
- [ ] Webhook processes in < 200ms

### Monitoring
- [ ] Stripe webhooks delivering successfully (check logs)
- [ ] Vercel functions executing (check deployment logs)
- [ ] Supabase queries successful (check logs)
- [ ] No JavaScript errors in browser console

### User Experience
- [ ] All forms validate correctly
- [ ] Error messages are clear and helpful
- [ ] Loading states show for async operations
- [ ] Success messages confirm actions
- [ ] Navigation works on mobile (test responsive)

### Business
- [ ] Subscription plans correctly priced
- [ ] Checkout flow completes successfully
- [ ] Invoices generated and stored
- [ ] Users can cancel subscriptions
- [ ] Billing history accessible

---

## 🎉 Launch Checklist

### Before Announcing Launch
- [ ] All tests pass
- [ ] No errors in logs (Vercel, Supabase, Stripe)
- [ ] Demo account tested end-to-end
- [ ] Privacy policy updated
- [ ] Terms of service mention subscriptions
- [ ] Support email set up
- [ ] Monitoring alerts configured

### Launch Day
- [ ] Make announcement
- [ ] Monitor sign-ups in real-time
- [ ] Watch for errors in logs
- [ ] Respond to support requests promptly
- [ ] Track conversion funnel (signups → paid)

### Post-Launch (Week 1)
- [ ] Review analytics
- [ ] Fix any reported bugs
- [ ] Optimize conversion bottlenecks
- [ ] Collect user feedback
- [ ] Plan next features

---

## 📊 Success Metrics to Track

### Daily
- [ ] New signups (auth.users count)
- [ ] Active subscriptions (subscriptions.status = 'active')
- [ ] Daily revenue (sum of invoice.amount)
- [ ] Errors (webhook_errors, Vercel logs)

### Weekly
- [ ] Conversion rate (signups → paid)
- [ ] Churn rate (canceled subscriptions)
- [ ] Average revenue per user (ARPU)
- [ ] Support tickets

### Monthly
- [ ] Monthly recurring revenue (MRR)
- [ ] Customer lifetime value (LTV)
- [ ] User engagement (projects created)
- [ ] Feature usage (materials searched)

---

## 📞 Quick Reference

**Supabase Dashboard:** https://app.supabase.com
**Stripe Dashboard:** https://dashboard.stripe.com
**Vercel Dashboard:** https://vercel.com/dashboard
**GitHub Repo:** https://github.com/stvn101/carbonconstruct_scope_lca

**Your Site:** https://carbonconstruct.com.au

**Key URLs:**
- Sign In: `/signin-new.html`
- Sign Up: `/signup-new.html`
- Dashboard: `/dashboard.html`
- Subscription: `/subscription.html`
- Settings: `/settings.html`
- Webhook: `/api/stripe-webhook`

---

## ✅ Final Check

When everything above is complete:
- [ ] Site loads correctly: https://carbonconstruct.com.au
- [ ] Sign-up works (email, Google, GitHub)
- [ ] Dashboard shows user data
- [ ] Subscription page displays plans
- [ ] Checkout completes and syncs via webhook
- [ ] Settings page updates profile
- [ ] No errors in any logs
- [ ] Mobile responsive works

**🎊 You're live! Welcome to production!**
