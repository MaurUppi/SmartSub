/**
 * Comprehensive Hardware Detection Mocks
 * Provides controlled hardware environments for testing
 */

// Mock hardware detection to prevent real GPU detection in tests
const mockGPUCapabilities = {
  // CI/Test environment: No GPUs detected
  ciEnvironment: {
    nvidia: [],
    intel: [],
    apple: [],
    amd: [],
    totalGPUs: 0,
    recommendedGPU: null,
    detectionSuccess: true,
    detectionTimestamp: new Date(),
    openvinoVersion: null,
    cudaVersion: null,
    platform: process.platform,
    detectionErrors: [],
  },

  // Intel GPU environment
  intelEnvironment: {
    nvidia: [],
    intel: [
      {
        id: 'intel_arc_a770',
        name: 'Intel Arc A770',
        type: 'discrete',
        hasOpenVINO: true,
        memory: 16384,
        deviceId: 'GPU.0',
        vendor: 'intel',
        capabilities: {
          fp16: true,
          int8: true,
          dynamicShapes: true,
        },
      },
    ],
    apple: [],
    amd: [],
    totalGPUs: 1,
    recommendedGPU: {
      vendor: 'intel',
      id: 'intel_arc_a770',
      name: 'Intel Arc A770',
    },
    detectionSuccess: true,
    detectionTimestamp: new Date(),
    openvinoVersion: '2024.6.0',
    cudaVersion: null,
    platform: process.platform,
    detectionErrors: [],
  },

  // NVIDIA GPU environment
  nvidiaEnvironment: {
    nvidia: [
      {
        id: 'nvidia_rtx_4090',
        name: 'NVIDIA GeForce RTX 4090',
        type: 'discrete',
        memory: 24576,
        cudaVersion: '12.4.1',
        computeCapability: '8.9',
        vendor: 'nvidia',
        capabilities: {
          tensorCores: true,
          fp16: true,
          int8: true,
        },
      },
    ],
    intel: [],
    apple: [],
    amd: [],
    totalGPUs: 1,
    recommendedGPU: {
      vendor: 'nvidia',
      id: 'nvidia_rtx_4090',
      name: 'NVIDIA GeForce RTX 4090',
    },
    detectionSuccess: true,
    detectionTimestamp: new Date(),
    openvinoVersion: null,
    cudaVersion: '12.4.1',
    platform: process.platform,
    detectionErrors: [],
  },
};

// Export the default environment based on CI flag
const isCI = process.env.CI === 'true' || process.env.NODE_ENV === 'test';
export const defaultMockCapabilities = isCI
  ? mockGPUCapabilities.ciEnvironment
  : mockGPUCapabilities.ciEnvironment; // Always use CI environment for consistent tests

// Mock the hardware detection module
jest.mock('main/hardware/hardwareDetection', () => {
  const HardwareDetection = jest.fn().mockImplementation(() => ({
    detectAvailableGPUs: jest.fn().mockImplementation(async () => {
      // Return the same object to ensure caching tests work
      return defaultMockCapabilities;
    }),

    getGPUCapabilities: jest.fn().mockImplementation(async () => {
      return JSON.parse(JSON.stringify(defaultMockCapabilities));
    }),

    refreshDetection: jest.fn().mockImplementation(async () => {
      return JSON.parse(JSON.stringify(defaultMockCapabilities));
    }),

    addEventListener: jest.fn().mockImplementation((callback) => {
      // Simulate detection event
      setTimeout(() => {
        callback({
          type: 'detection_complete',
          data: defaultMockCapabilities,
        });
      }, 50);
    }),

    removeEventListener: jest.fn(),

    // Additional methods that tests might call
    validateGPU: jest.fn().mockReturnValue(true),
    selectRecommendedGPU: jest
      .fn()
      .mockReturnValue(defaultMockCapabilities.recommendedGPU),
    getDetectionErrors: jest.fn().mockReturnValue([]),
  }));

  return {
    HardwareDetection,
    detectAvailableGPUs: jest.fn().mockImplementation(async () => {
      return JSON.parse(JSON.stringify(defaultMockCapabilities));
    }),
  };
});

// Mock the specific hardware detection functions
jest.mock('main/hardware/hardwareDetection.ts', () => ({
  detectAvailableGPUs: jest.fn().mockImplementation(async () => {
    return JSON.parse(JSON.stringify(defaultMockCapabilities));
  }),
}));

// Mock OpenVINO detection
jest.mock('main/hardware/openvinoDetection', () => ({
  OpenVINODetector: jest.fn().mockImplementation(() => ({
    detectOpenVINO: jest.fn().mockImplementation(async () => ({
      isInstalled: defaultMockCapabilities.openvinoVersion !== null,
      version: defaultMockCapabilities.openvinoVersion || null,
      validationStatus: defaultMockCapabilities.openvinoVersion
        ? 'valid'
        : 'not_found',
      supportedDevices: defaultMockCapabilities.openvinoVersion
        ? ['CPU', 'GPU.0']
        : [],
      installPath: defaultMockCapabilities.openvinoVersion
        ? '/opt/intel/openvino_2024.6.0'
        : null,
      detectedAt: new Date().toISOString(),
    })),

    validateVersion: jest.fn().mockReturnValue(true),

    // Additional methods
    getCapabilities: jest.fn().mockReturnValue({
      pythonBinding: true,
      cppRuntime: true,
      modelFormats: ['FP32', 'FP16', 'INT8'],
    }),
  })),
}));

// Export utilities for tests that need to override behavior
export const hardwareMockUtils = {
  /**
   * Override the mock to return specific GPU configuration
   */
  setMockEnvironment: (environment: keyof typeof mockGPUCapabilities) => {
    const mockCapabilities = mockGPUCapabilities[environment];

    // Update all the mocked functions
    const HardwareDetection = require('main/hardware/hardwareDetection');
    if (HardwareDetection.detectAvailableGPUs) {
      HardwareDetection.detectAvailableGPUs.mockResolvedValue(
        JSON.parse(JSON.stringify(mockCapabilities)),
      );
    }
  },

  /**
   * Reset all mocks to default state
   */
  resetMocks: () => {
    jest.clearAllMocks();
  },

  /**
   * Get the current mock capabilities
   */
  getMockCapabilities: () => defaultMockCapabilities,

  /**
   * Create a custom mock environment
   */
  createCustomEnvironment: (
    overrides: Partial<typeof defaultMockCapabilities>,
  ) => {
    return {
      ...defaultMockCapabilities,
      ...overrides,
      detectionTimestamp: new Date(),
    };
  },
};

// Export default mock capabilities for tests
export { mockGPUCapabilities };
