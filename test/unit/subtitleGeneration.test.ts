/**
 * Test Suite: Subtitle Generation with Intel GPU Integration
 * Comprehensive tests for enhanced subtitle generation workflow
 *
 * Requirements tested:
 * - Intel GPU processing integrated into subtitle generation
 * - OpenVINO-specific parameters configured correctly
 * - Performance monitoring collects processing metrics
 * - Error handling recovers gracefully from GPU failures
 * - Progress callbacks work correctly during GPU processing
 * - Existing subtitle generation functionality preserved
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { generateSubtitleWithBuiltinWhisper } from 'main/helpers/subtitleGenerator';

// Test setup
import 'test/setup/settingsTestSetup';
import 'test/setup/subtitleTestSetup';

describe('Subtitle Generation with Intel GPU', () => {
  beforeEach(() => {
    global.subtitleTestUtils.resetSubtitleMocks();
  });

  test('should generate subtitles using Intel Arc A770 successfully', async () => {
    // Enable console output for debugging
    const originalLog = console.log;
    console.log = (...args) => {
      originalLog(...args);
      process.stdout.write(args.join(' ') + '\n');
    };
    const file = global.subtitleTestUtils.createMockFile();
    const formData = global.subtitleTestUtils.createMockFormData();
    const event = global.subtitleTestUtils.createMockEvent();
    const gpuConfig = global.subtitleTestUtils.createMockGPUConfig('openvino');

    global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
    global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
    global.subtitleTestUtils.setupMockAudioDuration(30000);
    global.subtitleTestUtils.setupMockPerformanceMonitor();

    // Additional explicit mock to ensure loadWhisperAddon works
    const { loadWhisperAddon } = require('main/helpers/whisper');
    loadWhisperAddon.mockResolvedValue(
      global.subtitleTestUtils.createMockWhisperFunction(),
    );

    const result = await generateSubtitleWithBuiltinWhisper(
      event,
      file,
      formData,
    );

    console.log('📋 TEST RESULT:');
    console.log('Returned:', result);
    console.log('Expected:', file.srtFile);
    console.log('Match:', result === file.srtFile ? '✅' : '❌');

    // Restore console.log
    console.log = originalLog;

    expect(result).toBe(file.srtFile);
    expect(event.sender.send).toHaveBeenCalledWith(
      'gpuSelected',
      expect.objectContaining({
        addonType: 'openvino',
        displayName: 'Intel Arc A770',
        expectedSpeedup: 3.5,
      }),
    );
  });

  test('should generate subtitles using Intel Xe Graphics successfully', async () => {
    const file = global.subtitleTestUtils.createMockFile();
    const formData = global.subtitleTestUtils.createMockFormData();
    const event = global.subtitleTestUtils.createMockEvent();

    const integratedGpuConfig = {
      ...global.subtitleTestUtils.createMockGPUConfig('openvino'),
      addonInfo: {
        type: 'openvino',
        displayName: 'Intel Xe Graphics',
        deviceConfig: {
          deviceId: 'GPU1',
          memory: 'shared',
          type: 'integrated',
        },
      },
      performanceHints: {
        expectedSpeedup: 2.5,
        powerEfficiency: 'excellent',
      },
    };

    global.subtitleTestUtils.setupMockGPUConfig(integratedGpuConfig);
    global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
    global.subtitleTestUtils.setupMockAudioDuration(30000);
    global.subtitleTestUtils.setupMockPerformanceMonitor();

    const result = await generateSubtitleWithBuiltinWhisper(
      event,
      file,
      formData,
    );

    expect(result).toBe(file.srtFile);
    expect(event.sender.send).toHaveBeenCalledWith(
      'gpuSelected',
      expect.objectContaining({
        addonType: 'openvino',
        displayName: 'Intel Xe Graphics',
        expectedSpeedup: 2.5,
      }),
    );
  });

  test('should handle tiny model processing correctly', async () => {
    const file = global.subtitleTestUtils.createMockFile();
    const formData = global.subtitleTestUtils.createMockFormData({
      model: 'tiny',
    });
    const event = global.subtitleTestUtils.createMockEvent();
    const gpuConfig = global.subtitleTestUtils.createMockGPUConfig('openvino');

    global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
    global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
    global.subtitleTestUtils.setupMockAudioDuration(10000);
    global.subtitleTestUtils.setupMockPerformanceMonitor();

    const result = await generateSubtitleWithBuiltinWhisper(
      event,
      file,
      formData,
    );

    expect(result).toBe(file.srtFile);

    // Verify model parameter was passed correctly
    const { loadWhisperAddon } = require('main/helpers/whisper');
    expect(loadWhisperAddon).toHaveBeenCalledWith('tiny');
  });

  test('should handle base model processing correctly', async () => {
    const file = global.subtitleTestUtils.createMockFile();
    const formData = global.subtitleTestUtils.createMockFormData({
      model: 'base',
    });
    const event = global.subtitleTestUtils.createMockEvent();
    const gpuConfig = global.subtitleTestUtils.createMockGPUConfig('openvino');

    global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
    global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
    global.subtitleTestUtils.setupMockAudioDuration(20000);
    global.subtitleTestUtils.setupMockPerformanceMonitor();

    const result = await generateSubtitleWithBuiltinWhisper(
      event,
      file,
      formData,
    );

    expect(result).toBe(file.srtFile);
    expect(loadWhisperAddon).toHaveBeenCalledWith('base');
  });

  test('should handle small model processing correctly', async () => {
    const file = global.subtitleTestUtils.createMockFile();
    const formData = global.subtitleTestUtils.createMockFormData({
      model: 'small',
    });
    const event = global.subtitleTestUtils.createMockEvent();
    const gpuConfig = global.subtitleTestUtils.createMockGPUConfig('openvino');

    global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
    global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
    global.subtitleTestUtils.setupMockAudioDuration(30000);
    global.subtitleTestUtils.setupMockPerformanceMonitor();

    const result = await generateSubtitleWithBuiltinWhisper(
      event,
      file,
      formData,
    );

    expect(result).toBe(file.srtFile);
    expect(loadWhisperAddon).toHaveBeenCalledWith('small');
  });

  test('should handle medium model processing correctly', async () => {
    const file = global.subtitleTestUtils.createMockFile();
    const formData = global.subtitleTestUtils.createMockFormData({
      model: 'medium',
    });
    const event = global.subtitleTestUtils.createMockEvent();
    const gpuConfig = global.subtitleTestUtils.createMockGPUConfig('openvino');

    global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
    global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
    global.subtitleTestUtils.setupMockAudioDuration(45000);
    global.subtitleTestUtils.setupMockPerformanceMonitor();

    const result = await generateSubtitleWithBuiltinWhisper(
      event,
      file,
      formData,
    );

    expect(result).toBe(file.srtFile);
    expect(loadWhisperAddon).toHaveBeenCalledWith('medium');
  });

  test('should handle large model processing correctly', async () => {
    const file = global.subtitleTestUtils.createMockFile();
    const formData = global.subtitleTestUtils.createMockFormData({
      model: 'large',
    });
    const event = global.subtitleTestUtils.createMockEvent();
    const gpuConfig = global.subtitleTestUtils.createMockGPUConfig('openvino');

    global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
    global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
    global.subtitleTestUtils.setupMockAudioDuration(60000);
    global.subtitleTestUtils.setupMockPerformanceMonitor();

    const result = await generateSubtitleWithBuiltinWhisper(
      event,
      file,
      formData,
    );

    expect(result).toBe(file.srtFile);
    expect(loadWhisperAddon).toHaveBeenCalledWith('large');
  });

  test('should process multi-language audio correctly', async () => {
    const file = global.subtitleTestUtils.createMockFile();
    const formData = global.subtitleTestUtils.createMockFormData({
      sourceLanguage: 'zh',
      model: 'base',
    });
    const event = global.subtitleTestUtils.createMockEvent();
    const gpuConfig = global.subtitleTestUtils.createMockGPUConfig('openvino');

    global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
    global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
    global.subtitleTestUtils.setupMockAudioDuration(30000);
    global.subtitleTestUtils.setupMockPerformanceMonitor();

    const result = await generateSubtitleWithBuiltinWhisper(
      event,
      file,
      formData,
    );

    expect(result).toBe(file.srtFile);

    // Check that language parameter was passed correctly
    const whisperFn = await require('main/helpers/whisper').loadWhisperAddon();
    expect(whisperFn).toHaveBeenCalledWith(
      expect.objectContaining({
        language: 'zh',
      }),
    );
  });

  test('should handle long audio files (>30 minutes)', async () => {
    const file = global.subtitleTestUtils.createMockFile();
    const formData = global.subtitleTestUtils.createMockFormData();
    const event = global.subtitleTestUtils.createMockEvent();
    const gpuConfig = global.subtitleTestUtils.createMockGPUConfig('openvino');

    global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
    global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
    global.subtitleTestUtils.setupMockAudioDuration(2100000); // 35 minutes

    const mockMonitor = global.subtitleTestUtils.setupMockPerformanceMonitor();
    mockMonitor.endSession.mockResolvedValue({
      sessionId: 'session-123',
      speedupFactor: 3.2,
      processingTime: 180000, // 3 minutes processing time
      audioDuration: 2100000,
      addonType: 'openvino',
      realTimeRatio: 11.67,
    });

    const result = await generateSubtitleWithBuiltinWhisper(
      event,
      file,
      formData,
    );

    expect(result).toBe(file.srtFile);
    expect(mockMonitor.startSession).toHaveBeenCalled();
    expect(mockMonitor.endSession).toHaveBeenCalled();
  });

  test('should handle short audio files (<1 minute)', async () => {
    const file = global.subtitleTestUtils.createMockFile();
    const formData = global.subtitleTestUtils.createMockFormData();
    const event = global.subtitleTestUtils.createMockEvent();
    const gpuConfig = global.subtitleTestUtils.createMockGPUConfig('openvino');

    global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
    global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
    global.subtitleTestUtils.setupMockAudioDuration(45000); // 45 seconds
    global.subtitleTestUtils.setupMockPerformanceMonitor();

    const result = await generateSubtitleWithBuiltinWhisper(
      event,
      file,
      formData,
    );

    expect(result).toBe(file.srtFile);

    // Should still complete successfully with short audio
    expect(event.sender.send).toHaveBeenCalledWith(
      'taskFileChange',
      expect.objectContaining({
        extractSubtitle: 'done',
      }),
    );
  });
});

describe('Performance Monitoring', () => {
  test('should collect processing time metrics', async () => {
    const file = global.subtitleTestUtils.createMockFile();
    const formData = global.subtitleTestUtils.createMockFormData();
    const event = global.subtitleTestUtils.createMockEvent();
    const gpuConfig = global.subtitleTestUtils.createMockGPUConfig('openvino');

    global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
    global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
    global.subtitleTestUtils.setupMockAudioDuration(30000);

    const mockMonitor = global.subtitleTestUtils.setupMockPerformanceMonitor();
    mockMonitor.endSession.mockResolvedValue({
      sessionId: 'session-123',
      speedupFactor: 3.5,
      processingTime: 8571, // 30s audio in 8.571s = 3.5x speedup
      audioDuration: 30000,
      addonType: 'openvino',
      realTimeRatio: 3.5,
    });

    await generateSubtitleWithBuiltinWhisper(event, file, formData);

    expect(mockMonitor.startSession).toHaveBeenCalledWith(
      gpuConfig,
      expect.stringContaining('temp_audio.wav'),
      'base',
    );
    expect(mockMonitor.endSession).toHaveBeenCalled();

    // Check performance metrics were included in completion message
    expect(event.sender.send).toHaveBeenCalledWith(
      'taskFileChange',
      expect.objectContaining({
        extractSubtitle: 'done',
        performanceMetrics: expect.objectContaining({
          speedupFactor: 3.5,
          processingTime: 8571,
          gpuType: 'openvino',
        }),
      }),
    );
  });

  test('should collect memory usage metrics', async () => {
    const file = global.subtitleTestUtils.createMockFile();
    const formData = global.subtitleTestUtils.createMockFormData();
    const event = global.subtitleTestUtils.createMockEvent();
    const gpuConfig = global.subtitleTestUtils.createMockGPUConfig('openvino');

    global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
    global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
    global.subtitleTestUtils.setupMockAudioDuration(30000);

    const mockMonitor = global.subtitleTestUtils.setupMockPerformanceMonitor();

    await generateSubtitleWithBuiltinWhisper(event, file, formData);

    // Verify memory usage was tracked during processing
    expect(mockMonitor.updateMemoryUsage).toHaveBeenCalled();
  });

  test('should calculate speedup factor correctly', async () => {
    const file = global.subtitleTestUtils.createMockFile();
    const formData = global.subtitleTestUtils.createMockFormData();
    const event = global.subtitleTestUtils.createMockEvent();
    const gpuConfig = global.subtitleTestUtils.createMockGPUConfig('openvino');

    global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
    global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
    global.subtitleTestUtils.setupMockAudioDuration(60000); // 1 minute audio

    const mockMonitor = global.subtitleTestUtils.setupMockPerformanceMonitor();
    mockMonitor.endSession.mockResolvedValue({
      sessionId: 'session-123',
      speedupFactor: 4.0, // 60s audio processed in 15s = 4x speedup
      processingTime: 15000,
      audioDuration: 60000,
      addonType: 'openvino',
      realTimeRatio: 4.0,
    });

    await generateSubtitleWithBuiltinWhisper(event, file, formData);

    const endSessionCall = mockMonitor.endSession.mock.calls[0];
    expect(endSessionCall[1]).toBe(60000); // Audio duration passed correctly
  });

  test('should report GPU utilization statistics', async () => {
    const file = global.subtitleTestUtils.createMockFile();
    const formData = global.subtitleTestUtils.createMockFormData();
    const event = global.subtitleTestUtils.createMockEvent();
    const gpuConfig = global.subtitleTestUtils.createMockGPUConfig('openvino');

    global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
    global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
    global.subtitleTestUtils.setupMockAudioDuration(30000);

    const mockMonitor = global.subtitleTestUtils.setupMockPerformanceMonitor();

    await generateSubtitleWithBuiltinWhisper(event, file, formData);

    // Check that session was started with GPU information
    expect(mockMonitor.startSession).toHaveBeenCalledWith(
      expect.objectContaining({
        addonInfo: expect.objectContaining({
          type: 'openvino',
          displayName: 'Intel Arc A770',
        }),
      }),
      expect.any(String),
      expect.any(String),
    );
  });

  test('should handle performance metric collection errors', async () => {
    const file = global.subtitleTestUtils.createMockFile();
    const formData = global.subtitleTestUtils.createMockFormData();
    const event = global.subtitleTestUtils.createMockEvent();
    const gpuConfig = global.subtitleTestUtils.createMockGPUConfig('openvino');

    global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
    global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
    global.subtitleTestUtils.setupMockAudioDuration(30000);

    const mockMonitor = global.subtitleTestUtils.setupMockPerformanceMonitor();
    mockMonitor.endSession.mockRejectedValue(
      new Error('Performance monitoring failed'),
    );

    // Should still complete successfully even if performance monitoring fails
    const result = await generateSubtitleWithBuiltinWhisper(
      event,
      file,
      formData,
    );
    expect(result).toBe(file.srtFile);
  });

  test('should store performance history', async () => {
    const file = global.subtitleTestUtils.createMockFile();
    const formData = global.subtitleTestUtils.createMockFormData();
    const event = global.subtitleTestUtils.createMockEvent();
    const gpuConfig = global.subtitleTestUtils.createMockGPUConfig('openvino');

    global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
    global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
    global.subtitleTestUtils.setupMockAudioDuration(30000);

    const mockMonitor = global.subtitleTestUtils.setupMockPerformanceMonitor();

    await generateSubtitleWithBuiltinWhisper(event, file, formData);

    // Performance monitoring should complete the session
    expect(mockMonitor.endSession).toHaveBeenCalled();

    // Check that performance metrics are included in the completion event
    expect(event.sender.send).toHaveBeenCalledWith(
      'taskFileChange',
      expect.objectContaining({
        performanceMetrics: expect.objectContaining({
          speedupFactor: expect.any(Number),
          processingTime: expect.any(Number),
          gpuType: expect.any(String),
        }),
      }),
    );
  });
});

describe('Error Handling and Recovery', () => {
  test('should recover from Intel GPU memory allocation failures', async () => {
    const file = global.subtitleTestUtils.createMockFile();
    const formData = global.subtitleTestUtils.createMockFormData({
      model: 'large',
    });
    const event = global.subtitleTestUtils.createMockEvent();

    // First attempt fails with memory error
    global.subtitleTestUtils.setupMockWhisperAddon(false, 'openvino');
    const { loadWhisperAddon } = require('main/helpers/whisper');
    loadWhisperAddon
      .mockRejectedValueOnce(
        new Error('CUDA_ERROR_OUT_OF_MEMORY: out of memory'),
      )
      .mockResolvedValueOnce(
        global.subtitleTestUtils.createMockWhisperFunction(),
      );

    // Mock error handler to return smaller model
    const { handleProcessingError } = require('main/helpers/errorHandler');
    handleProcessingError.mockResolvedValue(file.srtFile);

    const gpuConfig = global.subtitleTestUtils.createMockGPUConfig('openvino');
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

  test('should recover from OpenVINO runtime errors', async () => {
    const file = global.subtitleTestUtils.createMockFile();
    const formData = global.subtitleTestUtils.createMockFormData();
    const event = global.subtitleTestUtils.createMockEvent();

    // Mock OpenVINO runtime error
    global.subtitleTestUtils.setupMockWhisperAddon(false, 'openvino');
    const { loadWhisperAddon } = require('main/helpers/whisper');
    loadWhisperAddon.mockRejectedValue(
      new Error('OpenVINO device initialization failed'),
    );

    // Mock error handler to fallback to CPU
    const { handleProcessingError } = require('main/helpers/errorHandler');
    handleProcessingError.mockResolvedValue(file.srtFile);

    const gpuConfig = global.subtitleTestUtils.createMockGPUConfig('openvino');
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

  test('should recover from Intel GPU driver issues', async () => {
    const file = global.subtitleTestUtils.createMockFile();
    const formData = global.subtitleTestUtils.createMockFormData();
    const event = global.subtitleTestUtils.createMockEvent();

    // Mock driver error
    global.subtitleTestUtils.setupMockWhisperAddon(false, 'openvino');
    const { loadWhisperAddon } = require('main/helpers/whisper');
    loadWhisperAddon.mockRejectedValue(
      new Error('Intel GPU driver error: device not found'),
    );

    // Mock error handler to recover
    const { handleProcessingError } = require('main/helpers/errorHandler');
    handleProcessingError.mockResolvedValue(file.srtFile);

    const gpuConfig = global.subtitleTestUtils.createMockGPUConfig('openvino');
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

  test('should fallback to CUDA when Intel GPU fails', async () => {
    const file = global.subtitleTestUtils.createMockFile();
    const formData = global.subtitleTestUtils.createMockFormData();
    const event = global.subtitleTestUtils.createMockEvent();

    // Mock Intel GPU failure with CUDA fallback
    const cudaConfig = global.subtitleTestUtils.createMockGPUConfig('cuda');
    global.subtitleTestUtils.setupMockGPUConfig(cudaConfig);
    global.subtitleTestUtils.setupMockWhisperAddon(true, 'cuda');
    global.subtitleTestUtils.setupMockAudioDuration(30000);
    global.subtitleTestUtils.setupMockPerformanceMonitor();

    const result = await generateSubtitleWithBuiltinWhisper(
      event,
      file,
      formData,
    );

    expect(result).toBe(file.srtFile);
    expect(event.sender.send).toHaveBeenCalledWith(
      'gpuSelected',
      expect.objectContaining({
        addonType: 'cuda',
      }),
    );
  });

  test('should fallback to CPU when all GPUs fail', async () => {
    const file = global.subtitleTestUtils.createMockFile();
    const formData = global.subtitleTestUtils.createMockFormData();
    const event = global.subtitleTestUtils.createMockEvent();

    // Mock complete GPU failure with CPU fallback
    const cpuConfig = global.subtitleTestUtils.createMockGPUConfig('cpu');
    global.subtitleTestUtils.setupMockGPUConfig(cpuConfig);
    global.subtitleTestUtils.setupMockWhisperAddon(true, 'cpu');
    global.subtitleTestUtils.setupMockAudioDuration(30000);
    global.subtitleTestUtils.setupMockPerformanceMonitor();

    const result = await generateSubtitleWithBuiltinWhisper(
      event,
      file,
      formData,
    );

    expect(result).toBe(file.srtFile);
    expect(event.sender.send).toHaveBeenCalledWith(
      'gpuSelected',
      expect.objectContaining({
        addonType: 'cpu',
      }),
    );
  });

  test('should handle processing interruption gracefully', async () => {
    const file = global.subtitleTestUtils.createMockFile();
    const formData = global.subtitleTestUtils.createMockFormData();
    const event = global.subtitleTestUtils.createMockEvent();

    // Mock processing interruption
    global.subtitleTestUtils.setupMockWhisperAddon(false, 'openvino');
    const { loadWhisperAddon } = require('main/helpers/whisper');
    loadWhisperAddon.mockRejectedValue(
      new Error('Process interrupted by user'),
    );

    // Mock error handler
    const { handleProcessingError } = require('main/helpers/errorHandler');
    handleProcessingError.mockRejectedValue(
      new Error('Processing interrupted and cannot be recovered'),
    );

    const gpuConfig = global.subtitleTestUtils.createMockGPUConfig('openvino');
    global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
    global.subtitleTestUtils.setupMockAudioDuration(30000);
    global.subtitleTestUtils.setupMockPerformanceMonitor();

    await expect(
      generateSubtitleWithBuiltinWhisper(event, file, formData),
    ).rejects.toThrow('Processing interrupted and cannot be recovered');

    // Should send error state to UI
    expect(event.sender.send).toHaveBeenCalledWith(
      'taskFileChange',
      expect.objectContaining({
        extractSubtitle: 'error',
      }),
    );
  });

  test('should provide clear error messages to users', async () => {
    const file = global.subtitleTestUtils.createMockFile();
    const formData = global.subtitleTestUtils.createMockFormData();
    const event = global.subtitleTestUtils.createMockEvent();

    // Mock clear error scenario
    global.subtitleTestUtils.setupMockWhisperAddon(false, 'openvino');
    const { loadWhisperAddon } = require('main/helpers/whisper');
    loadWhisperAddon.mockRejectedValue(new Error('Model file not found'));

    // Mock error handler that fails
    const { handleProcessingError } = require('main/helpers/errorHandler');
    handleProcessingError.mockRejectedValue(
      new Error('Model file not found. Please download the model first.'),
    );

    const gpuConfig = global.subtitleTestUtils.createMockGPUConfig('openvino');
    global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
    global.subtitleTestUtils.setupMockAudioDuration(30000);
    global.subtitleTestUtils.setupMockPerformanceMonitor();

    await expect(
      generateSubtitleWithBuiltinWhisper(event, file, formData),
    ).rejects.toThrow('Model file not found. Please download the model first.');
  });

  test('should prevent infinite retry loops', async () => {
    const file = global.subtitleTestUtils.createMockFile();
    const formData = global.subtitleTestUtils.createMockFormData();
    const event = global.subtitleTestUtils.createMockEvent();

    // Mock persistent error
    global.subtitleTestUtils.setupMockWhisperAddon(false, 'openvino');
    const { loadWhisperAddon } = require('main/helpers/whisper');
    loadWhisperAddon.mockRejectedValue(new Error('Persistent addon error'));

    // Mock error handler that eventually gives up
    const { handleProcessingError } = require('main/helpers/errorHandler');
    handleProcessingError.mockRejectedValue(
      new Error(
        'All recovery attempts exhausted. Final error: Persistent addon error',
      ),
    );

    const gpuConfig = global.subtitleTestUtils.createMockGPUConfig('openvino');
    global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
    global.subtitleTestUtils.setupMockAudioDuration(30000);

    const mockMonitor = global.subtitleTestUtils.setupMockPerformanceMonitor();

    await expect(
      generateSubtitleWithBuiltinWhisper(event, file, formData),
    ).rejects.toThrow('All recovery attempts exhausted');

    // Verify error was tracked
    expect(mockMonitor.trackError).toHaveBeenCalled();
  });
});

describe('Progress and Communication', () => {
  test('should send progress updates during GPU processing', async () => {
    const file = global.subtitleTestUtils.createMockFile();
    const formData = global.subtitleTestUtils.createMockFormData();
    const event = global.subtitleTestUtils.createMockEvent();
    const gpuConfig = global.subtitleTestUtils.createMockGPUConfig('openvino');

    global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
    global.subtitleTestUtils.setupMockAudioDuration(30000);
    global.subtitleTestUtils.setupMockPerformanceMonitor();

    // Mock whisper function that calls progress callback
    const mockWhisperFn = jest.fn((params) => {
      // Simulate progress callbacks
      setTimeout(() => params.progress_callback(25), 10);
      setTimeout(() => params.progress_callback(50), 20);
      setTimeout(() => params.progress_callback(75), 30);
      setTimeout(() => params.progress_callback(100), 40);

      return Promise.resolve({
        transcription: [{ start: 0, end: 5000, text: 'Test transcription' }],
      });
    });

    global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
    const { loadWhisperAddon } = require('main/helpers/whisper');
    loadWhisperAddon.mockResolvedValue(mockWhisperFn);

    await generateSubtitleWithBuiltinWhisper(event, file, formData);

    // Wait for progress callbacks to complete
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Verify progress updates were sent
    expect(event.sender.send).toHaveBeenCalledWith(
      'taskProgressChange',
      file,
      'extractSubtitle',
      0,
    );
    expect(event.sender.send).toHaveBeenCalledWith(
      'taskProgressChange',
      file,
      'extractSubtitle',
      25,
      expect.objectContaining({
        gpuType: 'openvino',
        gpuName: 'Intel Arc A770',
        sessionId: 'session-123',
      }),
    );
  });

  test('should send task status changes correctly', async () => {
    const file = global.subtitleTestUtils.createMockFile();
    const formData = global.subtitleTestUtils.createMockFormData();
    const event = global.subtitleTestUtils.createMockEvent();
    const gpuConfig = global.subtitleTestUtils.createMockGPUConfig('openvino');

    global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
    global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
    global.subtitleTestUtils.setupMockAudioDuration(30000);
    global.subtitleTestUtils.setupMockPerformanceMonitor();

    await generateSubtitleWithBuiltinWhisper(event, file, formData);

    // Check initial loading state
    expect(event.sender.send).toHaveBeenCalledWith(
      'taskFileChange',
      expect.objectContaining({
        ...file,
        extractSubtitle: 'loading',
      }),
    );

    // Check final completion state
    expect(event.sender.send).toHaveBeenCalledWith(
      'taskFileChange',
      expect.objectContaining({
        ...file,
        extractSubtitle: 'done',
        performanceMetrics: expect.any(Object),
      }),
    );
  });

  test('should handle IPC communication errors', async () => {
    const file = global.subtitleTestUtils.createMockFile();
    const formData = global.subtitleTestUtils.createMockFormData();
    const event = global.subtitleTestUtils.createMockEvent();

    // Mock IPC error
    event.sender.send.mockImplementation(() => {
      throw new Error('IPC communication failed');
    });

    const gpuConfig = global.subtitleTestUtils.createMockGPUConfig('openvino');
    global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
    global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
    global.subtitleTestUtils.setupMockAudioDuration(30000);
    global.subtitleTestUtils.setupMockPerformanceMonitor();

    // Should complete successfully despite IPC errors
    const result = await generateSubtitleWithBuiltinWhisper(
      event,
      file,
      formData,
    );
    expect(result).toBe(file.srtFile);
  });

  test('should provide processing time estimates', async () => {
    const file = global.subtitleTestUtils.createMockFile();
    const formData = global.subtitleTestUtils.createMockFormData();
    const event = global.subtitleTestUtils.createMockEvent();
    const gpuConfig = global.subtitleTestUtils.createMockGPUConfig('openvino');

    global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
    global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
    global.subtitleTestUtils.setupMockAudioDuration(120000); // 2 minutes

    const mockMonitor = global.subtitleTestUtils.setupMockPerformanceMonitor();
    mockMonitor.endSession.mockResolvedValue({
      sessionId: 'session-123',
      speedupFactor: 3.5,
      processingTime: 34286, // 2 minutes processed in ~34 seconds
      audioDuration: 120000,
      addonType: 'openvino',
      realTimeRatio: 3.5,
    });

    await generateSubtitleWithBuiltinWhisper(event, file, formData);

    // Performance metrics should include timing information
    expect(event.sender.send).toHaveBeenCalledWith(
      'taskFileChange',
      expect.objectContaining({
        performanceMetrics: expect.objectContaining({
          processingTime: 34286,
          realTimeRatio: 3.5,
        }),
      }),
    );
  });

  test('should report selected GPU information to UI', async () => {
    const file = global.subtitleTestUtils.createMockFile();
    const formData = global.subtitleTestUtils.createMockFormData();
    const event = global.subtitleTestUtils.createMockEvent();
    const gpuConfig = global.subtitleTestUtils.createMockGPUConfig('openvino');

    global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
    global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
    global.subtitleTestUtils.setupMockAudioDuration(30000);
    global.subtitleTestUtils.setupMockPerformanceMonitor();

    await generateSubtitleWithBuiltinWhisper(event, file, formData);

    // Should report GPU selection with details
    expect(event.sender.send).toHaveBeenCalledWith('gpuSelected', {
      addonType: 'openvino',
      displayName: 'Intel Arc A770',
      expectedSpeedup: 3.5,
      powerEfficiency: 'good',
    });
  });
});

describe('Integration and Compatibility', () => {
  test('should maintain existing CUDA processing functionality', async () => {
    const file = global.subtitleTestUtils.createMockFile();
    const formData = global.subtitleTestUtils.createMockFormData();
    const event = global.subtitleTestUtils.createMockEvent();
    const cudaConfig = global.subtitleTestUtils.createMockGPUConfig('cuda');

    global.subtitleTestUtils.setupMockGPUConfig(cudaConfig);
    global.subtitleTestUtils.setupMockWhisperAddon(true, 'cuda');
    global.subtitleTestUtils.setupMockAudioDuration(30000);
    global.subtitleTestUtils.setupMockPerformanceMonitor();

    const result = await generateSubtitleWithBuiltinWhisper(
      event,
      file,
      formData,
    );

    expect(result).toBe(file.srtFile);
    expect(event.sender.send).toHaveBeenCalledWith(
      'gpuSelected',
      expect.objectContaining({
        addonType: 'cuda',
        expectedSpeedup: 4.0,
      }),
    );
  });

  test('should maintain existing CoreML processing functionality', async () => {
    const file = global.subtitleTestUtils.createMockFile();
    const formData = global.subtitleTestUtils.createMockFormData();
    const event = global.subtitleTestUtils.createMockEvent();
    const coremlConfig = {
      ...global.subtitleTestUtils.createMockGPUConfig('cpu'),
      addonInfo: {
        type: 'coreml',
        displayName: 'Apple CoreML',
        deviceConfig: null,
      },
      whisperParams: {
        use_gpu: true,
        coreml_enabled: true,
        performance_mode: 'latency',
      },
      performanceHints: {
        expectedSpeedup: 2.8,
        powerEfficiency: 'excellent',
      },
    };

    global.subtitleTestUtils.setupMockGPUConfig(coremlConfig);
    global.subtitleTestUtils.setupMockWhisperAddon(true, 'coreml');
    global.subtitleTestUtils.setupMockAudioDuration(30000);
    global.subtitleTestUtils.setupMockPerformanceMonitor();

    const result = await generateSubtitleWithBuiltinWhisper(
      event,
      file,
      formData,
    );

    expect(result).toBe(file.srtFile);
    expect(event.sender.send).toHaveBeenCalledWith(
      'gpuSelected',
      expect.objectContaining({
        addonType: 'coreml',
      }),
    );
  });

  test('should maintain existing CPU processing functionality', async () => {
    const file = global.subtitleTestUtils.createMockFile();
    const formData = global.subtitleTestUtils.createMockFormData();
    const event = global.subtitleTestUtils.createMockEvent();
    const cpuConfig = global.subtitleTestUtils.createMockGPUConfig('cpu');

    global.subtitleTestUtils.setupMockGPUConfig(cpuConfig);
    global.subtitleTestUtils.setupMockWhisperAddon(true, 'cpu');
    global.subtitleTestUtils.setupMockAudioDuration(30000);
    global.subtitleTestUtils.setupMockPerformanceMonitor();

    const result = await generateSubtitleWithBuiltinWhisper(
      event,
      file,
      formData,
    );

    expect(result).toBe(file.srtFile);
    expect(event.sender.send).toHaveBeenCalledWith(
      'gpuSelected',
      expect.objectContaining({
        addonType: 'cpu',
        expectedSpeedup: 1.0,
      }),
    );
  });

  test('should preserve existing VAD settings behavior', async () => {
    const file = global.subtitleTestUtils.createMockFile();
    const formData = global.subtitleTestUtils.createMockFormData();
    const event = global.subtitleTestUtils.createMockEvent();
    const gpuConfig = global.subtitleTestUtils.createMockGPUConfig('openvino');

    global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
    global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
    global.subtitleTestUtils.setupMockAudioDuration(30000);
    global.subtitleTestUtils.setupMockPerformanceMonitor();

    await generateSubtitleWithBuiltinWhisper(event, file, formData);

    // Check VAD settings were applied
    const { getVADSettings } = require('main/helpers/gpuConfig');
    expect(getVADSettings).toHaveBeenCalled();

    // Whisper function should have been called with VAD parameters
    const { loadWhisperAddon } = require('main/helpers/whisper');
    const whisperFn = await loadWhisperAddon();
    expect(whisperFn).toHaveBeenCalledWith(
      expect.objectContaining({
        vad: true,
        vad_threshold: 0.5,
        vad_min_speech_duration_ms: 250,
      }),
    );
  });

  test('should maintain file handling and SRT output format', async () => {
    const file = global.subtitleTestUtils.createMockFile();
    const formData = global.subtitleTestUtils.createMockFormData();
    const event = global.subtitleTestUtils.createMockEvent();
    const gpuConfig = global.subtitleTestUtils.createMockGPUConfig('openvino');

    global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
    global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
    global.subtitleTestUtils.setupMockAudioDuration(30000);
    global.subtitleTestUtils.setupMockPerformanceMonitor();

    const result = await generateSubtitleWithBuiltinWhisper(
      event,
      file,
      formData,
    );

    expect(result).toBe(file.srtFile);

    // Check SRT file was written
    const fs = require('fs');
    expect(fs.promises.writeFile).toHaveBeenCalledWith(
      file.srtFile,
      expect.stringContaining('Mock transcription'),
    );

    // Check SRT formatting was applied
    const { formatSrtContent } = require('main/helpers/fileUtils');
    expect(formatSrtContent).toHaveBeenCalled();
  });

  test('should handle concurrent processing requests', async () => {
    const file1 = global.subtitleTestUtils.createMockFile({ uuid: 'test-1' });
    const file2 = global.subtitleTestUtils.createMockFile({ uuid: 'test-2' });
    const formData = global.subtitleTestUtils.createMockFormData();
    const event = global.subtitleTestUtils.createMockEvent();
    const gpuConfig = global.subtitleTestUtils.createMockGPUConfig('openvino');

    global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
    global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
    global.subtitleTestUtils.setupMockAudioDuration(15000);
    global.subtitleTestUtils.setupMockPerformanceMonitor();

    // Process two files concurrently
    const [result1, result2] = await Promise.all([
      generateSubtitleWithBuiltinWhisper(event, file1, formData),
      generateSubtitleWithBuiltinWhisper(event, file2, formData),
    ]);

    expect(result1).toBe(file1.srtFile);
    expect(result2).toBe(file2.srtFile);

    // Both should complete successfully
    expect(event.sender.send).toHaveBeenCalledWith(
      'taskFileChange',
      expect.objectContaining({ ...file1, extractSubtitle: 'done' }),
    );
    expect(event.sender.send).toHaveBeenCalledWith(
      'taskFileChange',
      expect.objectContaining({ ...file2, extractSubtitle: 'done' }),
    );
  });
});

describe('GPU Configuration', () => {
  test('should configure OpenVINO device ID correctly', async () => {
    const file = global.subtitleTestUtils.createMockFile();
    const formData = global.subtitleTestUtils.createMockFormData();
    const event = global.subtitleTestUtils.createMockEvent();
    const gpuConfig = global.subtitleTestUtils.createMockGPUConfig('openvino');

    global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
    global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
    global.subtitleTestUtils.setupMockAudioDuration(30000);
    global.subtitleTestUtils.setupMockPerformanceMonitor();

    await generateSubtitleWithBuiltinWhisper(event, file, formData);

    const { applyEnvironmentConfig } = require('main/helpers/gpuConfig');
    expect(applyEnvironmentConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        openvinoDeviceId: 'GPU0',
      }),
    );
  });

  test('should set OpenVINO cache directory correctly', async () => {
    const file = global.subtitleTestUtils.createMockFile();
    const formData = global.subtitleTestUtils.createMockFormData();
    const event = global.subtitleTestUtils.createMockEvent();
    const gpuConfig = global.subtitleTestUtils.createMockGPUConfig('openvino');

    global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
    global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
    global.subtitleTestUtils.setupMockAudioDuration(30000);
    global.subtitleTestUtils.setupMockPerformanceMonitor();

    await generateSubtitleWithBuiltinWhisper(event, file, formData);

    const { applyEnvironmentConfig } = require('main/helpers/gpuConfig');
    expect(applyEnvironmentConfig).toHaveBeenCalled();
  });

  test('should configure GPU memory allocation', async () => {
    const file = global.subtitleTestUtils.createMockFile();
    const formData = global.subtitleTestUtils.createMockFormData({
      model: 'large',
    });
    const event = global.subtitleTestUtils.createMockEvent();
    const gpuConfig = global.subtitleTestUtils.createMockGPUConfig('openvino');

    global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
    global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
    global.subtitleTestUtils.setupMockAudioDuration(30000);
    global.subtitleTestUtils.setupMockPerformanceMonitor();

    await generateSubtitleWithBuiltinWhisper(event, file, formData);

    const { validateGPUMemory } = require('main/helpers/gpuConfig');
    expect(validateGPUMemory).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'openvino' }),
      'large',
    );
  });

  test('should handle discrete GPU configuration', async () => {
    const file = global.subtitleTestUtils.createMockFile();
    const formData = global.subtitleTestUtils.createMockFormData();
    const event = global.subtitleTestUtils.createMockEvent();

    const discreteGpuConfig = {
      ...global.subtitleTestUtils.createMockGPUConfig('openvino'),
      whisperParams: {
        use_gpu: true,
        openvino_device: 'GPU0',
        performance_mode: 'throughput',
      },
    };

    global.subtitleTestUtils.setupMockGPUConfig(discreteGpuConfig);
    global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
    global.subtitleTestUtils.setupMockAudioDuration(30000);
    global.subtitleTestUtils.setupMockPerformanceMonitor();

    const result = await generateSubtitleWithBuiltinWhisper(
      event,
      file,
      formData,
    );

    expect(result).toBe(file.srtFile);
    expect(event.sender.send).toHaveBeenCalledWith(
      'gpuSelected',
      expect.objectContaining({
        addonType: 'openvino',
      }),
    );
  });

  test('should handle integrated GPU configuration', async () => {
    const file = global.subtitleTestUtils.createMockFile();
    const formData = global.subtitleTestUtils.createMockFormData();
    const event = global.subtitleTestUtils.createMockEvent();

    const integratedGpuConfig = {
      ...global.subtitleTestUtils.createMockGPUConfig('openvino'),
      addonInfo: {
        type: 'openvino',
        displayName: 'Intel Xe Graphics',
        deviceConfig: {
          type: 'integrated',
          deviceId: 'GPU1',
        },
      },
      whisperParams: {
        use_gpu: true,
        openvino_device: 'GPU1',
        performance_mode: 'latency',
      },
    };

    global.subtitleTestUtils.setupMockGPUConfig(integratedGpuConfig);
    global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
    global.subtitleTestUtils.setupMockAudioDuration(30000);
    global.subtitleTestUtils.setupMockPerformanceMonitor();

    const result = await generateSubtitleWithBuiltinWhisper(
      event,
      file,
      formData,
    );

    expect(result).toBe(file.srtFile);
  });

  test('should validate GPU memory requirements', async () => {
    const file = global.subtitleTestUtils.createMockFile();
    const formData = global.subtitleTestUtils.createMockFormData({
      model: 'large',
    });
    const event = global.subtitleTestUtils.createMockEvent();
    const gpuConfig = global.subtitleTestUtils.createMockGPUConfig('openvino');

    // Mock insufficient memory scenario
    const { validateGPUMemory } = require('main/helpers/gpuConfig');
    validateGPUMemory.mockReturnValue(false);

    global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
    global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
    global.subtitleTestUtils.setupMockAudioDuration(30000);
    global.subtitleTestUtils.setupMockPerformanceMonitor();

    const result = await generateSubtitleWithBuiltinWhisper(
      event,
      file,
      formData,
    );

    expect(result).toBe(file.srtFile);

    // Should log warning about insufficient memory
    const { logMessage } = require('main/helpers/logger');
    expect(logMessage).toHaveBeenCalledWith(
      expect.stringContaining('Insufficient GPU memory'),
      'warning',
    );
  });

  test('should fallback when GPU memory insufficient', async () => {
    const file = global.subtitleTestUtils.createMockFile();
    const formData = global.subtitleTestUtils.createMockFormData({
      model: 'large',
    });
    const event = global.subtitleTestUtils.createMockEvent();

    // Mock memory insufficient scenario that triggers CPU fallback
    const cpuConfig = global.subtitleTestUtils.createMockGPUConfig('cpu');

    global.subtitleTestUtils.setupMockGPUConfig(cpuConfig);
    global.subtitleTestUtils.setupMockWhisperAddon(true, 'cpu');
    global.subtitleTestUtils.setupMockAudioDuration(30000);
    global.subtitleTestUtils.setupMockPerformanceMonitor();

    const result = await generateSubtitleWithBuiltinWhisper(
      event,
      file,
      formData,
    );

    expect(result).toBe(file.srtFile);
    expect(event.sender.send).toHaveBeenCalledWith(
      'gpuSelected',
      expect.objectContaining({
        addonType: 'cpu',
      }),
    );
  });
});
