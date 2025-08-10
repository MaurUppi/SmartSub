import { Provider, CustomParameterConfig } from '../../../types/provider';
import { OpenVINOPreferences } from '../../../types/settings';

export enum LogCategory {
  GENERAL = 'general',
  GPU_DETECTION = 'gpu-detection',
  OPENVINO_ADDON = 'openvino-addon',
  ADDON_LOADING = 'addon-loading',
  PERFORMANCE = 'performance',
  ERROR_RECOVERY = 'error-recovery',
  SYSTEM_INFO = 'system-info',
  USER_ACTION = 'user-action',
}

export type LogEntry = {
  timestamp: number;
  message: string;
  type?: 'info' | 'error' | 'warning' | 'debug' | 'success';
  category?: LogCategory;
  context?: Record<string, any>;
  correlationId?: string;
};

export type StoreType = {
  translationProviders: Provider[];
  userConfig: Record<string, any>;
  settings: {
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
    useOpenVINO?: boolean;
    selectedGPUId?: string; // 'auto' | specific GPU ID
    gpuPreference?: string[]; // ['nvidia', 'intel', 'apple', 'cpu']
    gpuAutoDetection?: boolean;
    openvinoPreferences?: OpenVINOPreferences;
  };
  providerVersion?: number;
  logs: LogEntry[];
  customParameters?: Record<string, CustomParameterConfig>;
  [key: string]: any;
};
