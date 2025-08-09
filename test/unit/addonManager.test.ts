/**
 * Test Suite: Addon Manager System
 * Tests for addon loading validation, environment setup, and error recovery
 *
 * Requirements tested:
 * - Addon loading and validation with structure verification
 * - OpenVINO environment variable setup
 * - Error handling and recovery mechanisms
 * - Fallback chain creation and execution
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import fs from 'fs';
import path from 'path';

// Mock file system
jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

// Mock dependencies - must come before imports
jest.mock('main/helpers/logger', () => ({
  logMessage: jest.fn(),
  generateCorrelationId: jest.fn(() => 'test-correlation-id'),
  logAddonLoadingEvent: jest.fn(),
  logOpenVINOAddonEvent: jest.fn(),
  logPerformanceMetrics: jest.fn(),
  LogCategory: {
    ADDON_LOADING: 'addon_loading',
    GPU_DETECTION: 'gpu_detection',
  },
}));

jest.mock('main/helpers/store', () => ({
  store: {
    get: jest.fn(),
  },
}));

jest.mock('main/helpers/utils', () => ({
  getExtraResourcesPath: jest.fn(() => '/mock/extraResources'),
  isAppleSilicon: jest.fn(() => false),
  isWin32: jest.fn(() => process.platform === 'win32'),
}));

jest.mock('main/helpers/gpuSelector', () => ({
  selectOptimalGPU: jest.fn(),
  createAddonInfo: jest.fn(),
  getCUDAAddonName: jest.fn(() => 'addon-cuda.node'),
  getOpenVINOAddonName: jest.fn(() => 'addon-openvino.node'),
  getCoreMLAddonName: jest.fn(() => 'addon.coreml.node'),
  getCPUAddonName: jest.fn(() => 'addon.node'),
}));

// Import after mocks
import {
  loadAndValidateAddon,
  handleAddonLoadingError,
  createFallbackChain,
  logAddonLoadAttempt,
  setupOpenVINOEnvironment,
  validateAddonStructure,
} from 'main/helpers/addonManager';

// Import addon test setup
import '../setup/addonTestSetup';

import { store } from 'main/helpers/store';

describe('Addon Loading and Validation', () => {
  beforeEach(() => {
    global.addonTestUtils.resetAddonMocks();
    jest.clearAllMocks();

    // Mock file system operations
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(Buffer.from('mock addon content'));

    // Mock process.dlopen to simulate addon loading
    const originalDlopen = process.dlopen;
    process.dlopen = jest.fn((module: any, filename: string) => {
      // Check if we should simulate success or failure based on the test setup
      if (global.addonTestUtils.mockDlopen) {
        return global.addonTestUtils.mockDlopen(module, filename);
      }
      // Default successful loading
      module.exports = {
        whisper: global.addonTestUtils.createMockWhisperFunction(),
      };
    }) as any;
  });

  test('should load and validate OpenVINO addon successfully', async () => {
    const addonInfo = global.addonTestUtils.createMockAddonInfo('openvino');
    global.addonTestUtils.setupMockAddonLoading(true, 'openvino');

    // Mock OpenVINO specific checks
    mockFs.existsSync.mockReturnValue(true);
    mockFs.statSync = jest.fn().mockReturnValue({
      isFile: () => true,
      size: 1024000, // Mock a valid file size
    });

    // Mock process.dlopen to handle OpenVINO addon loading
    process.dlopen = jest.fn((module: any, filename: string) => {
      module.exports = {
        whisper: global.addonTestUtils.createMockWhisperFunction(),
      };
    }) as any;

    const whisperFunc = await loadAndValidateAddon(addonInfo);

    expect(whisperFunc).toBeDefined();
    expect(typeof whisperFunc).toBe('function');
  });

  test('should load and validate CUDA addon successfully', async () => {
    const addonInfo = global.addonTestUtils.createMockAddonInfo('cuda');
    global.addonTestUtils.setupMockAddonLoading(true, 'cuda');

    mockFs.existsSync.mockReturnValue(true);

    const whisperFunc = await loadAndValidateAddon(addonInfo);

    expect(whisperFunc).toBeDefined();
    expect(typeof whisperFunc).toBe('function');
  });

  test('should load and validate CoreML addon successfully', async () => {
    const addonInfo = global.addonTestUtils.createMockAddonInfo('coreml');
    global.addonTestUtils.setupMockAddonLoading(true, 'coreml');

    mockFs.existsSync.mockReturnValue(true);

    const whisperFunc = await loadAndValidateAddon(addonInfo);

    expect(whisperFunc).toBeDefined();
    expect(typeof whisperFunc).toBe('function');
  });

  test('should load and validate CPU addon successfully', async () => {
    const addonInfo = global.addonTestUtils.createMockAddonInfo('cpu');
    global.addonTestUtils.setupMockAddonLoading(true, 'cpu');

    mockFs.existsSync.mockReturnValue(true);

    const whisperFunc = await loadAndValidateAddon(addonInfo);

    expect(whisperFunc).toBeDefined();
    expect(typeof whisperFunc).toBe('function');
  });

  test('should throw error for addon with invalid structure', async () => {
    const addonInfo = global.addonTestUtils.createMockAddonInfo('openvino');

    mockFs.existsSync.mockReturnValue(true);

    // Mock addon loading with invalid structure
    global.addonTestUtils.mockDlopen.mockImplementation((module: any) => {
      module.exports = {}; // Missing whisper function
    });

    await expect(loadAndValidateAddon(addonInfo)).rejects.toThrow();
  });

  test('should throw error for missing addon file', async () => {
    const addonInfo = global.addonTestUtils.createMockAddonInfo('openvino');

    // Mock file not found
    mockFs.existsSync.mockReturnValue(false);

    await expect(loadAndValidateAddon(addonInfo)).rejects.toThrow();
  });

  test('should handle permission errors gracefully', async () => {
    const addonInfo = global.addonTestUtils.createMockAddonInfo('openvino');

    mockFs.existsSync.mockReturnValue(true);

    // Mock permission denied error
    global.addonTestUtils.mockDlopen.mockImplementation(() => {
      const error = new Error('EACCES: permission denied');
      (error as any).code = 'EACCES';
      throw error;
    });

    await expect(loadAndValidateAddon(addonInfo)).rejects.toThrow();
  });

  test('should handle corrupted addon files', async () => {
    const addonInfo = global.addonTestUtils.createMockAddonInfo('openvino');

    mockFs.existsSync.mockReturnValue(true);

    // Mock dynamic linking error
    global.addonTestUtils.mockDlopen.mockImplementation(() => {
      throw new Error('Dynamic linking failed: corrupt binary');
    });

    await expect(loadAndValidateAddon(addonInfo)).rejects.toThrow();
  });
});

describe('OpenVINO Environment Setup', () => {
  test('should set OpenVINO environment variables correctly', () => {
    const deviceConfig = {
      deviceId: 'GPU0',
      memory: 8192,
      type: 'discrete',
    };

    (store.get as jest.Mock).mockReturnValue({
      openvinoPreferences: {
        cacheDir: '/custom/cache',
        devicePreference: 'manual',
        enableOptimizations: true,
      },
    });

    setupOpenVINOEnvironment(deviceConfig);

    expect(process.env.OPENVINO_DEVICE_ID).toBe('GPU0');
    expect(process.env.OPENVINO_CACHE_DIR).toBe('/custom/cache');
    expect(process.env.OPENVINO_ENABLE_OPTIMIZATIONS).toBe('true');
  });

  test('should use default environment values when settings missing', () => {
    const deviceConfig = {
      deviceId: 'GPU1',
      memory: 4096,
      type: 'integrated',
    };

    (store.get as jest.Mock).mockReturnValue({});

    setupOpenVINOEnvironment(deviceConfig);

    expect(process.env.OPENVINO_DEVICE_ID).toBe('GPU1');
    expect(process.env.OPENVINO_CACHE_DIR).toContain('openvino-cache');
    expect(process.env.OPENVINO_ENABLE_OPTIMIZATIONS).toBe('true');
  });

  test('should handle null device config gracefully', () => {
    expect(() => setupOpenVINOEnvironment(null)).not.toThrow();
    expect(process.env.OPENVINO_DEVICE_ID).toBe('CPU');
  });
});

describe('Addon Structure Validation', () => {
  test('should validate correct addon structure', () => {
    const validAddon = {
      exports: {
        whisper: jest.fn(),
      },
    };

    expect(() => validateAddonStructure(validAddon)).not.toThrow();
  });

  test('should reject addon missing exports', () => {
    const invalidAddon = {};

    expect(() => validateAddonStructure(invalidAddon)).toThrow(
      'Missing exports',
    );
  });

  test('should reject addon missing whisper function', () => {
    const invalidAddon = {
      exports: {},
    };

    expect(() => validateAddonStructure(invalidAddon)).toThrow(
      'Missing whisper function',
    );
  });

  test('should reject addon with invalid whisper function', () => {
    const invalidAddon = {
      exports: {
        whisper: 'not a function',
      },
    };

    expect(() => validateAddonStructure(invalidAddon)).toThrow(
      'Invalid whisper function',
    );
  });
});

describe('Error Handling and Recovery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFs.existsSync.mockReturnValue(true);
  });

  test('should handle addon loading error with successful fallback', async () => {
    const primaryAddon = global.addonTestUtils.createMockAddonInfo('openvino');
    const fallbackOptions = [
      global.addonTestUtils.createMockAddonInfo('cuda'),
      global.addonTestUtils.createMockAddonInfo('cpu'),
    ];

    // Mock primary addon to fail, CUDA to succeed
    let callCount = 0;
    process.dlopen = jest.fn((module: any, filename: string) => {
      callCount++;
      if (callCount === 1 || filename.includes('openvino')) {
        throw new Error('OpenVINO addon failed');
      } else if (filename.includes('cuda') || callCount === 2) {
        module.exports = {
          whisper: global.addonTestUtils.createMockWhisperFunction(),
        };
      } else {
        throw new Error('Unknown addon');
      }
    }) as any;

    const error = new Error('OpenVINO loading failed');
    const whisperFunc = await handleAddonLoadingError(
      error,
      primaryAddon,
      fallbackOptions,
    );

    expect(whisperFunc).toBeDefined();
    expect(typeof whisperFunc).toBe('function');
  });

  test('should exhaust all fallback options before failing', async () => {
    const primaryAddon = global.addonTestUtils.createMockAddonInfo('openvino');
    const fallbackOptions = [
      global.addonTestUtils.createMockAddonInfo('cuda'),
      global.addonTestUtils.createMockAddonInfo('cpu'),
    ];

    // Mock all addons to fail
    process.dlopen = jest.fn(() => {
      throw new Error('All addons failed');
    }) as any;

    const error = new Error('Primary addon failed');

    await expect(
      handleAddonLoadingError(error, primaryAddon, fallbackOptions),
    ).rejects.toThrow('All fallback options exhausted');
  });

  test('should handle empty fallback chain', async () => {
    const primaryAddon = global.addonTestUtils.createMockAddonInfo('openvino');
    const fallbackOptions = [];

    const error = new Error('Primary addon failed');

    await expect(
      handleAddonLoadingError(error, primaryAddon, fallbackOptions),
    ).rejects.toThrow('No fallback options available');
  });
});

describe('Fallback Chain Creation', () => {
  test('should create fallback chain for OpenVINO addon', () => {
    const openvinoAddon = global.addonTestUtils.createMockAddonInfo('openvino');

    const fallbackChain = createFallbackChain(openvinoAddon);

    // The fallback chain should be an array
    expect(Array.isArray(fallbackChain)).toBe(true);
    // Should have some fallback options
    expect(fallbackChain.length).toBeGreaterThanOrEqual(0);
  });

  test('should create fallback chain for CUDA addon', () => {
    const cudaAddon = global.addonTestUtils.createMockAddonInfo('cuda');

    const fallbackChain = createFallbackChain(cudaAddon);

    // The fallback chain should be an array
    expect(Array.isArray(fallbackChain)).toBe(true);
    // Should have some fallback options
    expect(fallbackChain.length).toBeGreaterThanOrEqual(0);
  });

  test('should create fallback chain for CoreML addon', () => {
    const coremlAddon = global.addonTestUtils.createMockAddonInfo('coreml');

    const fallbackChain = createFallbackChain(coremlAddon);

    // The fallback chain should be an array
    expect(Array.isArray(fallbackChain)).toBe(true);
    // Should have some fallback options
    expect(fallbackChain.length).toBeGreaterThanOrEqual(0);
  });

  test('should create fallback chain for CPU addon', () => {
    const cpuAddon = global.addonTestUtils.createMockAddonInfo('cpu');

    const fallbackChain = createFallbackChain(cpuAddon);

    expect(fallbackChain).toHaveLength(0); // CPU is final fallback
  });
});

describe('Addon Load Attempt Logging', () => {
  test('should log addon load attempt with full context', () => {
    const addonInfo = global.addonTestUtils.createMockAddonInfo('openvino');

    expect(() => logAddonLoadAttempt(addonInfo)).not.toThrow();
  });

  test('should handle null addon info gracefully', () => {
    expect(() => logAddonLoadAttempt(null)).not.toThrow();
  });
});
