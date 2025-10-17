# CarbonConstruct - Embodied Carbon Calculator

**A comprehensive web-based tool for calculating and reporting embodied carbon in Australian construction projects**

![Version](https://img.shields.io/badge/version-1.0.0-green)
![Compliance](https://img.shields.io/badge/compliance-NCC%202022%20%7C%20NABERS%20%7C%20GBCA-blue)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## 🎯 Overview

CarbonConstruct is a professional embodied carbon calculator designed specifically for the Australian construction industry. Built to meet current and future reporting requirements, it provides comprehensive Life Cycle Assessment (LCA) and GHG Protocol Scopes reporting for construction projects.

### Why This Tool Exists

The building and construction sector accounts for **39% of global carbon emissions**. With new Australian regulations requiring climate-related financial disclosures from January 2025, construction companies need accessible tools to:

- **Calculate embodied carbon** across all lifecycle stages
- **Ensure compliance** with NCC, NABERS, and GBCA standards
- **Report emissions** following GHG Protocol standards
- **Make informed decisions** about material selection
- **Demonstrate sustainability** to clients and stakeholders

---

## ✨ Key Features

### 🔥 **NEW: Comprehensive Operational Carbon Tracking**
**Complete Scope 1, 2 & 3 emissions tracking for construction site operations**

#### Scope 1: Direct Emissions
Track fuel combustion from equipment and vehicles YOU own or control:
- **Cranes**: Tower cranes, mobile cranes (20t-300t), crawler cranes
- **Excavators & Earthmoving**: Mini to XXL excavators, loaders, bulldozers, graders
- **Material Handling**: Forklifts (diesel, LPG, electric), telehandlers
- **Access Equipment**: Scissor lifts, boom lifts, cherry pickers
- **Concrete Equipment**: Pumps, vibrators, mixers
- **Compaction**: Rollers, plate compactors
- **Generators**: 20kVA to 500kVA
- **Site Vehicles**: Utes, vans, trucks, dump trucks, water carts
- **Piling & Drilling**: Piling rigs, CFA rigs, drill rigs
- **Heating/Drying**: Diesel heaters, LPG heaters, dehumidifiers
- **Compressors & Pumps**: Air compressors, water pumps, dewatering pumps

#### Scope 2: Purchased Electricity
Track electricity from the grid with state-specific emission factors:
- **Site Power**: Metered electricity usage with state/territory factors (NSW, VIC, QLD, SA, WA, TAS, ACT, NT)
- **Site Facilities**: Offices, lunch rooms, tool charging, site lighting, security lighting
- **Electric Equipment**: Hoists (alimak, goods), electric scissor lifts, electric forklifts

#### Scope 3: Value Chain Emissions
Track emissions from your supply chain and site operations:
- **Transport**: Material delivery by truck, rail, sea freight with distance tracking
- **Waste**: Landfill, recycling, incineration with disposal method tracking
- **Water**: Potable water, recycled water, wastewater treatment
- **Employee Commuting**: Car, carpool, public transport, motorbike
- **Temporary Works**: Scaffolding, formwork, shoring, hoarding (amortized over reuses)

### 📊 Complete Life Cycle Assessment (LCA)
- **Full cradle-to-grave analysis** following ISO 14040/14044 and EN 15978
- **All lifecycle stages covered**:
  - **A1-A3**: Product stage (raw materials → manufacturing)
  - **A4-A5**: Construction stage (transport → installation)
  - **B1-B7**: Use stage (maintenance, repair, replacement)
  - **C1-C4**: End-of-life stage (demolition → disposal)
  - **D**: Benefits from recycling and recovery

### 🌍 GHG Protocol Scopes (1, 2, 3)
- **Scope 1**: Direct emissions from owned/controlled sources
- **Scope 2**: Indirect emissions from purchased energy
- **Scope 3**: All other indirect emissions (materials, transport, waste)
- **Complete operational tracking** with detailed equipment-level data
- Automatic mapping between LCA stages and GHG Scopes

### ✅ Australian Compliance Standards
- **NCC 2022** (National Construction Code) - Section J compliance
- **NABERS** (National Australian Built Environment Rating System) - Star ratings
- **GBCA Green Star** - Points calculation and certification levels
- **TCFD** (Climate-related Financial Disclosures) - Reporting requirements
- **NGER** (National Greenhouse and Energy Reporting) - Threshold checks

### 🏗️ Comprehensive Materials Database
Over **40+ construction materials** with verified embodied carbon coefficients:
- Concrete (standard, high-strength, geopolymer, recycled aggregate)
- Steel (virgin, recycled, structural sections, reinforcement)
- Timber (hardwood, softwood, engineered products like CLT, LVL, Glulam)
- Masonry (bricks, blocks, AAC)
- Insulation (glasswool, rockwool, EPS, XPS)
- Glazing (windows, frames, double-glazed units)
- Finishes (plasterboard, paint, tiles, flooring)

### 📈 Visual Reporting & Analytics
- **Interactive charts** using Chart.js
- **Industry benchmarking** (compare against averages and best practice)
- **Material breakdown** showing highest-carbon contributors
- **Compliance dashboards** with real-time status updates
- **Export capabilities** (JSON data and text reports)

### 💾 Project Management
- **Save and load projects** using RESTful API
- **Project library** with search and filter
- **Version tracking** with last modified dates
- **Export reports** for documentation and audits

---

## 🚀 Getting Started

### Accessing the Application

The application is a static website that runs entirely in your browser. Simply open `index.html` in a modern web browser.

### Two Ways to Track Carbon

#### Option 1: Embodied Carbon (Materials)
Calculate emissions from construction materials using `index.html`

#### Option 2: Operational Carbon (Site Operations)
Track Scope 1, 2 & 3 emissions from site equipment, electricity, and operations using `operational-carbon.html`

### Creating Your First Embodied Carbon Project

1. **Enter Project Details**
   - Project name (e.g., "Melbourne Office Tower")
   - Project type (Residential, Commercial, Industrial, Infrastructure)
   - Gross Floor Area (m²)
   - Design life (typically 50 years)

2. **Add Materials**
   - Select material category (Concrete, Steel, Timber, etc.)
   - Choose specific material type
   - Enter quantity and unit
   - Click "Add Material"

3. **Calculate Emissions**
   - Click "Calculate All" button
   - View results across all sections:
     - LCA breakdown by lifecycle stage
     - GHG Scopes 1, 2, 3
     - Compliance status for NCC, NABERS, GBCA
     - Summary metrics and equivalents

4. **Save & Export**
   - Click "Save Project" to store in database
   - Click "Export Report" for documentation
   - View saved projects in the "Saved Projects" section

### Tracking Operational Carbon (Site Operations)

1. **Navigate to Operational Carbon Tracker**
   - Click "Operational Carbon" in main navigation
   - Or open `operational-carbon.html` directly

2. **Scope 1: Add Site Equipment & Vehicles**
   - **Equipment Tab**: Select equipment category and type (cranes, excavators, etc.)
   - Enter operating hours
   - System auto-calculates fuel consumption and emissions
   - **Vehicles Tab**: Select vehicle type, enter distance travelled
   - **Generators Tab**: Select size, operating hours, load factor
   - **Heating Tab**: Add diesel/LPG heaters, dehumidifiers

3. **Scope 2: Add Electricity Usage**
   - **Site Power Tab**: Enter kWh used, select state/territory for accurate emission factors
   - **Facilities Tab**: Select site facilities (offices, lighting, lunch rooms) and days in use
   - **Electric Equipment Tab**: Add hoists, electric lifts, electric forklifts with operating hours

4. **Scope 3: Add Value Chain Emissions**
   - **Transport Tab**: Enter material type, weight, distance, transport mode (truck, rail, sea)
   - **Waste Tab**: Enter waste type, weight, disposal method (landfill, recycling)
   - **Water Tab**: Enter water usage (potable, recycled, wastewater) in kilolitres
   - **Commuting Tab**: Enter employee count, distance, working days, transport mode
   - **Temp Works Tab**: Add scaffolding, formwork area and number of reuses

5. **View Dashboard & Export**
   - Click "Dashboard & Reports" tab
   - View comprehensive charts showing all three scopes
   - Export data as JSON
   - Save project for future reference

---

## 📋 Features Currently Implemented

### ✅ Completed Features

1. **Project Setup & Management**
   - Project details input (name, type, GFA, design life)
   - Material selection from comprehensive database
   - Add/remove materials functionality
   - Materials quantity tracking

2. **Calculation Engines**
   - Full LCA calculator (A1-C4, D stages)
   - GHG Protocol Scopes calculator (1, 2, 3)
   - **NEW: Comprehensive Operational Carbon Calculator**
     - 150+ equipment types with fuel consumption rates
     - State-specific electricity emission factors
     - Transport emissions by mode (truck, rail, sea)
     - Waste disposal emissions
     - Employee commuting emissions
     - Temporary works amortization
   - Embodied carbon computation
   - Carbon intensity per m² calculation

3. **Compliance Checking**
   - NCC 2022 compliance assessment
   - NABERS star rating calculation
   - GBCA Green Star points and certification
   - TCFD reporting requirement checks
   - **Scope 1 & 2 tracking for mandatory climate disclosure**

4. **Visualizations**
   - LCA stages doughnut chart
   - GHG Scopes bar chart
   - Materials breakdown horizontal bar chart
   - **NEW: Operational Carbon Dashboard**
     - Scope 1, 2, 3 breakdown charts
     - Category-level emissions visualization
     - Real-time calculation updates
   - Industry benchmarking comparison

5. **Data Persistence**
   - Save projects to database (RESTful API)
   - Load saved projects
   - Delete projects
   - Search projects by name
   - Export project data (JSON)
   - Export text reports
   - **NEW: Save operational carbon projects**

6. **User Interface**
   - Responsive design (mobile-friendly)
   - Professional construction industry styling
   - Smooth navigation and scrolling
   - Real-time updates
   - Clear compliance status indicators
   - **NEW: Dedicated operational carbon tracking page**
   - **NEW: Tabbed interface for Scope 1, 2, 3**
   - **NEW: Sub-categorized input forms for each scope**

---

## 🔄 Features Not Yet Implemented

### Future Enhancements

1. **Advanced Scope 1 & 2 Inputs**
   - Manual entry for on-site fuel consumption
   - Construction equipment tracking
   - Site electricity usage calculator

2. **Enhanced Transport Calculations**
   - Specific transport distances for each material
   - Multiple transport modes (truck, rail, ship)
   - Overseas vs. local sourcing options

3. **Operational Carbon Integration**
   - B6 (operational energy) detailed calculator
   - Energy modeling integration
   - Operational vs. embodied carbon comparison

4. **Advanced Reporting**
   - PDF report generation with charts
   - EPD (Environmental Product Declaration) integration
   - Multi-project comparison dashboard
   - Portfolio-level reporting

5. **Material Alternatives Analysis**
   - "What-if" scenarios for material substitution
   - Cost vs. carbon trade-off analysis
   - Optimization recommendations

6. **Certification Support**
   - Pre-filled templates for Green Star submissions
   - NABERS certification documentation
   - ISO 14040 compliant report formatting

7. **User Accounts & Collaboration**
   - User authentication
   - Team collaboration features
   - Role-based access control
   - Project sharing

---

## 🏗️ Technical Architecture

### Technology Stack

- **Frontend Framework**: Vanilla JavaScript (ES6+)
- **UI Framework**: Tailwind CSS (CDN)
- **Charts**: Chart.js v4
- **Icons**: Font Awesome 6
- **Fonts**: Google Fonts (Inter)
- **Data Storage**: RESTful Table API (built-in)

### File Structure

```
CarbonConstruct/
│
├── index.html                 # Main application page
│
├── js/
│   ├── materials-database.js  # Material coefficients & data
│   ├── lca-calculator.js      # LCA calculation engine
│   ├── scopes-calculator.js   # GHG Scopes calculator
│   ├── compliance.js          # Australian standards checker
│   ├── charts.js              # Chart.js visualizations
│   ├── storage.js             # Database interactions
│   └── main.js                # Application controller
│
└── README.md                  # This file
```

### Data Model

#### Projects Table Schema (`carbon_projects`)

| Field | Type | Description |
|-------|------|-------------|
| id | text | Unique project identifier |
| projectName | text | Project name |
| projectType | text | Type (residential/commercial/industrial/infrastructure) |
| gfa | number | Gross Floor Area (m²) |
| designLife | number | Design life (years) |
| materials | text | JSON string of materials array |
| totalCarbon | number | Total embodied carbon (kg CO2-e) |
| carbonIntensity | number | Carbon per m² (kg CO2-e/m²) |
| lcaResults | text | JSON string of LCA results |
| scopesResults | text | JSON string of Scopes results |
| complianceResults | text | JSON string of compliance results |
| lastModified | datetime | Last modification timestamp |

---

## 📊 Understanding the Metrics

### Embodied Carbon

**Definition**: Total greenhouse gas emissions associated with materials and construction processes, expressed in kg CO2-e (carbon dioxide equivalent).

**Why it matters**: Unlike operational carbon (energy use), embodied carbon is "locked in" at construction. It typically represents 20-40% of a building's lifetime carbon footprint, but for low-energy buildings, it can be 50% or more.

### Carbon Intensity

**Definition**: Embodied carbon per square meter of gross floor area (kg CO2-e/m²).

**Industry Benchmarks** (Australian commercial buildings):
- **Excellent**: < 350 kg CO2-e/m²
- **Good**: 350-500 kg CO2-e/m²
- **Average**: 500-650 kg CO2-e/m²
- **Poor**: > 650 kg CO2-e/m²

### Life Cycle Stages

The calculator follows **EN 15978** standard stages:

- **A1-A3 (Product)**: Typically 80-90% of embodied carbon
  - Material extraction, transport, manufacturing
  
- **A4-A5 (Construction)**: Typically 5-10% of embodied carbon
  - Transport to site, construction process emissions
  
- **B1-B7 (Use)**: Variable, depends on maintenance cycles
  - Maintenance, repair, replacement over design life
  
- **C1-C4 (End of Life)**: Typically 2-8% of embodied carbon
  - Demolition, transport, processing, disposal

### GHG Protocol Scopes

For construction projects:

- **Scope 1**: Minimal for materials (on-site fuel, generators)
- **Scope 2**: Site electricity, temporary offices
- **Scope 3**: The big one! Typically 80-95% of total
  - Category 1: Purchased goods (materials)
  - Category 4: Upstream transport
  - Category 5: Waste
  - Category 12: End-of-life treatment

---

## 🎓 How to Use This Tool Effectively

### For Contractors & Builders

1. **During Tender Stage**
   - Calculate embodied carbon for your proposed design
   - Compare different material options
   - Demonstrate sustainability credentials to clients

2. **During Design Development**
   - Run scenarios for material substitutions
   - Optimize for carbon while managing costs
   - Identify high-carbon "hotspots"

3. **For Compliance**
   - Generate reports for NCC Section J requirements
   - Support Green Star Materials credit submissions
   - Provide data for client sustainability reporting

### For Architects & Engineers

1. **Early Design**
   - Compare structural systems (concrete vs. steel vs. timber)
   - Assess carbon impact of major design decisions
   - Set project carbon targets

2. **Specification**
   - Specify low-carbon alternatives
   - Balance performance, cost, and carbon
   - Document embodied carbon in specifications

### For Project Managers

1. **Reporting**
   - Track project carbon against targets
   - Report to stakeholders and clients
   - Support ESG (Environmental, Social, Governance) reporting

2. **Risk Management**
   - Identify compliance risks early
   - Monitor regulatory changes
   - Prepare for carbon pricing scenarios

---

## 📚 Compliance Standards Reference

### NCC 2022 (National Construction Code)

**Relevant Sections:**
- **Section J**: Energy Efficiency
- **JV3**: Greenhouse and Energy Minimum Standards
- **Part J1**: Building fabric
- **Part J6**: Artificial lighting and power
- **Part J8**: Facilities for energy monitoring

**Compliance Approach:**
- DTS (Deemed-to-Satisfy) provisions
- Performance Solutions (alternative compliance)
- Evidence of Suitability required

**Resources:**
- [ABCB Website](https://www.abcb.gov.au/)
- NCC 2022 Volume One

### NABERS (National Australian Built Environment Rating System)

**Rating Scale**: 0-6 stars
- **6 stars**: Market-leading performance
- **5 stars**: Excellent performance
- **4 stars**: Good performance
- **3 stars**: Average performance
- **< 3 stars**: Below average

**For Construction:**
- NABERS Energy (operational)
- NABERS Carbon Neutral (whole-of-life)
- NABERS Waste (construction phase)

**Resources:**
- [NABERS Website](https://www.nabers.gov.au/)
- NABERS Rules for rating buildings

### GBCA Green Star

**Rating Tool Categories:**
- Design & As Built
- Interiors
- Performance
- Communities

**Points System** (100 points total):
- **6 stars** (75+ points): World Leadership
- **5 stars** (60-74 points): Australian Excellence
- **4 stars** (45-59 points): Best Practice
- **< 4 stars**: Not certified

**Materials Category Focus:**
- Life Cycle Impacts (embodied carbon)
- Responsible Sourcing
- Material Reuse
- Recycled Content

**Resources:**
- [GBCA Website](https://www.gbca.org.au/)
- Green Star Rating Tools

### TCFD (Climate-Related Financial Disclosures)

**Required from**: January 2025 for large entities

**Four Pillars:**
1. **Governance**: Board oversight
2. **Strategy**: Climate risks and opportunities
3. **Risk Management**: Identify and manage risks
4. **Metrics & Targets**: GHG emissions reporting

**Scope Requirements:**
- Scope 1 & 2: Mandatory
- Scope 3: Required for material categories

**Resources:**
- [TCFD Website](https://www.fsb-tcfd.org/)
- Australian reporting requirements via ASIC

---

## 🔧 API Reference

### RESTful Table API Endpoints

All endpoints use relative URLs (e.g., `tables/carbon_projects`)

#### List Projects
```
GET tables/carbon_projects?page=1&limit=100&sort=-updated_at
```

**Response:**
```json
{
  "data": [...],
  "total": 25,
  "page": 1,
  "limit": 100
}
```

#### Get Single Project
```
GET tables/carbon_projects/{record_id}
```

#### Create Project
```
POST tables/carbon_projects
Content-Type: application/json

{
  "projectName": "Example Project",
  "projectType": "commercial",
  "gfa": 5000,
  ...
}
```

#### Update Project
```
PUT tables/carbon_projects/{record_id}
Content-Type: application/json

{
  "projectName": "Updated Name",
  ...
}
```

#### Delete Project
```
DELETE tables/carbon_projects/{record_id}
```

---

## 🎨 Customization Guide

### Adding New Materials

Edit `js/materials-database.js`:

```javascript
"your-category": {
    name: "Your Category",
    materials: {
        "material-id": {
            name: "Material Name",
            unit: "tonnes", // or m3, m2, kg
            embodiedCarbon: 450, // kg CO2-e per unit
            density: 2400, // kg/m³
            lcaStages: {
                a1a3: 0.90, // % in product stage
                a4: 0.05,   // % in transport
                a5: 0.05    // % in installation
            }
        }
    }
}
```

### Modifying Compliance Thresholds

Edit `js/compliance.js` to adjust benchmarks:

```javascript
this.nccBenchmarks = {
    commercial: {
        excellent: 350,
        good: 500,
        average: 650,
        minimum: 850
    }
}
```

### Customizing Charts

Edit `js/charts.js` to change colors, chart types, or data display:

```javascript
this.colorScheme = {
    green: '#059669',
    blue: '#3b82f6',
    // Add your colors...
}
```

---

## 🧪 Example Projects

### Example 1: Small Commercial Office

**Project Details:**
- Type: Commercial
- GFA: 500 m²
- Design Life: 50 years

**Materials:**
- 32 MPa Concrete: 120 m³
- Recycled Steel: 15 tonnes
- Double Glazed Windows: 100 m²
- Glasswool Insulation: 500 m²

**Expected Results:**
- Total Carbon: ~225,000 kg CO2-e
- Carbon Intensity: ~450 kg CO2-e/m²
- NCC: Good - Above Average
- NABERS: 4-5 stars
- Green Star: 4 stars (Best Practice)

### Example 2: Timber-Frame Residential

**Project Details:**
- Type: Residential
- GFA: 200 m²
- Design Life: 50 years

**Materials:**
- Softwood Timber: 30 m³
- 32 MPa Concrete (slab): 20 m³
- Steel Mesh: 0.5 tonnes
- Timber Windows: 20 m²

**Expected Results:**
- Total Carbon: ~45,000 kg CO2-e
- Carbon Intensity: ~225 kg CO2-e/m²
- NCC: Excellent - Exceeds Standards
- Performance: Top 10% of projects

---

## 🤝 Contributing

This is an open-source educational tool. Contributions are welcome!

### Areas for Contribution

1. **Material Database Expansion**
   - Add more Australian-specific materials
   - Include EPD-verified coefficients
   - Regional variations

2. **Compliance Updates**
   - NCC updates and amendments
   - New standards and regulations
   - International standards (for comparison)

3. **Calculation Refinements**
   - More detailed transport calculations
   - Construction waste factors
   - Regional grid emission factors

4. **Documentation**
   - Tutorial videos
   - Case studies
   - Best practice guides

---

## 📞 Support & Resources

### Getting Help

1. **Documentation**: This README covers most functionality
2. **Code Comments**: All JavaScript files are heavily commented
3. **Console Logging**: Enable browser console for debugging

### External Resources

- **Australian LCA Database**: [AusLCI](https://auslci.com.au/)
- **ICE Database**: [Inventory of Carbon & Energy](https://circularecology.com/ice-database.html)
- **EPD Australasia**: [Environmental Product Declarations](https://epd-australasia.com/)
- **GHG Protocol**: [Corporate Standard](https://ghgprotocol.org/)

---

## 📝 License

MIT License - Free to use, modify, and distribute.

---

## 🙏 Acknowledgments

### Data Sources

- Australian Life Cycle Assessment Database (AusLCI)
- ICE Database v3.0 (Inventory of Carbon & Energy)
- EPD Australasia verified declarations
- GBCA Materials Calculator
- NABERS benchmarking data

### Standards Referenced

- ISO 14040:2006 - Environmental management — Life cycle assessment
- ISO 14044:2006 - Environmental management — Life cycle assessment
- EN 15978:2011 - Sustainability of construction works
- GHG Protocol Corporate Accounting and Reporting Standard
- AS 5334-2013 - Climate change adaptation for settlements and infrastructure

---

## 🚀 Recommended Next Steps

### For Immediate Use

1. **Familiarize yourself** with the material database
2. **Create a test project** with sample data
3. **Explore all features** - LCA, Scopes, Compliance
4. **Save projects** for future reference
5. **Export reports** to understand output formats

### For Production Deployment

1. **Review material coefficients** for your region
2. **Customize compliance thresholds** if needed
3. **Add company branding** (logo, colors)
4. **Set up regular backups** of project database
5. **Train team members** on tool usage

### For Advanced Users

1. **Extend the material database** with custom materials
2. **Integrate with** existing project management tools
3. **Develop custom reports** for specific compliance needs
4. **Contribute improvements** back to the project

---

## 📊 Version History

**v1.0.0** - Initial Release (2025)
- Complete LCA calculator (A1-D stages)
- GHG Protocol Scopes 1, 2, 3
- NCC 2022, NABERS, GBCA compliance
- 40+ materials in database
- Project save/load functionality
- Chart visualizations
- Export capabilities

---

## 🎯 Project Goals

This tool was created to:

1. **Democratize carbon accounting** - Make it accessible to all construction professionals
2. **Support compliance** - Meet Australian regulatory requirements
3. **Drive sustainability** - Enable informed material decisions
4. **Build industry capacity** - Educate about embodied carbon
5. **Accelerate decarbonization** - Provide data for carbon reduction strategies

---

**Built for the Australian construction industry by Steve (First Class Carpenter turned Sustainability Tech Entrepreneur)**

*"From hammer to keyboard - building the future of sustainable construction"*

---

For questions, feedback, or contributions, please open an issue in the project repository.

**Let's build a lower-carbon future together! 🌱🏗️**
