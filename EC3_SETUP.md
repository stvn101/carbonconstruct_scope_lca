# EC3 API Setup Instructions

## Current Status

✅ **Supabase**: Fully working with 4,343 Australian materials
⚠️ **EC3 API**: Requires OAuth Bearer Token (not just API key)

## EC3 API Authentication

The EC3 API (Building Transparency) requires OAuth authentication, not a simple API key.

### To Enable EC3:

1. Go to https://buildingtransparency.org/
2. Sign in to your account
3. Navigate to API settings
4. Generate an **OAuth Bearer Token** (not just an API key)
5. Add the token to your `.env.local` file:

```env
NEXT_PUBLIC_EC3_BEARER_TOKEN=your-actual-bearer-token-here
```

6. Update `js/config.js`:

```javascript
EC3_BEARER_TOKEN: 'your-actual-bearer-token-here',
```

### Alternative: API Key

If your API key should work, you may need to contact Building Transparency support to verify:
- API key is active
- Correct permissions are enabled
- Authentication method for your account

## Current Configuration

The app is configured to work with **Supabase as the primary database**, which provides:
- ✅ 4,343 verified Australian construction materials
- ✅ Full lifecycle carbon data (A1-A3, A4, A5, B1-B5, C1-C4, D)
- ✅ Scope 1, 2, 3 emissions factors
- ✅ EPD Australasia materials
- ✅ Regional data for NSW, VIC, QLD, SA, WA
- ✅ Fast, cached access

EC3 is **optional** and provides:
- 50,000+ global EPDs
- International materials
- Manufacturer-specific data
- Detailed EPD documentation

## Using the App Without EC3

The application works fully without EC3! Supabase provides everything needed for Australian construction projects.

## Testing Connections

Run this command to test both connections:

```bash
node test-connections.js
```

You should see:
- ✅ Supabase: PASS (4,343 materials available)
- ⚠️ EC3 API: FAIL (needs Bearer Token)

The app will automatically fallback to Supabase-only mode if EC3 is unavailable.

## Questions?

Contact Building Transparency support: https://buildingtransparency.org/support
