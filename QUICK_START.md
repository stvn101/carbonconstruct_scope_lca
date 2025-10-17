# Quick Start Guide - CarbonConstruct

**Get up and running in 5 minutes!**

---

## 🎯 What This Tool Does

CarbonConstruct calculates **embodied carbon** (the CO2 emissions from materials and construction) for your building projects. Think of it like a cost estimator, but instead of dollars, you're tracking carbon.

---

## 🚀 Step-by-Step First Project

### Step 1: Open the Application

Simply open `index.html` in your web browser (Chrome, Firefox, Edge, Safari all work).

### Step 2: Enter Project Details

Fill in the basic information at the top:

- **Project Name**: e.g., "Melbourne Office Building"
- **Project Type**: Select from dropdown (Residential, Commercial, etc.)
- **Gross Floor Area**: e.g., 5000 (in square meters)
- **Design Life**: Usually 50 years (default)

### Step 3: Add Your First Material

Let's add concrete (the most common construction material):

1. **Material Category**: Select "Concrete"
2. **Specific Material**: Select "32 MPa Concrete (Standard)"
3. **Quantity**: Enter 200
4. **Unit**: Select "m³"
5. Click **"Add Material"**

You'll see it appear in the table below!

### Step 4: Add More Materials

Add a few more materials to get realistic results:

**Example: Steel**
- Category: Steel
- Material: Structural Steel Sections
- Quantity: 30
- Unit: tonnes

**Example: Glazing**
- Category: Glazing
- Material: Double Glazed Unit
- Quantity: 500
- Unit: m²

**Example: Insulation**
- Category: Insulation
- Material: Glasswool Batts
- Quantity: 1000
- Unit: m²

### Step 5: Calculate!

Click the big green **"Calculate All"** button.

Watch as the calculator:
- ✅ Calculates total embodied carbon
- ✅ Breaks it down by lifecycle stages
- ✅ Checks compliance with Australian standards
- ✅ Generates beautiful charts
- ✅ Compares you to industry benchmarks

### Step 6: Review Your Results

Scroll through the sections to see:

1. **LCA Section**: How carbon breaks down across the building's life
2. **Scopes Section**: GHG Protocol reporting (for corporate requirements)
3. **Compliance Section**: Your NCC, NABERS, and Green Star status
4. **Reports Section**: Summary numbers and comparisons

### Step 7: Save Your Project

Click **"Save Project"** to store it in the database. You can load it anytime from the "Saved Projects" section at the bottom.

---

## 💡 Understanding Your Results

### Total Embodied Carbon
This is the big number - total kg CO2-e for your project.

**Example**: 1,500,000 kg CO2-e means your project emits 1,500 tonnes of CO2.

### Carbon Intensity
This is carbon **per square meter** - the key benchmark metric.

**Example**: 450 kg CO2-e/m² for a 5,000 m² building

**What's good?**
- **< 350 kg/m²**: Excellent! Top 10%
- **350-500 kg/m²**: Good, above average
- **500-650 kg/m²**: Average for the industry
- **> 650 kg/m²**: Need improvement

### Compliance Status

**NCC 2022**: Shows if you meet National Construction Code requirements
- Green badge = Compliant ✅
- Red badge = Non-compliant ⚠️

**NABERS**: Star rating (0-6 stars)
- 5+ stars = Excellent
- 4 stars = Good
- 3 stars = Average
- < 3 stars = Below average

**Green Star**: GBCA certification level
- 6 stars = World Leadership 🌟
- 5 stars = Australian Excellence
- 4 stars = Best Practice
- < 4 stars = Not certified

---

## 🎓 Pro Tips

### Tip 1: Material Matters!

**Biggest carbon contributors** (in order):
1. **Concrete** - Cement production is carbon-intensive
2. **Steel** - High energy to produce
3. **Glazing & Aluminium** - Energy-intensive manufacturing

**Lower-carbon alternatives:**
- Use **Geopolymer Concrete** instead of standard concrete (60% less carbon!)
- Specify **Recycled Steel** (75% less carbon than virgin steel)
- Choose **Timber** where possible (stores carbon!)

### Tip 2: Check the Charts

The **Materials Breakdown Chart** shows which materials contribute most. Focus on reducing the biggest contributors first!

Think: **80/20 rule** - Usually 2-3 materials account for 80% of carbon.

### Tip 3: Compare Projects

Save multiple versions with different materials to compare:
- "Project A - Standard Concrete"
- "Project A - Geopolymer Concrete"
- "Project A - Timber Frame"

### Tip 4: Use for Tenders

Generate the **Export Report** to include in tender submissions. Shows clients you're serious about sustainability!

---

## 🔧 Common Issues & Solutions

### Issue: "No materials added"
**Solution**: Make sure you click "Add Material" after entering each material. They must appear in the table.

### Issue: Calculator button does nothing
**Solution**: Check you've entered a valid Gross Floor Area (must be > 0).

### Issue: Charts not showing
**Solution**: Click "Calculate All" first - charts appear after calculation.

### Issue: Can't save project
**Solution**: Enter a project name first. You'll be prompted if blank.

---

## 📊 Example Project Results

Here's what to expect for a typical commercial office:

**Project**: 5-story office building
- **GFA**: 5,000 m²
- **Main Materials**: 
  - Concrete: 800 m³
  - Steel: 120 tonnes
  - Glazing: 1,000 m²

**Expected Results**:
- **Total Carbon**: ~2,500,000 kg CO2-e
- **Carbon Intensity**: ~500 kg CO2-e/m²
- **NCC Status**: Compliant (Industry Average)
- **NABERS**: 4 stars (Good)
- **Green Star**: 3-4 stars

---

## 🎯 Next Steps

### Once You're Comfortable:

1. **Try Different Materials**: Experiment with low-carbon alternatives
2. **Compare to Benchmarks**: Aim for < 350 kg CO2-e/m² (excellent)
3. **Optimize**: Focus on the highest-carbon materials first
4. **Document**: Export reports for your records
5. **Share**: Show clients and stakeholders your sustainability commitment

### Learn More:

- Read the full README.md for detailed explanations
- Explore each JavaScript file - they're heavily commented
- Check Australian standards websites (NCC, NABERS, GBCA)

---

## 📞 Need Help?

**Common Questions:**

**Q: What's the difference between embodied and operational carbon?**
A: Embodied = carbon from materials/construction. Operational = carbon from running the building (heating, cooling, lighting). This tool focuses on embodied carbon.

**Q: Why is my timber showing negative carbon?**
A: Trees absorb CO2 as they grow! Some timber products store more carbon than emissions from processing. This is good!

**Q: Can I use this for existing buildings?**
A: This tool is designed for new construction. For existing buildings, you'd need to estimate material quantities from drawings or surveys.

**Q: How accurate are these calculations?**
A: The database uses industry-standard coefficients from AusLCI, ICE Database, and EPDs. Accuracy is typically ±15-20%, which is standard for preliminary assessments. For formal EPD certification, you'd need detailed product-specific data.

**Q: Do I need the internet?**
A: Yes, the tool loads libraries (Tailwind CSS, Chart.js) from CDNs and needs internet for the database API.

---

## ✅ Checklist for Your First Project

- [ ] Project details entered
- [ ] At least 5 materials added
- [ ] "Calculate All" clicked successfully
- [ ] LCA chart displays
- [ ] Compliance status shows
- [ ] Project saved
- [ ] Report exported

---

**Congratulations! You're now calculating embodied carbon like a pro! 🎉**

From one tradie to another - this is the future of construction. Let's build it right!

*- Steve, First Class Carpenter & Sustainability Tech Entrepreneur*

---

**Remember**: Every kg of CO2-e avoided is a step toward a more sustainable built environment. Your material choices matter! 🌱🏗️
