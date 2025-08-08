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

// Mock dependencies
jest.mock('main/helpers/logger', () => ({
  logMessage: jest.fn(),
}));

jest.mock('main/helpers/store', () => ({
  store: {
    get: jest.fn(),
  },
}));

import { store } from 'main/helpers/store';

describe('Addon Loading and Validation', () => {
  beforeEach(() => {
    global.addonTestUtils.resetAddonMocks();
    jest.clearAllMocks();
  });

  test('should load and validate OpenVINO addon successfully', async () => {
    const addonInfo = global.addonTestUtils.createMockAddonInfo('openvino');
    global.addonTestUtils.setupMockAddonLoading(true, 'openvino');

    const whisperFunc = await loadAndValidateAddon(addonInfo);

    expect(whisperFunc).toBeDefined();
    expect(typeof whisperFunc).toBe('function');
  });

  test('should load and validate CUDA addon successfully', async () => {
    const addonInfo = global.addonTestUtils.createMockAddonInfo('cuda');
    global.addonTestUtils.setupMockAddonLoading(true, 'cuda');

    const whisperFunc = await loadAndValidateAddon(addonInfo);

    expect(whisperFunc).toBeDefined();
    expect(typeof whisperFunc).toBe('function');
  });

  test('should load and validate CoreML addon successfully', async () => {
    const addonInfo = global.addonTestUtils.createMockAddonInfo('coreml');
    global.addonTestUtils.setupMockAddonLoading(true, 'coreml');

    const whisperFunc = await loadAndValidateAddon(addonInfo);

    expect(whisperFunc).toBeDefined();
    expect(typeof whisperFunc).toBe('function');
  });

  test('should load and validate CPU addon successfully', async () => {
    const addonInfo = global.addonTestUtils.createMockAddonInfo('cpu');
    global.addonTestUtils.setupMockAddonLoading(true, 'cpu');

    const whisperFunc = await loadAndValidateAddon(addonInfo);

    expect(whisperFunc).toBeDefined();
    expect(typeof whisperFunc).toBe('function');
  });

  test('should throw error for addon with invalid structure', async () => {
    const addonInfo = global.addonTestUtils.createMockAddonInfo('openvino');

    // Mock addon loading with invalid structure
    global.addonTestUtils.mockDlopen.mockImplementation((module: any) => {
      module.exports = {}; // Missing whisper function
    });

    await expect(loadAndValidateAddon(addonInfo)).rejects.toThrow(
      'Invalid addon structure',
    );
  });

  test('should throw error for missing addon file', async () => {
    const addonInfo = global.addonTestUtils.createMockAddonInfo('openvino');

    // Mock file not found error
    global.addonTestUtils.mockDlopen.mockImplementation(() => {
      const error = new Error('ENOENT: no such file or directory');
      (error as any).code = 'ENOENT';
      throw error;
    });

    await expect(loadAndValidateAddon(addonInfo)).rejects.toThrow('ENOENT');
  });

  test('should handle permission errors gracefully', async () => {
    const addonInfo = global.addonTestUtils.createMockAddonInfo('openvino');

    // Mock permission denied error
    global.addonTestUtils.mockDlopen.mockImplementation(() => {
      const error = new Error('EACCES: permission denied');
      (error as any).code = 'EACCES';
      throw error;
    });

    await expect(loadAndValidateAddon(addonInfo)).rejects.toThrow('EACCES');
  });

  test('should handle corrupted addon files', async () => {
    const addonInfo = global.addonTestUtils.createMockAddonInfo('openvino');

    // Mock dynamic linking error
    global.addonTestUtils.mockDlopen.mockImplementation(() => {
      throw new Error('Dynamic linking failed: corrupt binary');
    });

    await expect(loadAndValidateAddon(addonInfo)).rejects.toThrow(
      'Dynamic linking failed',
    );
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
  test('should handle addon loading error with successful fallback', async () => {
    const primaryAddon = global.addonTestUtils.createMockAddonInfo('openvino');
    const fallbackOptions = [
      global.addonTestUtils.createMockAddonInfo('cuda'),
      global.addonTestUtils.createMockAddonInfo('cpu'),
    ];

    // Mock primary addon to fail, CUDA to succeed
    global.addonTestUtils.mockDlopen.mockImplementation(
      (module: any, filename: string) => {
        if (filename.includes('openvino')) {
          throw new Error('OpenVINO addon failed');
        } else if (filename.includes('cuda')) {
          module.exports = {
            whisper: global.addonTestUtils.createMockWhisperFunction(),
          };
        } else {
          throw new Error('Unknown addon');
        }
      },
    );

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
    global.addonTestUtils.mockDlopen.mockImplementation(() => {
      throw new Error('All addons failed');
    });

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

    expect(fallbackChain).toHaveLength(3);
    expect(fallbackChain[0].type).toBe('cuda');
    expect(fallbackChain[1].type).toBe('coreml');
    expect(fallbackChain[2].type).toBe('cpu');
  });

  test('should create fallback chain for CUDA addon', () => {
    const cudaAddon = global.addonTestUtils.createMockAddonInfo('cuda');

    const fallbackChain = createFallbackChain(cudaAddon);

    expect(fallbackChain).toHaveLength(3);
    expect(fallbackChain[0].type).toBe('openvino');
    expect(fallbackChain[1].type).toBe('coreml');
    expect(fallbackChain[2].type).toBe('cpu');
  });

  test('should create fallback chain for CoreML addon', () => {
    const coremlAddon = global.addonTestUtils.createMockAddonInfo('coreml');

    const fallbackChain = createFallbackChain(coremlAddon);

    expect(fallbackChain).toHaveLength(3);
    expect(fallbackChain[0].type).toBe('cuda');
    expect(fallbackChain[1].type).toBe('openvino');
    expect(fallbackChain[2].type).toBe('cpu');
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
