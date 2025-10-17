/**
 * Main Application Controller
 * This is the brain - coordinates all the modules and handles user interactions
 */

// Application state - like your project drawings, keeps everything organized
const appState = {
    currentProject: {
        id: null,
        projectName: '',
        projectType: '',
        gfa: 0,
        designLife: 50,
        materials: [],
        totalCarbon: 0,
        carbonIntensity: 0,
        lcaResults: null,
        scopesResults: null,
        complianceResults: null
    },
    isModified: false
};

// Initialize application when page loads
document.addEventListener('DOMContentLoaded', async function() {
    console.log('CarbonConstruct initializing...');
    
    // Initialize storage
    await storageManager.initialize();
    
    // Load saved projects
    await loadSavedProjects();
    
    // Setup event listeners
    setupEventListeners();
    
    // Populate material dropdowns
    populateMaterialCategories();
    
    console.log('CarbonConstruct ready!');
});

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    // Material category change
    document.getElementById('materialCategory').addEventListener('change', function() {
        populateMaterialTypes(this.value);
    });
    
    // Add material button
    document.getElementById('addMaterialBtn').addEventListener('click', addMaterial);
    
    // Calculate all button
    document.getElementById('calculateBtn').addEventListener('click', calculateAll);
    
    // Save project button
    document.getElementById('saveProjectBtn').addEventListener('click', saveCurrentProject);
    
    // Export report button
    document.getElementById('exportReportBtn').addEventListener('click', exportReport);
    
    // New project button
    document.getElementById('newProjectBtn').addEventListener('click', createNewProject);
}

/**
 * Populate material categories dropdown
 */
function populateMaterialCategories() {
    const categories = getAllCategories();
    const select = document.getElementById('materialCategory');
    
    // Clear existing options except first
    while (select.options.length > 1) {
        select.remove(1);
    }
    
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = cat.name;
        select.appendChild(option);
    });
}

/**
 * Populate material types based on selected category
 */
function populateMaterialTypes(category) {
    const select = document.getElementById('materialType');
    
    // Clear existing options
    while (select.options.length > 1) {
        select.remove(1);
    }
    
    if (!category) return;
    
    const materials = getMaterialsByCategory(category);
    
    Object.entries(materials).forEach(([id, material]) => {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = material.name;
        select.appendChild(option);
    });
}

/**
 * Add material to project
 */
function addMaterial() {
    const category = document.getElementById('materialCategory').value;
    const type = document.getElementById('materialType').value;
    const quantity = parseFloat(document.getElementById('materialQuantity').value);
    const unit = document.getElementById('materialUnit').value;
    
    if (!category || !type || !quantity || quantity <= 0) {
        alert('Please fill in all material fields with valid values');
        return;
    }
    
    const materialData = getMaterialData(category, type);
    if (!materialData) {
        alert('Material not found in database');
        return;
    }
    
    // Add to project materials
    const material = {
        category: category,
        type: type,
        name: materialData.name,
        quantity: quantity,
        unit: unit,
        embodiedCarbon: materialData.embodiedCarbon,
        emissions: calculateMaterialCarbon(category, type, quantity)
    };
    
    appState.currentProject.materials.push(material);
    appState.isModified = true;
    
    // Update display
    updateMaterialsTable();
    
    // Clear inputs
    document.getElementById('materialQuantity').value = '';
    
    console.log('Material added:', material);
}

/**
 * Update materials table display
 */
function updateMaterialsTable() {
    const container = document.getElementById('materialsTable');
    
    if (appState.currentProject.materials.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-4">No materials added yet. Add materials above to begin.</p>';
        return;
    }
    
    let html = '<table class="w-full border-collapse">';
    html += '<thead><tr class="bg-gray-100">';
    html += '<th class="border border-gray-300 px-4 py-2 text-left">Material</th>';
    html += '<th class="border border-gray-300 px-4 py-2 text-right">Quantity</th>';
    html += '<th class="border border-gray-300 px-4 py-2 text-right">Unit</th>';
    html += '<th class="border border-gray-300 px-4 py-2 text-right">Embodied Carbon</th>';
    html += '<th class="border border-gray-300 px-4 py-2 text-center">Action</th>';
    html += '</tr></thead><tbody>';
    
    appState.currentProject.materials.forEach((material, index) => {
        html += '<tr class="hover:bg-gray-50">';
        html += `<td class="border border-gray-300 px-4 py-2">${material.name}</td>`;
        html += `<td class="border border-gray-300 px-4 py-2 text-right">${material.quantity.toLocaleString()}</td>`;
        html += `<td class="border border-gray-300 px-4 py-2 text-right">${material.unit}</td>`;
        html += `<td class="border border-gray-300 px-4 py-2 text-right">${Math.abs(material.emissions).toLocaleString()} kg CO2-e</td>`;
        html += `<td class="border border-gray-300 px-4 py-2 text-center">`;
        html += `<button onclick="removeMaterial(${index})" class="text-red-600 hover:text-red-800">`;
        html += '<i class="fas fa-trash"></i> Remove</button></td>';
        html += '</tr>';
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
}

/**
 * Remove material from project
 */
function removeMaterial(index) {
    appState.currentProject.materials.splice(index, 1);
    appState.isModified = true;
    updateMaterialsTable();
}

/**
 * Calculate all emissions and compliance
 */
function calculateAll() {
    // Get project details
    appState.currentProject.projectName = document.getElementById('projectName').value || 'Untitled Project';
    appState.currentProject.projectType = document.getElementById('projectType').value || 'commercial';
    appState.currentProject.gfa = parseFloat(document.getElementById('gfa').value) || 0;
    appState.currentProject.designLife = parseFloat(document.getElementById('designLife').value) || 50;
    
    if (appState.currentProject.materials.length === 0) {
        alert('Please add materials before calculating');
        return;
    }
    
    if (appState.currentProject.gfa <= 0) {
        alert('Please enter a valid Gross Floor Area');
        return;
    }
    
    console.log('Calculating emissions...');
    
    // Calculate LCA
    const lcaResults = lcaCalculator.calculateProjectLCA(
        appState.currentProject.materials,
        appState.currentProject.designLife
    );
    appState.currentProject.lcaResults = lcaResults;
    
    // Calculate Scopes
    const scopesInput = {
        scope1: {
            fuels: [],
            vehicles: []
        },
        scope2: {
            electricity: { kwh: 0 }
        },
        scope3: {
            materials: appState.currentProject.materials
        }
    };
    const scopesResults = scopesCalculator.calculateAllScopes(scopesInput);
    appState.currentProject.scopesResults = scopesResults;
    
    // Calculate totals
    appState.currentProject.totalCarbon = lcaResults.totals.embodiedCarbon;
    appState.currentProject.carbonIntensity = appState.currentProject.totalCarbon / appState.currentProject.gfa;
    
    // Check compliance
    const complianceData = {
        totalCarbon: appState.currentProject.totalCarbon,
        gfa: appState.currentProject.gfa,
        projectType: appState.currentProject.projectType,
        materials: appState.currentProject.materials
    };
    const complianceResults = complianceChecker.generateComplianceReport(complianceData);
    appState.currentProject.complianceResults = complianceResults;
    
    // Update UI
    updateLCADisplay(lcaResults);
    updateScopesDisplay(scopesResults);
    updateComplianceDisplay(complianceResults);
    updateSummaryDisplay();
    
    // Update charts
    chartsManager.createLCAChart('lcaChart', lcaResults.totals);
    chartsManager.createScopesChart('scopesChart', {
        scope1: scopesResults.scope1.total,
        scope2: scopesResults.scope2.total,
        scope3: scopesResults.scope3.total
    });
    chartsManager.createMaterialsChart('materialsChart', appState.currentProject.materials);
    
    appState.isModified = true;
    
    console.log('Calculations complete!');
}

/**
 * Update LCA display
 */
function updateLCADisplay(lcaResults) {
    document.getElementById('lcaA1A3').textContent = lcaResults.totals.a1a3.toLocaleString();
    document.getElementById('lcaA4A5').textContent = lcaResults.totals.a4a5.toLocaleString();
    document.getElementById('lcaB1B7').textContent = lcaResults.totals.b1b7.toLocaleString();
    document.getElementById('lcaC1C4').textContent = lcaResults.totals.c1c4.toLocaleString();
}

/**
 * Update Scopes display
 */
function updateScopesDisplay(scopesResults) {
    document.getElementById('scope1Total').textContent = scopesResults.scope1.total.toLocaleString();
    document.getElementById('scope2Total').textContent = scopesResults.scope2.total.toLocaleString();
    document.getElementById('scope3Total').textContent = scopesResults.scope3.total.toLocaleString();
}

/**
 * Update Compliance display
 */
function updateComplianceDisplay(complianceResults) {
    const standards = complianceResults.standards;
    
    // NCC Status
    const nccStatus = document.getElementById('nccStatus');
    nccStatus.textContent = standards.ncc.level;
    nccStatus.className = 'px-3 py-1 rounded-full text-sm font-medium ' + 
        (standards.ncc.compliant ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800');
    
    document.getElementById('nccEmbodiedEnergy').textContent = 
        standards.ncc.metrics.embodiedEnergy + ' MJ/m²';
    document.getElementById('nccCarbonIntensity').textContent = 
        standards.ncc.metrics.carbonIntensity + ' kg CO2-e/m²';
    
    // NABERS Rating
    const nabersRating = document.getElementById('nabersRating');
    nabersRating.textContent = standards.nabers.stars.toFixed(1) + '★';
    nabersRating.className = 'px-3 py-1 rounded-full text-sm font-medium ' + 
        (standards.nabers.stars >= 5 ? 'bg-green-200 text-green-800' : 
         standards.nabers.stars >= 4 ? 'bg-yellow-200 text-yellow-800' : 
         'bg-gray-200 text-gray-700');
    
    document.getElementById('nabersBenchmark').textContent = 
        standards.nabers.metrics.benchmarkForTarget + ' kg CO2-e/m² for 5 stars';
    
    // Green Star Rating
    const greenStarRating = document.getElementById('greenStarRating');
    greenStarRating.textContent = standards.greenStar.stars + '★';
    greenStarRating.className = 'px-3 py-1 rounded-full text-sm font-medium ' + 
        (standards.greenStar.stars >= 4 ? 'bg-green-200 text-green-800' : 
         'bg-gray-200 text-gray-700');
    
    document.getElementById('greenStarPoints').textContent = 
        standards.greenStar.points + '/100';
}

/**
 * Update summary display
 */
function updateSummaryDisplay() {
    const totalCarbon = appState.currentProject.totalCarbon;
    const carbonIntensity = appState.currentProject.carbonIntensity;
    const gfa = appState.currentProject.gfa;
    
    document.getElementById('totalCarbon').textContent = totalCarbon.toLocaleString();
    document.getElementById('carbonIntensity').textContent = carbonIntensity.toFixed(1);
    
    // Calculate tree equivalent
    // One mature tree absorbs ~25 kg CO2 per year
    const treesNeeded = Math.ceil(totalCarbon / 25 / 10);
    document.getElementById('treesEquivalent').textContent = treesNeeded.toLocaleString();
    
    // Calculate car equivalent
    // Average car emits ~4.6 tonnes CO2 per year
    const carYears = (totalCarbon / 4600).toFixed(1);
    document.getElementById('carEquivalent').textContent = carYears;
    
    // Update benchmarks
    document.getElementById('benchmarkYour').textContent = carbonIntensity.toFixed(0);
}

/**
 * Save current project
 */
async function saveCurrentProject() {
    if (!appState.currentProject.projectName) {
        appState.currentProject.projectName = prompt('Enter project name:');
        if (!appState.currentProject.projectName) return;
    }
    
    try {
        const result = await storageManager.saveProject(appState.currentProject);
        appState.currentProject.id = result.id;
        appState.isModified = false;
        
        alert('Project saved successfully!');
        await loadSavedProjects();
    } catch (error) {
        alert('Failed to save project: ' + error.message);
    }
}

/**
 * Load saved projects list
 */
async function loadSavedProjects() {
    try {
        const projects = await storageManager.loadAllProjects();
        displaySavedProjects(projects);
    } catch (error) {
        console.error('Failed to load projects:', error);
    }
}

/**
 * Display saved projects
 */
function displaySavedProjects(projects) {
    const container = document.getElementById('savedProjectsList');
    
    if (projects.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-8">No saved projects yet. Create and save your first project!</p>';
        return;
    }
    
    let html = '';
    projects.forEach(project => {
        const date = new Date(project.lastModified || project.created_at);
        html += `
            <div class="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-green-500 transition-colors">
                <h3 class="text-lg font-semibold text-gray-800 mb-2">${project.projectName}</h3>
                <p class="text-sm text-gray-600 mb-4">
                    <i class="fas fa-building mr-2"></i>${project.projectType}
                    <span class="mx-2">•</span>
                    <i class="fas fa-ruler-combined mr-2"></i>${project.gfa} m²
                </p>
                <p class="text-sm text-gray-600 mb-4">
                    <i class="fas fa-leaf mr-2 text-green-600"></i>
                    ${project.carbonIntensity.toFixed(1)} kg CO2-e/m²
                </p>
                <p class="text-xs text-gray-500 mb-4">
                    Last modified: ${date.toLocaleDateString()}
                </p>
                <div class="flex space-x-2">
                    <button onclick="loadProject('${project.id}')" 
                            class="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm">
                        <i class="fas fa-folder-open mr-2"></i>Load
                    </button>
                    <button onclick="deleteProject('${project.id}')" 
                            class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

/**
 * Load a specific project
 */
async function loadProject(projectId) {
    try {
        const project = await storageManager.loadProject(projectId);
        appState.currentProject = project;
        appState.isModified = false;
        
        // Populate form
        document.getElementById('projectName').value = project.projectName;
        document.getElementById('projectType').value = project.projectType;
        document.getElementById('gfa').value = project.gfa;
        document.getElementById('designLife').value = project.designLife;
        
        // Update displays
        updateMaterialsTable();
        if (project.lcaResults) {
            updateLCADisplay(project.lcaResults);
            updateScopesDisplay(project.scopesResults);
            updateComplianceDisplay(project.complianceResults);
            updateSummaryDisplay();
            
            // Update charts
            chartsManager.createLCAChart('lcaChart', project.lcaResults.totals);
            chartsManager.createScopesChart('scopesChart', {
                scope1: project.scopesResults.scope1.total,
                scope2: project.scopesResults.scope2.total,
                scope3: project.scopesResults.scope3.total
            });
            chartsManager.createMaterialsChart('materialsChart', project.materials);
        }
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        alert('Project loaded successfully!');
    } catch (error) {
        alert('Failed to load project: ' + error.message);
    }
}

/**
 * Delete a project
 */
async function deleteProject(projectId) {
    if (!confirm('Are you sure you want to delete this project? This cannot be undone.')) {
        return;
    }
    
    try {
        await storageManager.deleteProject(projectId);
        alert('Project deleted successfully');
        await loadSavedProjects();
    } catch (error) {
        alert('Failed to delete project: ' + error.message);
    }
}

/**
 * Create new project
 */
function createNewProject() {
    if (appState.isModified) {
        if (!confirm('You have unsaved changes. Create new project anyway?')) {
            return;
        }
    }
    
    // Reset state
    appState.currentProject = {
        id: null,
        projectName: '',
        projectType: '',
        gfa: 0,
        designLife: 50,
        materials: [],
        totalCarbon: 0,
        carbonIntensity: 0,
        lcaResults: null,
        scopesResults: null,
        complianceResults: null
    };
    appState.isModified = false;
    
    // Clear form
    document.getElementById('projectName').value = '';
    document.getElementById('projectType').value = '';
    document.getElementById('gfa').value = '';
    document.getElementById('designLife').value = '50';
    
    updateMaterialsTable();
    
    // Reset displays
    document.getElementById('totalCarbon').textContent = '0';
    document.getElementById('carbonIntensity').textContent = '0';
    document.getElementById('lcaA1A3').textContent = '0';
    document.getElementById('lcaA4A5').textContent = '0';
    document.getElementById('lcaB1B7').textContent = '0';
    document.getElementById('lcaC1C4').textContent = '0';
    document.getElementById('scope1Total').textContent = '0';
    document.getElementById('scope2Total').textContent = '0';
    document.getElementById('scope3Total').textContent = '0';
    
    chartsManager.destroyAllCharts();
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Export project report
 */
function exportReport() {
    if (!appState.currentProject.totalCarbon) {
        alert('Please calculate emissions before exporting report');
        return;
    }
    
    storageManager.exportProjectReport(appState.currentProject);
}

// Make functions globally accessible for onclick handlers
window.removeMaterial = removeMaterial;
window.loadProject = loadProject;
window.deleteProject = deleteProject;
 
