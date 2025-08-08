import Store from 'electron-store';
import { StoreType } from './types';
import { defaultUserConfig, isAppleSilicon } from '../utils';
import path from 'path';
import { app } from 'electron';

const defaultWhisperCommand = isAppleSilicon()
  ? 'whisper "${audioFile}" --model ${whisperModel} --output_format srt --output_dir "${outputDir}" --language ${sourceLanguage}'
  : 'whisper "${audioFile}" --model ${whisperModel} --device cuda --output_format srt --output_dir "${outputDir}" --language ${sourceLanguage}';

export const store = new Store<StoreType>({
  defaults: {
    userConfig: defaultUserConfig,
    translationProviders: [],
    settings: {
      language: 'zh',
      useLocalWhisper: false,
      whisperCommand: defaultWhisperCommand,
      builtinWhisperCommand: defaultWhisperCommand,
      useCuda: true,
      modelsPath: path.join(app.getPath('userData'), 'whisper-models'),
      maxContext: -1,
      useCustomTempDir: false,
      customTempDir: '',
      useVAD: true,
      checkUpdateOnStartup: true,
      vadThreshold: 0.5,
      vadMinSpeechDuration: 250,
      vadMinSilenceDuration: 100,
      vadMaxSpeechDuration: 0,
      vadSpeechPad: 30,
      vadSamplesOverlap: 0.1,

      // Intel GPU settings with sensible defaults
      useOpenVINO: false,
      selectedGPUId: 'auto', // Auto-detect by default
      gpuPreference: ['nvidia', 'intel', 'apple', 'cpu'], // Priority order
      gpuAutoDetection: true,
      openvinoPreferences: {
        cacheDir: path.join(app.getPath('userData'), 'openvino-cache'),
        devicePreference: 'auto', // Auto-select best Intel GPU
        enableOptimizations: true,
      },
    },
    logs: [],
  },
});
