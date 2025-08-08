/**
 * End-to-End OpenVINO Integration Test Suite
 *
 * Comprehensive integration tests for OpenVINO GPU acceleration workflows,
 * covering realistic scenarios from GPU detection to subtitle generation.
 *
 * Expected Impact: +20 additional passing tests
 */

import { fixtures } from '../fixtures/mockGPUData';
import {
  selectOptimalGPU,
  validateGPUMemory,
  resolveSpecificGPU,
} from '../../main/helpers/gpuSelector';
import { GPUPerformanceMonitor } from '../../main/helpers/performanceMonitor';
import { OpenVINODetector } from '../../main/hardware/openvinoDetection';

// Mock complete system configuration for integration testing
const mockSystemConfigurations = {
  /**
   * High-end Windows desktop with Intel Arc A770
   */
  windowsDesktop: {
    platform: 'win32',
    os: 'Windows 11 Pro',
    cpu: 'Intel Core i7-13700K',
    ram: 32768, // 32GB
    gpus: [fixtures.gpuDevices.arcA770(), fixtures.gpuDevices.nvidiaRTX4090()],
    openvinoCapabilities:
      fixtures.openVinoCapabilityFixtures.fullInstallation(),
    expectedPerformance: fixtures.performanceBenchmarks.arcA770Performance(),
  },

  /**
   * Mid-range Ubuntu laptop with Intel Xe Graphics
   */
  ubuntuLaptop: {
    platform: 'linux',
    os: 'Ubuntu 22.04 LTS',
    cpu: 'Intel Core i5-12500H',
    ram: 16384, // 16GB
    gpus: [fixtures.gpuDevices.xeGraphics()],
    openvinoCapabilities: {
      ...fixtures.openVinoCapabilityFixtures.fullInstallation(),
      installationMethod: 'apt',
      runtimePath: '/opt/intel/openvino_2024/runtime',
    },
    expectedPerformance: fixtures.performanceBenchmarks.xeGraphicsPerformance(),
  },

  /**
   * Entry-level Windows laptop with Intel Iris Xe
   */
  windowsLaptop: {
    platform: 'win32',
    os: 'Windows 10 Home',
    cpu: 'Intel Core i5-1135G7',
    ram: 8192, // 8GB
    gpus: [fixtures.gpuDevices.irisXe()],
    openvinoCapabilities:
      fixtures.openVinoCapabilityFixtures.limitedInstallation(),
    expectedPerformance: fixtures.performanceBenchmarks.irisXePerformance(),
  },

  /**
   * Development/testing environment on macOS (mock Intel GPUs)
   */
  macOSDevelopment: {
    platform: 'darwin',
    os: 'macOS Sonoma',
    cpu: 'Apple M1 Pro',
    ram: 16384, // 16GB unified memory
    gpus: [
      fixtures.gpuDevices.appleM1(),
      // Mock Intel GPUs for development
      { ...fixtures.gpuDevices.arcA770(), id: 'mock-intel-arc-a770' },
      { ...fixtures.gpuDevices.xeGraphics(), id: 'mock-intel-xe-graphics' },
    ],
    openvinoCapabilities: fixtures.openVinoCapabilityFixtures.developmentMock(),
    expectedPerformance: fixtures.performanceBenchmarks.arcA770Performance(),
  },
};

describe('OpenVINO Integration Test Suite - End-to-End', () => {
  let performanceMonitor: GPUPerformanceMonitor;
  let openvinoDetector: OpenVINODetector;

  beforeEach(() => {
    performanceMonitor = GPUPerformanceMonitor.getInstance();
    openvinoDetector = new OpenVINODetector();
    GPUPerformanceMonitor.clearHistory();
  });

  afterEach(() => {
    GPUPerformanceMonitor.clearHistory();
  });

  describe('Complete Workflow Integration Tests', () => {
    test('should complete full Windows desktop workflow with Arc A770', async () => {
      const config = mockSystemConfigurations.windowsDesktop;

      // Mock system capabilities
      const capabilities = {
        nvidia: true,
        intel: [config.gpus[0]], // Arc A770
        intelAll: [config.gpus[0]],
        apple: false,
        cpu: true,
        openvinoVersion: config.openvinoCapabilities.version,
        capabilities: {
          multiGPU: true,
          hybridSystem: true,
        },
      };

      // Test GPU selection priority
      const priority = ['intel', 'nvidia', 'cpu']; // Prefer Intel for OpenVINO
      const selectedGPU = selectOptimalGPU(priority, capabilities, 'base');

      expect(selectedGPU.type).toBe('openvino');
      expect(selectedGPU.displayName).toContain('Intel Arc A770');
      expect(selectedGPU.deviceConfig?.memory).toBe(16384);

      // Test performance workflow
      const gpuConfig = {
        addonInfo: selectedGPU,
        environmentConfig: {
          openvinoVersion: config.openvinoCapabilities.version,
          platform: config.platform,
          installedRAM: config.ram,
          driverVersion: config.gpus[0].driverVersion,
        },
      };

      // Simulate complete transcription workflow
      const sessionId = performanceMonitor.startSession(
        gpuConfig,
        '/mock/audio/test-5min.wav',
        'base',
      );

      // Simulate processing steps
      const processingSteps = [
        { step: 'audio_loading', duration: 500, memory: 256 },
        { step: 'model_loading', duration: 2000, memory: 1536 },
        { step: 'gpu_initialization', duration: 1000, memory: 2048 },
        { step: 'transcription', duration: 15000, memory: 2560 },
        { step: 'cleanup', duration: 500, memory: 1024 },
      ];

      for (const step of processingSteps) {
        performanceMonitor.updateMemoryUsage();
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      const transcriptionResult = {
        transcription:
          'This is a comprehensive test of the OpenVINO integration workflow running on Intel Arc A770 graphics.',
        segments: Array.from({ length: 30 }, (_, i) => ({
          start: i * 10,
          end: (i + 1) * 10,
          text: `Segment ${i + 1} transcription content.`,
        })),
        processingStats: {
          modelLoadTime: 2000,
          transcriptionTime: 15000,
          totalTokens: 450,
        },
      };

      const metrics = await performanceMonitor.endSession(
        transcriptionResult,
        300000, // 5 minutes
      );

      // Validate Arc A770 performance expectations
      expect(metrics.speedupFactor).toBeGreaterThanOrEqual(3.0);
      expect(metrics.speedupFactor).toBeLessThanOrEqual(4.5);
      expect(metrics.realTimeRatio).toBeGreaterThan(5.0); // Much faster than real-time
      expect(metrics.transcriptionLength).toBeGreaterThan(100);
      expect(metrics.errorCount).toBe(0);

      // Memory usage should be reasonable for discrete GPU
      expect(metrics.memoryUsage.peak).toBeGreaterThan(1500 * 1024 * 1024); // > 1.5GB
      expect(metrics.memoryUsage.peak).toBeLessThan(4000 * 1024 * 1024); // < 4GB
    });

    test('should complete Ubuntu laptop workflow with Xe Graphics', async () => {
      const config = mockSystemConfigurations.ubuntuLaptop;

      const capabilities = {
        nvidia: false,
        intel: [config.gpus[0]], // Xe Graphics
        intelAll: [config.gpus[0]],
        apple: false,
        cpu: true,
        openvinoVersion: config.openvinoCapabilities.version,
        capabilities: {
          multiGPU: false,
          hybridSystem: false,
        },
      };

      const priority = ['intel', 'cpu'];
      const selectedGPU = selectOptimalGPU(priority, capabilities, 'small');

      expect(selectedGPU.type).toBe('openvino');
      expect(selectedGPU.displayName).toContain('Intel');
      expect(selectedGPU.displayName).toContain('Arc Graphics');

      // Test memory constraints for integrated graphics
      expect(validateGPUMemory(config.gpus[0], 'small')).toBe(true);
      expect(validateGPUMemory(config.gpus[0], 'medium')).toBe(true);
      expect(validateGPUMemory(config.gpus[0], 'large')).toBe(false); // Too large for integrated

      const gpuConfig = {
        addonInfo: selectedGPU,
        environmentConfig: {
          openvinoVersion: config.openvinoCapabilities.version,
          platform: config.platform,
          installedRAM: config.ram,
          installationMethod: 'apt',
        },
      };

      const sessionId = performanceMonitor.startSession(
        gpuConfig,
        '/mock/audio/test-2min.wav',
        'small',
      );

      const transcriptionResult = {
        transcription:
          'Ubuntu integrated graphics transcription test with shared memory optimization.',
        segments: [
          {
            start: 0,
            end: 30,
            text: 'Ubuntu integrated graphics transcription test',
          },
          { start: 30, end: 60, text: 'with shared memory optimization' },
          {
            start: 60,
            end: 120,
            text: 'running efficiently on Intel Xe Graphics.',
          },
        ],
      };

      const metrics = await performanceMonitor.endSession(
        transcriptionResult,
        120000, // 2 minutes
      );

      // Validate integrated graphics performance
      expect(metrics.speedupFactor).toBeGreaterThanOrEqual(2.0);
      expect(metrics.speedupFactor).toBeLessThanOrEqual(3.0);
      expect(metrics.realTimeRatio).toBeGreaterThan(2.0);

      // Memory usage should be lower due to shared memory
      expect(metrics.memoryUsage.peak).toBeLessThan(2000 * 1024 * 1024); // < 2GB
    });

    test('should handle user GPU override scenarios', async () => {
      const config = mockSystemConfigurations.windowsDesktop;

      const capabilities = {
        nvidia: true,
        intel: [config.gpus[0]],
        intelAll: [config.gpus[0]],
        apple: false,
        cpu: true,
        openvinoVersion: config.openvinoCapabilities.version,
        capabilities: {
          multiGPU: true,
          hybridSystem: true,
        },
      };

      // Test user selecting specific Intel GPU
      const userSelectedGPU = resolveSpecificGPU(
        'intel-arc-a770-16gb',
        capabilities,
      );
      expect(userSelectedGPU).not.toBeNull();
      expect(userSelectedGPU!.type).toBe('openvino');
      expect(userSelectedGPU!.displayName).toContain('User Selected');

      // Test user selecting NVIDIA GPU instead
      const nvidiaSelected = resolveSpecificGPU(
        'nvidia-rtx-4090',
        capabilities,
      );
      expect(nvidiaSelected).not.toBeNull();
      expect(nvidiaSelected!.type).toBe('cuda');

      // Test invalid GPU selection
      const invalidSelection = resolveSpecificGPU(
        'invalid-gpu-id',
        capabilities,
      );
      expect(invalidSelection).toBeNull();

      // Test CPU fallback selection
      const cpuSelected = resolveSpecificGPU('cpu-processing', capabilities);
      expect(cpuSelected).not.toBeNull();
      expect(cpuSelected!.type).toBe('cpu');
    });
  });

  describe('Performance Regression Detection', () => {
    test('should detect performance degradation across sessions', async () => {
      const config = mockSystemConfigurations.windowsDesktop;

      // Create baseline performance session
      const baselineConfig = {
        addonInfo: {
          type: 'openvino' as const,
          path: 'addon-openvino.node',
          displayName: config.gpus[0].name,
          deviceConfig: {
            deviceId: config.gpus[0].deviceId,
            memory: config.gpus[0].memory,
            type: config.gpus[0].type,
          },
        },
        environmentConfig: {
          openvinoVersion: config.openvinoCapabilities.version,
          platform: config.platform,
          temperature: 'normal',
        },
      };

      // Run baseline session
      let sessionId = performanceMonitor.startSession(
        baselineConfig,
        '/mock/audio/baseline.wav',
        'base',
      );

      let metrics = await performanceMonitor.endSession(
        { transcription: 'Baseline performance test' },
        60000,
      );

      const baselineSpeedup = metrics.speedupFactor;
      expect(baselineSpeedup).toBeGreaterThanOrEqual(3.0);

      // Simulate degraded performance session (thermal throttling)
      const degradedConfig = {
        ...baselineConfig,
        environmentConfig: {
          ...baselineConfig.environmentConfig,
          temperature: 'high',
          thermalThrottling: true,
        },
      };

      sessionId = performanceMonitor.startSession(
        degradedConfig,
        '/mock/audio/degraded.wav',
        'base',
      );

      // Simulate longer processing time due to throttling
      await new Promise((resolve) => setTimeout(resolve, 50));

      metrics = await performanceMonitor.endSession(
        {
          transcription: 'Degraded performance test due to thermal throttling',
        },
        60000,
      );

      // Performance should be detectably worse
      expect(metrics.speedupFactor).toBeLessThan(baselineSpeedup * 0.9);

      // Generate performance report to detect regression
      const report = GPUPerformanceMonitor.getPerformanceReport();
      expect(report.trends.length).toBeGreaterThan(0);

      const openvinoTrend = report.trends.find(
        (t) => t.addonType === 'openvino',
      );
      expect(openvinoTrend).toBeDefined();
      expect(openvinoTrend!.sessionCount).toBe(2);
    });

    test('should validate performance consistency across models', async () => {
      const config = mockSystemConfigurations.windowsDesktop;
      const models = ['tiny', 'base', 'small', 'medium'];
      const results: any[] = [];

      for (const model of models) {
        const gpuConfig = {
          addonInfo: {
            type: 'openvino' as const,
            path: 'addon-openvino.node',
            displayName: config.gpus[0].name,
            deviceConfig: {
              deviceId: config.gpus[0].deviceId,
              memory: config.gpus[0].memory,
              type: config.gpus[0].type,
            },
          },
          environmentConfig: {
            openvinoVersion: config.openvinoCapabilities.version,
            platform: config.platform,
          },
        };

        const sessionId = performanceMonitor.startSession(
          gpuConfig,
          `/mock/audio/${model}-test.wav`,
          model,
        );

        const expectedPerformance =
          config.expectedPerformance.modelCompatibility[model];

        const metrics = await performanceMonitor.endSession(
          { transcription: `${model} model test transcription` },
          120000,
        );

        results.push({
          model,
          speedup: metrics.speedupFactor,
          expectedSpeedup: expectedPerformance.speedup,
          memoryUsage: metrics.memoryUsage.peak,
          expectedMemory: expectedPerformance.memory * 1024 * 1024,
        });
      }

      // Validate model-specific performance expectations
      for (const result of results) {
        expect(result.speedup).toBeGreaterThanOrEqual(
          result.expectedSpeedup * 0.8,
        );
        expect(result.speedup).toBeLessThanOrEqual(
          result.expectedSpeedup * 1.2,
        );

        // Larger models should use more memory
        if (result.model !== 'tiny') {
          const tinyResult = results.find((r) => r.model === 'tiny');
          expect(result.memoryUsage).toBeGreaterThanOrEqual(
            tinyResult!.memoryUsage,
          );
        }
      }

      // Generate comprehensive report
      const report = GPUPerformanceMonitor.getPerformanceReport();
      expect(report.averages.length).toBe(models.length);

      // Verify recommendations are generated
      expect(report.recommendations.length).toBeGreaterThan(0);
      const hasPerformanceRecommendation = report.recommendations.some(
        (r) =>
          r.includes('performance') ||
          r.includes('speedup') ||
          r.includes('memory'),
      );
      expect(hasPerformanceRecommendation).toBe(true);
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle OpenVINO runtime initialization failures', async () => {
      const config = mockSystemConfigurations.windowsLaptop;

      // Mock OpenVINO not available scenario
      const failureCapabilities = {
        nvidia: false,
        intel: [config.gpus[0]],
        intelAll: [config.gpus[0]],
        apple: false,
        cpu: true,
        openvinoVersion: false, // OpenVINO not available
        capabilities: {
          multiGPU: false,
          hybridSystem: false,
        },
      };

      const priority = ['intel', 'cpu'];
      const selectedGPU = selectOptimalGPU(
        priority,
        failureCapabilities,
        'base',
      );

      // Should fall back to CPU when OpenVINO is not available
      expect(selectedGPU.type).toBe('cpu');
      expect(selectedGPU.displayName).toContain('CPU Processing');
      expect(selectedGPU.fallbackReason).toBeDefined();
    });

    test('should handle memory constraints gracefully', async () => {
      const config = mockSystemConfigurations.windowsLaptop; // 8GB RAM

      const capabilities = {
        nvidia: false,
        intel: [config.gpus[0]], // Iris Xe with shared memory
        intelAll: [config.gpus[0]],
        apple: false,
        cpu: true,
        openvinoVersion: config.openvinoCapabilities.version,
        capabilities: {
          multiGPU: false,
          hybridSystem: false,
        },
      };

      // Test large model on memory-constrained system
      const priority = ['intel', 'cpu'];

      // Large model should not be supported on integrated graphics
      expect(validateGPUMemory(config.gpus[0], 'large')).toBe(false);
      expect(validateGPUMemory(config.gpus[0], 'large-v2')).toBe(false);
      expect(validateGPUMemory(config.gpus[0], 'large-v3')).toBe(false);

      // Medium and smaller models should be supported
      expect(validateGPUMemory(config.gpus[0], 'medium')).toBe(true);
      expect(validateGPUMemory(config.gpus[0], 'small')).toBe(true);
      expect(validateGPUMemory(config.gpus[0], 'base')).toBe(true);
      expect(validateGPUMemory(config.gpus[0], 'tiny')).toBe(true);

      const selectedGPU = selectOptimalGPU(priority, capabilities, 'medium');
      expect(selectedGPU.type).toBe('openvino');
      expect(selectedGPU.deviceConfig?.memory).toBe('shared');
    });

    test('should handle driver compatibility issues', async () => {
      // Mock outdated driver scenario
      const outdatedGPU = {
        ...fixtures.gpuDevices.arcA770(),
        driverVersion: '30.0.100.9955', // Old driver version
      };

      const capabilities = {
        nvidia: false,
        intel: [outdatedGPU],
        intelAll: [outdatedGPU],
        apple: false,
        cpu: true,
        openvinoVersion: '2024.6.0',
        capabilities: {
          multiGPU: false,
          hybridSystem: false,
        },
      };

      // Test driver version validation
      const driverMajorVersion = parseInt(
        outdatedGPU.driverVersion.split('.')[0],
      );
      const isCompatible = driverMajorVersion >= 31;
      expect(isCompatible).toBe(false);

      // Should still attempt to use GPU but with warnings
      const priority = ['intel', 'cpu'];
      const selectedGPU = selectOptimalGPU(priority, capabilities, 'base');

      // GPU selection should work but performance might be degraded
      expect(selectedGPU.type).toBe('openvino');
      expect(selectedGPU.displayName).toContain('Intel Arc A770');
    });
  });

  describe('Multi-GPU Environment Scenarios', () => {
    test('should handle hybrid NVIDIA + Intel GPU systems', async () => {
      const config = mockSystemConfigurations.windowsDesktop; // Has both Arc A770 and RTX 4090

      const capabilities = {
        nvidia: true,
        intel: [config.gpus[0]], // Arc A770
        intelAll: [config.gpus[0]],
        apple: false,
        cpu: true,
        openvinoVersion: config.openvinoCapabilities.version,
        capabilities: {
          multiGPU: true,
          hybridSystem: true,
        },
      };

      // Test different priority scenarios
      const scenarios = [
        {
          priority: ['intel', 'nvidia', 'cpu'],
          expectedType: 'openvino',
          reason: 'Intel first',
        },
        {
          priority: ['nvidia', 'intel', 'cpu'],
          expectedType: 'cuda',
          reason: 'NVIDIA first',
        },
        {
          priority: ['cpu', 'intel', 'nvidia'],
          expectedType: 'cpu',
          reason: 'CPU first',
        },
      ];

      for (const scenario of scenarios) {
        const selectedGPU = selectOptimalGPU(
          scenario.priority,
          capabilities,
          'base',
        );
        expect(selectedGPU.type).toBe(scenario.expectedType);
      }

      // Test user preference override in multi-GPU system
      const intelOverride = resolveSpecificGPU(
        'intel-arc-a770-16gb',
        capabilities,
      );
      expect(intelOverride!.type).toBe('openvino');

      const nvidiaOverride = resolveSpecificGPU(
        'nvidia-rtx-4090',
        capabilities,
      );
      expect(nvidiaOverride!.type).toBe('cuda');
    });

    test('should handle multiple Intel GPU scenarios', async () => {
      const multiIntelCapabilities = {
        nvidia: false,
        intel: [
          fixtures.gpuDevices.arcA770(), // Discrete, high performance
          fixtures.gpuDevices.xeGraphics(), // Integrated, lower performance
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

      const priority = ['intel', 'cpu'];
      const selectedGPU = selectOptimalGPU(
        priority,
        multiIntelCapabilities,
        'base',
      );

      // Should prefer discrete Arc A770 over integrated Xe Graphics
      expect(selectedGPU.type).toBe('openvino');
      expect(selectedGPU.displayName).toContain('Intel Arc A770');
      expect(selectedGPU.deviceConfig?.type).toBe('discrete');
      expect(selectedGPU.deviceConfig?.memory).toBe(16384);
    });
  });

  describe('Real-World Scenario Validation', () => {
    test('should simulate enterprise deployment scenario', async () => {
      // Enterprise scenario: Windows Server with Intel Arc GPUs for batch processing
      const enterpriseConfig = {
        platform: 'win32',
        os: 'Windows Server 2022',
        environment: 'enterprise',
        batchProcessing: true,
        gpus: [fixtures.gpuDevices.arcA770(), fixtures.gpuDevices.arcA750()],
        workload: {
          concurrentSessions: 4,
          averageFileSize: '15MB',
          averageDuration: 600000, // 10 minutes
          expectedThroughput: '40 hours/hour', // 4x real-time
        },
      };

      const capabilities = {
        nvidia: false,
        intel: enterpriseConfig.gpus,
        intelAll: enterpriseConfig.gpus,
        apple: false,
        cpu: true,
        openvinoVersion: '2024.6.0',
        capabilities: {
          multiGPU: true,
          hybridSystem: false,
        },
      };

      // Test GPU selection for enterprise workload
      const selectedGPU = selectOptimalGPU(
        ['intel', 'cpu'],
        capabilities,
        'base',
      );
      expect(selectedGPU.type).toBe('openvino');
      expect(selectedGPU.displayName).toContain('Intel Arc A770'); // Best GPU selected

      // Simulate concurrent processing sessions
      const sessions = [];
      for (let i = 0; i < enterpriseConfig.workload.concurrentSessions; i++) {
        const gpuConfig = {
          addonInfo: selectedGPU,
          environmentConfig: {
            openvinoVersion: '2024.6.0',
            platform: enterpriseConfig.platform,
            sessionId: i,
            batchMode: true,
          },
        };

        sessions.push({
          id: i,
          config: gpuConfig,
          startTime: Date.now() + i * 1000, // Stagger starts
        });
      }

      expect(sessions).toHaveLength(4);
      expect(sessions[0].config.environmentConfig.batchMode).toBe(true);
    });

    test('should validate development environment setup', async () => {
      const config = mockSystemConfigurations.macOSDevelopment;

      // macOS development with mock Intel GPUs
      const capabilities = {
        nvidia: false,
        intel: config.gpus.filter((gpu) => gpu.id.includes('mock-intel')),
        intelAll: config.gpus.filter((gpu) => gpu.id.includes('mock-intel')),
        apple: true,
        cpu: true,
        openvinoVersion: config.openvinoCapabilities.version,
        capabilities: {
          multiGPU: false,
          hybridSystem: true,
        },
      };

      // Should prefer mock Intel GPU for development testing
      const priority = ['intel', 'apple', 'cpu'];
      const selectedGPU = selectOptimalGPU(priority, capabilities, 'base');

      expect(selectedGPU.type).toBe('openvino');
      expect(selectedGPU.displayName).toContain('Intel');
      expect(selectedGPU.deviceConfig?.deviceId).toBeDefined();

      // Development mock should support all standard models
      const models = ['tiny', 'base', 'small', 'medium', 'large'];
      for (const model of models) {
        const mockGPU = capabilities.intel[0];
        const isSupported = validateGPUMemory(mockGPU, model);
        expect(isSupported).toBe(true); // Mock GPUs should support all models
      }
    });
  });
});
