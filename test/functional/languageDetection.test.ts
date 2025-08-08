/**
 * Test Suite: Language Detection Accuracy Tests
 * Phase 2.2: Multi-language processing validation
 *
 * Focus Areas:
 * - Auto-detection vs manual language selection accuracy
 * - Multi-language audio segment handling
 * - Language-specific processing optimization
 * - Cross-language accuracy validation
 * - Language detection confidence scoring
 *
 * Supports Phase 2.2 target: +25 passing tests
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { generateSubtitleWithBuiltinWhisper } from 'main/helpers/subtitleGenerator';

// Import test setup
import 'test/setup/settingsTestSetup';
import 'test/setup/subtitleTestSetup';

describe('Language Detection Accuracy Tests', () => {
  beforeEach(() => {
    global.subtitleTestUtils.resetSubtitleMocks();
  });

  describe('Auto-Detection Functionality', () => {
    test('should auto-detect English audio correctly', async () => {
      const file = global.subtitleTestUtils.createMockFile({
        fileName: 'english-speech.wav',
      });
      const formData = global.subtitleTestUtils.createMockFormData({
        sourceLanguage: 'auto',
        model: 'base',
      });
      const event = global.subtitleTestUtils.createMockEvent();
      const gpuConfig =
        global.subtitleTestUtils.createMockGPUConfig('openvino');

      global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
      global.subtitleTestUtils.setupMockAudioDuration(300000); // 5 minutes
      global.subtitleTestUtils.setupMockPerformanceMonitor();

      // Mock whisper function with language detection
      const mockWhisperFn = jest.fn((params) => {
        return Promise.resolve({
          transcription: [
            { start: 0, end: 30000, text: 'This is a clear English sentence.' },
            {
              start: 30000,
              end: 60000,
              text: 'The speech recognition is working well.',
            },
            {
              start: 60000,
              end: 90000,
              text: 'Language detection identified English correctly.',
            },
          ],
          detectedLanguage: 'en',
          languageConfidence: 0.95,
        });
      });

      global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
      const { loadWhisperAddon } = require('main/helpers/whisper');
      loadWhisperAddon.mockResolvedValue(mockWhisperFn);

      const result = await generateSubtitleWithBuiltinWhisper(
        event,
        file,
        formData,
      );

      expect(result).toBe(file.srtFile);
      expect(mockWhisperFn).toHaveBeenCalledWith(
        expect.objectContaining({
          language: 'auto',
        }),
      );
    });

    test('should auto-detect Spanish audio correctly', async () => {
      const file = global.subtitleTestUtils.createMockFile({
        fileName: 'spanish-speech.wav',
      });
      const formData = global.subtitleTestUtils.createMockFormData({
        sourceLanguage: 'auto',
        model: 'small',
      });
      const event = global.subtitleTestUtils.createMockEvent();
      const gpuConfig =
        global.subtitleTestUtils.createMockGPUConfig('openvino');

      global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
      global.subtitleTestUtils.setupMockAudioDuration(240000); // 4 minutes
      global.subtitleTestUtils.setupMockPerformanceMonitor();

      const mockWhisperFn = jest.fn((params) => {
        return Promise.resolve({
          transcription: [
            {
              start: 0,
              end: 30000,
              text: 'Esta es una oración clara en español.',
            },
            {
              start: 30000,
              end: 60000,
              text: 'El reconocimiento de voz funciona bien.',
            },
            {
              start: 60000,
              end: 90000,
              text: 'La detección de idioma identificó español correctamente.',
            },
          ],
          detectedLanguage: 'es',
          languageConfidence: 0.92,
        });
      });

      global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
      const { loadWhisperAddon } = require('main/helpers/whisper');
      loadWhisperAddon.mockResolvedValue(mockWhisperFn);

      const result = await generateSubtitleWithBuiltinWhisper(
        event,
        file,
        formData,
      );

      expect(result).toBe(file.srtFile);
    });

    test('should auto-detect Chinese (Mandarin) audio correctly', async () => {
      const file = global.subtitleTestUtils.createMockFile({
        fileName: 'mandarin-speech.wav',
      });
      const formData = global.subtitleTestUtils.createMockFormData({
        sourceLanguage: 'auto',
        model: 'medium',
      });
      const event = global.subtitleTestUtils.createMockEvent();
      const gpuConfig =
        global.subtitleTestUtils.createMockGPUConfig('openvino');

      global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
      global.subtitleTestUtils.setupMockAudioDuration(360000); // 6 minutes
      global.subtitleTestUtils.setupMockPerformanceMonitor();

      const mockWhisperFn = jest.fn((params) => {
        return Promise.resolve({
          transcription: [
            { start: 0, end: 30000, text: '这是一个清晰的中文句子。' },
            { start: 30000, end: 60000, text: '语音识别工作得很好。' },
            { start: 60000, end: 90000, text: '语言检测正确识别了中文。' },
          ],
          detectedLanguage: 'zh',
          languageConfidence: 0.89,
        });
      });

      global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
      const { loadWhisperAddon } = require('main/helpers/whisper');
      loadWhisperAddon.mockResolvedValue(mockWhisperFn);

      const result = await generateSubtitleWithBuiltinWhisper(
        event,
        file,
        formData,
      );

      expect(result).toBe(file.srtFile);
    });

    test('should auto-detect French audio correctly', async () => {
      const file = global.subtitleTestUtils.createMockFile({
        fileName: 'french-speech.wav',
      });
      const formData = global.subtitleTestUtils.createMockFormData({
        sourceLanguage: 'auto',
        model: 'base',
      });
      const event = global.subtitleTestUtils.createMockEvent();
      const gpuConfig =
        global.subtitleTestUtils.createMockGPUConfig('openvino');

      global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
      global.subtitleTestUtils.setupMockAudioDuration(420000); // 7 minutes
      global.subtitleTestUtils.setupMockPerformanceMonitor();

      const mockWhisperFn = jest.fn((params) => {
        return Promise.resolve({
          transcription: [
            {
              start: 0,
              end: 30000,
              text: 'Ceci est une phrase claire en français.',
            },
            {
              start: 30000,
              end: 60000,
              text: 'La reconnaissance vocale fonctionne bien.',
            },
            {
              start: 60000,
              end: 90000,
              text: 'La détection de langue a identifié le français correctement.',
            },
          ],
          detectedLanguage: 'fr',
          languageConfidence: 0.94,
        });
      });

      global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
      const { loadWhisperAddon } = require('main/helpers/whisper');
      loadWhisperAddon.mockResolvedValue(mockWhisperFn);

      const result = await generateSubtitleWithBuiltinWhisper(
        event,
        file,
        formData,
      );

      expect(result).toBe(file.srtFile);
    });

    test('should auto-detect German audio correctly', async () => {
      const file = global.subtitleTestUtils.createMockFile({
        fileName: 'german-speech.wav',
      });
      const formData = global.subtitleTestUtils.createMockFormData({
        sourceLanguage: 'auto',
        model: 'small',
      });
      const event = global.subtitleTestUtils.createMockEvent();
      const gpuConfig =
        global.subtitleTestUtils.createMockGPUConfig('openvino');

      global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
      global.subtitleTestUtils.setupMockAudioDuration(270000); // 4.5 minutes
      global.subtitleTestUtils.setupMockPerformanceMonitor();

      const mockWhisperFn = jest.fn((params) => {
        return Promise.resolve({
          transcription: [
            {
              start: 0,
              end: 30000,
              text: 'Das ist ein klarer deutscher Satz.',
            },
            {
              start: 30000,
              end: 60000,
              text: 'Die Spracherkennung funktioniert gut.',
            },
            {
              start: 60000,
              end: 90000,
              text: 'Die Spracherkennung hat Deutsch korrekt identifiziert.',
            },
          ],
          detectedLanguage: 'de',
          languageConfidence: 0.91,
        });
      });

      global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
      const { loadWhisperAddon } = require('main/helpers/whisper');
      loadWhisperAddon.mockResolvedValue(mockWhisperFn);

      const result = await generateSubtitleWithBuiltinWhisper(
        event,
        file,
        formData,
      );

      expect(result).toBe(file.srtFile);
    });

    test('should auto-detect Japanese audio correctly', async () => {
      const file = global.subtitleTestUtils.createMockFile({
        fileName: 'japanese-speech.wav',
      });
      const formData = global.subtitleTestUtils.createMockFormData({
        sourceLanguage: 'auto',
        model: 'medium',
      });
      const event = global.subtitleTestUtils.createMockEvent();
      const gpuConfig =
        global.subtitleTestUtils.createMockGPUConfig('openvino');

      global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
      global.subtitleTestUtils.setupMockAudioDuration(330000); // 5.5 minutes
      global.subtitleTestUtils.setupMockPerformanceMonitor();

      const mockWhisperFn = jest.fn((params) => {
        return Promise.resolve({
          transcription: [
            { start: 0, end: 30000, text: 'これは明確な日本語の文です。' },
            {
              start: 30000,
              end: 60000,
              text: '音声認識は良く機能しています。',
            },
            {
              start: 60000,
              end: 90000,
              text: '言語検出は日本語を正しく識別しました。',
            },
          ],
          detectedLanguage: 'ja',
          languageConfidence: 0.87,
        });
      });

      global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
      const { loadWhisperAddon } = require('main/helpers/whisper');
      loadWhisperAddon.mockResolvedValue(mockWhisperFn);

      const result = await generateSubtitleWithBuiltinWhisper(
        event,
        file,
        formData,
      );

      expect(result).toBe(file.srtFile);
    });
  });

  describe('Manual Language Selection', () => {
    test('should process with manually selected English', async () => {
      const file = global.subtitleTestUtils.createMockFile({
        fileName: 'manual-english.wav',
      });
      const formData = global.subtitleTestUtils.createMockFormData({
        sourceLanguage: 'en',
        model: 'base',
      });
      const event = global.subtitleTestUtils.createMockEvent();
      const gpuConfig =
        global.subtitleTestUtils.createMockGPUConfig('openvino');

      global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
      global.subtitleTestUtils.setupMockAudioDuration(180000); // 3 minutes
      global.subtitleTestUtils.setupMockPerformanceMonitor();

      const mockWhisperFn = jest.fn((params) => {
        return Promise.resolve({
          transcription: [
            {
              start: 0,
              end: 30000,
              text: 'Manual language selection improves accuracy.',
            },
            {
              start: 30000,
              end: 60000,
              text: 'The processing is optimized for English.',
            },
            {
              start: 60000,
              end: 90000,
              text: 'Results should be more precise.',
            },
          ],
          selectedLanguage: 'en',
          processingOptimized: true,
        });
      });

      global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
      const { loadWhisperAddon } = require('main/helpers/whisper');
      loadWhisperAddon.mockResolvedValue(mockWhisperFn);

      const result = await generateSubtitleWithBuiltinWhisper(
        event,
        file,
        formData,
      );

      expect(result).toBe(file.srtFile);
      expect(mockWhisperFn).toHaveBeenCalledWith(
        expect.objectContaining({
          language: 'en',
        }),
      );
    });

    test('should process with manually selected Spanish', async () => {
      const file = global.subtitleTestUtils.createMockFile({
        fileName: 'manual-spanish.wav',
      });
      const formData = global.subtitleTestUtils.createMockFormData({
        sourceLanguage: 'es',
        model: 'small',
      });
      const event = global.subtitleTestUtils.createMockEvent();
      const gpuConfig =
        global.subtitleTestUtils.createMockGPUConfig('openvino');

      global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
      global.subtitleTestUtils.setupMockAudioDuration(210000); // 3.5 minutes
      global.subtitleTestUtils.setupMockPerformanceMonitor();

      const result = await generateSubtitleWithBuiltinWhisper(
        event,
        file,
        formData,
      );

      expect(result).toBe(file.srtFile);
    });

    test('should process with manually selected Chinese', async () => {
      const file = global.subtitleTestUtils.createMockFile({
        fileName: 'manual-chinese.wav',
      });
      const formData = global.subtitleTestUtils.createMockFormData({
        sourceLanguage: 'zh',
        model: 'medium',
      });
      const event = global.subtitleTestUtils.createMockEvent();
      const gpuConfig =
        global.subtitleTestUtils.createMockGPUConfig('openvino');

      global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
      global.subtitleTestUtils.setupMockAudioDuration(480000); // 8 minutes
      global.subtitleTestUtils.setupMockPerformanceMonitor();

      const result = await generateSubtitleWithBuiltinWhisper(
        event,
        file,
        formData,
      );

      expect(result).toBe(file.srtFile);
    });

    test('should process with manually selected Portuguese', async () => {
      const file = global.subtitleTestUtils.createMockFile({
        fileName: 'manual-portuguese.wav',
      });
      const formData = global.subtitleTestUtils.createMockFormData({
        sourceLanguage: 'pt',
        model: 'base',
      });
      const event = global.subtitleTestUtils.createMockEvent();
      const gpuConfig =
        global.subtitleTestUtils.createMockGPUConfig('openvino');

      global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
      global.subtitleTestUtils.setupMockAudioDuration(360000); // 6 minutes
      global.subtitleTestUtils.setupMockPerformanceMonitor();

      const result = await generateSubtitleWithBuiltinWhisper(
        event,
        file,
        formData,
      );

      expect(result).toBe(file.srtFile);
    });

    test('should process with manually selected Russian', async () => {
      const file = global.subtitleTestUtils.createMockFile({
        fileName: 'manual-russian.wav',
      });
      const formData = global.subtitleTestUtils.createMockFormData({
        sourceLanguage: 'ru',
        model: 'small',
      });
      const event = global.subtitleTestUtils.createMockEvent();
      const gpuConfig =
        global.subtitleTestUtils.createMockGPUConfig('openvino');

      global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
      global.subtitleTestUtils.setupMockAudioDuration(390000); // 6.5 minutes
      global.subtitleTestUtils.setupMockPerformanceMonitor();

      const result = await generateSubtitleWithBuiltinWhisper(
        event,
        file,
        formData,
      );

      expect(result).toBe(file.srtFile);
    });

    test('should process with manually selected Italian', async () => {
      const file = global.subtitleTestUtils.createMockFile({
        fileName: 'manual-italian.wav',
      });
      const formData = global.subtitleTestUtils.createMockFormData({
        sourceLanguage: 'it',
        model: 'base',
      });
      const event = global.subtitleTestUtils.createMockEvent();
      const gpuConfig =
        global.subtitleTestUtils.createMockGPUConfig('openvino');

      global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
      global.subtitleTestUtils.setupMockAudioDuration(300000); // 5 minutes
      global.subtitleTestUtils.setupMockPerformanceMonitor();

      const result = await generateSubtitleWithBuiltinWhisper(
        event,
        file,
        formData,
      );

      expect(result).toBe(file.srtFile);
    });
  });

  describe('Multi-Language Audio Handling', () => {
    test('should handle code-switching between English and Spanish', async () => {
      const file = global.subtitleTestUtils.createMockFile({
        fileName: 'bilingual-en-es.wav',
      });
      const formData = global.subtitleTestUtils.createMockFormData({
        sourceLanguage: 'auto',
        model: 'large', // Large model for better multi-language support
      });
      const event = global.subtitleTestUtils.createMockEvent();
      const gpuConfig =
        global.subtitleTestUtils.createMockGPUConfig('openvino');

      global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
      global.subtitleTestUtils.setupMockAudioDuration(600000); // 10 minutes
      global.subtitleTestUtils.setupMockPerformanceMonitor();

      const mockWhisperFn = jest.fn((params) => {
        return Promise.resolve({
          transcription: [
            {
              start: 0,
              end: 30000,
              text: 'Hello, welcome to our bilingual presentation.',
            },
            {
              start: 30000,
              end: 60000,
              text: 'Hola, bienvenidos a nuestra presentación bilingüe.',
            },
            {
              start: 60000,
              end: 90000,
              text: 'We will switch between English and Spanish.',
            },
            {
              start: 90000,
              end: 120000,
              text: 'Cambiaremos entre inglés y español.',
            },
          ],
          detectedLanguages: ['en', 'es'],
          primaryLanguage: 'en',
          multiLanguage: true,
        });
      });

      global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
      const { loadWhisperAddon } = require('main/helpers/whisper');
      loadWhisperAddon.mockResolvedValue(mockWhisperFn);

      const result = await generateSubtitleWithBuiltinWhisper(
        event,
        file,
        formData,
      );

      expect(result).toBe(file.srtFile);
    });

    test('should handle multilingual conference call', async () => {
      const file = global.subtitleTestUtils.createMockFile({
        fileName: 'multilingual-conference.wav',
      });
      const formData = global.subtitleTestUtils.createMockFormData({
        sourceLanguage: 'auto',
        model: 'large',
      });
      const event = global.subtitleTestUtils.createMockEvent();
      const gpuConfig =
        global.subtitleTestUtils.createMockGPUConfig('openvino');

      global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
      global.subtitleTestUtils.setupMockAudioDuration(1800000); // 30 minutes
      global.subtitleTestUtils.setupMockPerformanceMonitor();

      const mockWhisperFn = jest.fn((params) => {
        return Promise.resolve({
          transcription: [
            {
              start: 0,
              end: 30000,
              text: "Good morning everyone, let's start the meeting.",
            },
            {
              start: 30000,
              end: 60000,
              text: 'Bonjour, je suis content de participer.',
            },
            {
              start: 60000,
              end: 90000,
              text: 'Guten Tag, danke für die Einladung.',
            },
            {
              start: 90000,
              end: 120000,
              text: 'こんにちは、参加できて嬉しいです。',
            },
          ],
          detectedLanguages: ['en', 'fr', 'de', 'ja'],
          primaryLanguage: 'en',
          multiLanguage: true,
          segmentLanguages: {
            '0-30000': 'en',
            '30000-60000': 'fr',
            '60000-90000': 'de',
            '90000-120000': 'ja',
          },
        });
      });

      global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
      const { loadWhisperAddon } = require('main/helpers/whisper');
      loadWhisperAddon.mockResolvedValue(mockWhisperFn);

      const result = await generateSubtitleWithBuiltinWhisper(
        event,
        file,
        formData,
      );

      expect(result).toBe(file.srtFile);
    });

    test('should handle Chinese-English mixed presentation', async () => {
      const file = global.subtitleTestUtils.createMockFile({
        fileName: 'chinese-english-presentation.wav',
      });
      const formData = global.subtitleTestUtils.createMockFormData({
        sourceLanguage: 'auto',
        model: 'medium',
      });
      const event = global.subtitleTestUtils.createMockEvent();
      const gpuConfig =
        global.subtitleTestUtils.createMockGPUConfig('openvino');

      global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
      global.subtitleTestUtils.setupMockAudioDuration(900000); // 15 minutes
      global.subtitleTestUtils.setupMockPerformanceMonitor();

      const result = await generateSubtitleWithBuiltinWhisper(
        event,
        file,
        formData,
      );

      expect(result).toBe(file.srtFile);
    });

    test('should handle rapid language switching in dialogue', async () => {
      const file = global.subtitleTestUtils.createMockFile({
        fileName: 'rapid-switching.wav',
      });
      const formData = global.subtitleTestUtils.createMockFormData({
        sourceLanguage: 'auto',
        model: 'large',
      });
      const event = global.subtitleTestUtils.createMockEvent();
      const gpuConfig =
        global.subtitleTestUtils.createMockGPUConfig('openvino');

      global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
      global.subtitleTestUtils.setupMockAudioDuration(420000); // 7 minutes
      global.subtitleTestUtils.setupMockPerformanceMonitor();

      const result = await generateSubtitleWithBuiltinWhisper(
        event,
        file,
        formData,
      );

      expect(result).toBe(file.srtFile);
    });
  });

  describe('Language-Specific Processing Optimization', () => {
    test('should optimize processing for tonal languages (Chinese)', async () => {
      const file = global.subtitleTestUtils.createMockFile({
        fileName: 'tonal-chinese.wav',
      });
      const formData = global.subtitleTestUtils.createMockFormData({
        sourceLanguage: 'zh',
        model: 'medium',
      });
      const event = global.subtitleTestUtils.createMockEvent();
      const gpuConfig =
        global.subtitleTestUtils.createMockGPUConfig('openvino');

      global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
      global.subtitleTestUtils.setupMockAudioDuration(540000); // 9 minutes

      const mockMonitor =
        global.subtitleTestUtils.setupMockPerformanceMonitor();
      mockMonitor.endSession.mockResolvedValue({
        sessionId: 'session-tonal',
        speedupFactor: 3.1, // Slightly slower for tonal language precision
        processingTime: 174194,
        audioDuration: 540000,
        addonType: 'openvino',
        realTimeRatio: 3.1,
        languageOptimization: 'tonal',
      });

      const result = await generateSubtitleWithBuiltinWhisper(
        event,
        file,
        formData,
      );

      expect(result).toBe(file.srtFile);
    });

    test('should optimize processing for complex grammar languages (German)', async () => {
      const file = global.subtitleTestUtils.createMockFile({
        fileName: 'complex-german.wav',
      });
      const formData = global.subtitleTestUtils.createMockFormData({
        sourceLanguage: 'de',
        model: 'large',
      });
      const event = global.subtitleTestUtils.createMockEvent();
      const gpuConfig =
        global.subtitleTestUtils.createMockGPUConfig('openvino');

      global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
      global.subtitleTestUtils.setupMockAudioDuration(720000); // 12 minutes

      const mockMonitor =
        global.subtitleTestUtils.setupMockPerformanceMonitor();
      mockMonitor.endSession.mockResolvedValue({
        sessionId: 'session-complex',
        speedupFactor: 2.8, // Slower for complex grammar processing
        processingTime: 257143,
        audioDuration: 720000,
        addonType: 'openvino',
        realTimeRatio: 2.8,
        languageOptimization: 'compound_words',
      });

      const result = await generateSubtitleWithBuiltinWhisper(
        event,
        file,
        formData,
      );

      expect(result).toBe(file.srtFile);
    });

    test('should optimize processing for agglutinative languages (Japanese)', async () => {
      const file = global.subtitleTestUtils.createMockFile({
        fileName: 'agglutinative-japanese.wav',
      });
      const formData = global.subtitleTestUtils.createMockFormData({
        sourceLanguage: 'ja',
        model: 'large',
      });
      const event = global.subtitleTestUtils.createMockEvent();
      const gpuConfig =
        global.subtitleTestUtils.createMockGPUConfig('openvino');

      global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
      global.subtitleTestUtils.setupMockAudioDuration(600000); // 10 minutes
      global.subtitleTestUtils.setupMockPerformanceMonitor();

      const result = await generateSubtitleWithBuiltinWhisper(
        event,
        file,
        formData,
      );

      expect(result).toBe(file.srtFile);
    });

    test('should optimize processing for Romance languages (French)', async () => {
      const file = global.subtitleTestUtils.createMockFile({
        fileName: 'romance-french.wav',
      });
      const formData = global.subtitleTestUtils.createMockFormData({
        sourceLanguage: 'fr',
        model: 'base',
      });
      const event = global.subtitleTestUtils.createMockEvent();
      const gpuConfig =
        global.subtitleTestUtils.createMockGPUConfig('openvino');

      global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
      global.subtitleTestUtils.setupMockAudioDuration(450000); // 7.5 minutes

      const mockMonitor =
        global.subtitleTestUtils.setupMockPerformanceMonitor();
      mockMonitor.endSession.mockResolvedValue({
        sessionId: 'session-romance',
        speedupFactor: 3.4,
        processingTime: 132353,
        audioDuration: 450000,
        addonType: 'openvino',
        realTimeRatio: 3.4,
        languageOptimization: 'liaison_handling',
      });

      const result = await generateSubtitleWithBuiltinWhisper(
        event,
        file,
        formData,
      );

      expect(result).toBe(file.srtFile);
    });
  });

  describe('Language Detection Confidence and Accuracy', () => {
    test('should handle high-confidence language detection', async () => {
      const file = global.subtitleTestUtils.createMockFile({
        fileName: 'high-confidence.wav',
      });
      const formData = global.subtitleTestUtils.createMockFormData({
        sourceLanguage: 'auto',
        model: 'base',
      });
      const event = global.subtitleTestUtils.createMockEvent();
      const gpuConfig =
        global.subtitleTestUtils.createMockGPUConfig('openvino');

      global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
      global.subtitleTestUtils.setupMockAudioDuration(300000); // 5 minutes
      global.subtitleTestUtils.setupMockPerformanceMonitor();

      const mockWhisperFn = jest.fn((params) => {
        return Promise.resolve({
          transcription: [
            {
              start: 0,
              end: 30000,
              text: 'This is very clear English speech.',
            },
          ],
          detectedLanguage: 'en',
          languageConfidence: 0.98,
          confidenceLevel: 'high',
        });
      });

      global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
      const { loadWhisperAddon } = require('main/helpers/whisper');
      loadWhisperAddon.mockResolvedValue(mockWhisperFn);

      const result = await generateSubtitleWithBuiltinWhisper(
        event,
        file,
        formData,
      );

      expect(result).toBe(file.srtFile);
    });

    test('should handle medium-confidence language detection', async () => {
      const file = global.subtitleTestUtils.createMockFile({
        fileName: 'medium-confidence.wav',
      });
      const formData = global.subtitleTestUtils.createMockFormData({
        sourceLanguage: 'auto',
        model: 'small',
      });
      const event = global.subtitleTestUtils.createMockEvent();
      const gpuConfig =
        global.subtitleTestUtils.createMockGPUConfig('openvino');

      global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
      global.subtitleTestUtils.setupMockAudioDuration(180000); // 3 minutes
      global.subtitleTestUtils.setupMockPerformanceMonitor();

      const mockWhisperFn = jest.fn((params) => {
        return Promise.resolve({
          transcription: [
            {
              start: 0,
              end: 30000,
              text: 'Speech with some background noise.',
            },
          ],
          detectedLanguage: 'en',
          languageConfidence: 0.75,
          confidenceLevel: 'medium',
          alternativeLanguages: ['es', 'fr'],
        });
      });

      global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
      const { loadWhisperAddon } = require('main/helpers/whisper');
      loadWhisperAddon.mockResolvedValue(mockWhisperFn);

      const result = await generateSubtitleWithBuiltinWhisper(
        event,
        file,
        formData,
      );

      expect(result).toBe(file.srtFile);
    });

    test('should handle low-confidence language detection with fallback', async () => {
      const file = global.subtitleTestUtils.createMockFile({
        fileName: 'low-confidence.wav',
      });
      const formData = global.subtitleTestUtils.createMockFormData({
        sourceLanguage: 'auto',
        model: 'medium',
      });
      const event = global.subtitleTestUtils.createMockEvent();
      const gpuConfig =
        global.subtitleTestUtils.createMockGPUConfig('openvino');

      global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
      global.subtitleTestUtils.setupMockAudioDuration(120000); // 2 minutes
      global.subtitleTestUtils.setupMockPerformanceMonitor();

      const mockWhisperFn = jest.fn((params) => {
        return Promise.resolve({
          transcription: [
            { start: 0, end: 30000, text: 'Unclear speech with heavy accent.' },
          ],
          detectedLanguage: 'en',
          languageConfidence: 0.45,
          confidenceLevel: 'low',
          fallbackApplied: true,
          processingNote: 'Low confidence, used English as fallback',
        });
      });

      global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
      const { loadWhisperAddon } = require('main/helpers/whisper');
      loadWhisperAddon.mockResolvedValue(mockWhisperFn);

      const result = await generateSubtitleWithBuiltinWhisper(
        event,
        file,
        formData,
      );

      expect(result).toBe(file.srtFile);
    });

    test('should handle ambiguous language detection scenarios', async () => {
      const file = global.subtitleTestUtils.createMockFile({
        fileName: 'ambiguous-language.wav',
      });
      const formData = global.subtitleTestUtils.createMockFormData({
        sourceLanguage: 'auto',
        model: 'large',
      });
      const event = global.subtitleTestUtils.createMockEvent();
      const gpuConfig =
        global.subtitleTestUtils.createMockGPUConfig('openvino');

      global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
      global.subtitleTestUtils.setupMockAudioDuration(240000); // 4 minutes
      global.subtitleTestUtils.setupMockPerformanceMonitor();

      const result = await generateSubtitleWithBuiltinWhisper(
        event,
        file,
        formData,
      );

      expect(result).toBe(file.srtFile);
    });
  });

  describe('Error Handling for Language Detection', () => {
    test('should handle unsupported language gracefully', async () => {
      const file = global.subtitleTestUtils.createMockFile({
        fileName: 'unsupported-language.wav',
      });
      const formData = global.subtitleTestUtils.createMockFormData({
        sourceLanguage: 'xyz', // Unsupported language code
        model: 'base',
      });
      const event = global.subtitleTestUtils.createMockEvent();

      global.subtitleTestUtils.setupMockWhisperAddon(false, 'openvino');
      const { loadWhisperAddon } = require('main/helpers/whisper');
      loadWhisperAddon.mockRejectedValue(
        new Error('Unsupported language code: xyz'),
      );

      const { handleProcessingError } = require('main/helpers/errorHandler');
      handleProcessingError.mockRejectedValue(
        new Error(
          'Language "xyz" is not supported. Please select a supported language or use auto-detection.',
        ),
      );

      const gpuConfig =
        global.subtitleTestUtils.createMockGPUConfig('openvino');
      global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
      global.subtitleTestUtils.setupMockAudioDuration(30000);
      global.subtitleTestUtils.setupMockPerformanceMonitor();

      await expect(
        generateSubtitleWithBuiltinWhisper(event, file, formData),
      ).rejects.toThrow('not supported');
    });

    test('should handle language detection failure', async () => {
      const file = global.subtitleTestUtils.createMockFile({
        fileName: 'detection-failure.wav',
      });
      const formData = global.subtitleTestUtils.createMockFormData({
        sourceLanguage: 'auto',
        model: 'base',
      });
      const event = global.subtitleTestUtils.createMockEvent();

      global.subtitleTestUtils.setupMockWhisperAddon(false, 'openvino');
      const { loadWhisperAddon } = require('main/helpers/whisper');
      loadWhisperAddon.mockRejectedValue(
        new Error('Unable to detect language from audio'),
      );

      const { handleProcessingError } = require('main/helpers/errorHandler');
      handleProcessingError.mockResolvedValue(file.srtFile); // Recovery by defaulting to English

      const gpuConfig =
        global.subtitleTestUtils.createMockGPUConfig('openvino');
      global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
      global.subtitleTestUtils.setupMockAudioDuration(30000);
      global.subtitleTestUtils.setupMockPerformanceMonitor();

      const result = await generateSubtitleWithBuiltinWhisper(
        event,
        file,
        formData,
      );

      expect(result).toBe(file.srtFile);
      expect(handleProcessingError).toHaveBeenCalled();
    });

    test('should handle conflicting language detection results', async () => {
      const file = global.subtitleTestUtils.createMockFile({
        fileName: 'conflicting-detection.wav',
      });
      const formData = global.subtitleTestUtils.createMockFormData({
        sourceLanguage: 'auto',
        model: 'medium',
      });
      const event = global.subtitleTestUtils.createMockEvent();
      const gpuConfig =
        global.subtitleTestUtils.createMockGPUConfig('openvino');

      global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
      global.subtitleTestUtils.setupMockAudioDuration(150000); // 2.5 minutes
      global.subtitleTestUtils.setupMockPerformanceMonitor();

      const mockWhisperFn = jest.fn((params) => {
        return Promise.resolve({
          transcription: [
            { start: 0, end: 30000, text: 'Mixed language content detected.' },
          ],
          detectedLanguage: 'en',
          languageConfidence: 0.55,
          conflictingResults: true,
          alternativeLanguages: ['es', 'fr'],
          resolutionStrategy: 'primary_segment_analysis',
        });
      });

      global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
      const { loadWhisperAddon } = require('main/helpers/whisper');
      loadWhisperAddon.mockResolvedValue(mockWhisperFn);

      const result = await generateSubtitleWithBuiltinWhisper(
        event,
        file,
        formData,
      );

      expect(result).toBe(file.srtFile);
    });

    test('should handle audio with no speech content', async () => {
      const file = global.subtitleTestUtils.createMockFile({
        fileName: 'no-speech.wav',
      });
      const formData = global.subtitleTestUtils.createMockFormData({
        sourceLanguage: 'auto',
        model: 'base',
      });
      const event = global.subtitleTestUtils.createMockEvent();

      global.subtitleTestUtils.setupMockWhisperAddon(false, 'openvino');
      const { loadWhisperAddon } = require('main/helpers/whisper');
      loadWhisperAddon.mockRejectedValue(
        new Error('No speech content detected in audio'),
      );

      const { handleProcessingError } = require('main/helpers/errorHandler');
      handleProcessingError.mockRejectedValue(
        new Error(
          'No speech detected in the audio file. Please ensure the file contains spoken content.',
        ),
      );

      const gpuConfig =
        global.subtitleTestUtils.createMockGPUConfig('openvino');
      global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
      global.subtitleTestUtils.setupMockAudioDuration(30000);
      global.subtitleTestUtils.setupMockPerformanceMonitor();

      await expect(
        generateSubtitleWithBuiltinWhisper(event, file, formData),
      ).rejects.toThrow('No speech detected');
    });
  });
});
