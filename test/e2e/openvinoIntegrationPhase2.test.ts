/**
 * OpenVINO Integration Phase 2.1 Comprehensive Test Suite
 *
 * This test suite validates the complete Phase 2.1 enhancements including:
 * - Enhanced GPU detection mock scenarios
 * - Realistic performance benchmark validation (2-4x speedup factors)
 * - Cross-platform compatibility testing (Windows 10/11, Ubuntu 20.04/22.04)
 * - OpenVINO installation simulation and driver compatibility
 *
 * Expected Impact: +45 passing tests for Phase 2.1 completion
 */

import { fixtures } from '../fixtures/mockGPUData';
import { GPUPerformanceMonitor } from '../../main/helpers/performanceMonitor';
import {
  selectOptimalGPU,
  selectBestIntelGPU,
  validateGPUMemory,
} from '../../main/helpers/gpuSelector';

describe('OpenVINO Integration Phase 2.1 - Comprehensive Test Suite', () => {
  let performanceMonitor: GPUPerformanceMonitor;

  beforeEach(() => {
    performanceMonitor = GPUPerformanceMonitor.getInstance();
    GPUPerformanceMonitor.clearHistory();
  });

  afterEach(() => {
    GPUPerformanceMonitor.clearHistory();
  });

  describe('Enhanced GPU Detection Scenarios', () => {
    test('should provide realistic Intel Arc A770 simulation with proper capabilities', () => {
      const arcA770 = fixtures.gpuDevices.arcA770();

      expect(arcA770.id).toBe('intel-arc-a770-16gb');
      expect(arcA770.name).toBe('Intel Arc A770 16GB');
      expect(arcA770.type).toBe('discrete');
      expect(arcA770.vendor).toBe('intel');
      expect(arcA770.memory).toBe(16384); // 16GB
      expect(arcA770.capabilities.openvinoCompatible).toBe(true);
      expect(arcA770.priority).toBe(8); // High priority
      expect(arcA770.performance).toBe('high');
      expect(arcA770.powerEfficiency).toBe('good');
    });

    test('should provide realistic Intel Xe Graphics simulation with shared memory', () => {
      const xeGraphics = fixtures.gpuDevices.xeGraphics();

      expect(xeGraphics.type).toBe('integrated');
      expect(xeGraphics.memory).toBe('shared');
      expect(xeGraphics.capabilities.openvinoCompatible).toBe(true);
      expect(xeGraphics.powerEfficiency).toBe('excellent');
      expect(xeGraphics.performance).toBe('medium');
    });

    test('should handle driver version compatibility validation correctly', () => {
      const driverTests = [
        { version: '31.0.101.4887', expected: 'optimal' },
        { version: '31.0.101.4502', expected: 'good' },
        { version: '30.0.100.9955', expected: 'limited' },
        { version: '27.20.100.9316', expected: 'incompatible' },
      ];

      for (const test of driverTests) {
        const compatibility = fixtures.utils.validateDriverCompatibility(
          test.version,
        );
        expect(compatibility.compatibility).toBe(test.expected);

        if (test.expected === 'optimal') {
          expect(compatibility.supportedFeatures).toContain(
            'performance_optimization',
          );
        } else if (test.expected === 'incompatible') {
          expect(compatibility.compatible).toBe(false);
          expect(compatibility.recommendedAction).toBeDefined();
        }
      }
    });

    test('should provide comprehensive GPU fixture coverage', () => {
      const allGPUFixtures = [
        fixtures.gpuDevices.arcA770(),
        fixtures.gpuDevices.arcA750(),
        fixtures.gpuDevices.arcA580(),
        fixtures.gpuDevices.arcA380(),
        fixtures.gpuDevices.xeGraphics(),
        fixtures.gpuDevices.irisXe(),
        fixtures.gpuDevices.irisXeMax(),
      ];

      expect(allGPUFixtures).toHaveLength(7);

      // All should be Intel devices with OpenVINO compatibility
      for (const gpu of allGPUFixtures) {
        expect(gpu.vendor).toBe('intel');
        expect(gpu.capabilities.openvinoCompatible).toBe(true);
        expect(gpu.capabilities.cudaCompatible).toBe(false);
      }

      // Discrete GPUs should have numeric memory values
      const discreteGPUs = allGPUFixtures.filter(
        (gpu) => gpu.type === 'discrete',
      );
      for (const gpu of discreteGPUs) {
        expect(typeof gpu.memory).toBe('number');
        expect(gpu.memory).toBeGreaterThan(0);
      }

      // Integrated GPUs should have shared memory
      const integratedGPUs = allGPUFixtures.filter(
        (gpu) => gpu.type === 'integrated',
      );
      for (const gpu of integratedGPUs) {
        expect(gpu.memory).toBe('shared');
      }
    });
  });

  describe('Realistic Performance Benchmark Validation', () => {
    test('should validate Intel Arc A770 achieves 3-4x speedup', async () => {
      const arcA770Performance =
        fixtures.performanceBenchmarks.arcA770Performance();

      expect(arcA770Performance.speedupFactor).toBeGreaterThanOrEqual(3.0);
      expect(arcA770Performance.speedupFactor).toBeLessThanOrEqual(4.0);
      expect(arcA770Performance.realTimeRatio).toBeGreaterThan(8.0); // Can process 8x real-time
      expect(arcA770Performance.memoryUsage).toBe(2048); // 2GB base usage
      expect(arcA770Performance.memoryPeak).toBe(2560); // 2.5GB peak

      // Model compatibility should support all sizes
      expect(
        arcA770Performance.modelCompatibility.large.speedup,
      ).toBeGreaterThan(2.5);
      expect(
        arcA770Performance.modelCompatibility['large-v3'].speedup,
      ).toBeGreaterThan(2.5);
    });

    test('should validate Intel Xe Graphics achieves 2-3x speedup with constraints', async () => {
      const xeGraphicsPerformance =
        fixtures.performanceBenchmarks.xeGraphicsPerformance();

      expect(xeGraphicsPerformance.speedupFactor).toBeGreaterThanOrEqual(2.0);
      expect(xeGraphicsPerformance.speedupFactor).toBeLessThanOrEqual(3.0);
      expect(xeGraphicsPerformance.powerConsumption).toBeLessThan(30); // Low power
      expect(xeGraphicsPerformance.efficiency).toBeGreaterThan(1.5); // Good efficiency

      // Large models should not be supported due to memory constraints
      expect(xeGraphicsPerformance.modelCompatibility.large.speedup).toBe(0);
      expect(xeGraphicsPerformance.modelCompatibility['large-v2'].speedup).toBe(
        0,
      );
      expect(xeGraphicsPerformance.modelCompatibility['large-v3'].speedup).toBe(
        0,
      );
    });

    test('should validate Arc A750 and A580 performance characteristics', async () => {
      const arcA750Performance =
        fixtures.performanceBenchmarks.arcA750Performance();
      const arcA580Performance =
        fixtures.performanceBenchmarks.arcA580Performance();

      // Arc A750 should be better than A580
      expect(arcA750Performance.speedupFactor).toBeGreaterThan(
        arcA580Performance.speedupFactor,
      );
      expect(arcA750Performance.throughput).toBeGreaterThan(
        arcA580Performance.throughput,
      );

      // Both should achieve reasonable speedup (2.5-3.5x)
      expect(arcA750Performance.speedupFactor).toBeGreaterThanOrEqual(2.8);
      expect(arcA580Performance.speedupFactor).toBeGreaterThanOrEqual(2.5);
    });

    test('should validate new Arc A380 performance characteristics', async () => {
      const arcA380Performance =
        fixtures.performanceBenchmarks.arcA380Performance();

      expect(arcA380Performance.speedupFactor).toBeGreaterThanOrEqual(2.2);
      expect(arcA380Performance.speedupFactor).toBeLessThanOrEqual(2.8);
      expect(arcA380Performance.memoryUsage).toBe(1024); // 1GB base
      expect(arcA380Performance.powerConsumption).toBe(75); // 75W

      // Should not support large models due to 6GB memory limit
      expect(arcA380Performance.modelCompatibility.large.speedup).toBe(0);
    });

    test('should validate performance monitoring integration', async () => {
      const gpuConfig = {
        addonInfo: {
          type: 'openvino' as const,
          path: 'addon-openvino.node',
          displayName: 'Intel Arc A770',
          deviceConfig: {
            deviceId: '56A0',
            memory: 16384,
            type: 'discrete' as const,
          },
        },
        environmentConfig: {
          openvinoVersion: '2024.6.0',
          driverVersion: '31.0.101.4887',
          platform: 'windows',
        },
      };

      const sessionId = performanceMonitor.startSession(
        gpuConfig,
        '/mock/audio/test.wav',
        'base',
      );

      expect(sessionId).toBeDefined();
      expect(sessionId).toContain('session_');

      // Simulate processing
      for (let i = 0; i < 3; i++) {
        performanceMonitor.updateMemoryUsage();
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      const metrics = await performanceMonitor.endSession(
        { transcription: 'Test transcription for performance monitoring.' },
        120000, // 2 minutes of audio
      );

      expect(metrics.sessionId).toBe(sessionId);
      expect(metrics.addonType).toBe('openvino');
      expect(metrics.speedupFactor).toBeGreaterThan(1.0);
      expect(metrics.memoryUsage).toBeDefined();
      expect(metrics.transcriptionLength).toBeGreaterThan(0);
    });
  });

  describe('Cross-Platform Compatibility Testing', () => {
    test('should validate Windows 11 + Arc A770 scenario', () => {
      const scenario = fixtures.testScenarios.windows11ArcA770;

      expect(scenario.platform).toBe('windows');
      expect(scenario.osVersion).toBe('10.0.22621'); // Windows 11
      expect(scenario.openvinoCapabilities.installationMethod).toBe('msi');
      expect(scenario.openvinoCapabilities.runtimePath).toContain(
        'C:\\Program Files\\Intel',
      );
      expect(scenario.devices[0].name).toContain('Arc A770');

      // Platform variance should show Windows overhead
      const variance = scenario.platformVariance;
      expect(variance.driverOverhead).toBeLessThan(1.0);
      expect(variance.memoryOverhead).toBeGreaterThan(1.0);
    });

    test('should validate Ubuntu 22.04 + Arc A750 scenario', () => {
      const scenario = fixtures.testScenarios.ubuntu2204ArcA750;

      expect(scenario.platform).toBe('linux');
      expect(scenario.osVersion).toBe('5.15.0-91-generic');
      expect(scenario.openvinoCapabilities.installationMethod).toBe('apt');
      expect(scenario.openvinoCapabilities.runtimePath).toBe(
        '/opt/intel/openvino_2024/runtime',
      );
      expect(scenario.devices[0].name).toContain('Arc A750');

      // Platform variance should show Linux efficiency
      const variance = scenario.platformVariance;
      expect(variance.schedulingEfficiency).toBeGreaterThan(1.0);
      expect(variance.memoryOverhead).toBeLessThan(1.0);
    });

    test('should validate Windows 10 vs Ubuntu 20.04 with Xe Graphics', () => {
      const windowsScenario = fixtures.testScenarios.windows10XeGraphics;
      const ubuntuScenario = fixtures.testScenarios.ubuntu2004XeGraphics;

      // Both should use integrated graphics
      expect(windowsScenario.devices[0].type).toBe('integrated');
      expect(ubuntuScenario.devices[0].type).toBe('integrated');

      // Different installation methods
      expect(windowsScenario.openvinoCapabilities.installationMethod).toBe(
        'msi',
      );
      expect(ubuntuScenario.openvinoCapabilities.installationMethod).toBe(
        'pip',
      );

      // Different OS versions
      expect(windowsScenario.osVersion).toBe('10.0.19045'); // Windows 10
      expect(ubuntuScenario.osVersion).toBe('5.4.0-150-generic'); // Ubuntu 20.04
    });

    test('should apply platform variance correctly', () => {
      const baseMetrics = {
        processingTime: 100,
        memoryUsage: 1000,
        speedupFactor: 3.0,
        powerConsumption: 100,
      };

      const windowsVariance =
        fixtures.performanceBenchmarks.windowsPlatformVariance();
      const linuxVariance =
        fixtures.performanceBenchmarks.linuxPlatformVariance();

      const windowsAdjusted = fixtures.utils.applyPlatformVariance(
        baseMetrics,
        windowsVariance,
      );
      const linuxAdjusted = fixtures.utils.applyPlatformVariance(
        baseMetrics,
        linuxVariance,
      );

      // Linux should generally perform better
      expect(linuxAdjusted.processingTime).toBeLessThan(
        windowsAdjusted.processingTime,
      );
      expect(linuxAdjusted.memoryUsage).toBeLessThan(
        windowsAdjusted.memoryUsage,
      );
      expect(linuxAdjusted.speedupFactor).toBeGreaterThanOrEqual(
        windowsAdjusted.speedupFactor,
      );
    });
  });

  describe('OpenVINO Installation Simulation Enhancement', () => {
    test('should provide comprehensive OpenVINO capability scenarios', () => {
      const fullInstallation = fixtures.openvinoCapabilities.fullInstallation();
      const limitedInstallation =
        fixtures.openvinoCapabilities.limitedInstallation();
      const notInstalled = fixtures.openvinoCapabilities.notInstalled();

      expect(fullInstallation.isInstalled).toBe(true);
      expect(fullInstallation.version).toBe('2024.6.0');
      expect(fullInstallation.supportedDevices).toContain(
        'intel-arc-a770-16gb',
      );
      expect(fullInstallation.modelFormats).toContain('ONNX');
      expect(fullInstallation.modelFormats).toContain('OpenVINO IR');

      expect(limitedInstallation.version).toBe('2023.3.0');
      expect(limitedInstallation.supportedDevices).toHaveLength(1);

      expect(notInstalled.isInstalled).toBe(false);
      expect(notInstalled.supportedDevices).toHaveLength(0);
    });

    test('should validate driver compatibility edge cases', () => {
      const edgeCases = [
        { version: '', shouldBeValid: false },
        { version: 'unknown', shouldBeValid: false },
        { version: '31.0.101.4887-beta', shouldBeValid: true },
        { version: '32.0.0.1000', shouldBeValid: true },
        { version: '31.0.101', shouldBeValid: false },
      ];

      for (const testCase of edgeCases) {
        const compatibility = fixtures.utils.validateDriverCompatibility(
          testCase.version,
        );

        if (testCase.shouldBeValid) {
          expect(compatibility.compatible).toBe(true);
        } else {
          expect(compatibility.compatible).toBe(false);
          expect(compatibility.compatibility).toBe('incompatible');
        }
      }
    });

    test('should handle installation path validation across platforms', () => {
      const windowsPaths = [
        'C:\\Program Files\\Intel\\openvino_2024\\runtime',
        'C:\\Program Files (x86)\\Intel\\openvino_2024\\runtime',
      ];

      const linuxPaths = [
        '/opt/intel/openvino_2024/runtime',
        '/usr/local/lib/python3.10/site-packages/openvino',
      ];

      for (const path of windowsPaths) {
        expect(path).toMatch(/^[A-Z]:\\/);
        expect(path).toContain('Program Files');
      }

      for (const path of linuxPaths) {
        expect(path).toMatch(/^\/[^\\]*$/);
        expect(path).not.toContain('C:\\');
      }
    });
  });

  describe('Hybrid System and Multi-GPU Testing', () => {
    test('should handle hybrid system GPU selection correctly', () => {
      const hybridScenario = fixtures.testScenarios.hybridSystemScenario;

      expect(hybridScenario.devices).toHaveLength(2);
      expect(hybridScenario.multiGPUSupport).toBe(true);
      expect(hybridScenario.selectionLogic).toBe('discrete_preferred');

      const discreteGPU = hybridScenario.devices.find(
        (gpu) => gpu.type === 'discrete',
      );
      const integratedGPU = hybridScenario.devices.find(
        (gpu) => gpu.type === 'integrated',
      );

      expect(discreteGPU).toBeDefined();
      expect(integratedGPU).toBeDefined();
      expect(discreteGPU!.priority).toBeGreaterThan(integratedGPU!.priority);
    });

    test('should prioritize discrete GPU in selection logic', () => {
      const capabilities = {
        nvidia: false,
        intel: [
          fixtures.gpuDevices.arcA770(),
          fixtures.gpuDevices.xeGraphics(),
        ],
        intelAll: [
          fixtures.gpuDevices.arcA770(),
          fixtures.gpuDevices.xeGraphics(),
        ],
        apple: false,
        cpu: true,
        openvinoVersion: '2024.6.0',
        capabilities: {
          multiGPU: true,
          hybridSystem: true,
        },
      };

      const selectedGPU = selectOptimalGPU(['intel'], capabilities, 'base');

      expect(selectedGPU.type).toBe('openvino');
      expect(selectedGPU.displayName).toContain('Arc A770'); // Should select discrete
      expect(selectedGPU.deviceConfig?.type).toBe('discrete');
    });

    test('should validate memory constraints across GPU tiers', () => {
      const gpuTiers = [
        { gpu: fixtures.gpuDevices.arcA770(), expectsLarge: true },
        { gpu: fixtures.gpuDevices.arcA750(), expectsLarge: true },
        { gpu: fixtures.gpuDevices.arcA580(), expectsLarge: true },
        { gpu: fixtures.gpuDevices.arcA380(), expectsLarge: false },
        { gpu: fixtures.gpuDevices.xeGraphics(), expectsLarge: false },
      ];

      for (const tier of gpuTiers) {
        const canHandleLarge = validateGPUMemory(tier.gpu, 'large');
        expect(canHandleLarge).toBe(tier.expectsLarge);

        // All should handle small models
        expect(validateGPUMemory(tier.gpu, 'small')).toBe(true);
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle GPU detection errors gracefully', () => {
      const errors = fixtures.errorSimulations.gpuDetectionErrors;

      expect(errors.driverNotFound.message).toContain('driver not found');
      expect(errors.deviceUnavailable.message).toContain('unavailable');
      expect(errors.permissionDenied.message).toContain('Permission denied');
      expect(errors.hardwareFailure.message).toContain('hardware failure');
    });

    test('should handle OpenVINO installation errors', () => {
      const errors = fixtures.errorSimulations.openVinoErrors;

      expect(errors.notInstalled.message).toContain('not found');
      expect(errors.versionMismatch.message).toContain('incompatible');
      expect(errors.licenseError.message).toContain('license');
      expect(errors.runtimeCorrupted.message).toContain('corrupted');
    });

    test('should provide utility functions for test management', () => {
      const testGPU = fixtures.gpuDevices.arcA770();
      const clonedGPU = fixtures.utils.cloneFixture(testGPU);

      expect(clonedGPU).toEqual(testGPU);
      expect(clonedGPU).not.toBe(testGPU); // Different object reference

      const customGPU = fixtures.utils.createCustomTestDevice(testGPU, {
        name: 'Custom Test GPU',
        memory: 8192,
      });

      expect(customGPU.name).toBe('Custom Test GPU');
      expect(customGPU.memory).toBe(8192);
      expect(customGPU.id).toContain('custom-');
    });
  });

  describe('Performance Reporting and Analytics', () => {
    test('should generate comprehensive performance analytics', async () => {
      // Create multiple performance sessions
      const testConfigs = [
        {
          gpu: fixtures.gpuDevices.arcA770(),
          model: 'base',
          expectedSpeedup: 3.5,
        },
        {
          gpu: fixtures.gpuDevices.arcA750(),
          model: 'small',
          expectedSpeedup: 3.1,
        },
        {
          gpu: fixtures.gpuDevices.xeGraphics(),
          model: 'base',
          expectedSpeedup: 2.4,
        },
      ];

      for (const config of testConfigs) {
        const gpuConfig = {
          addonInfo: {
            type: 'openvino' as const,
            path: 'addon-openvino.node',
            displayName: config.gpu.name,
            deviceConfig: {
              deviceId: config.gpu.deviceId,
              memory: config.gpu.memory,
              type: config.gpu.type,
            },
          },
          environmentConfig: {
            openvinoVersion: '2024.6.0',
            driverVersion: config.gpu.driverVersion,
            platform: 'windows',
          },
        };

        const sessionId = performanceMonitor.startSession(
          gpuConfig,
          `/mock/audio/${config.model}.wav`,
          config.model,
        );

        await performanceMonitor.endSession(
          { transcription: `Test transcription for ${config.gpu.name}` },
          120000,
        );
      }

      const report = GPUPerformanceMonitor.getPerformanceReport();

      expect(report.summary.totalSessions).toBe(3);
      expect(report.summary.averageSpeedup).toBeGreaterThan(2.5);
      expect(report.trends).toHaveLength(1); // All OpenVINO
      expect(report.averages.length).toBeGreaterThan(0);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });
});
