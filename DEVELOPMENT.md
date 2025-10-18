# ⚠️ DEVELOPMENT MODE

**This application is currently in DEVELOPMENT and NOT for public access.**

## Security Notice

- This repository contains development code
- API keys have been removed from public files
- Local configuration required for development
- Not deployed to any public hosting

## For Developers

If you're working on this project:

1. **Create your local config:**
   - Copy `js/config.js` to `js/config.local.js`
   - Add your own API keys
   - Never commit `config.local.js`

2. **Get API keys:**
   - Supabase: https://supabase.com/ (create free account)
   - EC3: https://buildingtransparency.org/ (request API access)

3. **Load local config in HTML:**
   ```html
   <script src="js/config.js"></script>
   <script src="js/config.local.js"></script> <!-- Load after config.js -->
   ```

4. **Run locally:**
   ```bash
   python -m http.server 8000
   # Open http://localhost:8000
   ```

## Security Best Practices

- ✅ Never commit API keys
- ✅ Use environment variables for production
- ✅ Keep `.env.local` and `config.local.js` in `.gitignore`
- ✅ Use different keys for dev and production

## Contact

For questions about this project, contact the repository owner.
