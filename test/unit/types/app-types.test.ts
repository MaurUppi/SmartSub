import * as AppTypes from '../../../types/types';
import {
  IFiles,
  ITask,
  TaskStatus,
  IFormData,
  ISystemInfo,
  Subtitle,
  SubtitleStats,
  PlayerSubtitleTrack,
  TranslationResult,
} from '../../../types';

describe('Application Type Definitions', () => {
  describe('IFiles interface', () => {
    it('should export IFiles interface from types module', () => {
      const file: AppTypes.IFiles = {
        uuid: 'test-uuid-123',
        filePath: '/path/to/video.mp4',
        fileName: 'video.mp4',
        fileExtension: 'mp4',
        directory: '/path/to',
      };

      expect(file).toBeDefined();
      expect(file.uuid).toBe('test-uuid-123');
      expect(file.fileName).toBe('video.mp4');
    });

    it('should support optional processing fields', () => {
      const file: AppTypes.IFiles = {
        uuid: 'test-uuid',
        filePath: '/path/to/file.mp4',
        fileName: 'file.mp4',
        fileExtension: 'mp4',
        directory: '/path/to',
        extractAudio: true,
        extractSubtitle: true,
        translateSubtitle: false,
        status: 'processing',
        fileSize: 1024000,
        duration: 3600,
      };

      expect(file.extractAudio).toBe(true);
      expect(file.status).toBe('processing');
      expect(file.fileSize).toBe(1024000);
    });
  });

  describe('ITask interface', () => {
    it('should export ITask interface from types module', () => {
      const mockFile: AppTypes.IFiles = {
        uuid: 'file-uuid',
        filePath: '/test/file.mp4',
        fileName: 'file.mp4',
        fileExtension: 'mp4',
        directory: '/test',
      };

      const mockFormData: AppTypes.IFormData = {
        translateContent: 'onlyTranslate',
        targetSrtSaveOption: 'default',
        customTargetSrtFileName: '',
        sourceLanguage: 'en',
        targetLanguage: 'zh',
        translateRetryTimes: '3',
      };

      const task: AppTypes.ITask = {
        id: 'task-1',
        type: 'transcription',
        status: 'pending',
        file: mockFile,
        formData: mockFormData,
      };

      expect(task).toBeDefined();
      expect(task.id).toBe('task-1');
      expect(task.type).toBe('transcription');
      expect(task.status).toBe('pending');
    });

    it('should support optional task fields', () => {
      const task: AppTypes.ITask = {
        id: 'task-2',
        type: 'translation',
        status: 'completed',
        file: {} as AppTypes.IFiles,
        formData: {} as AppTypes.IFormData,
        progress: 100,
        startTime: new Date('2025-01-01T10:00:00'),
        endTime: new Date('2025-01-01T10:30:00'),
        error: null,
        result: { success: true },
        metadata: {
          gpuUsed: 'NVIDIA RTX 4090',
          processingTime: 1800,
          modelUsed: 'whisper-large-v3',
        },
      };

      expect(task.progress).toBe(100);
      expect(task.metadata?.gpuUsed).toBe('NVIDIA RTX 4090');
      expect(task.metadata?.processingTime).toBe(1800);
    });
  });

  describe('TaskStatus type', () => {
    it('should accept valid task status values', () => {
      const statuses: AppTypes.TaskStatus[] = [
        'pending',
        'queued',
        'processing',
        'completed',
        'failed',
        'cancelled',
      ];

      statuses.forEach((status) => {
        const validStatus: AppTypes.TaskStatus = status;
        expect(validStatus).toBe(status);
      });
    });
  });

  describe('IFormData interface', () => {
    it('should export IFormData interface', () => {
      const formData: AppTypes.IFormData = {
        translateContent: 'sourceAndTranslate',
        targetSrtSaveOption: 'custom',
        customTargetSrtFileName: 'translated.srt',
        sourceLanguage: 'en',
        targetLanguage: 'zh',
        translateRetryTimes: '5',
      };

      expect(formData).toBeDefined();
      expect(formData.translateContent).toBe('sourceAndTranslate');
      expect(formData.targetLanguage).toBe('zh');
    });
  });

  describe('ISystemInfo interface', () => {
    it('should export ISystemInfo interface', () => {
      const systemInfo: AppTypes.ISystemInfo = {
        modelsInstalled: ['whisper-base', 'whisper-large-v3'],
        modelsPath: '/path/to/models',
        downloadingModels: ['whisper-medium'],
      };

      expect(systemInfo).toBeDefined();
      expect(systemInfo.modelsInstalled).toHaveLength(2);
      expect(systemInfo.downloadingModels).toContain('whisper-medium');
    });
  });

  describe('Subtitle interfaces', () => {
    it('should export Subtitle interface', () => {
      const subtitle: AppTypes.Subtitle = {
        id: 'sub-1',
        startEndTime: '00:00:01,000 --> 00:00:03,000',
        content: ['Hello world'],
        sourceContent: 'Hello world',
        targetContent: '你好世界',
        startTimeInSeconds: 1.0,
        endTimeInSeconds: 3.0,
        isEditing: false,
      };

      expect(subtitle).toBeDefined();
      expect(subtitle.content).toContain('Hello world');
      expect(subtitle.targetContent).toBe('你好世界');
    });

    it('should export SubtitleStats interface', () => {
      const stats: AppTypes.SubtitleStats = {
        total: 100,
        withTranslation: 85,
        percent: 85,
      };

      expect(stats).toBeDefined();
      expect(stats.total).toBe(100);
      expect(stats.percent).toBe(85);
    });

    it('should export PlayerSubtitleTrack interface', () => {
      const track: AppTypes.PlayerSubtitleTrack = {
        kind: 'subtitles',
        src: 'blob:http://localhost:3000/subtitle-track',
        srcLang: 'en',
        label: '(en)',
        default: true,
      };

      expect(track).toBeDefined();
      expect(track.kind).toBe('subtitles');
      expect(track.default).toBe(true);
    });

    it('should export TranslationResult interface', () => {
      const result: AppTypes.TranslationResult = {
        id: 'trans-1',
        startEndTime: '00:00:01,000 --> 00:00:03,000',
        sourceContent: 'Hello',
        targetContent: '你好',
      };

      expect(result).toBeDefined();
      expect(result.sourceContent).toBe('Hello');
      expect(result.targetContent).toBe('你好');
    });
  });

  describe('Central imports from types module', () => {
    it('should allow central imports from types', () => {
      const file: IFiles = {
        uuid: 'central-test',
        filePath: '/central/test.mp4',
        fileName: 'test.mp4',
        fileExtension: 'mp4',
        directory: '/central',
      };

      const status: TaskStatus = 'completed';
      const formData: IFormData = {
        translateContent: 'onlyTranslate',
        targetSrtSaveOption: 'default',
        customTargetSrtFileName: '',
        sourceLanguage: 'en',
        targetLanguage: 'fr',
        translateRetryTimes: '3',
      };

      expect(file).toBeDefined();
      expect(status).toBe('completed');
      expect(formData.targetLanguage).toBe('fr');
    });

    it('should import all application types from central export', () => {
      const systemInfo: ISystemInfo = {
        modelsInstalled: ['test-model'],
        modelsPath: '/models',
        downloadingModels: [],
      };

      const subtitle: Subtitle = {
        id: 'test-sub',
        startEndTime: '00:00:00,000 --> 00:00:02,000',
        content: ['Test subtitle'],
      };

      const stats: SubtitleStats = {
        total: 10,
        withTranslation: 8,
        percent: 80,
      };

      const track: PlayerSubtitleTrack = {
        kind: 'subtitles',
        src: 'test.vtt',
        srcLang: 'en',
        label: 'English',
      };

      const translation: TranslationResult = {
        id: 'trans-test',
        startEndTime: '00:00:00,000 --> 00:00:02,000',
        sourceContent: 'Test',
        targetContent: 'Test Translation',
      };

      expect(systemInfo).toBeDefined();
      expect(subtitle).toBeDefined();
      expect(stats).toBeDefined();
      expect(track).toBeDefined();
      expect(translation).toBeDefined();
    });
  });

  describe('Type validation', () => {
    it('should enforce correct TaskStatus values', () => {
      // This test ensures TypeScript type checking works correctly
      const validStatuses: TaskStatus[] = [
        'pending',
        'processing',
        'completed',
      ];
      validStatuses.forEach((status) => {
        expect(typeof status).toBe('string');
      });
    });

    it('should enforce required IFiles fields', () => {
      // This test ensures required fields are present
      const minimalFile: IFiles = {
        uuid: 'req-test',
        filePath: '/req/test.mp4',
        fileName: 'test.mp4',
        fileExtension: 'mp4',
        directory: '/req',
      };

      expect(minimalFile.uuid).toBeDefined();
      expect(minimalFile.filePath).toBeDefined();
      expect(minimalFile.fileName).toBeDefined();
      expect(minimalFile.fileExtension).toBeDefined();
      expect(minimalFile.directory).toBeDefined();
    });
  });
});
