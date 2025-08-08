/**
 * Enhanced Settings Types for Intel OpenVINO GPU Integration
 * Extends existing settings structure with Intel GPU support while maintaining backward compatibility
 */

export interface OpenVINOPreferences {
  cacheDir: string;
  devicePreference: 'discrete' | 'integrated' | 'auto';
  enableOptimizations: boolean;
}

export interface GPUDevice {
  id: string;
  name: string;
  type: 'discrete' | 'integrated';
  vendor: 'nvidia' | 'intel' | 'apple';
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
}

export interface EnhancedSettings {
  // Existing settings preserved (from store/types.ts)
  whisperCommand: string;
  language: string;
  useLocalWhisper: boolean;
  builtinWhisperCommand: string;
  useCuda: boolean;
  modelsPath: string;
  maxContext?: number;
  useCustomTempDir?: boolean;
  customTempDir?: string;
  useVAD: boolean;
  checkUpdateOnStartup: boolean;
  vadThreshold: number;
  vadMinSpeechDuration: number;
  vadMinSilenceDuration: number;
  vadMaxSpeechDuration: number;
  vadSpeechPad: number;
  vadSamplesOverlap: number;

  // New Intel GPU settings
  useOpenVINO: boolean;
  selectedGPUId: string; // 'auto' | specific GPU ID
  gpuPreference: string[]; // ['nvidia', 'intel', 'apple', 'cpu']
  gpuAutoDetection: boolean;
  openvinoPreferences: OpenVINOPreferences;
}

export interface SettingsMigrationContext {
  previousVersion?: string;
  currentVersion: string;
  backupCreated: boolean;
  migrationApplied: boolean;
  preservedSettings: string[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface GPUSelectionOption {
  id: string;
  displayName: string;
  type: 'nvidia' | 'intel-discrete' | 'intel-integrated' | 'apple' | 'cpu';
  status: 'available' | 'unavailable' | 'requires-setup';
  performance: 'high' | 'medium' | 'low';
  description: string;
  driverVersion?: string;
  memory?: number | 'shared';
  powerEfficiency: 'excellent' | 'good' | 'moderate';
  estimatedSpeed?: string;
  openvinoCompatible?: boolean;
}
