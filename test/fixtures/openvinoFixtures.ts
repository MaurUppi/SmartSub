/**
 * OpenVINO Test Fixtures
 * Provides comprehensive test data for OpenVINO capability testing
 */

export const openVinoCapabilityFixtures = {
  /**
   * Full OpenVINO installation with Intel GPU support
   */
  fullInstallation: () => ({
    isInstalled: true,
    version: '2024.6.0',
    validationStatus: 'valid',
    supportedDevices: ['CPU', 'GPU.0', 'GPU.1'],
    modelFormats: ['FP32', 'FP16', 'INT8'],
    installPath: '/opt/intel/openvino_2024.6.0',
    detectedAt: new Date().toISOString(),
    pythonBinding: true,
    cppRuntime: true,
    environmentVariables: {
      INTEL_OPENVINO_DIR: '/opt/intel/openvino_2024.6.0',
      InferenceEngine_DIR: '/opt/intel/openvino_2024.6.0/runtime/cmake',
    },
  }),

  /**
   * OpenVINO not installed scenario
   */
  notInstalled: () => ({
    isInstalled: false,
    version: null,
    validationStatus: 'invalid',
    supportedDevices: [],
    modelFormats: [],
    installPath: null,
    detectedAt: new Date().toISOString(),
    pythonBinding: false,
    cppRuntime: false,
    environmentVariables: {},
  }),

  /**
   * Development mock scenario for testing
   */
  developmentMock: () => ({
    isInstalled: true,
    version: '2024.6.0-mock',
    validationStatus: 'valid',
    supportedDevices: ['CPU', 'GPU.0'],
    modelFormats: ['FP32', 'FP16'],
    installPath: '/mock/openvino',
    detectedAt: new Date().toISOString(),
    pythonBinding: true,
    cppRuntime: true,
    environmentVariables: {
      INTEL_OPENVINO_DIR: '/mock/openvino',
      OPENVINO_MOCK_MODE: 'true',
    },
  }),

  /**
   * CPU-only OpenVINO installation (no GPU support)
   */
  cpuOnly: () => ({
    isInstalled: true,
    version: '2024.6.0',
    validationStatus: 'valid',
    supportedDevices: ['CPU'],
    modelFormats: ['FP32', 'FP16', 'INT8'],
    installPath: '/opt/intel/openvino_2024.6.0',
    detectedAt: new Date().toISOString(),
    pythonBinding: true,
    cppRuntime: true,
    environmentVariables: {
      INTEL_OPENVINO_DIR: '/opt/intel/openvino_2024.6.0',
    },
  }),

  /**
   * Outdated OpenVINO version scenario
   */
  outdatedVersion: () => ({
    isInstalled: true,
    version: '2023.2.0',
    validationStatus: 'outdated',
    supportedDevices: ['CPU'],
    modelFormats: ['FP32', 'FP16'],
    installPath: '/opt/intel/openvino_2023.2.0',
    detectedAt: new Date().toISOString(),
    pythonBinding: true,
    cppRuntime: true,
    environmentVariables: {
      INTEL_OPENVINO_DIR: '/opt/intel/openvino_2023.2.0',
    },
  }),

  /**
   * Partial installation (missing components)
   */
  partialInstallation: () => ({
    isInstalled: true,
    version: '2024.6.0',
    validationStatus: 'partial',
    supportedDevices: ['CPU'],
    modelFormats: ['FP32'],
    installPath: '/opt/intel/openvino_2024.6.0',
    detectedAt: new Date().toISOString(),
    pythonBinding: false, // Missing Python bindings
    cppRuntime: true,
    environmentVariables: {
      INTEL_OPENVINO_DIR: '/opt/intel/openvino_2024.6.0',
    },
  }),
};

/**
 * Addon availability fixtures for different platform scenarios
 */
export const addonAvailabilityFixtures = {
  /**
   * Windows with NVIDIA GPU setup
   */
  windowsNvidiaSetup: () => ({
    platform: 'win32',
    arch: 'x64',
    available: [
      'addon-windows-cuda-1241-optimized.node',
      'addon-windows-cuda-1241-generic.node',
      'addon-windows-cuda-1220-optimized.node',
      'addon-windows-cuda-1220-generic.node',
      'addon-windows-cuda-1180-optimized.node',
      'addon-windows-cuda-1180-generic.node',
      'addon-windows-no-cuda.node',
    ],
    primary: 'addon-windows-cuda-1241-optimized.node',
    fallback: 'addon-windows-no-cuda.node',
    cudaVersion: '12.4.1',
  }),

  /**
   * Windows with Intel GPU setup
   */
  windowsIntelSetup: () => ({
    platform: 'win32',
    arch: 'x64',
    available: ['addon-windows-openvino.node', 'addon-windows-no-cuda.node'],
    primary: 'addon-windows-openvino.node',
    fallback: 'addon-windows-no-cuda.node',
    openvinoVersion: '2024.6.0',
  }),

  /**
   * Windows with AMD GPU (CPU-only)
   */
  windowsAmdSetup: () => ({
    platform: 'win32',
    arch: 'x64',
    available: ['addon-windows-no-cuda.node'],
    primary: 'addon-windows-no-cuda.node',
    fallback: null,
    cpuOnly: true,
  }),

  /**
   * macOS ARM64 with CoreML
   */
  macosArmSetup: () => ({
    platform: 'darwin',
    arch: 'arm64',
    available: [
      'addon-macos-arm64-coreml.node',
      'addon-macos-arm-openvino.node', // Optional for eGPU
    ],
    primary: 'addon-macos-arm64-coreml.node',
    fallback: null, // Strict mode - no fallback to generic
    strict: true,
    coremlSupported: true,
  }),

  /**
   * macOS Intel x64 with Intel GPU
   */
  macosIntelWithGpuSetup: () => ({
    platform: 'darwin',
    arch: 'x64',
    available: ['addon-macos-x86-openvino.node', 'addon-macos-x64.node'],
    primary: 'addon-macos-x86-openvino.node',
    fallback: 'addon-macos-x64.node',
    openvinoVersion: '2024.6.0',
  }),

  /**
   * macOS Intel x64 CPU-only
   */
  macosIntelCpuSetup: () => ({
    platform: 'darwin',
    arch: 'x64',
    available: ['addon-macos-x64.node'],
    primary: 'addon-macos-x64.node',
    fallback: null,
    cpuOnly: true,
  }),

  /**
   * Linux with Intel GPU
   */
  linuxIntelSetup: () => ({
    platform: 'linux',
    arch: 'x64',
    available: ['addon-linux-openvino.node'],
    primary: 'addon-linux-openvino.node',
    fallback: null,
    openvinoVersion: '2024.6.0',
  }),

  /**
   * CI environment (Ubuntu runner)
   */
  ciUbuntuSetup: () => ({
    platform: 'linux',
    arch: 'x64',
    available: ['addon-linux-openvino.node'],
    primary: 'addon-linux-openvino.node',
    fallback: null,
    isCI: true,
    runnerOS: 'Linux',
  }),
};

/**
 * GPU detection fixtures for different hardware scenarios
 */
export const gpuDetectionFixtures = {
  /**
   * Intel Arc discrete GPU
   */
  intelArcGpu: () => ({
    id: 'intel_arc_a770',
    name: 'Intel Arc A770',
    vendor: 'intel',
    type: 'discrete',
    memory: 16384,
    deviceId: 'GPU.0',
    hasOpenVINO: true,
    openvinoDevice: 'GPU.0',
    capabilities: {
      fp16: true,
      int8: true,
      dynamicShapes: true,
    },
  }),

  /**
   * Intel integrated GPU (Xe Graphics)
   */
  intelIntegratedGpu: () => ({
    id: 'intel_xe_graphics',
    name: 'Intel Xe Graphics',
    vendor: 'intel',
    type: 'integrated',
    memory: 4096,
    deviceId: 'GPU.0',
    hasOpenVINO: true,
    openvinoDevice: 'GPU.0',
    capabilities: {
      fp16: true,
      int8: false,
      dynamicShapes: true,
    },
  }),

  /**
   * NVIDIA RTX GPU
   */
  nvidiaRtxGpu: () => ({
    id: 'nvidia_rtx_4090',
    name: 'NVIDIA GeForce RTX 4090',
    vendor: 'nvidia',
    type: 'discrete',
    memory: 24576,
    cudaVersion: '12.4.1',
    computeCapability: '8.9',
    deviceId: 0,
    capabilities: {
      tensorCores: true,
      fp16: true,
      int8: true,
    },
  }),

  /**
   * AMD Radeon GPU (no acceleration support)
   */
  amdRadeonGpu: () => ({
    id: 'amd_rx_7900xtx',
    name: 'AMD Radeon RX 7900 XTX',
    vendor: 'amd',
    type: 'discrete',
    memory: 24576,
    deviceId: 0,
    noAcceleration: true,
    cpuOnlyFallback: true,
  }),

  /**
   * Apple Silicon GPU
   */
  appleSiliconGpu: () => ({
    id: 'apple_m2_max',
    name: 'Apple M2 Max',
    vendor: 'apple',
    type: 'integrated',
    memory: 32768,
    coremlSupported: true,
    neuralEngine: true,
    capabilities: {
      fp16: true,
      int8: true,
      ane: true,
    },
  }),
};

/**
 * Hybrid System Fixtures for Edge Case Testing
 * Supports Intel + NVIDIA, multi-GPU, and Windows-specific scenarios
 */
export const hybridSystemFixtures = {
  /**
   * Intel + NVIDIA Hybrid System: NVIDIA has priority
   */
  intelNvidiaHybrid: () => ({
    nvidia: true,
    intel: [
      {
        id: 'intel_xe_graphics',
        name: 'Intel Xe Graphics',
        vendor: 'intel',
        type: 'integrated',
        deviceId: 'GPU.1',
        priority: 2,
        memory: 'shared',
        capabilities: {
          openvinoCompatible: true,
          cudaCompatible: false,
        },
        powerEfficiency: 'excellent',
        performance: 'medium',
      },
    ],
    amd: [],
    intelAll: [
      {
        id: 'intel_xe_graphics',
        name: 'Intel Xe Graphics',
        vendor: 'intel',
        type: 'integrated',
        deviceId: 'GPU.1',
        priority: 2,
        memory: 'shared',
        capabilities: {
          openvinoCompatible: true,
          cudaCompatible: false,
        },
        powerEfficiency: 'excellent',
        performance: 'medium',
      },
    ],
    apple: false,
    cpu: true,
    openvinoVersion: '2024.6.0',
    capabilities: {
      multiGPU: true,
      hybridSystem: true,
    },
  }),

  /**
   * Multiple NVIDIA Cards: Use iGPU by default (RTX 3060 selected over RTX 4090)
   */
  multipleNvidiaCards: () => ({
    nvidia: true,
    intel: [],
    amd: [],
    intelAll: [],
    apple: false,
    cpu: true,
    openvinoVersion: false,
    nvidiaCards: [
      {
        id: 'nvidia_rtx_4090',
        name: 'NVIDIA GeForce RTX 4090',
        type: 'discrete',
        memory: 24576,
        cudaVersion: '12.4.1',
        deviceId: 0,
        priority: 1,
        performance: 'ultra',
        powerConsumption: 'high',
      },
      {
        id: 'nvidia_rtx_3060',
        name: 'NVIDIA GeForce RTX 3060',
        type: 'discrete',
        memory: 12288,
        cudaVersion: '12.4.1',
        deviceId: 1,
        priority: 2,
        performance: 'medium',
        powerConsumption: 'medium',
        isIGPU: true, // Default selection for multiple cards
      },
    ],
    capabilities: {
      multiGPU: true,
      hybridSystem: false,
    },
  }),

  /**
   * Intel iGPU + NVIDIA dGPU on Windows: NVIDIA has priority
   */
  windowsIntelNvidiaDGPU: () => ({
    nvidia: true,
    intel: [
      {
        id: 'intel_uhd_graphics',
        name: 'Intel UHD Graphics 770',
        vendor: 'intel',
        type: 'integrated',
        deviceId: 'GPU.1',
        memory: 'shared',
        capabilities: {
          openvinoCompatible: true,
          cudaCompatible: false,
        },
        powerEfficiency: 'excellent',
        performance: 'low',
      },
    ],
    amd: [],
    intelAll: [
      {
        id: 'intel_uhd_graphics',
        name: 'Intel UHD Graphics 770',
        vendor: 'intel',
        type: 'integrated',
        deviceId: 'GPU.1',
        memory: 'shared',
        capabilities: {
          openvinoCompatible: true,
          cudaCompatible: false,
        },
        powerEfficiency: 'excellent',
        performance: 'low',
      },
    ],
    apple: false,
    cpu: true,
    openvinoVersion: '2024.6.0',
    nvidiaCards: [
      {
        id: 'nvidia_rtx_3070',
        name: 'NVIDIA GeForce RTX 3070',
        type: 'discrete',
        memory: 8192,
        cudaVersion: '12.4.1',
        deviceId: 0,
        priority: 1,
        performance: 'high',
      },
    ],
    platform: 'win32',
    capabilities: {
      multiGPU: true,
      hybridSystem: true,
    },
  }),

  /**
   * CUDA Installation Failures: Automatic fallback to OpenVINO
   */
  cudaFailureScenarios: () => ({
    nvidia: true, // GPU present but CUDA fails
    intel: [
      {
        id: 'intel_arc_a770',
        name: 'Intel Arc A770',
        vendor: 'intel',
        type: 'discrete',
        deviceId: 'GPU.0',
        memory: 16384,
        capabilities: {
          openvinoCompatible: true,
          cudaCompatible: false,
        },
        powerEfficiency: 'good',
        performance: 'high',
      },
    ],
    amd: [],
    intelAll: [
      {
        id: 'intel_arc_a770',
        name: 'Intel Arc A770',
        vendor: 'intel',
        type: 'discrete',
        deviceId: 'GPU.0',
        memory: 16384,
        capabilities: {
          openvinoCompatible: true,
          cudaCompatible: false,
        },
        powerEfficiency: 'good',
        performance: 'high',
      },
    ],
    apple: false,
    cpu: true,
    openvinoVersion: '2024.6.0',
    cudaFailure: true,
    cudaError: 'CUDA runtime initialization failed',
    capabilities: {
      multiGPU: false,
      hybridSystem: true,
    },
  }),
};

/**
 * CUDA Failure Simulation Fixtures
 */
export const cudaFailureFixtures = {
  /**
   * CUDA runtime not found
   */
  cudaRuntimeNotFound: () => ({
    error: 'CUDA runtime not found',
    code: 'CUDA_ERROR_NO_DEVICE',
    hasCuda: false,
    hasIntelFallback: true,
    expectedFallback: 'openvino',
  }),

  /**
   * CUDA out of memory
   */
  cudaOutOfMemory: () => ({
    error: 'CUDA_ERROR_OUT_OF_MEMORY: out of memory',
    code: 'CUDA_ERROR_OUT_OF_MEMORY',
    hasCuda: true,
    hasIntelFallback: true,
    expectedFallback: 'openvino',
  }),

  /**
   * CUDA driver version mismatch
   */
  cudaDriverMismatch: () => ({
    error: 'CUDA driver version is insufficient for CUDA runtime version',
    code: 'CUDA_ERROR_INSUFFICIENT_DRIVER',
    hasCuda: false,
    hasIntelFallback: true,
    expectedFallback: 'openvino',
  }),

  /**
   * CUDA initialization failure
   */
  cudaInitializationFailure: () => ({
    error: 'CUDA initialization failed',
    code: 'CUDA_ERROR_UNKNOWN',
    hasCuda: false,
    hasIntelFallback: false,
    expectedFallback: 'cpu',
  }),
};

/**
 * Windows-Specific Test Scenarios
 */
export const windowsSpecificFixtures = {
  /**
   * Windows with Intel iGPU + NVIDIA dGPU
   */
  windowsHybridSystem: () => ({
    platform: 'win32',
    arch: 'x64',
    nvidia: true,
    intel: [
      {
        id: 'intel_uhd_graphics',
        name: 'Intel UHD Graphics 770',
        type: 'integrated',
        deviceId: 'GPU.1',
        memory: 'shared',
        capabilities: {
          openvinoCompatible: true,
          cudaCompatible: false,
        },
      },
    ],
    nvidiaCards: [
      {
        id: 'nvidia_rtx_3060_ti',
        name: 'NVIDIA GeForce RTX 3060 Ti',
        type: 'discrete',
        memory: 8192,
        cudaVersion: '12.4.1',
        deviceId: 0,
      },
    ],
    expectedPrimary: 'cuda',
    expectedFallback: 'openvino',
    availableAddons: [
      'addon-windows-cuda-1241-optimized.node',
      'addon-windows-openvino.node',
      'addon-windows-no-cuda.node',
    ],
  }),

  /**
   * Windows with AMD GPU (CPU-only fallback)
   */
  windowsAmdSystem: () => ({
    platform: 'win32',
    arch: 'x64',
    nvidia: false,
    intel: [],
    amd: [
      {
        id: 'amd_rx_6700xt',
        name: 'AMD Radeon RX 6700 XT',
        type: 'discrete',
        memory: 12288,
        vendor: 'amd',
      },
    ],
    expectedPrimary: 'cpu',
    expectedFallback: null,
    availableAddons: ['addon-windows-no-cuda.node'],
    fallbackChain: ['openvino', 'no-cuda', 'cpu'],
  }),
};
