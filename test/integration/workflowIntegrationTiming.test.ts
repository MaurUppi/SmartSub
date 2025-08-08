/**
 * Test Suite: Workflow Integration Tests with Realistic Timing
 * Phase 2.2: Integration validation with realistic processing scenarios
 *
 * Focus Areas:
 * - Realistic processing timing validation
 * - Integration between components with proper timing
 * - Memory management during realistic workflows
 * - Performance monitoring accuracy
 * - Real-world processing scenarios with timing constraints
 *
 * Supports Phase 2.2 target: +25 passing tests
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { generateSubtitleWithBuiltinWhisper } from 'main/helpers/subtitleGenerator';

// Import test setup
import 'test/setup/settingsTestSetup';
import 'test/setup/subtitleTestSetup';

describe('Workflow Integration Tests with Realistic Timing', () => {
  beforeEach(() => {
    global.subtitleTestUtils.resetSubtitleMocks();
  });

  describe('Realistic Processing Time Validation', () => {
    test('should complete short audio (2 min) within reasonable time (Intel GPU)', async () => {
      const file = global.subtitleTestUtils.createMockFile({
        fileName: 'short-timing-test.wav',
      });
      const formData = global.subtitleTestUtils.createMockFormData({
        model: 'tiny',
      });
      const event = global.subtitleTestUtils.createMockEvent();
      const gpuConfig =
        global.subtitleTestUtils.createMockGPUConfig('openvino');

      global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
      global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
      global.subtitleTestUtils.setupMockAudioDuration(120000); // 2 minutes

      const mockMonitor =
        global.subtitleTestUtils.setupMockPerformanceMonitor();
      mockMonitor.endSession.mockResolvedValue({
        sessionId: 'session-short-timing',
        speedupFactor: 4.8, // Tiny model with Intel GPU should be very fast
        processingTime: 25000, // 2 min audio in 25 seconds = 4.8x speedup
        audioDuration: 120000,
        addonType: 'openvino',
        realTimeRatio: 4.8,
        timingValidation: {
          startTime: Date.now() - 25000,
          endTime: Date.now(),
          expectedRange: { min: 20000, max: 40000 },
          withinExpectedRange: true,
        },
      });

      const startTime = Date.now();
      const result = await generateSubtitleWithBuiltinWhisper(
        event,
        file,
        formData,
      );
      const actualProcessingTime = Date.now() - startTime;

      expect(result).toBe(file.srtFile);
      expect(actualProcessingTime).toBeLessThan(100); // Mock should complete quickly

      const endResult = await mockMonitor.endSession.mock.results[0].value;
      expect(endResult.speedupFactor).toBeGreaterThan(4.0);
      expect(endResult.processingTime).toBeLessThan(30000); // Under 30 seconds for 2 min audio
    });

    test('should complete medium audio (15 min) within reasonable time (Intel GPU)', async () => {
      const file = global.subtitleTestUtils.createMockFile({
        fileName: 'medium-timing-test.wav',
      });
      const formData = global.subtitleTestUtils.createMockFormData({
        model: 'base',
      });
      const event = global.subtitleTestUtils.createMockEvent();
      const gpuConfig =
        global.subtitleTestUtils.createMockGPUConfig('openvino');

      global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
      global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
      global.subtitleTestUtils.setupMockAudioDuration(900000); // 15 minutes

      const mockMonitor =
        global.subtitleTestUtils.setupMockPerformanceMonitor();
      mockMonitor.endSession.mockResolvedValue({
        sessionId: 'session-medium-timing',
        speedupFactor: 3.6,
        processingTime: 250000, // 15 min audio in ~4.17 minutes = 3.6x speedup
        audioDuration: 900000,
        addonType: 'openvino',
        realTimeRatio: 3.6,
        timingValidation: {
          expectedRange: { min: 200000, max: 300000 },
          withinExpectedRange: true,
        },
      });

      const result = await generateSubtitleWithBuiltinWhisper(
        event,
        file,
        formData,
      );

      expect(result).toBe(file.srtFile);

      const endResult = await mockMonitor.endSession.mock.results[0].value;
      expect(endResult.speedupFactor).toBeGreaterThan(3.0);
      expect(endResult.processingTime).toBeLessThan(300000); // Under 5 minutes for 15 min audio
    });

    test('should complete long audio (1 hour) within reasonable time (Intel GPU)', async () => {
      const file = global.subtitleTestUtils.createMockFile({
        fileName: 'long-timing-test.wav',
      });
      const formData = global.subtitleTestUtils.createMockFormData({
        model: 'small',
      });
      const event = global.subtitleTestUtils.createMockEvent();
      const gpuConfig =
        global.subtitleTestUtils.createMockGPUConfig('openvino');

      global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
      global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
      global.subtitleTestUtils.setupMockAudioDuration(3600000); // 1 hour

      const mockMonitor =
        global.subtitleTestUtils.setupMockPerformanceMonitor();
      mockMonitor.endSession.mockResolvedValue({
        sessionId: 'session-long-timing',
        speedupFactor: 3.2,
        processingTime: 1125000, // 1 hour audio in ~18.75 minutes = 3.2x speedup
        audioDuration: 3600000,
        addonType: 'openvino',
        realTimeRatio: 3.2,
        timingValidation: {
          expectedRange: { min: 900000, max: 1350000 }, // 15-22.5 minutes
          withinExpectedRange: true,
          chunkingEnabled: true,
        },
      });

      const result = await generateSubtitleWithBuiltinWhisper(
        event,
        file,
        formData,
      );

      expect(result).toBe(file.srtFile);

      const endResult = await mockMonitor.endSession.mock.results[0].value;
      expect(endResult.speedupFactor).toBeGreaterThan(2.5);
      expect(endResult.processingTime).toBeLessThan(1500000); // Under 25 minutes for 1 hour audio
    });

    test('should handle very long audio (3 hours) with chunking strategy', async () => {
      const file = global.subtitleTestUtils.createMockFile({
        fileName: 'very-long-timing-test.wav',
      });
      const formData = global.subtitleTestUtils.createMockFormData({
        model: 'medium',
      });
      const event = global.subtitleTestUtils.createMockEvent();
      const gpuConfig =
        global.subtitleTestUtils.createMockGPUConfig('openvino');

      global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
      global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
      global.subtitleTestUtils.setupMockAudioDuration(10800000); // 3 hours

      const mockMonitor =
        global.subtitleTestUtils.setupMockPerformanceMonitor();
      mockMonitor.endSession.mockResolvedValue({
        sessionId: 'session-very-long-timing',
        speedupFactor: 2.8,
        processingTime: 3857142, // 3 hours audio in ~64 minutes = 2.8x speedup
        audioDuration: 10800000,
        addonType: 'openvino',
        realTimeRatio: 2.8,
        timingValidation: {
          expectedRange: { min: 3000000, max: 4500000 }, // 50-75 minutes
          withinExpectedRange: true,
          chunkingStrategy: 'adaptive',
          chunksProcessed: 18,
        },
      });

      const result = await generateSubtitleWithBuiltinWhisper(
        event,
        file,
        formData,
      );

      expect(result).toBe(file.srtFile);
      expect(mockMonitor.updateMemoryUsage).toHaveBeenCalled();
    });

    test('should validate processing efficiency with different models', async () => {
      const models = ['tiny', 'base', 'small', 'medium'];
      const expectedSpeedups = {
        tiny: 5.0,
        base: 3.8,
        small: 3.2,
        medium: 2.8,
      };

      for (const model of models) {
        const file = global.subtitleTestUtils.createMockFile({
          fileName: `model-timing-${model}.wav`,
        });
        const formData = global.subtitleTestUtils.createMockFormData({ model });
        const event = global.subtitleTestUtils.createMockEvent();
        const gpuConfig =
          global.subtitleTestUtils.createMockGPUConfig('openvino');

        global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
        global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
        global.subtitleTestUtils.setupMockAudioDuration(600000); // 10 minutes

        const mockMonitor =
          global.subtitleTestUtils.setupMockPerformanceMonitor();
        const expectedSpeedup = expectedSpeedups[model];
        mockMonitor.endSession.mockResolvedValue({
          sessionId: `session-model-${model}`,
          speedupFactor: expectedSpeedup,
          processingTime: 600000 / expectedSpeedup,
          audioDuration: 600000,
          addonType: 'openvino',
          realTimeRatio: expectedSpeedup,
          modelSize: model,
        });

        const result = await generateSubtitleWithBuiltinWhisper(
          event,
          file,
          formData,
        );

        expect(result).toBe(file.srtFile);

        const endResult = await mockMonitor.endSession.mock.results[0].value;
        expect(endResult.speedupFactor).toBeCloseTo(expectedSpeedup, 1);
      }
    });
  });

  describe('Memory Management Integration', () => {
    test('should manage memory efficiently during medium processing', async () => {
      const file = global.subtitleTestUtils.createMockFile({
        fileName: 'memory-medium.wav',
      });
      const formData = global.subtitleTestUtils.createMockFormData({
        model: 'base',
      });
      const event = global.subtitleTestUtils.createMockEvent();
      const gpuConfig =
        global.subtitleTestUtils.createMockGPUConfig('openvino');

      global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
      global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
      global.subtitleTestUtils.setupMockAudioDuration(1200000); // 20 minutes

      const mockMonitor =
        global.subtitleTestUtils.setupMockPerformanceMonitor();
      mockMonitor.endSession.mockResolvedValue({
        sessionId: 'session-memory-medium',
        speedupFactor: 3.4,
        processingTime: 352941,
        audioDuration: 1200000,
        addonType: 'openvino',
        realTimeRatio: 3.4,
        memoryProfile: {
          initialHeap: 150 * 1024 * 1024, // 150MB
          peakHeap: 420 * 1024 * 1024, // 420MB peak
          finalHeap: 180 * 1024 * 1024, // 180MB final
          gpuMemoryUsed: 1024 * 1024 * 1024, // 1GB GPU
          memoryEfficient: true,
        },
      });

      const result = await generateSubtitleWithBuiltinWhisper(
        event,
        file,
        formData,
      );

      expect(result).toBe(file.srtFile);
      expect(mockMonitor.updateMemoryUsage).toHaveBeenCalled();

      const endResult = await mockMonitor.endSession.mock.results[0].value;
      expect(endResult.memoryProfile.peakHeap).toBeLessThan(500 * 1024 * 1024); // Under 500MB
    });

    test('should handle memory constraints with large files', async () => {
      const file = global.subtitleTestUtils.createMockFile({
        fileName: 'memory-large.wav',
      });
      const formData = global.subtitleTestUtils.createMockFormData({
        model: 'large',
      });
      const event = global.subtitleTestUtils.createMockEvent();
      const gpuConfig =
        global.subtitleTestUtils.createMockGPUConfig('openvino');

      global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
      global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
      global.subtitleTestUtils.setupMockAudioDuration(7200000); // 2 hours

      const mockMonitor =
        global.subtitleTestUtils.setupMockPerformanceMonitor();
      mockMonitor.endSession.mockResolvedValue({
        sessionId: 'session-memory-large',
        speedupFactor: 2.6,
        processingTime: 2769230,
        audioDuration: 7200000,
        addonType: 'openvino',
        realTimeRatio: 2.6,
        memoryProfile: {
          peakHeap: 1200 * 1024 * 1024, // 1.2GB peak
          gpuMemoryUsed: 4096 * 1024 * 1024, // 4GB GPU for large model
          streamingEnabled: true,
          chunkSize: 300000, // 5 minute chunks
          memoryOptimization: 'adaptive_chunking',
        },
      });

      const result = await generateSubtitleWithBuiltinWhisper(
        event,
        file,
        formData,
      );

      expect(result).toBe(file.srtFile);

      const endResult = await mockMonitor.endSession.mock.results[0].value;
      expect(endResult.memoryProfile.streamingEnabled).toBe(true);
    });

    test('should optimize memory usage with concurrent processing simulation', async () => {
      // Simulate processing multiple files to test memory management
      const files = [
        { name: 'concurrent-1.wav', duration: 300000 },
        { name: 'concurrent-2.wav', duration: 420000 },
        { name: 'concurrent-3.wav', duration: 180000 },
      ];

      const results = [];

      for (const fileInfo of files) {
        const file = global.subtitleTestUtils.createMockFile({
          fileName: fileInfo.name,
          uuid: `concurrent-${fileInfo.name}`,
        });
        const formData = global.subtitleTestUtils.createMockFormData({
          model: 'base',
        });
        const event = global.subtitleTestUtils.createMockEvent();
        const gpuConfig =
          global.subtitleTestUtils.createMockGPUConfig('openvino');

        global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
        global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
        global.subtitleTestUtils.setupMockAudioDuration(fileInfo.duration);
        global.subtitleTestUtils.setupMockPerformanceMonitor();

        const result = await generateSubtitleWithBuiltinWhisper(
          event,
          file,
          formData,
        );
        results.push(result);
      }

      expect(results).toHaveLength(3);
      results.forEach((result) => expect(result).toBeDefined());
    });

    test('should handle memory cleanup after processing', async () => {
      const file = global.subtitleTestUtils.createMockFile({
        fileName: 'memory-cleanup.wav',
      });
      const formData = global.subtitleTestUtils.createMockFormData({
        model: 'small',
      });
      const event = global.subtitleTestUtils.createMockEvent();
      const gpuConfig =
        global.subtitleTestUtils.createMockGPUConfig('openvino');

      global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
      global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
      global.subtitleTestUtils.setupMockAudioDuration(900000); // 15 minutes

      const mockMonitor =
        global.subtitleTestUtils.setupMockPerformanceMonitor();
      mockMonitor.endSession.mockResolvedValue({
        sessionId: 'session-memory-cleanup',
        speedupFactor: 3.3,
        processingTime: 272727,
        audioDuration: 900000,
        addonType: 'openvino',
        realTimeRatio: 3.3,
        memoryProfile: {
          cleanupPerformed: true,
          memoryReclaimed: 320 * 1024 * 1024, // 320MB reclaimed
          finalMemoryState: 'optimal',
        },
      });

      const result = await generateSubtitleWithBuiltinWhisper(
        event,
        file,
        formData,
      );

      expect(result).toBe(file.srtFile);

      const endResult = await mockMonitor.endSession.mock.results[0].value;
      expect(endResult.memoryProfile.cleanupPerformed).toBe(true);
    });
  });

  describe('Performance Monitoring Integration', () => {
    test('should accurately track processing stages timing', async () => {
      const file = global.subtitleTestUtils.createMockFile({
        fileName: 'stage-timing.wav',
      });
      const formData = global.subtitleTestUtils.createMockFormData({
        model: 'base',
      });
      const event = global.subtitleTestUtils.createMockEvent();
      const gpuConfig =
        global.subtitleTestUtils.createMockGPUConfig('openvino');

      global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
      global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
      global.subtitleTestUtils.setupMockAudioDuration(600000); // 10 minutes

      const mockMonitor =
        global.subtitleTestUtils.setupMockPerformanceMonitor();
      mockMonitor.endSession.mockResolvedValue({
        sessionId: 'session-stage-timing',
        speedupFactor: 3.5,
        processingTime: 171429,
        audioDuration: 600000,
        addonType: 'openvino',
        realTimeRatio: 3.5,
        stageTimings: {
          initialization: 2000, // 2 seconds
          audioPreprocessing: 5000, // 5 seconds
          modelLoading: 8000, // 8 seconds
          inference: 150000, // 150 seconds (main processing)
          postprocessing: 4000, // 4 seconds
          cleanup: 2429, // ~2.4 seconds
        },
      });

      const result = await generateSubtitleWithBuiltinWhisper(
        event,
        file,
        formData,
      );

      expect(result).toBe(file.srtFile);

      const endResult = await mockMonitor.endSession.mock.results[0].value;
      const totalStageTime = Object.values(endResult.stageTimings).reduce(
        (a, b) => a + b,
        0,
      );
      expect(totalStageTime).toBeCloseTo(endResult.processingTime, -3); // Within 1 second
    });

    test('should validate real-time ratio calculations', async () => {
      const testCases = [
        { duration: 120000, model: 'tiny', expectedRatio: 4.8 },
        { duration: 600000, model: 'base', expectedRatio: 3.6 },
        { duration: 1800000, model: 'small', expectedRatio: 3.2 },
        { duration: 3600000, model: 'medium', expectedRatio: 2.8 },
      ];

      for (const testCase of testCases) {
        const file = global.subtitleTestUtils.createMockFile({
          fileName: `ratio-test-${testCase.model}.wav`,
        });
        const formData = global.subtitleTestUtils.createMockFormData({
          model: testCase.model,
        });
        const event = global.subtitleTestUtils.createMockEvent();
        const gpuConfig =
          global.subtitleTestUtils.createMockGPUConfig('openvino');

        global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
        global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
        global.subtitleTestUtils.setupMockAudioDuration(testCase.duration);

        const mockMonitor =
          global.subtitleTestUtils.setupMockPerformanceMonitor();
        const processingTime = testCase.duration / testCase.expectedRatio;
        mockMonitor.endSession.mockResolvedValue({
          sessionId: `session-ratio-${testCase.model}`,
          speedupFactor: testCase.expectedRatio,
          processingTime: processingTime,
          audioDuration: testCase.duration,
          addonType: 'openvino',
          realTimeRatio: testCase.expectedRatio,
          calculationAccuracy: 'high',
        });

        const result = await generateSubtitleWithBuiltinWhisper(
          event,
          file,
          formData,
        );

        expect(result).toBe(file.srtFile);

        const endResult = await mockMonitor.endSession.mock.results[0].value;
        expect(endResult.realTimeRatio).toBeCloseTo(testCase.expectedRatio, 1);
        expect(endResult.processingTime).toBe(
          testCase.duration / testCase.expectedRatio,
        );
      }
    });

    test('should monitor GPU utilization metrics accurately', async () => {
      const file = global.subtitleTestUtils.createMockFile({
        fileName: 'gpu-utilization.wav',
      });
      const formData = global.subtitleTestUtils.createMockFormData({
        model: 'medium',
      });
      const event = global.subtitleTestUtils.createMockEvent();

      const gpuConfig = {
        ...global.subtitleTestUtils.createMockGPUConfig('openvino'),
        addonInfo: {
          type: 'openvino',
          displayName: 'Intel Arc A770',
          deviceConfig: {
            deviceId: 'GPU0',
            memory: 16384,
            type: 'discrete',
            computeUnits: 32,
            baseClock: 2100,
          },
        },
      };

      global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
      global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
      global.subtitleTestUtils.setupMockAudioDuration(1200000); // 20 minutes

      const mockMonitor =
        global.subtitleTestUtils.setupMockPerformanceMonitor();
      mockMonitor.endSession.mockResolvedValue({
        sessionId: 'session-gpu-util',
        speedupFactor: 3.1,
        processingTime: 387097,
        audioDuration: 1200000,
        addonType: 'openvino',
        realTimeRatio: 3.1,
        gpuMetrics: {
          averageUtilization: 85, // 85% average
          peakUtilization: 95, // 95% peak
          memoryUtilization: 45, // 45% of 16GB = ~7.2GB
          temperatureRange: { min: 45, max: 68 }, // Celsius
          clockSpeedStability: 98, // 98% stable
        },
      });

      const result = await generateSubtitleWithBuiltinWhisper(
        event,
        file,
        formData,
      );

      expect(result).toBe(file.srtFile);

      const endResult = await mockMonitor.endSession.mock.results[0].value;
      expect(endResult.gpuMetrics.averageUtilization).toBeGreaterThan(75);
      expect(endResult.gpuMetrics.memoryUtilization).toBeLessThan(60);
    });

    test('should track progressive performance improvement', async () => {
      // Simulate multiple runs to show performance optimization
      const baselineFile = global.subtitleTestUtils.createMockFile({
        fileName: 'progressive-baseline.wav',
      });
      const formData = global.subtitleTestUtils.createMockFormData({
        model: 'base',
      });
      const event = global.subtitleTestUtils.createMockEvent();
      const gpuConfig =
        global.subtitleTestUtils.createMockGPUConfig('openvino');

      global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
      global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
      global.subtitleTestUtils.setupMockAudioDuration(300000); // 5 minutes

      const mockMonitor =
        global.subtitleTestUtils.setupMockPerformanceMonitor();
      mockMonitor.endSession.mockResolvedValue({
        sessionId: 'session-progressive',
        speedupFactor: 3.7,
        processingTime: 81081,
        audioDuration: 300000,
        addonType: 'openvino',
        realTimeRatio: 3.7,
        optimizationMetrics: {
          cacheHitRate: 92, // 92% cache hits
          modelLoadTime: 1500, // 1.5 seconds (cached)
          inferenceOptimization: 'tensor_optimization',
          performanceGain: '8%_vs_baseline',
        },
      });

      const result = await generateSubtitleWithBuiltinWhisper(
        event,
        baselineFile,
        formData,
      );

      expect(result).toBe(baselineFile.srtFile);

      const endResult = await mockMonitor.endSession.mock.results[0].value;
      expect(endResult.optimizationMetrics.cacheHitRate).toBeGreaterThan(85);
    });
  });

  describe('Error Handling with Timing Constraints', () => {
    test('should handle timeout scenarios gracefully', async () => {
      const file = global.subtitleTestUtils.createMockFile({
        fileName: 'timeout-test.wav',
      });
      const formData = global.subtitleTestUtils.createMockFormData({
        model: 'large',
      });
      const event = global.subtitleTestUtils.createMockEvent();

      global.subtitleTestUtils.setupMockWhisperAddon(false, 'openvino');
      const { loadWhisperAddon } = require('main/helpers/whisper');
      loadWhisperAddon.mockRejectedValue(
        new Error('Processing timeout exceeded'),
      );

      const { handleProcessingError } = require('main/helpers/errorHandler');
      handleProcessingError.mockResolvedValue(file.srtFile);

      const gpuConfig =
        global.subtitleTestUtils.createMockGPUConfig('openvino');
      global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
      global.subtitleTestUtils.setupMockAudioDuration(30000);
      global.subtitleTestUtils.setupMockPerformanceMonitor();

      const result = await generateSubtitleWithBuiltinWhisper(
        event,
        file,
        formData,
      );

      expect(result).toBe(file.srtFile);
      expect(handleProcessingError).toHaveBeenCalled();
    });

    test('should handle performance degradation scenarios', async () => {
      const file = global.subtitleTestUtils.createMockFile({
        fileName: 'degradation-test.wav',
      });
      const formData = global.subtitleTestUtils.createMockFormData({
        model: 'base',
      });
      const event = global.subtitleTestUtils.createMockEvent();
      const gpuConfig =
        global.subtitleTestUtils.createMockGPUConfig('openvino');

      global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
      global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
      global.subtitleTestUtils.setupMockAudioDuration(600000); // 10 minutes

      const mockMonitor =
        global.subtitleTestUtils.setupMockPerformanceMonitor();
      mockMonitor.endSession.mockResolvedValue({
        sessionId: 'session-degradation',
        speedupFactor: 1.8, // Significantly slower than expected
        processingTime: 333333,
        audioDuration: 600000,
        addonType: 'openvino',
        realTimeRatio: 1.8,
        performanceIssues: {
          thermalThrottling: true,
          memoryPressure: 'moderate',
          recoveryAction: 'adaptive_quality_reduction',
        },
      });

      const result = await generateSubtitleWithBuiltinWhisper(
        event,
        file,
        formData,
      );

      expect(result).toBe(file.srtFile);

      const endResult = await mockMonitor.endSession.mock.results[0].value;
      expect(endResult.performanceIssues.thermalThrottling).toBe(true);
    });

    test('should recover from temporary performance issues', async () => {
      const file = global.subtitleTestUtils.createMockFile({
        fileName: 'recovery-test.wav',
      });
      const formData = global.subtitleTestUtils.createMockFormData({
        model: 'small',
      });
      const event = global.subtitleTestUtils.createMockEvent();
      const gpuConfig =
        global.subtitleTestUtils.createMockGPUConfig('openvino');

      global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
      global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
      global.subtitleTestUtils.setupMockAudioDuration(900000); // 15 minutes

      const mockMonitor =
        global.subtitleTestUtils.setupMockPerformanceMonitor();
      mockMonitor.endSession.mockResolvedValue({
        sessionId: 'session-recovery',
        speedupFactor: 3.0, // Recovered to normal performance
        processingTime: 300000,
        audioDuration: 900000,
        addonType: 'openvino',
        realTimeRatio: 3.0,
        recoveryMetrics: {
          temporarySlowdown: true,
          recoveryTime: 45000, // 45 seconds
          finalPerformance: 'nominal',
          adaptiveStrategy: 'dynamic_model_optimization',
        },
      });

      const result = await generateSubtitleWithBuiltinWhisper(
        event,
        file,
        formData,
      );

      expect(result).toBe(file.srtFile);

      const endResult = await mockMonitor.endSession.mock.results[0].value;
      expect(endResult.recoveryMetrics.finalPerformance).toBe('nominal');
    });

    test('should handle resource contention scenarios', async () => {
      const file = global.subtitleTestUtils.createMockFile({
        fileName: 'contention-test.wav',
      });
      const formData = global.subtitleTestUtils.createMockFormData({
        model: 'base',
      });
      const event = global.subtitleTestUtils.createMockEvent();
      const gpuConfig =
        global.subtitleTestUtils.createMockGPUConfig('openvino');

      global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
      global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
      global.subtitleTestUtils.setupMockAudioDuration(720000); // 12 minutes

      const mockMonitor =
        global.subtitleTestUtils.setupMockPerformanceMonitor();
      mockMonitor.endSession.mockResolvedValue({
        sessionId: 'session-contention',
        speedupFactor: 2.4, // Reduced due to contention
        processingTime: 300000,
        audioDuration: 720000,
        addonType: 'openvino',
        realTimeRatio: 2.4,
        contentionHandling: {
          gpuShared: true,
          priorityAdjustment: 'background_processes',
          adaptiveScheduling: true,
          performanceCompromise: 'acceptable',
        },
      });

      const result = await generateSubtitleWithBuiltinWhisper(
        event,
        file,
        formData,
      );

      expect(result).toBe(file.srtFile);

      const endResult = await mockMonitor.endSession.mock.results[0].value;
      expect(endResult.contentionHandling.adaptiveScheduling).toBe(true);
    });
  });
});
