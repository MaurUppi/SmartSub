/**
 * Test Suite: Addon Loading System
 * Comprehensive tests for enhanced whisper addon loading with Intel GPU support
 *
 * Requirements tested:
 * - Intel GPU addon loading works with OpenVINO integration
 * - User GPU selection override functions correctly
 * - Automatic GPU priority selection follows defined order
 * - Fallback chain ensures processing always succeeds
 * - Error handling provides clear user feedback
 * - Existing CUDA and CoreML addon loading unchanged
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { loadWhisperAddon } from 'main/helpers/whisper';

// Mock modules
jest.mock('main/helpers/store', () => ({
  store: {
    get: jest.fn(),
  },
}));

jest.mock('main/helpers/logger', () => ({
  logMessage: jest.fn(),
}));

import { store } from 'main/helpers/store';

describe('Addon Loading System', () => {
  beforeEach(() => {
    global.addonTestUtils.resetAddonMocks();
    global.testUtils.resetAllMocks();
  });

  test('should load Intel OpenVINO addon successfully', async () => {
    const capabilities = global.addonTestUtils.createMockGPUCapabilities();
    global.addonTestUtils.setupMockGPUDetection(capabilities);
    global.addonTestUtils.setupMockAddonLoading(true, 'openvino');

    (store.get as jest.Mock).mockReturnValue({
      useOpenVINO: true,
      selectedGPUId: 'intel_arc_a770',
      gpuPreference: ['intel', 'nvidia', 'cpu'],
    });

    const whisperFunc = await loadWhisperAddon('base');

    expect(whisperFunc).toBeDefined();
    expect(typeof whisperFunc).toBe('function');
    expect(process.env.OPENVINO_DEVICE_ID).toBe('GPU0');
  });

  test('should load NVIDIA CUDA addon (existing functionality)', async () => {
    const capabilities = global.addonTestUtils.createMockGPUCapabilities();
    capabilities.intel = []; // No Intel GPUs
    global.addonTestUtils.setupMockGPUDetection(capabilities);
    global.addonTestUtils.setupMockAddonLoading(true, 'cuda');

    (store.get as jest.Mock).mockReturnValue({
      useCuda: true,
      selectedGPUId: 'nvidia_gpu_0',
      gpuPreference: ['nvidia', 'cpu'],
    });

    const whisperFunc = await loadWhisperAddon('base');

    expect(whisperFunc).toBeDefined();
    expect(typeof whisperFunc).toBe('function');
  });

  test('should load Apple CoreML addon (existing functionality)', async () => {
    const capabilities = global.addonTestUtils.createMockGPUCapabilities();
    capabilities.nvidia = false;
    capabilities.intel = [];
    capabilities.apple = true;
    global.addonTestUtils.setupMockGPUDetection(capabilities);
    global.addonTestUtils.setupMockAddonLoading(true, 'coreml');

    // Mock Apple Silicon detection and encoder model availability
    const { isAppleSilicon } = require('main/helpers/utils');
    const { hasEncoderModel } = require('main/helpers/whisper');
    isAppleSilicon.mockReturnValue(true);
    hasEncoderModel.mockReturnValue(true);

    (store.get as jest.Mock).mockReturnValue({
      selectedGPUId: 'apple_gpu',
      gpuPreference: ['apple', 'cpu'],
    });

    const whisperFunc = await loadWhisperAddon('base');

    expect(whisperFunc).toBeDefined();
    expect(typeof whisperFunc).toBe('function');
  });

  test('should load CPU addon as final fallback', async () => {
    const capabilities = global.addonTestUtils.createMockGPUCapabilities();
    capabilities.nvidia = false;
    capabilities.intel = [];
    capabilities.apple = false;
    capabilities.openvinoVersion = false;
    global.addonTestUtils.setupMockGPUDetection(capabilities);
    global.addonTestUtils.setupMockAddonLoading(true, 'cpu');

    (store.get as jest.Mock).mockReturnValue({
      gpuPreference: ['cpu'],
    });

    const whisperFunc = await loadWhisperAddon('base');

    expect(whisperFunc).toBeDefined();
    expect(typeof whisperFunc).toBe('function');
  });

  test('should handle addon loading failures gracefully', async () => {
    const capabilities = global.addonTestUtils.createMockGPUCapabilities();
    global.addonTestUtils.setupMockGPUDetection(capabilities);

    // Mock addon loading to fail for Intel but succeed for NVIDIA
    global.addonTestUtils.mockDlopen.mockImplementation(
      (module: any, filename: string) => {
        if (filename.includes('openvino')) {
          throw new Error('Intel addon failed to load');
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
      selectedGPUId: 'intel_arc_a770',
      gpuPreference: ['intel', 'nvidia', 'cpu'],
    });

    const whisperFunc = await loadWhisperAddon('base');

    expect(whisperFunc).toBeDefined();
    expect(typeof whisperFunc).toBe('function');
  });

  test('should validate addon structure after loading', async () => {
    const capabilities = global.addonTestUtils.createMockGPUCapabilities();
    global.addonTestUtils.setupMockGPUDetection(capabilities);

    // Mock addon loading with invalid structure
    global.addonTestUtils.mockDlopen.mockImplementation(
      (module: any, filename: string) => {
        module.exports = {}; // Missing whisper function
      },
    );

    (store.get as jest.Mock).mockReturnValue({
      useOpenVINO: true,
      selectedGPUId: 'intel_arc_a770',
    });

    await expect(loadWhisperAddon('base')).rejects.toThrow();
  });

  test('should set OpenVINO environment variables correctly', async () => {
    const capabilities = global.addonTestUtils.createMockGPUCapabilities();
    global.addonTestUtils.setupMockGPUDetection(capabilities);
    global.addonTestUtils.setupMockAddonLoading(true, 'openvino');

    (store.get as jest.Mock).mockReturnValue({
      useOpenVINO: true,
      selectedGPUId: 'intel_arc_a770',
    });

    await loadWhisperAddon('base');

    expect(process.env.OPENVINO_DEVICE_ID).toBe('GPU0');
  });

  test('should handle addon file corruption or missing files', async () => {
    const capabilities = global.addonTestUtils.createMockGPUCapabilities();
    global.addonTestUtils.setupMockGPUDetection(capabilities);

    // Mock file system error
    global.addonTestUtils.mockDlopen.mockImplementation(() => {
      const error = new Error('ENOENT: no such file or directory');
      error.code = 'ENOENT';
      throw error;
    });

    (store.get as jest.Mock).mockReturnValue({
      useOpenVINO: true,
      selectedGPUId: 'intel_arc_a770',
    });

    // Should fall back to legacy addon loading
    const whisperFunc = await loadWhisperAddon('base');
    expect(whisperFunc).toBeDefined();
  });
});

describe('GPU Selection Logic', () => {
  test('should respect user manual GPU selection', async () => {
    const capabilities = global.addonTestUtils.createMockGPUCapabilities();
    global.addonTestUtils.setupMockGPUDetection(capabilities);
    global.addonTestUtils.setupMockAddonLoading(true);

    (store.get as jest.Mock).mockReturnValue({
      selectedGPUId: 'intel_xe_graphics', // User selected integrated Intel GPU
      gpuPreference: ['nvidia', 'intel', 'cpu'], // But NVIDIA is first in preference
    });

    await loadWhisperAddon('base');

    // Should use Intel GPU despite NVIDIA being first in preference
    expect(process.env.OPENVINO_DEVICE_ID).toBe('GPU1');
  });

  test('should follow automatic priority order (NVIDIA → Intel → Apple → CPU)', async () => {
    const capabilities = global.addonTestUtils.createMockGPUCapabilities();
    global.addonTestUtils.setupMockGPUDetection(capabilities);
    global.addonTestUtils.setupMockAddonLoading(true);

    (store.get as jest.Mock).mockReturnValue({
      selectedGPUId: 'auto',
      gpuPreference: ['nvidia', 'intel', 'apple', 'cpu'],
    });

    await loadWhisperAddon('base');

    // Should select NVIDIA first since it's available and first in priority
    expect(global.addonTestUtils.mockDlopen).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining('cuda'),
    );
  });

  test('should select best Intel GPU based on model requirements', async () => {
    const capabilities = global.addonTestUtils.createMockGPUCapabilities();
    capabilities.nvidia = false; // No NVIDIA available
    global.addonTestUtils.setupMockGPUDetection(capabilities);
    global.addonTestUtils.setupMockAddonLoading(true);

    (store.get as jest.Mock).mockReturnValue({
      selectedGPUId: 'auto',
      gpuPreference: ['intel', 'cpu'],
    });

    await loadWhisperAddon('large'); // Large model needs more memory

    // Should select discrete GPU over integrated for large model
    expect(process.env.OPENVINO_DEVICE_ID).toBe('GPU0'); // Discrete GPU
  });

  test('should validate GPU memory requirements for models', async () => {
    const capabilities = global.addonTestUtils.createMockGPUCapabilities();
    capabilities.nvidia = false;
    // Remove discrete GPU, only integrated available
    capabilities.intel = capabilities.intel.filter(
      (gpu) => gpu.type === 'integrated',
    );
    global.addonTestUtils.setupMockGPUDetection(capabilities);
    global.addonTestUtils.setupMockAddonLoading(true);

    (store.get as jest.Mock).mockReturnValue({
      selectedGPUId: 'auto',
      gpuPreference: ['intel', 'cpu'],
    });

    await loadWhisperAddon('large'); // Large model, but only integrated GPU available

    // Should fall back to CPU due to insufficient GPU memory
    expect(global.addonTestUtils.mockDlopen).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining('cpu'),
    );
  });

  test('should handle Intel GPU unavailable scenarios', async () => {
    const capabilities = global.addonTestUtils.createMockGPUCapabilities();
    capabilities.intel = []; // No Intel GPUs
    capabilities.nvidia = false;
    global.addonTestUtils.setupMockGPUDetection(capabilities);
    global.addonTestUtils.setupMockAddonLoading(true);

    (store.get as jest.Mock).mockReturnValue({
      useOpenVINO: true,
      selectedGPUId: 'auto',
      gpuPreference: ['intel', 'cpu'],
    });

    await loadWhisperAddon('base');

    // Should fall back to CPU
    expect(global.addonTestUtils.mockDlopen).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining('cpu'),
    );
  });

  test('should handle OpenVINO toolkit missing scenarios', async () => {
    const capabilities = global.addonTestUtils.createMockGPUCapabilities();
    capabilities.openvinoVersion = false; // OpenVINO not available
    global.addonTestUtils.setupMockGPUDetection(capabilities);
    global.addonTestUtils.setupMockAddonLoading(true);

    (store.get as jest.Mock).mockReturnValue({
      useOpenVINO: true,
      selectedGPUId: 'auto',
      gpuPreference: ['intel', 'nvidia', 'cpu'],
    });

    await loadWhisperAddon('base');

    // Should fall back to NVIDIA since OpenVINO unavailable
    expect(global.addonTestUtils.mockDlopen).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining('cuda'),
    );
  });

  test('should fallback through entire priority chain if needed', async () => {
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
          throw new Error(`${filename} failed to load`);
        }
      },
    );

    (store.get as jest.Mock).mockReturnValue({
      selectedGPUId: 'auto',
      gpuPreference: ['nvidia', 'intel', 'apple', 'cpu'],
    });

    const whisperFunc = await loadWhisperAddon('base');

    expect(whisperFunc).toBeDefined();
    expect(global.addonTestUtils.mockDlopen).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining('cpu'),
    );
  });
});
