# Supabase Migration Guide
## Migrating 4346 Materials from Source to Target Database

### Overview
This guide will help you migrate the unified_materials table with all 4346 materials from:
- **Source**: https://hkgryypdqiyigoztvran.supabase.co
- **Target**: https://jaqzoyouuzhchuyzafii.supabase.co

### What's Been Prepared
✅ All 4346 materials exported from source database
✅ Schema SQL file created
✅ Migration script ready

---

## Step 1: Create the Schema

1. Open the Supabase SQL Editor for your target project:
   ```
   https://supabase.com/dashboard/project/jaqzoyouuzhchuyzafii/sql/new
   ```

2. Copy the SQL from the file: **`schema_to_run.sql`**

3. Paste it into the SQL Editor

4. Click **"Run"** button

5. Wait for success message

---

## Step 2: Run the Migration

Once the schema is created, run the migration script:

```bash
node final_migration.js
```

This will:
- Load all 4346 materials from `all_materials_export.json`
- Import them in batches of 100
- Show progress as it goes
- Verify the migration at the end

**Expected time**: 3-5 minutes

---

## Step 3: Verify

After migration completes, verify:

1. Check the console output for success count
2. Visit your Supabase Table Editor:
   ```
   https://supabase.com/dashboard/project/jaqzoyouuzhchuyzafii/editor
   ```
3. Click on `unified_materials` table
4. Verify you have 4346 rows

---

## Files Created

| File | Purpose |
|------|---------|
| `all_materials_export.json` | All 4346 materials from source database |
| `schema_to_run.sql` | SQL to create the unified_materials table |
| `final_migration.js` | Script to import all materials |
| `unified_materials_actual_schema.sql` | Complete schema with triggers and views |

---

## Materials Breakdown

The database contains:
- **Total**: 4346 materials
- **Top categories**:
  - Concrete (in-situ): 2048 materials
  - Asphalt: 303 materials
  - Steel: 147 materials
  - And 100+ other categories

---

## Troubleshooting

### If schema creation fails:
- Check you're logged into the correct Supabase project
- Make sure you have admin permissions
- Try running the SQL in smaller chunks

### If migration fails:
- Check the error message
- Failed materials will be saved to `failed_materials.json`
- You can retry just those materials

### If some materials don't import:
- The script will retry failed batches individually
- Check `failed_materials.json` for details
- Most common issue is data type mismatches

---

## Need Help?

1. Check the console output for specific errors
2. Review the `failed_materials.json` file if any imports fail
3. Verify the schema was created correctly in Supabase dashboard

---

## Quick Start (TL;DR)

```bash
# 1. Run SQL from schema_to_run.sql in Supabase SQL Editor
# 2. Then run:
node final_migration.js
```

That's it!
