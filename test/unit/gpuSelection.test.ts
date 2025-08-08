/**
 * Test Suite: GPU Selection Logic
 * Comprehensive tests for intelligent GPU selection and user override capabilities
 *
 * Requirements tested:
 * - Intelligent GPU selection based on priority and capabilities
 * - User override functionality for manual GPU selection
 * - Model compatibility validation for different GPU types
 * - Memory requirement validation for models
 * - Fallback logic when preferred GPUs unavailable
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import {
  selectOptimalGPU,
  resolveSpecificGPU,
  selectBestIntelGPU,
  validateGPUMemory,
  validateModelSupport,
  getGPUSelectionConfig,
  logGPUSelection,
} from 'main/helpers/gpuSelector';

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

describe('GPU Selection Engine', () => {
  beforeEach(() => {
    global.addonTestUtils.resetAddonMocks();
    jest.clearAllMocks();
  });

  test('should select NVIDIA GPU when highest priority and available', () => {
    const capabilities = global.addonTestUtils.createMockGPUCapabilities();
    const priority = ['nvidia', 'intel', 'apple', 'cpu'];

    const result = selectOptimalGPU(priority, capabilities, 'base');

    expect(result.type).toBe('cuda');
    expect(result.displayName).toBe('NVIDIA CUDA GPU');
  });

  test('should select Intel GPU when NVIDIA unavailable', () => {
    const capabilities = global.addonTestUtils.createMockGPUCapabilities();
    capabilities.nvidia = false;
    const priority = ['nvidia', 'intel', 'apple', 'cpu'];

    const result = selectOptimalGPU(priority, capabilities, 'base');

    expect(result.type).toBe('openvino');
    expect(result.displayName).toContain('Intel');
    expect(result.deviceConfig).toBeDefined();
    expect(result.deviceConfig.deviceId).toBe('GPU0'); // Should select discrete GPU first
  });

  test('should select Apple CoreML when Intel unavailable', () => {
    const capabilities = global.addonTestUtils.createMockGPUCapabilities();
    capabilities.nvidia = false;
    capabilities.intel = [];
    capabilities.openvinoVersion = false;
    capabilities.apple = true;
    const priority = ['nvidia', 'intel', 'apple', 'cpu'];

    // Mock Apple Silicon detection
    const { isAppleSilicon } = require('main/helpers/utils');
    const { hasEncoderModel } = require('main/helpers/whisper');
    isAppleSilicon.mockReturnValue(true);
    hasEncoderModel.mockReturnValue(true);

    const result = selectOptimalGPU(priority, capabilities, 'base');

    expect(result.type).toBe('coreml');
    expect(result.displayName).toBe('Apple CoreML');
  });

  test('should fallback to CPU when all GPU options unavailable', () => {
    const capabilities = global.addonTestUtils.createMockGPUCapabilities();
    capabilities.nvidia = false;
    capabilities.intel = [];
    capabilities.apple = false;
    capabilities.openvinoVersion = false;
    const priority = ['nvidia', 'intel', 'apple', 'cpu'];

    const result = selectOptimalGPU(priority, capabilities, 'base');

    expect(result.type).toBe('cpu');
    expect(result.displayName).toBe('CPU Processing');
    expect(result.fallbackReason).toContain('unavailable');
  });

  test('should respect user-defined priority order', () => {
    const capabilities = global.addonTestUtils.createMockGPUCapabilities();
    const customPriority = ['intel', 'nvidia', 'cpu']; // Intel first

    const result = selectOptimalGPU(customPriority, capabilities, 'base');

    expect(result.type).toBe('openvino');
    expect(result.displayName).toContain('Intel');
  });

  test('should handle empty priority array gracefully', () => {
    const capabilities = global.addonTestUtils.createMockGPUCapabilities();
    const emptyPriority = [];

    const result = selectOptimalGPU(emptyPriority, capabilities, 'base');

    expect(result.type).toBe('cpu');
    expect(result.fallbackReason).toContain('unavailable');
  });
});

describe('User Override GPU Selection', () => {
  test('should resolve specific NVIDIA GPU by ID', () => {
    const capabilities = global.addonTestUtils.createMockGPUCapabilities();

    const result = resolveSpecificGPU('nvidia_rtx_3060', capabilities);

    expect(result).toBeDefined();
    expect(result.type).toBe('cuda');
    expect(result.displayName).toContain('User Selected');
  });

  test('should resolve specific Intel GPU by ID', () => {
    const capabilities = global.addonTestUtils.createMockGPUCapabilities();

    const result = resolveSpecificGPU('intel_arc_a770', capabilities);

    expect(result).toBeDefined();
    expect(result.type).toBe('openvino');
    expect(result.displayName).toContain('Intel Arc A770');
    expect(result.displayName).toContain('User Selected');
    expect(result.deviceConfig.deviceId).toBe('GPU0');
  });

  test('should resolve Apple GPU selection', () => {
    const capabilities = global.addonTestUtils.createMockGPUCapabilities();
    capabilities.apple = true;

    const result = resolveSpecificGPU('apple_m1_gpu', capabilities);

    expect(result).toBeDefined();
    expect(result.type).toBe('coreml');
    expect(result.displayName).toContain('User Selected');
  });

  test('should resolve CPU selection', () => {
    const capabilities = global.addonTestUtils.createMockGPUCapabilities();

    const result = resolveSpecificGPU('cpu_processing', capabilities);

    expect(result).toBeDefined();
    expect(result.type).toBe('cpu');
    expect(result.displayName).toContain('User Selected');
  });

  test('should return null for auto selection', () => {
    const capabilities = global.addonTestUtils.createMockGPUCapabilities();

    const result = resolveSpecificGPU('auto', capabilities);

    expect(result).toBeNull();
  });

  test('should return null for unavailable GPU ID', () => {
    const capabilities = global.addonTestUtils.createMockGPUCapabilities();
    capabilities.nvidia = false;

    const result = resolveSpecificGPU('nvidia_rtx_4090', capabilities);

    expect(result).toBeNull();
  });

  test('should handle Intel GPU ID when OpenVINO unavailable', () => {
    const capabilities = global.addonTestUtils.createMockGPUCapabilities();
    capabilities.openvinoVersion = false;

    const result = resolveSpecificGPU('intel_arc_a770', capabilities);

    expect(result).toBeNull();
  });
});

describe('Intel GPU Selection Logic', () => {
  test('should select discrete Intel GPU over integrated', () => {
    const intelGPUs = global.addonTestUtils.createMockGPUCapabilities().intel;

    const result = selectBestIntelGPU(intelGPUs, 'base');

    expect(result).toBeDefined();
    expect(result.type).toBe('discrete');
    expect(result.name).toBe('Intel Arc A770');
  });

  test('should select integrated GPU when discrete unavailable', () => {
    const intelGPUs = global.addonTestUtils.createMockGPUCapabilities().intel;
    const integratedOnly = intelGPUs.filter((gpu) => gpu.type === 'integrated');

    const result = selectBestIntelGPU(integratedOnly, 'base');

    expect(result).toBeDefined();
    expect(result.type).toBe('integrated');
    expect(result.name).toBe('Intel Xe Graphics');
  });

  test('should return null when no Intel GPUs available', () => {
    const result = selectBestIntelGPU([], 'base');

    expect(result).toBeNull();
  });

  test('should filter GPUs by memory requirements', () => {
    const intelGPUs = global.addonTestUtils.createMockGPUCapabilities().intel;
    // Mock insufficient memory scenario
    intelGPUs.forEach((gpu) => {
      if (gpu.type === 'discrete') {
        gpu.memory = 2048; // Only 2GB, insufficient for large model
      }
    });

    const result = selectBestIntelGPU(intelGPUs, 'large'); // Requires 4GB

    // Should select integrated GPU or return null if none suitable
    expect(result?.type).toBe('integrated'); // Integrated can handle large via shared memory
  });

  test('should sort by performance within same type', () => {
    const intelGPUs = [
      {
        ...global.addonTestUtils.createMockGPUCapabilities().intel[0],
        performance: 'medium',
      },
      {
        ...global.addonTestUtils.createMockGPUCapabilities().intel[0],
        id: 'intel_arc_a750',
        name: 'Intel Arc A750',
        performance: 'high',
      },
    ];

    const result = selectBestIntelGPU(intelGPUs, 'base');

    expect(result.name).toBe('Intel Arc A750'); // Higher performance selected
  });
});

describe('Model Compatibility Validation', () => {
  test('should validate standard model support on all addon types', () => {
    const standardModels = [
      'tiny',
      'base',
      'small',
      'medium',
      'large',
      'large-v2',
      'large-v3',
    ];
    const addonTypes = ['cuda', 'openvino', 'coreml', 'cpu'];

    standardModels.forEach((model) => {
      addonTypes.forEach((addonType) => {
        const result = validateModelSupport(addonType, model);
        expect(result).toBe(true);
      });
    });
  });

  test('should validate quantized model support', () => {
    const quantizedModels = ['base-q5_1', 'small-q8_0', 'medium-q5_1'];

    quantizedModels.forEach((model) => {
      const result = validateModelSupport('openvino', model);
      expect(result).toBe(true);
    });
  });

  test('should handle unknown models gracefully', () => {
    const unknownModel = 'custom-model-v1';

    const result = validateModelSupport('openvino', unknownModel);

    expect(result).toBe(true); // Should assume supported but log warning
  });
});

describe('GPU Memory Validation', () => {
  test('should validate discrete GPU memory for tiny model', () => {
    const discreteGPU =
      global.addonTestUtils.createMockGPUCapabilities().intel[0];

    const result = validateGPUMemory(discreteGPU, 'tiny');

    expect(result).toBe(true);
  });

  test('should validate discrete GPU memory for large model', () => {
    const discreteGPU =
      global.addonTestUtils.createMockGPUCapabilities().intel[0];
    discreteGPU.memory = 8192; // 8GB

    const result = validateGPUMemory(discreteGPU, 'large');

    expect(result).toBe(true);
  });

  test('should reject discrete GPU with insufficient memory', () => {
    const discreteGPU =
      global.addonTestUtils.createMockGPUCapabilities().intel[0];
    discreteGPU.memory = 2048; // Only 2GB

    const result = validateGPUMemory(discreteGPU, 'large'); // Requires 4GB

    expect(result).toBe(false);
  });

  test('should handle integrated GPU shared memory', () => {
    const integratedGPU =
      global.addonTestUtils.createMockGPUCapabilities().intel[1];

    const result = validateGPUMemory(integratedGPU, 'medium');

    expect(result).toBe(true); // Integrated GPUs can handle up to medium models
  });

  test('should reject large models on integrated GPU', () => {
    const integratedGPU =
      global.addonTestUtils.createMockGPUCapabilities().intel[1];

    const result = validateGPUMemory(integratedGPU, 'large');

    expect(result).toBe(false); // Large models not suitable for integrated GPUs
  });
});

describe('GPU Selection Configuration', () => {
  test('should get GPU selection config from store', () => {
    (store.get as jest.Mock).mockReturnValue({
      useCuda: true,
      useOpenVINO: false,
      selectedGPUId: 'nvidia_rtx_3060',
      gpuPreference: ['nvidia', 'intel'],
      gpuAutoDetection: true,
    });

    const config = getGPUSelectionConfig();

    expect(config.useCuda).toBe(true);
    expect(config.useOpenVINO).toBe(false);
    expect(config.selectedGPUId).toBe('nvidia_rtx_3060');
    expect(config.gpuPreference).toEqual(['nvidia', 'intel']);
    expect(config.gpuAutoDetection).toBe(true);
  });

  test('should provide defaults when settings unavailable', () => {
    (store.get as jest.Mock).mockReturnValue({});

    const config = getGPUSelectionConfig();

    expect(config.useCuda).toBe(false);
    expect(config.useOpenVINO).toBe(false);
    expect(config.selectedGPUId).toBe('auto');
    expect(config.gpuPreference).toEqual(['nvidia', 'intel', 'apple', 'cpu']);
    expect(config.gpuAutoDetection).toBe(true);
  });

  test('should handle null store response', () => {
    (store.get as jest.Mock).mockReturnValue(null);

    const config = getGPUSelectionConfig();

    expect(config).toBeDefined();
    expect(config.selectedGPUId).toBe('auto');
    expect(config.gpuAutoDetection).toBe(true);
  });
});

describe('GPU Selection Logging', () => {
  test('should log GPU selection decision with full context', () => {
    const addonInfo = global.addonTestUtils.createMockAddonInfo('openvino');
    const capabilities = global.addonTestUtils.createMockGPUCapabilities();

    (store.get as jest.Mock).mockReturnValue({
      useOpenVINO: true,
      selectedGPUId: 'intel_arc_a770',
    });

    expect(() => logGPUSelection(addonInfo, capabilities)).not.toThrow();
  });

  test('should log fallback decisions', () => {
    const addonInfo = {
      ...global.addonTestUtils.createMockAddonInfo('cpu'),
      fallbackReason: 'Intel GPU failed to load',
    };
    const capabilities = global.addonTestUtils.createMockGPUCapabilities();

    expect(() => logGPUSelection(addonInfo, capabilities)).not.toThrow();
  });
});
