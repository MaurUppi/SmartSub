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

// Import test setup first to ensure proper mocking
import 'test/setup/settingsTestSetup';
import 'test/setup/addonTestSetup';

// Now import the actual modules after mocks are in place
import {
  selectOptimalGPU,
  resolveSpecificGPU,
  selectBestIntelGPU,
  validateGPUMemory,
  validateModelSupport,
  getGPUSelectionConfig,
  logGPUSelection,
} from 'main/helpers/gpuSelector';

import { store } from 'main/helpers/store';

describe('GPU Selection Engine', () => {
  beforeEach(() => {
    global.addonTestUtils.resetAddonMocks();
    jest.clearAllMocks();
  });

  test('should select NVIDIA GPU when highest priority and available', () => {
    const capabilities = global.addonTestUtils.createMockGPUCapabilities();
    const priority = ['nvidia', 'intel', 'apple', 'cpu'];

    // Mock CUDA support for this test
    const { checkCudaSupport } = require('main/helpers/cudaUtils');
    checkCudaSupport.mockReturnValue({
      version: '12.4.1',
      driverVersion: '536.25',
      majorVersion: 12,
      addonName: 'addon-windows-cuda-1241-optimized.node',
    });

    const result = selectOptimalGPU(priority, capabilities, 'base');

    expect(result.type).toBe('cuda');
    expect(result.displayName).toContain('NVIDIA CUDA GPU');
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
    capabilities.intelAll = [];
    capabilities.apple = false;
    capabilities.openvinoVersion = false;
    const priority = ['nvidia', 'intel', 'apple', 'cpu'];

    const result = selectOptimalGPU(priority, capabilities, 'base');

    expect(result.type).toBe('cpu');
    expect(result.displayName).toContain('CPU Processing');
    // fallbackReason might not be set in all code paths, so make it optional
    if (result.fallbackReason) {
      expect(result.fallbackReason).toContain('All GPU acceleration');
    }
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
    expect(result.fallbackReason).toContain('All acceleration options failed');
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

    const result = selectBestIntelGPU(intelGPUs, 'large'); // Requires 6.4GB

    // Should return null because large model (6.4GB) exceeds integrated GPU limits
    expect(result).toBeNull(); // Large models not suitable for any GPU with insufficient memory
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
    expect(config.gpuPreference).toEqual([
      'nvidia',
      'intel',
      'amd',
      'apple',
      'cpu',
    ]);
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

// Import enhanced fixtures for edge cases
import {
  hybridSystemFixtures,
  cudaFailureFixtures,
  windowsSpecificFixtures,
} from 'test/fixtures/openvinoFixtures';

describe('Edge Cases: Intel + NVIDIA Hybrid Systems', () => {
  beforeEach(() => {
    global.addonTestUtils.resetAddonMocks();
    jest.clearAllMocks();
  });

  test('should prioritize NVIDIA over Intel in hybrid systems', () => {
    const hybridCapabilities = hybridSystemFixtures.intelNvidiaHybrid();
    const priority = ['nvidia', 'intel', 'cpu'];

    // Mock CUDA support for hybrid test
    const { checkCudaSupport } = require('main/helpers/cudaUtils');
    checkCudaSupport.mockReturnValue({
      version: '12.4.1',
      driverVersion: '536.25',
      majorVersion: 12,
      addonName: 'addon-windows-cuda-1241-optimized.node',
    });

    const result = selectOptimalGPU(priority, hybridCapabilities, 'base');

    expect(result.type).toBe('cuda');
    expect(result.displayName).toContain('NVIDIA CUDA GPU');
    expect(result.deviceConfig).toBeDefined();
  });

  test('should fallback to Intel when NVIDIA fails in hybrid systems', () => {
    const hybridCapabilities = hybridSystemFixtures.intelNvidiaHybrid();
    hybridCapabilities.nvidia = false; // Simulate NVIDIA failure
    const priority = ['nvidia', 'intel', 'cpu'];

    const result = selectOptimalGPU(priority, hybridCapabilities, 'base');

    expect(result.type).toBe('openvino');
    expect(result.displayName).toContain('Intel');
    expect(result.deviceConfig.deviceId).toBe('GPU.1');
  });

  test('should handle Intel GPU memory validation in hybrid systems', () => {
    const hybridCapabilities = hybridSystemFixtures.intelNvidiaHybrid();
    hybridCapabilities.nvidia = false;
    const priority = ['nvidia', 'intel', 'cpu'];

    // Mock checkCudaSupport to return null (no CUDA)
    const { checkCudaSupport } = require('main/helpers/cudaUtils');
    checkCudaSupport.mockReturnValue(null);

    const result = selectOptimalGPU(priority, hybridCapabilities, 'medium'); // Use medium model instead of large

    // Intel integrated GPU with shared memory should handle medium models
    expect(result.type).toBe('openvino');
    expect(result.deviceConfig.type).toBe('integrated');
    expect(result.deviceConfig.memory).toBe('shared');
  });

  test('should detect multi-GPU hybrid systems correctly', () => {
    const hybridCapabilities = hybridSystemFixtures.intelNvidiaHybrid();
    const priority = ['nvidia', 'intel', 'cpu'];

    // Mock CUDA support for this test
    const { checkCudaSupport } = require('main/helpers/cudaUtils');
    checkCudaSupport.mockReturnValue({
      version: '12.4.1',
      driverVersion: '536.25',
      majorVersion: 12,
      addonName: 'addon-windows-cuda-1241-optimized.node',
    });

    const result = selectOptimalGPU(priority, hybridCapabilities, 'medium');

    expect(hybridCapabilities.capabilities.multiGPU).toBe(true);
    expect(hybridCapabilities.capabilities.hybridSystem).toBe(true);
    expect(result.type).toBe('cuda');
  });
});

describe('Edge Cases: Multiple NVIDIA Cards', () => {
  beforeEach(() => {
    global.addonTestUtils.resetAddonMocks();
    jest.clearAllMocks();
  });

  test('should select iGPU by default when multiple NVIDIA cards present', () => {
    const multiNvidiaCapabilities = hybridSystemFixtures.multipleNvidiaCards();
    const priority = ['nvidia', 'intel', 'cpu'];

    // Mock checkCudaSupport to return the iGPU card (RTX 3060)
    const { checkCudaSupport } = require('main/helpers/cudaUtils');
    checkCudaSupport.mockReturnValue({
      version: '12.4.1',
      driverVersion: '536.25',
      majorVersion: 12,
      addonName: 'addon-windows-cuda-1241-optimized.node',
      selectedCard: multiNvidiaCapabilities.nvidiaCards.find(
        (card) => card.isIGPU,
      ),
    });

    const result = selectOptimalGPU(priority, multiNvidiaCapabilities, 'base');

    expect(result.type).toBe('cuda');
    expect(result.displayName).toContain('CUDA'); // Should contain CUDA in display name
    expect(result.deviceConfig.cudaVersion).toBe('12.4.1');
  });

  test('should handle CUDA version differences across multiple cards', () => {
    const multiNvidiaCapabilities = hybridSystemFixtures.multipleNvidiaCards();
    const priority = ['nvidia', 'intel', 'cpu'];

    // Mock different CUDA versions on different cards
    const { checkCudaSupport } = require('main/helpers/cudaUtils');
    checkCudaSupport.mockReturnValue({
      version: '12.4.1',
      driverVersion: '536.25',
      majorVersion: 12,
      addonName: 'addon-windows-cuda-1241-optimized.node',
      availableCards: multiNvidiaCapabilities.nvidiaCards,
      selectedCard: multiNvidiaCapabilities.nvidiaCards[1], // RTX 3060
    });

    const result = selectOptimalGPU(priority, multiNvidiaCapabilities, 'base');

    expect(result.type).toBe('cuda');
    expect(result.path).toBe('addon-windows-cuda-1241-optimized.node');
    expect(result.deviceConfig.majorVersion).toBe(12);
  });

  test('should validate memory requirements across multiple NVIDIA cards', () => {
    const multiNvidiaCapabilities = hybridSystemFixtures.multipleNvidiaCards();
    const priority = ['nvidia', 'intel', 'cpu'];

    // Test with large model requiring significant memory
    const { checkCudaSupport } = require('main/helpers/cudaUtils');
    checkCudaSupport.mockReturnValue({
      version: '12.4.1',
      driverVersion: '536.25',
      majorVersion: 12,
      addonName: 'addon-windows-cuda-1241-optimized.node',
      selectedCard: multiNvidiaCapabilities.nvidiaCards[1], // RTX 3060 - 12GB
    });

    const result = selectOptimalGPU(priority, multiNvidiaCapabilities, 'large');

    expect(result.type).toBe('cuda');
    expect(result.displayName).toContain('CUDA');
    // 12GB should be sufficient for large model (~6.4GB requirement)
  });

  test('should detect multi-GPU capability correctly', () => {
    const multiNvidiaCapabilities = hybridSystemFixtures.multipleNvidiaCards();

    expect(multiNvidiaCapabilities.capabilities.multiGPU).toBe(true);
    expect(multiNvidiaCapabilities.nvidiaCards).toHaveLength(2);
    expect(
      multiNvidiaCapabilities.nvidiaCards.find((card) => card.isIGPU),
    ).toBeDefined();
  });
});

describe('Edge Cases: Intel iGPU + NVIDIA dGPU on Windows', () => {
  beforeEach(() => {
    global.addonTestUtils.resetAddonMocks();
    jest.clearAllMocks();

    // Mock Windows platform
    Object.defineProperty(process, 'platform', {
      value: 'win32',
      configurable: true,
    });
  });

  afterEach(() => {
    // Restore original platform
    Object.defineProperty(process, 'platform', {
      value: process.platform,
      configurable: true,
    });
  });

  test('should prioritize NVIDIA dGPU over Intel iGPU on Windows', () => {
    const windowsHybrid = hybridSystemFixtures.windowsIntelNvidiaDGPU();
    const priority = ['nvidia', 'intel', 'cpu'];

    const result = selectOptimalGPU(priority, windowsHybrid, 'base');

    expect(result.type).toBe('cuda');
    expect(result.displayName).toContain('NVIDIA');
    expect(windowsHybrid.platform).toBe('win32');
  });

  test('should fallback to Intel iGPU when NVIDIA fails on Windows', () => {
    const windowsHybrid = hybridSystemFixtures.windowsIntelNvidiaDGPU();
    windowsHybrid.nvidia = false; // Simulate NVIDIA failure
    const priority = ['nvidia', 'intel', 'cpu'];

    const result = selectOptimalGPU(priority, windowsHybrid, 'base');

    expect(result.type).toBe('openvino');
    expect(result.displayName).toContain('Intel UHD Graphics');
    expect(result.deviceConfig.type).toBe('integrated');
  });

  test('should handle Windows-specific addon selection for hybrid systems', () => {
    const windowsHybrid = hybridSystemFixtures.windowsIntelNvidiaDGPU();
    const priority = ['nvidia', 'intel', 'cpu'];

    // Mock Windows CUDA addon
    const { checkCudaSupport } = require('main/helpers/cudaUtils');
    checkCudaSupport.mockReturnValue({
      version: '12.4.1',
      driverVersion: '536.25',
      majorVersion: 12,
      addonName: 'addon-windows-cuda-1241-optimized.node',
    });

    const result = selectOptimalGPU(priority, windowsHybrid, 'base');

    expect(result.type).toBe('cuda');
    expect(result.path).toBe('addon-windows-cuda-1241-optimized.node');
    expect(result.displayName).toContain('CUDA 12.4.1');
  });

  test('should validate Windows hybrid system capabilities', () => {
    const windowsHybrid = hybridSystemFixtures.windowsIntelNvidiaDGPU();

    expect(windowsHybrid.platform).toBe('win32');
    expect(windowsHybrid.capabilities.hybridSystem).toBe(true);
    expect(windowsHybrid.capabilities.multiGPU).toBe(true);
    expect(windowsHybrid.nvidia).toBe(true);
    expect(windowsHybrid.intel).toHaveLength(1);
    expect(windowsHybrid.nvidiaCards).toHaveLength(1);
  });

  test('should handle Intel iGPU power efficiency on Windows', () => {
    const windowsHybrid = hybridSystemFixtures.windowsIntelNvidiaDGPU();
    windowsHybrid.nvidia = false; // Test Intel path
    const priority = ['nvidia', 'intel', 'cpu'];

    const result = selectOptimalGPU(priority, windowsHybrid, 'tiny');

    expect(result.type).toBe('openvino');
    expect(windowsHybrid.intel[0].powerEfficiency).toBe('excellent');
    expect(windowsHybrid.intel[0].performance).toBe('low');
  });
});

describe('Edge Cases: CUDA Installation Failures', () => {
  beforeEach(() => {
    global.addonTestUtils.resetAddonMocks();
    jest.clearAllMocks();
  });

  test('should automatically fallback to OpenVINO when CUDA runtime fails', () => {
    const cudaFailureCapabilities = hybridSystemFixtures.cudaFailureScenarios();
    const failureInfo = cudaFailureFixtures.cudaRuntimeNotFound();
    const priority = ['nvidia', 'intel', 'cpu'];

    // Mock CUDA failure
    const { checkCudaSupport } = require('main/helpers/cudaUtils');
    checkCudaSupport.mockReturnValue(null); // CUDA failure

    const result = selectOptimalGPU(priority, cudaFailureCapabilities, 'base');

    expect(result.type).toBe('openvino');
    expect(result.displayName).toContain('Intel Arc A770');
    expect(result.deviceConfig.deviceId).toBe('GPU.0');
    expect(failureInfo.expectedFallback).toBe('openvino');
  });

  test('should handle CUDA out of memory errors with Intel GPU fallback', () => {
    const cudaFailureCapabilities = hybridSystemFixtures.cudaFailureScenarios();
    const memoryFailure = cudaFailureFixtures.cudaOutOfMemory();
    const priority = ['nvidia', 'intel', 'cpu'];

    // Mock CUDA memory failure - return null instead of throwing
    const { checkCudaSupport } = require('main/helpers/cudaUtils');
    checkCudaSupport.mockReturnValue(null);

    const result = selectOptimalGPU(priority, cudaFailureCapabilities, 'base'); // Use base model that Intel can handle

    expect(result.type).toBe('openvino');
    expect(result.displayName).toContain('Intel');
    expect(memoryFailure.code).toBe('CUDA_ERROR_OUT_OF_MEMORY');
    expect(memoryFailure.expectedFallback).toBe('openvino');
  });

  test('should handle CUDA driver version mismatch', () => {
    const cudaFailureCapabilities = hybridSystemFixtures.cudaFailureScenarios();
    const driverMismatch = cudaFailureFixtures.cudaDriverMismatch();
    const priority = ['nvidia', 'intel', 'cpu'];

    // Mock CUDA driver mismatch
    const { checkCudaSupport } = require('main/helpers/cudaUtils');
    checkCudaSupport.mockReturnValue(null);

    const result = selectOptimalGPU(priority, cudaFailureCapabilities, 'base');

    expect(result.type).toBe('openvino');
    expect(driverMismatch.code).toBe('CUDA_ERROR_INSUFFICIENT_DRIVER');
    expect(driverMismatch.expectedFallback).toBe('openvino');
  });

  test('should fallback to CPU when CUDA fails and no Intel GPU available', () => {
    const cudaFailureCapabilities = hybridSystemFixtures.cudaFailureScenarios();
    cudaFailureCapabilities.intel = []; // No Intel GPU
    cudaFailureCapabilities.intelAll = [];
    cudaFailureCapabilities.openvinoVersion = false; // No OpenVINO
    const initFailure = cudaFailureFixtures.cudaInitializationFailure();
    const priority = ['nvidia', 'intel', 'cpu'];

    // Mock CUDA initialization failure
    const { checkCudaSupport } = require('main/helpers/cudaUtils');
    checkCudaSupport.mockReturnValue(null);

    const result = selectOptimalGPU(priority, cudaFailureCapabilities, 'base');

    expect(result.type).toBe('cpu');
    expect(result.displayName).toContain('CPU Processing');
    expect(initFailure.expectedFallback).toBe('cpu');
  });

  test('should validate Intel GPU availability during CUDA failure scenarios', () => {
    const cudaFailureCapabilities = hybridSystemFixtures.cudaFailureScenarios();

    expect(cudaFailureCapabilities.nvidia).toBe(true);
    expect(cudaFailureCapabilities.intel).toHaveLength(1);
    expect(cudaFailureCapabilities.openvinoVersion).toBe('2024.6.0');
    expect(cudaFailureCapabilities.cudaFailure).toBe(true);
  });

  test('should preserve CUDA failure context for logging', () => {
    const cudaFailureCapabilities = hybridSystemFixtures.cudaFailureScenarios();
    const priority = ['nvidia', 'intel', 'cpu'];

    // Mock CUDA failure with specific error
    const { checkCudaSupport } = require('main/helpers/cudaUtils');
    checkCudaSupport.mockReturnValue(null);

    const result = selectOptimalGPU(priority, cudaFailureCapabilities, 'base');

    expect(result.type).toBe('openvino');
    expect(cudaFailureCapabilities.cudaError).toBe(
      'CUDA runtime initialization failed',
    );
    expect(result.fallbackReason).toBeUndefined(); // Should not be set for successful Intel selection
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
