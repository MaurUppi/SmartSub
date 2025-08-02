/**
 * Mock GPU Data Fixtures for OpenVINO Integration Testing
 * 
 * This module provides comprehensive test fixtures for:
 * - Various Intel GPU device configurations
 * - OpenVINO capability scenarios
 * - Performance benchmark data
 * - Error simulation data
 */

import { GPUDevice, OpenVINOCapabilities } from '../../main/helpers/developmentMockSystem';

/**
 * Intel GPU device fixtures based on real hardware specifications
 */
export const intelGPUFixtures = {
  /**
   * Intel Arc A-series discrete GPUs
   */
  arcA770: (): GPUDevice => ({
    id: 'intel-arc-a770-16gb',
    name: 'Intel Arc A770 16GB',
    type: 'discrete',
    vendor: 'intel',
    deviceId: '56A0',
    priority: 8,
    driverVersion: '31.0.101.4887',
    memory: 16384, // 16GB GDDR6
    capabilities: {
      openvinoCompatible: true,
      cudaCompatible: false,
      coremlCompatible: false,
    },
    powerEfficiency: 'good',
    performance: 'high',
  }),

  arcA750: (): GPUDevice => ({
    id: 'intel-arc-a750-8gb',
    name: 'Intel Arc A750 8GB',
    type: 'discrete',
    vendor: 'intel',
    deviceId: '56A1',
    priority: 7,
    driverVersion: '31.0.101.4887',
    memory: 8192, // 8GB GDDR6
    capabilities: {
      openvinoCompatible: true,
      cudaCompatible: false,
      coremlCompatible: false,
    },
    powerEfficiency: 'good',
    performance: 'high',
  }),

  arcA580: (): GPUDevice => ({
    id: 'intel-arc-a580-8gb',
    name: 'Intel Arc A580 8GB',
    type: 'discrete',
    vendor: 'intel',
    deviceId: '56A2',
    priority: 6,
    driverVersion: '31.0.101.4887',
    memory: 8192, // 8GB GDDR6
    capabilities: {
      openvinoCompatible: true,
      cudaCompatible: false,
      coremlCompatible: false,
    },
    powerEfficiency: 'good',
    performance: 'medium',
  }),

  arcA380: (): GPUDevice => ({
    id: 'intel-arc-a380-6gb',
    name: 'Intel Arc A380 6GB',
    type: 'discrete',
    vendor: 'intel',
    deviceId: '56A5',
    priority: 5,
    driverVersion: '31.0.101.4887',
    memory: 6144, // 6GB GDDR6
    capabilities: {
      openvinoCompatible: true,
      cudaCompatible: false,
      coremlCompatible: false,
    },
    powerEfficiency: 'good',
    performance: 'medium',
  }),

  /**
   * Intel Xe integrated graphics
   */
  xeGraphics: (): GPUDevice => ({
    id: 'intel-xe-graphics',
    name: 'Intel Core Ultra Processors with Intel Arc Graphics.(Integrated graphic unit)',
    type: 'integrated',
    vendor: 'intel',
    deviceId: '9A49',
    priority: 4,
    driverVersion: '31.0.101.4887',
    memory: 'shared', // Shared system memory
    capabilities: {
      openvinoCompatible: true,
      cudaCompatible: false,
      coremlCompatible: false,
    },
    powerEfficiency: 'excellent',
    performance: 'medium',
  }),

  irisXe: (): GPUDevice => ({
    id: 'intel-iris-xe-graphics',
    name: 'Intel Core Ultra Processors with Intel Arc Graphics.(Integrated graphic unit)',
    type: 'integrated',
    vendor: 'intel',
    deviceId: '9A60',
    priority: 5,
    driverVersion: '31.0.101.4887',
    memory: 'shared', // Shared system memory
    capabilities: {
      openvinoCompatible: true,
      cudaCompatible: false,
      coremlCompatible: false,
    },
    powerEfficiency: 'excellent',
    performance: 'medium',
  }),

  irisXeMax: (): GPUDevice => ({
    id: 'intel-iris-xe-max-graphics',
    name: 'Intel Core Ultra Processors with Intel Arc Graphics.(Integrated graphic unit)',
    type: 'discrete',
    vendor: 'intel',
    deviceId: '4905',
    priority: 6,
    driverVersion: '31.0.101.4887',
    memory: 4096, // 4GB GDDR6
    capabilities: {
      openvinoCompatible: true,
      cudaCompatible: false,
      coremlCompatible: false,
    },
    powerEfficiency: 'good',
    performance: 'medium',
  }),

  /**
   * Legacy Intel graphics for compatibility testing
   */
  uhd630: (): GPUDevice => ({
    id: 'intel-uhd-graphics-630',
    name: 'Intel UHD Graphics 630',
    type: 'integrated',
    vendor: 'intel',
    deviceId: '3E92',
    priority: 2,
    driverVersion: '27.20.100.9316',
    memory: 'shared',
    capabilities: {
      openvinoCompatible: false, // Limited OpenVINO support
      cudaCompatible: false,
      coremlCompatible: false,
    },
    powerEfficiency: 'excellent',
    performance: 'low',
  }),

  /**
   * Non-Intel GPUs for comparison testing
   */
  nvidiaRTX4090: (): GPUDevice => ({
    id: 'nvidia-rtx-4090',
    name: 'NVIDIA GeForce RTX 4090',
    type: 'discrete',
    vendor: 'nvidia',
    deviceId: '2684',
    priority: 10,
    driverVersion: '536.23',
    memory: 24576, // 24GB GDDR6X
    capabilities: {
      openvinoCompatible: true,
      cudaCompatible: true,
      coremlCompatible: false,
    },
    powerEfficiency: 'moderate',
    performance: 'high',
  }),

  appleM1: (): GPUDevice => ({
    id: 'apple-m1-gpu',
    name: 'Apple M1 GPU',
    type: 'integrated',
    vendor: 'apple',
    deviceId: 'M1',
    priority: 8,
    driverVersion: '14.0.0',
    memory: 'shared',
    capabilities: {
      openvinoCompatible: false,
      cudaCompatible: false,
      coremlCompatible: true,
    },
    powerEfficiency: 'excellent',
    performance: 'high',
  }),
};

/**
 * OpenVINO capability fixtures for various scenarios
 */
export const openVinoCapabilityFixtures = {
  /**
   * Full OpenVINO installation with Intel GPU support
   */
  fullInstallation: (): OpenVINOCapabilities => ({
    isInstalled: true,
    version: '2024.6.0',
    supportedDevices: [
      'intel-arc-a770-16gb',
      'intel-arc-a750-8gb', 
      'intel-xe-graphics',
      'intel-iris-xe-graphics'
    ],
    runtimePath: '/opt/intel/openvino_2024/runtime',
    modelFormats: ['ONNX', 'TensorFlow', 'PyTorch', 'OpenVINO IR', 'PaddlePaddle'],
  }),

  /**
   * Limited OpenVINO installation
   */
  limitedInstallation: (): OpenVINOCapabilities => ({
    isInstalled: true,
    version: '2023.3.0',
    supportedDevices: ['intel-arc-a770-16gb'],
    runtimePath: '/opt/intel/openvino_2023/runtime',
    modelFormats: ['ONNX', 'OpenVINO IR'],
  }),

  /**
   * OpenVINO not installed
   */
  notInstalled: (): OpenVINOCapabilities => ({
    isInstalled: false,
    version: '',
    supportedDevices: [],
    modelFormats: [],
  }),

  /**
   * OpenVINO installed but no Intel GPU support
   */
  noIntelGPUSupport: (): OpenVINOCapabilities => ({
    isInstalled: true,
    version: '2024.6.0',
    supportedDevices: [],
    runtimePath: '/opt/intel/openvino_2024/runtime',
    modelFormats: ['ONNX', 'TensorFlow', 'PyTorch', 'OpenVINO IR'],
  }),

  /**
   * Development/mock OpenVINO capabilities
   */
  developmentMock: (): OpenVINOCapabilities => ({
    isInstalled: true,
    version: '2024.6.0-mock',
    supportedDevices: [
      'mock-intel-arc-a770',
      'mock-intel-xe-graphics'
    ],
    runtimePath: '/mock/openvino/runtime',
    modelFormats: ['ONNX', 'OpenVINO IR'],
  }),
};

/**
 * Performance benchmark fixtures based on real-world testing
 */
export const performanceBenchmarkFixtures = {
  /**
   * Intel Arc A770 performance characteristics
   */
  arcA770Performance: () => ({
    processingTime: 120, // ms per second of audio
    memoryUsage: 2048, // MB
    powerConsumption: 120, // watts
    throughput: 95, // audio seconds processed per minute
    efficiency: 0.79, // audio seconds per watt
  }),

  /**
   * Intel Arc A750 performance characteristics
   */
  arcA750Performance: () => ({
    processingTime: 145,
    memoryUsage: 1536,
    powerConsumption: 100,
    throughput: 78,
    efficiency: 0.78,
  }),

  /**
   * Intel Xe integrated graphics performance
   */
  xeGraphicsPerformance: () => ({
    processingTime: 280,
    memoryUsage: 1024,
    powerConsumption: 25,
    throughput: 42,
    efficiency: 1.68,
  }),

  /**
   * Performance comparison baseline (CPU)
   */
  cpuBaselinePerformance: () => ({
    processingTime: 800,
    memoryUsage: 512,
    powerConsumption: 65,
    throughput: 15,
    efficiency: 0.23,
  }),
};

/**
 * Error simulation fixtures for testing error handling
 */
export const errorSimulationFixtures = {
  /**
   * GPU detection errors
   */
  gpuDetectionErrors: {
    driverNotFound: new Error('Intel GPU driver not found'),
    deviceUnavailable: new Error('Intel GPU device is unavailable'),
    permissionDenied: new Error('Permission denied accessing GPU device'),
    hardwareFailure: new Error('GPU hardware failure detected'),
  },

  /**
   * OpenVINO errors
   */
  openVinoErrors: {
    notInstalled: new Error('OpenVINO runtime not found'),
    versionMismatch: new Error('OpenVINO version incompatible with Intel GPU'),
    licenseError: new Error('OpenVINO license validation failed'),
    runtimeCorrupted: new Error('OpenVINO runtime files corrupted'),
  },

  /**
   * Performance errors
   */
  performanceErrors: {
    outOfMemory: new Error('Insufficient GPU memory for operation'),
    thermalThrottling: new Error('GPU thermal throttling detected'),
    powerLimitExceeded: new Error('GPU power limit exceeded'),
    benchmarkTimeout: new Error('Performance benchmark timed out'),
  },
};

/**
 * Test scenario configurations
 */
export const testScenarioFixtures = {
  /**
   * Single Intel Arc GPU scenario
   */
  singleArcGPU: {
    name: 'Single Intel Arc GPU',
    devices: [intelGPUFixtures.arcA770()],
    openvinoCapabilities: openVinoCapabilityFixtures.fullInstallation(),
    expectedPerformance: performanceBenchmarkFixtures.arcA770Performance(),
  },

  /**
   * Multiple Intel GPU scenario
   */
  multipleIntelGPUs: {
    name: 'Multiple Intel GPUs',
    devices: [
      intelGPUFixtures.arcA770(),
      intelGPUFixtures.xeGraphics(),
      intelGPUFixtures.irisXe(),
    ],
    openvinoCapabilities: openVinoCapabilityFixtures.fullInstallation(),
    expectedPerformance: performanceBenchmarkFixtures.arcA770Performance(),
  },

  /**
   * Mixed GPU environment (Intel + NVIDIA)
   */
  mixedGPUEnvironment: {
    name: 'Mixed GPU Environment',
    devices: [
      intelGPUFixtures.arcA750(),
      intelGPUFixtures.xeGraphics(),
      intelGPUFixtures.nvidiaRTX4090(),
    ],
    openvinoCapabilities: openVinoCapabilityFixtures.fullInstallation(),
    expectedPerformance: performanceBenchmarkFixtures.arcA750Performance(),
  },

  /**
   * No Intel GPU scenario
   */
  noIntelGPU: {
    name: 'No Intel GPU Present',
    devices: [
      intelGPUFixtures.nvidiaRTX4090(),
      intelGPUFixtures.appleM1(),
    ],
    openvinoCapabilities: openVinoCapabilityFixtures.noIntelGPUSupport(),
    expectedPerformance: null,
  },

  /**
   * Legacy Intel GPU scenario
   */
  legacyIntelGPU: {
    name: 'Legacy Intel GPU',
    devices: [intelGPUFixtures.uhd630()],
    openvinoCapabilities: openVinoCapabilityFixtures.notInstalled(),
    expectedPerformance: null,
  },

  /**
   * macOS development scenario
   */
  macOSDevelopment: {
    name: 'macOS Development Environment',
    devices: [
      intelGPUFixtures.appleM1(),
      // Mock Intel devices for development
      { ...intelGPUFixtures.arcA770(), id: 'mock-' + intelGPUFixtures.arcA770().id },
      { ...intelGPUFixtures.xeGraphics(), id: 'mock-' + intelGPUFixtures.xeGraphics().id },
    ],
    openvinoCapabilities: openVinoCapabilityFixtures.developmentMock(),
    expectedPerformance: performanceBenchmarkFixtures.arcA770Performance(),
  },

  /**
   * Error simulation scenario
   */
  errorSimulation: {
    name: 'Error Simulation',
    devices: [],
    openvinoCapabilities: openVinoCapabilityFixtures.notInstalled(),
    expectedErrors: [
      errorSimulationFixtures.gpuDetectionErrors.driverNotFound,
      errorSimulationFixtures.openVinoErrors.notInstalled,
    ],
  },
};

/**
 * Utility functions for fixture data manipulation
 */
export const fixtureUtils = {
  /**
   * Create a deep copy of fixture data
   */
  cloneFixture<T>(fixture: T): T {
    return JSON.parse(JSON.stringify(fixture));
  },

  /**
   * Merge multiple GPU device arrays
   */
  mergeGPUDevices(...deviceArrays: GPUDevice[][]): GPUDevice[] {
    return deviceArrays.flat();
  },

  /**
   * Filter devices by vendor
   */
  filterDevicesByVendor(devices: GPUDevice[], vendor: 'intel' | 'nvidia' | 'apple'): GPUDevice[] {
    return devices.filter(device => device.vendor === vendor);
  },

  /**
   * Filter devices by OpenVINO compatibility
   */
  filterOpenVINOCompatibleDevices(devices: GPUDevice[]): GPUDevice[] {
    return devices.filter(device => device.capabilities.openvinoCompatible);
  },

  /**
   * Sort devices by priority (highest first)
   */
  sortDevicesByPriority(devices: GPUDevice[]): GPUDevice[] {
    return [...devices].sort((a, b) => b.priority - a.priority);
  },

  /**
   * Generate random performance variance
   */
  addPerformanceVariance(baseMetrics: any, variancePercent: number = 10): any {
    const variance = variancePercent / 100;
    const applyVariance = (value: number) => 
      value * (1 + (Math.random() - 0.5) * 2 * variance);

    return {
      ...baseMetrics,
      processingTime: applyVariance(baseMetrics.processingTime),
      memoryUsage: applyVariance(baseMetrics.memoryUsage),
      powerConsumption: applyVariance(baseMetrics.powerConsumption),
      throughput: applyVariance(baseMetrics.throughput),
    };
  },

  /**
   * Create test device with custom properties
   */
  createCustomTestDevice(baseDevice: GPUDevice, overrides: Partial<GPUDevice>): GPUDevice {
    return {
      ...this.cloneFixture(baseDevice),
      ...overrides,
      id: overrides.id || `custom-${Date.now()}`,
    };
  },
};

/**
 * Export organized fixture collections
 */
export const fixtures = {
  gpuDevices: intelGPUFixtures,
  openvinoCapabilities: openVinoCapabilityFixtures,
  performanceBenchmarks: performanceBenchmarkFixtures,
  errorSimulations: errorSimulationFixtures,
  testScenarios: testScenarioFixtures,
  utils: fixtureUtils,
};

// Default export for convenience
export default fixtures;