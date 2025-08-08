/**
 * Mock implementation of useVideoPlayer hook
 * Provides configurable video player scenarios for testing
 */

import { useRef } from 'react';
import { Subtitle } from '../useSubtitles';

// Mock ReactPlayer ref
const mockPlayerRef = {
  current: {
    seekTo: jest.fn(),
    getCurrentTime: jest.fn(() => 0),
    getDuration: jest.fn(() => 100),
    getInternalPlayer: jest.fn(),
  },
};

// Global mock state
let mockState = {
  currentTime: 0,
  duration: 100,
  isPlaying: false,
  playbackRate: 1,
  handleProgressCalled: false,
  togglePlayCalled: false,
  handleSubtitleClickCalled: false,
  seekVideoCalled: false,
  changePlaybackRateCalled: false,
};

// Mock implementation
export const useVideoPlayer = jest.fn(
  (
    mergedSubtitles: Subtitle[],
    currentSubtitleIndex: number,
    setCurrentSubtitleIndex: (index: number) => void,
  ) => {
    const playerRef = useRef(mockPlayerRef.current);

    const handleProgress = jest.fn(
      ({ playedSeconds }: { playedSeconds: number }) => {
        mockState.handleProgressCalled = true;
        mockState.currentTime = playedSeconds;
      },
    );

    const togglePlay = jest.fn(() => {
      mockState.togglePlayCalled = true;
      mockState.isPlaying = !mockState.isPlaying;
    });

    const handleSubtitleClick = jest.fn((index: number) => {
      mockState.handleSubtitleClickCalled = true;
      if (index >= 0 && index < mergedSubtitles.length) {
        const startTime = mergedSubtitles[index]?.startTimeInSeconds ?? 0;
        mockPlayerRef.current.seekTo(startTime);
        setCurrentSubtitleIndex(index);
      }
    });

    const goToNextSubtitle = jest.fn(() => {
      if (currentSubtitleIndex < mergedSubtitles.length - 1) {
        const nextIndex = currentSubtitleIndex + 1;
        handleSubtitleClick(nextIndex);
      }
    });

    const goToPreviousSubtitle = jest.fn(() => {
      if (currentSubtitleIndex > 0) {
        const prevIndex = currentSubtitleIndex - 1;
        handleSubtitleClick(prevIndex);
      }
    });

    const seekVideo = jest.fn((seconds: number) => {
      mockState.seekVideoCalled = true;
      const currentTime = mockPlayerRef.current.getCurrentTime();
      const newTime = currentTime + seconds;
      mockPlayerRef.current.seekTo(newTime);
      mockState.currentTime = newTime;
    });

    const changePlaybackRate = jest.fn((delta: number) => {
      mockState.changePlaybackRateCalled = true;
      const newRate = Math.max(
        0.25,
        Math.min(2, mockState.playbackRate + delta),
      );
      mockState.playbackRate = newRate;
    });

    const setDuration = jest.fn((duration: number) => {
      mockState.duration = duration;
    });

    const setPlaybackRate = jest.fn((rate: number) => {
      mockState.playbackRate = rate;
    });

    return {
      currentTime: mockState.currentTime,
      duration: mockState.duration,
      setDuration,
      isPlaying: mockState.isPlaying,
      playbackRate: mockState.playbackRate,
      playerRef,
      handleProgress,
      togglePlay,
      handleSubtitleClick,
      goToNextSubtitle,
      goToPreviousSubtitle,
      seekVideo,
      changePlaybackRate,
      setPlaybackRate,
    };
  },
);

// Format time utility (matching the real implementation)
export const formatTime = jest.fn((seconds: number): string => {
  if (!seconds && seconds !== 0) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
});

// Test utilities for controlling mock behavior
export const mockVideoPlayerUtils = {
  // Reset mock state
  reset: () => {
    mockState = {
      currentTime: 0,
      duration: 100,
      isPlaying: false,
      playbackRate: 1,
      handleProgressCalled: false,
      togglePlayCalled: false,
      handleSubtitleClickCalled: false,
      seekVideoCalled: false,
      changePlaybackRateCalled: false,
    };
    jest.clearAllMocks();
    mockPlayerRef.current.seekTo.mockClear();
    mockPlayerRef.current.getCurrentTime.mockReturnValue(0);
    mockPlayerRef.current.getDuration.mockReturnValue(100);
  },

  // Set current time
  setCurrentTime: (time: number) => {
    mockState.currentTime = time;
    mockPlayerRef.current.getCurrentTime.mockReturnValue(time);
  },

  // Set duration
  setDuration: (duration: number) => {
    mockState.duration = duration;
    mockPlayerRef.current.getDuration.mockReturnValue(duration);
  },

  // Set playing state
  setPlaying: (isPlaying: boolean) => {
    mockState.isPlaying = isPlaying;
  },

  // Set playback rate
  setPlaybackRate: (rate: number) => {
    mockState.playbackRate = rate;
  },

  // Get mock call information
  getMockCalls: () => ({
    handleProgressCalled: mockState.handleProgressCalled,
    togglePlayCalled: mockState.togglePlayCalled,
    handleSubtitleClickCalled: mockState.handleSubtitleClickCalled,
    seekVideoCalled: mockState.seekVideoCalled,
    changePlaybackRateCalled: mockState.changePlaybackRateCalled,
    seekToCallCount: mockPlayerRef.current.seekTo.mock.calls.length,
    seekToLastCall:
      mockPlayerRef.current.seekTo.mock.calls[
        mockPlayerRef.current.seekTo.mock.calls.length - 1
      ],
  }),

  // Get current mock state
  getState: () => ({ ...mockState }),

  // Get mock player ref
  getPlayerRef: () => mockPlayerRef,
};

export default useVideoPlayer;
