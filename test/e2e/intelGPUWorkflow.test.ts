/**
 * End-to-End Test Suite: Intel GPU Workflow Validation
 * Task 4.3.1: Comprehensive production validation for Intel GPU processing
 *
 * This test suite validates complete subtitle generation workflows using Intel Arc
 * and Intel Xe Graphics, covering real-world production scenarios.
 */

import { jest } from '@jest/globals';
import { MockEnvironment } from '../setup/mockEnvironment';
import { MockGPUData } from '../fixtures/mockGPUData';
import { DevelopmentMockSystem } from '../../main/helpers/developmentMockSystem';
import { SubtitleGenerator } from '../../main/helpers/subtitleGenerator';
import { PerformanceMonitor } from '../../main/helpers/performanceMonitor';
import { ErrorHandler } from '../../main/helpers/errorHandler';
import fs from 'fs';
import path from 'path';

describe('Intel GPU End-to-End Workflow Validation', () => {
  let mockEnv: MockEnvironment;
  let mockSystem: DevelopmentMockSystem;
  let subtitleGenerator: SubtitleGenerator;
  let performanceMonitor: PerformanceMonitor;
  let errorHandler: ErrorHandler;

  beforeAll(async () => {
    mockEnv = new MockEnvironment();
    await mockEnv.setup();

    mockSystem = new DevelopmentMockSystem();
    subtitleGenerator = new SubtitleGenerator();
    performanceMonitor = new PerformanceMonitor();
    errorHandler = new ErrorHandler();
  });

  afterAll(async () => {
    await mockEnv.cleanup();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockSystem.resetToDefaults();
  });

  describe('Intel Arc A770 Complete Workflows', () => {
    beforeEach(() => {
      mockSystem.setActiveGPU(MockGPUData.intelArcA770);
    });

    test('should complete subtitle generation with tiny model', async () => {
      const audioFile = 'test-audio-5min.wav';
      const modelSize = 'tiny';

      const startTime = Date.now();
      const result = await subtitleGenerator.generateSubtitles({
        audioFile,
        modelSize,
        outputFormat: 'srt',
        language: 'en',
        useIntelGPU: true,
      });
      const processingTime = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(result.outputFile).toMatch(/\.srt$/);
      expect(result.processingStats.gpuUsed).toBe('Intel Arc A770');
      expect(result.processingStats.openvinoVersion).toBe('2024.6.0');

      // Performance validation: Arc A770 should provide 3-4x speedup
      expect(processingTime).toBeLessThan(180000); // Under 3 minutes for 5-minute audio
      expect(result.processingStats.speedupFactor).toBeGreaterThanOrEqual(3.0);
      expect(result.processingStats.speedupFactor).toBeLessThanOrEqual(4.2);
    });

    test('should complete subtitle generation with base model', async () => {
      const audioFile = 'test-audio-10min.wav';
      const modelSize = 'base';

      const result = await subtitleGenerator.generateSubtitles({
        audioFile,
        modelSize,
        outputFormat: 'srt',
        language: 'en',
        useIntelGPU: true,
      });

      expect(result.success).toBe(true);
      expect(result.outputFile).toMatch(/\.srt$/);
      expect(result.processingStats.gpuUsed).toBe('Intel Arc A770');
      expect(result.subtitleCount).toBeGreaterThan(20); // Expected for 10-minute audio

      // Quality validation
      expect(result.qualityMetrics.accuracy).toBeGreaterThanOrEqual(0.92);
      expect(result.qualityMetrics.wer).toBeLessThanOrEqual(0.08); // Word Error Rate < 8%
    });

    test('should complete subtitle generation with small model', async () => {
      const audioFile = 'test-audio-15min.wav';
      const modelSize = 'small';

      const result = await subtitleGenerator.generateSubtitles({
        audioFile,
        modelSize,
        outputFormat: 'srt',
        language: 'auto',
        useIntelGPU: true,
      });

      expect(result.success).toBe(true);
      expect(result.processingStats.gpuUsed).toBe('Intel Arc A770');
      expect(result.processingStats.memoryUsage.peak).toBeLessThan(12 * 1024); // Under 12GB
      expect(result.processingStats.memoryUsage.average).toBeLessThan(8 * 1024); // Under 8GB average
    });

    test('should complete subtitle generation with medium model', async () => {
      const audioFile = 'test-audio-20min.wav';
      const modelSize = 'medium';

      const result = await subtitleGenerator.generateSubtitles({
        audioFile,
        modelSize,
        outputFormat: 'srt',
        language: 'zh',
        useIntelGPU: true,
      });

      expect(result.success).toBe(true);
      expect(result.processingStats.gpuUsed).toBe('Intel Arc A770');
      expect(result.languageDetected).toBe('zh');
      expect(result.processingStats.thermalThrottling).toBe(false);
    });

    test('should complete subtitle generation with large model', async () => {
      const audioFile = 'test-audio-30min.wav';
      const modelSize = 'large';

      const result = await subtitleGenerator.generateSubtitles({
        audioFile,
        modelSize,
        outputFormat: 'srt',
        language: 'es',
        useIntelGPU: true,
      });

      expect(result.success).toBe(true);
      expect(result.processingStats.gpuUsed).toBe('Intel Arc A770');
      expect(result.languageDetected).toBe('es');
      expect(result.qualityMetrics.accuracy).toBeGreaterThanOrEqual(0.95); // Best quality with large model
    });

    test('should handle multi-language audio processing', async () => {
      const audioFile = 'test-audio-multilang.wav';

      const result = await subtitleGenerator.generateSubtitles({
        audioFile,
        modelSize: 'medium',
        outputFormat: 'srt',
        language: 'auto',
        useIntelGPU: true,
        detectLanguageSegments: true,
      });

      expect(result.success).toBe(true);
      expect(result.languageSegments).toBeDefined();
      expect(result.languageSegments?.length).toBeGreaterThan(1);
      expect(result.processingStats.gpuUsed).toBe('Intel Arc A770');
    });

    test('should process various audio formats', async () => {
      const audioFormats = ['wav', 'mp3', 'flac', 'm4a', 'ogg'];

      for (const format of audioFormats) {
        const audioFile = `test-audio.${format}`;

        const result = await subtitleGenerator.generateSubtitles({
          audioFile,
          modelSize: 'base',
          outputFormat: 'srt',
          language: 'en',
          useIntelGPU: true,
        });

        expect(result.success).toBe(true);
        expect(result.processingStats.gpuUsed).toBe('Intel Arc A770');
        expect(result.inputFormat).toBe(format);
      }
    });

    test('should handle long-duration audio files (2+ hours)', async () => {
      const audioFile = 'test-audio-2hours.wav';

      const result = await subtitleGenerator.generateSubtitles({
        audioFile,
        modelSize: 'base',
        outputFormat: 'srt',
        language: 'en',
        useIntelGPU: true,
        enableChunking: true,
        chunkSize: 1800, // 30-minute chunks
      });

      expect(result.success).toBe(true);
      expect(result.processingStats.chunksProcessed).toBeGreaterThan(4);
      expect(result.processingStats.gpuUsed).toBe('Intel Arc A770');
      expect(result.processingStats.memoryStable).toBe(true);
    });

    test('should validate SRT output quality and format', async () => {
      const audioFile = 'test-audio-sample.wav';

      const result = await subtitleGenerator.generateSubtitles({
        audioFile,
        modelSize: 'small',
        outputFormat: 'srt',
        language: 'en',
        useIntelGPU: true,
      });

      expect(result.success).toBe(true);
      expect(fs.existsSync(result.outputFile)).toBe(true);

      const srtContent = fs.readFileSync(result.outputFile, 'utf8');

      // Validate SRT format
      expect(srtContent).toMatch(/^\d+$/m); // Sequence numbers
      expect(srtContent).toMatch(
        /\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:\d{2},\d{3}/,
      ); // Timestamps
      expect(
        srtContent.split('\n').filter((line) => line.trim()).length,
      ).toBeGreaterThan(6); // Content lines

      // Quality checks
      expect(result.qualityMetrics.emptySubtitles).toBeLessThan(0.05); // < 5% empty
      expect(result.qualityMetrics.averageConfidence).toBeGreaterThan(0.85);
    });

    test('should measure and validate performance metrics', async () => {
      const audioFile = 'test-audio-benchmark.wav';

      const metrics = await performanceMonitor.benchmarkIntelGPU({
        gpuModel: 'Intel Arc A770',
        audioFile,
        modelSize: 'base',
      });

      expect(metrics.processingSpeed).toBeGreaterThanOrEqual(3.0); // 3x+ speedup
      expect(metrics.memoryEfficiency).toBeGreaterThanOrEqual(0.75); // 75%+ efficiency
      expect(metrics.thermalStability).toBe(true);
      expect(metrics.powerConsumption).toBeLessThan(225); // Under 225W
      expect(metrics.gpuUtilization).toBeGreaterThanOrEqual(0.8); // 80%+ utilization
    });
  });

  describe('Intel Xe Graphics (Core Ultra) Complete Workflows', () => {
    beforeEach(() => {
      mockSystem.setActiveGPU(MockGPUData.intelXeGraphics);
    });

    test('should complete subtitle generation with tiny model on integrated GPU', async () => {
      const audioFile = 'test-audio-5min.wav';

      const result = await subtitleGenerator.generateSubtitles({
        audioFile,
        modelSize: 'tiny',
        outputFormat: 'srt',
        language: 'en',
        useIntelGPU: true,
      });

      expect(result.success).toBe(true);
      expect(result.processingStats.gpuUsed).toBe('Intel Xe Graphics');
      expect(result.processingStats.isIntegratedGPU).toBe(true);

      // Integrated GPU performance: 2-3x speedup
      expect(result.processingStats.speedupFactor).toBeGreaterThanOrEqual(2.0);
      expect(result.processingStats.speedupFactor).toBeLessThanOrEqual(3.2);
    });

    test('should complete subtitle generation with base model on integrated GPU', async () => {
      const audioFile = 'test-audio-10min.wav';

      const result = await subtitleGenerator.generateSubtitles({
        audioFile,
        modelSize: 'base',
        outputFormat: 'srt',
        language: 'en',
        useIntelGPU: true,
      });

      expect(result.success).toBe(true);
      expect(result.processingStats.gpuUsed).toBe('Intel Xe Graphics');
      expect(result.processingStats.sharedMemoryUsage).toBeLessThan(4 * 1024); // Under 4GB shared
      expect(result.processingStats.powerEfficient).toBe(true);
    });

    test('should handle memory constraints gracefully on integrated GPU', async () => {
      const audioFile = 'test-audio-large.wav';

      const result = await subtitleGenerator.generateSubtitles({
        audioFile,
        modelSize: 'small', // Limited by integrated GPU memory
        outputFormat: 'srt',
        language: 'en',
        useIntelGPU: true,
        adaptiveMemoryManagement: true,
      });

      expect(result.success).toBe(true);
      expect(result.processingStats.memoryAdaptationUsed).toBe(true);
      expect(result.processingStats.gpuUsed).toBe('Intel Xe Graphics');
    });

    test('should validate power efficiency on integrated GPU', async () => {
      const audioFile = 'test-audio-efficiency.wav';

      const metrics = await performanceMonitor.benchmarkIntelGPU({
        gpuModel: 'Intel Xe Graphics',
        audioFile,
        modelSize: 'tiny',
      });

      expect(metrics.powerConsumption).toBeLessThan(25); // Under 25W
      expect(metrics.thermalImpact).toBeLessThan(10); // < 10°C increase
      expect(metrics.batteryImpact).toBeLessThan(0.15); // < 15% battery drain per hour
    });
  });

  describe('GPU Failure and Fallback Scenarios', () => {
    test('should gracefully fallback to CPU when Intel GPU fails', async () => {
      mockSystem.simulateGPUFailure('runtime_error');

      const audioFile = 'test-audio-fallback.wav';

      const result = await subtitleGenerator.generateSubtitles({
        audioFile,
        modelSize: 'tiny',
        outputFormat: 'srt',
        language: 'en',
        useIntelGPU: true,
        fallbackToCPU: true,
      });

      expect(result.success).toBe(true);
      expect(result.processingStats.gpuUsed).toBe('CPU (fallback)');
      expect(result.processingStats.fallbackReason).toBe('runtime_error');
      expect(result.warnings).toContain('Intel GPU failed, using CPU fallback');
    });

    test('should handle OpenVINO driver issues gracefully', async () => {
      mockSystem.simulateOpenVINOIssue('driver_version_mismatch');

      const audioFile = 'test-audio-driver.wav';

      const result = await subtitleGenerator.generateSubtitles({
        audioFile,
        modelSize: 'tiny',
        outputFormat: 'srt',
        language: 'en',
        useIntelGPU: true,
      });

      expect(result.success).toBe(true);
      expect(result.warnings).toContain(
        'OpenVINO driver version mismatch detected',
      );
      expect(result.processingStats.driverWorkaround).toBe(true);
    });

    test('should handle insufficient GPU memory scenarios', async () => {
      mockSystem.simulateMemoryConstraint(2048); // 2GB limit

      const audioFile = 'test-audio-memory.wav';

      const result = await subtitleGenerator.generateSubtitles({
        audioFile,
        modelSize: 'large', // Requires more memory
        outputFormat: 'srt',
        language: 'en',
        useIntelGPU: true,
        autoModelDownsize: true,
      });

      expect(result.success).toBe(true);
      expect(result.processingStats.modelDownsized).toBe(true);
      expect(result.processingStats.finalModelUsed).toBe('medium'); // Downsized from large
    });
  });

  describe('Multi-Platform User Experience', () => {
    test('should provide consistent experience on Windows 10', async () => {
      mockSystem.setPlatform('win32', '10.0.19044');
      mockSystem.setActiveGPU(MockGPUData.intelArcA770);

      const result = await subtitleGenerator.generateSubtitles({
        audioFile: 'test-audio.wav',
        modelSize: 'base',
        outputFormat: 'srt',
        language: 'en',
        useIntelGPU: true,
      });

      expect(result.success).toBe(true);
      expect(result.processingStats.platform).toBe('Windows 10');
      expect(result.processingStats.gpuDriverVersion).toMatch(/^\d+\.\d+\./);
    });

    test('should provide consistent experience on Windows 11', async () => {
      mockSystem.setPlatform('win32', '10.0.22621');
      mockSystem.setActiveGPU(MockGPUData.intelXeGraphics);

      const result = await subtitleGenerator.generateSubtitles({
        audioFile: 'test-audio.wav',
        modelSize: 'small',
        outputFormat: 'srt',
        language: 'en',
        useIntelGPU: true,
      });

      expect(result.success).toBe(true);
      expect(result.processingStats.platform).toBe('Windows 11');
      expect(result.processingStats.coreUltraOptimizations).toBe(true);
    });

    test('should provide consistent experience on Ubuntu 20.04', async () => {
      mockSystem.setPlatform('linux', 'Ubuntu 20.04.6 LTS');
      mockSystem.setActiveGPU(MockGPUData.intelArcA770);

      const result = await subtitleGenerator.generateSubtitles({
        audioFile: 'test-audio.wav',
        modelSize: 'base',
        outputFormat: 'srt',
        language: 'en',
        useIntelGPU: true,
      });

      expect(result.success).toBe(true);
      expect(result.processingStats.platform).toBe('Ubuntu 20.04');
      expect(result.processingStats.kernelModule).toBe('i915');
    });

    test('should provide consistent experience on Ubuntu 22.04', async () => {
      mockSystem.setPlatform('linux', 'Ubuntu 22.04.3 LTS');
      mockSystem.setActiveGPU(MockGPUData.intelXeGraphics);

      const result = await subtitleGenerator.generateSubtitles({
        audioFile: 'test-audio.wav',
        modelSize: 'tiny',
        outputFormat: 'srt',
        language: 'en',
        useIntelGPU: true,
      });

      expect(result.success).toBe(true);
      expect(result.processingStats.platform).toBe('Ubuntu 22.04');
      expect(result.processingStats.openvinoInstallation).toBe('apt');
    });
  });

  describe('Performance Validation Within Expected Ranges', () => {
    test('should validate Intel Arc A770 performance benchmarks', async () => {
      mockSystem.setActiveGPU(MockGPUData.intelArcA770);

      const benchmarks = await performanceMonitor.runComprehensiveBenchmark({
        gpuModel: 'Intel Arc A770',
        testSuite: 'production_validation',
      });

      // Performance targets for Intel Arc A770
      expect(benchmarks.tinyModel.speedup).toBeGreaterThanOrEqual(3.2);
      expect(benchmarks.tinyModel.speedup).toBeLessThanOrEqual(4.2);

      expect(benchmarks.baseModel.speedup).toBeGreaterThanOrEqual(3.0);
      expect(benchmarks.baseModel.speedup).toBeLessThanOrEqual(4.0);

      expect(benchmarks.smallModel.speedup).toBeGreaterThanOrEqual(2.8);
      expect(benchmarks.smallModel.speedup).toBeLessThanOrEqual(3.8);

      expect(benchmarks.mediumModel.speedup).toBeGreaterThanOrEqual(2.5);
      expect(benchmarks.mediumModel.speedup).toBeLessThanOrEqual(3.5);

      expect(benchmarks.largeModel.speedup).toBeGreaterThanOrEqual(2.3);
      expect(benchmarks.largeModel.speedup).toBeLessThanOrEqual(3.2);
    });

    test('should validate Intel Xe Graphics performance benchmarks', async () => {
      mockSystem.setActiveGPU(MockGPUData.intelXeGraphics);

      const benchmarks = await performanceMonitor.runComprehensiveBenchmark({
        gpuModel: 'Intel Xe Graphics',
        testSuite: 'production_validation',
      });

      // Performance targets for Intel Xe Graphics (integrated)
      expect(benchmarks.tinyModel.speedup).toBeGreaterThanOrEqual(2.5);
      expect(benchmarks.tinyModel.speedup).toBeLessThanOrEqual(3.2);

      expect(benchmarks.baseModel.speedup).toBeGreaterThanOrEqual(2.2);
      expect(benchmarks.baseModel.speedup).toBeLessThanOrEqual(3.0);

      expect(benchmarks.smallModel.speedup).toBeGreaterThanOrEqual(2.0);
      expect(benchmarks.smallModel.speedup).toBeLessThanOrEqual(2.8);

      // Medium and large models may be memory-constrained on integrated GPU
      expect(benchmarks.mediumModel.speedup).toBeGreaterThanOrEqual(1.8);
      expect(benchmarks.largeModel.memoryConstrained).toBe(true);
    });

    test('should validate memory usage patterns', async () => {
      const testCases = [
        {
          gpu: MockGPUData.intelArcA770,
          model: 'large',
          expectedMemory: 12000,
        },
        {
          gpu: MockGPUData.intelArcA770,
          model: 'medium',
          expectedMemory: 6000,
        },
        {
          gpu: MockGPUData.intelXeGraphics,
          model: 'small',
          expectedMemory: 3000,
        },
        {
          gpu: MockGPUData.intelXeGraphics,
          model: 'base',
          expectedMemory: 2000,
        },
      ];

      for (const testCase of testCases) {
        mockSystem.setActiveGPU(testCase.gpu);

        const result = await subtitleGenerator.generateSubtitles({
          audioFile: 'test-audio.wav',
          modelSize: testCase.model,
          outputFormat: 'srt',
          language: 'en',
          useIntelGPU: true,
        });

        expect(result.success).toBe(true);
        expect(result.processingStats.memoryUsage.peak).toBeLessThan(
          testCase.expectedMemory,
        );
        expect(result.processingStats.memoryLeaks).toBe(false);
      }
    });

    test('should validate thermal and power characteristics', async () => {
      const configurations = [
        { gpu: MockGPUData.intelArcA770, maxTemp: 85, maxPower: 225 },
        { gpu: MockGPUData.intelXeGraphics, maxTemp: 95, maxPower: 25 },
      ];

      for (const config of configurations) {
        mockSystem.setActiveGPU(config.gpu);

        const metrics = await performanceMonitor.monitorThermalAndPower({
          duration: 300000, // 5 minutes
          workload: 'continuous_processing',
        });

        expect(metrics.peakTemperature).toBeLessThan(config.maxTemp);
        expect(metrics.averagePower).toBeLessThan(config.maxPower);
        expect(metrics.thermalThrottling).toBe(false);
        expect(metrics.powerThrottling).toBe(false);
      }
    });

    test('should validate concurrent processing capabilities', async () => {
      mockSystem.setActiveGPU(MockGPUData.intelArcA770);

      const concurrentTasks = [
        { audioFile: 'audio1.wav', modelSize: 'tiny' },
        { audioFile: 'audio2.wav', modelSize: 'base' },
        { audioFile: 'audio3.wav', modelSize: 'small' },
      ];

      const startTime = Date.now();
      const results = await Promise.all(
        concurrentTasks.map((task) =>
          subtitleGenerator.generateSubtitles({
            ...task,
            outputFormat: 'srt',
            language: 'en',
            useIntelGPU: true,
          }),
        ),
      );
      const totalTime = Date.now() - startTime;

      results.forEach((result) => {
        expect(result.success).toBe(true);
        expect(result.processingStats.gpuUsed).toBe('Intel Arc A770');
      });

      // Concurrent processing should be more efficient than sequential
      expect(totalTime).toBeLessThan(300000); // Under 5 minutes for all three
      expect(results[0].processingStats.concurrentTasks).toBe(3);
    });
  });

  describe('Error Recovery and Robustness', () => {
    test('should recover from transient GPU errors', async () => {
      mockSystem.simulateTransientError('gpu_timeout', 2); // Fail twice, then succeed

      const result = await subtitleGenerator.generateSubtitles({
        audioFile: 'test-audio.wav',
        modelSize: 'tiny',
        outputFormat: 'srt',
        language: 'en',
        useIntelGPU: true,
        retryOnFailure: true,
        maxRetries: 3,
      });

      expect(result.success).toBe(true);
      expect(result.processingStats.retryCount).toBe(2);
      expect(result.processingStats.finalAttemptSuccessful).toBe(true);
    });

    test('should handle system resource constraints', async () => {
      mockSystem.simulateResourceConstraint('high_cpu_usage', 0.95);

      const result = await subtitleGenerator.generateSubtitles({
        audioFile: 'test-audio.wav',
        modelSize: 'base',
        outputFormat: 'srt',
        language: 'en',
        useIntelGPU: true,
        adaptToSystemLoad: true,
      });

      expect(result.success).toBe(true);
      expect(result.processingStats.adaptiveScheduling).toBe(true);
      expect(result.processingStats.reducedConcurrency).toBe(true);
    });

    test('should validate application restart and recovery', async () => {
      mockSystem.setActiveGPU(MockGPUData.intelArcA770);

      // Simulate application restart during processing
      const result1 = await subtitleGenerator.generateSubtitles({
        audioFile: 'test-audio-long.wav',
        modelSize: 'base',
        outputFormat: 'srt',
        language: 'en',
        useIntelGPU: true,
        enableCheckpointing: true,
      });

      // Simulate restart and recovery
      mockSystem.simulateRestart();

      const result2 = await subtitleGenerator.recoverFromCheckpoint({
        checkpointFile: result1.checkpointFile,
        useIntelGPU: true,
      });

      expect(result2.success).toBe(true);
      expect(result2.processingStats.recoveredFromCheckpoint).toBe(true);
      expect(result2.processingStats.timeRecovered).toBeGreaterThan(0);
    });
  });
});
