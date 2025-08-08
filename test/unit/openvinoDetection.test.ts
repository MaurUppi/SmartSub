/**
 * Unit Tests for OpenVINO Detection System
 *
 * Tests for OpenVINO installation detection, version validation,
 * and compatibility checking.
 */

import { OpenVINODetector } from '../../main/hardware/openvinoDetection';
import { fixtures } from '../fixtures/mockGPUData';

describe('OpenVINO Detection System', () => {
  let detector: OpenVINODetector;

  beforeEach(() => {
    detector = new OpenVINODetector();
  });

  describe('Version Validation', () => {
    test('should validate OpenVINO 2024.6.0 as minimum required version', () => {
      // Use the private method via bracket notation for testing
      const validateVersion = (detector as any).validateVersion.bind(detector);

      expect(validateVersion('2024.6.0')).toBe(true);
      expect(validateVersion('2024.7.0')).toBe(true);
      expect(validateVersion('2025.1.0')).toBe(true);
    });

    test('should reject versions below 2024.6.0', () => {
      const validateVersion = (detector as any).validateVersion.bind(detector);

      expect(validateVersion('2024.5.0')).toBe(false);
      expect(validateVersion('2024.1.0')).toBe(false);
      expect(validateVersion('2023.3.0')).toBe(false);
      expect(validateVersion('2022.1.0')).toBe(false);
    });

    test('should handle version edge cases', () => {
      const validateVersion = (detector as any).validateVersion.bind(detector);

      expect(validateVersion('unknown')).toBe(false);
      expect(validateVersion('')).toBe(false);
      expect(validateVersion('invalid.version')).toBe(false);
      expect(validateVersion('2024')).toBe(false);
    });

    test('should handle different version formats', () => {
      const validateVersion = (detector as any).validateVersion.bind(detector);

      expect(validateVersion('2024.6.0.123')).toBe(true);
      expect(validateVersion('2024.6')).toBe(true);
      expect(validateVersion('2024.6.0-dev')).toBe(true); // Should extract numeric part
    });
  });

  describe('Script Output Parsing', () => {
    test('should parse successful Python detection output', () => {
      const parseScriptOutput = (detector as any).parseScriptOutput.bind(
        detector,
      );

      const mockOutput = `
VERSION:2024.6.0
DEVICES:GPU,CPU,MYRIAD
INTEL_DEVICES:GPU.0,GPU.1
FORMATS:ONNX,IR,TensorFlow
SUCCESS:Python detection successful
      `.trim();

      const result = parseScriptOutput(mockOutput, 'package');

      expect(result).toBeDefined();
      expect(result!.isInstalled).toBe(true);
      expect(result!.version).toBe('2024.6.0');
      expect(result!.supportedDevices).toContain('GPU');
      expect(result!.supportedDevices).toContain('CPU');
      expect(result!.modelFormats).toContain('ONNX');
      expect(result!.installationMethod).toBe('package');
      expect(result!.validationStatus).toBe('valid');
    });

    test('should handle partial script output', () => {
      const parseScriptOutput = (detector as any).parseScriptOutput.bind(
        detector,
      );

      const mockOutput = `
VERSION:2024.6.0
SUCCESS:Python detection successful
      `.trim();

      const result = parseScriptOutput(mockOutput, 'package');

      expect(result).toBeDefined();
      expect(result!.version).toBe('2024.6.0');
      expect(result!.supportedDevices).toEqual(['GPU', 'CPU']); // Default values
      expect(result!.modelFormats).toEqual(['ONNX', 'IR']); // Default values
    });

    test('should return null for failed script output', () => {
      const parseScriptOutput = (detector as any).parseScriptOutput.bind(
        detector,
      );

      const mockOutput = `
VERSION:2024.6.0
ERROR:Detection failed - ImportError
      `.trim();

      const result = parseScriptOutput(mockOutput, 'package');
      expect(result).toBeNull();
    });

    test('should handle malformed script output', () => {
      const parseScriptOutput = (detector as any).parseScriptOutput.bind(
        detector,
      );

      const mockOutput = 'Invalid output format';

      const result = parseScriptOutput(mockOutput, 'package');
      expect(result).toBeNull();
    });
  });

  describe('Version Extraction from Path', () => {
    test('should extract version from path containing version number', async () => {
      const extractVersionFromPath = (
        detector as any
      ).extractVersionFromPath.bind(detector);

      const testPaths = [
        '/opt/intel/openvino_2024.6.0',
        'C:\\Program Files\\Intel\\openvino_2024.6.0',
        '/usr/local/intel/openvino_2024.7.1',
      ];

      for (const path of testPaths) {
        const version = await extractVersionFromPath(path);
        expect(version).toMatch(/\d+\.\d+\.\d+/);
      }
    });

    test('should return null for paths without version information', async () => {
      const extractVersionFromPath = (
        detector as any
      ).extractVersionFromPath.bind(detector);

      const testPaths = [
        '/opt/intel/openvino',
        'C:\\Program Files\\Intel\\openvino',
        '/usr/local/bin',
      ];

      for (const path of testPaths) {
        const version = await extractVersionFromPath(path);
        expect(version).toBeNull();
      }
    });
  });

  describe('OpenVINO Detection Methods', () => {
    test('should handle detection failures gracefully', async () => {
      const result = await detector.detectOpenVINO();

      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(typeof result.detectionTimeMs).toBe('number');

      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(result.data).toBeNull();
      }
    });

    test('should timeout appropriately', async () => {
      const startTime = Date.now();
      const result = await detector.detectOpenVINO();
      const endTime = Date.now();

      // Should not hang indefinitely
      expect(endTime - startTime).toBeLessThan(15000); // 15 second max
    });

    test('should return consistent result structure', async () => {
      const result = await detector.detectOpenVINO();

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('detectionTimeMs');

      if (result.success) {
        expect(result.data).toBeDefined();
        expect(result.data).toHaveProperty('isInstalled');
        expect(result.data).toHaveProperty('version');
        expect(result.data).toHaveProperty('supportedDevices');
        expect(result.data).toHaveProperty('modelFormats');
        expect(result.data).toHaveProperty('validationStatus');
        expect(result.data).toHaveProperty('installationMethod');
      } else {
        expect(result.error).toBeDefined();
        expect(result.data).toBeNull();
      }
    });
  });

  describe('Integration with Mock System', () => {
    test('should work with mock OpenVINO capabilities', () => {
      const openvinoCapabilities =
        fixtures.openVinoCapabilityFixtures.fullInstallation();

      expect(openvinoCapabilities.isInstalled).toBe(true);
      expect(openvinoCapabilities.version).toBe('2024.6.0');
      expect(openvinoCapabilities.supportedDevices).toContain(
        'intel-arc-a770-16gb',
      );
      expect(openvinoCapabilities.modelFormats).toContain('ONNX');
      expect(openvinoCapabilities.validationStatus).toBe('valid');
    });

    test('should handle mock unavailable scenario', () => {
      const openvinoCapabilities =
        fixtures.openVinoCapabilityFixtures.notInstalled();

      expect(openvinoCapabilities.isInstalled).toBe(false);
      expect(openvinoCapabilities.validationStatus).toBe('invalid');
      expect(openvinoCapabilities.detectionErrors.length).toBeGreaterThan(0);
    });

    test('should handle mock development scenario', () => {
      const openvinoCapabilities =
        fixtures.openVinoCapabilityFixtures.developmentMock();

      expect(openvinoCapabilities.isInstalled).toBe(true);
      expect(openvinoCapabilities.version).toBe('2024.6.0-mock');
      expect(openvinoCapabilities.supportedDevices).toContain(
        'mock-intel-arc-a770',
      );
      expect(openvinoCapabilities.runtimePath).toBe('/mock/openvino/runtime');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle system command failures', async () => {
      // This test verifies that the detector doesn't crash on system errors
      const result = await detector.detectOpenVINO();

      // Should not throw an error
      expect(result).toBeDefined();

      // If detection fails, should provide meaningful error info
      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(typeof result.error).toBe('string');
        expect(result.error.length).toBeGreaterThan(0);
      }
    });

    test('should handle missing dependencies gracefully', async () => {
      // Test behavior when Python or OpenVINO is not available
      const result = await detector.detectOpenVINO();

      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');

      // Should complete within reasonable time even when failing
      expect(result.detectionTimeMs).toBeLessThan(15000);
    });

    test('should validate supported devices format', () => {
      const testCapabilities = [
        fixtures.openVinoCapabilityFixtures.fullInstallation(),
        fixtures.openVinoCapabilityFixtures.developmentMock(),
      ];

      for (const capabilities of testCapabilities) {
        expect(Array.isArray(capabilities.supportedDevices)).toBe(true);
        expect(capabilities.supportedDevices.length).toBeGreaterThan(0);

        // Should contain at least GPU support for Intel systems
        const hasGPUSupport = capabilities.supportedDevices.some(
          (device) =>
            device.toLowerCase().includes('gpu') ||
            device.toLowerCase().includes('intel'),
        );
        expect(hasGPUSupport).toBe(true);
      }
    });

    test('should validate model formats', () => {
      const testCapabilities = [
        fixtures.openVinoCapabilityFixtures.fullInstallation(),
        fixtures.openVinoCapabilityFixtures.developmentMock(),
      ];

      for (const capabilities of testCapabilities) {
        expect(Array.isArray(capabilities.modelFormats)).toBe(true);
        expect(capabilities.modelFormats).toContain('ONNX');
        expect(capabilities.modelFormats.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Performance and Reliability', () => {
    test('should complete detection within timeout', async () => {
      const startTime = Date.now();
      const result = await detector.detectOpenVINO();
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(12000); // Should complete within 12 seconds
      expect(result.detectionTimeMs).toBeLessThan(12000);
    });

    test('should provide accurate detection timing', async () => {
      const result = await detector.detectOpenVINO();

      expect(typeof result.detectionTimeMs).toBe('number');
      expect(result.detectionTimeMs).toBeGreaterThan(0);
      expect(result.detectionTimeMs).toBeLessThan(15000);
    });

    test('should be consistent across multiple calls', async () => {
      const results = [];

      // Run detection multiple times
      for (let i = 0; i < 3; i++) {
        const result = await detector.detectOpenVINO();
        results.push(result);
      }

      // Results should be consistent
      const successValues = results.map((r) => r.success);
      const firstSuccess = successValues[0];

      expect(successValues.every((success) => success === firstSuccess)).toBe(
        true,
      );

      // If successful, data should be consistent
      if (firstSuccess) {
        const versions = results.map((r) => r.data?.version);
        expect(versions.every((version) => version === versions[0])).toBe(true);
      }
    });
  });
});
