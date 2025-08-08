/**
 * Unit Tests for GPU Classification System
 *
 * Tests for GPU type classification, priority ranking,
 * and model compatibility validation.
 */

import {
  GPUClassifier,
  gpuClassifier,
} from '../../main/hardware/gpuClassification';

import { intelGPUFixtures, fixtures } from '../fixtures/mockGPUData';

describe('GPU Classification System', () => {
  describe('GPU Type Classification', () => {
    test('should classify Intel Arc A-series as discrete GPUs', () => {
      const testCases = [
        'Intel Arc A770 16GB',
        'Intel Arc A750 8GB',
        'Intel Arc A580 8GB',
        'Intel Arc A380 6GB',
        'Arc A770',
        'Intel Arc Graphics',
      ];

      for (const gpuName of testCases) {
        const type = gpuClassifier.classifyGPUType(gpuName);
        expect(type).toBe('discrete');
      }
    });

    test('should classify Intel Core Ultra integrated graphics correctly', () => {
      const testCases = [
        'Intel Core Ultra Processors with Intel Arc Graphics.(Integrated graphic unit)',
        'Intel Core Ultra 7 155H Graphics',
        'Core Ultra Processors with Intel Arc Graphics',
      ];

      for (const gpuName of testCases) {
        const type = gpuClassifier.classifyGPUType(gpuName);
        expect(type).toBe('integrated');
      }
    });

    test('should classify traditional Intel integrated graphics correctly', () => {
      const testCases = [
        'Intel Xe Graphics',
        'Intel Iris Xe Graphics',
        'Intel Iris Xe MAX Graphics',
        'Intel UHD Graphics 630',
        'Intel HD Graphics 4000',
      ];

      for (const gpuName of testCases) {
        const type = gpuClassifier.classifyGPUType(gpuName);
        expect(type).toBe('integrated');
      }
    });

    test('should handle edge cases in GPU name parsing', () => {
      const testCases = [
        { name: 'Intel Graphics', expected: 'integrated' },
        { name: 'Arc Unknown Model', expected: 'discrete' },
        { name: 'Intel Integrated Graphics', expected: 'integrated' },
        { name: 'Unknown Intel GPU', expected: 'integrated' }, // Conservative default
      ];

      for (const testCase of testCases) {
        const type = gpuClassifier.classifyGPUType(testCase.name);
        expect(type).toBe(testCase.expected);
      }
    });
  });

  describe('GPU Priority Calculation', () => {
    test('should assign higher priority to Arc A770 than other Arc models', () => {
      const a770Priority = gpuClassifier.calculateGPUPriority(
        'Intel Arc A770 16GB',
      );
      const a750Priority =
        gpuClassifier.calculateGPUPriority('Intel Arc A750 8GB');
      const a580Priority =
        gpuClassifier.calculateGPUPriority('Intel Arc A580 8GB');
      const a380Priority =
        gpuClassifier.calculateGPUPriority('Intel Arc A380 6GB');

      expect(a770Priority).toBeGreaterThan(a750Priority);
      expect(a750Priority).toBeGreaterThan(a580Priority);
      expect(a580Priority).toBeGreaterThan(a380Priority);
    });

    test('should assign higher priority to Core Ultra than traditional integrated graphics', () => {
      const coreUltraPriority = gpuClassifier.calculateGPUPriority(
        'Intel Core Ultra Processors with Intel Arc Graphics.(Integrated graphic unit)',
      );
      const xePriority =
        gpuClassifier.calculateGPUPriority('Intel Xe Graphics');
      const irisPriority = gpuClassifier.calculateGPUPriority(
        'Intel Iris Xe Graphics',
      );
      const uhdPriority = gpuClassifier.calculateGPUPriority(
        'Intel UHD Graphics 630',
      );

      expect(coreUltraPriority).toBeGreaterThan(xePriority);
      expect(coreUltraPriority).toBeGreaterThan(irisPriority);
      expect(coreUltraPriority).toBeGreaterThan(uhdPriority);
    });

    test('should consider memory size in priority calculation', () => {
      const gpu16GB = gpuClassifier.calculateGPUPriority('Intel Arc A770 16GB');
      const gpu8GB = gpuClassifier.calculateGPUPriority('Intel Arc A750 8GB');
      const gpu4GB = gpuClassifier.calculateGPUPriority('Intel Arc A380 4GB');

      expect(gpu16GB).toBeGreaterThan(gpu8GB);
      expect(gpu8GB).toBeGreaterThan(gpu4GB);
    });

    test('should ensure all GPUs have minimum priority of 1', () => {
      const testCases = [
        'Unknown GPU',
        'Generic Graphics',
        'Intel HD Graphics 2000',
      ];

      for (const gpuName of testCases) {
        const priority = gpuClassifier.calculateGPUPriority(gpuName);
        expect(priority).toBeGreaterThanOrEqual(1);
      }
    });
  });

  describe('Performance Classification', () => {
    test('should classify Arc A770 and A750 as high performance', () => {
      expect(gpuClassifier.getPerformanceClass('Intel Arc A770 16GB')).toBe(
        'high',
      );
      expect(gpuClassifier.getPerformanceClass('Intel Arc A750 8GB')).toBe(
        'high',
      );
    });

    test('should classify Arc A580 and A380 as medium performance', () => {
      expect(gpuClassifier.getPerformanceClass('Intel Arc A580 8GB')).toBe(
        'medium',
      );
      expect(gpuClassifier.getPerformanceClass('Intel Arc A380 6GB')).toBe(
        'medium',
      );
    });

    test('should classify Core Ultra integrated graphics as medium performance', () => {
      const performance = gpuClassifier.getPerformanceClass(
        'Intel Core Ultra Processors with Intel Arc Graphics.(Integrated graphic unit)',
      );
      expect(performance).toBe('medium');
    });

    test('should classify traditional integrated graphics appropriately', () => {
      expect(
        gpuClassifier.getPerformanceClass('Intel Iris Xe MAX Graphics'),
      ).toBe('medium');
      expect(gpuClassifier.getPerformanceClass('Intel UHD Graphics 630')).toBe(
        'low',
      );
      expect(gpuClassifier.getPerformanceClass('Intel HD Graphics 4000')).toBe(
        'low',
      );
    });
  });

  describe('Power Efficiency Classification', () => {
    test('should classify Core Ultra integrated graphics as excellent efficiency', () => {
      const efficiency = gpuClassifier.getPowerEfficiency(
        'Intel Core Ultra Processors with Intel Arc Graphics.(Integrated graphic unit)',
      );
      expect(efficiency).toBe('excellent');
    });

    test('should classify modern integrated graphics as excellent efficiency', () => {
      expect(gpuClassifier.getPowerEfficiency('Intel Xe Graphics')).toBe(
        'excellent',
      );
      expect(gpuClassifier.getPowerEfficiency('Intel Iris Xe Graphics')).toBe(
        'excellent',
      );
    });

    test('should classify smaller Arc models as good efficiency', () => {
      expect(gpuClassifier.getPowerEfficiency('Intel Arc A380 6GB')).toBe(
        'good',
      );
      expect(gpuClassifier.getPowerEfficiency('Intel Arc A310')).toBe('good');
    });

    test('should classify larger Arc models as moderate efficiency', () => {
      expect(gpuClassifier.getPowerEfficiency('Intel Arc A770 16GB')).toBe(
        'moderate',
      );
      expect(gpuClassifier.getPowerEfficiency('Intel Arc A750 8GB')).toBe(
        'moderate',
      );
      expect(gpuClassifier.getPowerEfficiency('Intel Arc A580 8GB')).toBe(
        'moderate',
      );
    });
  });

  describe('Comprehensive GPU Classification', () => {
    test('should provide complete classification for Intel Arc A770', () => {
      const classification = gpuClassifier.classifyGPU('Intel Arc A770 16GB');

      expect(classification.isIntelGPU).toBe(true);
      expect(classification.isDiscreteGPU).toBe(true);
      expect(classification.isIntegratedGPU).toBe(false);
      expect(classification.isArcSeries).toBe(true);
      expect(classification.isCoreUltraIntegrated).toBe(false);
      expect(classification.priority).toBeGreaterThan(50);
      expect(classification.performanceClass).toBe('high');
      expect(classification.powerClass).toBe('moderate');
    });

    test('should provide complete classification for Core Ultra graphics', () => {
      const classification = gpuClassifier.classifyGPU(
        'Intel Core Ultra Processors with Intel Arc Graphics.(Integrated graphic unit)',
      );

      expect(classification.isIntelGPU).toBe(true);
      expect(classification.isDiscreteGPU).toBe(false);
      expect(classification.isIntegratedGPU).toBe(true);
      expect(classification.isArcSeries).toBe(false);
      expect(classification.isCoreUltraIntegrated).toBe(true);
      expect(classification.priority).toBeGreaterThan(20);
      expect(classification.performanceClass).toBe('medium');
      expect(classification.powerClass).toBe('excellent');
    });
  });

  describe('Model Compatibility Validation', () => {
    test('should validate Intel GPU compatibility with small models', () => {
      const gpu = intelGPUFixtures.arcA770();
      const validation = gpuClassifier.validateModelCompatibility(gpu, 'base');

      expect(validation.deviceSupported).toBe(true);
      expect(validation.compatibilityScore).toBeGreaterThan(80);
      expect(validation.errors.length).toBe(0);
    });

    test('should validate Intel GPU compatibility with large models', () => {
      const gpu = intelGPUFixtures.arcA770();
      const validation = gpuClassifier.validateModelCompatibility(
        gpu,
        'large-v3',
      );

      expect(validation.deviceSupported).toBe(true);
      expect(validation.compatibilityScore).toBeGreaterThan(80);
      expect(validation.recommendations).toContain(
        'Sufficient VRAM for large model processing',
      );
    });

    test('should warn about limited VRAM for large models on smaller GPUs', () => {
      const gpu = intelGPUFixtures.arcA380();
      const validation = gpuClassifier.validateModelCompatibility(
        gpu,
        'large-v3',
      );

      expect(validation.warnings.length).toBeGreaterThan(0);
      expect(
        validation.warnings.some(
          (warning) => warning.includes('VRAM') || warning.includes('memory'),
        ),
      ).toBe(true);
    });

    test('should provide recommendations for discrete GPUs', () => {
      const gpu = intelGPUFixtures.arcA770();
      const validation = gpuClassifier.validateModelCompatibility(gpu, 'base');

      expect(validation.recommendations).toContain(
        'Discrete GPU provides optimal performance',
      );
    });

    test('should provide appropriate recommendations for Core Ultra integrated graphics', () => {
      const gpu = {
        ...intelGPUFixtures.xeGraphics(),
        name: 'Intel Core Ultra Processors with Intel Arc Graphics.(Integrated graphic unit)',
      };

      const validation = gpuClassifier.validateModelCompatibility(gpu, 'base');

      expect(
        validation.recommendations.some((rec) =>
          rec.includes('Intel Core Ultra'),
        ),
      ).toBe(true);
    });

    test('should reject non-Intel GPUs', () => {
      const nvidiaGPU = {
        id: 'test-nvidia',
        name: 'NVIDIA GeForce RTX 4080',
        type: 'discrete' as const,
        vendor: 'nvidia' as const,
        deviceId: 'test-device',
        priority: 80,
        driverVersion: '531.0',
        memory: 16384,
        capabilities: {
          openvinoCompatible: false,
          cudaCompatible: true,
          coremlCompatible: false,
        },
        powerEfficiency: 'moderate' as const,
        performance: 'high' as const,
        detectionMethod: 'mock' as const,
      };

      const validation = gpuClassifier.validateModelCompatibility(
        nvidiaGPU,
        'base',
      );

      expect(validation.deviceSupported).toBe(false);
      expect(validation.compatibilityScore).toBe(0);
      expect(validation.errors).toContain(
        'Non-Intel GPU not supported for OpenVINO acceleration',
      );
    });

    test('should reject GPUs without OpenVINO compatibility', () => {
      const incompatibleGPU = {
        ...intelGPUFixtures.arcA770(),
        capabilities: {
          openvinoCompatible: false,
          cudaCompatible: false,
          coremlCompatible: false,
        },
      };

      const validation = gpuClassifier.validateModelCompatibility(
        incompatibleGPU,
        'base',
      );

      expect(validation.deviceSupported).toBe(false);
      expect(validation.errors).toContain(
        'GPU does not support OpenVINO acceleration',
      );
    });

    test('should consider driver version in compatibility scoring', () => {
      const gpuWithDriver = intelGPUFixtures.arcA770();
      const gpuWithoutDriver = {
        ...gpuWithDriver,
        driverVersion: 'unknown',
      };

      const validationWith = gpuClassifier.validateModelCompatibility(
        gpuWithDriver,
        'base',
      );
      const validationWithout = gpuClassifier.validateModelCompatibility(
        gpuWithoutDriver,
        'base',
      );

      expect(validationWith.compatibilityScore).toBeGreaterThanOrEqual(
        validationWithout.compatibilityScore,
      );
      expect(validationWithout.warnings).toContain(
        'Driver version could not be detected',
      );
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle empty GPU names gracefully', () => {
      expect(() => gpuClassifier.classifyGPUType('')).not.toThrow();
      expect(() => gpuClassifier.calculateGPUPriority('')).not.toThrow();
      expect(() => gpuClassifier.getPerformanceClass('')).not.toThrow();
      expect(() => gpuClassifier.getPowerEfficiency('')).not.toThrow();
    });

    test('should handle null and undefined GPU names', () => {
      const testValues = [null, undefined];

      for (const value of testValues) {
        expect(() => gpuClassifier.classifyGPUType(value as any)).not.toThrow();
        expect(() =>
          gpuClassifier.calculateGPUPriority(value as any),
        ).not.toThrow();
      }
    });

    test('should handle unusual GPU name formats', () => {
      const unusualNames = [
        'INTEL ARC A770 16GB',
        'intel xe graphics',
        'Arc-A750-8GB',
        'Intel Core Ultra 7 155H with Intel Arc Graphics',
      ];

      for (const name of unusualNames) {
        expect(() => {
          const classification = gpuClassifier.classifyGPU(name);
          expect(classification).toBeDefined();
          expect(typeof classification.isIntelGPU).toBe('boolean');
        }).not.toThrow();
      }
    });
  });
});
