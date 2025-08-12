/**
 * Test Setup for Task 2.2: Subtitle Generation Integration
 * Provides subtitle generation specific test utilities and mocks
 */

import path from 'path';
import { IFiles } from '../../types';

// Ensure Jest is available
declare const jest: any;

// Mock IPC event
const mockEvent = {
  sender: {
    send: jest.fn(),
  },
};

// Mock modules for subtitle generation
jest.mock('main/helpers/logger', () => ({
  logMessage: jest.fn(),
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

jest.mock('main/helpers/storeManager', () => ({
  logMessage: jest.fn(),
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
  getPath: jest.fn((key) => {
    const paths = { modelsPath: '/mock/models' };
    return paths[key] || '/mock/default';
  }),
  hasEncoderModel: jest.fn(() => true),
}));

// Mock GPU-related modules
jest.mock('main/helpers/gpuSelector', () => ({
  selectOptimalGPU: jest.fn(),
  resolveSpecificGPU: jest.fn(),
  getGPUSelectionConfig: jest.fn(() => ({})),
  logGPUSelection: jest.fn(),
}));

jest.mock('main/helpers/addonManager', () => ({
  loadAndValidateAddon: jest.fn(),
  handleAddonLoadingError: jest.fn(),
  createFallbackChain: jest.fn(() => []),
  logAddonLoadAttempt: jest.fn(),
}));

jest.mock('main/helpers/hardware/hardwareDetection', () => ({
  detectAvailableGPUs: jest.fn(() => ({
    nvidia: false,
    intel: [{ id: 'GPU0', name: 'Intel Arc A770' }],
    apple: false,
    openvinoVersion: '2024.6.0',
  })),
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
      updateMemoryUsage: jest.fn(),
      trackError: jest.fn(),
      endSession: jest.fn().mockResolvedValue({
        sessionId: 'session-123',
        speedupFactor: 3.5,
        processingTime: 5000,
        addonType: 'openvino',
        realTimeRatio: 2.0,
        memoryUsage: {
          heapUsed: 100 * 1024 * 1024,
          peak: 120 * 1024 * 1024,
        },
      }),
    })),
  },
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

jest.mock('main/helpers/cudaUtils', () => ({
  checkCudaSupport: jest.fn(() => ({ hasCuda: false })),
}));

jest.mock('ffmpeg-ffprobe-static', () => ({
  ffprobePath: '/mock/ffprobe',
}));

jest.mock('main/helpers/fileUtils', () => ({
  formatSrtContent: jest.fn((transcription) => {
    if (!transcription || transcription.length === 0) {
      return '';
    }
    return '1\n00:00:00,000 --> 00:00:05,000\nMock transcription\n\n';
  }),
}));

// Mock error handler module
jest.mock('main/helpers/errorHandler', () => ({
  handleProcessingError: jest.fn().mockResolvedValue('/test/path/output.srt'),
  createUserFriendlyErrorMessage: jest.fn((error) => error.message),
  logErrorContext: jest.fn(),
}));

// Set up error handler mock in require cache
const errorHandlerMock = {
  handleProcessingError: jest.fn().mockResolvedValue('/test/path/output.srt'),
  createUserFriendlyErrorMessage: jest.fn((error) => error.message),
  logErrorContext: jest.fn(),
};

try {
  require.cache[require.resolve('main/helpers/errorHandler')] = {
    id: require.resolve('main/helpers/errorHandler'),
    filename: require.resolve('main/helpers/errorHandler'),
    loaded: true,
    parent: null,
    children: [],
    exports: errorHandlerMock,
    paths: [],
  } as any;
} catch (e) {
  // Ignore if module doesn't exist yet
}

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

// Global test utilities for subtitle generation testing
declare global {
  var subtitleTestUtils: {
    createMockFile: (overrides?: Partial<IFiles>) => IFiles;
    createMockFormData: (overrides?: any) => any;
    createMockEvent: () => any;
    createMockWhisperFunction: () => any;
    createMockGPUConfig: (addonType?: string) => any;
    createMockTranscriptionResult: (length?: number) => any;
    setupMockAudioDuration: (duration: number) => void;
    setupMockWhisperAddon: (shouldSucceed: boolean, addonType?: string) => void;
    setupMockGPUConfig: (config: any) => void;
    setupMockPerformanceMonitor: () => any;
    resetSubtitleMocks: () => void;
  };
}

global.subtitleTestUtils = {
  createMockFile: (overrides = {}) => ({
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
    ...overrides,
  }),

  createMockFormData: (overrides = {}) => ({
    model: 'base',
    sourceLanguage: 'auto',
    prompt: '',
    maxContext: 448,
    ...overrides,
  }),

  createMockEvent: () => mockEvent,

  createMockWhisperFunction: () => {
    return jest.fn(
      (params: any, callback?: (error: Error | null, result?: any) => void) => {
        const result = {
          transcription: [
            {
              start: 0,
              end: 5000,
              text: 'Mock transcription text',
            },
          ],
        };

        if (callback) {
          // Async callback style
          setTimeout(() => {
            if (params.validate_only) {
              callback(null, { validation: 'success' });
            } else if (params.model && params.fname_inp) {
              callback(null, result);
            } else {
              callback(new Error('Invalid parameters'));
            }
          }, 10);
        } else {
          // Promise style
          return Promise.resolve(result);
        }
      },
    );
  },

  createMockGPUConfig: (addonType = 'openvino') => {
    const configs = {
      openvino: {
        addonInfo: {
          type: 'openvino',
          path: 'addon-openvino.node',
          displayName: 'Intel Arc A770',
          deviceConfig: {
            deviceId: 'GPU0',
            memory: 8192,
            type: 'discrete',
          },
        },
        whisperParams: {
          use_gpu: true,
          openvino_device: 'GPU0',
          openvino_enable_optimization: true,
          performance_mode: 'throughput',
        },
        performanceHints: {
          expectedSpeedup: 3.5,
          memoryUsage: 'medium',
          powerEfficiency: 'good',
          processingPriority: 'high',
        },
        environmentConfig: {
          openvinoDeviceId: 'GPU0',
          openvino_enable_optimizations: true,
          openvino_performance_hint: 'THROUGHPUT',
        },
      },
      cuda: {
        addonInfo: {
          type: 'cuda',
          path: 'addon-cuda.node',
          displayName: 'NVIDIA CUDA GPU',
          deviceConfig: null,
        },
        whisperParams: {
          use_gpu: true,
          cuda_device: 0,
          flash_attn: true,
          performance_mode: 'throughput',
        },
        performanceHints: {
          expectedSpeedup: 4.0,
          memoryUsage: 'high',
          powerEfficiency: 'moderate',
          processingPriority: 'high',
        },
        environmentConfig: {},
      },
      cpu: {
        addonInfo: {
          type: 'cpu',
          path: 'addon-cpu.node',
          displayName: 'CPU Processing',
          deviceConfig: null,
        },
        whisperParams: {
          use_gpu: false,
          performance_mode: 'balanced',
        },
        performanceHints: {
          expectedSpeedup: 1.0,
          memoryUsage: 'medium',
          powerEfficiency: 'good',
          processingPriority: 'normal',
        },
        environmentConfig: {},
      },
    };

    return configs[addonType] || configs.cpu;
  },

  createMockTranscriptionResult: (length = 100) => ({
    transcription: Array.from({ length: Math.ceil(length / 20) }, (_, i) => ({
      start: i * 5000,
      end: (i + 1) * 5000,
      text: `Mock transcription segment ${i + 1}`,
    })),
  }),

  setupMockAudioDuration: (duration: number) => {
    const { exec } = require('child_process');
    exec.mockImplementation(
      (
        command: string,
        callback: (error: Error | null, stdout?: string) => void,
      ) => {
        if (command.includes('ffprobe')) {
          callback(null, (duration / 1000).toString());
        } else {
          callback(new Error('Unknown command'));
        }
      },
    );
  },

  setupMockWhisperAddon: (shouldSucceed: boolean, addonType = 'openvino') => {
    // Get the mocked module
    const whisperModule = require('main/helpers/whisper');
    const loadWhisperAddon = whisperModule.loadWhisperAddon;

    // Ensure it's a jest mock function
    if (
      !loadWhisperAddon ||
      typeof loadWhisperAddon.mockResolvedValue !== 'function'
    ) {
      console.warn('loadWhisperAddon mock is not properly set up');
      return;
    }

    if (shouldSucceed) {
      // Create a mock whisper function that works properly with promisify
      const mockWhisperFunction = (
        params: any,
        callback: (error: Error | null, result?: any) => void,
      ) => {
        const result = {
          transcription: [
            {
              start: 0,
              end: 5000,
              text: 'Mock transcription text',
            },
          ],
        };

        // Simulate async behavior
        setTimeout(() => {
          if (params.validate_only) {
            callback(null, { validation: 'success' });
          } else if (params.model && params.fname_inp) {
            callback(null, result);
          } else {
            callback(new Error('Invalid parameters'));
          }
        }, 10);
      };

      loadWhisperAddon.mockResolvedValue(mockWhisperFunction);
    } else {
      loadWhisperAddon.mockRejectedValue(
        new Error(`${addonType} addon failed to load`),
      );
    }
  },

  setupMockGPUConfig: (config: any) => {
    const { loadAndValidateAddon } = require('main/helpers/addonManager');
    const { determineGPUConfiguration } = require('main/helpers/gpuConfig');

    // Mock the GPU config determination to return the provided config
    determineGPUConfiguration.mockResolvedValue(config);

    // Mock addon loading to return a working whisper function
    loadAndValidateAddon.mockResolvedValue(
      global.subtitleTestUtils.createMockWhisperFunction(),
    );
  },

  setupMockPerformanceMonitor: () => {
    const mockMonitor = {
      startSession: jest.fn().mockReturnValue('session-123'),
      updateMemoryUsage: jest.fn(),
      trackError: jest.fn(),
      endSession: jest.fn().mockResolvedValue({
        sessionId: 'session-123',
        speedupFactor: 3.5,
        processingTime: 5000,
        addonType: 'openvino',
        realTimeRatio: 2.0,
        memoryUsage: {
          heapUsed: 100 * 1024 * 1024,
          peak: 120 * 1024 * 1024,
        },
      }),
    };

    const mockGetInstance = jest.fn().mockReturnValue(mockMonitor);

    jest.doMock('main/helpers/performanceMonitor', () => ({
      GPUPerformanceMonitor: {
        getInstance: mockGetInstance,
      },
    }));

    // Store mocks for verification in tests
    global.performanceMonitorMocks = {
      monitor: mockMonitor,
      getInstance: mockGetInstance,
    };

    return mockMonitor;
  },

  resetSubtitleMocks: () => {
    jest.clearAllMocks();
    mockEvent.sender.send.mockClear();
  },
};

// Reset mocks before each test
beforeEach(() => {
  global.subtitleTestUtils.resetSubtitleMocks();
});

export { mockEvent };
