/**
 * TEST SUITE FOR OPERATIONAL CARBON CALCULATOR
 *
 * Comprehensive tests for the ComprehensiveScopesCalculator class
 * Tests all three scopes, calculations, and data management
 */

describe('ComprehensiveScopesCalculator', () => {
    let calculator;

    beforeEach(() => {
        // Create fresh calculator instance for each test
        calculator = new ComprehensiveScopesCalculator();
    });

    // ============================================================================
    // SCOPE 1 TESTS: Direct Emissions
    // ============================================================================

    describe('Scope 1: Direct Emissions', () => {
        test('should add equipment with fuel consumption', () => {
            const result = calculator.addScope1Equipment({
                category: 'excavators',
                type: 'standard_13t',
                operatingHours: 100
            });

            expect(result.emissions).toBeGreaterThan(0);
            expect(result.fuelType).toBe('diesel');
            expect(result.fuelConsumed).toBe(1200); // 12 L/hr * 100 hrs
            expect(calculator.scope1Items).toHaveLength(1);
        });

        test('should calculate correct emissions for diesel heater', () => {
            const result = calculator.addScope1Equipment({
                category: 'heating',
                type: 'dieselHeater_small',
                operatingHours: 50
            });

            // Small diesel heater: 2 L/hr * 50 hrs = 100L
            // 100L * 2.68 kg CO2-e/L = 268 kg = 0.268 tonnes
            expect(result.fuelConsumed).toBe(100);
            expect(result.emissions).toBeCloseTo(0.268, 2);
        });

        test('should add vehicle with distance calculation', () => {
            const result = calculator.addScope1Vehicle({
                type: 'ute_diesel',
                distance: 1000, // 1000 km
                fuelType: 'diesel'
            });

            // Ute diesel: 8 L/100km * 10 = 80L
            // 80L * 2.68 = 214.4 kg = 0.2144 tonnes
            expect(result.emissions).toBeCloseTo(0.2144, 3);
        });

        test('should handle custom fuel rate', () => {
            const result = calculator.addScope1Equipment({
                category: 'generators',
                type: '100kVA',
                operatingHours: 50,
                fuelUsed: 1000 // User provided actual fuel
            });

            // 1000L * 2.68 = 2680 kg = 2.68 tonnes
            expect(result.emissions).toBeCloseTo(2.68, 2);
        });

        test('should calculate Scope 1 total correctly', () => {
            calculator.addScope1Equipment({
                category: 'excavators',
                type: 'mini_3t',
                operatingHours: 100
            });

            calculator.addScope1Vehicle({
                type: 'ute_diesel',
                distance: 500,
                fuelType: 'diesel'
            });

            const total = calculator.calculateScope1Total();
            expect(total.total).toBeGreaterThan(0);
            expect(total.items).toHaveLength(2);
            expect(total.breakdown).toHaveProperty('excavators');
            expect(total.breakdown).toHaveProperty('vehicles');
        });
    });

    // ============================================================================
    // SCOPE 2 TESTS: Purchased Electricity
    // ============================================================================

    describe('Scope 2: Purchased Electricity', () => {
        test('should add electricity usage with state-specific factor', () => {
            const result = calculator.addScope2Electricity({
                description: 'Monthly site power',
                kWh: 10000,
                state: 'vic',
                days: 30
            });

            // 10000 kWh * 1.02 (VIC factor) = 10200 kg = 10.2 tonnes
            expect(result.emissions).toBeCloseTo(10.2, 2);
            expect(result.state).toBe('vic');
        });

        test('should use ACT renewable factor correctly', () => {
            const result = calculator.addScope2Electricity({
                description: 'ACT site',
                kWh: 5000,
                state: 'act',
                days: 30
            });

            // ACT has 0.0 emissions factor (100% renewable)
            expect(result.emissions).toBe(0);
        });

        test('should calculate site facility usage', () => {
            const result = calculator.addScope2SiteFacility({
                type: 'siteOffice_large',
                days: 180,
                state: 'nsw'
            });

            // Large office: 80 kWh/day * 180 days = 14400 kWh
            // 14400 * 0.81 (NSW) = 11664 kg = 11.664 tonnes
            expect(result.totalKWh).toBe(14400);
            expect(result.emissions).toBeCloseTo(11.664, 2);
        });

        test('should calculate electric equipment usage', () => {
            const result = calculator.addScope2ElectricEquipment({
                category: 'hoists',
                type: 'alimakHoist_single',
                operatingHours: 500,
                state: 'qld'
            });

            // Alimak hoist: 12 kWh/hr * 500 = 6000 kWh
            // 6000 * 0.79 (QLD) = 4740 kg = 4.74 tonnes
            expect(result.totalKWh).toBe(6000);
            expect(result.emissions).toBeCloseTo(4.74, 2);
        });

        test('should calculate Scope 2 total correctly', () => {
            calculator.addScope2Electricity({
                description: 'Site power',
                kWh: 5000,
                state: 'nsw',
                days: 30
            });

            calculator.addScope2SiteFacility({
                type: 'siteLighting_full',
                days: 100,
                state: 'nsw'
            });

            const total = calculator.calculateScope2Total();
            expect(total.total).toBeGreaterThan(0);
            expect(total.items).toHaveLength(2);
        });
    });

    // ============================================================================
    // SCOPE 3 TESTS: Value Chain
    // ============================================================================

    describe('Scope 3: Value Chain Emissions', () => {
        test('should calculate transport emissions', () => {
            const result = calculator.addScope3Transport({
                material: 'Concrete',
                weight: 500, // tonnes
                distance: 30, // km
                transportMode: 'rigidTruck'
            });

            // 500t * 30km * 0.62 kg/tonne-km = 9300 kg = 9.3 tonnes
            expect(result.emissions).toBeCloseTo(9.3, 2);
        });

        test('should calculate waste landfill emissions', () => {
            const result = calculator.addScope3Waste({
                material: 'General waste',
                weight: 10000, // kg
                disposalMethod: 'landfill_general'
            });

            // 10000 kg * 0.94 kg CO2-e/kg = 9400 kg = 9.4 tonnes
            expect(result.emissions).toBeCloseTo(9.4, 2);
        });

        test('should calculate recycling emissions (lower than landfill)', () => {
            const result = calculator.addScope3Waste({
                material: 'Metal waste',
                weight: 5000,
                disposalMethod: 'recycling_metal'
            });

            // 5000 * 0.08 = 400 kg = 0.4 tonnes
            expect(result.emissions).toBeCloseTo(0.4, 2);
        });

        test('should calculate water emissions', () => {
            const result = calculator.addScope3Water({
                type: 'potable',
                volume: 1000 // kL
            });

            // 1000 kL * 0.33 kg/kL = 330 kg = 0.33 tonnes
            expect(result.emissions).toBeCloseTo(0.33, 2);
        });

        test('should calculate commuting emissions', () => {
            const result = calculator.addScope3Commuting({
                employees: 50,
                avgDistance: 20, // km one-way
                days: 180,
                mode: 'car_solo'
            });

            // 50 * 20 * 180 * 2 (return) * 0.27 = 97200 kg = 97.2 tonnes
            expect(result.totalKm).toBe(360000);
            expect(result.emissions).toBeCloseTo(97.2, 1);
        });

        test('should calculate temporary works with reuse amortization', () => {
            const result = calculator.addScope3TemporaryWorks({
                type: 'scaffolding',
                area: 1000, // m²
                uses: 100 // number of reuses
            });

            // 1000 m² * 2.5 kg/m² / 100 uses = 25 kg = 0.025 tonnes
            expect(result.emissions).toBeCloseTo(0.025, 3);
        });

        test('should calculate Scope 3 total correctly', () => {
            calculator.addScope3Transport({
                material: 'Steel',
                weight: 100,
                distance: 50,
                transportMode: 'articulatedTruck'
            });

            calculator.addScope3Waste({
                material: 'Concrete',
                weight: 5000,
                disposalMethod: 'recycling_concrete'
            });

            const total = calculator.calculateScope3Total();
            expect(total.total).toBeGreaterThan(0);
            expect(total.items).toHaveLength(2);
            expect(total.breakdown.transport).toBeGreaterThan(0);
            expect(total.breakdown.waste).toBeGreaterThan(0);
        });
    });

    // ============================================================================
    // OVERALL TESTS
    // ============================================================================

    describe('Overall Calculations', () => {
        test('should calculate all scopes with percentages', () => {
            // Add items to each scope
            calculator.addScope1Equipment({
                category: 'excavators',
                type: 'standard_13t',
                operatingHours: 100
            });

            calculator.addScope2Electricity({
                description: 'Site power',
                kWh: 10000,
                state: 'nsw',
                days: 30
            });

            calculator.addScope3Transport({
                material: 'Concrete',
                weight: 500,
                distance: 30,
                transportMode: 'rigidTruck'
            });

            const results = calculator.calculateAllScopes();

            expect(results.total).toBeGreaterThan(0);
            expect(results.scope1.total).toBeGreaterThan(0);
            expect(results.scope2.total).toBeGreaterThan(0);
            expect(results.scope3.total).toBeGreaterThan(0);

            // Check percentages add up to 100
            const totalPercentage = parseFloat(results.scope1.percentage) +
                                  parseFloat(results.scope2.percentage) +
                                  parseFloat(results.scope3.percentage);
            expect(totalPercentage).toBeCloseTo(100, 0);
        });

        test('should export data correctly', () => {
            calculator.addScope1Equipment({
                category: 'generators',
                type: '100kVA',
                operatingHours: 50
            });

            const exported = calculator.exportData();

            expect(exported).toHaveProperty('scope1');
            expect(exported).toHaveProperty('scope2');
            expect(exported).toHaveProperty('scope3');
            expect(exported).toHaveProperty('calculated');
            expect(exported).toHaveProperty('timestamp');
            expect(exported.scope1).toHaveLength(1);
        });

        test('should reset calculator correctly', () => {
            calculator.addScope1Equipment({
                category: 'excavators',
                type: 'mini_3t',
                operatingHours: 50
            });

            expect(calculator.scope1Items).toHaveLength(1);

            calculator.reset();

            expect(calculator.scope1Items).toHaveLength(0);
            expect(calculator.scope2Items).toHaveLength(0);
            expect(calculator.scope3Items).toHaveLength(0);
        });

        test('should remove items correctly', () => {
            const item1 = calculator.addScope1Equipment({
                category: 'excavators',
                type: 'mini_3t',
                operatingHours: 50
            });

            const item2 = calculator.addScope1Equipment({
                category: 'excavators',
                type: 'standard_13t',
                operatingHours: 100
            });

            expect(calculator.scope1Items).toHaveLength(2);

            calculator.removeItem(1, item1.id);

            expect(calculator.scope1Items).toHaveLength(1);
            expect(calculator.scope1Items[0].id).toBe(item2.id);
        });
    });

    // ============================================================================
    // EDGE CASES & VALIDATION
    // ============================================================================

    describe('Edge Cases', () => {
        test('should handle zero operating hours', () => {
            const result = calculator.addScope1Equipment({
                category: 'excavators',
                type: 'mini_3t',
                operatingHours: 0
            });

            expect(result.emissions).toBe(0);
        });

        test('should handle missing equipment type gracefully', () => {
            const result = calculator.addScope1Equipment({
                category: 'nonexistent',
                type: 'fake_type',
                operatingHours: 100
            });

            // Should still create item but with 0 consumption
            expect(result.emissions).toBe(0);
        });

        test('should handle very large numbers', () => {
            const result = calculator.addScope3Transport({
                material: 'Bulk material',
                weight: 100000,
                distance: 1000,
                transportMode: 'sea'
            });

            expect(result.emissions).toBeGreaterThan(0);
            expect(isFinite(result.emissions)).toBe(true);
        });

        test('should handle decimal values correctly', () => {
            const result = calculator.addScope2Electricity({
                description: 'Small usage',
                kWh: 123.45,
                state: 'vic',
                days: 7
            });

            expect(result.emissions).toBeCloseTo(0.12592, 4);
        });
    });
});

// ============================================================================
// TEST RUNNER (for browser environment)
// ============================================================================

if (typeof module === 'undefined') {
    console.log('Run tests with: npm test');
}
