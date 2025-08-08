/**
 * Mock implementation of useSubtitles hook
 * Provides configurable subtitle scenarios for testing
 */

import { Subtitle, SubtitleStats, PlayerSubtitleTrack } from '../useSubtitles';
import { IFiles } from '../../../types';

// Mock subtitle data for testing
const mockSubtitles: Subtitle[] = [
  {
    id: '1',
    startEndTime: '00:00:00,000 --> 00:00:05,000',
    content: ['Hello, world!'],
    sourceContent: 'Hello, world!',
    targetContent: '你好，世界！',
    startTimeInSeconds: 0,
    endTimeInSeconds: 5,
    isEditing: false,
  },
  {
    id: '2',
    startEndTime: '00:00:05,000 --> 00:00:10,000',
    content: ['This is a test subtitle.'],
    sourceContent: 'This is a test subtitle.',
    targetContent: '这是一个测试字幕。',
    startTimeInSeconds: 5,
    endTimeInSeconds: 10,
    isEditing: false,
  },
  {
    id: '3',
    startEndTime: '00:00:10,000 --> 00:00:15,000',
    content: ['Testing subtitle functionality.'],
    sourceContent: 'Testing subtitle functionality.',
    targetContent: '', // No translation - for testing failed translations
    startTimeInSeconds: 10,
    endTimeInSeconds: 15,
    isEditing: false,
  },
];

const mockPlayerTracks: PlayerSubtitleTrack[] = [
  {
    kind: 'subtitles',
    src: 'blob:mock-subtitle-track-1',
    srcLang: 'en',
    label: '(en)',
    default: false,
  },
  {
    kind: 'subtitles',
    src: 'blob:mock-subtitle-track-2',
    srcLang: 'zh',
    label: '(zh)',
    default: true,
  },
];

// Global mock state
let mockState = {
  mergedSubtitles: mockSubtitles,
  videoPath: '/mock/path/to/video.mp4',
  currentSubtitleIndex: -1,
  videoInfo: { fileName: 'video', extension: 'mp4' },
  hasTranslationFile: true,
  shouldShowTranslation: true,
  subtitleTracksForPlayer: mockPlayerTracks,
  handleSubtitleChangeCalled: false,
  handleSaveCalled: false,
};

// Test scenarios
const testScenarios = {
  default: () => mockSubtitles,
  empty: () => [],
  noTranslations: () =>
    mockSubtitles.map((sub) => ({ ...sub, targetContent: '' })),
  generateOnly: () =>
    mockSubtitles.map((sub) => ({ ...sub, targetContent: undefined })),
  partialTranslations: () => [
    mockSubtitles[0], // Has translation
    { ...mockSubtitles[1], targetContent: '' }, // Missing translation
    mockSubtitles[2], // Missing translation
  ],
};

// Mock implementation
export const useSubtitles = jest.fn(
  (file: IFiles, open: boolean, taskType: string, formData: any) => {
    const scenario = process.env.JEST_SUBTITLE_SCENARIO || 'default';
    const subtitles =
      testScenarios[scenario as keyof typeof testScenarios]?.() ||
      mockSubtitles;
    const shouldShowTranslation = taskType !== 'generateOnly';

    const handleSubtitleChange = jest.fn(
      (
        index: number,
        field: 'sourceContent' | 'targetContent',
        value: string,
      ) => {
        mockState.handleSubtitleChangeCalled = true;
        const newSubtitles = [...mockState.mergedSubtitles];
        newSubtitles[index][field] = value;
        newSubtitles[index].content =
          field === 'sourceContent'
            ? value.split('\n')
            : newSubtitles[index].content;
        mockState.mergedSubtitles = newSubtitles;
      },
    );

    const handleSave = jest.fn(async () => {
      mockState.handleSaveCalled = true;
      // Simulate save operation
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    const getSubtitleStats = jest.fn((): SubtitleStats => {
      const total = subtitles.length;
      const withTranslation = shouldShowTranslation
        ? subtitles.filter(
            (sub) => sub.targetContent && sub.targetContent.trim() !== '',
          ).length
        : 0;
      const percent =
        total > 0 && shouldShowTranslation
          ? Math.round((withTranslation / total) * 100)
          : 0;

      return { total, withTranslation, percent };
    });

    const isTranslationFailed = jest.fn((subtitle: Subtitle): boolean => {
      if (!shouldShowTranslation) return false;
      return (
        !!subtitle.sourceContent &&
        subtitle.sourceContent.trim() !== '' &&
        (!subtitle.targetContent || subtitle.targetContent.trim() === '')
      );
    });

    const getFailedTranslationIndices = jest.fn((): number[] => {
      if (!shouldShowTranslation) return [];
      return subtitles
        .map((subtitle, index) => (isTranslationFailed(subtitle) ? index : -1))
        .filter((index) => index !== -1);
    });

    const goToNextFailedTranslation = jest.fn((): void => {
      const failedIndices = getFailedTranslationIndices();
      if (failedIndices.length === 0) return;

      const nextIndex = failedIndices.find(
        (index) => index > mockState.currentSubtitleIndex,
      );
      if (nextIndex !== undefined) {
        mockState.currentSubtitleIndex = nextIndex;
      } else {
        mockState.currentSubtitleIndex = failedIndices[0];
      }
    });

    const goToPreviousFailedTranslation = jest.fn((): void => {
      const failedIndices = getFailedTranslationIndices();
      if (failedIndices.length === 0) return;

      const previousIndex = failedIndices
        .slice()
        .reverse()
        .find((index) => index < mockState.currentSubtitleIndex);

      if (previousIndex !== undefined) {
        mockState.currentSubtitleIndex = previousIndex;
      } else {
        mockState.currentSubtitleIndex =
          failedIndices[failedIndices.length - 1];
      }
    });

    const setMergedSubtitles = jest.fn((subtitles: Subtitle[]) => {
      mockState.mergedSubtitles = subtitles;
    });

    const setCurrentSubtitleIndex = jest.fn((index: number) => {
      mockState.currentSubtitleIndex = index;
    });

    return {
      mergedSubtitles: subtitles,
      setMergedSubtitles,
      videoPath: mockState.videoPath,
      currentSubtitleIndex: mockState.currentSubtitleIndex,
      setCurrentSubtitleIndex,
      videoInfo: mockState.videoInfo,
      hasTranslationFile: mockState.hasTranslationFile,
      shouldShowTranslation,
      subtitleTracksForPlayer: mockState.subtitleTracksForPlayer,
      handleSubtitleChange,
      handleSave,
      getSubtitleStats,
      isTranslationFailed,
      getFailedTranslationIndices,
      goToNextFailedTranslation,
      goToPreviousFailedTranslation,
    };
  },
);

// Test utilities for controlling mock behavior
export const mockSubtitlesUtils = {
  // Reset mock state
  reset: () => {
    mockState = {
      mergedSubtitles: mockSubtitles,
      videoPath: '/mock/path/to/video.mp4',
      currentSubtitleIndex: -1,
      videoInfo: { fileName: 'video', extension: 'mp4' },
      hasTranslationFile: true,
      shouldShowTranslation: true,
      subtitleTracksForPlayer: mockPlayerTracks,
      handleSubtitleChangeCalled: false,
      handleSaveCalled: false,
    };
    jest.clearAllMocks();
  },

  // Set specific scenario
  setScenario: (scenarioName: keyof typeof testScenarios) => {
    process.env.JEST_SUBTITLE_SCENARIO = scenarioName;
  },

  // Set custom subtitles
  setSubtitles: (subtitles: Subtitle[]) => {
    mockState.mergedSubtitles = subtitles;
  },

  // Set video path
  setVideoPath: (path: string) => {
    mockState.videoPath = path;
  },

  // Set current subtitle index
  setCurrentIndex: (index: number) => {
    mockState.currentSubtitleIndex = index;
  },

  // Set translation file availability
  setHasTranslationFile: (hasFile: boolean) => {
    mockState.hasTranslationFile = hasFile;
  },

  // Get mock call information
  getMockCalls: () => ({
    handleSubtitleChangeCalled: mockState.handleSubtitleChangeCalled,
    handleSaveCalled: mockState.handleSaveCalled,
  }),

  // Get current mock state
  getState: () => ({ ...mockState }),
};

export default useSubtitles;
