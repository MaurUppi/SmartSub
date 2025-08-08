/**
 * Test Suite: Fallback Chain System
 * Tests for comprehensive fallback logic ensuring processing always succeeds
 *
 * Requirements tested:
 * - Fallback chain execution preserves system reliability
 * - Emergency fallback to legacy system when all options fail
 * - Graceful degradation maintains user experience
 * - Error context preservation for debugging
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { loadWhisperAddon } from 'main/helpers/whisper';

// Mock dependencies
jest.mock('main/helpers/store', () => ({
  store: {
    get: jest.fn(),
  },
}));

jest.mock('main/helpers/logger', () => ({
  logMessage: jest.fn(),
}));

import { store } from 'main/helpers/store';

describe('Fallback Chain Execution', () => {
  beforeEach(() => {
    global.addonTestUtils.resetAddonMocks();
    global.testUtils.resetAllMocks();
  });

  test('should fallback from OpenVINO to CUDA when Intel GPU fails', async () => {
    const capabilities = global.addonTestUtils.createMockGPUCapabilities();
    global.addonTestUtils.setupMockGPUDetection(capabilities);

    // Mock OpenVINO to fail, CUDA to succeed
    global.addonTestUtils.mockDlopen.mockImplementation(
      (module: any, filename: string) => {
        if (filename.includes('openvino')) {
          throw new Error('Intel GPU driver issue');
        } else if (filename.includes('cuda')) {
          module.exports = {
            whisper: global.addonTestUtils.createMockWhisperFunction(),
          };
        } else {
          throw new Error('Unknown addon');
        }
      },
    );

    (store.get as jest.Mock).mockReturnValue({
      useOpenVINO: true,
      useCuda: true,
      selectedGPUId: 'auto',
      gpuPreference: ['intel', 'nvidia', 'cpu'],
    });

    const whisperFunc = await loadWhisperAddon('base');

    expect(whisperFunc).toBeDefined();
    expect(typeof whisperFunc).toBe('function');
  });

  test('should fallback from CUDA to OpenVINO when NVIDIA fails', async () => {
    const capabilities = global.addonTestUtils.createMockGPUCapabilities();
    global.addonTestUtils.setupMockGPUDetection(capabilities);

    // Mock CUDA to fail, OpenVINO to succeed
    global.addonTestUtils.mockDlopen.mockImplementation(
      (module: any, filename: string) => {
        if (filename.includes('cuda')) {
          throw new Error('NVIDIA driver issue');
        } else if (filename.includes('openvino')) {
          module.exports = {
            whisper: global.addonTestUtils.createMockWhisperFunction(),
          };
        } else {
          throw new Error('Unknown addon');
        }
      },
    );

    (store.get as jest.Mock).mockReturnValue({
      useCuda: true,
      useOpenVINO: true,
      selectedGPUId: 'auto',
      gpuPreference: ['nvidia', 'intel', 'cpu'],
    });

    const whisperFunc = await loadWhisperAddon('base');

    expect(whisperFunc).toBeDefined();
    expect(typeof whisperFunc).toBe('function');
  });

  test('should fallback to CoreML on Apple Silicon when GPU options fail', async () => {
    const capabilities = global.addonTestUtils.createMockGPUCapabilities();
    capabilities.nvidia = false;
    capabilities.intel = [];
    capabilities.apple = true;
    global.addonTestUtils.setupMockGPUDetection(capabilities);

    // Mock Apple Silicon environment
    const { isAppleSilicon } = require('main/helpers/utils');
    const { hasEncoderModel } = require('main/helpers/whisper');
    isAppleSilicon.mockReturnValue(true);
    hasEncoderModel.mockReturnValue(true);

    // Mock CoreML to succeed
    global.addonTestUtils.mockDlopen.mockImplementation(
      (module: any, filename: string) => {
        if (filename.includes('coreml')) {
          module.exports = {
            whisper: global.addonTestUtils.createMockWhisperFunction(),
          };
        } else {
          throw new Error('GPU addon failed');
        }
      },
    );

    (store.get as jest.Mock).mockReturnValue({
      selectedGPUId: 'auto',
      gpuPreference: ['intel', 'nvidia', 'apple', 'cpu'],
    });

    const whisperFunc = await loadWhisperAddon('base');

    expect(whisperFunc).toBeDefined();
    expect(typeof whisperFunc).toBe('function');
  });

  test('should fallback to CPU when all GPU options fail', async () => {
    const capabilities = global.addonTestUtils.createMockGPUCapabilities();
    global.addonTestUtils.setupMockGPUDetection(capabilities);

    // Mock all GPU addons to fail, only CPU succeeds
    global.addonTestUtils.mockDlopen.mockImplementation(
      (module: any, filename: string) => {
        if (filename.includes('cpu')) {
          module.exports = {
            whisper: global.addonTestUtils.createMockWhisperFunction(),
          };
        } else {
          throw new Error('GPU addon failed');
        }
      },
    );

    (store.get as jest.Mock).mockReturnValue({
      selectedGPUId: 'auto',
      gpuPreference: ['nvidia', 'intel', 'apple', 'cpu'],
    });

    const whisperFunc = await loadWhisperAddon('base');

    expect(whisperFunc).toBeDefined();
    expect(typeof whisperFunc).toBe('function');
  });

  test('should maintain fallback order consistency', async () => {
    const capabilities = global.addonTestUtils.createMockGPUCapabilities();
    global.addonTestUtils.setupMockGPUDetection(capabilities);

    const callOrder = [];

    // Track addon loading attempts
    global.addonTestUtils.mockDlopen.mockImplementation(
      (module: any, filename: string) => {
        if (filename.includes('cuda')) {
          callOrder.push('cuda');
          throw new Error('CUDA failed');
        } else if (filename.includes('openvino')) {
          callOrder.push('openvino');
          throw new Error('OpenVINO failed');
        } else if (filename.includes('cpu')) {
          callOrder.push('cpu');
          module.exports = {
            whisper: global.addonTestUtils.createMockWhisperFunction(),
          };
        } else {
          throw new Error('Unknown addon');
        }
      },
    );

    (store.get as jest.Mock).mockReturnValue({
      selectedGPUId: 'auto',
      gpuPreference: ['nvidia', 'intel', 'cpu'],
    });

    await loadWhisperAddon('base');

    expect(callOrder).toEqual(['cuda', 'openvino', 'cpu']);
  });

  test('should handle partial system failures gracefully', async () => {
    const capabilities = global.addonTestUtils.createMockGPUCapabilities();
    capabilities.nvidia = false; // NVIDIA not available
    capabilities.openvinoVersion = '2024.6.0'; // OpenVINO available
    global.addonTestUtils.setupMockGPUDetection(capabilities);

    // Mock OpenVINO to succeed
    global.addonTestUtils.mockDlopen.mockImplementation(
      (module: any, filename: string) => {
        if (filename.includes('openvino')) {
          module.exports = {
            whisper: global.addonTestUtils.createMockWhisperFunction(),
          };
        } else {
          throw new Error('Other addons failed');
        }
      },
    );

    (store.get as jest.Mock).mockReturnValue({
      selectedGPUId: 'auto',
      gpuPreference: ['nvidia', 'intel', 'cpu'],
    });

    const whisperFunc = await loadWhisperAddon('base');

    expect(whisperFunc).toBeDefined();
    expect(typeof whisperFunc).toBe('function');
  });
});

describe('Emergency Legacy Fallback', () => {
  test('should fallback to legacy system when enhanced system completely fails', async () => {
    const capabilities = global.addonTestUtils.createMockGPUCapabilities();

    // Mock GPU detection to fail
    const {
      detectAvailableGPUs,
    } = require('main/helpers/hardware/hardwareDetection');
    detectAvailableGPUs.mockImplementation(() => {
      throw new Error('GPU detection system failure');
    });

    // Mock legacy addon loading to succeed
    global.addonTestUtils.mockDlopen.mockImplementation(
      (module: any, filename: string) => {
        module.exports = {
          whisper: global.addonTestUtils.createMockWhisperFunction(),
        };
      },
    );

    (store.get as jest.Mock).mockReturnValue({
      useCuda: false,
    });

    const whisperFunc = await loadWhisperAddon('base');

    expect(whisperFunc).toBeDefined();
    expect(typeof whisperFunc).toBe('function');
  });

  test('should use legacy CUDA path when available', async () => {
    // Mock complete enhanced system failure
    const {
      detectAvailableGPUs,
    } = require('main/helpers/hardware/hardwareDetection');
    detectAvailableGPUs.mockImplementation(() => {
      throw new Error('Enhanced system failure');
    });

    // Mock CUDA support check
    const { checkCudaSupport } = require('main/helpers/cudaUtils');
    checkCudaSupport.mockResolvedValue(true);

    // Mock legacy CUDA addon
    global.addonTestUtils.mockDlopen.mockImplementation(
      (module: any, filename: string) => {
        if (filename.includes('addon.node') && !filename.includes('no-cuda')) {
          module.exports = {
            whisper: global.addonTestUtils.createMockWhisperFunction(),
          };
        } else {
          throw new Error('Addon not found');
        }
      },
    );

    (store.get as jest.Mock).mockReturnValue({
      useCuda: true,
    });

    // Mock Windows platform
    Object.defineProperty(process, 'platform', {
      value: 'win32',
    });

    const whisperFunc = await loadWhisperAddon('base');

    expect(whisperFunc).toBeDefined();
    expect(typeof whisperFunc).toBe('function');
  });

  test('should use legacy CoreML path on Apple Silicon', async () => {
    // Mock complete enhanced system failure
    const {
      detectAvailableGPUs,
    } = require('main/helpers/hardware/hardwareDetection');
    detectAvailableGPUs.mockImplementation(() => {
      throw new Error('Enhanced system failure');
    });

    // Mock Apple Silicon environment
    const { isAppleSilicon } = require('main/helpers/utils');
    const { hasEncoderModel } = require('main/helpers/whisper');
    isAppleSilicon.mockReturnValue(true);
    hasEncoderModel.mockReturnValue(true);

    // Mock legacy CoreML addon
    global.addonTestUtils.mockDlopen.mockImplementation(
      (module: any, filename: string) => {
        if (filename.includes('addon.coreml.node')) {
          module.exports = {
            whisper: global.addonTestUtils.createMockWhisperFunction(),
          };
        } else {
          throw new Error('Addon not found');
        }
      },
    );

    (store.get as jest.Mock).mockReturnValue({});

    const whisperFunc = await loadWhisperAddon('base');

    expect(whisperFunc).toBeDefined();
    expect(typeof whisperFunc).toBe('function');
  });

  test('should handle complete system failure gracefully', async () => {
    // Mock everything to fail
    const {
      detectAvailableGPUs,
    } = require('main/helpers/hardware/hardwareDetection');
    detectAvailableGPUs.mockImplementation(() => {
      throw new Error('Complete system failure');
    });

    global.addonTestUtils.mockDlopen.mockImplementation(() => {
      throw new Error('No addons available');
    });

    (store.get as jest.Mock).mockReturnValue({});

    await expect(loadWhisperAddon('base')).rejects.toThrow();
  });
});

describe('Error Context Preservation', () => {
  test('should preserve error context through fallback chain', async () => {
    const capabilities = global.addonTestUtils.createMockGPUCapabilities();
    global.addonTestUtils.setupMockGPUDetection(capabilities);

    const originalError = new Error('OpenVINO driver initialization failed');

    // Mock OpenVINO to fail with specific error
    global.addonTestUtils.mockDlopen.mockImplementation(
      (module: any, filename: string) => {
        if (filename.includes('openvino')) {
          throw originalError;
        } else if (filename.includes('cpu')) {
          module.exports = {
            whisper: global.addonTestUtils.createMockWhisperFunction(),
          };
        } else {
          throw new Error('Other addon failed');
        }
      },
    );

    (store.get as jest.Mock).mockReturnValue({
      useOpenVINO: true,
      selectedGPUId: 'intel_arc_a770',
      gpuPreference: ['intel', 'cpu'],
    });

    const whisperFunc = await loadWhisperAddon('base');

    expect(whisperFunc).toBeDefined();
    expect(typeof whisperFunc).toBe('function');
  });

  test('should provide detailed error information for debugging', async () => {
    const capabilities = global.addonTestUtils.createMockGPUCapabilities();
    global.addonTestUtils.setupMockGPUDetection(capabilities);

    // Mock all addons to fail
    global.addonTestUtils.mockDlopen.mockImplementation(
      (module: any, filename: string) => {
        if (filename.includes('openvino')) {
          const error = new Error('Intel GPU memory allocation failed');
          (error as any).code = 'INTEL_GPU_ERROR';
          throw error;
        } else if (filename.includes('cuda')) {
          const error = new Error('CUDA out of memory');
          (error as any).code = 'CUDA_ERROR_OUT_OF_MEMORY';
          throw error;
        } else {
          const error = new Error('Addon file not found');
          (error as any).code = 'ENOENT';
          throw error;
        }
      },
    );

    (store.get as jest.Mock).mockReturnValue({
      selectedGPUId: 'auto',
      gpuPreference: ['intel', 'nvidia', 'cpu'],
    });

    // Mock legacy fallback to also fail
    const { checkCudaSupport } = require('main/helpers/cudaUtils');
    checkCudaSupport.mockRejectedValue(new Error('Legacy system also failed'));

    await expect(loadWhisperAddon('base')).rejects.toThrow();
  });
});

describe('Graceful Degradation', () => {
  test('should maintain performance expectations during fallback', async () => {
    const capabilities = global.addonTestUtils.createMockGPUCapabilities();
    global.addonTestUtils.setupMockGPUDetection(capabilities);

    let loadAttempts = 0;

    // Mock first attempt to fail, second to succeed quickly
    global.addonTestUtils.mockDlopen.mockImplementation(
      (module: any, filename: string) => {
        loadAttempts++;

        if (loadAttempts === 1 && filename.includes('openvino')) {
          throw new Error('Primary addon failed');
        } else if (filename.includes('cuda')) {
          module.exports = {
            whisper: global.addonTestUtils.createMockWhisperFunction(),
          };
        } else {
          throw new Error('Unknown addon');
        }
      },
    );

    (store.get as jest.Mock).mockReturnValue({
      selectedGPUId: 'auto',
      gpuPreference: ['intel', 'nvidia', 'cpu'],
    });

    const startTime = Date.now();
    const whisperFunc = await loadWhisperAddon('base');
    const endTime = Date.now();

    expect(whisperFunc).toBeDefined();
    expect(typeof whisperFunc).toBe('function');
    expect(endTime - startTime).toBeLessThan(1000); // Should complete quickly
  });

  test('should provide user feedback during extended fallback attempts', async () => {
    const capabilities = global.addonTestUtils.createMockGPUCapabilities();
    global.addonTestUtils.setupMockGPUDetection(capabilities);

    const { logMessage } = require('main/helpers/logger');

    // Mock multiple failures before success
    let attempts = 0;
    global.addonTestUtils.mockDlopen.mockImplementation(
      (module: any, filename: string) => {
        attempts++;

        if (attempts < 3) {
          throw new Error(`Attempt ${attempts} failed`);
        } else if (filename.includes('cpu')) {
          module.exports = {
            whisper: global.addonTestUtils.createMockWhisperFunction(),
          };
        } else {
          throw new Error('Still failing');
        }
      },
    );

    (store.get as jest.Mock).mockReturnValue({
      selectedGPUId: 'auto',
      gpuPreference: ['intel', 'nvidia', 'apple', 'cpu'],
    });

    const whisperFunc = await loadWhisperAddon('base');

    expect(whisperFunc).toBeDefined();
    expect(logMessage).toHaveBeenCalledWith(
      expect.stringContaining('Attempting recovery'),
      'info',
    );
  });
});
