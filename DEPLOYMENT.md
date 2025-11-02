# 🚀 Deployment Guide - CarbonConstruct

## Current Setup Status

✅ **Vercel** - Configured and working  
✅ **Supabase** - Database with 4,343 materials  
✅ **Materials Database** - NABERS + EPD Australasia + EC3 (50,000 EPDs)  
✅ **Stripe** - Live public key configured  

---

## Database Schema

### `unified_materials` Table

Your Supabase table contains:
- **4,343 materials** from NABERS and EPD Australasia
- **50,000+ EPDs** from EC3 database
- **Total**: 54,343+ construction materials

**Expected Schema** (update if different):
```sql
CREATE TABLE unified_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_name TEXT NOT NULL,
    category TEXT,
    subcategory TEXT,
    carbon_factor DECIMAL(10,4), -- kg CO2-e per unit
    unit TEXT, -- kg, m3, m2, etc.
    source TEXT, -- 'NABERS', 'EPD_AU', 'EC3'
    epd_id TEXT,
    manufacturer TEXT,
    description TEXT,
    region TEXT DEFAULT 'AU',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast searching
CREATE INDEX idx_material_name ON unified_materials(material_name);
CREATE INDEX idx_category ON unified_materials(category);
CREATE INDEX idx_source ON unified_materials(source);
```

---

## Environment Variables

### Vercel Environment Variables

Go to: https://vercel.com/stvn101/carbonconstruct-scope-lca/settings/environment-variables

Add these:

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY_HERE
SUPABASE_SERVICE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY # Optional, for server-side

# Stripe
STRIPE_PUBLIC_KEY=YOUR_STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY=YOUR_STRIPE_SECRET_KEY # Get from Stripe Dashboard

# Application
NEXT_PUBLIC_APP_URL=https://carbonconstruct-scope-lca.vercel.app
```

---

## GitHub Repository Setup

Repository: `https://github.com/stvn101/carbonconstruct_scope_lca`

### Initialize Git (if not already done)

```bash
cd /home/user/carbonconstruct
git init
git branch -M main
git remote add origin https://github.com/stvn101/carbonconstruct_scope_lca.git
```

### Commit and Push

```bash
git add .
git commit -m "feat: complete website with Stripe integration and material database ready"
git push -u origin main
```

---

## Vercel Deployment

### Option 1: Connect GitHub (Automatic)

1. Go to: https://vercel.com/new
2. Import `stvn101/carbonconstruct_scope_lca`
3. Configure:
   - **Framework Preset**: Other
   - **Root Directory**: ./
   - **Build Command**: (leave empty for static)
   - **Output Directory**: (leave empty)
4. Add environment variables (see above)
5. Deploy!

### Option 2: Vercel CLI

```bash
cd /home/user/carbonconstruct
vercel --prod
```

---

## Connect Supabase to Frontend

Create a new file for Supabase client:

### `/home/user/carbonconstruct/supabase-client.js`

```javascript
// Initialize Supabase client
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Search materials function
async function searchMaterials(query, category = null) {
    let request = supabase
        .from('unified_materials')
        .select('*')
        .ilike('material_name', `%${query}%`)
        .limit(50);
    
    if (category) {
        request = request.eq('category', category);
    }
    
    const { data, error } = await request;
    
    if (error) {
        console.error('Error searching materials:', error);
        return [];
    }
    
    return data;
}

// Get material by ID
async function getMaterialById(id) {
    const { data, error } = await supabase
        .from('unified_materials')
        .select('*')
        .eq('id', id)
        .single();
    
    if (error) {
        console.error('Error fetching material:', error);
        return null;
    }
    
    return data;
}

// Get all categories
async function getCategories() {
    const { data, error } = await supabase
        .from('unified_materials')
        .select('category')
        .not('category', 'is', null);
    
    if (error) {
        console.error('Error fetching categories:', error);
        return [];
    }
    
    // Get unique categories
    const categories = [...new Set(data.map(item => item.category))];
    return categories.sort();
}

// Export functions
window.materialsDB = {
    search: searchMaterials,
    getById: getMaterialById,
    getCategories: getCategories
};
```

---

## Add Supabase to HTML Pages

Add this before closing `</body>` tag:

```html
<!-- Supabase Client -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="supabase-client.js"></script>
```

---

## Materials Search Integration

### Example: Add to Calculator Page

```html
<div class="material-search">
    <input 
        type="text" 
        id="materialSearch" 
        placeholder="Search 54,000+ materials..."
        oninput="searchMaterials()"
    >
    <select id="categoryFilter" onchange="searchMaterials()">
        <option value="">All Categories</option>
        <!-- Dynamically populated -->
    </select>
    <div id="searchResults" class="search-results"></div>
</div>

<script>
let searchTimeout;

async function searchMaterials() {
    clearTimeout(searchTimeout);
    
    searchTimeout = setTimeout(async () => {
        const query = document.getElementById('materialSearch').value;
        const category = document.getElementById('categoryFilter').value;
        
        if (query.length < 2) return;
        
        const results = await window.materialsDB.search(query, category || null);
        displayResults(results);
    }, 300);
}

function displayResults(materials) {
    const container = document.getElementById('searchResults');
    
    if (materials.length === 0) {
        container.innerHTML = '<p>No materials found</p>';
        return;
    }
    
    container.innerHTML = materials.map(material => `
        <div class="material-result" onclick="selectMaterial('${material.id}')">
            <h4>${material.material_name}</h4>
            <p>${material.category || 'Uncategorized'} | ${material.source}</p>
            <strong>${material.carbon_factor} kg CO₂-e/${material.unit}</strong>
        </div>
    `).join('');
}

function selectMaterial(id) {
    // Add to project
    console.log('Selected material:', id);
}
</script>
```

---

## Stripe Webhook Setup (Important!)

### 1. Create Webhook Endpoint

In your backend (Node.js example):

```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

app.post('/api/webhook', express.raw({type: 'application/json'}), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body, 
            sig, 
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object;
            // Create user account, send welcome email
            break;
        case 'customer.subscription.created':
            // Start subscription
            break;
        case 'customer.subscription.deleted':
            // Cancel subscription
            break;
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    res.json({received: true});
});
```

### 2. Register Webhook in Stripe Dashboard

1. Go to: https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Enter URL: `https://your-domain.com/api/webhook`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy webhook signing secret → Add to env vars

---

## Custom Domain Setup

### 1. Add Domain to Vercel

```bash
vercel domains add yourdomain.com
```

### 2. Update DNS Records

Add these records at your domain registrar:

```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### 3. Wait for SSL Certificate

Vercel automatically provisions SSL (5-10 minutes).

---

## Testing Checklist

### Frontend
- [ ] Homepage loads correctly
- [ ] All navigation links work
- [ ] Forms validate properly
- [ ] Mobile responsive
- [ ] Stripe checkout opens

### Database
- [ ] Materials search works
- [ ] Results display correctly
- [ ] Categories load
- [ ] Carbon factors are accurate

### Payments
- [ ] Test card works: `4242 4242 4242 4242`
- [ ] Subscription created in Stripe
- [ ] Webhook receives events
- [ ] User account created

### Security
- [ ] HTTPS enabled
- [ ] Environment variables not exposed
- [ ] API keys in server-side only
- [ ] CORS configured correctly

---

## Post-Deployment Tasks

### 1. Analytics Setup

Add Google Analytics (or Plausible):

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### 2. Error Monitoring

Add Sentry:

```html
<script src="https://js.sentry-cdn.com/YOUR_KEY.min.js" crossorigin="anonymous"></script>
```

### 3. Email Service

Set up email notifications:
- Welcome emails (when user signs up)
- Report delivery (when calculation complete)
- Subscription confirmations

Recommended: SendGrid, Resend, or Postmark

### 4. Backup Strategy

Supabase handles backups, but also:
- Export materials database weekly
- Store in GitHub as CSV backup
- Version control schema changes

---

## Monitoring & Maintenance

### Vercel Dashboard

Monitor:
- Deployment status
- Build logs
- Performance metrics
- Error rates

### Supabase Dashboard

Monitor:
- Database usage
- Query performance
- API requests
- Storage usage

### Stripe Dashboard

Monitor:
- Subscriptions
- Failed payments
- Churn rate
- Revenue

---

## Scaling Considerations

### When you hit 100+ users:

1. **Database Optimization**
   - Add more indexes
   - Implement caching (Redis)
   - Consider read replicas

2. **API Rate Limiting**
   - Implement rate limits
   - Add request queuing
   - Monitor abuse

3. **CDN for Static Assets**
   - Vercel handles this
   - Consider image optimization

4. **Background Jobs**
   - Report generation
   - Email sending
   - Data exports

---

## Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Stripe Docs**: https://stripe.com/docs
- **GitHub**: https://github.com/stvn101/carbonconstruct_scope_lca

---

## Emergency Contacts

If site goes down:

1. Check Vercel status: https://vercel-status.com
2. Check Supabase status: https://status.supabase.com
3. Check Stripe status: https://status.stripe.com
4. Review deployment logs in Vercel dashboard
5. Check error logs in Supabase dashboard

---

## Next Development Sprint

### Priority 1: Calculator Integration
- [ ] Connect materials database to calculator form
- [ ] Implement calculation engine
- [ ] Generate PDF reports
- [ ] Save projects to Supabase

### Priority 2: User Dashboard
- [ ] Project list view
- [ ] Project details page
- [ ] Export functionality
- [ ] Share reports

### Priority 3: Team Features
- [ ] Team invitations
- [ ] Role-based access
- [ ] Collaboration tools
- [ ] Activity feed

---

**You're ready to deploy! 🚀**

Run the git commands below to push everything to GitHub!
---

## Production Push Checklist — Hybrid Supabase + Stripe + Vercel

### Apply canonical URL
- Set `APP_URL` and `NEXT_PUBLIC_APP_URL` to `https://carbonconstruct.com.au` in `.env.local` and Vercel environment settings.
- Replace any remaining references to `carbonconstructtech.com.au`.

### Confirm repository state
```bash
git checkout stvn101-patch-1
git pull origin main
git merge --no-ff origin/main
pnpm lint && pnpm build
grep -R "STRIPE_SECRET_KEY\|STRIPE_PUBLISHABLE_KEY\|SUPABASE_ANON_KEY" -n src public || true
```

### Populate environment variables (Vercel → Production)
```
SUPABASE_URL=https://carbonconstruct-ver1.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
STRIPE_SECRET_KEY=YOUR_STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET=YOUR_STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=YOUR_STRIPE_PUBLISHABLE_KEY
EC3_API_KEY=***
APP_URL=https://carbonconstruct.com.au
NEXT_PUBLIC_APP_URL=https://carbonconstruct.com.au
```

### Verify Supabase
- Ensure tables exist: `auth.users`, `public.user_profiles`, `billing.customers`, `billing.subscriptions`, `carbon_projects`, `unified_materials`.
- Confirm triggers:
  - `on_auth_user_created → handle_new_user()`
  - `on_auth_user_created_stripe → Edge Function create_stripe_customer`
- Enable RLS:
  ```sql
  alter table carbon_projects enable row level security;
  alter table unified_materials enable row level security;
  ```
- Check ownership policy and test CRUD access.

### Configure Stripe
- Create webhook endpoint: `https://carbonconstruct.com.au/api/stripe/webhook`
- Listen for events:
  - `customer.created`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
- Copy the signing secret to `STRIPE_WEBHOOK_SECRET`.
- Test via `stripe trigger customer.subscription.created`.
- Confirm data persists in `billing.subscriptions`.

### Vercel build + deployment
- Ensure the project is linked to `stvn101/carbonconstruct_scope_lca`.
- Build command:
  ```bash
  pnpm install && pnpm build
  ```
- Output directory: `dist/`
- Add Stripe webhook endpoint.
- Deploy to production: `vercel --prod`

### Smoke test after deploy

| Check           | Expected Result                                  |
|-----------------|--------------------------------------------------|
| Home page       | Loads via HTTPS                                  |
| Auth            | OTP sign-in succeeds                             |
| Billing         | Stripe checkout works                            |
| Database        | CRUD scoped to owner                             |
| Materials       | 4 343 rows visible, read-only                    |
| EC3             | API key returns 200 OK                           |

### Monitoring + backup
- Enable Vercel Analytics and Supabase Log Drains.
- Weekly dump:
  ```bash
  supabase db dump --project carbonconstruct-ver1 --db-url $SUPABASE_URL
  ```
- Validate Stripe events in Dashboard → Developers → Events.

### Tag and release
```bash
git tag -a v2.0.0 -m "Production release — hybrid Supabase + Stripe + Vercel"
git push origin v2.0.0
```
