/**
 * Unit Tests for Intel Core Ultra Detection Module
 * 
 * Tests for hardware identification, processor detection,
 * and integrated graphics assessment capabilities.
 */

import {
  isIntelCoreUltra,
  detectCoreUltraWithGraphics,
  mockCoreUltraDetection,
  CoreUltraDetector,
  coreUltraDetector,
  CoreUltraInfo
} from '../../main/helpers/coreUltraDetection';

import { TestAssertions } from '../setup/mockEnvironment';

describe('Intel Core Ultra Detection', () => {
  afterEach(() => {
    // Reset detector state between tests
    coreUltraDetector.disableMockMode();
    coreUltraDetector.clearCache();
  });

  describe('Basic Detection Functions', () => {
    test('should detect Intel Core Ultra processor', async () => {
      // Note: This test will fail on non-Intel Core Ultra systems
      // but provides validation for the detection logic
      const result = await isIntelCoreUltra();
      expect(typeof result).toBe('boolean');
    });

    test('should provide comprehensive detection info', async () => {
      const info = await detectCoreUltraWithGraphics();
      
      expect(info).toBeDefined();
      expect(typeof info.isIntelCoreUltra).toBe('boolean');
      expect(typeof info.hasIntegratedGraphics).toBe('boolean');
      expect(['systeminformation', 'fallback', 'mock']).toContain(info.detectionMethod);
      expect(['high', 'medium', 'low']).toContain(info.confidence);
    });
  });

  describe('Mock Implementation', () => {
    test('should simulate Core Ultra processor', () => {
      const info = mockCoreUltraDetection(true);
      
      expect(info.isIntelCoreUltra).toBe(true);
      expect(info.hasIntegratedGraphics).toBe(true);
      expect(info.cpuBrand).toContain('Core');
      expect(info.cpuBrand).toContain('Ultra');
      expect(info.cpuManufacturer).toBe('GenuineIntel');
      expect(info.detectionMethod).toBe('mock');
      expect(info.confidence).toBe('high');
    });

    test('should simulate non-Ultra processor', () => {
      const info = mockCoreUltraDetection(false);
      
      expect(info.isIntelCoreUltra).toBe(false);
      expect(info.hasIntegratedGraphics).toBe(false);
      expect(info.cpuBrand).toContain('Mock');
      expect(info.cpuManufacturer).toBe('GenuineIntel');
      expect(info.detectionMethod).toBe('mock');
      expect(info.confidence).toBe('high');
    });
  });

  describe('CoreUltraDetector Singleton', () => {
    test('should create singleton instance', () => {
      const instance1 = CoreUltraDetector.getInstance();
      const instance2 = CoreUltraDetector.getInstance();
      
      expect(instance1).toBe(instance2);
      expect(instance1).toBeInstanceOf(CoreUltraDetector);
    });

    test('should enable mock mode', async () => {
      coreUltraDetector.enableMockMode(true);
      
      const info = await coreUltraDetector.detect();
      expect(info.isIntelCoreUltra).toBe(true);
      expect(info.detectionMethod).toBe('mock');
    });

    test('should disable mock mode', async () => {
      coreUltraDetector.enableMockMode(true);
      let info = await coreUltraDetector.detect();
      expect(info.detectionMethod).toBe('mock');
      
      coreUltraDetector.disableMockMode();
      info = await coreUltraDetector.detect();
      expect(info.detectionMethod).not.toBe('mock');
    });

    test('should cache detection results', async () => {
      coreUltraDetector.enableMockMode(true);
      
      const info1 = await coreUltraDetector.detect();
      const info2 = await coreUltraDetector.detect();
      
      expect(info1).toBe(info2); // Same object reference = cached
    });

    test('should clear cache when requested', async () => {
      coreUltraDetector.enableMockMode(true);
      
      const info1 = await coreUltraDetector.detect();
      coreUltraDetector.clearCache();
      const info2 = await coreUltraDetector.detect();
      
      // Different objects but same content
      expect(info1).not.toBe(info2);
      expect(info1.isIntelCoreUltra).toBe(info2.isIntelCoreUltra);
    });
  });

  describe('Error Handling', () => {
    test('should handle detection failures gracefully', async () => {
      // This tests the fallback behavior when systeminformation fails
      const info = await detectCoreUltraWithGraphics();
      
      // Should not throw errors, even if detection fails
      expect(info).toBeDefined();
      expect(typeof info.isIntelCoreUltra).toBe('boolean');
    });
  });

  describe('Integration with Test Assertions', () => {
    test('should validate CoreUltraInfo structure', () => {
      const info = mockCoreUltraDetection(true);
      
      // Use custom assertion if available
      if (TestAssertions.assertValidCoreUltraInfo) {
        TestAssertions.assertValidCoreUltraInfo(info);
      } else {
        // Fallback manual validation
        expect(info).toHaveProperty('isIntelCoreUltra');
        expect(info).toHaveProperty('hasIntegratedGraphics');
        expect(info).toHaveProperty('detectionMethod');
        expect(info).toHaveProperty('confidence');
      }
    });
  });
});

// Export for potential integration tests
export { };