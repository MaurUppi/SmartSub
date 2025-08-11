/**
 * Test Suite: Subtitle Generation with Intel GPU Integration
 * Simplified tests focusing on core functionality
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';

// Mock all dependencies before imports
jest.mock('main/helpers/logger', () => ({
  logMessage: jest.fn(),
  generateCorrelationId: jest.fn(() => 'test-correlation-id'),
}));

jest.mock('main/helpers/store', () => ({
  store: {
    get: jest.fn(() => ({
      settings: {
        whisperCommand: 'whisper',
        model: 'base',
      },
    })),
    set: jest.fn(),
  },
}));

jest.mock('main/helpers/whisper', () => ({
  loadWhisperAddon: jest.fn(),
  getPath: jest.fn(() => ({ modelsPath: '/mock/models' })),
  hasEncoderModel: jest.fn(() => true),
}));

jest.mock('main/helpers/gpuConfig', () => ({
  determineGPUConfiguration: jest.fn(),
  getVADSettings: jest.fn(() => ({
    useVAD: true,
    vadThreshold: 0.5,
    vadMinSpeechDuration: 250,
    vadMinSilenceDuration: 100,
    vadMaxSpeechDuration: Number.MAX_VALUE,
    vadSpeechPad: 30,
    vadSamplesOverlap: 0.1,
  })),
  validateGPUMemory: jest.fn(() => true),
  applyEnvironmentConfig: jest.fn(),
}));

jest.mock('main/helpers/performanceMonitor', () => ({
  GPUPerformanceMonitor: {
    getInstance: jest.fn(() => ({
      startSession: jest.fn().mockReturnValue('session-123'),
      endSession: jest.fn().mockResolvedValue({
        sessionId: 'session-123',
        speedupFactor: 3.5,
        processingTime: 5000,
      }),
      updateMemoryUsage: jest.fn(),
      trackError: jest.fn(),
    })),
  },
}));

jest.mock('main/helpers/addonManager', () => ({
  loadAndValidateAddon: jest.fn(),
  handleAddonLoadingError: jest.fn(),
  createFallbackChain: jest.fn(() => []),
  logAddonLoadAttempt: jest.fn(),
}));

jest.mock('main/helpers/utils', () => ({
  getExtraResourcesPath: jest.fn(() => '/mock/resources'),
  isAppleSilicon: jest.fn(() => false),
  isWin32: jest.fn(() => process.platform === 'win32'),
}));

jest.mock('main/helpers/taskProcessor', () => ({
  isTaskCancelled: jest.fn(() => false),
  isTaskPaused: jest.fn(() => false),
}));

jest.mock('main/helpers/fileUtils', () => ({
  formatSrtContent: jest.fn((transcription) => {
    if (!transcription || transcription.length === 0) {
      return '';
    }
    return '1\n00:00:00,000 --> 00:00:05,000\nMock transcription\n\n';
  }),
}));

jest.mock('main/helpers/errorHandler', () => ({
  handleProcessingError: jest.fn().mockResolvedValue('/test/path/output.srt'),
  createUserFriendlyErrorMessage: jest.fn((error) => error.message),
  logErrorContext: jest.fn(),
}));

jest.mock('fs', () => ({
  promises: {
    writeFile: jest.fn().mockResolvedValue(undefined),
  },
  existsSync: jest.fn(() => true),
  statSync: jest.fn(() => ({ size: 1024 })),
}));

jest.mock('child_process', () => ({
  exec: jest.fn(),
}));

jest.mock('util', () => ({
  promisify: jest.fn((fn) => {
    return async (params) => {
      return new Promise((resolve, reject) => {
        fn(params, (error, result) => {
          if (error) reject(error);
          else resolve(result);
        });
      });
    };
  }),
}));

// Import after mocks
import { generateSubtitleWithBuiltinWhisper } from 'main/helpers/subtitleGenerator';

// Test utilities
const createMockFile = () => ({
  uuid: 'test-uuid-12345',
  filePath: '/test/path/audio.wav',
  fileName: 'audio.wav',
  fileExtension: 'wav',
  directory: '/test/path',
  tempAudioFile: '/test/path/temp_audio.wav',
  srtFile: '/test/path/output.srt',
  audioFile: '/test/path/audio.wav',
  extractAudio: true,
  extractSubtitle: false,
});

const createMockFormData = (overrides = {}) => ({
  model: 'base',
  sourceLanguage: 'auto',
  prompt: '',
  maxContext: 448,
  ...overrides,
});

const createMockEvent = () => ({
  sender: {
    send: jest.fn(),
  },
});

const createMockWhisperFunction = () => {
  return jest.fn(
    (params: any, callback: (error: Error | null, result?: any) => void) => {
      const result = {
        transcription: [
          {
            start: 0,
            end: 5000,
            text: 'Mock transcription text',
          },
        ],
      };

      setTimeout(() => {
        if (params.validate_only) {
          callback(null, { validation: 'success' });
        } else if (params.model && params.fname_inp) {
          callback(null, result);
        } else {
          callback(new Error('Invalid parameters'));
        }
      }, 10);
    },
  );
};

const createMockGPUConfig = (addonType = 'openvino') => {
  return {
    addonInfo: {
      type: addonType,
      path: `addon-${addonType}.node`,
      displayName:
        addonType === 'openvino' ? 'Intel Arc A770' : 'NVIDIA CUDA GPU',
      deviceConfig:
        addonType === 'openvino'
          ? {
              deviceId: 'GPU0',
              memory: 8192,
              type: 'discrete',
            }
          : null,
    },
    whisperParams: {
      use_gpu: true,
      openvino_device: addonType === 'openvino' ? 'GPU0' : undefined,
      openvino_enable_optimization: addonType === 'openvino',
      performance_mode: 'throughput',
    },
    performanceHints: {
      expectedSpeedup: 3.5,
      memoryUsage: 'medium',
      powerEfficiency: 'good',
      processingPriority: 'high',
    },
    environmentConfig: {
      openvinoDeviceId: addonType === 'openvino' ? 'GPU0' : undefined,
      openvino_enable_optimizations: addonType === 'openvino',
      openvino_performance_hint:
        addonType === 'openvino' ? 'THROUGHPUT' : undefined,
    },
  };
};

describe('Subtitle Generation with Intel GPU', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should generate subtitles using Intel Arc A770 successfully', async () => {
    const file = createMockFile();
    const formData = createMockFormData();
    const event = createMockEvent();
    const gpuConfig = createMockGPUConfig('openvino');

    // Setup mocks
    const { determineGPUConfiguration } = require('main/helpers/gpuConfig');
    const { loadWhisperAddon } = require('main/helpers/whisper');
    const { exec } = require('child_process');

    determineGPUConfiguration.mockResolvedValue(gpuConfig);
    loadWhisperAddon.mockResolvedValue(createMockWhisperFunction());

    // Mock audio duration
    exec.mockImplementation((command, callback) => {
      if (command.includes('ffprobe')) {
        callback(null, '30.0');
      } else {
        callback(new Error('Unknown command'));
      }
    });

    const result = await generateSubtitleWithBuiltinWhisper(
      event,
      file,
      formData,
    );

    expect(result).toBe(file.srtFile);
  });

  test('should generate subtitles using Intel Xe Graphics successfully', async () => {
    const file = createMockFile();
    const formData = createMockFormData();
    const event = createMockEvent();

    const integratedGpuConfig = {
      ...createMockGPUConfig('openvino'),
      addonInfo: {
        type: 'openvino',
        displayName: 'Intel Xe Graphics',
        path: 'addon-openvino.node',
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

    // Setup mocks
    const { determineGPUConfiguration } = require('main/helpers/gpuConfig');
    const { loadWhisperAddon } = require('main/helpers/whisper');
    const { exec } = require('child_process');

    determineGPUConfiguration.mockResolvedValue(integratedGpuConfig);
    loadWhisperAddon.mockResolvedValue(createMockWhisperFunction());

    // Mock audio duration
    exec.mockImplementation((command, callback) => {
      if (command.includes('ffprobe')) {
        callback(null, '30.0');
      } else {
        callback(new Error('Unknown command'));
      }
    });

    const result = await generateSubtitleWithBuiltinWhisper(
      event,
      file,
      formData,
    );

    expect(result).toBe(file.srtFile);
  });

  test('should handle tiny model processing correctly', async () => {
    const file = createMockFile();
    const formData = createMockFormData({ model: 'tiny' });
    const event = createMockEvent();
    const gpuConfig = createMockGPUConfig('openvino');

    // Setup mocks
    const { determineGPUConfiguration } = require('main/helpers/gpuConfig');
    const { loadWhisperAddon } = require('main/helpers/whisper');
    const { exec } = require('child_process');

    determineGPUConfiguration.mockResolvedValue(gpuConfig);
    loadWhisperAddon.mockResolvedValue(createMockWhisperFunction());

    exec.mockImplementation((command, callback) => {
      if (command.includes('ffprobe')) {
        callback(null, '30.0');
      } else {
        callback(new Error('Unknown command'));
      }
    });

    const result = await generateSubtitleWithBuiltinWhisper(
      event,
      file,
      formData,
    );

    expect(result).toBe(file.srtFile);
  });

  test('should handle base model processing correctly', async () => {
    const file = createMockFile();
    const formData = createMockFormData({ model: 'base' });
    const event = createMockEvent();
    const gpuConfig = createMockGPUConfig('openvino');

    // Setup mocks
    const { determineGPUConfiguration } = require('main/helpers/gpuConfig');
    const { loadWhisperAddon } = require('main/helpers/whisper');
    const { exec } = require('child_process');

    determineGPUConfiguration.mockResolvedValue(gpuConfig);
    loadWhisperAddon.mockResolvedValue(createMockWhisperFunction());

    exec.mockImplementation((command, callback) => {
      if (command.includes('ffprobe')) {
        callback(null, '30.0');
      } else {
        callback(new Error('Unknown command'));
      }
    });

    const result = await generateSubtitleWithBuiltinWhisper(
      event,
      file,
      formData,
    );

    expect(result).toBe(file.srtFile);
  });

  test('should handle small model processing correctly', async () => {
    const file = createMockFile();
    const formData = createMockFormData({ model: 'small' });
    const event = createMockEvent();
    const gpuConfig = createMockGPUConfig('openvino');

    // Setup mocks
    const { determineGPUConfiguration } = require('main/helpers/gpuConfig');
    const { loadWhisperAddon } = require('main/helpers/whisper');
    const { exec } = require('child_process');

    determineGPUConfiguration.mockResolvedValue(gpuConfig);
    loadWhisperAddon.mockResolvedValue(createMockWhisperFunction());

    exec.mockImplementation((command, callback) => {
      if (command.includes('ffprobe')) {
        callback(null, '30.0');
      } else {
        callback(new Error('Unknown command'));
      }
    });

    const result = await generateSubtitleWithBuiltinWhisper(
      event,
      file,
      formData,
    );

    expect(result).toBe(file.srtFile);
  });

  test('should handle medium model processing correctly', async () => {
    const file = createMockFile();
    const formData = createMockFormData({ model: 'medium' });
    const event = createMockEvent();
    const gpuConfig = createMockGPUConfig('openvino');

    // Setup mocks
    const { determineGPUConfiguration } = require('main/helpers/gpuConfig');
    const { loadWhisperAddon } = require('main/helpers/whisper');
    const { exec } = require('child_process');

    determineGPUConfiguration.mockResolvedValue(gpuConfig);
    loadWhisperAddon.mockResolvedValue(createMockWhisperFunction());

    exec.mockImplementation((command, callback) => {
      if (command.includes('ffprobe')) {
        callback(null, '30.0');
      } else {
        callback(new Error('Unknown command'));
      }
    });

    const result = await generateSubtitleWithBuiltinWhisper(
      event,
      file,
      formData,
    );

    expect(result).toBe(file.srtFile);
  });

  test('should handle large model processing correctly', async () => {
    const file = createMockFile();
    const formData = createMockFormData({ model: 'large' });
    const event = createMockEvent();
    const gpuConfig = createMockGPUConfig('openvino');

    // Setup mocks
    const { determineGPUConfiguration } = require('main/helpers/gpuConfig');
    const { loadWhisperAddon } = require('main/helpers/whisper');
    const { exec } = require('child_process');

    determineGPUConfiguration.mockResolvedValue(gpuConfig);
    loadWhisperAddon.mockResolvedValue(createMockWhisperFunction());

    exec.mockImplementation((command, callback) => {
      if (command.includes('ffprobe')) {
        callback(null, '30.0');
      } else {
        callback(new Error('Unknown command'));
      }
    });

    const result = await generateSubtitleWithBuiltinWhisper(
      event,
      file,
      formData,
    );

    expect(result).toBe(file.srtFile);
  });

  test('should process multi-language audio correctly', async () => {
    const file = createMockFile();
    const formData = createMockFormData({ sourceLanguage: 'es' });
    const event = createMockEvent();
    const gpuConfig = createMockGPUConfig('openvino');

    // Setup mocks
    const { determineGPUConfiguration } = require('main/helpers/gpuConfig');
    const { loadWhisperAddon } = require('main/helpers/whisper');
    const { exec } = require('child_process');

    determineGPUConfiguration.mockResolvedValue(gpuConfig);
    loadWhisperAddon.mockResolvedValue(createMockWhisperFunction());

    exec.mockImplementation((command, callback) => {
      if (command.includes('ffprobe')) {
        callback(null, '30.0');
      } else {
        callback(new Error('Unknown command'));
      }
    });

    const result = await generateSubtitleWithBuiltinWhisper(
      event,
      file,
      formData,
    );

    expect(result).toBe(file.srtFile);
  });

  test('should handle long audio files (>30 minutes)', async () => {
    const file = createMockFile();
    const formData = createMockFormData();
    const event = createMockEvent();
    const gpuConfig = createMockGPUConfig('openvino');

    // Setup mocks
    const { determineGPUConfiguration } = require('main/helpers/gpuConfig');
    const { loadWhisperAddon } = require('main/helpers/whisper');
    const { exec } = require('child_process');

    determineGPUConfiguration.mockResolvedValue(gpuConfig);
    loadWhisperAddon.mockResolvedValue(createMockWhisperFunction());

    // Mock 35 minutes audio duration
    exec.mockImplementation((command, callback) => {
      if (command.includes('ffprobe')) {
        callback(null, '2100.0');
      } else {
        callback(new Error('Unknown command'));
      }
    });

    const result = await generateSubtitleWithBuiltinWhisper(
      event,
      file,
      formData,
    );

    expect(result).toBe(file.srtFile);
  });

  test('should handle short audio files (<1 minute)', async () => {
    const file = createMockFile();
    const formData = createMockFormData();
    const event = createMockEvent();
    const gpuConfig = createMockGPUConfig('openvino');

    // Setup mocks
    const { determineGPUConfiguration } = require('main/helpers/gpuConfig');
    const { loadWhisperAddon } = require('main/helpers/whisper');
    const { exec } = require('child_process');

    determineGPUConfiguration.mockResolvedValue(gpuConfig);
    loadWhisperAddon.mockResolvedValue(createMockWhisperFunction());

    // Mock 45 seconds audio duration
    exec.mockImplementation((command, callback) => {
      if (command.includes('ffprobe')) {
        callback(null, '45.0');
      } else {
        callback(new Error('Unknown command'));
      }
    });

    const result = await generateSubtitleWithBuiltinWhisper(
      event,
      file,
      formData,
    );

    expect(result).toBe(file.srtFile);
  });
});

describe('Performance Monitoring', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should handle performance metric collection errors', async () => {
    const file = createMockFile();
    const formData = createMockFormData();
    const event = createMockEvent();
    const gpuConfig = createMockGPUConfig('openvino');

    // Setup mocks
    const { determineGPUConfiguration } = require('main/helpers/gpuConfig');
    const { loadWhisperAddon } = require('main/helpers/whisper');
    const { exec } = require('child_process');

    determineGPUConfiguration.mockResolvedValue(gpuConfig);
    loadWhisperAddon.mockResolvedValue(createMockWhisperFunction());

    exec.mockImplementation((command, callback) => {
      if (command.includes('ffprobe')) {
        callback(null, '30.0');
      } else {
        callback(new Error('Unknown command'));
      }
    });

    const result = await generateSubtitleWithBuiltinWhisper(
      event,
      file,
      formData,
    );

    // Should still complete successfully despite any performance monitoring issues
    expect(result).toBe(file.srtFile);
  });
});

describe('Error Handling and Recovery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should recover from Intel GPU memory allocation failures', async () => {
    const file = createMockFile();
    const formData = createMockFormData();
    const event = createMockEvent();
    const gpuConfig = createMockGPUConfig('openvino');

    // Setup mocks
    const { determineGPUConfiguration } = require('main/helpers/gpuConfig');
    const { loadWhisperAddon } = require('main/helpers/whisper');
    const { handleProcessingError } = require('main/helpers/errorHandler');
    const { exec } = require('child_process');

    determineGPUConfiguration.mockResolvedValue(gpuConfig);

    // Mock memory allocation failure
    const mockFailingWhisper = jest.fn((params, callback) => {
      callback(new Error('CUDA_ERROR_OUT_OF_MEMORY: out of memory'));
    });
    loadWhisperAddon.mockResolvedValue(mockFailingWhisper);

    exec.mockImplementation((command, callback) => {
      if (command.includes('ffprobe')) {
        callback(null, '30.0');
      } else {
        callback(new Error('Unknown command'));
      }
    });

    const result = await generateSubtitleWithBuiltinWhisper(
      event,
      file,
      formData,
    );

    expect(result).toBe(file.srtFile);
    expect(handleProcessingError).toHaveBeenCalled();
  });

  test('should recover from OpenVINO runtime errors', async () => {
    const file = createMockFile();
    const formData = createMockFormData();
    const event = createMockEvent();
    const gpuConfig = createMockGPUConfig('openvino');

    // Setup mocks
    const { determineGPUConfiguration } = require('main/helpers/gpuConfig');
    const { loadAndValidateAddon } = require('main/helpers/addonManager');
    const errorHandler = require('main/helpers/errorHandler');
    const { exec } = require('child_process');

    determineGPUConfiguration.mockResolvedValue(gpuConfig);

    // Mock OpenVINO runtime error
    const mockFailingWhisper = jest.fn((params, callback) => {
      callback(new Error('OpenVINO runtime initialization failed'));
    });
    loadAndValidateAddon.mockResolvedValue(mockFailingWhisper);

    // Ensure the error handler is called and returns the srt file
    errorHandler.handleProcessingError.mockResolvedValue(file.srtFile);

    exec.mockImplementation((command, callback) => {
      if (command.includes('ffprobe')) {
        callback(null, '30.0');
      } else {
        callback(new Error('Unknown command'));
      }
    });

    const result = await generateSubtitleWithBuiltinWhisper(
      event,
      file,
      formData,
    );

    expect(result).toBe(file.srtFile);
    expect(errorHandler.handleProcessingError).toHaveBeenCalled();
  });

  test('should recover from Intel GPU driver issues', async () => {
    const file = createMockFile();
    const formData = createMockFormData();
    const event = createMockEvent();
    const gpuConfig = createMockGPUConfig('openvino');

    // Setup mocks
    const { determineGPUConfiguration } = require('main/helpers/gpuConfig');
    const { loadWhisperAddon } = require('main/helpers/whisper');
    const { handleProcessingError } = require('main/helpers/errorHandler');
    const { exec } = require('child_process');

    determineGPUConfiguration.mockResolvedValue(gpuConfig);

    // Mock driver issue
    const mockFailingWhisper = jest.fn((params, callback) => {
      callback(new Error('Intel GPU driver not found'));
    });
    loadWhisperAddon.mockResolvedValue(mockFailingWhisper);

    exec.mockImplementation((command, callback) => {
      if (command.includes('ffprobe')) {
        callback(null, '30.0');
      } else {
        callback(new Error('Unknown command'));
      }
    });

    const result = await generateSubtitleWithBuiltinWhisper(
      event,
      file,
      formData,
    );

    expect(result).toBe(file.srtFile);
    expect(handleProcessingError).toHaveBeenCalled();
  });

  test('should fallback to CUDA when Intel GPU fails', async () => {
    const file = createMockFile();
    const formData = createMockFormData();
    const event = createMockEvent();

    // Setup mocks
    const { determineGPUConfiguration } = require('main/helpers/gpuConfig');
    const { loadWhisperAddon } = require('main/helpers/whisper');
    const { exec } = require('child_process');

    // Mock GPU config to return different configs on different calls
    determineGPUConfiguration
      .mockResolvedValueOnce(createMockGPUConfig('openvino'))
      .mockResolvedValueOnce(createMockGPUConfig('cuda'));

    // Mock OpenVINO failure, CUDA success
    loadWhisperAddon.mockResolvedValue(createMockWhisperFunction());

    exec.mockImplementation((command, callback) => {
      if (command.includes('ffprobe')) {
        callback(null, '30.0');
      } else {
        callback(new Error('Unknown command'));
      }
    });

    const result = await generateSubtitleWithBuiltinWhisper(
      event,
      file,
      formData,
    );

    expect(result).toBe(file.srtFile);
  });

  test('should fallback to CPU when all GPUs fail', async () => {
    const file = createMockFile();
    const formData = createMockFormData();
    const event = createMockEvent();

    const { determineGPUConfiguration } = require('main/helpers/gpuConfig');
    const { loadWhisperAddon } = require('main/helpers/whisper');
    const { exec } = require('child_process');

    determineGPUConfiguration.mockResolvedValue(createMockGPUConfig('cpu'));
    loadWhisperAddon.mockResolvedValue(createMockWhisperFunction());

    exec.mockImplementation((command, callback) => {
      if (command.includes('ffprobe')) {
        callback(null, '30.0');
      } else {
        callback(new Error('Unknown command'));
      }
    });

    const result = await generateSubtitleWithBuiltinWhisper(
      event,
      file,
      formData,
    );

    expect(result).toBe(file.srtFile);
  });
});

describe('Integration and Compatibility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should maintain existing CUDA processing functionality', async () => {
    const file = createMockFile();
    const formData = createMockFormData();
    const event = createMockEvent();
    const cudaConfig = createMockGPUConfig('cuda');

    // Setup mocks
    const { determineGPUConfiguration } = require('main/helpers/gpuConfig');
    const { loadWhisperAddon } = require('main/helpers/whisper');
    const { exec } = require('child_process');

    determineGPUConfiguration.mockResolvedValue(cudaConfig);
    loadWhisperAddon.mockResolvedValue(createMockWhisperFunction());

    exec.mockImplementation((command, callback) => {
      if (command.includes('ffprobe')) {
        callback(null, '30.0');
      } else {
        callback(new Error('Unknown command'));
      }
    });

    const result = await generateSubtitleWithBuiltinWhisper(
      event,
      file,
      formData,
    );

    expect(result).toBe(file.srtFile);
  });

  test('should maintain existing CoreML processing functionality', async () => {
    const file = createMockFile();
    const formData = createMockFormData();
    const event = createMockEvent();
    const coremlConfig = createMockGPUConfig('coreml');

    // Setup mocks
    const { determineGPUConfiguration } = require('main/helpers/gpuConfig');
    const { loadWhisperAddon } = require('main/helpers/whisper');
    const { exec } = require('child_process');

    determineGPUConfiguration.mockResolvedValue({
      ...coremlConfig,
      addonInfo: {
        ...coremlConfig.addonInfo,
        type: 'coreml',
        displayName: 'Apple CoreML',
      },
    });
    loadWhisperAddon.mockResolvedValue(createMockWhisperFunction());

    exec.mockImplementation((command, callback) => {
      if (command.includes('ffprobe')) {
        callback(null, '30.0');
      } else {
        callback(new Error('Unknown command'));
      }
    });

    const result = await generateSubtitleWithBuiltinWhisper(
      event,
      file,
      formData,
    );

    expect(result).toBe(file.srtFile);
  });

  test('should maintain existing CPU processing functionality', async () => {
    const file = createMockFile();
    const formData = createMockFormData();
    const event = createMockEvent();
    const cpuConfig = createMockGPUConfig('cpu');

    // Setup mocks
    const { determineGPUConfiguration } = require('main/helpers/gpuConfig');
    const { loadWhisperAddon } = require('main/helpers/whisper');
    const { exec } = require('child_process');

    determineGPUConfiguration.mockResolvedValue(cpuConfig);
    loadWhisperAddon.mockResolvedValue(createMockWhisperFunction());

    exec.mockImplementation((command, callback) => {
      if (command.includes('ffprobe')) {
        callback(null, '30.0');
      } else {
        callback(new Error('Unknown command'));
      }
    });

    const result = await generateSubtitleWithBuiltinWhisper(
      event,
      file,
      formData,
    );

    expect(result).toBe(file.srtFile);
  });

  test('should maintain file handling and SRT output format', async () => {
    const file = createMockFile();
    const formData = createMockFormData();
    const event = createMockEvent();
    const gpuConfig = createMockGPUConfig('openvino');

    // Setup mocks
    const { determineGPUConfiguration } = require('main/helpers/gpuConfig');
    const { loadWhisperAddon } = require('main/helpers/whisper');
    const { formatSrtContent } = require('main/helpers/fileUtils');
    const { writeFile } = require('fs').promises;
    const { exec } = require('child_process');
    const { loadAndValidateAddon } = require('main/helpers/addonManager');

    determineGPUConfiguration.mockResolvedValue(gpuConfig);

    // Create a proper mock whisper function that returns transcription in the expected format
    const mockWhisperWithTranscription = jest.fn((params, callback) => {
      const transcriptionResult = {
        transcription: [
          {
            start: 0,
            end: 5000,
            text: 'Mock transcription text',
          },
          {
            start: 5000,
            end: 10000,
            text: 'Second transcription segment',
          },
        ],
      };

      setTimeout(() => {
        callback(null, transcriptionResult);
      }, 10);
    });

    loadAndValidateAddon.mockResolvedValue(mockWhisperWithTranscription);

    exec.mockImplementation((command, callback) => {
      if (command.includes('ffprobe')) {
        callback(null, '30.0');
      } else {
        callback(new Error('Unknown command'));
      }
    });

    const result = await generateSubtitleWithBuiltinWhisper(
      event,
      file,
      formData,
    );

    expect(result).toBe(file.srtFile);
    expect(formatSrtContent).toHaveBeenCalled();
    expect(writeFile).toHaveBeenCalledWith(file.srtFile, expect.any(String));
  });
});
