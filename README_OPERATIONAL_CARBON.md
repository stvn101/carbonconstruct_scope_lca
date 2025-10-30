# Operational Carbon Calculator - User Guide

## Overview

The Operational Carbon Calculator tracks all greenhouse gas emissions from construction site operations across Scope 1, 2, and 3 according to the GHG Protocol.

## Features

### ✅ Implemented Features

1. **Comprehensive Scope Tracking**
   - Scope 1: Direct emissions (fuel, vehicles, equipment)
   - Scope 2: Purchased electricity (grid power, facilities)
   - Scope 3: Value chain emissions (transport, waste, water, commuting)

2. **Auto-Save & Persistence**
   - Automatic saving every 30 seconds
   - Data persists between page refreshes
   - Visual save indicator in navigation bar
   - Restore notification on page load

3. **Consistent Brand UI/UX**
   - Uses CarbonConstruct brand color palette
   - Consistent styling across all tabs and sections
   - Smooth transitions and hover states
   - Professional, clean interface

4. **Real-time Calculations**
   - Instant emissions calculations
   - Category and scope breakdowns
   - Interactive charts and visualizations
   - Export to JSON

5. **Comprehensive Testing**
   - Unit tests for all calculator functions
   - Manual test suite (browser-based)
   - Edge case handling
   - Input validation

## Usage

### Adding Emissions Data

#### Scope 1: Direct Emissions

1. **Equipment**: Select category, type, operating hours
2. **Vehicles**: Choose vehicle type, enter distance traveled
3. **Generators**: Select size, operating hours, load factor
4. **Heating/Drying**: Choose equipment type, operating hours

#### Scope 2: Purchased Electricity

1. **Site Power**: Enter kWh used, select state for grid factor
2. **Facilities**: Select facility type, days in use
3. **Electric Equipment**: Choose equipment, operating hours

#### Scope 3: Value Chain

1. **Transport**: Enter material, weight, distance, transport mode
2. **Waste**: Enter material, weight, disposal method
3. **Water**: Select type, enter volume
4. **Commuting**: Enter employees, distance, days, transport mode
5. **Temporary Works**: Select type, area, number of reuses

### Data Persistence

- **Auto-Save**: Data automatically saves every 30 seconds
- **Manual Save**: Click "Save Project" to save with a name
- **Restore**: Data automatically restores when you return to the page
- **Clear**: Clear all data from the dashboard

### Exporting Results

1. **JSON Export**: Download raw data for further analysis
2. **PDF Report**: Generate formatted report (browser print)
3. **Project Save**: Save named projects for later retrieval

## Testing

### Manual Testing (Browser)

1. Open `js/tests/manual-test-suite.html` in a browser
2. Click "Run All Tests"
3. Review results

### Automated Testing (Jest)

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests with coverage
npm test:coverage

# Watch mode
npm test:watch
```

## Emission Factors

All emission factors are sourced from:
- Australian Government National Greenhouse Accounts Factors 2023
- ICE Database (Circular Ecology)
- Equipment manufacturer specifications
- Industry averages for Australian construction

### State-specific Grid Factors (kg CO2-e/kWh)

- **ACT**: 0.0 (100% renewable)
- **TAS**: 0.14 (hydro)
- **SA**: 0.43
- **NT**: 0.62
- **WA**: 0.70
- **QLD**: 0.79
- **NSW**: 0.81
- **VIC**: 1.02 (brown coal - highest)

## Color Scheme

### Brand Colors

- **Primary Green**: `#3DD68C` - Main actions, highlights
- **Forest**: `#47876D` - Scope 1 (direct emissions)
- **Sage**: `#7A9B8E` - Scope 3 (value chain)
- **Primary Dark**: `#1E4A40` - Hover states, emphasis
- **Mint**: `#E0F4ED` - Backgrounds, light accents
- **Navy**: `#1E2A35` - Text, headers
- **Surface**: `#F3F8F6` - Card backgrounds

## Browser Compatibility

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- IE11: ❌ Not supported

## Known Issues

None currently reported. Please report issues via GitHub.

## Changelog

### Version 1.1.0 (Current)

- ✅ Fixed UI/UX inconsistencies with brand colors
- ✅ Added localStorage persistence and auto-save
- ✅ Fixed border styling in heating section
- ✅ Added comprehensive test suite
- ✅ Improved sub-tab styling consistency
- ✅ Added save indicator
- ✅ Added restore notifications

### Version 1.0.0

- Initial release
- Basic calculator functionality
- Scope 1, 2, 3 tracking
- Charts and visualizations

## Future Enhancements

- [ ] PDF export with custom branding
- [ ] Multi-project comparison
- [ ] API integration for cloud storage
- [ ] Mobile app version
- [ ] Advanced reporting templates
- [ ] Benchmark comparisons

## Support

For support or questions, please contact the CarbonConstruct team or raise an issue on GitHub.
