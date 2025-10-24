# Secret Removal Log

- **Timestamp:** 2025-10-24T13:17:58Z

| File | Replacements |
| --- | --- |
| index.html | 1 |
| build.js | 1 |
| create_schema.js | 2 |
| direct_postgres_migration.js | 1 |
| fetch_all_materials.js | 2 |
| final_migration.js | 2 |
| fresh_setup.js | 2 |
| get-token-now.js | 1 |
| js/config.js | 2 |
| load_materials_only.js | 2 |
| load_with_snake_case.js | 2 |
| migrate_supabase.js | 4 |
| migrate_supabase_v2.js | 4 |
| test-both-keys.js | 2 |
| test-connections.js | 2 |
| test-ec3.html | 1 |
| DEPLOYMENT.md | 5 |
| DEPLOYMENT_CHECKLIST.md | 3 |
| DEPLOYMENT_READINESS_REPORT.md | 5 |
| EC3_SETUP.md | 1 |
| INTEGRATION_COMPLETE.md | 1 |
| LAUNCH_CHECKLIST.md | 1 |
| PRODUCTION_INTEGRATION.md | 8 |
| PUSH_TO_GITHUB.md | 2 |
| QUICK_REFERENCE.md | 1 |
| QUICK_START.md | 1 |
| README.md | 1 |
| SECURITY_CLEANUP_REPORT.md | 8 |
| STRIPE_MCP_INTEGRATION.md | 1 |
| STRIPE_MCP_SETUP.md | 1 |
| SUMMARY.md | 2 |
| SUPABASE_INTEGRATION.md | 4 |
| SUPABASE_MCP_SETUP.md | 1 |

**Verification**

- `rg "eyJ"` → no results
- `rg "Mc8RCkwn"` → no results
- `rg "nK72LVK"` → no results
- `rg "UfKIX9y"` → no results
- `rg "pk_live"` → no results
- `rg "sk_live"` → no results
- `rg "whsec"` → no results

All identified hard-coded secrets have been replaced with environment variables or explicit placeholders.
