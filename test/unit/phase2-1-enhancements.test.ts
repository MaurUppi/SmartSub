/**
 * Phase 2.1 Enhancement Unit Tests
 *
 * Focused unit tests for the specific enhancements made in Phase 2.1:
 * - GPU mock data enhancements
 * - Performance benchmark fixtures
 * - Cross-platform scenario validation
 * - Driver compatibility utilities
 *
 * These tests complement the integration tests to ensure comprehensive coverage.
 */

import { fixtures } from '../fixtures/mockGPUData';

describe('Phase 2.1 Enhancement Unit Tests', () => {
  describe('GPU Mock Data Enhancements', () => {
    test('should provide Intel Arc A380 with correct specifications', () => {
      const arcA380 = fixtures.gpuDevices.arcA380();

      expect(arcA380.id).toBe('intel-arc-a380-6gb');
      expect(arcA380.name).toBe('Intel Arc A380 6GB');
      expect(arcA380.memory).toBe(6144); // 6GB
      expect(arcA380.type).toBe('discrete');
      expect(arcA380.priority).toBe(5);
      expect(arcA380.performance).toBe('medium');
    });

    test('should provide Intel Iris Xe Max with discrete characteristics', () => {
      const irisXeMax = fixtures.gpuDevices.irisXeMax();

      expect(irisXeMax.id).toBe('intel-iris-xe-max-graphics');
      expect(irisXeMax.memory).toBe(4096); // 4GB discrete memory
      expect(irisXeMax.type).toBe('discrete');
      expect(irisXeMax.priority).toBe(6);
    });

    test('should maintain consistent device IDs across GPU fixtures', () => {
      const allGPUs = [
        fixtures.gpuDevices.arcA770(),
        fixtures.gpuDevices.arcA750(),
        fixtures.gpuDevices.arcA580(),
        fixtures.gpuDevices.arcA380(),
        fixtures.gpuDevices.xeGraphics(),
        fixtures.gpuDevices.irisXe(),
        fixtures.gpuDevices.irisXeMax(),
      ];

      const deviceIds = allGPUs.map((gpu) => gpu.deviceId);
      const uniqueIds = new Set(deviceIds);

      expect(uniqueIds.size).toBe(deviceIds.length); // All IDs should be unique

      // All Intel devices should have proper device IDs
      for (const gpu of allGPUs) {
        expect(gpu.deviceId).toMatch(/^[0-9A-F]{4}$/); // 4-character hex
      }
    });

    test('should provide realistic driver versions for all GPUs', () => {
      const allGPUs = [
        fixtures.gpuDevices.arcA770(),
        fixtures.gpuDevices.arcA750(),
        fixtures.gpuDevices.arcA580(),
        fixtures.gpuDevices.arcA380(),
        fixtures.gpuDevices.xeGraphics(),
        fixtures.gpuDevices.irisXe(),
        fixtures.gpuDevices.irisXeMax(),
      ];

      for (const gpu of allGPUs) {
        expect(gpu.driverVersion).toMatch(/^\d+\.\d+\.\d+\.\d+$/);

        // All should use recent driver versions
        const majorVersion = parseInt(gpu.driverVersion.split('.')[0]);
        expect(majorVersion).toBeGreaterThanOrEqual(31);
      }
    });
  });

  describe('Performance Benchmark Fixtures', () => {
    test('should provide Arc A380 performance characteristics', () => {
      const perf = fixtures.performanceBenchmarks.arcA380Performance();

      expect(perf.speedupFactor).toBeGreaterThanOrEqual(2.2);
      expect(perf.speedupFactor).toBeLessThanOrEqual(2.8);
      expect(perf.processingTime).toBe(205);
      expect(perf.memoryUsage).toBe(1024);
      expect(perf.powerConsumption).toBe(75);
      expect(perf.realTimeRatio).toBeCloseTo(4.9);
    });

    test('should provide Iris Xe Max performance characteristics', () => {
      const perf = fixtures.performanceBenchmarks.irisXeMaxPerformance();

      expect(perf.speedupFactor).toBeGreaterThanOrEqual(2.5);
      expect(perf.speedupFactor).toBeLessThanOrEqual(3.2);
      expect(perf.efficiency).toBeCloseTo(0.96);
      expect(perf.powerConsumption).toBe(50); // Lower power than discrete
    });

    test('should provide Windows platform variance characteristics', () => {
      const variance = fixtures.performanceBenchmarks.windowsPlatformVariance();

      expect(variance.driverOverhead).toBe(0.95); // 5% overhead
      expect(variance.schedulingEfficiency).toBe(0.98); // 2% loss
      expect(variance.memoryOverhead).toBe(1.1); // 10% more memory
      expect(variance.powerEfficiencyFactor).toBe(0.92); // 8% less efficient
    });

    test('should provide Linux platform variance characteristics', () => {
      const variance = fixtures.performanceBenchmarks.linuxPlatformVariance();

      expect(variance.driverOverhead).toBe(1.0); // No overhead
      expect(variance.schedulingEfficiency).toBe(1.02); // 2% improvement
      expect(variance.memoryOverhead).toBe(0.95); // 5% less memory
      expect(variance.powerEfficiencyFactor).toBe(1.05); // 5% more efficient
    });

    test('should maintain performance hierarchy across Intel GPUs', () => {
      const performances = [
        {
          name: 'Arc A770',
          perf: fixtures.performanceBenchmarks.arcA770Performance(),
        },
        {
          name: 'Arc A750',
          perf: fixtures.performanceBenchmarks.arcA750Performance(),
        },
        {
          name: 'Arc A580',
          perf: fixtures.performanceBenchmarks.arcA580Performance(),
        },
        {
          name: 'Arc A380',
          perf: fixtures.performanceBenchmarks.arcA380Performance(),
        },
        {
          name: 'Xe Graphics',
          perf: fixtures.performanceBenchmarks.xeGraphicsPerformance(),
        },
      ];

      // Arc A770 should be fastest
      const a770 = performances.find((p) => p.name === 'Arc A770')!.perf;
      const others = performances.filter((p) => p.name !== 'Arc A770');

      for (const other of others) {
        expect(a770.speedupFactor).toBeGreaterThanOrEqual(
          other.perf.speedupFactor,
        );
        expect(a770.throughput).toBeGreaterThanOrEqual(other.perf.throughput);
      }
    });
  });

  describe('Cross-Platform Test Scenarios', () => {
    test('should provide Windows 11 Arc A770 scenario', () => {
      const scenario = fixtures.testScenarios.windows11ArcA770;

      expect(scenario.name).toBe('Windows 11 + Intel Arc A770');
      expect(scenario.platform).toBe('windows');
      expect(scenario.osVersion).toBe('10.0.22621');
      expect(scenario.devices).toHaveLength(1);
      expect(scenario.devices[0].name).toContain('Arc A770');
      expect(scenario.openvinoCapabilities.installationMethod).toBe('msi');
    });

    test('should provide Ubuntu 22.04 Arc A750 scenario', () => {
      const scenario = fixtures.testScenarios.ubuntu2204ArcA750;

      expect(scenario.name).toBe('Ubuntu 22.04 + Intel Arc A750');
      expect(scenario.platform).toBe('linux');
      expect(scenario.osVersion).toBe('5.15.0-91-generic');
      expect(scenario.openvinoCapabilities.installationMethod).toBe('apt');
      expect(scenario.openvinoCapabilities.runtimePath).toBe(
        '/opt/intel/openvino_2024/runtime',
      );
    });

    test('should provide Windows 10 Xe Graphics scenario', () => {
      const scenario = fixtures.testScenarios.windows10XeGraphics;

      expect(scenario.platform).toBe('windows');
      expect(scenario.osVersion).toBe('10.0.19045'); // Windows 10
      expect(scenario.devices[0].type).toBe('integrated');
      expect(scenario.devices[0].memory).toBe('shared');
    });

    test('should provide Ubuntu 20.04 Xe Graphics scenario', () => {
      const scenario = fixtures.testScenarios.ubuntu2004XeGraphics;

      expect(scenario.platform).toBe('linux');
      expect(scenario.osVersion).toBe('5.4.0-150-generic'); // Ubuntu 20.04
      expect(scenario.openvinoCapabilities.installationMethod).toBe('pip');
    });

    test('should provide hybrid system scenario', () => {
      const scenario = fixtures.testScenarios.hybridSystemScenario;

      expect(scenario.name).toBe('Hybrid System (Arc A770 + Xe Graphics)');
      expect(scenario.devices).toHaveLength(2);
      expect(scenario.selectionLogic).toBe('discrete_preferred');
      expect(scenario.multiGPUSupport).toBe(true);

      const discreteCount = scenario.devices.filter(
        (gpu) => gpu.type === 'discrete',
      ).length;
      const integratedCount = scenario.devices.filter(
        (gpu) => gpu.type === 'integrated',
      ).length;
      expect(discreteCount).toBe(1);
      expect(integratedCount).toBe(1);
    });
  });

  describe('Driver Compatibility Test Cases', () => {
    test('should provide driver compatibility test matrix', () => {
      const testCases =
        fixtures.testScenarios.driverCompatibilityTest.testCases;

      expect(testCases).toHaveLength(4);

      const optimal = testCases.find((t) => t.compatibility === 'optimal')!;
      expect(optimal.driverVersion).toBe('31.0.101.4887');
      expect(optimal.expectedSpeedup).toBe(3.5);
      expect(optimal.supportedModels).toContain('large-v3');

      const incompatible = testCases.find(
        (t) => t.compatibility === 'incompatible',
      )!;
      expect(incompatible.driverVersion).toBe('27.20.100.9316');
      expect(incompatible.expectedSpeedup).toBe(1.0);
      expect(incompatible.supportedModels).toHaveLength(0);
    });

    test('should validate all driver compatibility levels', () => {
      const testCases =
        fixtures.testScenarios.driverCompatibilityTest.testCases;
      const compatibilityLevels = [
        'optimal',
        'good',
        'limited',
        'incompatible',
      ];

      for (const level of compatibilityLevels) {
        const hasLevel = testCases.some((t) => t.compatibility === level);
        expect(hasLevel).toBe(true);
      }
    });
  });

  describe('Utility Functions', () => {
    test('should apply platform variance correctly', () => {
      const baseMetrics = {
        processingTime: 100,
        memoryUsage: 1000,
        speedupFactor: 3.0,
        powerConsumption: 100,
      };

      const windowsVariance =
        fixtures.performanceBenchmarks.windowsPlatformVariance();
      const result = fixtures.utils.applyPlatformVariance(
        baseMetrics,
        windowsVariance,
      );

      expect(result.processingTime).toBeCloseTo(100 / 0.98); // Adjusted by scheduling efficiency
      expect(result.memoryUsage).toBeCloseTo(1000 * 1.1); // Adjusted by memory overhead
      expect(result.speedupFactor).toBeCloseTo(3.0 * 0.95); // Adjusted by driver overhead
      expect(result.powerConsumption).toBeCloseTo(100 / 0.92); // Adjusted by power efficiency
    });

    test('should validate driver compatibility for optimal versions', () => {
      const compatibility =
        fixtures.utils.validateDriverCompatibility('31.0.101.4887');

      expect(compatibility.compatible).toBe(true);
      expect(compatibility.compatibility).toBe('optimal');
      expect(compatibility.supportedFeatures).toContain('openvino');
      expect(compatibility.supportedFeatures).toContain(
        'hardware_acceleration',
      );
      expect(compatibility.supportedFeatures).toContain('all_models');
      expect(compatibility.supportedFeatures).toContain(
        'performance_optimization',
      );
      expect(compatibility.recommendedAction).toBeUndefined();
    });

    test('should validate driver compatibility for good versions', () => {
      const compatibility =
        fixtures.utils.validateDriverCompatibility('31.0.101.4502');

      expect(compatibility.compatible).toBe(true);
      expect(compatibility.compatibility).toBe('good');
      expect(compatibility.supportedFeatures).toContain('openvino');
      expect(compatibility.supportedFeatures).toContain(
        'hardware_acceleration',
      );
      expect(compatibility.supportedFeatures).toContain('most_models');
    });

    test('should validate driver compatibility for limited versions', () => {
      const compatibility =
        fixtures.utils.validateDriverCompatibility('30.0.100.9955');

      expect(compatibility.compatible).toBe(true);
      expect(compatibility.compatibility).toBe('limited');
      expect(compatibility.supportedFeatures).toContain('basic_openvino');
      expect(compatibility.supportedFeatures).toContain('small_models');
      expect(compatibility.recommendedAction).toContain(
        'Update to Intel Graphics Driver',
      );
    });

    test('should validate driver compatibility for incompatible versions', () => {
      const compatibility =
        fixtures.utils.validateDriverCompatibility('27.20.100.9316');

      expect(compatibility.compatible).toBe(false);
      expect(compatibility.compatibility).toBe('incompatible');
      expect(compatibility.supportedFeatures).toHaveLength(0);
      expect(compatibility.recommendedAction).toContain(
        'Update to Intel Graphics Driver',
      );
    });

    test('should handle malformed driver versions', () => {
      const invalidVersions = ['', 'unknown', 'abc.def.ghi.jkl', '31.0.101'];

      for (const version of invalidVersions) {
        const compatibility =
          fixtures.utils.validateDriverCompatibility(version);
        expect(compatibility.compatible).toBe(false);
        expect(compatibility.compatibility).toBe('incompatible');
        expect(compatibility.recommendedAction).toContain(
          'Install valid Intel Graphics Driver',
        );
      }
    });

    test('should clone fixtures correctly', () => {
      const original = fixtures.gpuDevices.arcA770();
      const cloned = fixtures.utils.cloneFixture(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original); // Different reference

      // Modify clone to ensure independence
      cloned.name = 'Modified Name';
      expect(original.name).not.toBe('Modified Name');
    });

    test('should create custom test devices', () => {
      const baseDevice = fixtures.gpuDevices.arcA770();
      const customDevice = fixtures.utils.createCustomTestDevice(baseDevice, {
        name: 'Custom Test GPU',
        memory: 8192,
        type: 'integrated',
      });

      expect(customDevice.name).toBe('Custom Test GPU');
      expect(customDevice.memory).toBe(8192);
      expect(customDevice.type).toBe('integrated');
      expect(customDevice.id).toContain('custom-');
      expect(customDevice.vendor).toBe(baseDevice.vendor); // Inherited
    });

    test('should merge GPU device arrays', () => {
      const discreteGPUs = [
        fixtures.gpuDevices.arcA770(),
        fixtures.gpuDevices.arcA750(),
      ];
      const integratedGPUs = [
        fixtures.gpuDevices.xeGraphics(),
        fixtures.gpuDevices.irisXe(),
      ];

      const merged = fixtures.utils.mergeGPUDevices(
        discreteGPUs,
        integratedGPUs,
      );

      expect(merged).toHaveLength(4);
      expect(merged).toContain(discreteGPUs[0]);
      expect(merged).toContain(integratedGPUs[0]);
    });

    test('should filter devices by vendor correctly', () => {
      const allDevices = [
        fixtures.gpuDevices.arcA770(),
        fixtures.gpuDevices.nvidiaRTX4090(),
        fixtures.gpuDevices.appleM1(),
        fixtures.gpuDevices.xeGraphics(),
      ];

      const intelDevices = fixtures.utils.filterDevicesByVendor(
        allDevices,
        'intel',
      );
      const nvidiaDevices = fixtures.utils.filterDevicesByVendor(
        allDevices,
        'nvidia',
      );
      const appleDevices = fixtures.utils.filterDevicesByVendor(
        allDevices,
        'apple',
      );

      expect(intelDevices).toHaveLength(2);
      expect(nvidiaDevices).toHaveLength(1);
      expect(appleDevices).toHaveLength(1);

      expect(intelDevices.every((gpu) => gpu.vendor === 'intel')).toBe(true);
      expect(nvidiaDevices.every((gpu) => gpu.vendor === 'nvidia')).toBe(true);
      expect(appleDevices.every((gpu) => gpu.vendor === 'apple')).toBe(true);
    });

    test('should filter OpenVINO compatible devices', () => {
      const allDevices = [
        fixtures.gpuDevices.arcA770(),
        fixtures.gpuDevices.nvidiaRTX4090(),
        fixtures.gpuDevices.appleM1(),
        fixtures.gpuDevices.uhd630(),
      ];

      const openvinoDevices =
        fixtures.utils.filterOpenVINOCompatibleDevices(allDevices);

      expect(openvinoDevices).toHaveLength(2); // Arc A770 and RTX 4090
      expect(
        openvinoDevices.every((gpu) => gpu.capabilities.openvinoCompatible),
      ).toBe(true);
    });

    test('should sort devices by priority correctly', () => {
      const devices = [
        fixtures.gpuDevices.xeGraphics(), // priority 4
        fixtures.gpuDevices.arcA770(), // priority 8
        fixtures.gpuDevices.arcA380(), // priority 5
        fixtures.gpuDevices.uhd630(), // priority 2
      ];

      const sorted = fixtures.utils.sortDevicesByPriority(devices);

      expect(sorted[0].priority).toBe(8); // Arc A770 first
      expect(sorted[1].priority).toBe(5); // Arc A380 second
      expect(sorted[2].priority).toBe(4); // Xe Graphics third
      expect(sorted[3].priority).toBe(2); // UHD 630 last
    });
  });

  describe('Error Simulation Coverage', () => {
    test('should provide comprehensive GPU detection errors', () => {
      const errors = fixtures.errorSimulations.gpuDetectionErrors;

      expect(errors.driverNotFound).toBeInstanceOf(Error);
      expect(errors.deviceUnavailable).toBeInstanceOf(Error);
      expect(errors.permissionDenied).toBeInstanceOf(Error);
      expect(errors.hardwareFailure).toBeInstanceOf(Error);

      expect(errors.driverNotFound.message).toContain('driver');
      expect(errors.permissionDenied.message).toContain('Permission denied');
    });

    test('should provide comprehensive OpenVINO errors', () => {
      const errors = fixtures.errorSimulations.openVinoErrors;

      expect(errors.notInstalled).toBeInstanceOf(Error);
      expect(errors.versionMismatch).toBeInstanceOf(Error);
      expect(errors.licenseError).toBeInstanceOf(Error);
      expect(errors.runtimeCorrupted).toBeInstanceOf(Error);

      expect(errors.notInstalled.message).toContain('not found');
      expect(errors.versionMismatch.message).toContain('incompatible');
    });

    test('should provide comprehensive performance errors', () => {
      const errors = fixtures.errorSimulations.performanceErrors;

      expect(errors.outOfMemory).toBeInstanceOf(Error);
      expect(errors.thermalThrottling).toBeInstanceOf(Error);
      expect(errors.powerLimitExceeded).toBeInstanceOf(Error);
      expect(errors.benchmarkTimeout).toBeInstanceOf(Error);

      expect(errors.outOfMemory.message).toContain('memory');
      expect(errors.thermalThrottling.message).toContain('throttling');
    });
  });
});
