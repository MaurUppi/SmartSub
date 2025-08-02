/**
 * Unit Tests for Mock GPU Data Fixtures
 * 
 * Tests for GPU device fixtures, OpenVINO capabilities,
 * performance benchmarks, and test scenario configurations.
 */

import {
  fixtures,
  intelGPUFixtures,
  openVinoCapabilityFixtures,
  performanceBenchmarkFixtures,
  errorSimulationFixtures,
  testScenarioFixtures,
  fixtureUtils
} from '../fixtures/mockGPUData';

import { TestAssertions } from '../setup/mockEnvironment';

describe('Intel GPU Fixtures', () => {
  describe('Intel Arc A-series GPUs', () => {
    test('should provide Intel Arc A770 fixture', () => {
      const device = intelGPUFixtures.arcA770();
      
      TestAssertions.assertValidGPUDevice(device);
      expect(device.id).toBe('intel-arc-a770-16gb');
      expect(device.name).toBe('Intel Arc A770 16GB');
      expect(device.type).toBe('discrete');
      expect(device.vendor).toBe('intel');
      expect(device.deviceId).toBe('56A0');
      expect(device.memory).toBe(16384);
      expect(device.capabilities.openvinoCompatible).toBe(true);
      expect(device.performance).toBe('high');
    });

    test('should provide Intel Arc A750 fixture', () => {
      const device = intelGPUFixtures.arcA750();
      
      TestAssertions.assertValidGPUDevice(device);
      expect(device.id).toBe('intel-arc-a750-8gb');
      expect(device.name).toBe('Intel Arc A750 8GB');
      expect(device.memory).toBe(8192);
      expect(device.deviceId).toBe('56A1');
      expect(device.performance).toBe('high');
    });

    test('should provide Intel Arc A580 fixture', () => {
      const device = intelGPUFixtures.arcA580();
      
      TestAssertions.assertValidGPUDevice(device);
      expect(device.id).toBe('intel-arc-a580-8gb');
      expect(device.performance).toBe('medium');
      expect(device.capabilities.openvinoCompatible).toBe(true);
    });

    test('should provide Intel Arc A380 fixture', () => {
      const device = intelGPUFixtures.arcA380();
      
      TestAssertions.assertValidGPUDevice(device);
      expect(device.id).toBe('intel-arc-a380-6gb');
      expect(device.memory).toBe(6144);
      expect(device.deviceId).toBe('56A5');
    });

    test('should have consistent Arc series characteristics', () => {
      const arcGPUs = [
        intelGPUFixtures.arcA770(),
        intelGPUFixtures.arcA750(),
        intelGPUFixtures.arcA580(),
        intelGPUFixtures.arcA380(),
      ];
      
      arcGPUs.forEach(gpu => {
        expect(gpu.type).toBe('discrete');
        expect(gpu.vendor).toBe('intel');
        expect(gpu.capabilities.openvinoCompatible).toBe(true);
        expect(gpu.capabilities.cudaCompatible).toBe(false);
        expect(gpu.powerEfficiency).toBe('good');
        expect(gpu.driverVersion).toBe('31.0.101.4887');
      });
      
      // Should be sorted by priority/performance
      expect(arcGPUs[0].priority).toBeGreaterThanOrEqual(arcGPUs[1].priority);
      expect(arcGPUs[1].priority).toBeGreaterThanOrEqual(arcGPUs[2].priority);
      expect(arcGPUs[2].priority).toBeGreaterThanOrEqual(arcGPUs[3].priority);
    });
  });

  describe('Intel Xe Integrated Graphics', () => {
    test('should provide Intel Xe Graphics fixture', () => {
      const device = intelGPUFixtures.xeGraphics();
      
      TestAssertions.assertValidGPUDevice(device);
      expect(device.id).toBe('intel-xe-graphics');
      expect(device.type).toBe('integrated');
      expect(device.memory).toBe('shared');
      expect(device.powerEfficiency).toBe('excellent');
      expect(device.performance).toBe('medium');
    });

    test('should provide Intel Iris Xe Graphics fixture', () => {
      const device = intelGPUFixtures.irisXe();
      
      TestAssertions.assertValidGPUDevice(device);
      expect(device.id).toBe('intel-iris-xe-graphics');
      expect(device.type).toBe('integrated');
      expect(device.memory).toBe('shared');
      expect(device.deviceId).toBe('9A60');
    });

    test('should provide Intel Iris Xe MAX Graphics fixture', () => {
      const device = intelGPUFixtures.irisXeMax();
      
      TestAssertions.assertValidGPUDevice(device);
      expect(device.id).toBe('intel-iris-xe-max-graphics');
      expect(device.type).toBe('discrete');
      expect(device.memory).toBe(4096);
      expect(device.deviceId).toBe('4905');
    });

    test('should have consistent Xe series characteristics', () => {
      const xeGPUs = [
        intelGPUFixtures.xeGraphics(),
        intelGPUFixtures.irisXe(),
        intelGPUFixtures.irisXeMax(),
      ];
      
      xeGPUs.forEach(gpu => {
        expect(gpu.vendor).toBe('intel');
        expect(gpu.capabilities.openvinoCompatible).toBe(true);
        expect(gpu.capabilities.cudaCompatible).toBe(false);
        expect(gpu.driverVersion).toBe('31.0.101.4887');
      });
    });
  });

  describe('Legacy Intel Graphics', () => {
    test('should provide Intel UHD 630 fixture', () => {
      const device = intelGPUFixtures.uhd630();
      
      TestAssertions.assertValidGPUDevice(device);
      expect(device.id).toBe('intel-uhd-graphics-630');
      expect(device.type).toBe('integrated');
      expect(device.capabilities.openvinoCompatible).toBe(false);
      expect(device.performance).toBe('low');
      expect(device.driverVersion).toBe('27.20.100.9316');
    });
  });

  describe('Non-Intel GPU Fixtures', () => {
    test('should provide NVIDIA RTX 4090 fixture', () => {
      const device = intelGPUFixtures.nvidiaRTX4090();
      
      TestAssertions.assertValidGPUDevice(device);
      expect(device.vendor).toBe('nvidia');
      expect(device.capabilities.cudaCompatible).toBe(true);
      expect(device.capabilities.openvinoCompatible).toBe(true);
      expect(device.memory).toBe(24576);
    });

    test('should provide Apple M1 fixture', () => {
      const device = intelGPUFixtures.appleM1();
      
      TestAssertions.assertValidGPUDevice(device);
      expect(device.vendor).toBe('apple');
      expect(device.capabilities.coremlCompatible).toBe(true);
      expect(device.capabilities.openvinoCompatible).toBe(false);
      expect(device.powerEfficiency).toBe('excellent');
    });
  });
});

describe('OpenVINO Capability Fixtures', () => {
  test('should provide full installation fixture', () => {
    const capabilities = openVinoCapabilityFixtures.fullInstallation();
    
    TestAssertions.assertValidOpenVINOCapabilities(capabilities);
    expect(capabilities.isInstalled).toBe(true);
    expect(capabilities.version).toBe('2024.1.0');
    expect(capabilities.supportedDevices).toContain('intel-arc-a770-16gb');
    expect(capabilities.supportedDevices).toContain('intel-xe-graphics');
    expect(capabilities.runtimePath).toBe('/opt/intel/openvino_2024/runtime');
    expect(capabilities.modelFormats).toContain('ONNX');
    expect(capabilities.modelFormats).toContain('TensorFlow');
  });

  test('should provide limited installation fixture', () => {
    const capabilities = openVinoCapabilityFixtures.limitedInstallation();
    
    TestAssertions.assertValidOpenVINOCapabilities(capabilities);
    expect(capabilities.isInstalled).toBe(true);
    expect(capabilities.version).toBe('2023.3.0');
    expect(capabilities.supportedDevices).toHaveLength(1);
    expect(capabilities.modelFormats).toHaveLength(2);
  });

  test('should provide not installed fixture', () => {
    const capabilities = openVinoCapabilityFixtures.notInstalled();
    
    TestAssertions.assertValidOpenVINOCapabilities(capabilities);
    expect(capabilities.isInstalled).toBe(false);
    expect(capabilities.version).toBe('');
    expect(capabilities.supportedDevices).toHaveLength(0);
    expect(capabilities.modelFormats).toHaveLength(0);
  });

  test('should provide no Intel GPU support fixture', () => {
    const capabilities = openVinoCapabilityFixtures.noIntelGPUSupport();
    
    TestAssertions.assertValidOpenVINOCapabilities(capabilities);
    expect(capabilities.isInstalled).toBe(true);
    expect(capabilities.supportedDevices).toHaveLength(0);
    expect(capabilities.modelFormats.length).toBeGreaterThan(0);
  });

  test('should provide development mock fixture', () => {
    const capabilities = openVinoCapabilityFixtures.developmentMock();
    
    TestAssertions.assertValidOpenVINOCapabilities(capabilities);
    expect(capabilities.version).toBe('2024.1.0-mock');
    expect(capabilities.runtimePath).toBe('/mock/openvino/runtime');
    expect(capabilities.supportedDevices).toContain('mock-intel-arc-a770');
  });
});

describe('Performance Benchmark Fixtures', () => {
  test('should provide Arc A770 performance fixture', () => {
    const performance = performanceBenchmarkFixtures.arcA770Performance();
    
    TestAssertions.assertValidPerformanceMetrics(performance);
    expect(performance.processingTime).toBe(120);
    expect(performance.memoryUsage).toBe(2048);
    expect(performance.powerConsumption).toBe(120);
    expect(performance.throughput).toBe(95);
    expect(performance.efficiency).toBe(0.79);
  });

  test('should provide Arc A750 performance fixture', () => {
    const performance = performanceBenchmarkFixtures.arcA750Performance();
    
    TestAssertions.assertValidPerformanceMetrics(performance);
    expect(performance.processingTime).toBe(145);
    expect(performance.throughput).toBe(78);
  });

  test('should provide Xe Graphics performance fixture', () => {
    const performance = performanceBenchmarkFixtures.xeGraphicsPerformance();
    
    TestAssertions.assertValidPerformanceMetrics(performance);
    expect(performance.processingTime).toBe(280);
    expect(performance.powerConsumption).toBe(25);
    expect(performance.efficiency).toBe(1.68);
  });

  test('should provide CPU baseline performance fixture', () => {
    const performance = performanceBenchmarkFixtures.cpuBaselinePerformance();
    
    TestAssertions.assertValidPerformanceMetrics(performance);
    expect(performance.processingTime).toBe(800);
    expect(performance.throughput).toBe(15);
    expect(performance.efficiency).toBe(0.23);
  });

  test('should show performance hierarchy', () => {
    const arcA770 = performanceBenchmarkFixtures.arcA770Performance();
    const arcA750 = performanceBenchmarkFixtures.arcA750Performance();
    const xeGraphics = performanceBenchmarkFixtures.xeGraphicsPerformance();
    const cpuBaseline = performanceBenchmarkFixtures.cpuBaselinePerformance();
    
    // Processing time should be faster (lower) for better hardware
    expect(arcA770.processingTime).toBeLessThan(arcA750.processingTime);
    expect(arcA750.processingTime).toBeLessThan(xeGraphics.processingTime);
    expect(xeGraphics.processingTime).toBeLessThan(cpuBaseline.processingTime);
    
    // Throughput should be higher for better hardware
    expect(arcA770.throughput).toBeGreaterThan(arcA750.throughput);
    expect(arcA750.throughput).toBeGreaterThan(xeGraphics.throughput);
    expect(xeGraphics.throughput).toBeGreaterThan(cpuBaseline.throughput);
  });
});

describe('Error Simulation Fixtures', () => {
  test('should provide GPU detection errors', () => {
    const errors = errorSimulationFixtures.gpuDetectionErrors;
    
    expect(errors.driverNotFound).toBeInstanceOf(Error);
    expect(errors.driverNotFound.message).toContain('driver not found');
    
    expect(errors.deviceUnavailable).toBeInstanceOf(Error);
    expect(errors.permissionDenied).toBeInstanceOf(Error);
    expect(errors.hardwareFailure).toBeInstanceOf(Error);
  });

  test('should provide OpenVINO errors', () => {
    const errors = errorSimulationFixtures.openVinoErrors;
    
    expect(errors.notInstalled).toBeInstanceOf(Error);
    expect(errors.notInstalled.message).toContain('not found');
    
    expect(errors.versionMismatch).toBeInstanceOf(Error);
    expect(errors.licenseError).toBeInstanceOf(Error);
    expect(errors.runtimeCorrupted).toBeInstanceOf(Error);
  });

  test('should provide performance errors', () => {
    const errors = errorSimulationFixtures.performanceErrors;
    
    expect(errors.outOfMemory).toBeInstanceOf(Error);
    expect(errors.outOfMemory.message).toContain('memory');
    
    expect(errors.thermalThrottling).toBeInstanceOf(Error);
    expect(errors.powerLimitExceeded).toBeInstanceOf(Error);
    expect(errors.benchmarkTimeout).toBeInstanceOf(Error);
  });
});

describe('Test Scenario Fixtures', () => {
  test('should provide single Arc GPU scenario', () => {
    const scenario = testScenarioFixtures.singleArcGPU;
    
    expect(scenario.name).toBe('Single Intel Arc GPU');
    expect(scenario.devices).toHaveLength(1);
    expect(scenario.devices[0].name).toBe('Intel Arc A770 16GB');
    expect(scenario.openvinoCapabilities.isInstalled).toBe(true);
    expect(scenario.expectedPerformance).toBeTruthy();
  });

  test('should provide multiple Intel GPU scenario', () => {
    const scenario = testScenarioFixtures.multipleIntelGPUs;
    
    expect(scenario.name).toBe('Multiple Intel GPUs');
    expect(scenario.devices).toHaveLength(3);
    
    const discrete = scenario.devices.find(d => d.type === 'discrete');
    const integrated = scenario.devices.filter(d => d.type === 'integrated');
    
    expect(discrete).toBeTruthy();
    expect(integrated).toHaveLength(2);
  });

  test('should provide mixed GPU environment scenario', () => {
    const scenario = testScenarioFixtures.mixedGPUEnvironment;
    
    expect(scenario.name).toBe('Mixed GPU Environment');
    expect(scenario.devices).toHaveLength(3);
    
    const intelGPUs = scenario.devices.filter(d => d.vendor === 'intel');
    const nvidiaGPUs = scenario.devices.filter(d => d.vendor === 'nvidia');
    
    expect(intelGPUs).toHaveLength(2);
    expect(nvidiaGPUs).toHaveLength(1);
  });

  test('should provide no Intel GPU scenario', () => {
    const scenario = testScenarioFixtures.noIntelGPU;
    
    expect(scenario.name).toBe('No Intel GPU Present');
    expect(scenario.devices).toHaveLength(2);
    expect(scenario.devices.every(d => d.vendor !== 'intel')).toBe(true);
    expect(scenario.expectedPerformance).toBeNull();
  });

  test('should provide legacy Intel GPU scenario', () => {
    const scenario = testScenarioFixtures.legacyIntelGPU;
    
    expect(scenario.name).toBe('Legacy Intel GPU');
    expect(scenario.devices).toHaveLength(1);
    expect(scenario.devices[0].capabilities.openvinoCompatible).toBe(false);
    expect(scenario.openvinoCapabilities.isInstalled).toBe(false);
  });

  test('should provide macOS development scenario', () => {
    const scenario = testScenarioFixtures.macOSDevelopment;
    
    expect(scenario.name).toBe('macOS Development Environment');
    expect(scenario.devices).toHaveLength(3);
    
    const appleGPU = scenario.devices.find(d => d.vendor === 'apple');
    const mockIntelGPUs = scenario.devices.filter(d => d.id.startsWith('mock-'));
    
    expect(appleGPU).toBeTruthy();
    expect(mockIntelGPUs).toHaveLength(2);
    expect(scenario.openvinoCapabilities.version).toContain('mock');
  });

  test('should provide error simulation scenario', () => {
    const scenario = testScenarioFixtures.errorSimulation;
    
    expect(scenario.name).toBe('Error Simulation');
    expect(scenario.devices).toHaveLength(0);
    expect(scenario.openvinoCapabilities.isInstalled).toBe(false);
    expect(scenario.expectedErrors).toHaveLength(2);
  });
});

describe('Fixture Utilities', () => {
  describe('Clone Fixture', () => {
    test('should create deep copy of fixture data', () => {
      const original = intelGPUFixtures.arcA770();
      const cloned = fixtureUtils.cloneFixture(original);
      
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.capabilities).not.toBe(original.capabilities);
      
      // Modifying clone should not affect original
      cloned.name = 'Modified Name';
      expect(original.name).toBe('Intel Arc A770 16GB');
    });
  });

  describe('Merge GPU Devices', () => {
    test('should merge multiple device arrays', () => {
      const arcGPUs = [intelGPUFixtures.arcA770(), intelGPUFixtures.arcA750()];
      const xeGPUs = [intelGPUFixtures.xeGraphics(), intelGPUFixtures.irisXe()];
      
      const merged = fixtureUtils.mergeGPUDevices(arcGPUs, xeGPUs);
      
      expect(merged).toHaveLength(4);
      expect(merged[0].name).toBe('Intel Arc A770 16GB');
      expect(merged[2].name).toBe('Intel Xe Graphics');
    });

    test('should handle empty arrays', () => {
      const result = fixtureUtils.mergeGPUDevices([], [intelGPUFixtures.arcA770()], []);
      
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Intel Arc A770 16GB');
    });
  });

  describe('Filter Devices', () => {
    test('should filter devices by vendor', () => {
      const devices = [
        intelGPUFixtures.arcA770(),
        intelGPUFixtures.nvidiaRTX4090(),
        intelGPUFixtures.appleM1(),
        intelGPUFixtures.xeGraphics(),
      ];
      
      const intelDevices = fixtureUtils.filterDevicesByVendor(devices, 'intel');
      const nvidiaDevices = fixtureUtils.filterDevicesByVendor(devices, 'nvidia');
      const appleDevices = fixtureUtils.filterDevicesByVendor(devices, 'apple');
      
      expect(intelDevices).toHaveLength(2);
      expect(nvidiaDevices).toHaveLength(1);
      expect(appleDevices).toHaveLength(1);
      
      expect(intelDevices.every(d => d.vendor === 'intel')).toBe(true);
      expect(nvidiaDevices.every(d => d.vendor === 'nvidia')).toBe(true);
      expect(appleDevices.every(d => d.vendor === 'apple')).toBe(true);
    });

    test('should filter OpenVINO compatible devices', () => {
      const devices = [
        intelGPUFixtures.arcA770(), // Compatible
        intelGPUFixtures.uhd630(),  // Not compatible
        intelGPUFixtures.nvidiaRTX4090(), // Compatible
        intelGPUFixtures.appleM1(), // Not compatible
      ];
      
      const compatibleDevices = fixtureUtils.filterOpenVINOCompatibleDevices(devices);
      
      expect(compatibleDevices).toHaveLength(2);
      expect(compatibleDevices.every(d => d.capabilities.openvinoCompatible)).toBe(true);
    });
  });

  describe('Sort Devices', () => {
    test('should sort devices by priority', () => {
      const devices = [
        intelGPUFixtures.xeGraphics(), // Priority 4
        intelGPUFixtures.arcA770(),   // Priority 8
        intelGPUFixtures.arcA750(),   // Priority 7
        intelGPUFixtures.irisXe(),    // Priority 5
      ];
      
      const sorted = fixtureUtils.sortDevicesByPriority(devices);
      
      expect(sorted[0].priority).toBe(8); // Arc A770
      expect(sorted[1].priority).toBe(7); // Arc A750
      expect(sorted[2].priority).toBe(5); // Iris Xe
      expect(sorted[3].priority).toBe(4); // Xe Graphics
      
      // Original array should not be modified
      expect(devices[0].priority).toBe(4);
    });
  });

  describe('Performance Variance', () => {
    test('should add realistic performance variance', () => {
      const baseMetrics = performanceBenchmarkFixtures.arcA770Performance();
      const variedMetrics = fixtureUtils.addPerformanceVariance(baseMetrics, 10);
      
      // Should have all required properties
      TestAssertions.assertValidPerformanceMetrics(variedMetrics);
      
      // Should be within variance range (±10%)
      const processingTimeVariance = Math.abs(variedMetrics.processingTime - baseMetrics.processingTime) / baseMetrics.processingTime;
      expect(processingTimeVariance).toBeLessThanOrEqual(0.1);
      
      const memoryUsageVariance = Math.abs(variedMetrics.memoryUsage - baseMetrics.memoryUsage) / baseMetrics.memoryUsage;
      expect(memoryUsageVariance).toBeLessThanOrEqual(0.1);
    });

    test('should apply custom variance percentage', () => {
      const baseMetrics = performanceBenchmarkFixtures.arcA770Performance();
      const variedMetrics = fixtureUtils.addPerformanceVariance(baseMetrics, 20);
      
      const processingTimeVariance = Math.abs(variedMetrics.processingTime - baseMetrics.processingTime) / baseMetrics.processingTime;
      expect(processingTimeVariance).toBeLessThanOrEqual(0.2);
    });
  });

  describe('Custom Test Device', () => {
    test('should create custom test device with overrides', () => {
      const baseDevice = intelGPUFixtures.arcA770();
      const customDevice = fixtureUtils.createCustomTestDevice(baseDevice, {
        name: 'Custom Arc A770',
        memory: 32768,
        performance: 'medium',
      });
      
      expect(customDevice.name).toBe('Custom Arc A770');
      expect(customDevice.memory).toBe(32768);
      expect(customDevice.performance).toBe('medium');
      expect(customDevice.vendor).toBe('intel'); // Should keep from base
      expect(customDevice.id).toMatch(/^custom-\d+$/);
    });

    test('should generate unique custom device IDs', () => {
      const baseDevice = intelGPUFixtures.arcA770();
      const device1 = fixtureUtils.createCustomTestDevice(baseDevice, {});
      const device2 = fixtureUtils.createCustomTestDevice(baseDevice, {});
      
      expect(device1.id).not.toBe(device2.id);
      expect(device1.id).toMatch(/^custom-\d+$/);
      expect(device2.id).toMatch(/^custom-\d+$/);
    });

    test('should not modify base device', () => {
      const baseDevice = intelGPUFixtures.arcA770();
      const originalName = baseDevice.name;
      
      fixtureUtils.createCustomTestDevice(baseDevice, {
        name: 'Modified Name',
      });
      
      expect(baseDevice.name).toBe(originalName);
    });
  });
});

describe('Fixtures Export', () => {
  test('should export organized fixture collections', () => {
    expect(fixtures).toHaveProperty('gpuDevices');
    expect(fixtures).toHaveProperty('openvinoCapabilities');
    expect(fixtures).toHaveProperty('performanceBenchmarks');
    expect(fixtures).toHaveProperty('errorSimulations');
    expect(fixtures).toHaveProperty('testScenarios');
    expect(fixtures).toHaveProperty('utils');
    
    expect(fixtures.gpuDevices).toBe(intelGPUFixtures);
    expect(fixtures.openvinoCapabilities).toBe(openVinoCapabilityFixtures);
    expect(fixtures.performanceBenchmarks).toBe(performanceBenchmarkFixtures);
    expect(fixtures.errorSimulations).toBe(errorSimulationFixtures);
    expect(fixtures.testScenarios).toBe(testScenarioFixtures);
    expect(fixtures.utils).toBe(fixtureUtils);
  });

  test('should be available as default export', () => {
    // Default export should match named export
    expect(fixtures).toBeDefined();
    expect(typeof fixtures).toBe('object');
  });
});