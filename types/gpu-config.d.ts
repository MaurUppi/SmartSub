/**
 * GPU Configuration Type Definitions
 * Configuration and settings for GPU operations
 * @since 2025.1
 */

import { GPUDevice } from './gpu';

export interface AddonInfo {
  type: 'cuda' | 'openvino' | 'coreml' | 'cpu';
  path: string;
  displayName: string;
  deviceConfig: {
    deviceId?: string;
    memory?: number | 'shared';
    type?: 'discrete' | 'integrated';
    // CUDA-specific configuration
    cudaVersion?: string;
    driverVersion?: string;
    majorVersion?: number;
  } | null;
  fallbackReason?: string;
}

export interface WhisperFunction {
  (params: any, callback: (error: Error | null, result?: any) => void): void;
}

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
