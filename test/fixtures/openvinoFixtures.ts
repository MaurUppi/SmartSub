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
