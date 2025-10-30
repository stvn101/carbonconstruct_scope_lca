# HTTP Redirect Loop Fix Guide

## Problem
"Too many HTTP redirects" error when accessing carbonconstruct.com.au

## Root Causes Identified
1. **CNAME Configuration** - CNAME file pointing to carbonconstruct.com.au
2. **Missing Vercel Configuration** - No redirect handling in vercel.json
3. **WWW vs Non-WWW** - Potential DNS loop between www and non-www versions

## Solutions Implemented

### 1. Updated vercel.json
Added proper configuration:
- `cleanUrls: true` - Removes .html extensions
- `trailingSlash: false` - Consistent URL handling
- Proper redirect rules
- Enhanced security headers
- Cache control for static assets

### 2. Created _redirects File
Netlify/Vercel style redirects to prevent loops:
- Handles trailing slashes
- Fallback routing for SPA behavior
- Prevents duplicate routes

### 3. Added .vercelignore
Excludes unnecessary files from deployment:
- Development scripts
- Test files
- Debug files

### 4. Created 404.html
Custom error page with proper branding and navigation back to home.

### 5. Created robots.txt
SEO optimization and crawler management.

## Deployment Steps

### If Using Vercel:

1. **Remove CNAME file** (Vercel handles domains differently):
   ```bash
   rm CNAME
   ```

   > **Note:** If you are migrating from GitHub Pages and previously used a custom domain (with a `CNAME` file), you should also disable GitHub Pages in your repository settings (Settings → Pages → Set "Source" to "None"). This prevents conflicts and ensures your domain is only served by Vercel.
2. **Configure Domain in Vercel Dashboard**:
   - Go to Project Settings → Domains
   - Add: carbonconstruct.com.au
   - Add: www.carbonconstruct.com.au (optional)
   - Vercel will provide DNS instructions

3. **DNS Configuration at Your Registrar**:
   ```
   Type: CNAME
   Name: @ (or root)
   Value: cname.vercel-dns.com

   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

4. **Redeploy**:
   ```bash
   git push origin main
   ```

### If Using GitHub Pages:

1. **Keep CNAME file** as is

2. **Check Repository Settings**:
   - Go to Settings → Pages
   - Ensure "Enforce HTTPS" is checked
   - Custom domain should be: carbonconstruct.com.au

3. **DNS Configuration**:
   ```
   Type: A
   Name: @
   Value: 185.199.108.153
   Value: 185.199.109.153
   Value: 185.199.110.153
   Value: 185.199.111.153

   Type: CNAME
   Name: www
   Value: stvn101.github.io
   ```

## Testing the Fix

After deployment, test these URLs:
1. http://carbonconstruct.com.au
2. https://carbonconstruct.com.au
3. http://www.carbonconstruct.com.au
4. https://www.carbonconstruct.com.au

All should redirect to: **https://carbonconstruct.com.au**

## Verification Commands

```bash
# Check DNS
dig carbonconstruct.com.au
dig www.carbonconstruct.com.au

# Check redirects (should show 301/302, not redirect loop)
curl -I http://carbonconstruct.com.au
curl -I https://carbonconstruct.com.au

# Check for redirect loops
curl -L http://carbonconstruct.com.au | head -50
```

## Common Issues & Solutions

### Issue 1: Still Getting Redirect Loop
**Solution**: Clear browser cache and cookies
```bash
# Chrome
Settings → Privacy → Clear browsing data → Cached images and files

# Or use Incognito mode
```

### Issue 2: DNS Not Propagating
**Solution**: Wait 24-48 hours for DNS propagation
```bash
# Check DNS propagation
https://www.whatsmydns.net/#CNAME/carbonconstruct.com.au
```

### Issue 3: Mixed Content Warnings
**Solution**: Ensure all resources use HTTPS
- Check for http:// links in HTML
- Update to https:// or use protocol-relative URLs (//)

## Quick Fix (Temporary)

If you need immediate access:
1. Access via the direct Vercel URL: `https://[your-project].vercel.app`
2. Or GitHub Pages URL: `https://stvn101.github.io/carbonconstruct_scope_lca/`

## Contact & Support

If issues persist:
1. Check Vercel deployment logs
2. Verify DNS records at registrar
3. Test with different browsers/devices
4. Check browser console for JavaScript errors

## Files Modified
- vercel.json (updated with cleanUrls and redirects)
- _redirects (new)
- .vercelignore (new)
- 404.html (new)
- robots.txt (new)
- REDIRECT_FIX.md (this file)
