/**
 * Mock implementation of useParameterConfig hook
 * Provides configurable parameter configuration scenarios for testing
 */

import {
  CustomParameterConfig,
  ParameterValue,
  ValidationError,
  ParameterDefinition,
} from '../../../types/provider';

// Mock parameter configuration data
const mockParameterConfig: CustomParameterConfig = {
  providerId: 'test-provider',
  customHeaders: {
    Authorization: { type: 'string', value: 'Bearer mock-token' },
    'Content-Type': { type: 'string', value: 'application/json' },
  },
  customBodyParameters: {
    temperature: { type: 'number', value: 0.7 },
    max_tokens: { type: 'number', value: 1000 },
    model: { type: 'string', value: 'gpt-3.5-turbo' },
  },
  requestTemplate: 'default',
  presets: {
    default: {
      name: 'Default Settings',
      description: 'Standard configuration',
      headers: {
        'Content-Type': { type: 'string', value: 'application/json' },
      },
      bodyParameters: {
        temperature: { type: 'number', value: 0.7 },
      },
    },
  },
  version: '1.0.0',
  lastModified: Date.now(),
};

// Mock state interface
export interface MockParameterConfigState {
  config: CustomParameterConfig | null;
  isLoading: boolean;
  hasUnsavedChanges: boolean;
  validationErrors: ValidationError[];
  lastSaved: number | null;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  saveMessage?: string;
}

// Global mock state
let mockState: MockParameterConfigState = {
  config: mockParameterConfig,
  isLoading: false,
  hasUnsavedChanges: false,
  validationErrors: [],
  lastSaved: null,
  saveStatus: 'idle',
  saveMessage: undefined,
};

// Test scenarios
const testScenarios = {
  default: () => mockParameterConfig,
  empty: () => null,
  loading: () => mockParameterConfig,
  withErrors: () => mockParameterConfig,
  unsavedChanges: () => mockParameterConfig,
};

// Mock implementation
export const useParameterConfig = jest.fn(() => {
  const scenario = process.env.JEST_PARAMETER_CONFIG_SCENARIO || 'default';

  // Set scenario-specific state
  switch (scenario) {
    case 'loading':
      mockState.isLoading = true;
      break;
    case 'withErrors':
      mockState.validationErrors = [
        {
          field: 'temperature',
          message: 'Temperature must be between 0 and 1',
        },
      ];
      break;
    case 'unsavedChanges':
      mockState.hasUnsavedChanges = true;
      break;
    case 'empty':
      mockState.config = null;
      break;
  }

  const loadConfig = jest.fn(async (providerId: string) => {
    mockState.isLoading = true;
    // Simulate async loading
    await new Promise((resolve) => setTimeout(resolve, 100));
    mockState.isLoading = false;
    mockState.config =
      testScenarios[scenario as keyof typeof testScenarios]?.() ||
      mockParameterConfig;
  });

  const saveConfig = jest.fn(
    async (
      providerId: string,
      config: CustomParameterConfig,
    ): Promise<boolean> => {
      mockState.saveStatus = 'saving';
      mockState.hasUnsavedChanges = false;

      // Simulate async saving
      await new Promise((resolve) => setTimeout(resolve, 100));

      mockState.saveStatus = 'saved';
      mockState.lastSaved = Date.now();
      mockState.config = config;
      mockState.saveMessage = 'Configuration saved successfully';

      return true;
    },
  );

  const resetConfig = jest.fn(async (providerId: string): Promise<boolean> => {
    mockState.config = null;
    mockState.hasUnsavedChanges = false;
    mockState.validationErrors = [];
    return true;
  });

  const addHeaderParameter = jest.fn((key: string, value: ParameterValue) => {
    if (mockState.config) {
      mockState.config.customHeaders[key] = value;
      mockState.hasUnsavedChanges = true;
    }
  });

  const updateHeaderParameter = jest.fn(
    (key: string, value: ParameterValue) => {
      if (mockState.config && mockState.config.customHeaders[key]) {
        mockState.config.customHeaders[key] = value;
        mockState.hasUnsavedChanges = true;
      }
    },
  );

  const removeHeaderParameter = jest.fn((key: string) => {
    if (mockState.config) {
      delete mockState.config.customHeaders[key];
      mockState.hasUnsavedChanges = true;
    }
  });

  const addBodyParameter = jest.fn((key: string, value: ParameterValue) => {
    if (mockState.config) {
      mockState.config.customBodyParameters[key] = value;
      mockState.hasUnsavedChanges = true;
    }
  });

  const updateBodyParameter = jest.fn((key: string, value: ParameterValue) => {
    if (mockState.config && mockState.config.customBodyParameters[key]) {
      mockState.config.customBodyParameters[key] = value;
      mockState.hasUnsavedChanges = true;
    }
  });

  const removeBodyParameter = jest.fn((key: string) => {
    if (mockState.config) {
      delete mockState.config.customBodyParameters[key];
      mockState.hasUnsavedChanges = true;
    }
  });

  const validateConfig = jest.fn((): ValidationError[] => {
    return mockState.validationErrors;
  });

  const clearValidationErrors = jest.fn(() => {
    mockState.validationErrors = [];
  });

  const applyPreset = jest.fn((presetName: string) => {
    if (mockState.config && mockState.config.presets[presetName]) {
      const preset = mockState.config.presets[presetName];
      mockState.config.customHeaders = { ...preset.headers };
      mockState.config.customBodyParameters = { ...preset.bodyParameters };
      mockState.hasUnsavedChanges = true;
    }
  });

  const exportConfig = jest.fn((): CustomParameterConfig | null => {
    return mockState.config
      ? JSON.parse(JSON.stringify(mockState.config))
      : null;
  });

  const importConfig = jest.fn((config: CustomParameterConfig) => {
    mockState.config = config;
    mockState.hasUnsavedChanges = true;
  });

  return {
    // State
    state: mockState,

    // Configuration operations
    loadConfig,
    saveConfig,
    resetConfig,

    // Parameter operations
    addHeaderParameter,
    updateHeaderParameter,
    removeHeaderParameter,
    addBodyParameter,
    updateBodyParameter,
    removeBodyParameter,

    // Validation
    validateConfig,
    clearValidationErrors,

    // Preset operations
    applyPreset,

    // Import/Export
    exportConfig,
    importConfig,
  };
});

// Test utilities for controlling mock behavior
export const mockParameterConfigUtils = {
  // Reset mock state
  reset: () => {
    mockState = {
      config: mockParameterConfig,
      isLoading: false,
      hasUnsavedChanges: false,
      validationErrors: [],
      lastSaved: null,
      saveStatus: 'idle',
      saveMessage: undefined,
    };
    jest.clearAllMocks();
  },

  // Set specific scenario
  setScenario: (scenarioName: keyof typeof testScenarios) => {
    process.env.JEST_PARAMETER_CONFIG_SCENARIO = scenarioName;
  },

  // Set loading state
  setLoading: (isLoading: boolean) => {
    mockState.isLoading = isLoading;
  },

  // Set config
  setConfig: (config: CustomParameterConfig | null) => {
    mockState.config = config;
  },

  // Set unsaved changes
  setHasUnsavedChanges: (hasChanges: boolean) => {
    mockState.hasUnsavedChanges = hasChanges;
  },

  // Set validation errors
  setValidationErrors: (errors: ValidationError[]) => {
    mockState.validationErrors = errors;
  },

  // Set save status
  setSaveStatus: (
    status: 'idle' | 'saving' | 'saved' | 'error',
    message?: string,
  ) => {
    mockState.saveStatus = status;
    mockState.saveMessage = message;
  },

  // Get current mock state
  getState: () => ({ ...mockState }),

  // Get mock config
  getConfig: () =>
    mockState.config ? JSON.parse(JSON.stringify(mockState.config)) : null,
};

export default useParameterConfig;
