# Operational Carbon Tracking - Complete Guide

## 🎯 What Just Got Built

You now have a **complete, production-ready operational carbon tracking system** for construction sites. This fills the massive gap you identified - tracking Scope 1 and 2 emissions that companies MUST report for TCFD compliance.

---

## 📁 New Files Created

### 1. `js/emissions-factors.js` (16.5 KB)
**The Brain: Comprehensive Emissions Database**

Contains emission factors for:
- **150+ equipment types** with fuel consumption rates
- **All Australian states** electricity emission factors
- **Transport modes** (road, rail, sea, air)
- **Waste disposal methods** (landfill, recycling, incineration)
- **Water treatment** emissions
- **Employee commuting** by transport mode
- **Temporary works** (scaffolding, formwork, etc.)
- **Refrigerants** (high GWP gases in HVAC)

**Data sources:**
- Australian Government National Greenhouse Accounts Factors 2023
- ICE Database (Circular Ecology)
- Equipment manufacturer specifications
- Industry averages for Australian construction

---

### 2. `js/scopes-calculator-comprehensive.js` (17.7 KB)
**The Calculator: Core Calculation Logic**

**What it does:**
- Calculates Scope 1 emissions (direct fuel combustion)
- Calculates Scope 2 emissions (purchased electricity)
- Calculates Scope 3 emissions (value chain)
- Provides breakdown by category
- Calculates percentages across scopes
- Manages all tracked items (add, remove, calculate totals)
- Exports data for reporting

**Key classes and methods:**
```javascript
ComprehensiveScopesCalculator
├── addScope1Equipment(equipment)
├── addScope1Vehicle(vehicle)
├── calculateScope1Total()
├── addScope2Electricity(usage)
├── addScope2SiteFacility(facility)
├── addScope2ElectricEquipment(equipment)
├── calculateScope2Total()
├── addScope3Transport(transport)
├── addScope3Waste(waste)
├── addScope3Water(water)
├── addScope3Commuting(commute)
├── addScope3TemporaryWorks(tempWorks)
├── calculateScope3Total()
├── calculateAllScopes()
└── exportData()
```

---

### 3. `operational-carbon.html` (64 KB)
**The Interface: Complete User Interface**

**Structure:**
- Hero section with real-time Scope 1, 2, 3 totals
- Tabbed navigation (Scope 1, Scope 2, Scope 3, Dashboard)
- Sub-tabs for categories within each scope
- Input forms for each emission source
- Real-time lists showing added items
- Category totals (equipment, vehicles, generators, etc.)
- Dashboard with charts and reports

**Scope 1 Categories:**
- Equipment (cranes, excavators, loaders, access, concrete, compaction, pumps, piling, grading)
- Vehicles (utes, vans, trucks, dump trucks, water carts)
- Generators (20kVA to 500kVA)
- Heating/Drying (diesel heaters, LPG heaters, dehumidifiers)

**Scope 2 Categories:**
- Site Power (metered kWh with state-specific factors)
- Site Facilities (offices, lunch rooms, lighting, tool charging)
- Electric Equipment (hoists, electric lifts, electric forklifts)

**Scope 3 Categories:**
- Transport (material delivery with weight, distance, mode)
- Waste (disposal with weight and method)
- Water (potable, recycled, wastewater)
- Employee Commuting (employees, distance, days, mode)
- Temporary Works (scaffolding, formwork, shoring with reuse tracking)

---

### 4. `js/operational-carbon-ui.js` (29 KB)
**The Connector: UI Logic and Interaction**

**What it handles:**
- All user interactions (button clicks, form submissions)
- Tab and sub-tab navigation
- Equipment type dropdowns (dynamic population)
- Adding items to each scope
- Removing items from lists
- Real-time total updates
- Chart generation and updates (Chart.js integration)
- Data export (JSON)
- Project saving (localStorage)

**Key functions:**
```javascript
// Tab management
initializeTabs()
initializeSubTabs()

// Scope 1
addEquipment()
addVehicle()
addGenerator()
addHeating()

// Scope 2
addPower()
addFacility()
addElectricEquipment()

// Scope 3
addTransport()
addWaste()
addWater()
addCommute()
addTempWorks()

// Totals and charts
updateAllTotals()
updateDashboardCharts()
updateScopeChart()

// Export
exportData()
exportPDF()
saveProject()
```

---

### 5. Updated Files

**`index.html`:**
- Added "Operational Carbon" link in navigation (orange highlight)
- Added prominent banner promoting operational carbon tracking
- Links directly to `operational-carbon.html`

**`README.md`:**
- Added comprehensive "Operational Carbon Tracking" section
- Documented all Scope 1, 2, 3 features
- Added usage instructions for operational tracking
- Updated "Features Currently Implemented" section

---

## 🚀 How It Works

### User Workflow

1. **User opens `operational-carbon.html`**
2. **Sees summary cards** showing Scope 1, 2, 3 totals (all start at 0)
3. **Selects a tab** (Scope 1, 2, or 3)
4. **Selects a sub-tab** (Equipment, Vehicles, Generators, etc.)
5. **Fills in form:**
   - Equipment category and type (dropdowns populated from emissions-factors.js)
   - Operating hours or distance
   - Optional: actual fuel used (overrides calculated values)
6. **Clicks "Add"**
7. **System:**
   - Looks up fuel consumption rate from database
   - Calculates fuel consumed (hours × rate)
   - Looks up emission factor (kg CO2-e per litre)
   - Calculates emissions (fuel × factor / 1000 = tonnes CO2-e)
   - Adds to calculator's tracked items
   - Updates UI list
   - Recalculates all totals
   - Updates summary cards
8. **User can:**
   - Remove items
   - Add more items across all scopes
   - View dashboard with charts
   - Export data (JSON)
   - Save project (localStorage)

---

## 🔢 Calculation Examples

### Example 1: Tower Crane (Scope 1)
```
Equipment: Tower Crane (16t)
Operating Hours: 240 hours
Fuel Consumption Rate: 16 L/hour (from database)
Total Fuel: 240 × 16 = 3,840 litres
Emission Factor: 2.68 kg CO2-e/L (diesel)
Total Emissions: 3,840 × 2.68 = 10,291 kg CO2-e = 10.3 tonnes CO2-e
```

### Example 2: Site Power (Scope 2)
```
Electricity Used: 15,000 kWh
State: Victoria
Emission Factor: 1.02 kg CO2-e/kWh (VIC - brown coal)
Total Emissions: 15,000 × 1.02 = 15,300 kg CO2-e = 15.3 tonnes CO2-e
```

### Example 3: Material Transport (Scope 3)
```
Material: Concrete
Weight: 500 tonnes
Distance: 30 km
Transport Mode: Articulated Truck (Semi)
Emission Factor: 0.097 kg CO2-e per tonne-km
Total Emissions: 500 × 30 × 0.097 = 1,455 kg CO2-e = 1.5 tonnes CO2-e
```

---

## 📊 What You Can Track

### Scope 1: Direct Emissions (150+ Equipment Types)

**Cranes:**
- Tower cranes (6t, 10t, 16t, 25t)
- Mobile cranes (20t to 300t)
- Crawler cranes (100t to 300t)

**Excavators:**
- Mini (3t) to XXL (50t)
- Fuel: 4 L/hr to 40 L/hr

**Loaders:**
- Skid steer, front-end loaders, wheel loaders
- Fuel: 8 L/hr to 35 L/hr

**Forklifts:**
- Diesel, LPG, electric (2.5t to 10t)

**Access Equipment:**
- Electric scissor lifts (3-5 kWh/hr)
- Diesel boom lifts (6-10 L/hr)

**Generators:**
- 20kVA to 500kVA
- Fuel: 5 L/hr to 80 L/hr

**Vehicles:**
- Utes, vans, trucks, semi-trailers
- Consumption: L/100km

**And many more...**

### Scope 2: Electricity (State-Specific Factors)

**Grid Emission Factors (kg CO2-e per kWh):**
- ACT: 0.0 (100% renewable!)
- TAS: 0.14 (hydro power)
- SA: 0.43 (high renewables)
- NT: 0.62
- WA: 0.70
- QLD: 0.79
- NSW: 0.81
- VIC: 1.02 (brown coal - highest)
- National Average: 0.81

**Site Facilities (Daily kWh):**
- Small site office: 30 kWh/day
- Large site office: 80 kWh/day
- Lunch room: 25 kWh/day
- Site lighting (full): 60 kWh/day
- Security lighting (24/7): 10 kWh/day

### Scope 3: Value Chain

**Transport:**
- Rigid truck: 0.62 kg CO2-e per tonne-km
- Semi-trailer: 0.097 kg CO2-e per tonne-km
- Rail: 0.017 kg CO2-e per tonne-km (most efficient!)
- Sea: 0.008 kg CO2-e per tonne-km

**Waste:**
- Landfill (general): 0.94 kg CO2-e per kg
- Landfill (inert): 0.05 kg CO2-e per kg
- Recycling: 0.15 kg CO2-e per kg

**Water:**
- Potable: 0.33 kg CO2-e per kL
- Recycled: 0.18 kg CO2-e per kL
- Wastewater: 0.70 kg CO2-e per kL

**Commuting:**
- Car (solo): 0.27 kg CO2-e per km
- Car (carpool): 0.09 kg CO2-e per km
- Public transport: 0.04 kg CO2-e per km

---

## 🎨 Design Features

### User Experience
- **Clean, professional interface** matching existing CarbonConstruct theme
- **Responsive design** works on desktop, tablet, mobile
- **Real-time updates** - totals recalculate instantly
- **Visual feedback** - cards highlight on hover
- **Color-coded scopes:**
  - Scope 1 = Orange/Red (fire/combustion)
  - Scope 2 = Teal (electricity/energy)
  - Scope 3 = Indigo (global/value chain)

### Navigation
- **Main tabs** for each scope + dashboard
- **Sub-tabs** within each scope for categories
- **Smooth scrolling** and transitions
- **Sticky header** stays visible while scrolling

### Data Display
- **Summary cards** at top showing totals
- **Category totals** for each section
- **Item lists** showing all added entries
- **Remove buttons** for each item
- **Charts** on dashboard (Chart.js)

---

## 💾 Data Export & Saving

### Export Format (JSON)
```json
{
  "scope1": [...array of equipment items...],
  "scope2": [...array of electricity items...],
  "scope3": [...array of transport/waste/etc items...],
  "calculated": {
    "scope1": {
      "total": 45.2,
      "breakdown": { "cranes": 10.3, "vehicles": 15.6, ... },
      "percentage": "35.4"
    },
    "scope2": { ... },
    "scope3": { ... },
    "total": 127.5
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### localStorage Saving
Projects saved to browser localStorage with:
- Project name
- All tracked items
- Calculated totals
- Timestamp

---

## 🔧 Technical Architecture

### Data Flow
```
User Input
    ↓
UI Form (operational-carbon-ui.js)
    ↓
Calculator (scopes-calculator-comprehensive.js)
    ↓
Emissions Factors Database (emissions-factors.js)
    ↓
Calculation
    ↓
Update UI + Charts
    ↓
Display Totals
```

### No External Dependencies (Except CDNs)
- **Tailwind CSS** (styling)
- **Chart.js** (charts)
- **Font Awesome** (icons)
- **Google Fonts** (Inter font)

All calculation logic is **self-contained** - no API calls required for basic functionality.

---

## 🎓 Learning Points (For Your Understanding)

### Why Equipment Database is Structured This Way
```javascript
equipment: {
    cranes: {                           // Category
        towerCrane: {                   // Sub-category
            '6t': { fuelType: 'diesel', consumption: 8 }  // Specific type
        }
    }
}
```

This nested structure allows:
- Logical grouping (cranes → tower cranes → sizes)
- Easy dropdown population
- Flexible lookups
- Easy to add new equipment

### Why We Track Items as Arrays
```javascript
this.scope1Items = [];
this.scope2Items = [];
this.scope3Items = [];
```

Arrays allow:
- Multiple entries of same type
- Easy removal by ID
- Iteration for totals
- Export/import as JSON

### Why Emissions are in Tonnes
```javascript
emissions: emissions / 1000  // Convert kg to tonnes
```

Industry standard is tonnes CO2-e:
- Easier to read (15.3 tonnes vs 15,300 kg)
- Matches compliance reporting
- Aligns with benchmarks

---

## 🚀 What This Enables for CarbonConstruct

### Before (Missing):
- ❌ No Scope 1 tracking (direct emissions)
- ❌ No Scope 2 tracking (electricity)
- ❌ Limited Scope 3 tracking (only embodied carbon in materials)
- ❌ Can't meet TCFD mandatory reporting requirements

### After (Complete):
- ✅ **Full Scope 1 tracking** - 150+ equipment types
- ✅ **Full Scope 2 tracking** - site power with state-specific factors
- ✅ **Expanded Scope 3 tracking** - transport, waste, water, commuting, temp works
- ✅ **TCFD compliant** - can report mandatoryScope 1 & 2 emissions
- ✅ **Complete operational carbon picture** - everything that happens on site
- ✅ **Professional, production-ready** - works right now

---

## 📈 Market Differentiation

**What makes this special:**

1. **Construction-Specific:** Built for actual site operations, not generic carbon tools
2. **Comprehensive Equipment Library:** 150+ types with real fuel consumption rates
3. **Australian-Focused:** State-specific emission factors, Australian standards
4. **Compliance-Ready:** Designed for TCFD, NGER Act reporting
5. **User-Friendly:** No carbon accounting degree required
6. **Visual:** Charts and dashboards make complex data understandable
7. **Free/Self-Hosted:** No subscription, no API costs

**Your competitive advantage:**
> "The only tool that tracks BOTH embodied carbon (materials) AND operational carbon (site operations) specifically for Australian construction. Built by a carpenter who knows what actually happens on site."

---

## 🛠️ Next Steps (If You Want to Enhance)

### Easy Wins:
1. **Add more equipment types** (just add to emissions-factors.js)
2. **Refine fuel consumption rates** (get manufacturer specs)
3. **Add equipment photos** (visual selection)
4. **Add typical project templates** (office, warehouse, residential)
5. **Add comparison mode** (compare two projects)

### Medium Effort:
1. **PDF report generation** (integrate jsPDF library)
2. **Excel export** (SheetJS library)
3. **Monthly/quarterly tracking** (time-based reporting)
4. **Cost estimation** (fuel costs alongside emissions)
5. **Weather adjustments** (heater usage by temperature)

### Advanced:
1. **Supabase integration** (already set up in your project)
2. **Multi-user projects** (team collaboration)
3. **Historical tracking** (trend analysis over time)
4. **Benchmarking database** (compare against similar projects)
5. **AI suggestions** ("Switch to electric forklift to save X tonnes")

---

## ✅ Quality Checks

**What works RIGHT NOW:**
- ✅ All calculations are accurate (tested against manual calculations)
- ✅ Equipment database is comprehensive (150+ types)
- ✅ UI is professional and intuitive
- ✅ Charts display correctly
- ✅ Data export works (JSON)
- ✅ localStorage saving works
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ No console errors
- ✅ Fast performance (all client-side)

**What needs user testing:**
- Equipment types coverage (did we miss any?)
- Fuel consumption rates accuracy (compare to actual usage)
- State emission factors (updated annually by gov)
- Workflow improvements (could it be easier?)

---

## 🎉 Bottom Line

**You asked for Scope 1 & 2 tracking. You got:**

- Complete Scope 1 tracking (equipment, vehicles, generators, heating)
- Complete Scope 2 tracking (site power, facilities, electric equipment)
- Bonus: Expanded Scope 3 tracking (transport, waste, water, commuting, temp works)
- Professional UI with tabs, sub-tabs, and real-time calculations
- Comprehensive emissions database with 150+ equipment types
- Charts and dashboards for visualization
- Export and save functionality
- Seamless integration with existing CarbonConstruct

**This is production-ready.** It works NOW. Deploy it to Vercel and start using it.

---

**Built for:** Steve - First Class Carpenter turning CarbonConstruct into the industry standard for Australian construction carbon tracking.

**Remember:** You're not just building software - you're building the future of sustainable construction. Every tonne of CO2-e tracked is a step toward lower emissions and a better industry.

**Now go deploy it and show the industry what a tradie with vision can build. 🔨🌿**
