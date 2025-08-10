/**
 * Unit Tests for Mock Environment Setup
 *
 * Tests for the comprehensive mock environment infrastructure,
 * Jest integration, and global test setup/teardown.
 */

import {
  MockEnvironmentSetup,
  mockEnvironmentSetup,
  TestSuiteSetup,
  MockDataGenerators,
  TestAssertions,
  globalSetup,
  globalTeardown,
  commonTestSetup,
  createTimeoutTest,
} from '../setup/mockEnvironment';

import { mockSystem } from '../../main/helpers/developmentMockSystem';
import { testUtils } from '../../main/helpers/testUtils';
import { fixtures } from '../fixtures/mockGPUData';

describe('MockEnvironmentSetup', () => {
  afterEach(async () => {
    await mockEnvironmentSetup.teardownGlobalEnvironment();
  });

  describe('Singleton Pattern', () => {
    test('should create singleton instance', () => {
      const instance1 = MockEnvironmentSetup.getInstance();
      const instance2 = MockEnvironmentSetup.getInstance();

      expect(instance1).toBe(instance2);
      expect(instance1).toBeInstanceOf(MockEnvironmentSetup);
    });
  });

  describe('Global Environment Setup', () => {
    test('should setup global environment correctly', async () => {
      const originalNodeEnv = process.env.NODE_ENV;

      try {
        await mockEnvironmentSetup.setupGlobalEnvironment();

        // Verify environment variables
        expect(process.env.NODE_ENV).toBe('test');
        expect(process.env.FORCE_MOCK_INTEL_GPU).toBe('true');
        expect(process.env.TEST_ENVIRONMENT).toBe('jest');

        // Verify mock system initialization
        expect(mockSystem.isMockingEnabled()).toBe(true);

        // Verify devices are available
        const devices = await mockSystem.enumerateGPUDevices();
        expect(devices.length).toBeGreaterThan(0);
      } finally {
        process.env.NODE_ENV = originalNodeEnv;
      }
    });

    test('should not reinitialize if already setup', async () => {
      await mockEnvironmentSetup.setupGlobalEnvironment();
      const config1 = mockSystem.getConfiguration();

      await mockEnvironmentSetup.setupGlobalEnvironment();
      const config2 = mockSystem.getConfiguration();

      expect(config1).toEqual(config2);
    });

    test('should store and restore original environment variables', async () => {
      const originalNodeEnv = process.env.NODE_ENV;
      const originalForceFlag = process.env.FORCE_MOCK_INTEL_GPU;

      process.env.NODE_ENV = 'development';
      process.env.FORCE_MOCK_INTEL_GPU = 'false';

      await mockEnvironmentSetup.setupGlobalEnvironment();
      expect(process.env.NODE_ENV).toBe('test');
      expect(process.env.FORCE_MOCK_INTEL_GPU).toBe('true');

      await mockEnvironmentSetup.teardownGlobalEnvironment();
      expect(process.env.NODE_ENV).toBe('development');
      expect(process.env.FORCE_MOCK_INTEL_GPU).toBe('false');
    });

    test('should handle undefined environment variables', async () => {
      const originalTestEnv = process.env.TEST_ENVIRONMENT;
      delete process.env.TEST_ENVIRONMENT;

      await mockEnvironmentSetup.setupGlobalEnvironment();
      expect(process.env.TEST_ENVIRONMENT).toBe('jest');

      await mockEnvironmentSetup.teardownGlobalEnvironment();
      expect(process.env.TEST_ENVIRONMENT).toBeUndefined();
    });
  });

  describe('Global Teardown', () => {
    test('should teardown global environment correctly', async () => {
      const originalNodeEnv = process.env.NODE_ENV;

      await mockEnvironmentSetup.setupGlobalEnvironment();
      await mockEnvironmentSetup.teardownGlobalEnvironment();

      expect(process.env.NODE_ENV).toBe(originalNodeEnv);
      expect(testUtils.getPerformanceTestResults()).toHaveLength(0);
    });

    test('should handle teardown when not setup', async () => {
      // Should not throw error
      await expect(
        mockEnvironmentSetup.teardownGlobalEnvironment(),
      ).resolves.not.toThrow();
    });
  });

  describe('Jest Integration', () => {
    test('should provide global setup function', async () => {
      const originalNodeEnv = process.env.NODE_ENV;

      try {
        await globalSetup();

        expect(process.env.NODE_ENV).toBe('test');
        expect(process.env.FORCE_MOCK_INTEL_GPU).toBe('true');

        const devices = await mockSystem.enumerateGPUDevices();
        expect(devices.length).toBeGreaterThan(0);
      } finally {
        await globalTeardown();
        process.env.NODE_ENV = originalNodeEnv;
      }
    });

    test('should provide global teardown function', async () => {
      const originalNodeEnv = process.env.NODE_ENV;

      await globalSetup();
      await globalTeardown();

      expect(process.env.NODE_ENV).toBe(originalNodeEnv);
    });

    test('should provide common test setup utilities', async () => {
      expect(commonTestSetup).toHaveProperty('beforeEach');
      expect(commonTestSetup).toHaveProperty('afterEach');
      expect(typeof commonTestSetup.beforeEach).toBe('function');
      expect(typeof commonTestSetup.afterEach).toBe('function');

      // Should not throw when called
      await expect(commonTestSetup.beforeEach()).resolves.not.toThrow();
      await expect(commonTestSetup.afterEach()).resolves.not.toThrow();
    });
  });

  describe('Custom Jest Matchers', () => {
    beforeEach(async () => {
      await mockEnvironmentSetup.setupGlobalEnvironment();
    });

    test('toHaveGPUDevice matcher should work correctly', async () => {
      const devices = await mockSystem.enumerateGPUDevices();
      const deviceId = devices[0].id;

      expect(devices).toHaveGPUDevice(deviceId);
      expect(devices).not.toHaveGPUDevice('non-existent-device');
    });

    test('toBeOpenVINOCompatible matcher should work correctly', async () => {
      const devices = await mockSystem.enumerateGPUDevices();
      const compatibleDevice = devices.find(
        (d) => d.capabilities.openvinoCompatible,
      );

      expect(compatibleDevice).toBeOpenVINOCompatible();

      const incompatibleDevice = {
        capabilities: { openvinoCompatible: false },
      };
      expect(incompatibleDevice).not.toBeOpenVINOCompatible();
    });

    test('toHavePerformanceMetrics matcher should work correctly', async () => {
      const devices = await mockSystem.enumerateGPUDevices();
      const metrics = await mockSystem.simulatePerformanceBenchmark(
        devices[0].id,
      );

      expect(metrics).toHavePerformanceMetrics();

      const incompleteMetrics = {
        processingTime: 100,
        // missing other metrics
      };
      expect(incompleteMetrics).not.toHavePerformanceMetrics();
    });
  });
});

describe('TestSuiteSetup', () => {
  afterEach(async () => {
    await TestSuiteSetup.cleanupTestSuite();
  });

  describe('Test Suite Management', () => {
    test('should setup test suite with macOS Intel Arc environment', async () => {
      await TestSuiteSetup.setupTestSuite('macOSWithIntelArc');

      expect(process.env.NODE_ENV).toBe('development');
      expect(process.env.FORCE_MOCK_INTEL_GPU).toBe('true');

      const devices = await mockSystem.enumerateGPUDevices();
      expect(devices).toHaveLength(1);
      expect(devices[0].name).toBe('Intel Arc A770');
    });

    test('should setup test suite with multiple Intel GPU environment', async () => {
      await TestSuiteSetup.setupTestSuite('multipleIntelGPUs');

      const devices = await mockSystem.enumerateGPUDevices();
      expect(devices).toHaveLength(2);

      const capabilities = await mockSystem.getOpenVINOCapabilities();
      expect(capabilities.supportedDevices).toHaveLength(2);
    });

    test('should setup test suite with error simulation environment', async () => {
      await TestSuiteSetup.setupTestSuite('errorSimulation');

      expect(process.env.SIMULATE_GPU_ERRORS).toBe('true');

      const devices = await mockSystem.enumerateGPUDevices();
      expect(devices).toHaveLength(0);
    });

    test('should cleanup test suite properly', async () => {
      const originalNodeEnv = process.env.NODE_ENV;

      await TestSuiteSetup.setupTestSuite('macOSWithIntelArc');
      expect(process.env.NODE_ENV).toBe('development');

      await TestSuiteSetup.cleanupTestSuite();
      expect(process.env.NODE_ENV).toBe(originalNodeEnv);
    });

    test('should create test context with setup and cleanup', () => {
      const context = TestSuiteSetup.createTestContext('TestContext');

      expect(context).toHaveProperty('setup');
      expect(context).toHaveProperty('cleanup');
      expect(typeof context.setup).toBe('function');
      expect(typeof context.cleanup).toBe('function');
    });
  });
});

describe('MockDataGenerators', () => {
  describe('GPU Device Generation', () => {
    test('should generate valid mock GPU device', () => {
      const device = MockDataGenerators.generateMockGPUDevice();

      TestAssertions.assertValidGPUDevice(device);
      expect(device.name).toBe('Mock Intel GPU');
      expect(device.vendor).toBe('intel');
      expect(device.capabilities.openvinoCompatible).toBe(true);
    });

    test('should apply overrides to generated device', () => {
      const overrides = {
        name: 'Custom Mock GPU',
        type: 'integrated' as const,
        memory: 8192,
        performance: 'high' as const,
      };

      const device = MockDataGenerators.generateMockGPUDevice(overrides);

      expect(device.name).toBe('Custom Mock GPU');
      expect(device.type).toBe('integrated');
      expect(device.memory).toBe(8192);
      expect(device.performance).toBe('high');
      expect(device.vendor).toBe('intel'); // Should keep default
    });

    test('should generate unique device IDs', () => {
      const device1 = MockDataGenerators.generateMockGPUDevice();
      const device2 = MockDataGenerators.generateMockGPUDevice();

      expect(device1.id).not.toBe(device2.id);
      expect(device1.id).toMatch(/^mock-device-[a-z0-9]{9}$/);
      expect(device2.id).toMatch(/^mock-device-[a-z0-9]{9}$/);
    });
  });

  describe('OpenVINO Capabilities Generation', () => {
    test('should generate valid OpenVINO capabilities', () => {
      const capabilities =
        MockDataGenerators.generateMockOpenVINOCapabilities();

      TestAssertions.assertValidOpenVINOCapabilities(capabilities);
      expect(capabilities.isInstalled).toBe(true);
      expect(capabilities.version).toBe('2024.6.0');
      expect(capabilities.supportedDevices).toContain('mock-device');
    });

    test('should apply overrides to generated capabilities', () => {
      const overrides = {
        version: '2023.3.0',
        isInstalled: false,
        modelFormats: ['TensorFlow', 'PyTorch'],
      };

      const capabilities =
        MockDataGenerators.generateMockOpenVINOCapabilities(overrides);

      expect(capabilities.version).toBe('2023.3.0');
      expect(capabilities.isInstalled).toBe(false);
      expect(capabilities.modelFormats).toEqual(['TensorFlow', 'PyTorch']);
      expect(capabilities.supportedDevices).toContain('mock-device'); // Should keep default
    });
  });

  describe('Performance Metrics Generation', () => {
    test('should generate valid performance metrics', () => {
      const metrics = MockDataGenerators.generateMockPerformanceMetrics();

      TestAssertions.assertValidPerformanceMetrics(metrics);
      expect(metrics.processingTime).toBeGreaterThanOrEqual(100);
      expect(metrics.processingTime).toBeLessThanOrEqual(150);
      expect(metrics.memoryUsage).toBeGreaterThanOrEqual(1024);
      expect(metrics.memoryUsage).toBeLessThanOrEqual(1536);
    });

    test('should apply overrides to generated metrics', () => {
      const overrides = {
        processingTime: 200,
        memoryUsage: 2048,
      };

      const metrics =
        MockDataGenerators.generateMockPerformanceMetrics(overrides);

      expect(metrics.processingTime).toBe(200);
      expect(metrics.memoryUsage).toBe(2048);
      expect(metrics.powerConsumption).toBeGreaterThan(0); // Should have default
      expect(metrics.throughput).toBeGreaterThan(0); // Should have default
    });

    test('should generate metrics within realistic ranges', () => {
      for (let i = 0; i < 10; i++) {
        const metrics = MockDataGenerators.generateMockPerformanceMetrics();

        expect(metrics.processingTime).toBeGreaterThan(0);
        expect(metrics.processingTime).toBeLessThan(1000);
        expect(metrics.memoryUsage).toBeGreaterThan(0);
        expect(metrics.memoryUsage).toBeLessThan(10000);
        expect(metrics.powerConsumption).toBeGreaterThan(0);
        expect(metrics.powerConsumption).toBeLessThan(500);
        expect(metrics.throughput).toBeGreaterThan(0);
        expect(metrics.throughput).toBeLessThan(200);
      }
    });
  });
});

describe('TestAssertions', () => {
  describe('GPU Device Assertions', () => {
    test('should validate correct GPU device structure', () => {
      const validDevice = fixtures.gpuDevices.arcA770();

      expect(() =>
        TestAssertions.assertValidGPUDevice(validDevice),
      ).not.toThrow();
    });

    test('should reject invalid GPU device structures', () => {
      const invalidDevices = [
        {}, // Missing all properties
        { id: 'test' }, // Missing required properties
        {
          id: 'test',
          name: 'Test',
          type: 'invalid-type', // Invalid enum value
          vendor: 'intel',
        },
        {
          id: 'test',
          name: 'Test',
          type: 'discrete',
          vendor: 'intel',
          deviceId: 'TEST',
          priority: 5,
          driverVersion: '1.0.0',
          memory: 4096,
          capabilities: {}, // Missing capability properties
          powerEfficiency: 'good',
          performance: 'medium',
        },
      ];

      invalidDevices.forEach((device) => {
        expect(() => TestAssertions.assertValidGPUDevice(device)).toThrow();
      });
    });
  });

  describe('OpenVINO Capabilities Assertions', () => {
    test('should validate correct OpenVINO capabilities structure', () => {
      const validCapabilities =
        fixtures.openvinoCapabilities.fullInstallation();

      expect(() =>
        TestAssertions.assertValidOpenVINOCapabilities(validCapabilities),
      ).not.toThrow();
    });

    test('should reject invalid OpenVINO capabilities structures', () => {
      const invalidCapabilities = [
        {}, // Missing all properties
        { isInstalled: 'true' }, // Wrong type
        {
          isInstalled: true,
          version: 123, // Wrong type
          supportedDevices: 'not-array', // Wrong type
          modelFormats: true, // Wrong type
        },
      ];

      invalidCapabilities.forEach((capabilities) => {
        expect(() =>
          TestAssertions.assertValidOpenVINOCapabilities(capabilities),
        ).toThrow();
      });
    });
  });

  describe('Performance Metrics Assertions', () => {
    test('should validate correct performance metrics structure', () => {
      const validMetrics = fixtures.performanceBenchmarks.arcA770Performance();

      expect(() =>
        TestAssertions.assertValidPerformanceMetrics(validMetrics),
      ).not.toThrow();
    });

    test('should reject invalid performance metrics structures', () => {
      const invalidMetrics = [
        {}, // Missing all properties
        { processingTime: -1 }, // Negative value
        {
          processingTime: 100,
          memoryUsage: 'high', // Wrong type
          powerConsumption: 50,
          throughput: 60,
        },
        {
          processingTime: 0, // Zero value
          memoryUsage: 1024,
          powerConsumption: 50,
          throughput: 60,
        },
      ];

      invalidMetrics.forEach((metrics) => {
        expect(() =>
          TestAssertions.assertValidPerformanceMetrics(metrics),
        ).toThrow();
      });
    });
  });
});

describe('Timeout Test Utility', () => {
  test('should execute test within timeout', async () => {
    const fastTest = createTimeoutTest(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }, 100);

    await expect(fastTest()).resolves.not.toThrow();
  });

  test('should timeout slow tests', async () => {
    const slowTest = createTimeoutTest(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }, 50);

    await expect(slowTest()).rejects.toThrow('Test timed out after 50ms');
  });

  test('should handle test errors within timeout', async () => {
    const errorTest = createTimeoutTest(async () => {
      throw new Error('Test error');
    }, 100);

    await expect(errorTest()).rejects.toThrow('Test error');
  });
});
