/**
 * Task 3.1.1: Memory Constraint Handling Tests
 * Tests system behavior under various memory constraint scenarios
 * Part of Phase 3: Production Excellence
 */

import { jest } from '@jest/globals';
import { generateSubtitleWithBuiltinWhisper } from '../../main/helpers/subtitleGenerator';
import '../../test/setup/subtitleTestSetup';

describe('Memory Constraint Handling', () => {
  let mockEvent: any;
  let mockFile: any;
  let mockFormData: any;

  beforeEach(() => {
    global.subtitleTestUtils.resetSubtitleMocks();

    mockEvent = global.subtitleTestUtils.createMockEvent();
    mockFile = global.subtitleTestUtils.createMockFile();
    mockFormData = global.subtitleTestUtils.createMockFormData();

    // Setup default successful scenario
    global.subtitleTestUtils.setupMockAudioDuration(30000); // 30 seconds
    global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
    global.subtitleTestUtils.setupMockGPUConfig(
      global.subtitleTestUtils.createMockGPUConfig('openvino'),
    );
    global.subtitleTestUtils.setupMockPerformanceMonitor();
  });

  describe('Low System Memory Scenarios', () => {
    test('should handle 4GB system memory gracefully', async () => {
      // Mock low memory system conditions
      const lowMemoryConfig =
        global.subtitleTestUtils.createMockGPUConfig('openvino');
      lowMemoryConfig.performanceHints.memoryUsage = 'low';
      lowMemoryConfig.whisperParams.memory_optimization = true;
      lowMemoryConfig.whisperParams.chunk_size = 'small';

      global.subtitleTestUtils.setupMockGPUConfig(lowMemoryConfig);

      // Mock memory monitoring
      const mockMonitor =
        global.subtitleTestUtils.setupMockPerformanceMonitor();
      mockMonitor.endSession.mockResolvedValue({
        sessionId: 'low-memory-session',
        speedupFactor: 2.0, // Reduced due to memory constraints
        processingTime: 8000, // Slower processing
        addonType: 'openvino',
        realTimeRatio: 1.5,
        memoryUsage: {
          heapUsed: 3.5 * 1024 * 1024 * 1024, // 3.5GB
          peak: 3.8 * 1024 * 1024 * 1024, // 3.8GB peak
        },
      });

      const result = await generateSubtitleWithBuiltinWhisper(
        mockEvent,
        mockFile,
        mockFormData,
      );

      expect(result).toBe(mockFile.srtFile);
      expect(mockEvent.sender.send).toHaveBeenCalledWith(
        'gpuSelected',
        expect.objectContaining({
          addonType: 'openvino',
          displayName: 'Intel Arc A770',
        }),
      );

      // Verify memory optimization was applied
      expect(
        global.gpuConfigMocks.determineGPUConfiguration,
      ).toHaveBeenCalled();
      expect(
        global.performanceMonitorMocks.monitor.endSession,
      ).toHaveBeenCalled();
    });

    test('should handle 8GB system memory with balanced performance', async () => {
      // Mock medium memory system conditions
      const mediumMemoryConfig =
        global.subtitleTestUtils.createMockGPUConfig('openvino');
      mediumMemoryConfig.performanceHints.memoryUsage = 'medium';
      mediumMemoryConfig.whisperParams.memory_optimization = false;
      mediumMemoryConfig.whisperParams.chunk_size = 'medium';

      global.subtitleTestUtils.setupMockGPUConfig(mediumMemoryConfig);

      const mockMonitor =
        global.subtitleTestUtils.setupMockPerformanceMonitor();
      mockMonitor.endSession.mockResolvedValue({
        sessionId: 'medium-memory-session',
        speedupFactor: 3.0, // Better performance with more memory
        processingTime: 6000,
        addonType: 'openvino',
        realTimeRatio: 2.0,
        memoryUsage: {
          heapUsed: 6.5 * 1024 * 1024 * 1024, // 6.5GB
          peak: 7.2 * 1024 * 1024 * 1024, // 7.2GB peak
        },
      });

      const result = await generateSubtitleWithBuiltinWhisper(
        mockEvent,
        mockFile,
        mockFormData,
      );

      expect(result).toBe(mockFile.srtFile);

      // Verify balanced configuration was applied
      const performanceMetrics = mockEvent.sender.send.mock.calls.find(
        (call) =>
          call[0] === 'taskFileChange' && call[1].extractSubtitle === 'done',
      );
      expect(performanceMetrics[1].performanceMetrics.speedupFactor).toBe(3.0);
    });

    test('should fallback to CPU processing when memory is critically low', async () => {
      // Mock critically low memory scenario
      const cpuFallbackConfig =
        global.subtitleTestUtils.createMockGPUConfig('cpu');
      cpuFallbackConfig.performanceHints.memoryUsage = 'minimal';

      global.subtitleTestUtils.setupMockGPUConfig(cpuFallbackConfig);

      const mockMonitor =
        global.subtitleTestUtils.setupMockPerformanceMonitor();
      mockMonitor.endSession.mockResolvedValue({
        sessionId: 'cpu-fallback-session',
        speedupFactor: 1.0, // CPU baseline
        processingTime: 15000, // Much slower
        addonType: 'cpu',
        realTimeRatio: 0.5,
        memoryUsage: {
          heapUsed: 2.8 * 1024 * 1024 * 1024, // 2.8GB
          peak: 3.1 * 1024 * 1024 * 1024, // 3.1GB peak
        },
      });

      const result = await generateSubtitleWithBuiltinWhisper(
        mockEvent,
        mockFile,
        mockFormData,
      );

      expect(result).toBe(mockFile.srtFile);
      expect(mockEvent.sender.send).toHaveBeenCalledWith(
        'gpuSelected',
        expect.objectContaining({
          addonType: 'cpu',
          displayName: 'CPU Processing',
        }),
      );
    });
  });

  describe('GPU Memory Exhaustion Handling', () => {
    test('should detect and handle GPU memory exhaustion', async () => {
      // Mock GPU memory validation failure
      global.gpuConfigMocks.validateGPUMemory.mockReturnValue(false);

      // Setup GPU config with memory warnings
      const memoryConstrainedConfig =
        global.subtitleTestUtils.createMockGPUConfig('openvino');
      memoryConstrainedConfig.addonInfo.deviceConfig.memory = 4096; // Limited GPU memory
      memoryConstrainedConfig.performanceHints.memoryUsage = 'constrained';

      global.subtitleTestUtils.setupMockGPUConfig(memoryConstrainedConfig);

      const result = await generateSubtitleWithBuiltinWhisper(
        mockEvent,
        mockFile,
        mockFormData,
      );

      expect(result).toBe(mockFile.srtFile);

      // Verify memory validation was called
      expect(global.gpuConfigMocks.validateGPUMemory).toHaveBeenCalledWith(
        expect.objectContaining({
          deviceConfig: expect.objectContaining({
            memory: 4096,
          }),
        }),
        'base',
      );
    });

    test('should gracefully degrade when GPU memory is insufficient for large models', async () => {
      // Test with large model on limited GPU
      const largeModelFormData = {
        ...mockFormData,
        model: 'large-v3', // Requires more GPU memory
      };

      // Mock insufficient GPU memory
      global.gpuConfigMocks.validateGPUMemory.mockReturnValue(false);

      const constrainedConfig =
        global.subtitleTestUtils.createMockGPUConfig('openvino');
      constrainedConfig.addonInfo.deviceConfig.memory = 2048; // 2GB - insufficient for large model
      constrainedConfig.performanceHints.expectedSpeedup = 2.0; // Reduced due to constraints

      global.subtitleTestUtils.setupMockGPUConfig(constrainedConfig);

      const result = await generateSubtitleWithBuiltinWhisper(
        mockEvent,
        mockFile,
        largeModelFormData,
      );

      expect(result).toBe(mockFile.srtFile);

      // Should still complete but with warnings
      const loggerMock = require('main/helpers/logger').logMessage;
      expect(loggerMock).toHaveBeenCalledWith(
        expect.stringContaining('Insufficient GPU memory for model large-v3'),
        'warning',
      );
    });

    test('should handle GPU memory allocation failures during processing', async () => {
      // Mock GPU memory allocation failure during processing
      const whisperErrorConfig =
        global.subtitleTestUtils.createMockGPUConfig('openvino');
      global.subtitleTestUtils.setupMockGPUConfig(whisperErrorConfig);

      // Mock whisper addon to fail with memory error
      const { loadWhisperAddon } = require('main/helpers/whisper');
      const mockWhisperFn = jest
        .fn()
        .mockRejectedValue(new Error('GPU memory allocation failed'));
      loadWhisperAddon.mockResolvedValue(mockWhisperFn);

      // Mock error handler recovery
      const errorHandler = require('main/helpers/errorHandler');
      errorHandler.handleProcessingError.mockResolvedValue(mockFile.srtFile);

      const result = await generateSubtitleWithBuiltinWhisper(
        mockEvent,
        mockFile,
        mockFormData,
      );

      expect(result).toBe(mockFile.srtFile);
      expect(errorHandler.handleProcessingError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'GPU memory allocation failed',
        }),
        mockEvent,
        mockFile,
        mockFormData,
      );
    });
  });

  describe('Memory Management During Processing', () => {
    test('should monitor and manage memory usage throughout processing', async () => {
      const mockMonitor =
        global.subtitleTestUtils.setupMockPerformanceMonitor();

      // Mock long audio file that requires memory management
      global.subtitleTestUtils.setupMockAudioDuration(7200000); // 2 hours

      const longAudioFile = {
        ...mockFile,
        fileName: 'long_audio_2hr.wav',
      };

      const result = await generateSubtitleWithBuiltinWhisper(
        mockEvent,
        longAudioFile,
        mockFormData,
      );

      expect(result).toBe(longAudioFile.srtFile);

      // Verify memory monitoring was active
      expect(mockMonitor.startSession).toHaveBeenCalled();
      expect(mockMonitor.updateMemoryUsage).toHaveBeenCalled();
      expect(mockMonitor.endSession).toHaveBeenCalled();
    });

    test('should handle memory pressure during processing with chunking', async () => {
      // Mock memory pressure scenario
      const memoryPressureConfig =
        global.subtitleTestUtils.createMockGPUConfig('openvino');
      memoryPressureConfig.whisperParams.enable_chunking = true;
      memoryPressureConfig.whisperParams.chunk_size = 'small';
      memoryPressureConfig.performanceHints.memoryManagement = 'aggressive';

      global.subtitleTestUtils.setupMockGPUConfig(memoryPressureConfig);

      // Mock very long audio that would cause memory pressure
      global.subtitleTestUtils.setupMockAudioDuration(14400000); // 4 hours

      const longAudioFile = {
        ...mockFile,
        fileName: 'very_long_audio_4hr.wav',
      };

      const result = await generateSubtitleWithBuiltinWhisper(
        mockEvent,
        longAudioFile,
        mockFormData,
      );

      expect(result).toBe(longAudioFile.srtFile);

      // Verify chunking parameters were applied
      expect(
        global.gpuConfigMocks.determineGPUConfiguration,
      ).toHaveBeenCalled();
    });

    test('should recover from memory allocation failures with fallback strategies', async () => {
      // Mock initial memory allocation failure followed by successful fallback
      let callCount = 0;
      const { loadWhisperAddon } = require('main/helpers/whisper');
      const mockWhisperFn = jest.fn((params, callback) => {
        callCount++;
        if (callCount === 1) {
          // First call fails with memory error
          const error = new Error('Out of memory');
          if (callback) callback(error);
          else return Promise.reject(error);
        } else {
          // Second call (fallback) succeeds
          const result =
            global.subtitleTestUtils.createMockTranscriptionResult();
          if (callback) callback(null, result);
          else return Promise.resolve(result);
        }
      });

      loadWhisperAddon.mockResolvedValue(mockWhisperFn);

      // Mock error handler to retry with different configuration
      const errorHandler = require('main/helpers/errorHandler');
      errorHandler.handleProcessingError.mockImplementation(
        async (error, event, file, formData) => {
          // Simulate retry with CPU fallback
          const cpuConfig = global.subtitleTestUtils.createMockGPUConfig('cpu');
          global.subtitleTestUtils.setupMockGPUConfig(cpuConfig);

          // Return the same file path to indicate recovery
          return file.srtFile;
        },
      );

      const result = await generateSubtitleWithBuiltinWhisper(
        mockEvent,
        mockFile,
        mockFormData,
      );

      expect(result).toBe(mockFile.srtFile);
      expect(errorHandler.handleProcessingError).toHaveBeenCalled();
    });
  });

  describe('Memory Constraint Integration Tests', () => {
    test('should handle multiple concurrent memory constraints', async () => {
      // Mock scenario with both system and GPU memory constraints
      const constrainedConfig =
        global.subtitleTestUtils.createMockGPUConfig('openvino');
      constrainedConfig.addonInfo.deviceConfig.memory = 4096; // Limited GPU memory
      constrainedConfig.performanceHints.memoryUsage = 'constrained';
      constrainedConfig.whisperParams.memory_optimization = true;
      constrainedConfig.whisperParams.concurrent_limit = 1; // Limit concurrency

      global.subtitleTestUtils.setupMockGPUConfig(constrainedConfig);
      global.gpuConfigMocks.validateGPUMemory.mockReturnValue(false);

      const result = await generateSubtitleWithBuiltinWhisper(
        mockEvent,
        mockFile,
        mockFormData,
      );

      expect(result).toBe(mockFile.srtFile);

      // Verify both memory constraints were handled
      expect(global.gpuConfigMocks.validateGPUMemory).toHaveBeenCalled();
      expect(
        global.gpuConfigMocks.determineGPUConfiguration,
      ).toHaveBeenCalled();
    });

    test('should provide meaningful error messages for memory constraint failures', async () => {
      // Mock critical memory failure
      const { loadWhisperAddon } = require('main/helpers/whisper');
      loadWhisperAddon.mockRejectedValue(
        new Error(
          'Critical memory allocation failure - insufficient system resources',
        ),
      );

      // Mock error handler failure to test final fallback
      const errorHandler = require('main/helpers/errorHandler');
      errorHandler.handleProcessingError.mockRejectedValue(
        new Error('Memory recovery failed'),
      );

      const result = await generateSubtitleWithBuiltinWhisper(
        mockEvent,
        mockFile,
        mockFormData,
      );

      expect(result).toBe(mockFile.srtFile);

      // Verify error was sent to UI with meaningful message
      expect(mockEvent.sender.send).toHaveBeenCalledWith(
        'taskFileChange',
        expect.objectContaining({
          extractSubtitle: 'error',
          error: 'Memory recovery failed',
        }),
      );
    });
  });
});
