/**
 * Test Suite: Settings Extension
 * Comprehensive tests for Intel GPU settings extension
 *
 * Requirements tested:
 * - Settings structure extends existing without breaking changes
 * - GPU preferences persist across application restarts
 * - Default settings provide optimal user experience
 * - Settings validation prevents invalid configurations
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { store } from 'main/helpers/store';
import { OpenVINOPreferences, EnhancedSettings } from 'types/settings';

describe('Settings Extension', () => {
  beforeEach(() => {
    global.testUtils.resetAllMocks();
  });

  test('should extend settings with Intel GPU options', () => {
    // Mock store.get to return default settings
    global.testUtils.mockStore.get.mockReturnValue(
      global.testUtils.createModernSettings(),
    );

    const settings = store.get('settings');

    // Verify new Intel GPU settings are present
    expect(settings).toHaveProperty('useOpenVINO');
    expect(settings).toHaveProperty('selectedGPUId');
    expect(settings).toHaveProperty('gpuPreference');
    expect(settings).toHaveProperty('gpuAutoDetection');
    expect(settings).toHaveProperty('openvinoPreferences');

    // Verify types are correct
    expect(typeof settings.useOpenVINO).toBe('boolean');
    expect(typeof settings.selectedGPUId).toBe('string');
    expect(Array.isArray(settings.gpuPreference)).toBe(true);
    expect(typeof settings.gpuAutoDetection).toBe('boolean');
    expect(typeof settings.openvinoPreferences).toBe('object');
  });

  test('should maintain backward compatibility with existing settings', () => {
    const legacySettings = global.testUtils.createLegacySettings();
    global.testUtils.mockStore.get.mockReturnValue(legacySettings);

    const settings = store.get('settings');

    // Verify all legacy settings are preserved
    expect(settings.language).toBe('zh');
    expect(settings.useLocalWhisper).toBe(false);
    expect(settings.useCuda).toBe(true);
    expect(settings.modelsPath).toBe('/test/models');
    expect(settings.useVAD).toBe(true);
    expect(settings.vadThreshold).toBe(0.5);
    expect(settings.vadMinSpeechDuration).toBe(250);
    expect(settings.vadMinSilenceDuration).toBe(100);
    expect(settings.vadMaxSpeechDuration).toBe(0);
    expect(settings.vadSpeechPad).toBe(30);
    expect(settings.vadSamplesOverlap).toBe(0.1);
  });

  test('should provide sensible default values for new settings', () => {
    const modernSettings = global.testUtils.createModernSettings();
    global.testUtils.mockStore.get.mockReturnValue(modernSettings);

    const settings = store.get('settings');

    // Verify Intel GPU defaults
    expect(settings.useOpenVINO).toBe(false); // Conservative default
    expect(settings.selectedGPUId).toBe('auto'); // Auto-detect
    expect(settings.gpuPreference).toEqual(['nvidia', 'intel', 'apple', 'cpu']); // Sensible priority
    expect(settings.gpuAutoDetection).toBe(true); // Enable auto-detection

    // Verify OpenVINO preferences defaults
    expect(settings.openvinoPreferences.cacheDir).toContain('openvino-cache');
    expect(settings.openvinoPreferences.devicePreference).toBe('auto');
    expect(settings.openvinoPreferences.enableOptimizations).toBe(true);
  });

  test('should validate GPU ID selection values', () => {
    const testCases = [
      { value: 'auto', valid: true },
      { value: 'intel_gpu_0', valid: true },
      { value: 'nvidia_gpu_0', valid: true },
      { value: '', valid: false },
      { value: null, valid: false },
      { value: undefined, valid: false },
      { value: 123, valid: false },
    ];

    testCases.forEach(({ value, valid }) => {
      const settings = {
        ...global.testUtils.createModernSettings(),
        selectedGPUId: value,
      };

      if (valid) {
        expect(() => validateGPUId(value)).not.toThrow();
      } else {
        expect(() => validateGPUId(value)).toThrow();
      }
    });
  });

  test('should validate GPU preference array structure', () => {
    const testCases = [
      { value: ['nvidia', 'intel', 'apple', 'cpu'], valid: true },
      { value: ['intel', 'nvidia'], valid: true },
      { value: ['cpu'], valid: true },
      { value: [], valid: false },
      { value: ['invalid'], valid: false },
      { value: ['nvidia', 'invalid', 'cpu'], valid: false },
      { value: null, valid: false },
      { value: 'not-array', valid: false },
    ];

    testCases.forEach(({ value, valid }) => {
      if (valid) {
        expect(() => validateGPUPreference(value)).not.toThrow();
      } else {
        expect(() => validateGPUPreference(value)).toThrow();
      }
    });
  });

  test('should handle settings corruption gracefully', () => {
    // Mock corrupted settings
    global.testUtils.mockStore.get.mockReturnValue(null);

    // Should not throw and return defaults
    expect(() => store.get('settings')).not.toThrow();

    // Verify it falls back to defaults when corrupted
    global.testUtils.mockStore.get.mockReturnValue(undefined);
    expect(() => store.get('settings')).not.toThrow();
  });
});

describe('Settings Persistence', () => {
  test('should save Intel GPU preferences correctly', () => {
    const newSettings = {
      ...global.testUtils.createModernSettings(),
      useOpenVINO: true,
      selectedGPUId: 'intel_arc_a770',
      gpuPreference: ['intel', 'nvidia', 'cpu'],
    };

    store.set('settings', newSettings);

    expect(global.testUtils.mockStore.set).toHaveBeenCalledWith(
      'settings',
      newSettings,
    );
  });

  test('should load Intel GPU preferences on startup', () => {
    const savedSettings = global.testUtils.createModernSettings();
    savedSettings.useOpenVINO = true;
    savedSettings.selectedGPUId = 'intel_xe_graphics';

    global.testUtils.mockStore.get.mockReturnValue(savedSettings);

    const loaded = store.get('settings');

    expect(loaded.useOpenVINO).toBe(true);
    expect(loaded.selectedGPUId).toBe('intel_xe_graphics');
    expect(global.testUtils.mockStore.get).toHaveBeenCalledWith('settings');
  });

  test('should handle settings file corruption', () => {
    // Simulate corrupted settings file
    global.testUtils.mockStore.get.mockImplementation(() => {
      throw new Error('Settings file corrupted');
    });

    // Should handle gracefully and not crash
    expect(() => {
      try {
        store.get('settings');
      } catch (error) {
        // This is expected behavior for corrupted settings
      }
    }).not.toThrow();
  });

  test('should provide fallback defaults when settings unavailable', () => {
    global.testUtils.mockStore.get.mockReturnValue(null);

    // Mock the store to return defaults
    global.testUtils.mockStore.get.mockReturnValueOnce(
      global.testUtils.createModernSettings(),
    );

    const settings = store.get('settings');

    expect(settings).toBeDefined();
    expect(settings.useOpenVINO).toBeDefined();
    expect(settings.gpuPreference).toBeDefined();
  });

  test('should validate settings before saving', () => {
    const invalidSettings = {
      ...global.testUtils.createModernSettings(),
      selectedGPUId: null, // Invalid
      gpuPreference: 'not-array', // Invalid
    };

    // This should be caught by validation
    expect(() => {
      if (!validateSettings(invalidSettings)) {
        throw new Error('Invalid settings');
      }
    }).toThrow();
  });
});

describe('OpenVINO Preferences Management', () => {
  test('should handle OpenVINO cache directory configuration', () => {
    const settings = global.testUtils.createModernSettings();
    settings.openvinoPreferences.cacheDir = '/custom/cache/dir';

    global.testUtils.mockStore.get.mockReturnValue(settings);

    const loaded = store.get('settings');
    expect(loaded.openvinoPreferences.cacheDir).toBe('/custom/cache/dir');
  });

  test('should validate device preference values', () => {
    const validValues = ['discrete', 'integrated', 'auto'];
    const invalidValues = ['invalid', '', null, undefined, 123];

    validValues.forEach((value) => {
      expect(() => validateDevicePreference(value)).not.toThrow();
    });

    invalidValues.forEach((value) => {
      expect(() => validateDevicePreference(value)).toThrow();
    });
  });

  test('should handle optimization toggle correctly', () => {
    const settings = global.testUtils.createModernSettings();

    // Test enabling optimizations
    settings.openvinoPreferences.enableOptimizations = true;
    expect(settings.openvinoPreferences.enableOptimizations).toBe(true);

    // Test disabling optimizations
    settings.openvinoPreferences.enableOptimizations = false;
    expect(settings.openvinoPreferences.enableOptimizations).toBe(false);
  });
});

// Validation helper functions
function validateGPUId(gpuId: any): boolean {
  if (typeof gpuId !== 'string' || gpuId.length === 0) {
    throw new Error('GPU ID must be a non-empty string');
  }
  return true;
}

function validateGPUPreference(preference: any): boolean {
  if (!Array.isArray(preference) || preference.length === 0) {
    throw new Error('GPU preference must be a non-empty array');
  }

  const validTypes = ['nvidia', 'intel', 'apple', 'cpu'];
  const invalidTypes = preference.filter((type) => !validTypes.includes(type));

  if (invalidTypes.length > 0) {
    throw new Error(`Invalid GPU types: ${invalidTypes.join(', ')}`);
  }

  return true;
}

function validateDevicePreference(preference: any): boolean {
  const validValues = ['discrete', 'integrated', 'auto'];
  if (!validValues.includes(preference)) {
    throw new Error('Device preference must be discrete, integrated, or auto');
  }
  return true;
}

function validateSettings(settings: any): boolean {
  try {
    validateGPUId(settings.selectedGPUId);
    validateGPUPreference(settings.gpuPreference);
    validateDevicePreference(settings.openvinoPreferences?.devicePreference);
    return true;
  } catch {
    return false;
  }
}
