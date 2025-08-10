/**
 * GPU Type Definitions for Intel OpenVINO Integration
 *
 * Comprehensive type definitions for GPU detection, enumeration,
 * and compatibility validation across Windows, Linux, and macOS.
 */

// Core GPU device interface
export interface GPUDevice {
  id: string;
  name: string;
  type: 'discrete' | 'integrated';
  vendor: 'nvidia' | 'intel' | 'apple' | 'amd';
  deviceId: string;
  priority: number;
  driverVersion: string;
  memory: number | 'shared';
  capabilities: {
    openvinoCompatible: boolean;
    cudaCompatible: boolean;
    coremlCompatible: boolean;
  };
  powerEfficiency: 'excellent' | 'good' | 'moderate';
  performance: 'high' | 'medium' | 'low';
  detectionMethod: 'wmi' | 'lspci' | 'systeminformation' | 'mock';
  cpuOnlyProcessing?: boolean;
  platformInfo?: {
    windowsDeviceId?: string;
    linuxPciId?: string;
    driverPath?: string;
    kernelModule?: string;
  };
}

// OpenVINO specific information
export interface OpenVINOInfo {
  isInstalled: boolean;
  version: string;
  runtimePath: string;
  supportedDevices: string[];
  modelFormats: string[];
  validationStatus: 'valid' | 'invalid' | 'unknown';
  installationMethod: 'package' | 'manual' | 'conda' | 'unknown';
  detectionErrors?: string[];
}

// Comprehensive GPU capabilities assessment
export interface GPUCapabilities {
  totalGPUs: number;
  nvidia: boolean;
  intel: GPUDevice[];
  amd: GPUDevice[];
  apple: boolean;
  openvinoVersion: boolean | string;
  recommendedGPU: GPUDevice | null;
  openvinoInfo: OpenVINOInfo | null;
  detectionTimestamp: Date;
  detectionPlatform: 'windows' | 'linux' | 'darwin';
  detectionSuccess: boolean;
  detectionErrors: string[];
  capabilities: {
    hasIntelGPU: boolean;
    hasNvidiaGPU: boolean;
    hasAMDGPU: boolean;
    hasAppleGPU: boolean;
    hasOpenVINO: boolean;
  };
  // Backward compatibility arrays
  nvidiaGPUs?: GPUDevice[];
  appleGPUs?: GPUDevice[];
}

// Hardware detection configuration
export interface HardwareDetectionConfig {
  enableIntelGPU: boolean;
  enableNvidiaGPU: boolean;
  enableAppleGPU: boolean;
  enableOpenVINOValidation: boolean;
  timeoutMs: number;
  preferredGPUType: 'discrete' | 'integrated' | 'auto';
  minDriverVersion?: string;
  enableMockMode: boolean;
  mockScenario?: string;
}

// Platform-specific detection methods
export interface WindowsGPUInfo {
  name: string;
  deviceId: string;
  driverVersion: string;
  driverDate: string;
  memory: number;
  vendorId: string;
  subsystemId: string;
  status: string;
}

export interface LinuxGPUInfo {
  pciId: string;
  deviceName: string;
  vendor: string;
  driver: string;
  kernelModule: string;
  memorySize?: string;
  busInfo: string;
}

// AMD GPU specific information
export interface AMDGPUInfo {
  name: string;
  deviceId: string;
  memory: number | 'shared';
  type: 'discrete' | 'integrated';
  driver: string;
  openclSupport: boolean;
  vulkanSupport: boolean;
}

// Detection result types
export type DetectionResult<T> = {
  success: boolean;
  data: T | null;
  error?: string;
  timestamp: Date;
  detectionTimeMs: number;
};

// GPU classification helpers
export interface GPUClassification {
  isIntelGPU: boolean;
  isDiscreteGPU: boolean;
  isIntegratedGPU: boolean;
  isArcSeries: boolean;
  isCoreUltraIntegrated: boolean;
  priority: number;
  performanceClass: 'high' | 'medium' | 'low';
  powerClass: 'excellent' | 'good' | 'moderate';
}

// OpenVINO validation results
export interface OpenVINOValidation {
  versionValid: boolean;
  deviceSupported: boolean;
  runtimeAvailable: boolean;
  modelFormatSupported: boolean;
  compatibilityScore: number; // 0-100
  recommendations: string[];
  warnings: string[];
  errors: string[];
}

// Hardware detection events
export interface HardwareDetectionEvent {
  type:
    | 'detection_start'
    | 'detection_complete'
    | 'gpu_found'
    | 'openvino_validated'
    | 'error';
  timestamp: Date;
  data: any;
  message: string;
}

// Mock system integration (removed - unused)

/**
 * Intel Core Ultra processor information
 * @since 2025.1
 */
export interface CoreUltraInfo {
  isIntelCoreUltra: boolean;
  hasIntegratedGraphics: boolean;
  cpuBrand?: string;
  cpuManufacturer?: string;
  detectionMethod: 'systeminformation' | 'fallback' | 'mock';
  confidence: 'high' | 'medium' | 'low';
}

// Export utility types (removed - unused)

// Compatibility layer for helper file interfaces
// TODO: Migrate helper files to use canonical GPUCapabilities

export interface LegacyGPUCapabilities {
  nvidia: boolean;
  intel: any[];
  amd: any[];
  apple: boolean;
  cpu: boolean;
  openvinoVersion: string | false;
  capabilities: {
    multiGPU: boolean;
    hybridSystem: boolean;
  };
}

export interface SelectorGPUCapabilities extends LegacyGPUCapabilities {
  intelAll: any[];
}
