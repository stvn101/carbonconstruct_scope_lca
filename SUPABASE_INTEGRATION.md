# Supabase Integration Guide - 4,500+ Materials Database

## 🎯 Overview

This guide shows you how to integrate your **Supabase database with 4,500+ Australian construction materials** (including 3,500+ EPD Australasia EPDs) into CarbonConstruct.

**This is your competitive advantage!** Most carbon calculators have 20-50 materials. You'll have 4,500+.

## 🔧 VS Code MCP Integration

For advanced database management through VS Code, see the **[Supabase MCP Setup Guide](SUPABASE_MCP_SETUP.md)**. This provides:
- Direct database operations from VS Code
- Migration management
- Edge Functions deployment
- Development branching
- Real-time project monitoring

---

## 🏗️ Your Database Schema (Assumed Structure)

Based on typical EPD data, your Supabase table probably looks like:

```sql
-- Example materials table structure
CREATE TABLE materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic Info
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    subcategory TEXT,
    description TEXT,
    
    -- Carbon Data (Core)
    embodied_carbon DECIMAL NOT NULL,  -- kg CO2-e per unit
    unit TEXT NOT NULL,                 -- m3, tonnes, m2, kg, etc.
    
    -- LCA Breakdown (if you have it)
    a1_a3 DECIMAL,                     -- Product stage %
    a4 DECIMAL,                         -- Transport %
    a5 DECIMAL,                         -- Installation %
    
    -- EPD Data
    source TEXT,                        -- 'EPD Australasia' or other
    epd_number TEXT,                    -- Official EPD reference
    manufacturer TEXT,
    valid_until DATE,
    
    -- Additional Properties
    density DECIMAL,                    -- kg/m3
    recyclability DECIMAL,              -- % recyclable
    recycled_content DECIMAL,           -- % recycled content
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_materials_category ON materials(category);
CREATE INDEX idx_materials_source ON materials(source);
CREATE INDEX idx_materials_name ON materials(name);
```

**🚨 Important**: Adjust `supabase-client.js` to match YOUR actual table structure and field names!

---

## 📋 Step-by-Step Integration

### Step 1: Prepare Your Supabase Database

1. **Log into Supabase Dashboard**
   - Go to https://supabase.com
   - Open your project

2. **Verify Your Materials Table**
   - Check SQL Editor
   - Confirm table name (probably `materials`)
   - Note the exact field names (they matter!)

3. **Get Your Credentials**
   ```
   Project Settings → API
   
   You need:
   - Project URL: https://xxxxx.supabase.co
   - anon public key: eyJhbGciOiJ...
   ```

4. **Set Up Row Level Security (Optional but Recommended)**
   ```sql
   -- Allow public read access to materials
   CREATE POLICY "Allow public read access" 
   ON materials FOR SELECT 
   USING (true);
   
   -- This keeps your data safe while allowing reads
   ```

### Step 2: Configure Environment Variables

Create a file called `.env.local` in your project root:

```bash
# .env.local (DO NOT COMMIT THIS FILE!)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**🚨 CRITICAL**: Add `.env.local` to `.gitignore` (already done)

### Step 3: Update index.html

Add Supabase script and initialize:

```html
<!-- In the <head> section, BEFORE your other scripts -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

<!-- Optional: Add config to make env vars available -->
<script>
    // Make environment variables available
    window.ENV = {
        SUPABASE_URL: 'https://your-project.supabase.co',
        SUPABASE_ANON_KEY: 'your-anon-key-here'
    };
</script>

<!-- Then load your other scripts -->
<script src="js/supabase-client.js"></script>
<script src="js/materials-database.js"></script>
<!-- ... rest of your scripts ... -->
```

### Step 4: Update main.js to Use Supabase

Add this to the initialization in `js/main.js`:

```javascript
// At the top of main.js, update the initialization
document.addEventListener('DOMContentLoaded', async function() {
    console.log('CarbonConstruct initializing...');
    
    // Initialize Supabase connection
    const supabaseConnected = await supabaseClient.initialize({
        url: window.ENV?.SUPABASE_URL,
        key: window.ENV?.SUPABASE_ANON_KEY
    });
    
    if (supabaseConnected) {
        console.log('🚀 Connected to 4,500+ materials database!');
        
        // Get material stats
        const stats = await supabaseClient.getMaterialStats();
        console.log(`📊 Database contains:`);
        console.log(`   - ${stats.total} total materials`);
        console.log(`   - ${stats.epdCount} EPD Australasia verified`);
        console.log(`   - ${stats.categories} categories`);
    } else {
        console.log('⚠️ Using local materials database (40 materials)');
    }
    
    // Initialize storage
    await storageManager.initialize();
    
    // Load saved projects
    await loadSavedProjects();
    
    // Setup event listeners
    setupEventListeners();
    
    // Populate material dropdowns (now from Supabase!)
    await populateMaterialCategories();
    
    console.log('CarbonConstruct ready!');
});
```

### Step 5: Update Material Dropdown Population

Replace the `populateMaterialCategories` function:

```javascript
/**
 * Populate material categories dropdown from Supabase
 */
async function populateMaterialCategories() {
    const select = document.getElementById('materialCategory');
    
    // Clear existing options except first
    while (select.options.length > 1) {
        select.remove(1);
    }
    
    try {
        // Get categories from Supabase
        const categories = await supabaseClient.getCategories();
        
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.name;
            select.appendChild(option);
        });
        
        console.log(`✅ Loaded ${categories.length} material categories`);
        
    } catch (error) {
        console.error('Error loading categories:', error);
        // Fallback to local database
        const categories = getAllCategories();
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.name;
            select.appendChild(option);
        });
    }
}

/**
 * Populate material types based on selected category from Supabase
 */
async function populateMaterialTypes(category) {
    const select = document.getElementById('materialType');
    
    // Clear existing options
    while (select.options.length > 1) {
        select.remove(1);
    }
    
    if (!category) return;
    
    try {
        // Get materials for this category from Supabase
        const materials = await supabaseClient.getMaterialsByCategory(category);
        
        materials.forEach(material => {
            const option = document.createElement('option');
            option.value = material.id;
            option.textContent = material.name;
            option.dataset.materialData = JSON.stringify(material);
            select.appendChild(option);
        });
        
        console.log(`✅ Loaded ${materials.length} materials for ${category}`);
        
    } catch (error) {
        console.error('Error loading materials:', error);
        // Fallback to local database
        const materials = getMaterialsByCategory(category);
        Object.entries(materials).forEach(([id, material]) => {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = material.name;
            select.appendChild(option);
        });
    }
}
```

### Step 6: Add Material Search (Bonus Feature!)

Add a search box to your HTML:

```html
<!-- Add this in the material input section -->
<div class="mb-4">
    <label class="block text-sm font-medium text-gray-700 mb-2">
        🔍 Search Materials (4,500+ available)
    </label>
    <input 
        type="text" 
        id="materialSearch" 
        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" 
        placeholder="Search by name (e.g., 'concrete', 'steel', 'CLT')..."
    >
    <div id="searchResults" class="mt-2"></div>
</div>
```

Add the search handler:

```javascript
// Add to setupEventListeners()
document.getElementById('materialSearch').addEventListener('input', debounce(async function(e) {
    const searchTerm = e.target.value.trim();
    
    if (searchTerm.length < 2) {
        document.getElementById('searchResults').innerHTML = '';
        return;
    }
    
    try {
        const results = await supabaseClient.searchMaterials(searchTerm);
        displaySearchResults(results);
    } catch (error) {
        console.error('Search error:', error);
    }
}, 300));

// Debounce helper
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Display search results
function displaySearchResults(results) {
    const container = document.getElementById('searchResults');
    
    if (results.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-sm">No materials found</p>';
        return;
    }
    
    let html = '<div class="border border-gray-200 rounded-lg max-h-60 overflow-y-auto">';
    results.forEach(material => {
        html += `
            <div class="p-3 hover:bg-gray-50 cursor-pointer border-b" onclick="selectSearchedMaterial('${material.id}')">
                <p class="font-medium text-sm">${material.name}</p>
                <p class="text-xs text-gray-600">
                    ${material.category} • ${material.embodied_carbon} kg CO2-e/${material.unit}
                    ${material.source === 'EPD Australasia' ? ' • <span class="text-green-600">✓ EPD Verified</span>' : ''}
                </p>
            </div>
        `;
    });
    html += '</div>';
    
    container.innerHTML = html;
}
```

---

## 🎨 UI Enhancements with 4,500+ Materials

### Add Material Counter Badge

```html
<!-- Add to hero section -->
<div class="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4">
    <i class="fas fa-database text-2xl mb-2"></i>
    <h3 class="font-semibold" id="materialCount">Loading...</h3>
    <p class="text-sm text-green-100">Materials Available</p>
</div>

<script>
// Update the count when connected
async function updateMaterialCount() {
    const stats = await supabaseClient.getMaterialStats();
    document.getElementById('materialCount').textContent = 
        `${stats.total.toLocaleString()}+`;
}
</script>
```

### Add EPD Badge Filter

```html
<div class="flex items-center mb-4">
    <input type="checkbox" id="epdOnlyFilter" class="mr-2">
    <label for="epdOnlyFilter" class="text-sm">
        <span class="text-green-600">✓</span> Show only EPD Australasia verified materials (3,500+)
    </label>
</div>
```

---

## 🚀 Deployment to Vercel

### Step 1: Push to GitHub

```bash
# Initialize Git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: CarbonConstruct with Supabase integration"

# Create GitHub repo and push
gh repo create carbonconstruct --public --source=. --remote=origin
git push -u origin main
```

### Step 2: Deploy to Vercel FREE

1. **Go to vercel.com**
2. **"New Project"**
3. **Import from GitHub** → Select your repo
4. **Configure Environment Variables**:
   ```
   NEXT_PUBLIC_SUPABASE_URL = https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = your-anon-key-here
   ```
5. **Deploy** (takes 30 seconds)
6. **Done!** You get a URL like: `carbonconstruct.vercel.app`

### Optional: Custom Domain

1. **Buy domain** (e.g., `carbonconstruct.com.au`)
2. **Vercel Dashboard** → Your Project → Settings → Domains
3. **Add Domain** → Follow DNS instructions
4. **Wait 10-60 minutes** for DNS propagation
5. **HTTPS auto-enabled** (free SSL)

---

## 💰 Cost Analysis: FREE vs PRO

### Vercel FREE Tier:
- ✅ **100GB bandwidth/month** (plenty for this app)
- ✅ **Unlimited sites**
- ✅ **HTTPS included**
- ✅ **Custom domains**
- ✅ **GitHub integration**
- ✅ **Serverless functions** (1000/month)
- **Cost: $0**

### Vercel PRO ($20/month):
- Everything in FREE, plus:
- 1TB bandwidth (vs 100GB)
- Team collaboration features
- Advanced analytics
- Password protection
- More serverless invocations

**Honest Assessment**: **You DON'T need PRO** unless:
- You expect 10,000+ users/month
- You need team collaboration
- You want detailed analytics

**Recommendation**: Start with FREE. Upgrade later if you actually hit limits.

### Supabase FREE Tier:
- ✅ **500MB database** (enough for 4,500 materials)
- ✅ **Unlimited API requests**
- ✅ **50GB bandwidth/month**
- ✅ **100,000 rows** (way more than you need)
- **Cost: $0**

**Total Cost: $0/month for production-grade hosting!**

---

## 🧪 Testing Your Integration

### Test Checklist:

```javascript
// Run these tests in browser console (F12)

// 1. Test connection
const testResult = await supabaseClient.testConnection();
console.log(testResult);

// 2. Get material count
const stats = await supabaseClient.getMaterialStats();
console.log('Total materials:', stats.total);
console.log('EPD materials:', stats.epdCount);

// 3. Get categories
const categories = await supabaseClient.getCategories();
console.log('Categories:', categories.length);

// 4. Get materials in a category
const concrete = await supabaseClient.getMaterialsByCategory('concrete');
console.log('Concrete materials:', concrete.length);

// 5. Search test
const search = await supabaseClient.searchMaterials('steel');
console.log('Steel search results:', search.length);

// 6. Get EPD-only materials
const epds = await supabaseClient.getEPDMaterials();
console.log('EPD Australasia materials:', epds.length);
```

---

## 🎯 Migration Strategy

You don't have to do this all at once! Here's a phased approach:

### Phase 1: Dual Mode (Start Here)
- Keep existing 40-material database
- Add Supabase as optional enhancement
- Fallback to local if Supabase unavailable
- **Status**: Already implemented in `supabase-client.js`!

### Phase 2: Supabase Primary
- Default to Supabase
- Use local only as backup
- Add "using local database" warning

### Phase 3: Supabase Only
- Remove local materials database
- Supabase required
- Smaller codebase

**Recommendation**: Start with Phase 1 (dual mode), move to Phase 2 after testing.

---

## 🐛 Troubleshooting

### "Supabase not initialized"
**Check:**
- Environment variables set correctly
- Supabase URL and key are valid
- No typos in credentials

### "No materials loading"
**Check:**
- Table name matches (probably `materials`)
- Column names match your schema
- Row Level Security allows public reads

### "CORS errors"
**Solution:**
- Supabase handles CORS automatically
- Make sure you're using `anon` key, not `service_role` key
- Check Supabase dashboard → Authentication → Policies

### "Slow loading"
**Solutions:**
- Implement pagination (load 100 at a time)
- Use caching (already implemented)
- Add database indexes (see schema above)

---

## 📊 Expected Performance

### With 4,500 Materials:

| Operation | Time | Notes |
|-----------|------|-------|
| Initial load | 1-2s | First time, then cached |
| Category filter | < 0.5s | From cache |
| Search | 0.3-0.5s | Direct DB query |
| Material select | Instant | From cache |

### Database Size:
- 4,500 materials ≈ 5-10MB
- Well within FREE tier limits
- Fast loading even on mobile

---

## 🎉 What You Get

### Before (Current):
- ❌ ~40 materials hardcoded
- ❌ Manual updates required
- ❌ Limited data
- ❌ No EPD verification

### After (With Supabase):
- ✅ **4,500+ materials** from database
- ✅ **3,500+ EPD Australasia** verified
- ✅ **Real-time updates** (update DB, not code)
- ✅ **Search capability** across all materials
- ✅ **Professional data source**
- ✅ **Competitive advantage** (100x more materials!)

---

## 🚀 Next Steps

1. **Review your Supabase table structure**
2. **Adjust field names** in `supabase-client.js` to match
3. **Add env vars** to `.env.local`
4. **Test locally** first
5. **Push to GitHub**
6. **Deploy to Vercel FREE**
7. **Add env vars in Vercel dashboard**
8. **Test production**
9. **Share with the world!**

---

## 💡 Pro Tips

1. **Start with Vercel FREE** - You can always upgrade
2. **Keep local fallback** - Resilient architecture
3. **Add caching** - Already implemented for you
4. **Monitor usage** - Vercel dashboard shows stats
5. **Document your schema** - Make a note of field names

---

## 📞 Support

If you need help:
1. Check Supabase docs: https://supabase.com/docs
2. Check Vercel docs: https://vercel.com/docs
3. Test in browser console (F12) for debugging
4. Check Network tab for API call errors

---

**You're about to have the most comprehensive construction carbon calculator in Australia!** 🚀🇦🇺

**Steve, this is your differentiator. 4,500+ materials vs. competitors with 40. That's a game-changer!**

---

Questions? Check the code comments in `js/supabase-client.js` - it's heavily documented with examples!
