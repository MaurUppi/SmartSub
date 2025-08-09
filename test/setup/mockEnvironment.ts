/**
 * Mock Environment Setup for OpenVINO Integration Testing
 *
 * This module provides comprehensive test environment setup for:
 * - Jest test configuration
 * - Mock system initialization
 * - Test fixtures management
 * - Global test utilities
 */

import {
  mockSystem,
  DevelopmentMockSystem,
} from '../../main/helpers/developmentMockSystem';
import {
  testUtils,
  TestUtils,
  predefinedTestEnvironments,
} from '../../main/helpers/testUtils';

// Global test configuration
declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveGPUDevice(deviceId: string): R;
      toBeOpenVINOCompatible(): R;
      toHavePerformanceMetrics(): R;
    }
  }
}

/**
 * Global setup for all OpenVINO integration tests
 */
export class MockEnvironmentSetup {
  private static instance: MockEnvironmentSetup;
  private isSetup: boolean = false;
  private originalEnv: Record<string, string | undefined> = {};

  private constructor() {}

  public static getInstance(): MockEnvironmentSetup {
    if (!MockEnvironmentSetup.instance) {
      MockEnvironmentSetup.instance = new MockEnvironmentSetup();
    }
    return MockEnvironmentSetup.instance;
  }

  /**
   * Set up global test environment
   */
  public async setupGlobalEnvironment(): Promise<void> {
    if (this.isSetup) {
      return;
    }

    console.log('Setting up OpenVINO integration test environment...');

    // Store original environment variables
    this.storeOriginalEnvironment();

    // Set up test environment variables
    this.setupTestEnvironmentVariables();

    // Initialize mock system for testing
    await this.initializeMockSystem();

    // Set up custom Jest matchers
    this.setupCustomMatchers();

    this.isSetup = true;
    console.log('OpenVINO integration test environment setup complete');
  }

  /**
   * Tear down global test environment
   */
  public async teardownGlobalEnvironment(): Promise<void> {
    if (!this.isSetup) {
      return;
    }

    console.log('Tearing down OpenVINO integration test environment...');

    // Restore original environment variables
    this.restoreOriginalEnvironment();

    // Reset mock system
    mockSystem.reset();

    // Clear test utilities
    testUtils.clearTestResults();

    this.isSetup = false;
    console.log('OpenVINO integration test environment teardown complete');
  }

  /**
   * Store original environment variables
   */
  private storeOriginalEnvironment(): void {
    const envVars = [
      'NODE_ENV',
      'FORCE_MOCK_INTEL_GPU',
      'SIMULATE_GPU_ERRORS',
      'OPENVINO_RUNTIME_PATH',
      'TEST_ENVIRONMENT',
    ];

    for (const envVar of envVars) {
      this.originalEnv[envVar] = process.env[envVar];
    }
  }

  /**
   * Restore original environment variables
   */
  private restoreOriginalEnvironment(): void {
    for (const [key, value] of Object.entries(this.originalEnv)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }

  /**
   * Set up test environment variables
   */
  private setupTestEnvironmentVariables(): void {
    process.env.NODE_ENV = 'test';
    process.env.FORCE_MOCK_INTEL_GPU = 'true';
    process.env.TEST_ENVIRONMENT = 'jest';
  }

  /**
   * Initialize mock system for testing
   */
  private async initializeMockSystem(): Promise<void> {
    await mockSystem.initialize({
      mockIntelGPUs: true,
      simulateOpenVINO: true,
      enablePerformanceSimulation: true,
      mockNetworkDelay: 10, // Fast for testing
      forceErrors: false,
    });
  }

  /**
   * Set up custom Jest matchers
   */
  private setupCustomMatchers(): void {
    expect.extend({
      toHaveGPUDevice(received: any[], deviceId: string) {
        const device = received.find((d: any) => d.id === deviceId);

        if (device) {
          return {
            message: () =>
              `Expected array not to contain GPU device with ID ${deviceId}`,
            pass: true,
          };
        } else {
          return {
            message: () =>
              `Expected array to contain GPU device with ID ${deviceId}`,
            pass: false,
          };
        }
      },

      toBeOpenVINOCompatible(received: any) {
        const isCompatible = received.capabilities?.openvinoCompatible === true;

        if (isCompatible) {
          return {
            message: () => `Expected device not to be OpenVINO compatible`,
            pass: true,
          };
        } else {
          return {
            message: () => `Expected device to be OpenVINO compatible`,
            pass: false,
          };
        }
      },

      toHavePerformanceMetrics(received: any) {
        const hasMetrics =
          received.processingTime !== undefined &&
          received.memoryUsage !== undefined &&
          received.powerConsumption !== undefined &&
          received.throughput !== undefined;

        if (hasMetrics) {
          return {
            message: () => `Expected object not to have performance metrics`,
            pass: true,
          };
        } else {
          return {
            message: () =>
              `Expected object to have performance metrics (processingTime, memoryUsage, powerConsumption, throughput)`,
            pass: false,
          };
        }
      },
    });
  }
}

/**
 * Test suite setup utilities
 */
export class TestSuiteSetup {
  /**
   * Set up test suite with specific environment
   */
  public static async setupTestSuite(
    environmentName: keyof typeof predefinedTestEnvironments,
  ): Promise<void> {
    const environment = predefinedTestEnvironments[environmentName]();
    await testUtils.setupTestEnvironment(environment);
  }

  /**
   * Clean up test suite
   */
  public static async cleanupTestSuite(): Promise<void> {
    await testUtils.cleanupTestEnvironment();
  }

  /**
   * Create isolated test context
   */
  public static createTestContext(name: string) {
    return {
      setup: async () => {
        console.log(`Setting up test context: ${name}`);
        // Test-specific setup can be added here
      },
      cleanup: async () => {
        console.log(`Cleaning up test context: ${name}`);
        // Test-specific cleanup can be added here
      },
    };
  }
}

/**
 * Mock data generators for testing
 */
export class MockDataGenerators {
  /**
   * Generate mock GPU device data
   */
  public static generateMockGPUDevice(overrides: any = {}): any {
    return {
      id: `mock-device-${Math.random().toString(36).substr(2, 9)}`,
      name: 'Mock Intel GPU',
      type: 'discrete',
      vendor: 'intel',
      deviceId: 'MOCK',
      priority: 5,
      driverVersion: '1.0.0',
      memory: 4096,
      capabilities: {
        openvinoCompatible: true,
        cudaCompatible: false,
        coremlCompatible: false,
      },
      powerEfficiency: 'good',
      performance: 'medium',
      ...overrides,
    };
  }

  /**
   * Generate mock OpenVINO capabilities
   */
  public static generateMockOpenVINOCapabilities(overrides: any = {}): any {
    return {
      isInstalled: true,
      version: '2024.6.0',
      supportedDevices: ['mock-device'],
      runtimePath: '/mock/openvino',
      modelFormats: ['ONNX'],
      ...overrides,
    };
  }

  /**
   * Generate mock performance metrics
   */
  public static generateMockPerformanceMetrics(overrides: any = {}): any {
    return {
      processingTime: 100 + Math.random() * 50, // 100-150ms
      memoryUsage: 1024 + Math.random() * 512, // 1024-1536MB
      powerConsumption: 50 + Math.random() * 30, // 50-80W
      throughput: 60 + Math.random() * 20, // 60-80 audio seconds per minute
      ...overrides,
    };
  }
}

/**
 * Test assertion helpers
 */
export class TestAssertions {
  /**
   * Assert GPU device has required properties
   */
  public static assertValidGPUDevice(device: any): void {
    expect(device).toHaveProperty('id');
    expect(device).toHaveProperty('name');
    expect(device).toHaveProperty('type');
    expect(device).toHaveProperty('vendor');
    expect(device).toHaveProperty('deviceId');
    expect(device).toHaveProperty('priority');
    expect(device).toHaveProperty('driverVersion');
    expect(device).toHaveProperty('memory');
    expect(device).toHaveProperty('capabilities');
    expect(device).toHaveProperty('powerEfficiency');
    expect(device).toHaveProperty('performance');

    // Validate capabilities object
    expect(device.capabilities).toHaveProperty('openvinoCompatible');
    expect(device.capabilities).toHaveProperty('cudaCompatible');
    expect(device.capabilities).toHaveProperty('coremlCompatible');

    // Validate enums
    expect(['discrete', 'integrated']).toContain(device.type);
    expect(['nvidia', 'intel', 'apple', 'amd']).toContain(device.vendor);
    expect(['excellent', 'good', 'moderate']).toContain(device.powerEfficiency);
    expect(['high', 'medium', 'low']).toContain(device.performance);
  }

  /**
   * Assert OpenVINO capabilities have required properties
   */
  public static assertValidOpenVINOCapabilities(capabilities: any): void {
    expect(capabilities).toHaveProperty('isInstalled');
    expect(capabilities).toHaveProperty('version');
    expect(capabilities).toHaveProperty('supportedDevices');
    expect(capabilities).toHaveProperty('modelFormats');

    expect(typeof capabilities.isInstalled).toBe('boolean');
    expect(typeof capabilities.version).toBe('string');
    expect(Array.isArray(capabilities.supportedDevices)).toBe(true);
    expect(Array.isArray(capabilities.modelFormats)).toBe(true);
  }

  /**
   * Assert performance metrics have required properties
   */
  public static assertValidPerformanceMetrics(metrics: any): void {
    expect(metrics).toHaveProperty('processingTime');
    expect(metrics).toHaveProperty('memoryUsage');
    expect(metrics).toHaveProperty('powerConsumption');
    expect(metrics).toHaveProperty('throughput');

    expect(typeof metrics.processingTime).toBe('number');
    expect(typeof metrics.memoryUsage).toBe('number');
    expect(typeof metrics.powerConsumption).toBe('number');
    expect(typeof metrics.throughput).toBe('number');

    expect(metrics.processingTime).toBeGreaterThan(0);
    expect(metrics.memoryUsage).toBeGreaterThan(0);
    expect(metrics.powerConsumption).toBeGreaterThan(0);
    expect(metrics.throughput).toBeGreaterThan(0);
  }
}

// Export singleton instance
export const mockEnvironmentSetup = MockEnvironmentSetup.getInstance();

// Alias for backward compatibility
export class MockEnvironment {
  private setupInstance: MockEnvironmentSetup;

  constructor() {
    this.setupInstance = MockEnvironmentSetup.getInstance();
  }

  async setup(): Promise<void> {
    return this.setupInstance.setupGlobalEnvironment();
  }

  async cleanup(): Promise<void> {
    return this.setupInstance.cleanupGlobalEnvironment();
  }
}

// Export test utilities for convenience
export { testUtils, mockSystem };

// Export predefined environments and scenarios
export {
  predefinedTestEnvironments,
  predefinedTestScenarios,
} from '../../main/helpers/testUtils';

// Global setup and teardown functions for Jest
export const globalSetup = async (): Promise<void> => {
  await mockEnvironmentSetup.setupGlobalEnvironment();
};

export const globalTeardown = async (): Promise<void> => {
  await mockEnvironmentSetup.teardownGlobalEnvironment();
};

// Common test setup for individual test files
export const commonTestSetup = {
  beforeEach: async () => {
    await testUtils.cleanupTestEnvironment();
  },

  afterEach: async () => {
    await testUtils.cleanupTestEnvironment();
  },
};

// Helper to create test with timeout
export const createTimeoutTest = (
  testFn: () => Promise<void>,
  timeoutMs: number = 10000,
) => {
  return () =>
    new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Test timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      testFn()
        .then(() => {
          clearTimeout(timeout);
          resolve();
        })
        .catch((error) => {
          clearTimeout(timeout);
          reject(error);
        });
    });
};
