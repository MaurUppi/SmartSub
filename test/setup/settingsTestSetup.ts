/**
 * Test Setup for Task 1.3: Enhanced Settings Integration
 * Provides common test utilities and mocks for settings tests
 */

import { jest } from '@jest/globals';

// Mock electron-store before any imports
const mockStore = {
  get: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
  clear: jest.fn(),
  has: jest.fn(),
  reset: jest.fn(),
};

// Create mock constructor that returns our mock instance
const MockStore = jest.fn().mockImplementation(() => mockStore);

// Mock the electron-store module
jest.mock('electron-store', () => MockStore);

// Mock electron app paths
jest.mock('electron', () => ({
  app: {
    getPath: jest.fn((name: string) => {
      const mockPaths = {
        userData: '/mock/user/data',
        temp: '/mock/temp',
      };
      return mockPaths[name] || '/mock/default';
    }),
    getVersion: jest.fn(() => '1.3.0'),
  },
  ipcMain: {
    on: jest.fn(),
    handle: jest.fn(),
    removeAllListeners: jest.fn(),
  },
}));

// Mock logger to prevent console spam during tests
jest.mock('main/helpers/logger', () => ({
  logMessage: jest.fn((message: string, level: string) => {
    if (process.env.TEST_VERBOSE) {
      console.log(`[${level.toUpperCase()}] ${message}`);
    }
  }),
}));

// Mock utils
jest.mock('main/helpers/utils', () => ({
  defaultUserConfig: {
    theme: 'light',
    language: 'en',
  },
  isAppleSilicon: jest.fn(() => false),
}));

// Global test utilities
declare global {
  var testUtils: {
    mockStore: typeof mockStore;
    MockStore: typeof MockStore;
    createLegacySettings: () => any;
    createModernSettings: () => any;
    resetAllMocks: () => void;
  };
}

// Test utility functions
global.testUtils = {
  mockStore,
  MockStore,

  createLegacySettings: () => ({
    language: 'zh',
    useLocalWhisper: false,
    whisperCommand: 'test command',
    builtinWhisperCommand: 'test builtin command',
    useCuda: true,
    modelsPath: '/test/models',
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
  }),

  createModernSettings: () => ({
    language: 'zh',
    useLocalWhisper: false,
    whisperCommand: 'test command',
    builtinWhisperCommand: 'test builtin command',
    useCuda: true,
    modelsPath: '/test/models',
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

    // New Intel GPU settings
    useOpenVINO: false,
    selectedGPUId: 'auto',
    gpuPreference: ['nvidia', 'intel', 'apple', 'cpu'],
    gpuAutoDetection: true,
    openvinoPreferences: {
      cacheDir: '/mock/user/data/openvino-cache',
      devicePreference: 'auto',
      enableOptimizations: true,
    },
  }),

  resetAllMocks: () => {
    mockStore.get.mockReset();
    mockStore.set.mockReset();
    mockStore.delete.mockReset();
    mockStore.clear.mockReset();
    mockStore.has.mockReset();
    mockStore.reset.mockReset();
    MockStore.mockClear();
  },
};

// Reset mocks before each test
beforeEach(() => {
  global.testUtils.resetAllMocks();
});

export { mockStore, MockStore };
