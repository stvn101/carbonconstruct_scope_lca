/**
 * OPERATIONAL CARBON TRACKING UI
 *
 * Handles all user interactions for the operational carbon tracking page.
 * Integrates with the ComprehensiveScopesCalculator and displays results.
 * Now includes auto-save and restore functionality.
 */

// Storage key for localStorage
const STORAGE_KEY = 'carbonconstruct_operational_carbon_data';

// Tab management
document.addEventListener('DOMContentLoaded', function() {
    initializeTabs();
    initializeSubTabs();
    initializeScope1();
    initializeScope2();
    initializeScope3();
    initializeDashboard();

    // Load saved data
    loadSavedData();

    updateAllTotals();

    // Set up auto-save (save every 30 seconds and on changes)
    setInterval(saveData, 30000);

    console.log('Operational Carbon Calculator initialized with persistence');
});

// ============================================================================
// TAB NAVIGATION
// ============================================================================

function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and hide all contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.add('section-hidden'));
            
            // Add active class to clicked button
            button.classList.add('active');
            
            // Show corresponding content
            const tabId = button.dataset.tab + 'Tab';
            document.getElementById(tabId).classList.remove('section-hidden');
        });
    });
}

function initializeSubTabs() {
    // Scope 1 sub-tabs - using brand colors
    const scope1Subtabs = document.querySelectorAll('.scope1-subtab');
    scope1Subtabs.forEach(button => {
        button.addEventListener('click', () => {
            scope1Subtabs.forEach(btn => {
                btn.classList.remove('active', 'bg-brand-forest', 'text-white');
                btn.classList.add('bg-brand-surface', 'text-brand-steel');
            });
            button.classList.add('active', 'bg-brand-forest', 'text-white');
            button.classList.remove('bg-brand-surface', 'text-brand-steel');

            // Show corresponding content
            document.querySelectorAll('.scope1-content').forEach(c => c.classList.add('section-hidden'));
            const contentId = 's1' + button.dataset.subtab.charAt(0).toUpperCase() + button.dataset.subtab.slice(1);
            document.getElementById(contentId).classList.remove('section-hidden');
        });
    });

    // Scope 2 sub-tabs - using brand colors
    const scope2Subtabs = document.querySelectorAll('.scope2-subtab');
    scope2Subtabs.forEach(button => {
        button.addEventListener('click', () => {
            scope2Subtabs.forEach(btn => {
                btn.classList.remove('active', 'bg-brand-primary', 'text-brand-navy');
                btn.classList.add('bg-brand-surface', 'text-brand-steel');
            });
            button.classList.add('active', 'bg-brand-primary', 'text-brand-navy');
            button.classList.remove('bg-brand-surface', 'text-brand-steel');

            // Show corresponding content
            document.querySelectorAll('.scope2-content').forEach(c => c.classList.add('section-hidden'));
            const contentId = 's2' + button.dataset.subtab.charAt(0).toUpperCase() + button.dataset.subtab.slice(1);
            document.getElementById(contentId).classList.remove('section-hidden');
        });
    });

    // Scope 3 sub-tabs - using brand colors
    const scope3Subtabs = document.querySelectorAll('.scope3-subtab');
    scope3Subtabs.forEach(button => {
        button.addEventListener('click', () => {
            scope3Subtabs.forEach(btn => {
                btn.classList.remove('active', 'bg-brand-sage', 'text-white');
                btn.classList.add('bg-brand-surface', 'text-brand-steel');
            });
            button.classList.add('active', 'bg-brand-sage', 'text-white');
            button.classList.remove('bg-brand-surface', 'text-brand-steel');

            // Show corresponding content
            document.querySelectorAll('.scope3-content').forEach(c => c.classList.add('section-hidden'));
            const contentId = 's3' + button.dataset.subtab.charAt(0).toUpperCase() + button.dataset.subtab.slice(1);
            document.getElementById(contentId).classList.remove('section-hidden');
        });
    });
}

// ============================================================================
// SCOPE 1: EQUIPMENT, VEHICLES, GENERATORS
// ============================================================================

function initializeScope1() {
    // Equipment category change handler
    document.getElementById('s1EquipmentCategory').addEventListener('change', updateEquipmentTypes);
    
    // Add equipment button
    document.getElementById('addEquipmentBtn').addEventListener('click', addEquipment);
    
    // Add vehicle button
    document.getElementById('addVehicleBtn').addEventListener('click', addVehicle);
    
    // Add generator button
    document.getElementById('addGeneratorBtn').addEventListener('click', addGenerator);
    
    // Add heating equipment button
    document.getElementById('addHeatingBtn').addEventListener('click', addHeating);
}

function updateEquipmentTypes() {
    const category = document.getElementById('s1EquipmentCategory').value;
    const typeSelect = document.getElementById('s1EquipmentType');
    
    // Clear existing options
    typeSelect.innerHTML = '<option value="">Select type...</option>';
    
    if (!category || !EMISSIONS_FACTORS.equipment[category]) return;
    
    // Get equipment types for selected category
    const categoryData = EMISSIONS_FACTORS.equipment[category];
    
    // Handle nested structures
    for (let key in categoryData) {
        if (typeof categoryData[key] === 'object' && categoryData[key].fuelType) {
            // Direct equipment type
            const option = document.createElement('option');
            option.value = key;
            option.textContent = formatEquipmentName(key);
            typeSelect.appendChild(option);
        } else if (typeof categoryData[key] === 'object') {
            // Nested category (e.g., cranes.towerCrane)
            for (let subKey in categoryData[key]) {
                const option = document.createElement('option');
                option.value = key + '.' + subKey;
                option.textContent = formatEquipmentName(key) + ' - ' + formatEquipmentName(subKey);
                typeSelect.appendChild(option);
            }
        }
    }
}

function formatEquipmentName(name) {
    return name.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()
        .split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function addEquipment() {
    const category = document.getElementById('s1EquipmentCategory').value;
    const type = document.getElementById('s1EquipmentType').value;
    const operatingHours = parseFloat(document.getElementById('s1OperatingHours').value);
    const fuelUsed = document.getElementById('s1FuelUsed').value ? parseFloat(document.getElementById('s1FuelUsed').value) : null;

    if (!category || !type || isNaN(operatingHours) || operatingHours <= 0) {
        alert('Please fill in all required fields');
        return;
    }
    
    // Add to calculator
    const result = scopesCalc.addScope1Equipment({
        category,
        type,
        operatingHours,
        fuelUsed
    });
    
    if (result.error) {
        alert(result.error);
        return;
    }
    
    // Add to UI list
    addToList('equipmentList', result, 'equipment');

    // Clear inputs
    document.getElementById('s1OperatingHours').value = '';
    document.getElementById('s1FuelUsed').value = '';

    updateAllTotals();
    saveData(); // Auto-save after adding
}

function addVehicle() {
    const type = document.getElementById('s1VehicleType').value;
    const distance = document.getElementById('s1VehicleDistance').value ? parseFloat(document.getElementById('s1VehicleDistance').value) : null;
    const fuelUsed = document.getElementById('s1VehicleFuel').value ? parseFloat(document.getElementById('s1VehicleFuel').value) : null;
    
    if (!type || (!distance && !fuelUsed)) {
        alert('Please select vehicle type and enter either distance or fuel used');
        return;
    }
    
    const result = scopesCalc.addScope1Vehicle({
        type,
        fuelType: 'diesel',
        distance,
        fuelUsed
    });
    
    addToList('vehicleList', result, 'vehicle');

    document.getElementById('s1VehicleDistance').value = '';
    document.getElementById('s1VehicleFuel').value = '';

    updateAllTotals();
    saveData(); // Auto-save after adding
}

function addGenerator() {
    const size = document.getElementById('s1GeneratorSize').value;
    const hours = parseFloat(document.getElementById('s1GenHours').value);
    const loadFactor = parseFloat(document.getElementById('s1GenLoad').value) / 100;

    if (!size || isNaN(hours) || hours <= 0 || isNaN(loadFactor) || loadFactor <= 0) {
        alert('Please fill in all required fields');
        return;
    }
    
    // Adjust hours by load factor
    const effectiveHours = hours * loadFactor;
    
    const result = scopesCalc.addScope1Equipment({
        category: 'generators',
        type: size,
        operatingHours: effectiveHours
    });
    
    addToList('generatorList', result, 'generator');

    document.getElementById('s1GenHours').value = '';

    updateAllTotals();
    saveData(); // Auto-save after adding
}

function addHeating() {
    const type = document.getElementById('s1HeatingType').value;
    const hours = parseFloat(document.getElementById('s1HeatingHours').value);

    if (!type || isNaN(hours) || hours <= 0) {
        alert('Please fill in all required fields');
        return;
    }
    
    const result = scopesCalc.addScope1Equipment({
        category: 'heating',
        type,
        operatingHours: hours
    });
    
    addToList('heatingList', result, 'heating');

    document.getElementById('s1HeatingHours').value = '';

    updateAllTotals();
    saveData(); // Auto-save after adding
}

// ============================================================================
// SCOPE 2: ELECTRICITY
// ============================================================================

function initializeScope2() {
    document.getElementById('addPowerBtn').addEventListener('click', addPower);
    document.getElementById('addFacilityBtn').addEventListener('click', addFacility);
    document.getElementById('addElecEquipBtn').addEventListener('click', addElectricEquipment);
}

function addPower() {
    const description = document.getElementById('s2PowerDesc').value;
    const kWh = parseFloat(document.getElementById('s2PowerKWh').value);
    const state = document.getElementById('s2PowerState').value;
    const days = parseInt(document.getElementById('s2PowerDays').value);

    if (!description || isNaN(kWh) || kWh <= 0 || !state || isNaN(days) || days <= 0) {
        alert('Please fill in all required fields');
        return;
    }
    
    const result = scopesCalc.addScope2Electricity({
        description,
        kWh,
        state,
        days
    });
    
    addToList('powerList', result, 'power');

    document.getElementById('s2PowerDesc').value = '';
    document.getElementById('s2PowerKWh').value = '';
    document.getElementById('s2PowerDays').value = '';

    updateAllTotals();
    saveData(); // Auto-save after adding
}

function addFacility() {
    const type = document.getElementById('s2FacilityType').value;
    const days = parseInt(document.getElementById('s2FacilityDays').value);
    const state = document.getElementById('s2FacilityState').value;

    if (!type || isNaN(days) || days <= 0 || !state) {
        alert('Please fill in all required fields');
        return;
    }
    
    const result = scopesCalc.addScope2SiteFacility({
        type,
        days,
        state
    });
    
    addToList('facilityList', result, 'facility');

    document.getElementById('s2FacilityDays').value = '';

    updateAllTotals();
    saveData(); // Auto-save after adding
}

function addElectricEquipment() {
    const type = document.getElementById('s2ElecType').value;
    const hours = parseFloat(document.getElementById('s2ElecHours').value);
    const state = document.getElementById('s2ElecState').value;

    if (!type || isNaN(hours) || hours <= 0 || !state) {
        alert('Please fill in all required fields');
        return;
    }
    
    const result = scopesCalc.addScope2ElectricEquipment({
        category: 'hoists',
        type,
        operatingHours: hours,
        state
    });
    
    addToList('elecEquipList', result, 'elecEquip');

    document.getElementById('s2ElecHours').value = '';

    updateAllTotals();
    saveData(); // Auto-save after adding
}

// ============================================================================
// SCOPE 3: TRANSPORT, WASTE, WATER, ETC.
// ============================================================================

function initializeScope3() {
    document.getElementById('addTransportBtn').addEventListener('click', addTransport);
    document.getElementById('addWasteBtn').addEventListener('click', addWaste);
    document.getElementById('addWaterBtn').addEventListener('click', addWater);
    document.getElementById('addCommuteBtn').addEventListener('click', addCommute);
    document.getElementById('addTempWorksBtn').addEventListener('click', addTempWorks);
}

function addTransport() {
    const material = document.getElementById('s3TransMaterial').value;
    const weight = parseFloat(document.getElementById('s3TransWeight').value);
    const distance = parseFloat(document.getElementById('s3TransDistance').value);
    const transportMode = document.getElementById('s3TransMode').value;

    if (!material || isNaN(weight) || weight <= 0 || isNaN(distance) || distance <= 0 || !transportMode) {
        alert('Please fill in all required fields');
        return;
    }
    
    const result = scopesCalc.addScope3Transport({
        material,
        weight,
        distance,
        transportMode
    });
    
    addToList('transportList', result, 'transport');

    document.getElementById('s3TransMaterial').value = '';
    document.getElementById('s3TransWeight').value = '';
    document.getElementById('s3TransDistance').value = '';

    updateAllTotals();
    saveData(); // Auto-save after adding
}

function addWaste() {
    const material = document.getElementById('s3WasteMaterial').value;
    const weight = parseFloat(document.getElementById('s3WasteWeight').value);
    const disposalMethod = document.getElementById('s3WasteMethod').value;

    if (!material || isNaN(weight) || weight <= 0 || !disposalMethod) {
        alert('Please fill in all required fields');
        return;
    }
    
    const result = scopesCalc.addScope3Waste({
        material,
        weight,
        disposalMethod
    });
    
    addToList('wasteList', result, 'waste');

    document.getElementById('s3WasteMaterial').value = '';
    document.getElementById('s3WasteWeight').value = '';

    updateAllTotals();
    saveData(); // Auto-save after adding
}

function addWater() {
    const type = document.getElementById('s3WaterType').value;
    const volume = parseFloat(document.getElementById('s3WaterVolume').value);

    if (!type || isNaN(volume) || volume <= 0) {
        alert('Please fill in all required fields');
        return;
    }
    
    const result = scopesCalc.addScope3Water({
        type,
        volume
    });
    
    addToList('waterList', result, 'water');

    document.getElementById('s3WaterVolume').value = '';

    updateAllTotals();
    saveData(); // Auto-save after adding
}

function addCommute() {
    const employees = parseInt(document.getElementById('s3CommuteEmployees').value);
    const avgDistance = parseFloat(document.getElementById('s3CommuteDistance').value);
    const days = parseInt(document.getElementById('s3CommuteDays').value);
    const mode = document.getElementById('s3CommuteMode').value;

    if (isNaN(employees) || employees <= 0 || isNaN(avgDistance) || avgDistance <= 0 || isNaN(days) || days <= 0 || !mode) {
        alert('Please fill in all required fields');
        return;
    }
    
    const result = scopesCalc.addScope3Commuting({
        employees,
        avgDistance,
        days,
        mode
    });
    
    addToList('commuteList', result, 'commute');

    document.getElementById('s3CommuteEmployees').value = '';
    document.getElementById('s3CommuteDistance').value = '';
    document.getElementById('s3CommuteDays').value = '';

    updateAllTotals();
    saveData(); // Auto-save after adding
}

function addTempWorks() {
    const type = document.getElementById('s3TempType').value;
    const area = parseFloat(document.getElementById('s3TempArea').value);
    const uses = parseInt(document.getElementById('s3TempUses').value);

    if (!type || isNaN(area) || area <= 0 || isNaN(uses) || uses <= 0) {
        alert('Please fill in all required fields');
        return;
    }
    
    const result = scopesCalc.addScope3TemporaryWorks({
        type,
        area,
        uses
    });
    
    addToList('tempWorksList', result, 'tempWorks');

    document.getElementById('s3TempArea').value = '';

    updateAllTotals();
    saveData(); // Auto-save after adding
}

// ============================================================================
// UI HELPERS
// ============================================================================

function addToList(listId, item, type) {
    const list = document.getElementById(listId);
    
    // Remove "no items" message if it exists
    const placeholder = list.querySelector('p');
    if (placeholder) {
        placeholder.remove();
    }
    
    // Create list item
    const div = document.createElement('div');
    div.className = 'flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200';
    div.innerHTML = `
        <div class="flex-1">
            <p class="text-sm font-medium text-gray-800">${formatItemDescription(item, type)}</p>
            <p class="text-xs text-gray-500">${formatItemDetails(item, type)}</p>
        </div>
        <div class="text-right">
            <p class="text-sm font-bold text-gray-800">${item.emissions.toFixed(3)} t</p>
            <button class="text-xs text-red-600 hover:text-red-800" onclick="removeItem(${item.id}, '${listId}', '${type}')">
                <i class="fas fa-trash"></i> Remove
            </button>
        </div>
    `;
    
    list.appendChild(div);
}

function formatItemDescription(item, type) {
    if (type === 'equipment' || type === 'vehicle' || type === 'generator' || type === 'heating') {
        return formatEquipmentName(item.type);
    } else if (type === 'power') {
        return item.description;
    } else if (type === 'facility') {
        return formatEquipmentName(item.type);
    } else if (type === 'elecEquip') {
        return formatEquipmentName(item.type);
    } else if (type === 'transport') {
        return `${item.material} - ${item.weight}t`;
    } else if (type === 'waste') {
        return `${item.material} - ${item.weight}kg`;
    } else if (type === 'water') {
        return `${formatEquipmentName(item.type)} - ${item.volume}kL`;
    } else if (type === 'commute') {
        return `${item.employees} employees, ${item.days} days`;
    } else if (type === 'tempWorks') {
        return `${formatEquipmentName(item.type)} - ${item.area}m²`;
    }
    return 'Unknown item';
}

function formatItemDetails(item, type) {
    if (type === 'equipment' || type === 'generator' || type === 'heating') {
        return `${item.operatingHours} hours, ${item.fuelConsumed.toFixed(1)}L ${item.fuelType}`;
    } else if (type === 'vehicle') {
        return item.distance ? `${item.distance}km` : `${item.fuelConsumed}L ${item.fuelType}`;
    } else if (type === 'power') {
        return `${item.kWh.toLocaleString()} kWh, ${item.state.toUpperCase()}`;
    } else if (type === 'facility') {
        return `${item.days} days, ${item.totalKWh.toFixed(0)} kWh`;
    } else if (type === 'elecEquip') {
        return `${item.operatingHours} hours, ${item.totalKWh.toFixed(0)} kWh`;
    } else if (type === 'transport') {
        return `${item.distance}km via ${formatEquipmentName(item.transportMode)}`;
    } else if (type === 'waste') {
        return formatEquipmentName(item.disposalMethod);
    } else if (type === 'water') {
        return `${item.volume}kL`;
    } else if (type === 'commute') {
        return `${item.avgDistance}km avg, ${formatEquipmentName(item.mode)}`;
    } else if (type === 'tempWorks') {
        return `${item.uses} uses`;
    }
    return '';
}

function removeItem(itemId, listId, type) {
    // Determine scope from type
    let scope;
    if (['equipment', 'vehicle', 'generator', 'heating'].includes(type)) {
        scope = 1;
    } else if (['power', 'facility', 'elecEquip'].includes(type)) {
        scope = 2;
    } else {
        scope = 3;
    }

    // Remove from calculator
    scopesCalc.removeItem(scope, itemId);

    // Update UI
    updateAllTotals();

    // Reload list
    reloadList(listId, scope);

    // Auto-save after removing
    saveData();
}

function reloadList(listId, scope) {
    const list = document.getElementById(listId);
    list.innerHTML = '';
    
    let items = [];
    let typeMap = {};
    
    if (scope === 1) {
        items = scopesCalc.scope1Items;
        typeMap = {
            'cranes': 'equipment',
            'excavators': 'equipment',
            'loaders': 'equipment',
            'forklifts': 'equipment',
            'accessEquipment': 'equipment',
            'concrete': 'equipment',
            'compaction': 'equipment',
            'generators': 'generator',
            'vehicles': 'vehicle',
            'heating': 'heating'
        };
    } else if (scope === 2) {
        items = scopesCalc.scope2Items;
        typeMap = {
            'electricity': 'power',
            'siteFacility': 'facility',
            'electricEquipment': 'elecEquip'
        };
    } else if (scope === 3) {
        items = scopesCalc.scope3Items;
        typeMap = {
            'transport': 'transport',
            'waste': 'waste',
            'water': 'water',
            'commuting': 'commute',
            'temporaryWorks': 'tempWorks'
        };
    }
    
    if (items.length === 0) {
        list.innerHTML = '<p class="text-sm text-gray-500 text-center py-8">No items added yet</p>';
        return;
    }
    
    items.forEach(item => {
        const type = typeMap[item.category] || 'equipment';
        addToList(listId, item, type);
    });
}

// ============================================================================
// TOTALS AND DASHBOARD
// ============================================================================

function updateAllTotals() {
    const results = scopesCalc.calculateAllScopes();
    
    // Update summary cards
    document.getElementById('scope1Summary').textContent = results.scope1.total.toFixed(2);
    document.getElementById('scope2Summary').textContent = results.scope2.total.toFixed(2);
    document.getElementById('scope3Summary').textContent = results.scope3.total.toFixed(2);
    document.getElementById('totalOperational').textContent = results.total.toFixed(2);
    
    // Update category totals
    const categoryTotals = {
        'equipmentTotal': 0,
        'vehicleTotal': 0,
        'generatorTotal': 0,
        'heatingTotal': 0,
        'powerTotal': 0,
        'facilityTotal': 0,
        'elecEquipTotal': 0,
        'transportTotal': 0,
        'wasteTotal': 0,
        'waterTotal': 0,
        'commuteTotal': 0,
        'tempWorksTotal': 0
    };
    
    // Scope 1 breakdown
    results.scope1.items.forEach(item => {
        if (item.category === 'generators') {
            categoryTotals.generatorTotal += item.emissions;
        } else if (item.category === 'vehicles') {
            categoryTotals.vehicleTotal += item.emissions;
        } else if (item.category === 'heating') {
            categoryTotals.heatingTotal += item.emissions;
        } else {
            categoryTotals.equipmentTotal += item.emissions;
        }
    });
    
    // Scope 2 breakdown
    results.scope2.items.forEach(item => {
        if (item.category === 'electricity') {
            categoryTotals.powerTotal += item.emissions;
        } else if (item.category === 'siteFacility') {
            categoryTotals.facilityTotal += item.emissions;
        } else if (item.category === 'electricEquipment') {
            categoryTotals.elecEquipTotal += item.emissions;
        }
    });
    
    // Scope 3 breakdown
    results.scope3.items.forEach(item => {
        if (item.category === 'transport') {
            categoryTotals.transportTotal += item.emissions;
        } else if (item.category === 'waste') {
            categoryTotals.wasteTotal += item.emissions;
        } else if (item.category === 'water') {
            categoryTotals.waterTotal += item.emissions;
        } else if (item.category === 'commuting') {
            categoryTotals.commuteTotal += item.emissions;
        } else if (item.category === 'temporaryWorks') {
            categoryTotals.tempWorksTotal += item.emissions;
        }
    });
    
    // Update UI
    for (let id in categoryTotals) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = categoryTotals[id].toFixed(3) + ' tonnes CO2-e';
        }
    }
    
    // Update charts
    updateDashboardCharts(results);
}

function initializeDashboard() {
    document.getElementById('calculateAllBtn').addEventListener('click', updateAllTotals);
    document.getElementById('exportDataBtn').addEventListener('click', exportData);
    document.getElementById('exportPDFBtn').addEventListener('click', exportPDF);
    document.getElementById('saveProjectBtn').addEventListener('click', saveProject);
}

function updateDashboardCharts(results) {
    // Scopes breakdown chart
    const scopesCtx = document.getElementById('scopesBreakdownChart');
    if (scopesCtx && typeof Chart !== 'undefined') {
        const existingChart = Chart.getChart(scopesCtx);
        if (existingChart) {
            existingChart.destroy();
        }
        
        new Chart(scopesCtx, {
            type: 'doughnut',
            data: {
                labels: ['Scope 1: Direct', 'Scope 2: Energy', 'Scope 3: Value Chain'],
                datasets: [{
                    data: [results.scope1.total, results.scope2.total, results.scope3.total],
                    backgroundColor: ['#f97316', '#0d9488', '#6366f1']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    title: {
                        display: true,
                        text: 'Total Operational Emissions by Scope'
                    }
                }
            }
        });
    }
    
    // Individual scope charts
    updateScopeChart('scope1Chart', results.scope1, 'Scope 1', '#f97316');
    updateScopeChart('scope2Chart', results.scope2, 'Scope 2', '#0d9488');
    updateScopeChart('scope3Chart', results.scope3, 'Scope 3', '#6366f1');
}

function updateScopeChart(chartId, scopeData, title, color) {
    const ctx = document.getElementById(chartId);
    if (!ctx || typeof Chart === 'undefined') return;
    
    const existingChart = Chart.getChart(ctx);
    if (existingChart) {
        existingChart.destroy();
    }
    
    const labels = Object.keys(scopeData.breakdown);
    const data = Object.values(scopeData.breakdown);
    
    if (labels.length === 0) {
        return;
    }
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels.map(l => formatEquipmentName(l)),
            datasets: [{
                label: 'Emissions (tonnes CO2-e)',
                data: data,
                backgroundColor: color
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: title + ' Breakdown'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// ============================================================================
// EXPORT AND SAVE
// ============================================================================

function exportData() {
    const data = scopesCalc.exportData();
    const json = JSON.stringify(data, null, 2);
    
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `operational-carbon-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function exportPDF() {
    alert('PDF export functionality would integrate with a PDF library like jsPDF.\n\nFor now, use browser Print to PDF (Ctrl+P or Cmd+P).');
    window.print();
}

function saveProject() {
    const projectName = prompt('Enter project name:');
    if (!projectName) return;

    const data = scopesCalc.exportData();
    data.projectName = projectName;
    data.savedAt = new Date().toISOString();

    // Save to localStorage
    const projects = JSON.parse(localStorage.getItem('carbonProjects') || '[]');
    projects.push(data);
    localStorage.setItem('carbonProjects', JSON.stringify(projects));

    alert('Project saved successfully!');
}

// ============================================================================
// DATA PERSISTENCE FUNCTIONS
// ============================================================================

/**
 * Save current calculator state to localStorage
 */
function saveData() {
    try {
        const data = {
            scope1Items: scopesCalc.scope1Items,
            scope2Items: scopesCalc.scope2Items,
            scope3Items: scopesCalc.scope3Items,
            timestamp: new Date().toISOString()
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        console.log('Data auto-saved at', data.timestamp);

        // Show subtle save indicator
        showSaveIndicator();
    } catch (error) {
        console.error('Error saving data:', error);
        showSaveErrorIndicator();
        showSaveErrorIndicator();
    }
}

/**
 * Show a visual indicator when auto-save fails
 */
function showSaveErrorIndicator() {
    let indicator = document.getElementById('save-error-indicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'save-error-indicator';
        indicator.style.position = 'fixed';
        indicator.style.top = '16px';
        indicator.style.right = '16px';
        indicator.style.background = '#ff4d4f';
        indicator.style.color = '#fff';
        indicator.style.padding = '8px 16px';
        indicator.style.borderRadius = '4px';
        indicator.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
        indicator.style.zIndex = '10000';
        indicator.style.fontWeight = 'bold';
        indicator.textContent = 'Auto-save failed! Changes may not be saved.';
        document.body.appendChild(indicator);
    } else {
        indicator.style.display = 'block';
    }
    // Hide after 5 seconds
    setTimeout(() => {
        if (indicator) indicator.style.display = 'none';
    }, 5000);
}

/**
 * Load saved calculator state from localStorage
 */
function loadSavedData() {
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (!savedData) {
            return;
        }

        const data = JSON.parse(savedData);

        // Restore items to calculator
        scopesCalc.scope1Items = data.scope1Items || [];
        scopesCalc.scope2Items = data.scope2Items || [];
        scopesCalc.scope3Items = data.scope3Items || [];

        // Rebuild UI lists
        rebuildAllLists();

        // Update totals
        updateAllTotals();

        console.log('Restored data from', data.timestamp);

        // Show restore notification
        if (data.scope1Items.length > 0 || data.scope2Items.length > 0 || data.scope3Items.length > 0) {
            showRestoreNotification(data.timestamp);
        }
    } catch (error) {
        console.error('Error loading saved data:', error);
        alert('An error occurred while restoring your saved data. Your previous data could not be loaded. Please check your browser storage or contact support if this issue persists.');
    }
}

/**
 * Clear saved data
 */
function clearSavedData() {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
        localStorage.removeItem(STORAGE_KEY);
        scopesCalc.reset();
        updateAllTotals();
        rebuildAllLists();
        alert('All data cleared successfully');
    }
}

/**
 * Rebuild all UI lists from calculator data
 */
function rebuildAllLists() {
    // Rebuild Scope 1 lists
    rebuildListFromData('equipmentList', scopesCalc.scope1Items.filter(i =>
        !['vehicles', 'generators', 'heating'].includes(i.category)
    ), 'equipment');

    rebuildListFromData('vehicleList', scopesCalc.scope1Items.filter(i => i.category === 'vehicles'), 'vehicle');
    rebuildListFromData('generatorList', scopesCalc.scope1Items.filter(i => i.category === 'generators'), 'generator');
    rebuildListFromData('heatingList', scopesCalc.scope1Items.filter(i => i.category === 'heating'), 'heating');

    // Rebuild Scope 2 lists
    rebuildListFromData('powerList', scopesCalc.scope2Items.filter(i => i.category === 'electricity'), 'power');
    rebuildListFromData('facilityList', scopesCalc.scope2Items.filter(i => i.category === 'siteFacility'), 'facility');
    rebuildListFromData('elecEquipList', scopesCalc.scope2Items.filter(i => i.category === 'electricEquipment'), 'elecEquip');

    // Rebuild Scope 3 lists
    rebuildListFromData('transportList', scopesCalc.scope3Items.filter(i => i.category === 'transport'), 'transport');
    rebuildListFromData('wasteList', scopesCalc.scope3Items.filter(i => i.category === 'waste'), 'waste');
    rebuildListFromData('waterList', scopesCalc.scope3Items.filter(i => i.category === 'water'), 'water');
    rebuildListFromData('commuteList', scopesCalc.scope3Items.filter(i => i.category === 'commuting'), 'commute');
    rebuildListFromData('tempWorksList', scopesCalc.scope3Items.filter(i => i.category === 'temporaryWorks'), 'tempWorks');
}

/**
 * Rebuild a specific list from data
 */
function rebuildListFromData(listId, items, type) {
    const list = document.getElementById(listId);
    if (!list) return;

    list.innerHTML = '';

    if (items.length === 0) {
        list.innerHTML = '<p class="text-sm text-gray-500 text-center py-8">No items added yet</p>';
        return;
    }

    items.forEach(item => {
        addToList(listId, item, type);
    });
}

/**
 * Show save indicator
 */
function showSaveIndicator() {
    const indicator = document.getElementById('saveIndicator');
    if (indicator) {
        indicator.classList.remove('hidden');
        setTimeout(() => {
            indicator.classList.add('hidden');
        }, 2000);
    }
}

/**
 * Show restore notification
 */
function showRestoreNotification(timestamp) {
    const date = new Date(timestamp);
    const formattedDate = date.toLocaleString();

    const notification = document.createElement('div');
    notification.className = 'fixed top-20 right-4 bg-brand-primary text-brand-navy px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in';
    notification.innerHTML = `
        <div class="flex items-center gap-3">
            <i class="fas fa-check-circle text-brand-forest"></i>
            <div>
                <p class="font-semibold">Data Restored</p>
                <p class="text-sm">Last saved: ${formattedDate}</p>
            </div>
            <button class="ml-4 close-notification-btn">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 5000);
}
 
