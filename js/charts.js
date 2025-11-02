/**
 * Charts and Visualizations Module
 * Using Chart.js for data visualization
 * 
 * Visual data is critical on construction sites - charts make carbon data accessible!
 */

class ChartsManager {
    constructor() {
        this.charts = {}; // Store chart instances for updating
        this.colorScheme = {
            // Professional color scheme for construction industry
            green: '#059669',
            blue: '#3b82f6',
            yellow: '#f59e0b',
            red: '#ef4444',
            purple: '#8b5cf6',
            teal: '#14b8a6',
            orange: '#f97316',
            indigo: '#6366f1',
            // LCA stage colors
            productStage: '#3b82f6',
            constructionStage: '#f59e0b',
            useStage: '#8b5cf6',
            endOfLife: '#ef4444',
            // Scope colors
            scope1: '#f97316',
            scope2: '#14b8a6',
            scope3: '#6366f1'
        };
    }

    /**
     * Create or update LCA stages chart
     * Shows breakdown of carbon across life cycle stages
     */
    createLCAChart(canvasId, lcaData) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        // Destroy existing chart if it exists
        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        const data = {
            labels: ['Product Stage (A1-A3)', 'Construction (A4-A5)', 'Use Stage (B1-B7)', 'End of Life (C1-C4)'],
            datasets: [{
                label: 'Carbon Emissions (kg CO2-e)',
                data: [
                    lcaData.a1a3 || 0,
                    lcaData.a4a5 || 0,
                    lcaData.b1b7 || 0,
                    lcaData.c1c4 || 0
                ],
                backgroundColor: [
                    this.colorScheme.productStage,
                    this.colorScheme.constructionStage,
                    this.colorScheme.useStage,
                    this.colorScheme.endOfLife
                ],
                borderColor: '#ffffff',
                borderWidth: 2
            }]
        };

        this.charts[canvasId] = new Chart(ctx, {
            type: 'doughnut',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            font: {
                                size: 12,
                                family: 'Inter'
                            }
                        }
                    },
                    title: {
                        display: true,
                        text: 'Life Cycle Assessment Breakdown',
                        font: {
                            size: 16,
                            weight: 'bold',
                            family: 'Inter'
                        },
                        padding: 20
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return `${label}: ${value.toLocaleString()} kg CO2-e (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Create or update GHG Protocol Scopes chart
     * Shows Scope 1, 2, 3 breakdown
     */
    createScopesChart(canvasId, scopesData) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        const data = {
            labels: [
                'Scope 1\n(Direct Emissions)',
                'Scope 2\n(Purchased Energy)',
                'Scope 3\n(Value Chain)'
            ],
            datasets: [{
                label: 'Carbon Emissions (kg CO2-e)',
                data: [
                    scopesData.scope1 || 0,
                    scopesData.scope2 || 0,
                    scopesData.scope3 || 0
                ],
                backgroundColor: [
                    this.colorScheme.scope1,
                    this.colorScheme.scope2,
                    this.colorScheme.scope3
                ],
                borderColor: '#ffffff',
                borderWidth: 2
            }]
        };

        this.charts[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'GHG Protocol Scopes Breakdown',
                        font: {
                            size: 16,
                            weight: 'bold',
                            family: 'Inter'
                        },
                        padding: 20
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed.y || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return `${value.toLocaleString()} kg CO2-e (${percentage}%)`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Carbon Emissions (kg CO2-e)',
                            font: {
                                size: 12,
                                family: 'Inter'
                            }
                        },
                        ticks: {
                            callback: function(value) {
                                return value.toLocaleString();
                            }
                        }
                    },
                    x: {
                        ticks: {
                            font: {
                                size: 11,
                                family: 'Inter'
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Create materials breakdown chart
     * Shows which materials contribute most carbon
     */
    createMaterialsChart(canvasId, materialsData) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        // Aggregate by category
        const categories = {};
        materialsData.forEach(material => {
            const category = material.category || 'Other';
            const emissions = Math.abs(material.emissions || 0);
            categories[category] = (categories[category] || 0) + emissions;
        });

        // Sort by emissions (highest first)
        const sortedCategories = Object.entries(categories)
            .sort((a, b) => b[1] - a[1]);

        const labels = sortedCategories.map(([cat]) => this.formatCategoryName(cat));
        const data = sortedCategories.map(([, emissions]) => emissions);
        const colors = this.generateColors(sortedCategories.length);

        this.charts[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Embodied Carbon',
                    data: data,
                    backgroundColor: colors,
                    borderColor: '#ffffff',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y', // Horizontal bar chart
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'Carbon Emissions by Material Category',
                        font: {
                            size: 16,
                            weight: 'bold',
                            family: 'Inter'
                        },
                        padding: 20
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed.x || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return `${value.toLocaleString()} kg CO2-e (${percentage}%)`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Carbon Emissions (kg CO2-e)',
                            font: {
                                size: 12,
                                family: 'Inter'
                            }
                        },
                        ticks: {
                            callback: function(value) {
                                return value.toLocaleString();
                            }
                        }
                    },
                    y: {
                        ticks: {
                            font: {
                                size: 11,
                                family: 'Inter'
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Create benchmarking comparison chart
     */
    createBenchmarkChart(canvasId, yourValue, industryAverage, bestPractice) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        this.charts[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Your Project', 'Industry Average', 'Best Practice'],
                datasets: [{
                    label: 'Carbon Intensity (kg CO2-e/m²)',
                    data: [yourValue, industryAverage, bestPractice],
                    backgroundColor: [
                        yourValue <= bestPractice ? this.colorScheme.green : 
                        yourValue <= industryAverage ? this.colorScheme.yellow : 
                        this.colorScheme.red,
                        this.colorScheme.blue,
                        this.colorScheme.green
                    ],
                    borderColor: '#ffffff',
                    borderWidth: 2
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
                        text: 'Industry Benchmarking',
                        font: {
                            size: 16,
                            weight: 'bold',
                            family: 'Inter'
                        },
                        padding: 20
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.parsed.y.toFixed(1)} kg CO2-e/m²`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Carbon Intensity (kg CO2-e/m²)',
                            font: {
                                size: 12,
                                family: 'Inter'
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Helper: Format category names for display
     */
    formatCategoryName(category) {
        return category.charAt(0).toUpperCase() + category.slice(1);
    }

    /**
     * Helper: Generate color array
     */
    generateColors(count) {
        const baseColors = [
            this.colorScheme.blue,
            this.colorScheme.green,
            this.colorScheme.yellow,
            this.colorScheme.red,
            this.colorScheme.purple,
            this.colorScheme.teal,
            this.colorScheme.orange,
            this.colorScheme.indigo
        ];
        
        const colors = [];
        for (let i = 0; i < count; i++) {
            colors.push(baseColors[i % baseColors.length]);
        }
        return colors;
    }

    /**
     * Update all charts with new data
     */
    updateAllCharts(calculationResults) {
        if (calculationResults.lca) {
            this.createLCAChart('lcaChart', calculationResults.lca.totals);
        }
        
        if (calculationResults.scopes) {
            this.createScopesChart('scopesChart', {
                scope1: calculationResults.scopes.scope1.total,
                scope2: calculationResults.scopes.scope2.total,
                scope3: calculationResults.scopes.scope3.total
            });
        }
        
        if (calculationResults.materials) {
            this.createMaterialsChart('materialsChart', calculationResults.materials);
        }
    }

    /**
     * Destroy all charts (for cleanup)
     */
    destroyAllCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.destroy();
        });
        this.charts = {};
    }
}

// Create global instance
const chartsManager = new ChartsManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ChartsManager, chartsManager };
}
