/**
 * Minimal Test to Validate Task 1.1 Infrastructure
 */

// Test 1: Mock System Import
test('should import standalone mock system', () => {
  const {
    standaloneMockSystem,
  } = require('../main/helpers/developmentMockSystem.standalone');
  expect(standaloneMockSystem).toBeDefined();
  expect(typeof standaloneMockSystem.initialize).toBe('function');
});

// Test 2: Mock System Utils Import
test('should import mock system utils', () => {
  const {
    mockSystemUtils,
  } = require('../main/helpers/developmentMockSystem.standalone');
  expect(mockSystemUtils).toBeDefined();
  expect(typeof mockSystemUtils.createTestDevice).toBe('function');
});

// Test 3: Fixtures Import
test('should import fixtures', () => {
  const { fixtures } = require('./fixtures/mockGPUData');
  expect(fixtures).toBeDefined();
  expect(fixtures.gpuDevices).toBeDefined();
  expect(fixtures.openvinoCapabilities).toBeDefined();
});

// Test 4: Basic Mock System Functionality
test('should initialize standalone mock system', async () => {
  const {
    standaloneMockSystem,
  } = require('../main/helpers/developmentMockSystem.standalone');

  // Set environment for testing
  const originalNodeEnv = process.env.NODE_ENV;
  const originalForceFlag = process.env.FORCE_MOCK_INTEL_GPU;

  try {
    process.env.NODE_ENV = 'test';
    process.env.FORCE_MOCK_INTEL_GPU = 'true';

    await standaloneMockSystem.initialize({
      mockIntelGPUs: true,
      mockNetworkDelay: 0,
      forceErrors: false,
    });

    expect(standaloneMockSystem.isMockingEnabled()).toBe(true);

    // Test device enumeration
    const devices = await standaloneMockSystem.enumerateGPUDevices();
    expect(Array.isArray(devices)).toBe(true);
    expect(devices.length).toBeGreaterThan(0);

    // Test OpenVINO capabilities
    const capabilities = await standaloneMockSystem.getOpenVINOCapabilities();
    expect(capabilities).toBeDefined();
    expect(typeof capabilities.isInstalled).toBe('boolean');

    standaloneMockSystem.reset();
  } finally {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.FORCE_MOCK_INTEL_GPU = originalForceFlag;
  }
});

// Test 5: Fixture Data Validation
test('should validate fixture data structure', () => {
  const { fixtures } = require('./fixtures/mockGPUData');

  // Test Arc A770 fixture
  const arcA770 = fixtures.gpuDevices.arcA770();
  expect(arcA770).toBeDefined();
  expect(arcA770.id).toBe('intel-arc-a770-16gb');
  expect(arcA770.name).toBe('Intel Arc A770 16GB');
  expect(arcA770.vendor).toBe('intel');
  expect(arcA770.capabilities.openvinoCompatible).toBe(true);

  // Test OpenVINO capabilities fixture
  const capabilities = fixtures.openvinoCapabilities.fullInstallation();
  expect(capabilities).toBeDefined();
  expect(capabilities.isInstalled).toBe(true);
  expect(capabilities.version).toBe('2024.6.0');
  expect(Array.isArray(capabilities.supportedDevices)).toBe(true);
});

console.log('✅ Task 1.1 Infrastructure Validation Complete');
