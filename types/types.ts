export interface ISystemInfo {
  modelsInstalled: string[];
  modelsPath: string;
  downloadingModels: string[];
}

/**
 * File processing status
 */
export type FileStatus = 'pending' | 'processing' | 'completed' | 'error';

/**
 * Enhanced file information interface
 */
export interface IFiles {
  // Existing fields...
  uuid: string;
  filePath: string;
  fileName: string;
  fileExtension: string;
  directory: string;

  // Processing flags
  extractAudio?: boolean;
  extractSubtitle?: boolean;
  translateSubtitle?: boolean;

  // Generated files
  audioFile?: string;
  srtFile?: string;
  tempSrtFile?: string;
  tempAudioFile?: string;
  translatedSrtFile?: string;
  tempTranslatedSrtFile?: string;

  // New fields for better tracking
  status?: FileStatus;
  fileSize?: number;
  duration?: number; // For media files
  encoding?: string;
  createdAt?: Date;
  processedAt?: Date;
}

export interface IFormData {
  translateContent:
    | 'onlyTranslate'
    | 'sourceAndTranslate'
    | 'translateAndSource';
  targetSrtSaveOption: string;
  customTargetSrtFileName: string;
  sourceLanguage: string;
  targetLanguage: string;
  translateRetryTimes: string;
}

/**
 * Task processing status
 * @since 2025.1
 */
export type TaskStatus =
  | 'pending'
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

/**
 * Task processing interface
 * @since 2025.1
 */
export interface ITask {
  id: string;
  type: 'transcription' | 'translation' | 'extraction';
  status: TaskStatus;
  file: IFiles;
  formData: IFormData;
  progress?: number;
  startTime?: Date;
  endTime?: Date;
  error?: string;
  result?: any;
  metadata?: {
    gpuUsed?: string;
    processingTime?: number;
    modelUsed?: string;
  };
}

/**
 * Task progress update
 * @since 2025.1
 */
export interface ITaskProgress {
  taskId: string;
  progress: number;
  message?: string;
  eta?: number;
}

/**
 * Subtitle interface for subtitle files
 * @since 2025.1
 */
export interface Subtitle {
  id: string;
  startEndTime: string;
  content: string[];
  sourceContent?: string;
  targetContent?: string;
  startTimeInSeconds?: number;
  endTimeInSeconds?: number;
  isEditing?: boolean;
}

/**
 * Subtitle statistics
 * @since 2025.1
 */
export interface SubtitleStats {
  total: number;
  withTranslation: number;
  percent: number;
}

/**
 * Video player subtitle track
 * @since 2025.1
 */
export interface PlayerSubtitleTrack {
  kind: string;
  src: string;
  srcLang: string;
  label: string;
  default?: boolean;
}

/**
 * Translation result for subtitle processing
 * @since 2025.1
 */
export interface TranslationResult {
  id: string;
  startEndTime: string;
  sourceContent: string;
  targetContent: string;
}
