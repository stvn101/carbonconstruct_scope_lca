# EC3 Integration Troubleshooting & Fix Guide

## 🔍 **Issues Identified**

After reviewing the EC3 OAuth implementation and documentation, here are the problems found:

### 1. **Missing Environment Variables**
- **Issue**: Vercel serverless functions (`api/ec3-oauth-token.js` and `api/ec3-proxy.js`) require environment variables that aren't configured
- **Required Variables**:
  - `EC3_CLIENT_ID` - Your EC3 OAuth Client ID
  - `EC3_CLIENT_SECRET` - Your EC3 OAuth Client Secret (MUST be kept secret!)
  - `EC3_REDIRECT_URI` - OAuth callback URL
  - `NEXT_PUBLIC_EC3_API_KEY` - Optional API key for non-OAuth requests

### 2. **Hardcoded OAuth Configuration**
- **Issue**: Client ID and redirect URI are hardcoded in `ec3-oauth.html` and `ec3-callback.html`
- **Current Value**: `clientId: 'gNyUuor5vOAOiCrRdQ7o209nnMzESTrb4HpGKpqX'`
- **Redirect URI**: `'https://carbonconstruct.com.au/ec3-callback.html'`
- **Problem**: This prevents easy configuration changes and testing

### 3. **OAuth Flow vs API Key Confusion**
- **Issue**: Code mixes two authentication methods:
  - OAuth 2.0 authorization code flow (for user authentication)
  - API Key authentication (for server-to-server)
- **Problem**: Need to clarify which method to use when

### 4. **CORS Configuration**
- **Issue**: API proxy might have CORS problems when called from different domains
- **Current**: `Access-Control-Allow-Origin: '*'` (too permissive)
- **Should Be**: Specific domain whitelist

### 5. **Error Handling**
- **Issue**: Generic error messages don't help debug OAuth failures
- **Need**: Detailed error logging and user-friendly messages

### 6. **Token Refresh Not Implemented**
- **Issue**: `refreshAccessToken()` method exists but the API endpoint doesn't
- **Missing**: `/api/ec3-refresh-token` serverless function

---

## ✅ **Solutions Implemented**

### Solution 1: Environment Variable Configuration

**Create/Update `.env.local` (for local development)**:
```bash
# EC3 OAuth Configuration
EC3_CLIENT_ID=gNyUuor5vOAOiCrRdQ7o209nnMzESTrb4HpGKpqX
EC3_CLIENT_SECRET=your_actual_secret_here
EC3_REDIRECT_URI=https://carbonconstruct.com.au/ec3-callback.html

# For development
# EC3_REDIRECT_URI=http://localhost:3000/ec3-callback.html

# EC3 API Key (alternative to OAuth for server-side)
NEXT_PUBLIC_EC3_API_KEY=Mc8RCkwnszMZP6cEyYBCrgBdBOOjUc
```

**Configure in Vercel Dashboard**:
1. Go to: https://vercel.com/dashboard → Your Project → Settings → Environment Variables
2. Add these variables:
   - `EC3_CLIENT_ID`: `gNyUuor5vOAOiCrRdQ7o209nnMzESTrb4HpGKpqX`
   - `EC3_CLIENT_SECRET`: `[YOUR_SECRET_HERE]` (you need to get this from Building Transparency)
   - `EC3_REDIRECT_URI`: `https://carbonconstruct.com.au/ec3-callback.html`
   - `NEXT_PUBLIC_EC3_API_KEY`: `Mc8RCkwnszMZP6cEyYBCrgBdBOOjUc`

### Solution 2: Dynamic OAuth Configuration

**Updated `ec3-oauth.html`** to load client ID from environment or fallback to hardcoded:
```javascript
const EC3_OAUTH_CONFIG = {
    clientId: window.ENV?.EC3_CLIENT_ID || 'gNyUuor5vOAOiCrRdQ7o209nnMzESTrb4HpGKpqX',
    redirectUri: window.ENV?.EC3_REDIRECT_URI || window.location.origin + '/ec3-callback.html',
    scope: 'read',
    authUrl: 'https://buildingtransparency.org/api/oauth/authorize/',
    tokenUrl: 'https://buildingtransparency.org/api/oauth/token/'
};
```

### Solution 3: Improved Error Handling

**Enhanced error messages in OAuth callback**:
- Show specific error types (invalid_client, invalid_grant, etc.)
- Log detailed error info to console for debugging
- Display user-friendly recovery steps

### Solution 4: Token Refresh Endpoint

**Created `/api/ec3-refresh-token.js`** for automatic token renewal (see updated file)

### Solution 5: Better CORS Configuration

**Updated CORS headers** to be more secure:
```javascript
const allowedOrigins = [
    'https://carbonconstruct.com.au',
    'https://www.carbonconstruct.com.au',
    'http://localhost:3000' // for development
];

const origin = req.headers.origin;
if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
}
```

---

## 🔑 **How to Get EC3 Credentials**

### Step 1: Access Building Transparency Account

1. Go to: https://buildingtransparency.org/
2. Sign in to your EC3 account
3. Navigate to: **Settings** → **API & Integrations**

### Step 2: Find Your OAuth Application

Look for one of these sections:
- "OAuth Applications"
- "Developer Settings"
- "API Keys & Tokens"
- "Connected Applications"

### Step 3: Get Your Credentials

You should find:
- ✅ **Client ID**: Already have `gNyUuor5vOAOiCrRdQ7o209nnMzESTrb4HpGKpqX`
- ❓ **Client Secret**: You need to get this (it's sensitive!)
- ✅ **Redirect URI**: Verify it matches `https://carbonconstruct.com.au/ec3-callback.html`

### Step 4: Alternative - Use API Key

If OAuth is too complex, you can use simple API key authentication:
- Look for "API Keys" section
- Generate or copy your API key
- Use it in requests with `Authorization: Bearer YOUR_API_KEY` header

---

## 🧪 **Testing the Integration**

### Test 1: Check Environment Variables

```bash
# In your project directory
node -e "console.log(process.env.EC3_CLIENT_ID || 'NOT SET')"
```

### Test 2: Test OAuth Flow

1. Navigate to: `https://carbonconstruct.com.au/ec3-oauth.html`
2. Click "Connect to EC3 Database"
3. You should be redirected to Building Transparency login
4. After login, should return to callback page
5. Should show "Successfully Connected!"

### Test 3: Test API Proxy

```bash
curl -X GET "https://carbonconstruct.com.au/api/ec3-proxy?endpoint=materials&page_size=1"
```

Should return JSON with materials data.

### Test 4: Test in Browser Console

```javascript
// Open browser console on any page
const client = new EC3OAuthClient();
console.log(client.getConnectionStatus());
// Should show connection status

// If connected:
client.searchMaterials('concrete').then(results => console.log(results));
```

---

## 🐛 **Common Errors & Solutions**

### Error 1: "Client authentication failed"

**Cause**: Client Secret is missing or incorrect
**Solution**:
1. Get correct Client Secret from Building Transparency
2. Add to Vercel environment variables
3. Redeploy

### Error 2: "Invalid redirect URI"

**Cause**: Redirect URI in your OAuth app doesn't match the one in code
**Solution**:
1. Go to Building Transparency OAuth app settings
2. Add/update redirect URI to: `https://carbonconstruct.com.au/ec3-callback.html`
3. For dev: Also add `http://localhost:3000/ec3-callback.html`

### Error 3: "CORS error"

**Cause**: Request blocked by browser CORS policy
**Solution**:
1. Use the `/api/ec3-proxy` endpoint instead of direct EC3 API calls
2. Ensure Vercel functions are deployed
3. Check CORS headers in proxy function

### Error 4: "Token expired"

**Cause**: OAuth access token has expired
**Solution**:
1. Implement token refresh (endpoint provided)
2. Or: Reconnect through OAuth portal
3. Tokens typically last 1 hour - 1 day

### Error 5: "Not authenticated"

**Cause**: No OAuth token in localStorage or token cleared
**Solution**:
1. Go to `ec3-oauth.html`
2. Click "Connect to EC3 Database"
3. Complete OAuth flow again

---

## 📋 **Verification Checklist**

Before considering EC3 integration complete:

- [ ] EC3_CLIENT_SECRET obtained from Building Transparency
- [ ] All environment variables set in Vercel
- [ ] Redirect URI matches in both code and EC3 OAuth app settings
- [ ] OAuth flow completes successfully (can connect)
- [ ] API proxy returns data
- [ ] EC3 search works in calculator
- [ ] Token refresh works (or manual reconnect flow is clear)
- [ ] Error handling provides helpful messages
- [ ] Documentation updated for users

---

## 🆘 **Still Having Issues?**

### Check Vercel Deployment Logs

1. Go to Vercel Dashboard → Your Project → Deployments
2. Click on latest deployment
3. Check "Functions" tab for serverless function logs
4. Look for errors in `/api/ec3-oauth-token` and `/api/ec3-proxy`

### Check Browser Console

1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for EC3-related errors
4. Check Network tab for failed API requests

### Contact Support

**Building Transparency Support**:
- Website: https://buildingtransparency.org/contact
- Email: support@buildingtransparency.org

**CarbonConstruct Support**:
- Check `REDIRECT_FIX.md` for deployment issues
- Review Vercel logs for serverless function errors

---

## 🎯 **Quick Fix Summary**

**Most Common Issue**: Missing `EC3_CLIENT_SECRET`

**Quick Fix**:
1. Get Client Secret from Building Transparency
2. Add to Vercel: Settings → Environment Variables → Add `EC3_CLIENT_SECRET`
3. Redeploy: `git push origin main` (triggers auto-deploy)
4. Test: Visit `ec3-oauth.html` and try connecting

**Time to Fix**: 5-10 minutes (if you have the secret)

---

## 📚 **Additional Resources**

- **EC3 API Docs**: Available in EC3 Settings → API & Integrations (must be logged in)
- **OAuth 2.0 Spec**: https://oauth.net/2/
- **Vercel Environment Variables**: https://vercel.com/docs/concepts/projects/environment-variables
- **CarbonConstruct Docs**: See `EC3_INTEGRATION.md` and `EC3_OAUTH_SETUP.md`

---

**Last Updated**: 2025-10-29
**Status**: Ready for testing once EC3_CLIENT_SECRET is obtained
