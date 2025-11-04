/**
 * Chart.js Lazy Loader
 *
 * Loads Chart.js only when needed, not blocking initial page load.
 * Provides a wrapper for all chart operations with automatic loading.
 *
 * Usage:
 *   await ChartLoader.loadChart();
 *   const chart = ChartLoader.createChart(ctx, config);
 */

class ChartJSLoader {
    constructor() {
        this.loaded = false;
        this.loading = false;
        this.loadPromise = null;
        this.chartInstances = [];
    }

    /**
     * Check if Chart.js is already loaded
     */
    isLoaded() {
        return typeof Chart !== 'undefined' || this.loaded;
    }

    /**
     * Load Chart.js library from CDN
     */
    async loadChart() {
        // If already loaded, return immediately
        if (this.isLoaded()) {
            return true;
        }

        // If currently loading, wait for that to finish
        if (this.loading) {
            return this.loadPromise;
        }

        // Start loading
        this.loading = true;
        console.log('📊 Loading Chart.js...');

        this.loadPromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
            script.async = true;

            script.onload = () => {
                this.loaded = true;
                this.loading = false;
                console.log('✅ Chart.js loaded successfully');
                resolve(true);
            };

            script.onerror = () => {
                this.loading = false;
                console.error('❌ Failed to load Chart.js');
                reject(new Error('Failed to load Chart.js'));
            };

            document.head.appendChild(script);
        });

        return this.loadPromise;
    }

    /**
     * Create a chart with automatic loading
     */
    async createChart(ctx, config) {
        // Ensure Chart.js is loaded
        await this.loadChart();

        if (!this.isLoaded()) {
            throw new Error('Chart.js failed to load');
        }

        // Create chart instance
        const chart = new Chart(ctx, config);

        // Track instance for cleanup
        this.chartInstances.push(chart);

        return chart;
    }

    /**
     * Update an existing chart
     */
    updateChart(chart, newData) {
        if (!chart) return;

        // Update chart data
        if (newData.labels) {
            chart.data.labels = newData.labels;
        }

        if (newData.datasets) {
            chart.data.datasets = newData.datasets;
        }

        chart.update();
    }

    /**
     * Destroy a chart instance
     */
    destroyChart(chart) {
        if (!chart) return;

        chart.destroy();

        // Remove from tracked instances
        const index = this.chartInstances.indexOf(chart);
        if (index > -1) {
            this.chartInstances.splice(index, 1);
        }
    }

    /**
     * Destroy all chart instances
     */
    destroyAllCharts() {
        this.chartInstances.forEach(chart => {
            try {
                chart.destroy();
            } catch (error) {
                console.warn('Error destroying chart:', error);
            }
        });

        this.chartInstances = [];
    }

    /**
     * Preload Chart.js in the background (non-blocking)
     */
    preload() {
        // Load in background without blocking
        setTimeout(() => {
            this.loadChart().catch(error => {
                console.warn('Chart.js preload failed:', error);
            });
        }, 100);
    }

    /**
     * Create common chart configurations
     */
    getDefaultConfig(type) {
        const configs = {
            pie: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            boxWidth: 15,
                            padding: 10
                        }
                    }
                }
            },
            bar: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: {
                        display: true
                    }
                }
            },
            line: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: {
                        display: true
                    }
                }
            },
            doughnut: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            boxWidth: 15,
                            padding: 10
                        }
                    }
                }
            }
        };

        return configs[type] || {};
    }

    /**
     * Create a chart with loading indicator
     */
    async createChartWithLoader(canvasId, config) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            throw new Error(`Canvas element #${canvasId} not found`);
        }

        // Get container
        const container = canvas.parentElement;

        // Add loading indicator
        const loader = document.createElement('div');
        loader.className = 'chart-loading';
        loader.innerHTML = `
            <div class="flex items-center justify-center h-full">
                <i class="fas fa-spinner fa-spin text-brand-forest text-3xl"></i>
                <span class="ml-3 text-brand-steel">Loading chart...</span>
            </div>
        `;
        loader.style.position = 'absolute';
        loader.style.top = '0';
        loader.style.left = '0';
        loader.style.right = '0';
        loader.style.bottom = '0';
        loader.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
        loader.style.display = 'flex';
        loader.style.alignItems = 'center';
        loader.style.justifyContent = 'center';

        container.style.position = 'relative';
        container.appendChild(loader);

        try {
            // Load Chart.js and create chart
            const chart = await this.createChart(canvas, config);

            // Remove loader
            setTimeout(() => {
                loader.remove();
            }, 300);

            return chart;
        } catch (error) {
            // Show error in loader
            loader.innerHTML = `
                <div class="text-center">
                    <i class="fas fa-exclamation-triangle text-red-600 text-3xl mb-2"></i>
                    <p class="text-red-600">Failed to load chart</p>
                </div>
            `;
            throw error;
        }
    }
}

// Create global instance
const ChartLoader = new ChartJSLoader();

// Preload Chart.js after page load (non-blocking)
if (document.readyState === 'complete') {
    ChartLoader.preload();
} else {
    window.addEventListener('load', () => {
        ChartLoader.preload();
    });
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ChartJSLoader, ChartLoader };
}

// Make available globally
window.ChartLoader = ChartLoader;
