# EC3 OAuth Portal Setup Guide

This guide will help you configure the OAuth portal for connecting to Building Transparency's EC3 database.

## Overview

The OAuth portal allows your CarbonConstruct users to securely authenticate with EC3 and access the world's largest embodied carbon database (50,000+ EPDs) without exposing your API credentials.

## Prerequisites

1. ✅ You already have EC3 OAuth credentials:
   - Client ID
   - Client Secret
   - Redirect URI

2. ✅ Your site is deployed on Vercel or supports serverless functions

## Configuration Steps

### 1. Set Environment Variables

Add these environment variables to your Vercel project:

```bash
# In Vercel Dashboard > Settings > Environment Variables
EC3_CLIENT_SECRET=your_actual_client_secret_here
```

**Important:** Never commit the client secret to your repository!

### 2. Update OAuth Configuration

In `ec3-oauth.html`, replace the placeholder with your actual Client ID:

```javascript
const EC3_OAUTH_CONFIG = {
    clientId: 'your_actual_client_id_here', // ← Replace this
    redirectUri: window.location.origin + '/ec3-callback.html',
    scope: 'read',
    authUrl: 'https://buildingtransparency.org/api/oauth/authorize/',
    tokenUrl: 'https://buildingtransparency.org/api/oauth/token/'
};
```

In `ec3-callback.html`, update the same Client ID:

```javascript
const EC3_OAUTH_CONFIG = {
    clientId: 'your_actual_client_id_here', // ← Replace this
    redirectUri: window.location.origin + '/ec3-callback.html',
    tokenUrl: 'https://buildingtransparency.org/api/oauth/token/',
    apiBaseUrl: 'https://api.buildingtransparency.org/api'
};
```

### 3. Verify Redirect URI

Ensure your EC3 OAuth app is configured with the correct redirect URI:

```
https://yourdomain.com/ec3-callback.html
```

For development:

```
http://localhost:3000/ec3-callback.html
```

### 4. Deploy API Endpoint

The serverless function at `api/ec3-oauth-token.js` handles secure token exchange. Make sure it's deployed with your site.

Vercel will automatically deploy it as a serverless function when you push to your repository.

## Testing the Integration

### 1. Test OAuth Flow

1. Navigate to `https://yourdomain.com/ec3-oauth.html`
2. Click "Connect to EC3 Database"
3. You should be redirected to Building Transparency's login
4. After authentication, you'll return to the callback page
5. If successful, you'll see connection statistics

### 2. Test API Access

Once connected, test the integration:

```javascript
// Check connection status
console.log('EC3 Connected:', window.isEC3Connected());

// Search materials
const materials = await window.ec3Client.searchMaterials('concrete');
console.log('Found materials:', materials.count);

// Get database stats
const stats = await window.ec3Client.getStats();
console.log('EC3 Database stats:', stats);
```

## Integration with CarbonConstruct

### 1. Add Navigation Links

Update your main navigation to include the EC3 connection:

```html
<nav class="navbar">
    <div class="nav-links">
        <a href="index.html">Home</a>
        <a href="materials-database.html">Materials</a>
        <a href="ec3-oauth.html" class="ec3-link">🔗 Connect EC3</a>
        <a href="signin.html" class="nav-signin">Sign In</a>
    </div>
</nav>
```

### 2. Update Materials Database

In `materials-database.html`, add EC3 integration:

```html
<!-- Add this script to load the OAuth client -->
<script src="js/ec3-oauth-client.js"></script>

<script>
// Check EC3 connection on page load
document.addEventListener('DOMContentLoaded', function() {
    if (window.isEC3Connected()) {
        // Enable EC3 features
        enableEC3Features();
    } else {
        // Show connect prompt
        showEC3ConnectPrompt();
    }
});

function enableEC3Features() {
    // Add EC3 search to existing material search
    // Show EC3 stats
    // Enable EPD browsing
}

function showEC3ConnectPrompt() {
    // Show banner encouraging EC3 connection
}
</script>
```

### 3. Update LCA Calculator

In your LCA calculator, use EC3 data when available:

```javascript
// In lca-calculator.js or similar
async function getEmissionFactor(materialName) {
    // First try Supabase (fast, cached)
    let factor = await getSupabaseEmissionFactor(materialName);

    // If not found and EC3 is connected, try EC3
    if (!factor && window.isEC3Connected()) {
        const ec3Results = await window.ec3Client.searchMaterials(materialName, { limit: 1 });
        if (ec3Results.results.length > 0) {
            factor = extractEmissionFactor(ec3Results.results[0]);
        }
    }

    return factor;
}
```

## Security Considerations

1. **Client Secret Security**: Never expose the client secret in client-side code
2. **Token Storage**: OAuth tokens are stored in localStorage (consider more secure storage for production)
3. **HTTPS Required**: OAuth requires HTTPS in production
4. **Token Expiry**: Tokens expire and will need refresh (implement refresh token flow)

## Troubleshooting

### Common Issues

1. **"Invalid redirect URI"**
   - Check your EC3 OAuth app configuration
   - Ensure redirect URI matches exactly (including protocol)

2. **"Client authentication failed"**
   - Verify Client ID is correct
   - Check environment variable EC3_CLIENT_SECRET is set

3. **CORS errors**
   - Ensure requests go through your API endpoint, not directly to EC3

4. **"Not authenticated" errors**
   - Check localStorage for `ec3_oauth_state`
   - Verify token hasn't expired
   - Re-authenticate if needed

### Debug Tools

Check OAuth state in browser console:

```javascript
// Check connection status
console.log(window.ec3Client.getConnectionStatus());

// View stored OAuth state
console.log(JSON.parse(localStorage.getItem('ec3_oauth_state')));

// Clear OAuth state (for testing)
localStorage.removeItem('ec3_oauth_state');
```

## Production Deployment

1. Set environment variables in Vercel:

   ```
   EC3_CLIENT_SECRET=your_production_secret
   ```

2. Update redirect URI in EC3 OAuth app to production domain

3. Test the full flow on production domain

4. Monitor API usage and respect rate limits

## Support

If you encounter issues:

1. Check the browser console for error messages
2. Verify all environment variables are set
3. Test the OAuth flow step by step
4. Contact Building Transparency support for EC3-specific issues

---

## Quick Start Checklist

- [ ] Set `EC3_CLIENT_SECRET` environment variable
- [ ] Update Client ID in `ec3-oauth.html` and `ec3-callback.html`
- [ ] Verify redirect URI in EC3 OAuth app
- [ ] Deploy to Vercel
- [ ] Test OAuth flow
- [ ] Integrate with materials database
- [ ] Add navigation links
- [ ] Test full integration

🎉 **You're ready to give your users access to the world's largest embodied carbon database!**
