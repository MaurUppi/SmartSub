/**
 * Test Suite: Settings Validation
 * Comprehensive tests for settings validation system
 *
 * Requirements tested:
 * - Reject invalid GPU ID selections
 * - Validate GPU preference order
 * - Handle malformed preference arrays
 * - Validate OpenVINO preference structure
 * - Provide error messages for invalid settings
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import {
  ValidationResult,
  EnhancedSettings,
  OpenVINOPreferences,
} from 'types/settings';

describe('Settings Validation', () => {
  beforeEach(() => {
    global.testUtils.resetAllMocks();
  });

  test('should reject invalid GPU ID selections', () => {
    const invalidGPUIDs = [
      '', // Empty string
      null, // Null
      undefined, // Undefined
      123, // Number
      [], // Array
      {}, // Object
      true, // Boolean
      '   ', // Whitespace only
    ];

    invalidGPUIDs.forEach((invalidId) => {
      const result = validateGPUId(invalidId);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('GPU ID must be a non-empty string');
    });

    // Valid GPU IDs should pass
    const validGPUIDs = [
      'auto',
      'intel_gpu_0',
      'nvidia_gpu_0',
      'apple_gpu',
      'custom_gpu_id_123',
    ];

    validGPUIDs.forEach((validId) => {
      const result = validateGPUId(validId);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  test('should validate GPU preference order', () => {
    const testCases = [
      {
        preference: ['nvidia', 'intel', 'apple', 'cpu'],
        valid: true,
        description: 'Standard preference order',
      },
      {
        preference: ['intel', 'nvidia', 'cpu'],
        valid: true,
        description: 'Intel-first preference',
      },
      {
        preference: ['cpu'],
        valid: true,
        description: 'CPU-only preference',
      },
      {
        preference: ['apple', 'cpu'],
        valid: true,
        description: 'Apple Silicon preference',
      },
      {
        preference: [],
        valid: false,
        description: 'Empty preference array',
      },
      {
        preference: ['nvidia', 'nvidia', 'cpu'],
        valid: false,
        description: 'Duplicate entries',
      },
      {
        preference: ['invalid_gpu', 'cpu'],
        valid: false,
        description: 'Invalid GPU type',
      },
      {
        preference: 'not_an_array',
        valid: false,
        description: 'Not an array',
      },
    ];

    testCases.forEach(({ preference, valid, description }) => {
      const result = validateGPUPreference(preference);

      if (valid) {
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      } else {
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      }
    });
  });

  test('should handle malformed preference arrays', () => {
    const malformedCases = [
      null,
      undefined,
      'string',
      123,
      { nvidia: true },
      [null, 'nvidia'],
      [undefined, 'intel'],
      ['', 'cpu'],
      [123, 'apple'],
    ];

    malformedCases.forEach((malformed) => {
      const result = validateGPUPreference(malformed);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  test('should validate OpenVINO preference structure', () => {
    const validPreferences: OpenVINOPreferences[] = [
      {
        cacheDir: '/valid/cache/dir',
        devicePreference: 'auto',
        enableOptimizations: true,
      },
      {
        cacheDir: '/another/valid/dir',
        devicePreference: 'discrete',
        enableOptimizations: false,
      },
      {
        cacheDir: '/integrated/cache',
        devicePreference: 'integrated',
        enableOptimizations: true,
      },
    ];

    validPreferences.forEach((prefs) => {
      const result = validateOpenVINOPreferences(prefs);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    const invalidPreferences = [
      {
        cacheDir: '', // Empty cache dir
        devicePreference: 'auto',
        enableOptimizations: true,
      },
      {
        cacheDir: '/valid/dir',
        devicePreference: 'invalid', // Invalid device preference
        enableOptimizations: true,
      },
      {
        cacheDir: '/valid/dir',
        devicePreference: 'auto',
        enableOptimizations: 'not_boolean', // Invalid optimization setting
      },
      {
        // Missing cacheDir
        devicePreference: 'auto',
        enableOptimizations: true,
      },
      null,
      undefined,
      'not_an_object',
    ];

    invalidPreferences.forEach((prefs) => {
      const result = validateOpenVINOPreferences(prefs);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  test('should provide error messages for invalid settings', () => {
    // Test GPU ID validation errors
    let result = validateGPUId('');
    expect(result.errors).toContain('GPU ID must be a non-empty string');

    result = validateGPUId(null);
    expect(result.errors).toContain('GPU ID must be a non-empty string');

    // Test GPU preference validation errors
    result = validateGPUPreference([]);
    expect(result.errors).toContain('GPU preference must be a non-empty array');

    result = validateGPUPreference(['invalid_type']);
    expect(result.errors).toContain('Invalid GPU type: invalid_type');

    result = validateGPUPreference(['nvidia', 'nvidia']);
    expect(result.errors).toContain('Duplicate GPU types not allowed');

    // Test OpenVINO preferences validation errors
    const invalidPrefs = {
      cacheDir: '',
      devicePreference: 'invalid',
      enableOptimizations: 'not_boolean',
    };

    result = validateOpenVINOPreferences(invalidPrefs);
    expect(result.errors).toContain(
      'Cache directory must be a non-empty string',
    );
    expect(result.errors).toContain(
      'Device preference must be discrete, integrated, or auto',
    );
    expect(result.errors).toContain('Enable optimizations must be a boolean');
  });

  test('should validate complete settings object', () => {
    const validSettings: EnhancedSettings = {
      ...global.testUtils.createModernSettings(),
      useOpenVINO: true,
      selectedGPUId: 'intel_arc_a770',
      gpuPreference: ['intel', 'nvidia', 'cpu'],
      gpuAutoDetection: false,
      openvinoPreferences: {
        cacheDir: '/custom/cache',
        devicePreference: 'discrete',
        enableOptimizations: true,
      },
    };

    const result = validateCompleteSettings(validSettings);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should detect conflicting GPU settings', () => {
    const conflictingSettings = {
      ...global.testUtils.createModernSettings(),
      useCuda: true,
      useOpenVINO: true,
      selectedGPUId: 'intel_gpu_0', // Specific Intel GPU
      gpuPreference: ['nvidia', 'intel', 'cpu'], // But NVIDIA first
    };

    const result = validateCompleteSettings(conflictingSettings);

    expect(result.warnings).toContain(
      'Both CUDA and OpenVINO enabled with specific Intel GPU selected - may cause conflicts',
    );
  });

  test('should provide helpful suggestions', () => {
    const settingsNeedingSuggestions = {
      ...global.testUtils.createModernSettings(),
      selectedGPUId: 'specific_gpu_id',
      gpuAutoDetection: false,
      gpuPreference: ['cpu', 'nvidia', 'intel'], // CPU first - unusual
    };

    const result = validateCompleteSettings(settingsNeedingSuggestions);

    expect(result.suggestions).toContain(
      'Consider enabling auto-detection for optimal GPU selection',
    );
    expect(result.suggestions).toContain(
      'CPU-first preference may reduce performance - consider reordering',
    );
  });

  test('should validate settings with missing optional fields', () => {
    const minimalSettings = {
      ...global.testUtils.createLegacySettings(),
      useOpenVINO: true,
      selectedGPUId: 'auto',
      gpuPreference: ['intel', 'cpu'],
      gpuAutoDetection: true,
      // Missing openvinoPreferences - should use defaults
    };

    const result = validateCompleteSettings(minimalSettings);

    expect(result.isValid).toBe(true);
    expect(result.warnings).toContain(
      'OpenVINO preferences missing - will use defaults',
    );
  });
});

// Validation helper functions
function validateGPUId(gpuId: any): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: [],
  };

  if (typeof gpuId !== 'string' || gpuId.trim().length === 0) {
    result.isValid = false;
    result.errors.push('GPU ID must be a non-empty string');
  }

  return result;
}

function validateGPUPreference(preference: any): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: [],
  };

  if (!Array.isArray(preference)) {
    result.isValid = false;
    result.errors.push('GPU preference must be an array');
    return result;
  }

  if (preference.length === 0) {
    result.isValid = false;
    result.errors.push('GPU preference must be a non-empty array');
    return result;
  }

  const validTypes = ['nvidia', 'intel', 'apple', 'cpu'];
  const invalidTypes = preference.filter(
    (type) => typeof type !== 'string' || !validTypes.includes(type),
  );

  if (invalidTypes.length > 0) {
    result.isValid = false;
    result.errors.push(`Invalid GPU type: ${invalidTypes[0]}`);
  }

  // Check for duplicates
  const uniqueTypes = new Set(preference);
  if (uniqueTypes.size !== preference.length) {
    result.isValid = false;
    result.errors.push('Duplicate GPU types not allowed');
  }

  return result;
}

function validateOpenVINOPreferences(prefs: any): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: [],
  };

  if (!prefs || typeof prefs !== 'object') {
    result.isValid = false;
    result.errors.push('OpenVINO preferences must be an object');
    return result;
  }

  if (
    !prefs.cacheDir ||
    typeof prefs.cacheDir !== 'string' ||
    prefs.cacheDir.trim().length === 0
  ) {
    result.isValid = false;
    result.errors.push('Cache directory must be a non-empty string');
  }

  const validDevicePreferences = ['discrete', 'integrated', 'auto'];
  if (!validDevicePreferences.includes(prefs.devicePreference)) {
    result.isValid = false;
    result.errors.push(
      'Device preference must be discrete, integrated, or auto',
    );
  }

  if (typeof prefs.enableOptimizations !== 'boolean') {
    result.isValid = false;
    result.errors.push('Enable optimizations must be a boolean');
  }

  return result;
}

function validateCompleteSettings(settings: any): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: [],
  };

  // Validate individual components
  const gpuIdResult = validateGPUId(settings.selectedGPUId);
  const gpuPrefResult = validateGPUPreference(settings.gpuPreference);

  // Merge results
  result.errors.push(...gpuIdResult.errors, ...gpuPrefResult.errors);
  result.warnings.push(...gpuIdResult.warnings, ...gpuPrefResult.warnings);
  result.suggestions.push(
    ...gpuIdResult.suggestions,
    ...gpuPrefResult.suggestions,
  );

  if (settings.openvinoPreferences) {
    const openvinoResult = validateOpenVINOPreferences(
      settings.openvinoPreferences,
    );
    result.errors.push(...openvinoResult.errors);
    result.warnings.push(...openvinoResult.warnings);
    result.suggestions.push(...openvinoResult.suggestions);
  } else if (settings.useOpenVINO) {
    result.warnings.push('OpenVINO preferences missing - will use defaults');
  }

  // Check for conflicts
  if (
    settings.useCuda &&
    settings.useOpenVINO &&
    settings.selectedGPUId !== 'auto' &&
    settings.selectedGPUId.includes('intel')
  ) {
    result.warnings.push(
      'Both CUDA and OpenVINO enabled with specific Intel GPU selected - may cause conflicts',
    );
  }

  // Provide suggestions
  if (
    settings.selectedGPUId !== 'auto' &&
    settings.gpuAutoDetection === false
  ) {
    result.suggestions.push(
      'Consider enabling auto-detection for optimal GPU selection',
    );
  }

  if (settings.gpuPreference && settings.gpuPreference[0] === 'cpu') {
    result.suggestions.push(
      'CPU-first preference may reduce performance - consider reordering',
    );
  }

  result.isValid = result.errors.length === 0;
  return result;
}
