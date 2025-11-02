# UNIFIED_MATERIALS DATABASE - COMPLETE GUIDE

## 📋 Table of Contents
1. [Overview](#overview)
2. [Complete Column Reference](#complete-column-reference)
3. [Data Types & Constraints](#data-types--constraints)
4. [Sample Data Examples](#sample-data-examples)
5. [How to Set Up](#how-to-set-up)
6. [Import/Export Instructions](#importexport-instructions)
7. [Query Examples](#query-examples)
8. [Maintenance & Updates](#maintenance--updates)

---

## Overview

### What is unified_materials?

The `unified_materials` table is a comprehensive PostgreSQL database containing **4,500+ Australian construction materials** including **3,500+ EPD Australasia verified Environmental Product Declarations (EPDs)**.

### Purpose

This database powers the CarbonConstruct LCA (Life Cycle Assessment) calculator, providing accurate embodied carbon data for construction materials used in Australian projects.

### Key Features

- ✅ **4,500+ materials** (vs. typical calculators with 20-50)
- ✅ **3,500+ EPD Australasia verified** products
- ✅ **Full LCA stage breakdown** (A1-A3, A4, A5, C1-C4, D)
- ✅ **Australian-specific data** (states, manufacturers, costs)
- ✅ **Physical properties** (density, strength, thermal)
- ✅ **Sustainability metrics** (recycled content, recyclability)
- ✅ **Full-text search** capability
- ✅ **Data quality ratings** (1-5 stars)

---

## Complete Column Reference

### 🔑 Primary Key

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| `id` | UUID | Unique identifier (auto-generated) | `550e8400-e29b-41d4-a716-446655440000` |

### 📝 Basic Identification Fields

| Column | Type | Required | Description | Example |
|--------|------|----------|-------------|---------|
| `name` | TEXT | ✅ Yes | Material name | `"32 MPa Concrete (Standard)"` |
| `category` | TEXT | ✅ Yes | Main category | `"concrete"`, `"steel"`, `"timber"` |
| `subcategory` | TEXT | No | Finer classification | `"structural"`, `"reinforcing"`, `"engineered"` |
| `description` | TEXT | No | Detailed description | `"Standard structural concrete for slabs..."` |
| `manufacturer` | TEXT | No | Brand or producer | `"BlueScope Steel"`, `"Wagners"` |
| `product_code` | TEXT | No | SKU or product code | `"HYNE-LVL-13"`, `"XLAM-CLT-140"` |

### 🌍 Embodied Carbon Data (CORE)

| Column | Type | Required | Description | Example |
|--------|------|----------|-------------|---------|
| `embodied_carbon` | DECIMAL(10,3) | ✅ Yes | Total embodied carbon (kg CO2-e per unit) | `310.000` (concrete), `2100.000` (steel) |
| `unit` | TEXT | ✅ Yes | Unit of measurement | `"m3"`, `"tonnes"`, `"m2"`, `"kg"`, `"each"` |
| `alternative_units` | JSONB | No | Alternative units as JSON array | `["m3", "tonnes", "kg"]` |

**Important**: `embodied_carbon` is the PRIMARY value used in all calculations!

### 📊 LCA Stage Breakdown

These represent the percentage of total embodied carbon at each lifecycle stage. **Must add up to 1.0 (100%)**.

| Column | Type | Default | Description | Typical Range |
|--------|------|---------|-------------|---------------|
| `a1_a3` | DECIMAL(4,3) | 0.900 | Product stage (extraction, manufacturing) | 0.85-0.95 (85-95%) |
| `a4` | DECIMAL(4,3) | 0.050 | Transport to site | 0.03-0.10 (3-10%) |
| `a5` | DECIMAL(4,3) | 0.050 | Construction/Installation | 0.03-0.10 (3-10%) |
| `c1_c4` | DECIMAL(4,3) | NULL | End of life (deconstruction, disposal) | 0.01-0.05 (optional) |
| `d` | DECIMAL(4,3) | NULL | Benefits beyond system (recycling credits) | -0.01 to -0.08 (optional) |

**Example Calculation:**
- Material: 32 MPa Concrete
- Total embodied carbon: 310 kg CO2-e/m³
- A1-A3 (90%): 279 kg CO2-e
- A4 (5%): 15.5 kg CO2-e
- A5 (5%): 15.5 kg CO2-e

### 🏅 EPD (Environmental Product Declaration) Data

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| `source` | TEXT | Data source organization | `"EPD Australasia"`, `"ICE Database"`, `"AusLCI"` |
| `epd_number` | TEXT | Official EPD reference number | `"EPD-AUS-20230045"` |
| `epd_url` | TEXT | Link to EPD document | `"https://epd-australasia.com/epd/12345"` |
| `valid_from` | DATE | EPD start date | `2023-01-15` |
| `valid_until` | DATE | EPD expiry (typically 5 years) | `2028-01-15` |
| `is_epd_verified` | BOOLEAN | Is this EPD Australasia verified? | `true` / `false` |
| `epd_type` | TEXT | Type of EPD | `"product-specific"`, `"industry-average"`, `"generic"` |

**EPD Verification Hierarchy:**
1. **Product-specific EPD** (highest quality) - For a specific manufacturer's product
2. **Industry-average EPD** - Representative of typical products in category
3. **Generic** - Estimated from literature/databases

### 🔬 Physical Properties

| Column | Type | Unit | Description | Example |
|--------|------|------|-------------|---------|
| `density` | DECIMAL(8,2) | kg/m³ | Material density (for conversions) | `2400.00` (concrete), `7850.00` (steel) |
| `strength_mpa` | DECIMAL(8,2) | MPa | Compressive/tensile strength | `32.00` (concrete), `500.00` (steel) |
| `thermal_conductivity` | DECIMAL(6,4) | W/mK | Heat transfer (for insulation) | `0.0400` (glasswool) |
| `r_value` | DECIMAL(6,3) | m²K/W | Thermal resistance | `2.500` (R2.5 insulation) |

### ♻️ Sustainability Attributes

| Column | Type | Unit | Description | Example |
|--------|------|------|-------------|---------|
| `recycled_content` | DECIMAL(5,2) | % | Percentage of recycled material | `0.00` (virgin), `100.00` (recycled steel) |
| `recyclability` | DECIMAL(5,2) | % | Can be recycled at end of life | `98.00` (steel), `5.00` (concrete) |
| `certified_sustainable` | BOOLEAN | - | FSC/PEFC certified (timber) | `true` (certified timber) |
| `carbon_sequestration` | DECIMAL(10,3) | kg CO2-e | Carbon stored (negative = storage) | `-650.000` (hardwood timber) |
| `biogenic_carbon` | DECIMAL(10,3) | kg CO2 | Biogenic CO2 content | `-720.000` (timber) |

**Key Concept**: Timber can have **negative embodied carbon** because trees absorb CO2 as they grow!

### 🇦🇺 Australian Specific Data

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| `state_origin` | TEXT | State of manufacture | `"NSW"`, `"VIC"`, `"QLD"`, `"SA"`, `"WA"`, `"TAS"`, `"NT"`, `"ACT"` |
| `australian_made` | BOOLEAN | Made in Australia? | `true` / `false` |
| `regional_availability` | JSONB | States where available | `["NSW", "VIC", "QLD"]` |

### 💰 Cost & Economic Data (Optional)

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| `typical_cost` | DECIMAL(10,2) | Cost per unit (AUD) | `180.00` (32MPa concrete per m³) |
| `currency` | TEXT | Currency code | `"AUD"` |
| `cost_year` | INTEGER | Reference year for cost | `2024` |

**Use Case**: Cost-carbon tradeoff analysis (e.g., "Is geopolymer concrete worth the extra 10% cost for 60% carbon reduction?")

### 🔍 Search & Filtering

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| `tags` | JSONB | Searchable tags array | `["low-carbon", "recycled", "sustainable"]` |
| `search_vector` | TSVECTOR | Auto-generated full-text search | (auto-populated by trigger) |

### 📈 Data Quality & Provenance

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| `data_quality` | INTEGER | Quality rating (1-5 stars) | `5` = Product-specific EPD<br>`3` = Industry average<br>`1` = Generic estimate |
| `data_source_org` | TEXT | Source organization | `"EPD Australasia"`, `"Wagners"`, `"AusLCI"` |
| `reference_standard` | TEXT | Applicable standard | `"AS/NZS ISO 14025:2013"` |
| `geographic_validity` | TEXT | Where data is valid | `"Australia"`, `"NSW only"`, `"Global"` |
| `technology` | TEXT | Production method | `"Fly ash-based geopolymer technology"` |

### 📝 Additional Metadata

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| `notes` | TEXT | Special considerations | `"Award-winning low-carbon alternative"` |
| `original_id` | TEXT | ID from source database | `"CONC-32-001"` |
| `is_active` | BOOLEAN | Is material available? | `true` / `false` |
| `created_at` | TIMESTAMP | Record created | `2024-01-01 00:00:00+00` |
| `updated_at` | TIMESTAMP | Last modified (auto-updated) | `2024-01-01 00:00:00+00` |
| `created_by` | TEXT | Who created | `"system"`, `"user@example.com"` |
| `updated_by` | TEXT | Who last updated | `"system"`, `"user@example.com"` |

---

## Data Types & Constraints

### Understanding DECIMAL Precision

| Type | Precision | Example Value | Description |
|------|-----------|---------------|-------------|
| `DECIMAL(10,3)` | 10 digits, 3 decimal places | `2100.250` | For embodied carbon values |
| `DECIMAL(8,2)` | 8 digits, 2 decimal places | `7850.50` | For density, cost |
| `DECIMAL(6,4)` | 6 digits, 4 decimal places | `0.0400` | For thermal conductivity |
| `DECIMAL(5,2)` | 5 digits, 2 decimal places | `98.50` | For percentages |
| `DECIMAL(4,3)` | 4 digits, 3 decimal places | `0.920` | For LCA stage percentages |

### JSONB Format Examples

**Alternative Units:**
```json
["m3", "tonnes", "kg"]
```

**Regional Availability:**
```json
["NSW", "VIC", "QLD", "SA"]
```

**Tags:**
```json
["low-carbon", "recycled", "sustainable", "circular-economy"]
```

### Boolean Values

- `TRUE` / `true` / `t` / `1` = Yes
- `FALSE` / `false` / `f` / `0` = No
- `NULL` = Unknown/Not applicable

---

## Sample Data Examples

### Example 1: Standard Concrete

```sql
INSERT INTO unified_materials (
    name, category, subcategory, description,
    embodied_carbon, unit, a1_a3, a4, a5,
    source, is_epd_verified, epd_type,
    density, strength_mpa,
    state_origin, australian_made,
    data_quality, is_active
) VALUES (
    '32 MPa Concrete (Standard)',
    'concrete',
    'structural',
    'Standard structural concrete used for slabs and columns',
    310.000,
    'm3',
    0.900, 0.050, 0.050,
    'EPD Australasia',
    TRUE,
    'industry-average',
    2400.00,
    32.00,
    'NSW',
    TRUE,
    4,
    TRUE
);
```

### Example 2: Low-Carbon Alternative (Geopolymer)

```sql
INSERT INTO unified_materials (
    name, category, subcategory, description, manufacturer,
    embodied_carbon, unit, a1_a3, a4, a5,
    source, epd_number, is_epd_verified, epd_type,
    density, strength_mpa,
    state_origin, australian_made,
    tags, data_quality, technology, is_active
) VALUES (
    '32 MPa GPC (Geopolymer Concrete)',
    'concrete',
    'low-carbon',
    'Revolutionary low-carbon concrete using geopolymer technology. Reduces embodied carbon by 60%',
    'Wagners Earth Friendly Concrete',
    120.000,
    'm3',
    0.880, 0.060, 0.060,
    'EPD Australasia',
    'EPD-AUS-20230145',
    TRUE,
    'product-specific',
    2400.00,
    32.00,
    'QLD',
    TRUE,
    '["low-carbon", "geopolymer", "sustainable"]'::jsonb,
    5,
    'Fly ash-based geopolymer technology',
    TRUE
);
```

### Example 3: Recycled Steel

```sql
INSERT INTO unified_materials (
    name, category, subcategory, description, manufacturer,
    embodied_carbon, unit, a1_a3, a4, a5, d,
    source, epd_number, is_epd_verified, epd_type,
    density, strength_mpa,
    recycled_content, recyclability,
    state_origin, australian_made,
    tags, data_quality, is_active
) VALUES (
    'Recycled Steel (EAF Steel)',
    'steel',
    'recycled',
    'Electric Arc Furnace steel from 100% scrap. Reduces embodied carbon by 75%',
    'Arrium OneSteel',
    550.000,
    'tonnes',
    0.900, 0.050, 0.050, -0.080,
    'EPD Australasia',
    'EPD-AUS-20230091',
    TRUE,
    'product-specific',
    7850.00,
    350.00,
    100.00,
    98.00,
    'SA',
    TRUE,
    '["recycled", "low-carbon", "sustainable", "circular-economy"]'::jsonb,
    5,
    TRUE
);
```

### Example 4: Carbon-Negative Timber

```sql
INSERT INTO unified_materials (
    name, category, subcategory, description,
    embodied_carbon, unit, a1_a3, a4, a5, d,
    source, epd_type,
    density,
    certified_sustainable, carbon_sequestration, biogenic_carbon,
    state_origin, australian_made,
    tags, data_quality, is_active
) VALUES (
    'Australian Hardwood (Spotted Gum)',
    'timber',
    'hardwood',
    'Dense structural hardwood with negative embodied carbon. Acts as long-term carbon store',
    -200.000,  -- NEGATIVE embodied carbon!
    'm3',
    0.700, 0.200, 0.100, -650.000,
    'AusLCI',
    'industry-average',
    900.00,
    TRUE,  -- FSC certified
    -650.000,  -- Carbon stored
    -720.000,  -- Biogenic carbon
    'TAS',
    TRUE,
    '["carbon-negative", "sustainable", "fsc-certified", "renewable"]'::jsonb,
    3,
    TRUE
);
```

### Example 5: Insulation with Recycled Content

```sql
INSERT INTO unified_materials (
    name, category, subcategory, description, manufacturer, product_code,
    embodied_carbon, unit, a1_a3, a4, a5,
    source, epd_number, is_epd_verified, epd_type,
    density, thermal_conductivity, r_value,
    recycled_content, recyclability,
    state_origin, australian_made,
    regional_availability, typical_cost, currency, cost_year,
    tags, data_quality, is_active
) VALUES (
    'Glasswool Batts R2.5',
    'insulation',
    'glasswool',
    'Bulk insulation made from recycled glass. Good thermal and acoustic performance',
    'Knauf Earthwool',
    'R2.5-90mm',
    5.200,
    'm2',
    0.880, 0.060, 0.060,
    'EPD Australasia',
    'EPD-AUS-20230112',
    TRUE,
    'product-specific',
    12.00,
    0.0400,  -- W/mK
    2.500,   -- R-value
    80.00,   -- 80% recycled content
    95.00,   -- 95% recyclable
    'VIC',
    TRUE,
    '["VIC", "NSW", "QLD", "SA", "WA", "TAS"]'::jsonb,
    12.50,
    'AUD',
    2024,
    '["insulation", "recycled", "thermal", "acoustic"]'::jsonb,
    5,
    TRUE
);
```

---

## How to Set Up

### Step 1: Create the Table

Run the SQL schema file:

```bash
psql -U your_username -d your_database -f backup_unified_materials_schema.sql
```

Or in Supabase SQL Editor:
1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `backup_unified_materials_schema.sql`
3. Run the query

### Step 2: Import Sample Data

**From CSV:**
```sql
COPY unified_materials FROM '/path/to/backup_unified_materials_template.csv' WITH CSV HEADER;
```

**From JSON (using PostgreSQL JSON functions):**
```sql
INSERT INTO unified_materials
SELECT
    (value->>'id')::uuid,
    value->>'name',
    value->>'category',
    -- ... map all other fields
FROM json_array_elements(
    (SELECT materials FROM json_populate_record(null::json, '{"materials": [...]}'::json))
);
```

### Step 3: Verify Data

```sql
-- Check total count
SELECT COUNT(*) FROM unified_materials;

-- Check EPD verified count
SELECT COUNT(*) FROM unified_materials WHERE is_epd_verified = TRUE;

-- Check categories
SELECT category, COUNT(*) as count
FROM unified_materials
GROUP BY category
ORDER BY count DESC;

-- Check Australian made
SELECT COUNT(*) FROM unified_materials WHERE australian_made = TRUE;
```

---

## Import/Export Instructions

### Export Entire Table to CSV

```sql
COPY unified_materials TO '/path/to/backup_unified_materials_full.csv' WITH CSV HEADER;
```

### Export Filtered Data (EPD Only)

```sql
COPY (
    SELECT * FROM unified_materials
    WHERE is_epd_verified = TRUE
    AND is_active = TRUE
) TO '/path/to/epd_materials_only.csv' WITH CSV HEADER;
```

### Export to JSON

```bash
psql -U your_username -d your_database -c "
    SELECT json_agg(row_to_json(unified_materials))
    FROM unified_materials
    WHERE is_active = TRUE
" -t -o backup.json
```

### Import from CSV

```sql
COPY unified_materials FROM '/path/to/backup.csv' WITH CSV HEADER;
```

### Bulk Import with Data Validation

```sql
-- Create staging table
CREATE TEMP TABLE staging_materials (LIKE unified_materials);

-- Import to staging
COPY staging_materials FROM '/path/to/import.csv' WITH CSV HEADER;

-- Validate and insert only good records
INSERT INTO unified_materials
SELECT * FROM staging_materials
WHERE embodied_carbon IS NOT NULL
  AND unit IS NOT NULL
  AND name IS NOT NULL
  AND category IS NOT NULL;
```

---

## Query Examples

### Find Materials by Category

```sql
SELECT name, embodied_carbon, unit, manufacturer
FROM unified_materials
WHERE category = 'concrete'
  AND is_active = TRUE
ORDER BY embodied_carbon ASC;
```

### Search by Name (Full-Text Search)

```sql
SELECT name, category, embodied_carbon, unit
FROM unified_materials
WHERE search_vector @@ to_tsquery('english', 'geopolymer | low-carbon')
  AND is_active = TRUE;
```

### Get Low-Carbon Alternatives

```sql
-- Find materials with < 200 kg CO2-e/m³
SELECT name, category, embodied_carbon, unit, manufacturer
FROM unified_materials
WHERE embodied_carbon < 200
  AND unit = 'm3'
  AND is_active = TRUE
ORDER BY embodied_carbon ASC;
```

### EPD Verified Materials Only

```sql
SELECT name, category, epd_number, valid_until, embodied_carbon
FROM unified_materials
WHERE is_epd_verified = TRUE
  AND valid_until > CURRENT_DATE  -- Not expired
  AND is_active = TRUE
ORDER BY category, name;
```

### Compare Standard vs Low-Carbon Options

```sql
-- Standard concrete vs Geopolymer
SELECT
    name,
    embodied_carbon,
    typical_cost,
    (embodied_carbon / NULLIF(typical_cost, 0)) as carbon_per_dollar
FROM unified_materials
WHERE category = 'concrete'
  AND subcategory IN ('structural', 'low-carbon')
  AND strength_mpa >= 32
ORDER BY embodied_carbon ASC;
```

### Materials by Australian State

```sql
SELECT name, category, embodied_carbon, state_origin
FROM unified_materials
WHERE state_origin = 'NSW'
  AND australian_made = TRUE
  AND is_active = TRUE;
```

### Calculate Carbon Savings

```sql
-- Compare steel options
WITH steel_comparison AS (
    SELECT
        name,
        embodied_carbon,
        recycled_content,
        CASE WHEN name LIKE '%Recycled%' THEN embodied_carbon ELSE NULL END as recycled_carbon,
        CASE WHEN name LIKE '%Reinforcing%' THEN embodied_carbon ELSE NULL END as virgin_carbon
    FROM unified_materials
    WHERE category = 'steel'
)
SELECT
    MAX(virgin_carbon) - MIN(recycled_carbon) as carbon_savings_per_tonne,
    ((MAX(virgin_carbon) - MIN(recycled_carbon)) / MAX(virgin_carbon) * 100) as percent_reduction
FROM steel_comparison;
```

### Materials with Highest Recycled Content

```sql
SELECT name, category, recycled_content, recyclability, embodied_carbon
FROM unified_materials
WHERE recycled_content > 50
  AND is_active = TRUE
ORDER BY recycled_content DESC, embodied_carbon ASC
LIMIT 20;
```

### Carbon-Negative Materials (Timber)

```sql
SELECT name, subcategory, embodied_carbon, carbon_sequestration, biogenic_carbon
FROM unified_materials
WHERE embodied_carbon < 0  -- Negative = carbon storage!
  AND is_active = TRUE
ORDER BY embodied_carbon ASC;
```

---

## Maintenance & Updates

### Update Material When EPD Expires

```sql
-- Find expiring EPDs
SELECT name, epd_number, valid_until
FROM unified_materials
WHERE valid_until < CURRENT_DATE + INTERVAL '60 days'
  AND is_epd_verified = TRUE;

-- Mark as needs update
UPDATE unified_materials
SET notes = CONCAT(COALESCE(notes, ''), ' [EPD EXPIRING SOON]')
WHERE valid_until < CURRENT_DATE + INTERVAL '60 days';
```

### Add New Material

```sql
INSERT INTO unified_materials (
    name, category, embodied_carbon, unit,
    source, australian_made, is_active
) VALUES (
    'New Innovative Material',
    'composite',
    150.000,
    'm2',
    'Manufacturer EPD',
    TRUE,
    TRUE
);
```

### Deactivate Discontinued Material

```sql
UPDATE unified_materials
SET is_active = FALSE,
    notes = CONCAT(COALESCE(notes, ''), ' [DISCONTINUED]'),
    updated_by = 'admin@carbonconstruct.com'
WHERE id = '550e8400-e29b-41d4-a716-446655440000';
```

### Bulk Update Costs

```sql
-- Increase all costs by 3% for inflation
UPDATE unified_materials
SET typical_cost = typical_cost * 1.03,
    cost_year = 2025,
    updated_by = 'system'
WHERE cost_year = 2024;
```

### Recalculate Search Vectors

```sql
-- If you added materials manually without search vector
UPDATE unified_materials
SET search_vector =
    setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(category, '')), 'C')
WHERE search_vector IS NULL;
```

---

## Best Practices

### Data Entry Guidelines

1. **Always include core fields:**
   - `name`, `category`, `embodied_carbon`, `unit`, `source`

2. **EPD data should have:**
   - `epd_number`, `valid_from`, `valid_until`, `is_epd_verified = TRUE`

3. **LCA stages should sum to 1.0:**
   - `a1_a3 + a4 + a5 = 1.0` (for cradle-to-site)

4. **Use consistent units:**
   - Concrete/timber: `m3`
   - Steel: `tonnes`
   - Insulation: `m2`
   - Finishes: `m2`

5. **Tag materials for searchability:**
   - Add relevant tags: `["low-carbon", "recycled", "sustainable"]`

### Performance Tips

1. **Use indexes** (already created in schema)
2. **Filter on `is_active = TRUE`** to exclude discontinued materials
3. **Cache frequently used queries** (see `js/supabase-client.js`)
4. **Use materialized views** for complex aggregations

### Data Quality Ratings

| Rating | Description | Example |
|--------|-------------|---------|
| ⭐ 1 | Generic estimate from literature | Industry-wide average from textbook |
| ⭐⭐ 2 | Regional database average | AusLCI generic data |
| ⭐⭐⭐ 3 | Industry-average EPD | EPD for "typical concrete" in Australia |
| ⭐⭐⭐⭐ 4 | Manufacturer-specific non-EPD | Manufacturer's published data (not EPD verified) |
| ⭐⭐⭐⭐⭐ 5 | Product-specific EPD | EPD Australasia verified for specific product |

---

## Support & Resources

### Documentation
- **EPD Australasia**: https://epd-australasia.com
- **Supabase Docs**: https://supabase.com/docs
- **PostgreSQL Docs**: https://www.postgresql.org/docs/

### File References
- **SQL Schema**: `backup_unified_materials_schema.sql`
- **CSV Template**: `backup_unified_materials_template.csv`
- **JSON Sample**: `backup_unified_materials_sample.json`
- **Integration Guide**: `SUPABASE_INTEGRATION.md`

### Contact
For issues with CarbonConstruct integration, check:
- `js/supabase-client.js` (client library)
- `js/materials-database.js` (fallback data)
- Browser console (F12) for debugging

---

## Summary: Key Columns at a Glance

### 🔴 Required Fields (Cannot be NULL)
- `name` - Material name
- `category` - Material category
- `embodied_carbon` - kg CO2-e per unit
- `unit` - Measurement unit
- `source` - Data source

### 🟡 Important Optional Fields
- `manufacturer` - Brand/producer
- `epd_number` - EPD reference
- `is_epd_verified` - TRUE for EPD Australasia
- `australian_made` - TRUE for local
- `typical_cost` - Cost per unit
- `tags` - Search tags

### 🟢 Advanced Fields
- `carbon_sequestration` - For timber (negative values)
- `recycled_content` - % recycled material
- `data_quality` - 1-5 star rating
- `regional_availability` - States where available

---

**You now have everything needed to set up, populate, and query the unified_materials database!** 🚀

**This database is your competitive advantage - 4,500+ materials vs competitors with 20-50!**
