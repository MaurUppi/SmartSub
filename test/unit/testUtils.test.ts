/**
 * Unit Tests for Test Utilities
 *
 * Comprehensive test suite for the testing infrastructure,
 * validating test utilities, environments, and scenarios.
 */

import {
  TestUtils,
  testUtils,
  predefinedTestEnvironments,
  predefinedTestScenarios,
  TestEnvironment,
  TestScenario,
  PerformanceTestResult,
} from '../../main/helpers/testUtils';

import { mockSystem } from '../../main/helpers/developmentMockSystem';
import { fixtures } from '../fixtures/mockGPUData';

describe('TestUtils', () => {
  afterEach(async () => {
    await testUtils.cleanupTestEnvironment();
    testUtils.clearTestResults();
    mockSystem.reset();
  });

  describe('Initialization', () => {
    test('should create singleton instance', () => {
      const instance1 = TestUtils.getInstance();
      const instance2 = TestUtils.getInstance();

      expect(instance1).toBe(instance2);
      expect(instance1).toBeInstanceOf(TestUtils);
    });
  });

  describe('Test Environment Management', () => {
    test('should setup test environment with macOS Intel Arc configuration', async () => {
      const environment = predefinedTestEnvironments.macOSWithIntelArc();

      await testUtils.setupTestEnvironment(environment);

      // Verify environment variables are set
      expect(process.env.NODE_ENV).toBe('development');
      expect(process.env.FORCE_MOCK_INTEL_GPU).toBe('true');

      // Verify mock system is configured
      expect(mockSystem.isMockingEnabled()).toBe(true);

      // Verify devices are available
      const devices = await mockSystem.enumerateGPUDevices();
      expect(devices).toHaveLength(1);
      expect(devices[0].name).toBe('Intel Arc A770');
    });

    test('should setup multiple Intel GPU environment', async () => {
      const environment = predefinedTestEnvironments.multipleIntelGPUs();

      await testUtils.setupTestEnvironment(environment);

      const devices = await mockSystem.enumerateGPUDevices();
      expect(devices).toHaveLength(2);

      const discreteGPU = devices.find((d) => d.type === 'discrete');
      const integratedGPU = devices.find((d) => d.type === 'integrated');

      expect(discreteGPU).toBeTruthy();
      expect(integratedGPU).toBeTruthy();
      expect(discreteGPU!.name).toBe('Intel Arc A770');
      expect(integratedGPU!.name).toBe(
        'Intel Core Ultra Processors with Intel Arc Graphics.(Integrated graphic unit)',
      );
    });

    test('should setup error simulation environment', async () => {
      const environment = predefinedTestEnvironments.errorSimulation();

      await testUtils.setupTestEnvironment(environment);

      expect(process.env.SIMULATE_GPU_ERRORS).toBe('true');

      const devices = await mockSystem.enumerateGPUDevices();
      expect(devices).toHaveLength(0); // Empty mockDevices from environment

      // With empty devices and simulateOpenVINO = true, but no devices available
      const capabilities = await mockSystem.getOpenVINOCapabilities();
      expect(capabilities.isInstalled).toBe(true); // Still installed, but no supported devices
      expect(capabilities.supportedDevices).toHaveLength(0);
    });

    test('should cleanup test environment properly', async () => {
      const originalNodeEnv = process.env.NODE_ENV;
      const environment = predefinedTestEnvironments.macOSWithIntelArc();

      await testUtils.setupTestEnvironment(environment);
      expect(process.env.NODE_ENV).toBe('development');

      await testUtils.cleanupTestEnvironment();
      expect(process.env.NODE_ENV).toBe(originalNodeEnv);
    });

    test('should handle production-like environment', async () => {
      const environment = predefinedTestEnvironments.productionLike();

      await testUtils.setupTestEnvironment(environment);

      expect(process.env.NODE_ENV).toBe('production');

      const devices = await mockSystem.enumerateGPUDevices();
      expect(devices).toHaveLength(0);
    });
  });

  describe('Test Scenario Management', () => {
    test('should create test scenario with defaults', () => {
      const scenario = testUtils.createTestScenario('Test Scenario');

      expect(scenario.name).toBe('Test Scenario');
      expect(scenario.description).toBe('Test scenario: Test Scenario');
      expect(scenario.expectedDeviceCount).toBe(1);
      expect(scenario.expectedOpenVINOCompatibility).toBe(true);
    });

    test('should create test scenario with custom configuration', () => {
      const scenario = testUtils.createTestScenario('Custom Scenario', {
        description: 'Custom test scenario',
        expectedDeviceCount: 3,
        expectedOpenVINOCompatibility: false,
        expectedErrors: ['error1', 'error2'],
      });

      expect(scenario.name).toBe('Custom Scenario');
      expect(scenario.description).toBe('Custom test scenario');
      expect(scenario.expectedDeviceCount).toBe(3);
      expect(scenario.expectedOpenVINOCompatibility).toBe(false);
      expect(scenario.expectedErrors).toEqual(['error1', 'error2']);
    });

    test('should validate single Intel GPU scenario', async () => {
      await testUtils.setupTestEnvironment(
        predefinedTestEnvironments.macOSWithIntelArc(),
      );

      const scenario = predefinedTestScenarios.singleIntelGPU();
      const isValid = await testUtils.validateTestScenario(scenario);

      expect(isValid).toBe(true);
    });

    test('should validate multiple Intel GPU scenario', async () => {
      await testUtils.setupTestEnvironment(
        predefinedTestEnvironments.multipleIntelGPUs(),
      );

      const scenario = predefinedTestScenarios.multipleIntelGPUs();
      const isValid = await testUtils.validateTestScenario(scenario);

      expect(isValid).toBe(true);
    });

    test('should fail validation when device count mismatch', async () => {
      await testUtils.setupTestEnvironment(
        predefinedTestEnvironments.macOSWithIntelArc(),
      );

      const scenario = predefinedTestScenarios.multipleIntelGPUs(); // Expects 2 devices
      const isValid = await testUtils.validateTestScenario(scenario);

      expect(isValid).toBe(false);
    });

    test('should fail validation when OpenVINO compatibility mismatch', async () => {
      await testUtils.setupTestEnvironment(
        predefinedTestEnvironments.errorSimulation(),
      );

      const scenario = predefinedTestScenarios.singleIntelGPU(); // Expects OpenVINO compatible
      const isValid = await testUtils.validateTestScenario(scenario);

      expect(isValid).toBe(false);
    });

    test('should validate no Intel GPU scenario', async () => {
      await testUtils.setupTestEnvironment(
        predefinedTestEnvironments.errorSimulation(),
      );

      const scenario = predefinedTestScenarios.noIntelGPUs();
      const isValid = await testUtils.validateTestScenario(scenario);

      // This should fail because errorSimulation still has OpenVINO installed (isInstalled: true)
      // but scenario expects no OpenVINO compatibility (expectedOpenVINOCompatibility: false)
      expect(isValid).toBe(false);
    });
  });

  describe('Performance Testing', () => {
    test('should run performance test on Intel Arc GPU', async () => {
      await testUtils.setupTestEnvironment(
        predefinedTestEnvironments.macOSWithIntelArc(),
      );

      const devices = await mockSystem.enumerateGPUDevices();
      const device = devices[0];

      const result = await testUtils.runPerformanceTest(
        device.id,
        'Arc A770 Performance Test',
      );

      expect(result.success).toBe(true);
      expect(result.testName).toBe('Arc A770 Performance Test');
      expect(result.deviceId).toBe(device.id);
      expect(result.processingTime).toBeGreaterThan(0);
      expect(result.memoryUsage).toBeGreaterThan(0);
      expect(result.powerConsumption).toBeGreaterThan(0);
      expect(result.throughput).toBeGreaterThan(0);
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.error).toBeUndefined();
    });

    test('should handle performance test failure', async () => {
      await testUtils.setupTestEnvironment(
        predefinedTestEnvironments.macOSWithIntelArc(),
      );

      const result = await testUtils.runPerformanceTest(
        'non-existent-device',
        'Failure Test',
      );

      expect(result.success).toBe(false);
      expect(result.testName).toBe('Failure Test');
      expect(result.deviceId).toBe('non-existent-device');
      expect(result.processingTime).toBe(0);
      expect(result.error).toBeTruthy();
    });

    test('should store and retrieve performance test results', async () => {
      await testUtils.setupTestEnvironment(
        predefinedTestEnvironments.multipleIntelGPUs(),
      );

      const devices = await mockSystem.enumerateGPUDevices();

      await testUtils.runPerformanceTest(devices[0].id, 'Test 1');
      await testUtils.runPerformanceTest(devices[1].id, 'Test 2');

      const results = testUtils.getPerformanceTestResults();
      expect(results).toHaveLength(2);
      expect(results[0].testName).toBe('Test 1');
      expect(results[1].testName).toBe('Test 2');
    });

    test('should clear performance test results', async () => {
      await testUtils.setupTestEnvironment(
        predefinedTestEnvironments.macOSWithIntelArc(),
      );

      const devices = await mockSystem.enumerateGPUDevices();
      await testUtils.runPerformanceTest(devices[0].id, 'Test');

      expect(testUtils.getPerformanceTestResults()).toHaveLength(1);

      testUtils.clearTestResults();
      expect(testUtils.getPerformanceTestResults()).toHaveLength(0);
    });
  });

  describe('Test Suite Execution', () => {
    test('should run test suite with all scenarios passing', async () => {
      await testUtils.setupTestEnvironment(
        predefinedTestEnvironments.multipleIntelGPUs(),
      );

      const scenarios = [
        predefinedTestScenarios.multipleIntelGPUs(),
        testUtils.createTestScenario('Custom Scenario', {
          expectedDeviceCount: 2,
          expectedOpenVINOCompatibility: true,
        }),
      ];

      const results = await testUtils.runTestSuite(scenarios);

      expect(results.passed).toBe(2);
      expect(results.failed).toBe(0);
      expect(results.results).toHaveLength(2);
      expect(results.results[0].success).toBe(true);
      expect(results.results[1].success).toBe(true);
    });

    test('should run test suite with mixed results', async () => {
      await testUtils.setupTestEnvironment(
        predefinedTestEnvironments.macOSWithIntelArc(),
      );

      const scenarios = [
        predefinedTestScenarios.singleIntelGPU(), // Should pass
        predefinedTestScenarios.multipleIntelGPUs(), // Should fail (wrong device count)
        predefinedTestScenarios.noIntelGPUs(), // Should fail
      ];

      const results = await testUtils.runTestSuite(scenarios);

      expect(results.passed).toBe(1);
      expect(results.failed).toBe(2);
      expect(results.results).toHaveLength(3);
      expect(results.results[0].success).toBe(true);
      expect(results.results[1].success).toBe(false);
      expect(results.results[2].success).toBe(false);
    });

    test('should handle test suite with errors', async () => {
      await testUtils.setupTestEnvironment(
        predefinedTestEnvironments.errorSimulation(),
      );

      const scenarios = [
        predefinedTestScenarios.openvinoNotInstalled(),
        predefinedTestScenarios.noIntelGPUs(),
      ];

      const results = await testUtils.runTestSuite(scenarios);

      // Both scenarios expect OpenVINO not to be installed/compatible, but errorSimulation
      // environment still has OpenVINO installed (isInstalled: true), so both should fail
      expect(results.passed).toBe(0);
      expect(results.failed).toBe(2);
    });
  });

  describe('Assertion Utilities', () => {
    test('should pass valid assertions', () => {
      expect(() => testUtils.assert(true, 'Should pass')).not.toThrow();
      expect(() => testUtils.assertEqual(5, 5, 'Numbers equal')).not.toThrow();
      expect(() =>
        testUtils.assertEqual('test', 'test', 'Strings equal'),
      ).not.toThrow();
    });

    test('should fail invalid assertions', () => {
      expect(() => testUtils.assert(false, 'Should fail')).toThrow(
        'Assertion failed: Should fail',
      );
      expect(() => testUtils.assertEqual(5, 10, 'Numbers not equal')).toThrow(
        'Assertion failed: Numbers not equal',
      );
    });

    test('should assert function throws error', async () => {
      const throwingFunction = async () => {
        throw new Error('Test error');
      };

      await expect(
        testUtils.assertThrows(throwingFunction),
      ).resolves.not.toThrow();
      await expect(
        testUtils.assertThrows(throwingFunction, 'Test error'),
      ).resolves.not.toThrow();
    });

    test('should fail when function does not throw', async () => {
      const nonThrowingFunction = async () => {
        return 'success';
      };

      // assertThrows should throw an error when the function doesn't throw
      await expect(testUtils.assertThrows(nonThrowingFunction)).rejects.toThrow(
        'Expected function to throw, but it did not',
      );
    });

    test('should fail when error message does not match', async () => {
      const throwingFunction = async () => {
        throw new Error('Different error');
      };

      await expect(
        testUtils.assertThrows(throwingFunction, 'Expected error'),
      ).rejects.toThrow(
        'Expected error containing "Expected error", but got "Different error"',
      );
    });
  });

  describe('Utility Functions', () => {
    test('should provide delay functionality', async () => {
      const startTime = Date.now();
      await testUtils.delay(50);
      const endTime = Date.now();

      expect(endTime - startTime).toBeGreaterThanOrEqual(45); // Allow for small timing variance
    });

    test('should generate comprehensive test report', async () => {
      await testUtils.setupTestEnvironment(
        predefinedTestEnvironments.macOSWithIntelArc(),
      );

      const devices = await mockSystem.enumerateGPUDevices();
      await testUtils.runPerformanceTest(devices[0].id, 'Report Test');

      const report = testUtils.generateTestReport();

      expect(report).toContain('OpenVINO Integration Test Report');
      expect(report).toContain('Total Performance Tests: 1');
      expect(report).toContain('Successful Tests: 1');
      expect(report).toContain('Failed Tests: 0');
      expect(report).toContain('Report Test');
      expect(report).toContain('macOS-Intel-Arc');
      expect(report).toContain('Mocking Enabled: true');
    });

    test('should generate empty report when no tests run', () => {
      const report = testUtils.generateTestReport();

      expect(report).toContain('Total Performance Tests: 0');
      expect(report).toContain('Successful Tests: 0');
      expect(report).toContain('Failed Tests: 0');
      expect(report).toContain('No environment active');
    });
  });

  describe('Predefined Environments', () => {
    test('should provide macOS with Intel Arc environment', () => {
      const env = predefinedTestEnvironments.macOSWithIntelArc();

      expect(env.name).toBe('macOS-Intel-Arc');
      expect(env.mockDevices).toHaveLength(1);
      expect(env.mockDevices[0].name).toBe('Intel Arc A770');
      expect(env.openvinoCapabilities.isInstalled).toBe(true);
      expect(env.environmentVariables.NODE_ENV).toBe('development');
      expect(env.environmentVariables.FORCE_MOCK_INTEL_GPU).toBe('true');
    });

    test('should provide multiple Intel GPU environment', () => {
      const env = predefinedTestEnvironments.multipleIntelGPUs();

      expect(env.name).toBe('Multiple-Intel-GPUs');
      expect(env.mockDevices).toHaveLength(2);
      expect(env.mockDevices[0].type).toBe('discrete');
      expect(env.mockDevices[1].type).toBe('integrated');
    });

    test('should provide error simulation environment', () => {
      const env = predefinedTestEnvironments.errorSimulation();

      expect(env.name).toBe('Error-Simulation');
      expect(env.mockDevices).toHaveLength(0);
      expect(env.openvinoCapabilities.isInstalled).toBe(false);
      expect(env.environmentVariables.SIMULATE_GPU_ERRORS).toBe('true');
    });

    test('should provide production-like environment', () => {
      const env = predefinedTestEnvironments.productionLike();

      expect(env.name).toBe('Production-Like');
      expect(env.mockDevices).toHaveLength(0);
      expect(env.openvinoCapabilities.isInstalled).toBe(false);
      expect(env.environmentVariables.NODE_ENV).toBe('production');
    });
  });

  describe('Predefined Scenarios', () => {
    test('should provide single Intel GPU scenario', () => {
      const scenario = predefinedTestScenarios.singleIntelGPU();

      expect(scenario.name).toBe('Single Intel GPU Detection');
      expect(scenario.expectedDeviceCount).toBe(1);
      expect(scenario.expectedOpenVINOCompatibility).toBe(true);
    });

    test('should provide multiple Intel GPU scenario', () => {
      const scenario = predefinedTestScenarios.multipleIntelGPUs();

      expect(scenario.name).toBe('Multiple Intel GPU Detection');
      expect(scenario.expectedDeviceCount).toBe(2);
      expect(scenario.expectedOpenVINOCompatibility).toBe(true);
    });

    test('should provide no Intel GPU scenario', () => {
      const scenario = predefinedTestScenarios.noIntelGPUs();

      expect(scenario.name).toBe('No Intel GPU Detection');
      expect(scenario.expectedDeviceCount).toBe(0);
      expect(scenario.expectedOpenVINOCompatibility).toBe(false);
    });

    test('should provide OpenVINO not installed scenario', () => {
      const scenario = predefinedTestScenarios.openvinoNotInstalled();

      expect(scenario.name).toBe('OpenVINO Not Installed');
      expect(scenario.expectedDeviceCount).toBe(0);
      expect(scenario.expectedOpenVINOCompatibility).toBe(false);
    });
  });
});
