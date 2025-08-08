/**
 * Addon Loading Mocks
 * Provides mock implementations for whisper addon loading
 */

const path = require('path');

// Create mock whisper functions for different addon types
function createMockWhisperFunction(type: string) {
  return jest.fn().mockImplementation((params: any, callback: Function) => {
    // Simulate processing time
    setTimeout(() => {
      // Simulate successful processing
      callback(null, `/mock/output-${type}.srt`);
    }, 50);
  });
}

// Mock addon implementations
const mockAddons = {
  // OpenVINO addons
  'addon-windows-openvino.node': createMockWhisperFunction('openvino'),
  'addon-linux-openvino.node': createMockWhisperFunction('openvino'),
  'addon-macos-arm-openvino.node': createMockWhisperFunction('openvino'),
  'addon-macos-x86-openvino.node': createMockWhisperFunction('openvino'),

  // CUDA addons
  'addon-windows-cuda-1241-optimized.node': createMockWhisperFunction('cuda'),
  'addon-windows-cuda-1241-generic.node': createMockWhisperFunction('cuda'),
  'addon-windows-cuda-1220-optimized.node': createMockWhisperFunction('cuda'),
  'addon-windows-cuda-1220-generic.node': createMockWhisperFunction('cuda'),
  'addon-windows-cuda-1180-optimized.node': createMockWhisperFunction('cuda'),
  'addon-windows-cuda-1180-generic.node': createMockWhisperFunction('cuda'),

  // CPU/fallback addons
  'addon-windows-no-cuda.node': createMockWhisperFunction('cpu'),
  'addon-macos-x64.node': createMockWhisperFunction('cpu'),
  'addon-macos-arm64-coreml.node': createMockWhisperFunction('coreml'),

  // Generic addons
  'addon.node': createMockWhisperFunction('generic'),
  'addon.coreml.node': createMockWhisperFunction('coreml'),
};

// Mock the addon manager
jest.mock('main/helpers/addonManager', () => ({
  loadAndValidateAddon: jest
    .fn()
    .mockImplementation(async (addonType: string, addonPath?: string) => {
      // Determine addon name from path or type
      let addonName = addonPath
        ? path.basename(addonPath)
        : `addon-${addonType}.node`;

      // Handle type-based selection
      if (!addonPath) {
        switch (addonType) {
          case 'openvino':
            if (process.platform === 'win32')
              addonName = 'addon-windows-openvino.node';
            else if (process.platform === 'linux')
              addonName = 'addon-linux-openvino.node';
            else if (process.platform === 'darwin' && process.arch === 'arm64')
              addonName = 'addon-macos-arm-openvino.node';
            else if (process.platform === 'darwin')
              addonName = 'addon-macos-x86-openvino.node';
            break;
          case 'cuda':
            addonName = 'addon-windows-cuda-1241-optimized.node';
            break;
          case 'coreml':
            addonName = 'addon-macos-arm64-coreml.node';
            break;
          case 'cpu':
            if (process.platform === 'win32')
              addonName = 'addon-windows-no-cuda.node';
            else if (process.platform === 'darwin')
              addonName = 'addon-macos-x64.node';
            else addonName = 'addon.node';
            break;
        }
      }

      // Return mock addon if available
      if (mockAddons[addonName]) {
        return Promise.resolve(mockAddons[addonName]);
      }

      // Fallback to generic addon
      return Promise.resolve(mockAddons['addon.node']);
    }),

  validateAddon: jest.fn().mockImplementation(async (addonPath: string) => {
    const addonName = path.basename(addonPath);
    return Promise.resolve(!!mockAddons[addonName]);
  }),

  getAddonInfo: jest.fn().mockImplementation((addonPath: string) => {
    const addonName = path.basename(addonPath);
    const type = addonName.includes('openvino')
      ? 'openvino'
      : addonName.includes('cuda')
        ? 'cuda'
        : addonName.includes('coreml')
          ? 'coreml'
          : 'cpu';

    return {
      type,
      path: addonPath,
      displayName: `Mock ${type.toUpperCase()} Addon`,
      deviceConfig: {
        deviceId: type === 'openvino' ? 'GPU.0' : undefined,
        platform: process.platform,
      },
    };
  }),

  // Additional functions that might be called
  getAvailableAddons: jest.fn().mockReturnValue(Object.keys(mockAddons)),

  cleanupAddon: jest.fn().mockResolvedValue(undefined),
}));

// Mock the whisper helper
jest.mock('main/helpers/whisper', () => ({
  generateSubtitleWithBuiltinWhisper: jest
    .fn()
    .mockImplementation(
      async (audioFile: string, model: string, options: any = {}) => {
        // Simulate processing based on GPU type
        const gpuType = options.gpuType || 'cpu';
        const outputPath = `/mock/output/${path.basename(audioFile, path.extname(audioFile))}-${gpuType}.srt`;

        // Simulate processing time based on model
        const processingTime = model === 'large' ? 200 : 100;
        await new Promise((resolve) => setTimeout(resolve, processingTime));

        return outputPath;
      },
    ),

  validateModel: jest.fn().mockReturnValue(true),

  getAvailableModels: jest
    .fn()
    .mockReturnValue(['tiny', 'base', 'small', 'medium', 'large']),
}));

// Mock fs operations for addon files
const originalFs = jest.requireActual('fs-extra');
jest.mock('fs-extra', () => ({
  ...originalFs,

  // Mock addon file existence checks
  pathExists: jest.fn().mockImplementation((filePath: string) => {
    const fileName = path.basename(filePath);
    // Return true if it's a known addon file
    if (mockAddons[fileName]) {
      return Promise.resolve(true);
    }
    // Fall back to original implementation for other files
    return originalFs.pathExists(filePath);
  }),

  pathExistsSync: jest.fn().mockImplementation((filePath: string) => {
    const fileName = path.basename(filePath);
    if (mockAddons[fileName]) {
      return true;
    }
    return originalFs.pathExistsSync(filePath);
  }),

  stat: jest.fn().mockImplementation(async (filePath: string) => {
    const fileName = path.basename(filePath);
    if (mockAddons[fileName]) {
      return {
        isFile: () => true,
        isDirectory: () => false,
        size: 1024 * 1024, // 1MB mock size
        mtime: new Date(),
        ctime: new Date(),
      };
    }
    return originalFs.stat(filePath);
  }),

  statSync: jest.fn().mockImplementation((filePath: string) => {
    const fileName = path.basename(filePath);
    if (mockAddons[fileName]) {
      return {
        isFile: () => true,
        isDirectory: () => false,
        size: 1024 * 1024,
        mtime: new Date(),
        ctime: new Date(),
      };
    }
    return originalFs.statSync(filePath);
  }),
}));

// Export utilities for tests
export const addonMockUtils = {
  /**
   * Get a mock addon by name
   */
  getMockAddon: (addonName: string) => mockAddons[addonName],

  /**
   * Add a custom mock addon
   */
  addMockAddon: (addonName: string, mockFunction: Function) => {
    mockAddons[addonName] = mockFunction;
  },

  /**
   * Reset all addon mocks
   */
  resetMocks: () => {
    Object.values(mockAddons).forEach((mock) => {
      if (jest.isMockFunction(mock)) {
        mock.mockReset();
      }
    });
    jest.clearAllMocks();
  },

  /**
   * Simulate addon failure
   */
  simulateAddonFailure: (
    addonName: string,
    error: string = 'Mock addon failure',
  ) => {
    if (mockAddons[addonName]) {
      mockAddons[addonName] = jest
        .fn()
        .mockImplementation((params, callback) => {
          callback(new Error(error));
        });
    }
  },

  /**
   * Get all available mock addon names
   */
  getAvailableAddons: () => Object.keys(mockAddons),
};

export { mockAddons };
