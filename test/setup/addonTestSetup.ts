/**
 * Test Setup for Task 2.1: Enhanced Addon Loading System
 * Provides addon-specific test utilities and mocks
 */

import { jest } from '@jest/globals';
import path from 'path';

// Mock hardware detection modules
jest.mock('main/helpers/hardware/hardwareDetection', () => ({
  detectAvailableGPUs: jest.fn(),
}));

// Mock logger functions
jest.mock('main/helpers/logger', () => ({
  logMessage: jest.fn(),
  generateCorrelationId: jest.fn(() => 'test-correlation-id'),
  logGPUDetectionEvent: jest.fn(),
  LogCategory: {
    GPU_DETECTION: 'gpu_detection',
    ADDON_LOADING: 'addon_loading',
  },
}));

jest.mock('main/helpers/hardware/openvinoDetection', () => ({
  checkOpenVINOSupport: jest.fn(),
}));

jest.mock('main/helpers/cudaUtils', () => ({
  checkCudaSupport: jest.fn(),
}));

// Mock utils
jest.mock('main/helpers/utils', () => ({
  getExtraResourcesPath: jest.fn(() => '/mock/resources'),
  isAppleSilicon: jest.fn(() => false),
  isWin32: jest.fn(() => process.platform === 'win32'),
}));

// Mock whisper helper functions
jest.mock('main/helpers/whisper', () => ({
  hasEncoderModel: jest.fn(),
  getPath: jest.fn(() => ({ modelsPath: '/mock/models' })),
}));

// Mock process.dlopen for addon loading
const originalDlopen = process.dlopen;
const mockDlopen = jest.fn();

beforeAll(() => {
  process.dlopen = mockDlopen;
});

afterAll(() => {
  process.dlopen = originalDlopen;
});

// Global test utilities for addon testing
declare global {
  var addonTestUtils: {
    createMockGPUCapabilities: () => any;
    createMockAddonInfo: (type: string) => any;
    createMockWhisperFunction: () => any;
    setupMockGPUDetection: (capabilities: any) => void;
    setupMockAddonLoading: (success: boolean, addonType?: string) => void;
    resetAddonMocks: () => void;
    mockDlopen: any;
  };
}

global.addonTestUtils = {
  createMockGPUCapabilities: () => {
    const intelGPUs = [
      {
        id: 'intel_arc_a770',
        name: 'Intel Arc A770',
        type: 'discrete',
        vendor: 'intel',
        deviceId: 'GPU0',
        priority: 1,
        driverVersion: '31.0.101.4146',
        memory: 8192,
        capabilities: {
          openvinoCompatible: true,
          cudaCompatible: false,
          coremlCompatible: false,
        },
        powerEfficiency: 'good',
        performance: 'high',
      },
      {
        id: 'intel_xe_graphics',
        name: 'Intel Xe Graphics',
        type: 'integrated',
        vendor: 'intel',
        deviceId: 'GPU1',
        priority: 2,
        driverVersion: '31.0.101.4146',
        memory: 'shared',
        capabilities: {
          openvinoCompatible: true,
          cudaCompatible: false,
          coremlCompatible: false,
        },
        powerEfficiency: 'excellent',
        performance: 'medium',
      },
    ];

    return {
      nvidia: true,
      intel: intelGPUs,
      amd: [], // AMD GPUs array for compatibility
      intelAll: intelGPUs, // Populate with the same array
      apple: false,
      cpu: true,
      openvinoVersion: '2024.6.0',
      capabilities: {
        multiGPU: true,
        hybridSystem: true,
      },
    };
  },

  createMockAddonInfo: (type: string) => {
    const addonConfigs = {
      cuda: {
        type: 'cuda',
        path: 'addon-cuda.node',
        displayName: 'NVIDIA CUDA GPU',
        deviceConfig: null,
      },
      openvino: {
        type: 'openvino',
        path: 'addon-openvino.node',
        displayName: 'Intel Arc A770',
        deviceConfig: {
          deviceId: 'GPU0',
          memory: 8192,
          type: 'discrete',
        },
      },
      coreml: {
        type: 'coreml',
        path: 'addon-coreml.node',
        displayName: 'Apple CoreML',
        deviceConfig: null,
      },
      cpu: {
        type: 'cpu',
        path: 'addon-cpu.node',
        displayName: 'CPU Processing',
        deviceConfig: null,
      },
    };

    return addonConfigs[type] || addonConfigs.cpu;
  },

  createMockWhisperFunction: () => {
    return jest.fn(
      (params: any, callback: (error: Error | null, result?: any) => void) => {
        // Simulate async behavior
        setTimeout(() => {
          if (params.validate_only) {
            callback(null, { validation: 'success' });
          } else if (params.model && params.fname_inp) {
            callback(null, { transcription: 'mock transcription' });
          } else {
            callback(new Error('Invalid parameters'));
          }
        }, 10);
      },
    );
  },

  setupMockGPUDetection: (capabilities: any) => {
    const {
      detectAvailableGPUs,
    } = require('main/helpers/hardware/hardwareDetection');
    const {
      checkOpenVINOSupport,
    } = require('main/helpers/hardware/openvinoDetection');
    const { checkCudaSupport } = require('main/helpers/cudaUtils');

    detectAvailableGPUs.mockReturnValue(capabilities);
    checkOpenVINOSupport.mockReturnValue(
      capabilities.openvinoVersion
        ? {
            version: capabilities.openvinoVersion,
            compatible: true,
            installPath: '/mock/openvino',
            gpuSupported: true,
            runtimeLibraries: true,
          }
        : false,
    );
    checkCudaSupport.mockResolvedValue(capabilities.nvidia);
  },

  setupMockAddonLoading: (success: boolean, addonType?: string) => {
    mockDlopen.mockImplementation((module: any, filename: string) => {
      if (success) {
        module.exports = {
          whisper: global.addonTestUtils.createMockWhisperFunction(),
        };
      } else {
        throw new Error(`Failed to load addon: ${filename}`);
      }
    });
  },

  resetAddonMocks: () => {
    mockDlopen.mockReset();
    jest.clearAllMocks();
  },

  mockDlopen: mockDlopen,
};

// Initialize mock capabilities
global.addonTestUtils.createMockGPUCapabilities().intelAll =
  global.addonTestUtils.createMockGPUCapabilities().intel;

// Reset mocks before each test
beforeEach(() => {
  global.addonTestUtils.resetAddonMocks();
});

export { mockDlopen };
