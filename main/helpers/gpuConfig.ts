/**
 * GPU Configuration Module for Intel OpenVINO Integration
 * Enhanced GPU configuration and parameter management for subtitle generation
 */

import { logMessage } from './logger';
import { store } from './storeManager';
import { AddonInfo } from './gpuSelector';
import { detectAvailableGPUs } from './hardware/hardwareDetection';

export interface GPUConfig {
  addonInfo: AddonInfo;
  whisperParams: WhisperGPUParams;
  performanceHints: PerformanceHints;
  environmentConfig: EnvironmentConfig;
  gpuCapabilities?: any; // GPU capabilities to avoid re-detection
}

export interface WhisperGPUParams {
  use_gpu: boolean;
  gpu_device?: string;
  openvino_device?: string;
  openvino_cache_dir?: string;
  openvino_enable_optimization?: boolean;
  cuda_device?: number;
  coreml_enabled?: boolean;
  flash_attn?: boolean;
  performance_mode?: 'throughput' | 'latency' | 'balanced';
}

export interface PerformanceHints {
  expectedSpeedup: number;
  memoryUsage: 'low' | 'medium' | 'high';
  powerEfficiency: 'excellent' | 'good' | 'moderate';
  processingPriority: 'realtime' | 'high' | 'normal';
}

export interface EnvironmentConfig {
  openvinoDeviceId?: string;
  openvino_cache_dir?: string;
  openvino_enable_optimizations?: boolean;
  openvino_performance_hint?: string;
}

export interface VADSettings {
  useVAD: boolean;
  vadThreshold: number;
  vadMinSpeechDuration: number;
  vadMinSilenceDuration: number;
  vadMaxSpeechDuration: number;
  vadSpeechPad: number;
  vadSamplesOverlap: number;
}

/**
 * Determine optimal GPU configuration for processing
 */
export async function determineGPUConfiguration(
  model: string,
): Promise<GPUConfig> {
  logMessage('Starting GPU configuration determination', 'info');

  const {
    selectOptimalGPU,
    resolveSpecificGPU,
    getGPUSelectionConfig,
  } = require('./gpuSelector');

  try {
    // Get system capabilities
    const gpuCapabilities = detectAvailableGPUs();
    const gpuConfig = getGPUSelectionConfig();

    logMessage(
      `GPU capabilities: ${JSON.stringify({
        nvidia: gpuCapabilities.nvidia,
        intelCount: gpuCapabilities.intel.length,
        apple: gpuCapabilities.apple,
        openvinoVersion: gpuCapabilities.openvinoVersion,
      })}`,
      'info',
    );

    // Determine addon selection
    let selectedAddon = null;

    // Handle explicit GPU selection
    if (gpuConfig.selectedGPUId && gpuConfig.selectedGPUId !== 'auto') {
      selectedAddon = resolveSpecificGPU(
        gpuConfig.selectedGPUId,
        gpuCapabilities,
      );
      if (selectedAddon) {
        logMessage(
          `Using user-selected GPU: ${selectedAddon.displayName}`,
          'info',
        );
      } else {
        logMessage(
          `User-selected GPU ${gpuConfig.selectedGPUId} not available, falling back to auto-detection`,
          'warning',
        );
      }
    }

    // Fallback to automatic selection
    if (!selectedAddon) {
      const priority = gpuConfig.gpuPreference || [
        'nvidia',
        'intel',
        'apple',
        'cpu',
      ];
      selectedAddon = selectOptimalGPU(priority, gpuCapabilities, model);
    }

    // Generate configuration based on selected addon
    const whisperParams = generateWhisperGPUParams(selectedAddon, model);
    const performanceHints = generatePerformanceHints(selectedAddon);
    const environmentConfig = generateEnvironmentConfig(selectedAddon);

    logMessage(
      `GPU configuration determined: ${selectedAddon.type} (${selectedAddon.displayName})`,
      'info',
    );

    return {
      addonInfo: selectedAddon,
      whisperParams,
      performanceHints,
      environmentConfig,
      gpuCapabilities, // Pass capabilities to avoid re-detection
    };
  } catch (error) {
    logMessage(
      `GPU configuration determination failed: ${error.message}`,
      'error',
    );

    // Emergency fallback to CPU
    const cpuAddon: AddonInfo = {
      type: 'cpu',
      path: 'addon-cpu.node',
      displayName: 'CPU Processing (Emergency Fallback)',
      deviceConfig: null,
      fallbackReason: 'GPU configuration failed',
    };

    return {
      addonInfo: cpuAddon,
      whisperParams: generateWhisperGPUParams(cpuAddon, model),
      performanceHints: generatePerformanceHints(cpuAddon),
      environmentConfig: generateEnvironmentConfig(cpuAddon),
    };
  }
}

/**
 * Generate whisper-specific GPU parameters
 */
function generateWhisperGPUParams(
  addonInfo: AddonInfo,
  model: string,
): WhisperGPUParams {
  const baseParams: WhisperGPUParams = {
    use_gpu: false,
    flash_attn: false,
    performance_mode: 'balanced',
  };

  switch (addonInfo.type) {
    case 'openvino':
      return {
        ...baseParams,
        use_gpu: true,
        openvino_device: addonInfo.deviceConfig?.deviceId || 'GPU',
        openvino_cache_dir: process.env.OPENVINO_CACHE_DIR || undefined,
        openvino_enable_optimization: true,
        performance_mode:
          addonInfo.deviceConfig?.type === 'discrete'
            ? 'throughput'
            : 'latency',
      };

    case 'cuda':
      return {
        ...baseParams,
        use_gpu: true,
        cuda_device: 0,
        flash_attn: true,
        performance_mode: 'throughput',
      };

    case 'coreml':
      return {
        ...baseParams,
        use_gpu: true,
        coreml_enabled: true,
        performance_mode: 'latency',
      };

    case 'cpu':
    default:
      return {
        ...baseParams,
        use_gpu: false,
        performance_mode: 'balanced',
      };
  }
}

/**
 * Generate performance hints for optimization
 */
function generatePerformanceHints(addonInfo: AddonInfo): PerformanceHints {
  switch (addonInfo.type) {
    case 'openvino':
      const isDiscrete = addonInfo.deviceConfig?.type === 'discrete';
      return {
        expectedSpeedup: isDiscrete ? 3.5 : 2.5,
        memoryUsage: isDiscrete ? 'medium' : 'low',
        powerEfficiency: isDiscrete ? 'good' : 'excellent',
        processingPriority: 'high',
      };

    case 'cuda':
      return {
        expectedSpeedup: 4.0,
        memoryUsage: 'high',
        powerEfficiency: 'moderate',
        processingPriority: 'high',
      };

    case 'coreml':
      return {
        expectedSpeedup: 2.8,
        memoryUsage: 'low',
        powerEfficiency: 'excellent',
        processingPriority: 'high',
      };

    case 'cpu':
    default:
      return {
        expectedSpeedup: 1.0,
        memoryUsage: 'medium',
        powerEfficiency: 'good',
        processingPriority: 'normal',
      };
  }
}

/**
 * Generate environment configuration
 */
function generateEnvironmentConfig(addonInfo: AddonInfo): EnvironmentConfig {
  const config: EnvironmentConfig = {};

  if (addonInfo.type === 'openvino') {
    const settings = (store.get('settings') as any) || {};
    const openvinoPreferences = settings.openvinoPreferences || {};

    config.openvinoDeviceId = addonInfo.deviceConfig?.deviceId || 'GPU';
    config.openvino_cache_dir =
      openvinoPreferences.cacheDir || process.env.OPENVINO_CACHE_DIR;
    config.openvino_enable_optimizations =
      openvinoPreferences.enableOptimizations !== false;
    config.openvino_performance_hint =
      addonInfo.deviceConfig?.type === 'discrete' ? 'THROUGHPUT' : 'LATENCY';
  }

  return config;
}

/**
 * Get VAD settings from store with intelligent defaults
 */
export function getVADSettings(): VADSettings {
  const settings = (store.get('settings') as any) || {};

  return {
    useVAD: settings.useVAD !== false,
    vadThreshold: settings.vadThreshold || 0.5,
    vadMinSpeechDuration: settings.vadMinSpeechDuration || 250,
    vadMinSilenceDuration: settings.vadMinSilenceDuration || 100,
    vadMaxSpeechDuration: settings.vadMaxSpeechDuration || Number.MAX_VALUE,
    vadSpeechPad: settings.vadSpeechPad || 30,
    vadSamplesOverlap: settings.vadSamplesOverlap || 0.1,
  };
}

/**
 * Validate GPU memory requirements for model
 */
export function validateGPUMemory(
  addonInfo: AddonInfo,
  model: string,
): boolean {
  if (addonInfo.type === 'cpu') {
    return true; // CPU always has "enough" memory
  }

  const memoryRequirements = {
    tiny: 1024, // 1GB
    base: 1024, // 1GB
    small: 2048, // 2GB
    medium: 3072, // 3GB
    large: 4096, // 4GB
    'large-v2': 4096, // 4GB
    'large-v3': 4096, // 4GB
  };

  const required = memoryRequirements[model] || 2048;

  if (addonInfo.type === 'openvino' && addonInfo.deviceConfig) {
    if (addonInfo.deviceConfig.type === 'integrated') {
      // Integrated GPUs can handle up to medium models via shared memory
      return required <= 3072;
    } else {
      // Discrete GPUs check actual memory
      return addonInfo.deviceConfig.memory >= required;
    }
  }

  // For other GPU types, assume they have enough memory
  return true;
}

/**
 * Apply environment configuration for GPU processing
 */
export function applyEnvironmentConfig(
  environmentConfig: EnvironmentConfig,
): void {
  if (environmentConfig.openvinoDeviceId) {
    process.env.OPENVINO_DEVICE_ID = environmentConfig.openvinoDeviceId;
    logMessage(
      `Set OPENVINO_DEVICE_ID=${environmentConfig.openvinoDeviceId}`,
      'debug',
    );
  }

  if (environmentConfig.openvino_cache_dir) {
    process.env.OPENVINO_CACHE_DIR = environmentConfig.openvino_cache_dir;
    logMessage(
      `Set OPENVINO_CACHE_DIR=${environmentConfig.openvino_cache_dir}`,
      'debug',
    );
  }

  if (environmentConfig.openvino_enable_optimizations !== undefined) {
    process.env.OPENVINO_ENABLE_OPTIMIZATIONS =
      environmentConfig.openvino_enable_optimizations.toString();
    logMessage(
      `Set OPENVINO_ENABLE_OPTIMIZATIONS=${environmentConfig.openvino_enable_optimizations}`,
      'debug',
    );
  }

  if (environmentConfig.openvino_performance_hint) {
    process.env.OPENVINO_PERFORMANCE_HINT =
      environmentConfig.openvino_performance_hint;
    logMessage(
      `Set OPENVINO_PERFORMANCE_HINT=${environmentConfig.openvino_performance_hint}`,
      'debug',
    );
  }
}
