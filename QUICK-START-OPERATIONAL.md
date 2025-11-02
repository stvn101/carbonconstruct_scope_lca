# Operational Carbon Tracking - Quick Start

## 🚀 Open the Tool

1. Deploy to Vercel (or open locally)
2. Click **"Operational Carbon"** in navigation (orange button)
3. Or open `operational-carbon.html` directly

---

## 📋 Quick Reference

### Scope 1: Equipment & Fuel
**What:** Diesel/petrol you burn on site
**Where:** Scope 1 tab
**Example:** Tower crane runs 240 hours → 10.3 tonnes CO2-e

### Scope 2: Electricity
**What:** Power from the grid
**Where:** Scope 2 tab  
**Example:** 15,000 kWh in VIC → 15.3 tonnes CO2-e

### Scope 3: Transport, Waste, etc.
**What:** Everything else
**Where:** Scope 3 tab
**Example:** 500t concrete, 30km by truck → 1.5 tonnes CO2-e

---

## 🎯 Most Common Entries

### Scope 1
1. **Tower Crane**: Category=Cranes, Type=16t, Hours=240
2. **Excavator**: Category=Excavators, Type=20t, Hours=180
3. **Site Ute**: Category=Vehicles, Type=Ute Diesel, Distance=8000km
4. **Generator**: Category=Generators, Size=100kVA, Hours=480

### Scope 2
1. **Site Power**: kWh=15000, State=VIC, Days=30
2. **Site Office**: Type=Large, Days=180, State=NSW
3. **Alimak Hoist**: Type=Single, Hours=400, State=QLD

### Scope 3
1. **Concrete Delivery**: Material=Concrete, Weight=500t, Distance=30km, Mode=Truck
2. **General Waste**: Material=General, Weight=5000kg, Method=Landfill
3. **Employee Commute**: Employees=50, Distance=25km, Days=180, Mode=Car Solo

---

## 📊 Reading the Results

### Summary Cards (Top)
- **Scope 1:** Direct emissions (your fuel)
- **Scope 2:** Indirect energy (electricity)
- **Scope 3:** Value chain (everything else)
- **TOTAL:** All operational emissions

### Typical Breakdown for Construction
- Scope 1: 20-30% (equipment & vehicles)
- Scope 2: 10-15% (electricity)
- Scope 3: 60-70% (materials transport, waste)

**Note:** This is OPERATIONAL carbon. Embodied carbon (materials production) is tracked separately in the main calculator.

---

## 💡 Pro Tips

1. **Start with big items first:** Tower cranes, excavators, generators
2. **Use actual fuel bills:** Override estimated consumption with actual litres used
3. **Track by month:** Create monthly projects to see trends
4. **Compare diesel vs electric:** See emissions difference between equipment types
5. **State matters:** Victoria (VIC) has 1.02 kg/kWh, Tasmania (TAS) has 0.14 kg/kWh

---

## 🔢 Quick Conversions

- **1 tonne CO2-e** = 1,000 kg CO2-e
- **1 kilolitre (kL)** = 1,000 litres of water
- **Typical ute fuel:** ~10 L/100km (petrol), ~8 L/100km (diesel)
- **Typical site power:** 500-2000 kWh/month for small site

---

## 🎯 Compliance Requirements

### TCFD (Climate Disclosure)
**Required from Jan 2025:**
- ✅ Scope 1 (mandatory)
- ✅ Scope 2 (mandatory)
- ⚠️ Scope 3 (encouraged)

**This tool tracks all three!**

---

## ❓ Troubleshooting

**Q: Equipment type not in dropdown?**  
A: Select closest equivalent, or use custom fuel entry

**Q: Don't know exact operating hours?**  
A: Estimate: Full-time = 8hrs/day × working days

**Q: Should I track subcontractor equipment?**  
A: Only if YOU control it (Scope 1). Otherwise, it's their Scope 1, your Scope 3.

**Q: Electric equipment - Scope 1 or 2?**  
A: Always Scope 2 (you're buying electricity, not burning fuel directly)

**Q: How often should I track?**  
A: Monthly for ongoing projects, or full project total at completion

---

## 📞 Need Help?

Check the full guide: `OPERATIONAL-CARBON-GUIDE.md`

---

**Remember:** Every entry makes your carbon tracking more accurate. Start simple, add detail as you go.
