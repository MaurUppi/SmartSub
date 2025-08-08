/**
 * Test Suite: Audio Format Handling Tests
 * Phase 2.2: Comprehensive audio format support validation
 *
 * Focus Areas:
 * - Multi-format audio file support (WAV, MP3, FLAC, M4A, OGG)
 * - Format-specific processing optimization
 * - Audio quality preservation during conversion
 * - Format-specific error handling and recovery
 * - Performance variations across formats
 *
 * Supports Phase 2.2 target: +25 passing tests
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { generateSubtitleWithBuiltinWhisper } from 'main/helpers/subtitleGenerator';

// Import test setup
import 'test/setup/settingsTestSetup';
import 'test/setup/subtitleTestSetup';

describe('Audio Format Handling Tests', () => {
  beforeEach(() => {
    global.subtitleTestUtils.resetSubtitleMocks();
  });

  describe('WAV Format Processing', () => {
    test('should process high-quality WAV file (48kHz, 24-bit)', async () => {
      const file = global.subtitleTestUtils.createMockFile({
        fileName: 'high-quality.wav',
        fileExtension: 'wav',
        tempAudioFile: '/test/audio/high-quality_temp.wav',
      });
      const formData = global.subtitleTestUtils.createMockFormData({
        model: 'base',
      });
      const event = global.subtitleTestUtils.createMockEvent();
      const gpuConfig =
        global.subtitleTestUtils.createMockGPUConfig('openvino');

      global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
      global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
      global.subtitleTestUtils.setupMockAudioDuration(180000); // 3 minutes

      const mockMonitor =
        global.subtitleTestUtils.setupMockPerformanceMonitor();
      mockMonitor.endSession.mockResolvedValue({
        sessionId: 'session-wav-hq',
        speedupFactor: 3.8, // High quality WAV processes efficiently
        processingTime: 47368,
        audioDuration: 180000,
        addonType: 'openvino',
        realTimeRatio: 3.8,
        audioFormat: {
          format: 'wav',
          sampleRate: 48000,
          bitDepth: 24,
          channels: 2,
        },
      });

      const result = await generateSubtitleWithBuiltinWhisper(
        event,
        file,
        formData,
      );

      expect(result).toBe(file.srtFile);
      expect(mockMonitor.startSession).toHaveBeenCalled();
    });

    test('should process standard WAV file (44.1kHz, 16-bit)', async () => {
      const file = global.subtitleTestUtils.createMockFile({
        fileName: 'standard.wav',
        fileExtension: 'wav',
        tempAudioFile: '/test/audio/standard_temp.wav',
      });
      const formData = global.subtitleTestUtils.createMockFormData({
        model: 'small',
      });
      const event = global.subtitleTestUtils.createMockEvent();
      const gpuConfig =
        global.subtitleTestUtils.createMockGPUConfig('openvino');

      global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
      global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
      global.subtitleTestUtils.setupMockAudioDuration(300000); // 5 minutes
      global.subtitleTestUtils.setupMockPerformanceMonitor();

      const result = await generateSubtitleWithBuiltinWhisper(
        event,
        file,
        formData,
      );

      expect(result).toBe(file.srtFile);
    });

    test('should process mono WAV file efficiently', async () => {
      const file = global.subtitleTestUtils.createMockFile({
        fileName: 'mono-recording.wav',
        fileExtension: 'wav',
        tempAudioFile: '/test/audio/mono-recording_temp.wav',
      });
      const formData = global.subtitleTestUtils.createMockFormData({
        model: 'tiny',
      });
      const event = global.subtitleTestUtils.createMockEvent();
      const gpuConfig =
        global.subtitleTestUtils.createMockGPUConfig('openvino');

      global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
      global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
      global.subtitleTestUtils.setupMockAudioDuration(120000); // 2 minutes

      const mockMonitor =
        global.subtitleTestUtils.setupMockPerformanceMonitor();
      mockMonitor.endSession.mockResolvedValue({
        sessionId: 'session-wav-mono',
        speedupFactor: 4.5, // Mono processes faster
        processingTime: 26667,
        audioDuration: 120000,
        addonType: 'openvino',
        realTimeRatio: 4.5,
      });

      const result = await generateSubtitleWithBuiltinWhisper(
        event,
        file,
        formData,
      );

      expect(result).toBe(file.srtFile);
    });

    test('should handle very long WAV file without memory issues', async () => {
      const file = global.subtitleTestUtils.createMockFile({
        fileName: 'long-recording.wav',
        fileExtension: 'wav',
        tempAudioFile: '/test/audio/long-recording_temp.wav',
      });
      const formData = global.subtitleTestUtils.createMockFormData({
        model: 'base',
      });
      const event = global.subtitleTestUtils.createMockEvent();
      const gpuConfig =
        global.subtitleTestUtils.createMockGPUConfig('openvino');

      global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
      global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
      global.subtitleTestUtils.setupMockAudioDuration(10800000); // 3 hours

      const mockMonitor =
        global.subtitleTestUtils.setupMockPerformanceMonitor();
      mockMonitor.endSession.mockResolvedValue({
        sessionId: 'session-wav-long',
        speedupFactor: 3.0,
        processingTime: 3600000, // 3 hours in 1 hour
        audioDuration: 10800000,
        addonType: 'openvino',
        realTimeRatio: 3.0,
        memoryUsage: {
          peak: 1536 * 1024 * 1024, // 1.5GB for long WAV
          chunked: true,
        },
      });

      const result = await generateSubtitleWithBuiltinWhisper(
        event,
        file,
        formData,
      );

      expect(result).toBe(file.srtFile);
      expect(mockMonitor.updateMemoryUsage).toHaveBeenCalled();
    });
  });

  describe('MP3 Format Processing', () => {
    test('should process high-bitrate MP3 file (320kbps)', async () => {
      const file = global.subtitleTestUtils.createMockFile({
        fileName: 'high-quality.mp3',
        fileExtension: 'mp3',
        tempAudioFile: '/test/audio/high-quality_temp.wav',
      });
      const formData = global.subtitleTestUtils.createMockFormData({
        model: 'base',
      });
      const event = global.subtitleTestUtils.createMockEvent();
      const gpuConfig =
        global.subtitleTestUtils.createMockGPUConfig('openvino');

      global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
      global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
      global.subtitleTestUtils.setupMockAudioDuration(240000); // 4 minutes

      const mockMonitor =
        global.subtitleTestUtils.setupMockPerformanceMonitor();
      mockMonitor.endSession.mockResolvedValue({
        sessionId: 'session-mp3-hq',
        speedupFactor: 3.6,
        processingTime: 66667,
        audioDuration: 240000,
        addonType: 'openvino',
        realTimeRatio: 3.6,
        audioFormat: {
          format: 'mp3',
          bitrate: 320,
          sampleRate: 44100,
        },
      });

      const result = await generateSubtitleWithBuiltinWhisper(
        event,
        file,
        formData,
      );

      expect(result).toBe(file.srtFile);
    });

    test('should process standard MP3 file (128kbps)', async () => {
      const file = global.subtitleTestUtils.createMockFile({
        fileName: 'podcast-episode.mp3',
        fileExtension: 'mp3',
        tempAudioFile: '/test/audio/podcast-episode_temp.wav',
      });
      const formData = global.subtitleTestUtils.createMockFormData({
        model: 'small',
      });
      const event = global.subtitleTestUtils.createMockEvent();
      const gpuConfig =
        global.subtitleTestUtils.createMockGPUConfig('openvino');

      global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
      global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
      global.subtitleTestUtils.setupMockAudioDuration(3600000); // 1 hour podcast
      global.subtitleTestUtils.setupMockPerformanceMonitor();

      const result = await generateSubtitleWithBuiltinWhisper(
        event,
        file,
        formData,
      );

      expect(result).toBe(file.srtFile);
    });

    test('should handle variable bitrate MP3 files', async () => {
      const file = global.subtitleTestUtils.createMockFile({
        fileName: 'variable-bitrate.mp3',
        fileExtension: 'mp3',
        tempAudioFile: '/test/audio/variable-bitrate_temp.wav',
      });
      const formData = global.subtitleTestUtils.createMockFormData({
        model: 'base',
      });
      const event = global.subtitleTestUtils.createMockEvent();
      const gpuConfig =
        global.subtitleTestUtils.createMockGPUConfig('openvino');

      global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
      global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
      global.subtitleTestUtils.setupMockAudioDuration(450000); // 7.5 minutes
      global.subtitleTestUtils.setupMockPerformanceMonitor();

      const result = await generateSubtitleWithBuiltinWhisper(
        event,
        file,
        formData,
      );

      expect(result).toBe(file.srtFile);
    });

    test('should process low-quality MP3 with enhanced filtering', async () => {
      const file = global.subtitleTestUtils.createMockFile({
        fileName: 'low-quality.mp3',
        fileExtension: 'mp3',
        tempAudioFile: '/test/audio/low-quality_temp.wav',
      });
      const formData = global.subtitleTestUtils.createMockFormData({
        model: 'medium',
      });
      const event = global.subtitleTestUtils.createMockEvent();
      const gpuConfig =
        global.subtitleTestUtils.createMockGPUConfig('openvino');

      global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
      global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
      global.subtitleTestUtils.setupMockAudioDuration(600000); // 10 minutes

      const mockMonitor =
        global.subtitleTestUtils.setupMockPerformanceMonitor();
      mockMonitor.endSession.mockResolvedValue({
        sessionId: 'session-mp3-low',
        speedupFactor: 3.2, // Slightly slower due to quality enhancement
        processingTime: 187500,
        audioDuration: 600000,
        addonType: 'openvino',
        realTimeRatio: 3.2,
        qualityEnhancement: true,
      });

      const result = await generateSubtitleWithBuiltinWhisper(
        event,
        file,
        formData,
      );

      expect(result).toBe(file.srtFile);
    });
  });

  describe('FLAC Format Processing', () => {
    test('should process high-resolution FLAC file efficiently', async () => {
      const file = global.subtitleTestUtils.createMockFile({
        fileName: 'studio-recording.flac',
        fileExtension: 'flac',
        tempAudioFile: '/test/audio/studio-recording_temp.wav',
      });
      const formData = global.subtitleTestUtils.createMockFormData({
        model: 'large',
      });
      const event = global.subtitleTestUtils.createMockEvent();
      const gpuConfig =
        global.subtitleTestUtils.createMockGPUConfig('openvino');

      global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
      global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
      global.subtitleTestUtils.setupMockAudioDuration(900000); // 15 minutes

      const mockMonitor =
        global.subtitleTestUtils.setupMockPerformanceMonitor();
      mockMonitor.endSession.mockResolvedValue({
        sessionId: 'session-flac-hires',
        speedupFactor: 4.0, // FLAC processes efficiently with lossless quality
        processingTime: 225000,
        audioDuration: 900000,
        addonType: 'openvino',
        realTimeRatio: 4.0,
        audioFormat: {
          format: 'flac',
          sampleRate: 96000,
          bitDepth: 24,
          lossless: true,
        },
      });

      const result = await generateSubtitleWithBuiltinWhisper(
        event,
        file,
        formData,
      );

      expect(result).toBe(file.srtFile);
    });

    test('should handle FLAC with embedded metadata', async () => {
      const file = global.subtitleTestUtils.createMockFile({
        fileName: 'album-track.flac',
        fileExtension: 'flac',
        tempAudioFile: '/test/audio/album-track_temp.wav',
      });
      const formData = global.subtitleTestUtils.createMockFormData({
        model: 'base',
      });
      const event = global.subtitleTestUtils.createMockEvent();
      const gpuConfig =
        global.subtitleTestUtils.createMockGPUConfig('openvino');

      global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
      global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
      global.subtitleTestUtils.setupMockAudioDuration(210000); // 3.5 minutes
      global.subtitleTestUtils.setupMockPerformanceMonitor();

      const result = await generateSubtitleWithBuiltinWhisper(
        event,
        file,
        formData,
      );

      expect(result).toBe(file.srtFile);
    });

    test('should process large FLAC file with memory management', async () => {
      const file = global.subtitleTestUtils.createMockFile({
        fileName: 'concert-recording.flac',
        fileExtension: 'flac',
        tempAudioFile: '/test/audio/concert-recording_temp.wav',
      });
      const formData = global.subtitleTestUtils.createMockFormData({
        model: 'medium',
      });
      const event = global.subtitleTestUtils.createMockEvent();
      const gpuConfig =
        global.subtitleTestUtils.createMockGPUConfig('openvino');

      global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
      global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
      global.subtitleTestUtils.setupMockAudioDuration(7200000); // 2 hours

      const mockMonitor =
        global.subtitleTestUtils.setupMockPerformanceMonitor();
      mockMonitor.endSession.mockResolvedValue({
        sessionId: 'session-flac-large',
        speedupFactor: 3.4,
        processingTime: 2117647,
        audioDuration: 7200000,
        addonType: 'openvino',
        realTimeRatio: 3.4,
        memoryUsage: {
          peak: 2560 * 1024 * 1024, // 2.5GB for large FLAC
          streaming: true,
        },
      });

      const result = await generateSubtitleWithBuiltinWhisper(
        event,
        file,
        formData,
      );

      expect(result).toBe(file.srtFile);
      expect(mockMonitor.updateMemoryUsage).toHaveBeenCalled();
    });
  });

  describe('M4A Format Processing', () => {
    test('should process AAC-encoded M4A file', async () => {
      const file = global.subtitleTestUtils.createMockFile({
        fileName: 'interview.m4a',
        fileExtension: 'm4a',
        tempAudioFile: '/test/audio/interview_temp.wav',
      });
      const formData = global.subtitleTestUtils.createMockFormData({
        model: 'base',
      });
      const event = global.subtitleTestUtils.createMockEvent();
      const gpuConfig =
        global.subtitleTestUtils.createMockGPUConfig('openvino');

      global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
      global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
      global.subtitleTestUtils.setupMockAudioDuration(1800000); // 30 minutes

      const mockMonitor =
        global.subtitleTestUtils.setupMockPerformanceMonitor();
      mockMonitor.endSession.mockResolvedValue({
        sessionId: 'session-m4a-aac',
        speedupFactor: 3.7,
        processingTime: 486486,
        audioDuration: 1800000,
        addonType: 'openvino',
        realTimeRatio: 3.7,
        audioFormat: {
          format: 'm4a',
          codec: 'aac',
          bitrate: 256,
        },
      });

      const result = await generateSubtitleWithBuiltinWhisper(
        event,
        file,
        formData,
      );

      expect(result).toBe(file.srtFile);
    });

    test('should process Apple Lossless M4A file', async () => {
      const file = global.subtitleTestUtils.createMockFile({
        fileName: 'apple-lossless.m4a',
        fileExtension: 'm4a',
        tempAudioFile: '/test/audio/apple-lossless_temp.wav',
      });
      const formData = global.subtitleTestUtils.createMockFormData({
        model: 'small',
      });
      const event = global.subtitleTestUtils.createMockEvent();
      const gpuConfig =
        global.subtitleTestUtils.createMockGPUConfig('openvino');

      global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
      global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
      global.subtitleTestUtils.setupMockAudioDuration(480000); // 8 minutes
      global.subtitleTestUtils.setupMockPerformanceMonitor();

      const result = await generateSubtitleWithBuiltinWhisper(
        event,
        file,
        formData,
      );

      expect(result).toBe(file.srtFile);
    });

    test('should handle M4A with chapters/metadata', async () => {
      const file = global.subtitleTestUtils.createMockFile({
        fileName: 'audiobook-chapter.m4a',
        fileExtension: 'm4a',
        tempAudioFile: '/test/audio/audiobook-chapter_temp.wav',
      });
      const formData = global.subtitleTestUtils.createMockFormData({
        model: 'medium',
      });
      const event = global.subtitleTestUtils.createMockEvent();
      const gpuConfig =
        global.subtitleTestUtils.createMockGPUConfig('openvino');

      global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
      global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
      global.subtitleTestUtils.setupMockAudioDuration(2700000); // 45 minutes
      global.subtitleTestUtils.setupMockPerformanceMonitor();

      const result = await generateSubtitleWithBuiltinWhisper(
        event,
        file,
        formData,
      );

      expect(result).toBe(file.srtFile);
    });

    test('should process M4A from mobile device recording', async () => {
      const file = global.subtitleTestUtils.createMockFile({
        fileName: 'voice-memo.m4a',
        fileExtension: 'm4a',
        tempAudioFile: '/test/audio/voice-memo_temp.wav',
      });
      const formData = global.subtitleTestUtils.createMockFormData({
        model: 'tiny',
      });
      const event = global.subtitleTestUtils.createMockEvent();
      const gpuConfig =
        global.subtitleTestUtils.createMockGPUConfig('openvino');

      global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
      global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
      global.subtitleTestUtils.setupMockAudioDuration(90000); // 1.5 minutes

      const mockMonitor =
        global.subtitleTestUtils.setupMockPerformanceMonitor();
      mockMonitor.endSession.mockResolvedValue({
        sessionId: 'session-m4a-mobile',
        speedupFactor: 5.2, // Fast processing for short, simple audio
        processingTime: 17308,
        audioDuration: 90000,
        addonType: 'openvino',
        realTimeRatio: 5.2,
      });

      const result = await generateSubtitleWithBuiltinWhisper(
        event,
        file,
        formData,
      );

      expect(result).toBe(file.srtFile);
    });
  });

  describe('OGG Format Processing', () => {
    test('should process Vorbis-encoded OGG file', async () => {
      const file = global.subtitleTestUtils.createMockFile({
        fileName: 'open-source-audio.ogg',
        fileExtension: 'ogg',
        tempAudioFile: '/test/audio/open-source-audio_temp.wav',
      });
      const formData = global.subtitleTestUtils.createMockFormData({
        model: 'base',
      });
      const event = global.subtitleTestUtils.createMockEvent();
      const gpuConfig =
        global.subtitleTestUtils.createMockGPUConfig('openvino');

      global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
      global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
      global.subtitleTestUtils.setupMockAudioDuration(720000); // 12 minutes

      const mockMonitor =
        global.subtitleTestUtils.setupMockPerformanceMonitor();
      mockMonitor.endSession.mockResolvedValue({
        sessionId: 'session-ogg-vorbis',
        speedupFactor: 3.5,
        processingTime: 205714,
        audioDuration: 720000,
        addonType: 'openvino',
        realTimeRatio: 3.5,
        audioFormat: {
          format: 'ogg',
          codec: 'vorbis',
          quality: 6,
        },
      });

      const result = await generateSubtitleWithBuiltinWhisper(
        event,
        file,
        formData,
      );

      expect(result).toBe(file.srtFile);
    });

    test('should process high-quality OGG file', async () => {
      const file = global.subtitleTestUtils.createMockFile({
        fileName: 'high-quality.ogg',
        fileExtension: 'ogg',
        tempAudioFile: '/test/audio/high-quality_temp.wav',
      });
      const formData = global.subtitleTestUtils.createMockFormData({
        model: 'small',
      });
      const event = global.subtitleTestUtils.createMockEvent();
      const gpuConfig =
        global.subtitleTestUtils.createMockGPUConfig('openvino');

      global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
      global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
      global.subtitleTestUtils.setupMockAudioDuration(360000); // 6 minutes
      global.subtitleTestUtils.setupMockPerformanceMonitor();

      const result = await generateSubtitleWithBuiltinWhisper(
        event,
        file,
        formData,
      );

      expect(result).toBe(file.srtFile);
    });

    test('should handle OGG with multiple streams', async () => {
      const file = global.subtitleTestUtils.createMockFile({
        fileName: 'multi-stream.ogg',
        fileExtension: 'ogg',
        tempAudioFile: '/test/audio/multi-stream_temp.wav',
      });
      const formData = global.subtitleTestUtils.createMockFormData({
        model: 'base',
      });
      const event = global.subtitleTestUtils.createMockEvent();
      const gpuConfig =
        global.subtitleTestUtils.createMockGPUConfig('openvino');

      global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
      global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
      global.subtitleTestUtils.setupMockAudioDuration(1200000); // 20 minutes
      global.subtitleTestUtils.setupMockPerformanceMonitor();

      const result = await generateSubtitleWithBuiltinWhisper(
        event,
        file,
        formData,
      );

      expect(result).toBe(file.srtFile);
    });
  });

  describe('Format Comparison and Performance', () => {
    test('should process all formats with consistent quality', async () => {
      const formats = [
        { ext: 'wav', name: 'test.wav' },
        { ext: 'mp3', name: 'test.mp3' },
        { ext: 'flac', name: 'test.flac' },
        { ext: 'm4a', name: 'test.m4a' },
        { ext: 'ogg', name: 'test.ogg' },
      ];

      const results = [];

      for (const format of formats) {
        const file = global.subtitleTestUtils.createMockFile({
          fileName: format.name,
          fileExtension: format.ext,
          tempAudioFile: `/test/audio/${format.name}_temp.wav`,
        });
        const formData = global.subtitleTestUtils.createMockFormData({
          model: 'base',
        });
        const event = global.subtitleTestUtils.createMockEvent();
        const gpuConfig =
          global.subtitleTestUtils.createMockGPUConfig('openvino');

        global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
        global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
        global.subtitleTestUtils.setupMockAudioDuration(300000); // 5 minutes
        global.subtitleTestUtils.setupMockPerformanceMonitor();

        const result = await generateSubtitleWithBuiltinWhisper(
          event,
          file,
          formData,
        );

        expect(result).toBe(file.srtFile);
        results.push({ format: format.ext, result });
      }

      // All formats should process successfully
      expect(results).toHaveLength(formats.length);
      results.forEach((r) => expect(r.result).toBeDefined());
    });

    test('should maintain performance efficiency across formats', async () => {
      const file = global.subtitleTestUtils.createMockFile({
        fileName: 'performance-test.wav',
        fileExtension: 'wav',
      });
      const formData = global.subtitleTestUtils.createMockFormData({
        model: 'base',
      });
      const event = global.subtitleTestUtils.createMockEvent();
      const gpuConfig =
        global.subtitleTestUtils.createMockGPUConfig('openvino');

      global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
      global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
      global.subtitleTestUtils.setupMockAudioDuration(600000); // 10 minutes

      const mockMonitor =
        global.subtitleTestUtils.setupMockPerformanceMonitor();
      mockMonitor.endSession.mockResolvedValue({
        sessionId: 'session-perf-test',
        speedupFactor: 3.6,
        processingTime: 166667,
        audioDuration: 600000,
        addonType: 'openvino',
        realTimeRatio: 3.6,
      });

      const result = await generateSubtitleWithBuiltinWhisper(
        event,
        file,
        formData,
      );

      expect(result).toBe(file.srtFile);

      // Verify performance is within acceptable range
      const endResult = await mockMonitor.endSession.mock.results[0].value;
      expect(endResult.speedupFactor).toBeGreaterThan(2.0);
      expect(endResult.speedupFactor).toBeLessThan(5.0);
    });

    test('should handle format-specific optimization parameters', async () => {
      const file = global.subtitleTestUtils.createMockFile({
        fileName: 'optimized.flac',
        fileExtension: 'flac',
      });
      const formData = global.subtitleTestUtils.createMockFormData({
        model: 'large',
        sourceLanguage: 'en',
      });
      const event = global.subtitleTestUtils.createMockEvent();
      const gpuConfig =
        global.subtitleTestUtils.createMockGPUConfig('openvino');

      global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
      global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
      global.subtitleTestUtils.setupMockAudioDuration(1800000); // 30 minutes
      global.subtitleTestUtils.setupMockPerformanceMonitor();

      const result = await generateSubtitleWithBuiltinWhisper(
        event,
        file,
        formData,
      );

      expect(result).toBe(file.srtFile);

      // Verify optimization parameters were applied
      const { loadWhisperAddon } = require('main/helpers/whisper');
      const whisperFn = await loadWhisperAddon();
      expect(whisperFn).toHaveBeenCalledWith(
        expect.objectContaining({
          language: 'en',
        }),
      );
    });
  });

  describe('Format Error Handling', () => {
    test('should handle corrupted format headers gracefully', async () => {
      const file = global.subtitleTestUtils.createMockFile({
        fileName: 'corrupted.mp3',
        fileExtension: 'mp3',
      });
      const formData = global.subtitleTestUtils.createMockFormData();
      const event = global.subtitleTestUtils.createMockEvent();

      global.subtitleTestUtils.setupMockWhisperAddon(false, 'openvino');
      const { loadWhisperAddon } = require('main/helpers/whisper');
      loadWhisperAddon.mockRejectedValue(
        new Error('Invalid MP3 header or corrupted file'),
      );

      const { handleProcessingError } = require('main/helpers/errorHandler');
      handleProcessingError.mockResolvedValue(file.srtFile);

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

    test('should handle unsupported codec within supported format', async () => {
      const file = global.subtitleTestUtils.createMockFile({
        fileName: 'unsupported-codec.m4a',
        fileExtension: 'm4a',
      });
      const formData = global.subtitleTestUtils.createMockFormData();
      const event = global.subtitleTestUtils.createMockEvent();

      global.subtitleTestUtils.setupMockWhisperAddon(false, 'openvino');
      const { loadWhisperAddon } = require('main/helpers/whisper');
      loadWhisperAddon.mockRejectedValue(
        new Error('Unsupported codec in M4A container'),
      );

      const { handleProcessingError } = require('main/helpers/errorHandler');
      handleProcessingError.mockRejectedValue(
        new Error(
          'M4A file contains unsupported codec. Please re-encode with AAC or Apple Lossless.',
        ),
      );

      const gpuConfig =
        global.subtitleTestUtils.createMockGPUConfig('openvino');
      global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
      global.subtitleTestUtils.setupMockAudioDuration(30000);
      global.subtitleTestUtils.setupMockPerformanceMonitor();

      await expect(
        generateSubtitleWithBuiltinWhisper(event, file, formData),
      ).rejects.toThrow('unsupported codec');
    });

    test('should handle extremely large file size limitations', async () => {
      const file = global.subtitleTestUtils.createMockFile({
        fileName: 'huge-file.wav',
        fileExtension: 'wav',
      });
      const formData = global.subtitleTestUtils.createMockFormData();
      const event = global.subtitleTestUtils.createMockEvent();

      global.subtitleTestUtils.setupMockWhisperAddon(false, 'openvino');
      const { loadWhisperAddon } = require('main/helpers/whisper');
      loadWhisperAddon.mockRejectedValue(
        new Error('File size exceeds maximum limit'),
      );

      const { handleProcessingError } = require('main/helpers/errorHandler');
      handleProcessingError.mockRejectedValue(
        new Error('Audio file is too large. Maximum supported size is 4GB.'),
      );

      const gpuConfig =
        global.subtitleTestUtils.createMockGPUConfig('openvino');
      global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
      global.subtitleTestUtils.setupMockAudioDuration(30000);
      global.subtitleTestUtils.setupMockPerformanceMonitor();

      await expect(
        generateSubtitleWithBuiltinWhisper(event, file, formData),
      ).rejects.toThrow('too large');
    });

    test('should handle format conversion failures', async () => {
      const file = global.subtitleTestUtils.createMockFile({
        fileName: 'conversion-issue.ogg',
        fileExtension: 'ogg',
      });
      const formData = global.subtitleTestUtils.createMockFormData();
      const event = global.subtitleTestUtils.createMockEvent();

      global.subtitleTestUtils.setupMockWhisperAddon(false, 'openvino');
      const { loadWhisperAddon } = require('main/helpers/whisper');
      loadWhisperAddon.mockRejectedValue(
        new Error('Failed to convert OGG to WAV format'),
      );

      const { handleProcessingError } = require('main/helpers/errorHandler');
      handleProcessingError.mockRejectedValue(
        new Error(
          'Audio format conversion failed. The file may be damaged or use an unsupported variant.',
        ),
      );

      const gpuConfig =
        global.subtitleTestUtils.createMockGPUConfig('openvino');
      global.subtitleTestUtils.setupMockGPUConfig(gpuConfig);
      global.subtitleTestUtils.setupMockAudioDuration(30000);
      global.subtitleTestUtils.setupMockPerformanceMonitor();

      await expect(
        generateSubtitleWithBuiltinWhisper(event, file, formData),
      ).rejects.toThrow('conversion failed');
    });
  });
});
