/**
 * Settings Type Definitions
 * Central location for all application settings and configuration types
 */

// ============= IMPORTS =============
import { GPUDevice } from './gpu';
import { CustomParameterConfig } from './parameterSystem';

// ============= CORE SETTINGS =============
/**
 * Main application settings
 */
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

// ============= GPU SETTINGS =============
/**
 * GPU and OpenVINO preferences
 */
export interface OpenVINOPreferences {
  cacheDir: string;
  devicePreference: 'discrete' | 'integrated' | 'auto';
  enableOptimizations: boolean;
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

// ============= AUDIO SETTINGS =============
/**
 * Audio processing settings
 */
export interface VADSettings {
  useVAD: boolean;
  vadThreshold: number;
  vadMinSpeechDuration: number;
  vadMinSilenceDuration: number;
  vadMaxSpeechDuration: number;
  vadSpeechPad: number;
  vadSamplesOverlap: number;
}

// ============= CONFIGURATION MANAGEMENT =============
/**
 * Configuration storage and validation
 */
export interface ConfigurationMetadata {
  version: string;
  createdAt: string;
  lastModified: string;
  checksum?: string;
}

export interface StoredConfiguration {
  config: CustomParameterConfig;
  metadata: ConfigurationMetadata;
}

export interface ConfigurationExport {
  configurations: Record<string, StoredConfiguration>;
  exportedAt: string;
  version: string;
}

export interface ConfigurationValidationOptions {
  strictValidation?: boolean;
  allowUnknownKeys?: boolean;
  validateValues?: boolean;
}

// ============= MIGRATION =============
/**
 * Settings migration support
 */
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
