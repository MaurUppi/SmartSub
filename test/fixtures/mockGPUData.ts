/**
 * Mock GPU Data Fixtures for OpenVINO Integration Testing
 *
 * This module provides comprehensive test fixtures for:
 * - Various Intel GPU device configurations
 * - OpenVINO capability scenarios
 * - Performance benchmark data
 * - Error simulation data
 */

import {
  GPUDevice,
  OpenVINOCapabilities,
} from '../../main/helpers/developmentMockSystem';

// Extend the GPUDevice interface to include AMD GPU CPU-only processing
export interface ExtendedGPUDevice extends GPUDevice {
  capabilities: GPUDevice['capabilities'] & {
    cpuOnlyProcessing?: boolean; // NEW: Indicates AMD GPU with CPU-only processing
  };
}

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

  /**
   * AMD GPUs for CPU-only processing testing (Requirements #4, #7, #8)
   */
  amdRadeonRX7900XT: (): GPUDevice => ({
    id: 'amd-radeon-rx-7900-xt',
    name: 'AMD Radeon RX 7900 XT',
    type: 'discrete',
    vendor: 'amd',
    deviceId: '7900',
    priority: 6,
    driverVersion: '23.12.1',
    memory: 20480, // 20GB GDDR6
    capabilities: {
      openvinoCompatible: true, // CPU processing with OpenVINO
      cudaCompatible: false,
      coremlCompatible: false,
      cpuOnlyProcessing: true, // NEW: AMD GPU CPU-only flag
    },
    powerEfficiency: 'good',
    performance: 'medium', // Medium due to CPU-only processing
  }),

  amdRadeonProW6800: (): GPUDevice => ({
    id: 'amd-radeon-pro-w6800',
    name: 'AMD Radeon Pro W6800',
    type: 'discrete',
    vendor: 'amd',
    deviceId: '6800',
    priority: 6,
    driverVersion: 'macOS Built-in',
    memory: 32768, // 32GB GDDR6
    capabilities: {
      openvinoCompatible: true, // CPU processing with OpenVINO
      cudaCompatible: false,
      coremlCompatible: false,
      cpuOnlyProcessing: true, // NEW: AMD GPU CPU-only flag
    },
    powerEfficiency: 'good',
    performance: 'medium', // Medium due to CPU-only processing
  }),

  amdRadeonRX6600: (): GPUDevice => ({
    id: 'amd-radeon-rx-6600',
    name: 'AMD Radeon RX 6600',
    type: 'discrete',
    vendor: 'amd',
    deviceId: '6600',
    priority: 5,
    driverVersion: 'AMDGPU 5.4',
    memory: 8192, // 8GB GDDR6
    capabilities: {
      openvinoCompatible: true, // CPU processing with OpenVINO
      cudaCompatible: false,
      coremlCompatible: false,
      cpuOnlyProcessing: true, // NEW: AMD GPU CPU-only flag
    },
    powerEfficiency: 'good',
    performance: 'medium', // Medium due to CPU-only processing
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
      'intel-iris-xe-graphics',
    ],
    runtimePath: '/opt/intel/openvino_2024/runtime',
    modelFormats: [
      'ONNX',
      'TensorFlow',
      'PyTorch',
      'OpenVINO IR',
      'PaddlePaddle',
    ],
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
    supportedDevices: ['mock-intel-arc-a770', 'mock-intel-xe-graphics'],
    runtimePath: '/mock/openvino/runtime',
    modelFormats: ['ONNX', 'OpenVINO IR'],
  }),
};

/**
 * Performance benchmark fixtures based on real-world testing
 * Enhanced with realistic speedup factors and memory usage patterns
 * Updated for Phase 2.1: Complete performance validation scenarios
 */
export const performanceBenchmarkFixtures = {
  /**
   * Intel Arc A770 performance characteristics
   * Expected 3-4x speedup over CPU baseline
   */
  arcA770Performance: () => ({
    processingTime: 120, // ms per second of audio
    memoryUsage: 2048, // MB
    powerConsumption: 120, // watts
    throughput: 95, // audio seconds processed per minute
    efficiency: 0.79, // audio seconds per watt
    speedupFactor: 3.5, // 3.5x faster than CPU
    realTimeRatio: 8.33, // Can process 8.33x real-time
    memoryPeak: 2560, // MB peak usage
    gpuUtilization: 85, // % GPU utilization
    thermalThrottling: false,
    modelCompatibility: {
      tiny: { speedup: 4.2, memory: 1024 },
      base: { speedup: 3.8, memory: 1536 },
      small: { speedup: 3.5, memory: 2048 },
      medium: { speedup: 3.2, memory: 2560 },
      large: { speedup: 3.0, memory: 3584 },
      'large-v2': { speedup: 2.9, memory: 3584 },
      'large-v3': { speedup: 2.8, memory: 3584 },
    },
  }),

  /**
   * Intel Arc A750 performance characteristics
   * Expected 2.8-3.5x speedup over CPU baseline
   */
  arcA750Performance: () => ({
    processingTime: 145,
    memoryUsage: 1536,
    powerConsumption: 100,
    throughput: 78,
    efficiency: 0.78,
    speedupFactor: 3.1, // 3.1x faster than CPU
    realTimeRatio: 6.9, // Can process 6.9x real-time
    memoryPeak: 2048, // MB peak usage
    gpuUtilization: 82, // % GPU utilization
    thermalThrottling: false,
    modelCompatibility: {
      tiny: { speedup: 3.8, memory: 1024 },
      base: { speedup: 3.4, memory: 1536 },
      small: { speedup: 3.1, memory: 2048 },
      medium: { speedup: 2.9, memory: 2560 },
      large: { speedup: 2.7, memory: 3584 },
      'large-v2': { speedup: 2.6, memory: 3584 },
      'large-v3': { speedup: 2.5, memory: 3584 },
    },
  }),

  /**
   * Intel Arc A580 performance characteristics
   * Expected 2.5-3x speedup over CPU baseline
   */
  arcA580Performance: () => ({
    processingTime: 175,
    memoryUsage: 1280,
    powerConsumption: 90,
    throughput: 65,
    efficiency: 0.72,
    speedupFactor: 2.7, // 2.7x faster than CPU
    realTimeRatio: 5.7, // Can process 5.7x real-time
    memoryPeak: 1792, // MB peak usage
    gpuUtilization: 78, // % GPU utilization
    thermalThrottling: false,
    modelCompatibility: {
      tiny: { speedup: 3.2, memory: 1024 },
      base: { speedup: 2.9, memory: 1280 },
      small: { speedup: 2.7, memory: 1792 },
      medium: { speedup: 2.5, memory: 2304 },
      large: { speedup: 2.3, memory: 3072 },
      'large-v2': { speedup: 2.2, memory: 3072 },
      'large-v3': { speedup: 2.1, memory: 3072 },
    },
  }),

  /**
   * Intel Xe integrated graphics performance
   * Expected 2-3x speedup over CPU baseline
   */
  xeGraphicsPerformance: () => ({
    processingTime: 280,
    memoryUsage: 1024,
    powerConsumption: 25,
    throughput: 42,
    efficiency: 1.68,
    speedupFactor: 2.4, // 2.4x faster than CPU
    realTimeRatio: 3.6, // Can process 3.6x real-time
    memoryPeak: 1536, // MB peak usage (shared memory)
    gpuUtilization: 90, // % GPU utilization (higher due to shared resources)
    thermalThrottling: false,
    modelCompatibility: {
      tiny: { speedup: 2.8, memory: 512 },
      base: { speedup: 2.6, memory: 768 },
      small: { speedup: 2.4, memory: 1024 },
      medium: { speedup: 2.2, memory: 1536 },
      large: { speedup: 0, memory: 0 }, // Not supported - insufficient memory
      'large-v2': { speedup: 0, memory: 0 }, // Not supported
      'large-v3': { speedup: 0, memory: 0 }, // Not supported
    },
  }),

  /**
   * Intel Iris Xe graphics performance
   * Expected 2.2-2.8x speedup over CPU baseline
   */
  irisXePerformance: () => ({
    processingTime: 320,
    memoryUsage: 896,
    powerConsumption: 20,
    throughput: 37,
    efficiency: 1.85,
    speedupFactor: 2.2, // 2.2x faster than CPU
    realTimeRatio: 3.1, // Can process 3.1x real-time
    memoryPeak: 1280, // MB peak usage (shared memory)
    gpuUtilization: 88, // % GPU utilization
    thermalThrottling: false,
    modelCompatibility: {
      tiny: { speedup: 2.6, memory: 512 },
      base: { speedup: 2.4, memory: 768 },
      small: { speedup: 2.2, memory: 1024 },
      medium: { speedup: 2.0, memory: 1280 },
      large: { speedup: 0, memory: 0 }, // Not supported
      'large-v2': { speedup: 0, memory: 0 }, // Not supported
      'large-v3': { speedup: 0, memory: 0 }, // Not supported
    },
  }),

  /**
   * Performance comparison baseline (CPU)
   * Intel Core i7 baseline for comparison
   */
  cpuBaselinePerformance: () => ({
    processingTime: 800,
    memoryUsage: 512,
    powerConsumption: 65,
    throughput: 15,
    efficiency: 0.23,
    speedupFactor: 1.0, // Baseline reference
    realTimeRatio: 1.25, // Slightly faster than real-time
    memoryPeak: 768, // MB peak usage
    cpuUtilization: 95, // % CPU utilization
    thermalThrottling: false,
    modelCompatibility: {
      tiny: { speedup: 1.0, memory: 512 },
      base: { speedup: 1.0, memory: 512 },
      small: { speedup: 1.0, memory: 768 },
      medium: { speedup: 1.0, memory: 1024 },
      large: { speedup: 1.0, memory: 1536 },
      'large-v2': { speedup: 1.0, memory: 1536 },
      'large-v3': { speedup: 1.0, memory: 1536 },
    },
  }),

  /**
   * AMD/NVIDIA comparison baseline for context
   */
  nvidiaRTX4090Performance: () => ({
    processingTime: 45, // Much faster due to CUDA optimization
    memoryUsage: 4096,
    powerConsumption: 400,
    throughput: 200,
    efficiency: 0.5,
    speedupFactor: 8.5, // 8.5x faster than CPU
    realTimeRatio: 22.2, // Can process 22.2x real-time
    memoryPeak: 6144, // MB peak usage
    gpuUtilization: 75, // % GPU utilization
    thermalThrottling: false,
    modelCompatibility: {
      tiny: { speedup: 12.0, memory: 2048 },
      base: { speedup: 10.5, memory: 3072 },
      small: { speedup: 9.2, memory: 4096 },
      medium: { speedup: 8.8, memory: 5120 },
      large: { speedup: 8.5, memory: 6144 },
      'large-v2': { speedup: 8.2, memory: 6144 },
      'large-v3': { speedup: 8.0, memory: 6144 },
    },
  }),

  /**
   * Intel Arc A380 performance characteristics
   * Expected 2.2-2.8x speedup over CPU baseline
   */
  arcA380Performance: () => ({
    processingTime: 205,
    memoryUsage: 1024,
    powerConsumption: 75,
    throughput: 55,
    efficiency: 0.73,
    speedupFactor: 2.4, // 2.4x faster than CPU
    realTimeRatio: 4.9, // Can process 4.9x real-time
    memoryPeak: 1536, // MB peak usage
    gpuUtilization: 80, // % GPU utilization
    thermalThrottling: false,
    modelCompatibility: {
      tiny: { speedup: 2.8, memory: 1024 },
      base: { speedup: 2.6, memory: 1024 },
      small: { speedup: 2.4, memory: 1536 },
      medium: { speedup: 2.2, memory: 2048 },
      large: { speedup: 0, memory: 0 }, // Not supported - insufficient memory
      'large-v2': { speedup: 0, memory: 0 }, // Not supported
      'large-v3': { speedup: 0, memory: 0 }, // Not supported
    },
  }),

  /**
   * Intel Iris Xe Max performance characteristics
   * Expected 2.5-3.2x speedup over CPU baseline
   */
  irisXeMaxPerformance: () => ({
    processingTime: 250,
    memoryUsage: 1536,
    powerConsumption: 50,
    throughput: 48,
    efficiency: 0.96,
    speedupFactor: 2.8, // 2.8x faster than CPU
    realTimeRatio: 4.0, // Can process 4.0x real-time
    memoryPeak: 2048, // MB peak usage
    gpuUtilization: 85, // % GPU utilization
    thermalThrottling: false,
    modelCompatibility: {
      tiny: { speedup: 3.2, memory: 1024 },
      base: { speedup: 3.0, memory: 1536 },
      small: { speedup: 2.8, memory: 2048 },
      medium: { speedup: 2.5, memory: 2560 },
      large: { speedup: 2.2, memory: 3584 },
      'large-v2': { speedup: 2.0, memory: 3584 },
      'large-v3': { speedup: 1.9, memory: 3584 },
    },
  }),

  /**
   * Cross-platform performance variations
   */
  windowsPlatformVariance: () => ({
    driverOverhead: 0.95, // 5% performance reduction due to driver overhead
    schedulingEfficiency: 0.98, // 2% reduction due to Windows scheduling
    memoryOverhead: 1.1, // 10% additional memory usage
    powerEfficiencyFactor: 0.92, // 8% less power efficient
  }),

  linuxPlatformVariance: () => ({
    driverOverhead: 1.0, // No significant driver overhead
    schedulingEfficiency: 1.02, // 2% improvement due to better scheduling
    memoryOverhead: 0.95, // 5% less memory usage
    powerEfficiencyFactor: 1.05, // 5% more power efficient
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
    devices: [intelGPUFixtures.nvidiaRTX4090(), intelGPUFixtures.appleM1()],
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
      {
        ...intelGPUFixtures.arcA770(),
        id: 'mock-' + intelGPUFixtures.arcA770().id,
      },
      {
        ...intelGPUFixtures.xeGraphics(),
        id: 'mock-' + intelGPUFixtures.xeGraphics().id,
      },
    ],
    openvinoCapabilities: openVinoCapabilityFixtures.developmentMock(),
    expectedPerformance: performanceBenchmarkFixtures.arcA770Performance(),
  },

  /**
   * Phase 2.1 Enhanced Cross-Platform Testing Scenarios
   */
  windows11ArcA770: {
    name: 'Windows 11 + Intel Arc A770',
    devices: [intelGPUFixtures.arcA770()],
    openvinoCapabilities: {
      ...openVinoCapabilityFixtures.fullInstallation(),
      runtimePath: 'C:\\Program Files\\Intel\\openvino_2024\\runtime',
      installationMethod: 'msi',
      driverVersion: '31.0.101.4887',
    },
    platformVariance: performanceBenchmarkFixtures.windowsPlatformVariance(),
    expectedPerformance: performanceBenchmarkFixtures.arcA770Performance(),
    platform: 'windows',
    osVersion: '10.0.22621', // Windows 11
  },

  windows10XeGraphics: {
    name: 'Windows 10 + Intel Xe Graphics',
    devices: [intelGPUFixtures.xeGraphics()],
    openvinoCapabilities: {
      ...openVinoCapabilityFixtures.fullInstallation(),
      runtimePath: 'C:\\Program Files\\Intel\\openvino_2024\\runtime',
      installationMethod: 'msi',
      driverVersion: '31.0.101.4887',
    },
    platformVariance: performanceBenchmarkFixtures.windowsPlatformVariance(),
    expectedPerformance: performanceBenchmarkFixtures.xeGraphicsPerformance(),
    platform: 'windows',
    osVersion: '10.0.19045', // Windows 10
  },

  ubuntu2204ArcA750: {
    name: 'Ubuntu 22.04 + Intel Arc A750',
    devices: [intelGPUFixtures.arcA750()],
    openvinoCapabilities: {
      ...openVinoCapabilityFixtures.fullInstallation(),
      runtimePath: '/opt/intel/openvino_2024/runtime',
      installationMethod: 'apt',
      driverVersion: '1.3.26918',
    },
    platformVariance: performanceBenchmarkFixtures.linuxPlatformVariance(),
    expectedPerformance: performanceBenchmarkFixtures.arcA750Performance(),
    platform: 'linux',
    osVersion: '5.15.0-91-generic',
  },

  ubuntu2004XeGraphics: {
    name: 'Ubuntu 20.04 + Intel Xe Graphics',
    devices: [intelGPUFixtures.xeGraphics()],
    openvinoCapabilities: {
      ...openVinoCapabilityFixtures.fullInstallation(),
      runtimePath: '/opt/intel/openvino_2024/runtime',
      installationMethod: 'pip',
      driverVersion: '1.3.25593',
    },
    platformVariance: performanceBenchmarkFixtures.linuxPlatformVariance(),
    expectedPerformance: performanceBenchmarkFixtures.xeGraphicsPerformance(),
    platform: 'linux',
    osVersion: '5.4.0-150-generic',
  },

  hybridSystemScenario: {
    name: 'Hybrid System (Arc A770 + Xe Graphics)',
    devices: [intelGPUFixtures.arcA770(), intelGPUFixtures.xeGraphics()],
    openvinoCapabilities: openVinoCapabilityFixtures.fullInstallation(),
    expectedPerformance: performanceBenchmarkFixtures.arcA770Performance(), // Should select discrete
    selectionLogic: 'discrete_preferred',
    multiGPUSupport: true,
  },

  driverCompatibilityTest: {
    name: 'Driver Compatibility Validation',
    testCases: [
      {
        driverVersion: '31.0.101.4887',
        compatibility: 'optimal',
        expectedSpeedup: 3.5,
        supportedModels: [
          'tiny',
          'base',
          'small',
          'medium',
          'large',
          'large-v2',
          'large-v3',
        ],
      },
      {
        driverVersion: '31.0.101.4502',
        compatibility: 'good',
        expectedSpeedup: 3.2,
        supportedModels: [
          'tiny',
          'base',
          'small',
          'medium',
          'large',
          'large-v2',
        ],
      },
      {
        driverVersion: '30.0.100.9955',
        compatibility: 'limited',
        expectedSpeedup: 2.5,
        supportedModels: ['tiny', 'base', 'small'],
      },
      {
        driverVersion: '27.20.100.9316',
        compatibility: 'incompatible',
        expectedSpeedup: 1.0,
        supportedModels: [],
      },
    ],
  },

  /**
   * AMD GPU CPU-only processing scenarios (Requirements #4, #7, #8)
   */
  amdWindowsCPUOnly: {
    name: 'AMD GPU Windows CPU-only Processing',
    devices: [intelGPUFixtures.amdRadeonRX7900XT()],
    openvinoCapabilities: openVinoCapabilityFixtures.fullInstallation(),
    expectedPerformance: null, // CPU processing performance
    processingMode: 'cpu-only',
    platform: 'windows',
    fallbackChain: ['openvino', 'no-cuda', 'cpu'],
  },

  amdMacOSCPUOnly: {
    name: 'AMD GPU macOS CPU-only Processing',
    devices: [intelGPUFixtures.amdRadeonProW6800()],
    openvinoCapabilities: openVinoCapabilityFixtures.fullInstallation(),
    expectedPerformance: null, // CPU processing performance
    processingMode: 'cpu-only',
    platform: 'darwin',
    fallbackChain: ['openvino', 'cpu'],
  },

  amdLinuxCPUOnly: {
    name: 'AMD GPU Linux CPU-only Processing',
    devices: [intelGPUFixtures.amdRadeonRX6600()],
    openvinoCapabilities: openVinoCapabilityFixtures.fullInstallation(),
    expectedPerformance: null, // CPU processing performance
    processingMode: 'cpu-only',
    platform: 'linux',
    fallbackChain: ['openvino', 'cpu'],
  },

  /**
   * CUDA version-specific testing scenarios (Requirement #2)
   */
  cudaVersionSpecific: {
    name: 'CUDA Version-Specific Addon Selection',
    testCases: [
      {
        cudaVersion: '12.41',
        expectedAddon: 'addon-windows-cuda-1241-generic.node',
        platform: 'windows',
      },
      {
        cudaVersion: '12.20',
        expectedAddon: 'addon-windows-cuda-1220-generic.node',
        platform: 'windows',
      },
      {
        cudaVersion: '11.80',
        expectedAddon: 'addon-windows-cuda-1180-generic.node',
        platform: 'windows',
      },
      {
        cudaVersion: '11.50',
        expectedAddon: 'addon-windows-cuda-1180-generic.node', // Fallback to oldest supported
        platform: 'windows',
      },
      {
        cudaVersion: '10.20',
        expectedAddon: 'addon-windows-no-cuda.node', // Too old, fallback
        platform: 'windows',
      },
    ],
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
  filterDevicesByVendor(
    devices: GPUDevice[],
    vendor: 'intel' | 'nvidia' | 'apple' | 'amd',
  ): GPUDevice[] {
    return devices.filter((device) => device.vendor === vendor);
  },

  /**
   * Filter devices by CPU-only processing capability (AMD GPUs)
   */
  filterCPUOnlyDevices(devices: any[]): any[] {
    return devices.filter(
      (device) => device.capabilities?.cpuOnlyProcessing === true,
    );
  },

  /**
   * Filter devices by OpenVINO compatibility
   */
  filterOpenVINOCompatibleDevices(devices: GPUDevice[]): GPUDevice[] {
    return devices.filter((device) => device.capabilities.openvinoCompatible);
  },

  /**
   * Sort devices by priority (highest first)
   */
  sortDevicesByPriority(devices: GPUDevice[]): GPUDevice[] {
    return [...devices].sort((a, b) => b.priority - a.priority);
  },

  /**
   * Apply platform-specific performance adjustments
   */
  applyPlatformVariance(baseMetrics: any, platformVariance: any): any {
    return {
      ...baseMetrics,
      processingTime:
        baseMetrics.processingTime / platformVariance.schedulingEfficiency,
      memoryUsage: baseMetrics.memoryUsage * platformVariance.memoryOverhead,
      speedupFactor:
        baseMetrics.speedupFactor * platformVariance.driverOverhead,
      powerConsumption:
        baseMetrics.powerConsumption / platformVariance.powerEfficiencyFactor,
    };
  },

  /**
   * Validate driver compatibility
   */
  validateDriverCompatibility(driverVersion: string): {
    compatible: boolean;
    compatibility: 'optimal' | 'good' | 'limited' | 'incompatible';
    supportedFeatures: string[];
    recommendedAction?: string;
  } {
    const versionPattern = /^(\d+)\.(\d+)\.(\d+)\.(\d+)/;
    const match = driverVersion.match(versionPattern);

    if (!match) {
      return {
        compatible: false,
        compatibility: 'incompatible',
        supportedFeatures: [],
        recommendedAction: 'Install valid Intel Graphics Driver',
      };
    }

    const majorVersion = parseInt(match[1]);
    const minorVersion = parseInt(match[2]);
    const patchVersion = parseInt(match[3]);
    const buildVersion = parseInt(match[4]);

    if (majorVersion >= 31) {
      if (buildVersion >= 4887) {
        return {
          compatible: true,
          compatibility: 'optimal',
          supportedFeatures: [
            'openvino',
            'hardware_acceleration',
            'all_models',
            'performance_optimization',
          ],
        };
      } else if (buildVersion >= 4502) {
        return {
          compatible: true,
          compatibility: 'good',
          supportedFeatures: [
            'openvino',
            'hardware_acceleration',
            'most_models',
          ],
        };
      } else {
        return {
          compatible: true,
          compatibility: 'good',
          supportedFeatures: ['openvino', 'hardware_acceleration'],
          recommendedAction:
            'Update to Intel Graphics Driver 31.0.101.4502 or newer for best performance',
        };
      }
    } else if (majorVersion >= 30) {
      return {
        compatible: true,
        compatibility: 'limited',
        supportedFeatures: ['basic_openvino', 'small_models'],
        recommendedAction:
          'Update to Intel Graphics Driver 31.0.101.4502 or newer',
      };
    }

    return {
      compatible: false,
      compatibility: 'incompatible',
      supportedFeatures: [],
      recommendedAction:
        'Update to Intel Graphics Driver 31.0.101.4502 or newer',
    };
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
  createCustomTestDevice(
    baseDevice: GPUDevice,
    overrides: Partial<GPUDevice>,
  ): GPUDevice {
    return {
      ...this.cloneFixture(baseDevice),
      ...overrides,
      id:
        overrides.id ||
        `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
  },
};

/**
 * Export organized fixture collections
 */
export const fixtures = {
  gpuDevices: intelGPUFixtures,
  openvinoCapabilities: openVinoCapabilityFixtures,
  openVinoCapabilityFixtures: openVinoCapabilityFixtures, // Add alias for backward compatibility
  performanceBenchmarks: performanceBenchmarkFixtures,
  errorSimulations: errorSimulationFixtures,
  testScenarios: testScenarioFixtures,
  utils: fixtureUtils,
};

// Default export for convenience
export default fixtures;
