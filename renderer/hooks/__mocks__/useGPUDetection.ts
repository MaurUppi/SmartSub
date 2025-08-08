/**
 * Mock implementation of useGPUDetection hook
 * Provides configurable GPU detection scenarios for testing
 */

import {
  GPUOption,
  GPUDetectionResult,
  UseGPUDetectionReturn,
  UseGPUDetectionOptions,
} from '../useGPUDetection';

// Default mock GPU options for testing
const mockGPUOptions: GPUOption[] = [
  {
    id: 'auto',
    displayName: 'Auto-detect (Recommended)',
    type: 'auto',
    status: 'available',
    performance: 'high',
    description: 'Automatically select the best available GPU for your system',
    powerEfficiency: 'excellent',
    estimatedSpeed: 'Variable',
    openvinoCompatible: true,
  },
  {
    id: 'cpu',
    displayName: 'CPU Processing',
    type: 'cpu',
    status: 'available',
    performance: 'medium',
    description: 'Use CPU for processing - slower but always available',
    powerEfficiency: 'excellent',
    estimatedSpeed: 'Baseline',
    openvinoCompatible: true,
  },
  {
    id: 'intel-arc-a770',
    displayName: 'Intel Arc A770',
    type: 'intel-discrete',
    status: 'available',
    performance: 'high',
    description:
      'High-performance discrete GPU with excellent OpenVINO support',
    driverVersion: '31.0.101.5381',
    memory: 16384,
    powerEfficiency: 'good',
    estimatedSpeed: '3-4x faster',
    openvinoCompatible: true,
  },
  {
    id: 'intel-xe-graphics',
    displayName: 'Intel Core Ultra Processors with Intel Arc Graphics',
    type: 'intel-integrated',
    status: 'available',
    performance: 'medium',
    description:
      'Integrated GPU with good OpenVINO performance and excellent power efficiency',
    driverVersion: '31.0.101.5381',
    memory: 'shared',
    powerEfficiency: 'excellent',
    estimatedSpeed: '2-3x faster',
    openvinoCompatible: true,
  },
];

// Global mock state for testing scenarios
let mockState = {
  gpus: mockGPUOptions,
  selectedGPU: mockGPUOptions[0],
  isDetecting: false,
  error: null as string | null,
  lastDetection: new Date(),
  refreshCalled: false,
  selectGPUCalled: false,
  clearErrorCalled: false,
};

// Test scenario configurations
const testScenarios = {
  default: () => mockGPUOptions,
  noGPUs: () => [mockGPUOptions[0], mockGPUOptions[1]], // Only auto and CPU
  detecting: () => mockGPUOptions,
  errorState: () => mockGPUOptions,
  noOpenVINOSupport: () =>
    mockGPUOptions.map((gpu) => ({ ...gpu, openvinoCompatible: false })),
  requiredSetup: () => [
    ...mockGPUOptions.slice(0, 2),
    {
      ...mockGPUOptions[2],
      status: 'requires-setup' as const,
    },
  ],
};

// Mock implementation
export const useGPUDetection = jest.fn(
  (options: UseGPUDetectionOptions = {}): UseGPUDetectionReturn => {
    const scenario = process.env.JEST_GPU_SCENARIO || 'default';
    const isDetecting = scenario === 'detecting' || mockState.isDetecting;
    const error =
      scenario === 'errorState' ? 'GPU detection failed' : mockState.error;
    const gpus =
      testScenarios[scenario as keyof typeof testScenarios]?.() ||
      mockGPUOptions;

    const detectedCount = gpus.length;
    const preferredGPU =
      gpus.find(
        (gpu) =>
          gpu.status === 'available' &&
          gpu.openvinoCompatible &&
          gpu.performance === 'high',
      ) ||
      gpus.find((gpu) => gpu.id === 'auto') ||
      null;

    const hasOpenVINOSupport = gpus.some(
      (gpu) => gpu.status === 'available' && gpu.openvinoCompatible,
    );

    const refreshGPUs = jest.fn(async () => {
      mockState.refreshCalled = true;
      mockState.isDetecting = true;
      // Simulate async detection
      await new Promise((resolve) => setTimeout(resolve, 100));
      mockState.isDetecting = false;
      mockState.lastDetection = new Date();
    });

    const selectGPU = jest.fn((gpuId: string) => {
      mockState.selectGPUCalled = true;
      const gpu = gpus.find((g) => g.id === gpuId);
      if (gpu) {
        mockState.selectedGPU = gpu;
        mockState.error = null;
      } else {
        mockState.error = `GPU with ID "${gpuId}" not found`;
      }
    });

    const clearError = jest.fn(() => {
      mockState.clearErrorCalled = true;
      mockState.error = null;
    });

    const getGPUById = jest.fn((id: string) => {
      return gpus.find((gpu) => gpu.id === id);
    });

    const validateGPUSelection = jest.fn((gpuId: string) => {
      const gpu = gpus.find((g) => g.id === gpuId);

      if (!gpu) {
        return { isValid: false, error: 'GPU not found' };
      }

      if (gpu.status === 'unavailable') {
        return { isValid: false, error: 'GPU is not available' };
      }

      return { isValid: true };
    });

    return {
      // State
      gpus,
      detectedCount,
      preferredGPU,
      hasOpenVINOSupport,
      isDetecting,
      lastDetection: mockState.lastDetection,
      error,
      selectedGPU: mockState.selectedGPU,

      // Actions
      refreshGPUs,
      selectGPU,
      clearError,
      getGPUById,
      validateGPUSelection,
    };
  },
);

// Test utilities for controlling mock behavior
export const mockGPUDetectionUtils = {
  // Reset mock state
  reset: () => {
    mockState = {
      gpus: mockGPUOptions,
      selectedGPU: mockGPUOptions[0],
      isDetecting: false,
      error: null,
      lastDetection: new Date(),
      refreshCalled: false,
      selectGPUCalled: false,
      clearErrorCalled: false,
    };
    jest.clearAllMocks();
  },

  // Set specific scenario
  setScenario: (scenarioName: keyof typeof testScenarios) => {
    process.env.JEST_GPU_SCENARIO = scenarioName;
  },

  // Set custom GPU list
  setGPUs: (gpus: GPUOption[]) => {
    mockState.gpus = gpus;
  },

  // Set selected GPU
  setSelectedGPU: (gpu: GPUOption | null) => {
    mockState.selectedGPU = gpu;
  },

  // Set detecting state
  setDetecting: (isDetecting: boolean) => {
    mockState.isDetecting = isDetecting;
  },

  // Set error state
  setError: (error: string | null) => {
    mockState.error = error;
  },

  // Get mock call information
  getMockCalls: () => ({
    refreshCalled: mockState.refreshCalled,
    selectGPUCalled: mockState.selectGPUCalled,
    clearErrorCalled: mockState.clearErrorCalled,
  }),

  // Get current mock state
  getState: () => ({ ...mockState }),
};

export default useGPUDetection;
