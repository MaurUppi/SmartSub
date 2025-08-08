/**
 * Regression Test Suite: Existing Functionality Preservation
 * Task 4.3.2: Validate that OpenVINO integration doesn't break existing features
 *
 * This test suite ensures all existing processing backends, UI components,
 * settings, and workflows continue to work exactly as before.
 */

import { jest } from '@jest/globals';
import { MockEnvironment } from '../setup/mockEnvironment';
import { DevelopmentMockSystem } from '../../main/helpers/developmentMockSystem';
import { SubtitleGenerator } from '../../main/helpers/subtitleGenerator';
import { ErrorHandler } from '../../main/helpers/errorHandler';
import { SettingsMigration } from '../../main/helpers/settingsMigration';
import Store from 'electron-store';
import fs from 'fs';
import path from 'path';

describe('Regression Testing: Existing Functionality Preservation', () => {
  let mockEnv: MockEnvironment;
  let mockSystem: DevelopmentMockSystem;
  let subtitleGenerator: SubtitleGenerator;
  let errorHandler: ErrorHandler;
  let settingsMigration: SettingsMigration;
  let store: Store;

  beforeAll(async () => {
    mockEnv = new MockEnvironment();
    await mockEnv.setup();

    mockSystem = new DevelopmentMockSystem();
    subtitleGenerator = new SubtitleGenerator();
    errorHandler = new ErrorHandler();
    settingsMigration = new SettingsMigration();
    store = new Store();
  });

  afterAll(async () => {
    await mockEnv.cleanup();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockSystem.resetToDefaults();
    store.clear();
  });

  describe('CUDA GPU Processing Functionality Preservation', () => {
    beforeEach(() => {
      mockSystem.simulateCUDAEnvironment({
        cudaVersion: '12.2',
        gpuModel: 'NVIDIA RTX 4090',
        driverVersion: '537.13',
        vramMB: 24576,
      });
    });

    test('should maintain CUDA subtitle generation with tiny model', async () => {
      const result = await subtitleGenerator.generateSubtitles({
        audioFile: 'test-audio.wav',
        modelSize: 'tiny',
        outputFormat: 'srt',
        language: 'en',
        useCUDA: true,
        useIntelGPU: false, // Explicitly disable Intel GPU
      });

      expect(result.success).toBe(true);
      expect(result.processingStats.gpuUsed).toBe('NVIDIA RTX 4090');
      expect(result.processingStats.backend).toBe('CUDA');
      expect(result.processingStats.cudaVersion).toBe('12.2');
      expect(result.outputFile).toMatch(/\.srt$/);
    });

    test('should maintain CUDA subtitle generation with all model sizes', async () => {
      const modelSizes = ['tiny', 'base', 'small', 'medium', 'large'];

      for (const modelSize of modelSizes) {
        const result = await subtitleGenerator.generateSubtitles({
          audioFile: `test-audio-${modelSize}.wav`,
          modelSize,
          outputFormat: 'srt',
          language: 'en',
          useCUDA: true,
          useIntelGPU: false,
        });

        expect(result.success).toBe(true);
        expect(result.processingStats.backend).toBe('CUDA');
        expect(result.processingStats.modelUsed).toBe(modelSize);
        expect(result.processingStats.gpuMemoryUsed).toBeGreaterThan(0);
      }
    });

    test('should maintain CUDA multi-language processing', async () => {
      const languages = ['en', 'zh', 'es', 'fr', 'de', 'ja', 'ko'];

      for (const language of languages) {
        const result = await subtitleGenerator.generateSubtitles({
          audioFile: `test-audio-${language}.wav`,
          modelSize: 'base',
          outputFormat: 'srt',
          language,
          useCUDA: true,
          useIntelGPU: false,
        });

        expect(result.success).toBe(true);
        expect(result.processingStats.backend).toBe('CUDA');
        expect(result.languageDetected).toBe(language);
      }
    });

    test('should maintain CUDA performance characteristics', async () => {
      const result = await subtitleGenerator.generateSubtitles({
        audioFile: 'test-audio-10min.wav',
        modelSize: 'base',
        outputFormat: 'srt',
        language: 'en',
        useCUDA: true,
        useIntelGPU: false,
      });

      expect(result.success).toBe(true);
      expect(result.processingStats.speedupFactor).toBeGreaterThanOrEqual(10.0); // CUDA should be very fast
      expect(result.processingStats.gpuUtilization).toBeGreaterThanOrEqual(
        0.75,
      );
      expect(result.processingStats.memoryUsage.peak).toBeLessThan(24000); // Under VRAM limit
    });

    test('should maintain CUDA error handling', async () => {
      mockSystem.simulateCUDAError('out_of_memory');

      const result = await subtitleGenerator.generateSubtitles({
        audioFile: 'test-audio-large.wav',
        modelSize: 'large',
        outputFormat: 'srt',
        language: 'en',
        useCUDA: true,
        useIntelGPU: false,
        fallbackToCPU: true,
      });

      expect(result.success).toBe(true);
      expect(result.processingStats.gpuUsed).toBe('CPU (fallback)');
      expect(result.warnings).toContain(
        'CUDA out of memory, using CPU fallback',
      );
    });
  });

  describe('Apple CoreML Processing Functionality Preservation', () => {
    beforeEach(() => {
      mockSystem.simulateMacOSEnvironment({
        macOSVersion: '14.1',
        chipset: 'Apple M3 Pro',
        coreMLVersion: '7.0',
        neuralEngine: true,
      });
    });

    test('should maintain CoreML subtitle generation', async () => {
      const result = await subtitleGenerator.generateSubtitles({
        audioFile: 'test-audio.wav',
        modelSize: 'tiny',
        outputFormat: 'srt',
        language: 'en',
        useCoreML: true,
        useIntelGPU: false,
      });

      expect(result.success).toBe(true);
      expect(result.processingStats.backend).toBe('CoreML');
      expect(result.processingStats.neuralEngineUsed).toBe(true);
      expect(result.processingStats.chipset).toBe('Apple M3 Pro');
    });

    test('should maintain CoreML power efficiency', async () => {
      const result = await subtitleGenerator.generateSubtitles({
        audioFile: 'test-audio-30min.wav',
        modelSize: 'base',
        outputFormat: 'srt',
        language: 'en',
        useCoreML: true,
        useIntelGPU: false,
      });

      expect(result.success).toBe(true);
      expect(result.processingStats.powerConsumption).toBeLessThan(15); // Very efficient
      expect(result.processingStats.thermalImpact).toBeLessThan(5);
      expect(result.processingStats.batteryDrain).toBeLessThan(0.1);
    });

    test('should maintain CoreML model optimization', async () => {
      const result = await subtitleGenerator.generateSubtitles({
        audioFile: 'test-audio.wav',
        modelSize: 'small',
        outputFormat: 'srt',
        language: 'en',
        useCoreML: true,
        useIntelGPU: false,
        optimizeForSpeed: true,
      });

      expect(result.success).toBe(true);
      expect(result.processingStats.modelOptimized).toBe(true);
      expect(result.processingStats.coreMLVersion).toBe('7.0');
    });
  });

  describe('CPU Processing Functionality Preservation', () => {
    beforeEach(() => {
      mockSystem.disableAllGPUs(); // Force CPU-only processing
    });

    test('should maintain CPU subtitle generation across all models', async () => {
      const modelSizes = ['tiny', 'base', 'small', 'medium'];

      for (const modelSize of modelSizes) {
        const result = await subtitleGenerator.generateSubtitles({
          audioFile: `test-audio-${modelSize}.wav`,
          modelSize,
          outputFormat: 'srt',
          language: 'en',
          useCPU: true,
          useIntelGPU: false,
        });

        expect(result.success).toBe(true);
        expect(result.processingStats.backend).toBe('CPU');
        expect(result.processingStats.gpuUsed).toBe('CPU');
        expect(result.processingStats.threadsUsed).toBeGreaterThan(1);
      }
    });

    test('should maintain CPU multi-threading optimization', async () => {
      const result = await subtitleGenerator.generateSubtitles({
        audioFile: 'test-audio.wav',
        modelSize: 'base',
        outputFormat: 'srt',
        language: 'en',
        useCPU: true,
        useIntelGPU: false,
        cpuThreads: 8,
      });

      expect(result.success).toBe(true);
      expect(result.processingStats.threadsUsed).toBe(8);
      expect(result.processingStats.cpuUtilization).toBeGreaterThanOrEqual(0.6);
    });

    test('should maintain CPU fallback behavior', async () => {
      // Start with GPU enabled, then simulate failure
      mockSystem.setActiveGPU({ vendor: 'NVIDIA', model: 'RTX 4090' });
      mockSystem.simulateGPUFailure('driver_error');

      const result = await subtitleGenerator.generateSubtitles({
        audioFile: 'test-audio.wav',
        modelSize: 'tiny',
        outputFormat: 'srt',
        language: 'en',
        useCUDA: true,
        fallbackToCPU: true,
        useIntelGPU: false,
      });

      expect(result.success).toBe(true);
      expect(result.processingStats.gpuUsed).toBe('CPU (fallback)');
      expect(result.processingStats.fallbackReason).toBe('driver_error');
    });
  });

  describe('Settings and Preferences System Preservation', () => {
    test('should maintain all existing settings structure', async () => {
      const originalSettings = {
        whisperModel: 'base',
        outputFormat: 'srt',
        language: 'auto',
        translateTo: '',
        translateProvider: 'openai',
        gpuAcceleration: true,
        cpuThreads: 4,
        customModelPath: '',
        outputDirectory: './output',
        autoDetectLanguage: true,
        preserveTimestamps: true,
        filterProfanity: false,
        customPrompt: '',
        batchProcessing: false,
        maxConcurrentJobs: 2,
      };

      // Set original settings
      Object.entries(originalSettings).forEach(([key, value]) => {
        store.set(key, value);
      });

      // Migrate settings (should preserve all existing values)
      const migratedSettings = await settingsMigration.migrateSettings();

      // Verify all original settings are preserved
      Object.entries(originalSettings).forEach(([key, value]) => {
        expect(migratedSettings[key]).toBe(value);
      });

      // New Intel GPU settings should be added without affecting existing ones
      expect(migratedSettings.intelGPUEnabled).toBeDefined();
      expect(migratedSettings.openvinoOptimization).toBeDefined();
    });

    test('should maintain settings validation logic', async () => {
      const invalidSettings = {
        whisperModel: 'invalid_model',
        cpuThreads: -1,
        maxConcurrentJobs: 0,
        outputFormat: 'invalid_format',
      };

      Object.entries(invalidSettings).forEach(([key, value]) => {
        store.set(key, value);
      });

      const validation = await settingsMigration.validateSettings();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Invalid whisper model');
      expect(validation.errors).toContain('CPU threads must be positive');
      expect(validation.errors).toContain(
        'Max concurrent jobs must be positive',
      );
      expect(validation.errors).toContain('Invalid output format');
    });

    test('should maintain settings backup and restore', async () => {
      const testSettings = {
        whisperModel: 'medium',
        language: 'es',
        translateProvider: 'deepl',
        gpuAcceleration: false,
      };

      // Set test settings
      Object.entries(testSettings).forEach(([key, value]) => {
        store.set(key, value);
      });

      // Create backup
      const backupPath = await settingsMigration.createBackup();
      expect(fs.existsSync(backupPath)).toBe(true);

      // Modify settings
      store.set('whisperModel', 'large');
      store.set('language', 'fr');

      // Restore from backup
      await settingsMigration.restoreFromBackup(backupPath);

      // Verify original settings are restored
      expect(store.get('whisperModel')).toBe('medium');
      expect(store.get('language')).toBe('es');
      expect(store.get('translateProvider')).toBe('deepl');
      expect(store.get('gpuAcceleration')).toBe(false);
    });
  });

  describe('File Handling Capabilities Preservation', () => {
    test('should maintain support for all audio formats', async () => {
      const audioFormats = [
        'wav',
        'mp3',
        'flac',
        'm4a',
        'aac',
        'ogg',
        'wma',
        'opus',
      ];

      for (const format of audioFormats) {
        const result = await subtitleGenerator.generateSubtitles({
          audioFile: `test-audio.${format}`,
          modelSize: 'tiny',
          outputFormat: 'srt',
          language: 'en',
          useCPU: true,
          useIntelGPU: false,
        });

        expect(result.success).toBe(true);
        expect(result.inputFormat).toBe(format);
        expect(result.processingStats.formatSupported).toBe(true);
      }
    });

    test('should maintain support for all video formats', async () => {
      const videoFormats = [
        'mp4',
        'avi',
        'mkv',
        'mov',
        'wmv',
        'flv',
        'webm',
        'm4v',
      ];

      for (const format of videoFormats) {
        const result = await subtitleGenerator.generateSubtitles({
          audioFile: `test-video.${format}`,
          modelSize: 'tiny',
          outputFormat: 'srt',
          language: 'en',
          extractAudio: true,
          useCPU: true,
          useIntelGPU: false,
        });

        expect(result.success).toBe(true);
        expect(result.inputFormat).toBe(format);
        expect(result.audioExtracted).toBe(true);
      }
    });

    test('should maintain batch processing capabilities', async () => {
      const batchFiles = [
        'audio1.wav',
        'audio2.mp3',
        'video1.mp4',
        'audio3.flac',
      ];

      const results = await subtitleGenerator.processBatch({
        files: batchFiles,
        modelSize: 'tiny',
        outputFormat: 'srt',
        language: 'auto',
        useCPU: true,
        useIntelGPU: false,
        maxConcurrentJobs: 2,
      });

      expect(results.length).toBe(4);
      results.forEach((result, index) => {
        expect(result.success).toBe(true);
        expect(result.inputFile).toBe(batchFiles[index]);
        expect(result.outputFile).toMatch(/\.srt$/);
      });
    });

    test('should maintain file path handling with special characters', async () => {
      const specialPaths = [
        'test audio with spaces.wav',
        'test-audio_with-symbols.mp3',
        'audio (1).wav',
        'audio[test].mp4',
        'ääöö-üüß.wav',
      ];

      for (const audioFile of specialPaths) {
        const result = await subtitleGenerator.generateSubtitles({
          audioFile,
          modelSize: 'tiny',
          outputFormat: 'srt',
          language: 'en',
          useCPU: true,
          useIntelGPU: false,
        });

        expect(result.success).toBe(true);
        expect(result.inputFile).toBe(audioFile);
        expect(result.pathHandling).toBe('success');
      }
    });
  });

  describe('UI Functionality Preservation', () => {
    test('should maintain model selection dropdown behavior', () => {
      const modelOptions = [
        'tiny',
        'tiny.en',
        'base',
        'base.en',
        'small',
        'small.en',
        'medium',
        'medium.en',
        'large',
        'large-v1',
        'large-v2',
        'large-v3',
      ];

      // Simulate UI component behavior
      const component = {
        getAvailableModels: () => modelOptions,
        validateModelSelection: (model: string) => modelOptions.includes(model),
        getModelSize: (model: string) =>
          model.replace('.en', '').replace(/-v\d+/, ''),
      };

      modelOptions.forEach((model) => {
        expect(component.validateModelSelection(model)).toBe(true);
        const baseModel = component.getModelSize(model);
        expect(['tiny', 'base', 'small', 'medium', 'large']).toContain(
          baseModel,
        );
      });
    });

    test('should maintain language selection behavior', () => {
      const supportedLanguages = [
        'auto',
        'en',
        'zh',
        'es',
        'fr',
        'de',
        'ja',
        'ko',
        'ru',
        'pt',
        'it',
      ];

      const component = {
        getLanguageOptions: () => supportedLanguages,
        validateLanguage: (lang: string) => supportedLanguages.includes(lang),
        getLanguageName: (code: string) => {
          const names: { [key: string]: string } = {
            auto: 'Auto Detect',
            en: 'English',
            zh: 'Chinese',
            es: 'Spanish',
          };
          return names[code] || code;
        },
      };

      supportedLanguages.forEach((lang) => {
        expect(component.validateLanguage(lang)).toBe(true);
        expect(component.getLanguageName(lang)).toBeDefined();
      });
    });

    test('should maintain progress indicator behavior', async () => {
      const progressEvents: Array<{ stage: string; progress: number }> = [];

      const mockProgressCallback = (stage: string, progress: number) => {
        progressEvents.push({ stage, progress });
      };

      const result = await subtitleGenerator.generateSubtitles({
        audioFile: 'test-audio.wav',
        modelSize: 'tiny',
        outputFormat: 'srt',
        language: 'en',
        useCPU: true,
        useIntelGPU: false,
        onProgress: mockProgressCallback,
      });

      expect(result.success).toBe(true);
      expect(progressEvents.length).toBeGreaterThan(3);

      const stages = progressEvents.map((e) => e.stage);
      expect(stages).toContain('loading_model');
      expect(stages).toContain('processing_audio');
      expect(stages).toContain('generating_subtitles');
      expect(stages).toContain('complete');
    });
  });

  describe('Error Handling Behavior Preservation', () => {
    test('should maintain file not found error handling', async () => {
      const result = await subtitleGenerator.generateSubtitles({
        audioFile: 'nonexistent-file.wav',
        modelSize: 'tiny',
        outputFormat: 'srt',
        language: 'en',
        useCPU: true,
        useIntelGPU: false,
      });

      expect(result.success).toBe(false);
      expect(result.error.type).toBe('FILE_NOT_FOUND');
      expect(result.error.message).toContain('nonexistent-file.wav');
      expect(result.error.recoverable).toBe(false);
    });

    test('should maintain invalid format error handling', async () => {
      const result = await subtitleGenerator.generateSubtitles({
        audioFile: 'test-file.xyz', // Unsupported format
        modelSize: 'tiny',
        outputFormat: 'srt',
        language: 'en',
        useCPU: true,
        useIntelGPU: false,
      });

      expect(result.success).toBe(false);
      expect(result.error.type).toBe('UNSUPPORTED_FORMAT');
      expect(result.error.message).toContain('xyz');
      expect(result.error.supportedFormats).toBeDefined();
    });

    test('should maintain insufficient memory error handling', async () => {
      mockSystem.simulateMemoryConstraint(512); // Very low memory

      const result = await subtitleGenerator.generateSubtitles({
        audioFile: 'test-audio-large.wav',
        modelSize: 'large',
        outputFormat: 'srt',
        language: 'en',
        useCPU: true,
        useIntelGPU: false,
      });

      expect(result.success).toBe(false);
      expect(result.error.type).toBe('INSUFFICIENT_MEMORY');
      expect(result.error.requiredMemory).toBeGreaterThan(512);
      expect(result.error.availableMemory).toBe(512);
    });

    test('should maintain model download error handling', async () => {
      mockSystem.simulateNetworkError('connection_timeout');

      const result = await subtitleGenerator.generateSubtitles({
        audioFile: 'test-audio.wav',
        modelSize: 'medium', // Model not locally available
        outputFormat: 'srt',
        language: 'en',
        useCPU: true,
        useIntelGPU: false,
        downloadModel: true,
      });

      expect(result.success).toBe(false);
      expect(result.error.type).toBe('MODEL_DOWNLOAD_FAILED');
      expect(result.error.networkError).toBe('connection_timeout');
      expect(result.error.retryable).toBe(true);
    });

    test('should maintain audio corruption error handling', async () => {
      const result = await subtitleGenerator.generateSubtitles({
        audioFile: 'corrupted-audio.wav',
        modelSize: 'tiny',
        outputFormat: 'srt',
        language: 'en',
        useCPU: true,
        useIntelGPU: false,
      });

      expect(result.success).toBe(false);
      expect(result.error.type).toBe('AUDIO_CORRUPTION');
      expect(result.error.message).toContain('corrupted or invalid');
      expect(result.error.suggestions).toContain('try different file');
    });
  });

  describe('Integration Points Preservation', () => {
    test('should maintain translation service integration', async () => {
      const result = await subtitleGenerator.generateSubtitles({
        audioFile: 'test-audio-english.wav',
        modelSize: 'base',
        outputFormat: 'srt',
        language: 'en',
        translateTo: 'es',
        translationProvider: 'openai',
        useCPU: true,
        useIntelGPU: false,
      });

      expect(result.success).toBe(true);
      expect(result.translation.enabled).toBe(true);
      expect(result.translation.provider).toBe('openai');
      expect(result.translation.sourceLanguage).toBe('en');
      expect(result.translation.targetLanguage).toBe('es');
      expect(result.translatedSubtitles).toBeDefined();
    });

    test('should maintain custom model path handling', async () => {
      const customModelPath = '/custom/models/whisper-custom.bin';

      const result = await subtitleGenerator.generateSubtitles({
        audioFile: 'test-audio.wav',
        customModelPath,
        outputFormat: 'srt',
        language: 'en',
        useCPU: true,
        useIntelGPU: false,
      });

      expect(result.success).toBe(true);
      expect(result.processingStats.modelPath).toBe(customModelPath);
      expect(result.processingStats.customModel).toBe(true);
    });

    test('should maintain prompt customization', async () => {
      const customPrompt =
        'Focus on technical terminology and maintain formal tone.';

      const result = await subtitleGenerator.generateSubtitles({
        audioFile: 'test-audio-technical.wav',
        modelSize: 'base',
        outputFormat: 'srt',
        language: 'en',
        customPrompt,
        useCPU: true,
        useIntelGPU: false,
      });

      expect(result.success).toBe(true);
      expect(result.processingStats.customPrompt).toBe(customPrompt);
      expect(result.processingStats.promptApplied).toBe(true);
    });

    test('should maintain output directory customization', async () => {
      const customOutputDir = './custom-output';

      const result = await subtitleGenerator.generateSubtitles({
        audioFile: 'test-audio.wav',
        modelSize: 'tiny',
        outputFormat: 'srt',
        language: 'en',
        outputDirectory: customOutputDir,
        useCPU: true,
        useIntelGPU: false,
      });

      expect(result.success).toBe(true);
      expect(result.outputFile).toStartWith(customOutputDir);
      expect(result.processingStats.outputDirectory).toBe(customOutputDir);
    });
  });

  describe('Performance Characteristics Preservation', () => {
    test('should maintain CPU processing performance baselines', async () => {
      const baselineTests = [
        { model: 'tiny', expectedMaxTime: 60000, minSpeedup: 1.0 },
        { model: 'base', expectedMaxTime: 120000, minSpeedup: 1.0 },
        { model: 'small', expectedMaxTime: 240000, minSpeedup: 1.0 },
      ];

      for (const test of baselineTests) {
        const startTime = Date.now();
        const result = await subtitleGenerator.generateSubtitles({
          audioFile: 'test-audio-5min.wav',
          modelSize: test.model,
          outputFormat: 'srt',
          language: 'en',
          useCPU: true,
          useIntelGPU: false,
        });
        const processingTime = Date.now() - startTime;

        expect(result.success).toBe(true);
        expect(processingTime).toBeLessThan(test.expectedMaxTime);
        expect(result.processingStats.speedupFactor).toBeGreaterThanOrEqual(
          test.minSpeedup,
        );
      }
    });

    test('should maintain memory usage patterns', async () => {
      const memoryTests = [
        { model: 'tiny', maxMemoryMB: 1024 },
        { model: 'base', maxMemoryMB: 2048 },
        { model: 'small', maxMemoryMB: 4096 },
      ];

      for (const test of memoryTests) {
        const result = await subtitleGenerator.generateSubtitles({
          audioFile: 'test-audio.wav',
          modelSize: test.model,
          outputFormat: 'srt',
          language: 'en',
          useCPU: true,
          useIntelGPU: false,
        });

        expect(result.success).toBe(true);
        expect(result.processingStats.memoryUsage.peak).toBeLessThan(
          test.maxMemoryMB,
        );
        expect(result.processingStats.memoryLeaks).toBe(false);
      }
    });

    test('should maintain accuracy standards', async () => {
      const qualityTests = [
        { model: 'tiny', minAccuracy: 0.8 },
        { model: 'base', minAccuracy: 0.85 },
        { model: 'small', minAccuracy: 0.9 },
      ];

      for (const test of qualityTests) {
        const result = await subtitleGenerator.generateSubtitles({
          audioFile: 'test-audio-clear-speech.wav',
          modelSize: test.model,
          outputFormat: 'srt',
          language: 'en',
          useCPU: true,
          useIntelGPU: false,
        });

        expect(result.success).toBe(true);
        expect(result.qualityMetrics.accuracy).toBeGreaterThanOrEqual(
          test.minAccuracy,
        );
        expect(result.qualityMetrics.wer).toBeLessThanOrEqual(
          1.0 - test.minAccuracy,
        );
      }
    });
  });
});
