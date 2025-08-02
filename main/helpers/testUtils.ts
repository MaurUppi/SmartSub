/**
 * Test Utilities for Intel OpenVINO GPU Acceleration Integration
 * 
 * This module provides comprehensive testing utilities for:
 * - Mock system validation
 * - Performance testing
 * - Integration testing
 * - Hardware simulation verification
 */

import { GPUDevice, OpenVINOCapabilities, mockSystem } from './developmentMockSystem';
import { logMessage as logger } from './logger';

export interface TestEnvironment {
  name: string;
  description: string;
  mockDevices: GPUDevice[];
  openvinoCapabilities: OpenVINOCapabilities;
  environmentVariables: Record<string, string>;
}

export interface PerformanceTestResult {
  testName: string;
  deviceId: string;
  processingTime: number;
  memoryUsage: number;
  powerConsumption: number;
  throughput: number;
  timestamp: Date;
  success: boolean;
  error?: string;
}

export interface TestScenario {
  name: string;
  description: string;
  expectedDeviceCount: number;
  expectedOpenVINOCompatibility: boolean;
  expectedErrors?: string[];
}

/**
 * Test utilities class for OpenVINO integration testing
 */
export class TestUtils {
  private static instance: TestUtils;
  private testResults: PerformanceTestResult[] = [];
  private currentTestEnvironment?: TestEnvironment;

  private constructor() {}

  public static getInstance(): TestUtils {
    if (!TestUtils.instance) {
      TestUtils.instance = new TestUtils();
    }
    return TestUtils.instance;
  }

  /**
   * Set up test environment with specific configuration
   */
  public async setupTestEnvironment(environment: TestEnvironment): Promise<void> {
    logger.info(`Setting up test environment: ${environment.name}`);
    
    // Store current environment
    this.currentTestEnvironment = environment;
    
    // Configure environment variables
    for (const [key, value] of Object.entries(environment.environmentVariables)) {
      process.env[key] = value;
    }
    
    // Configure mock system
    await mockSystem.initialize({
      mockIntelGPUs: true,
      simulateOpenVINO: true,
      enablePerformanceSimulation: true,
      mockNetworkDelay: 50, // Faster for testing
      forceErrors: false,
      customGPUDevices: environment.mockDevices,
    });
    
    logger.info(`Test environment "${environment.name}" configured successfully`);
  }

  /**
   * Clean up test environment
   */
  public async cleanupTestEnvironment(): Promise<void> {
    if (this.currentTestEnvironment) {
      logger.info(`Cleaning up test environment: ${this.currentTestEnvironment.name}`);
      
      // Reset environment variables
      for (const key of Object.keys(this.currentTestEnvironment.environmentVariables)) {
        delete process.env[key];
      }
      
      // Reset mock system
      mockSystem.reset();
      
      this.currentTestEnvironment = undefined;
      logger.info('Test environment cleaned up');
    }
  }

  /**
   * Create test scenario for specific use case
   */
  public createTestScenario(name: string, config: Partial<TestScenario>): TestScenario {
    const defaultScenario: TestScenario = {
      name,
      description: `Test scenario: ${name}`,
      expectedDeviceCount: 1,
      expectedOpenVINOCompatibility: true,
      ...config,
    };
    
    return defaultScenario;
  }

  /**
   * Validate test scenario against current environment
   */
  public async validateTestScenario(scenario: TestScenario): Promise<boolean> {
    try {
      logger.info(`Validating test scenario: ${scenario.name}`);
      
      // Test GPU device enumeration
      const devices = await mockSystem.enumerateGPUDevices();
      if (devices.length !== scenario.expectedDeviceCount) {
        logger.error(`Device count mismatch. Expected: ${scenario.expectedDeviceCount}, Got: ${devices.length}`);
        return false;
      }
      
      // Test OpenVINO capabilities
      const capabilities = await mockSystem.getOpenVINOCapabilities();
      if (capabilities.isInstalled !== scenario.expectedOpenVINOCompatibility) {
        logger.error(`OpenVINO compatibility mismatch. Expected: ${scenario.expectedOpenVINOCompatibility}, Got: ${capabilities.isInstalled}`);
        return false;
      }
      
      // Validate device capabilities
      for (const device of devices) {
        if (!device.capabilities.openvinoCompatible && scenario.expectedOpenVINOCompatibility) {
          logger.error(`Device ${device.name} is not OpenVINO compatible but should be`);
          return false;
        }
      }
      
      logger.info(`Test scenario "${scenario.name}" validated successfully`);
      return true;
    } catch (error) {
      logger.error(`Test scenario validation failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Run performance test on specified device
   */
  public async runPerformanceTest(deviceId: string, testName: string): Promise<PerformanceTestResult> {
    const startTime = Date.now();
    
    try {
      logger.info(`Running performance test "${testName}" on device: ${deviceId}`);
      
      const metrics = await mockSystem.simulatePerformanceBenchmark(deviceId);
      
      const result: PerformanceTestResult = {
        testName,
        deviceId,
        processingTime: metrics.processingTime,
        memoryUsage: metrics.memoryUsage,
        powerConsumption: metrics.powerConsumption,
        throughput: metrics.throughput,
        timestamp: new Date(),
        success: true,
      };
      
      this.testResults.push(result);
      logger.info(`Performance test "${testName}" completed successfully`);
      
      return result;
    } catch (error) {
      const result: PerformanceTestResult = {
        testName,
        deviceId,
        processingTime: 0,
        memoryUsage: 0,
        powerConsumption: 0,
        throughput: 0,
        timestamp: new Date(),
        success: false,
        error: error.message,
      };
      
      this.testResults.push(result);
      logger.error(`Performance test "${testName}" failed: ${error.message}`);
      
      return result;
    }
  }

  /**
   * Run comprehensive test suite
   */
  public async runTestSuite(scenarios: TestScenario[]): Promise<{
    passed: number;
    failed: number;
    results: Array<{ scenario: string; success: boolean; error?: string }>;
  }> {
    const results = [];
    let passed = 0;
    let failed = 0;
    
    logger.info(`Running test suite with ${scenarios.length} scenarios`);
    
    for (const scenario of scenarios) {
      try {
        const success = await this.validateTestScenario(scenario);
        
        results.push({
          scenario: scenario.name,
          success,
        });
        
        if (success) {
          passed++;
        } else {
          failed++;
        }
      } catch (error) {
        results.push({
          scenario: scenario.name,
          success: false,
          error: error.message,
        });
        failed++;
      }
    }
    
    logger.info(`Test suite completed. Passed: ${passed}, Failed: ${failed}`);
    
    return { passed, failed, results };
  }

  /**
   * Get performance test results
   */
  public getPerformanceTestResults(): PerformanceTestResult[] {
    return [...this.testResults];
  }

  /**
   * Clear test results
   */
  public clearTestResults(): void {
    this.testResults = [];
    logger.info('Test results cleared');
  }

  /**
   * Assert condition with custom message
   */
  public assert(condition: boolean, message: string): void {
    if (!condition) {
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  /**
   * Assert deep equality
   */
  public assertEqual<T>(actual: T, expected: T, message?: string): void {
    const actualStr = JSON.stringify(actual);
    const expectedStr = JSON.stringify(expected);
    
    if (actualStr !== expectedStr) {
      const errorMessage = message || `Expected ${expectedStr}, but got ${actualStr}`;
      throw new Error(`Assertion failed: ${errorMessage}`);
    }
  }

  /**
   * Assert that async function throws error
   */
  public async assertThrows(fn: () => Promise<any>, expectedError?: string): Promise<void> {
    try {
      await fn();
      throw new Error('Expected function to throw, but it did not');
    } catch (error) {
      if (expectedError && !error.message.includes(expectedError)) {
        throw new Error(`Expected error containing "${expectedError}", but got "${error.message}"`);
      }
    }
  }

  /**
   * Mock delay for timing tests
   */
  public async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate test report
   */
  public generateTestReport(): string {
    const report = [
      '=== OpenVINO Integration Test Report ===',
      `Generated: ${new Date().toISOString()}`,
      '',
      `Total Performance Tests: ${this.testResults.length}`,
      `Successful Tests: ${this.testResults.filter(r => r.success).length}`,
      `Failed Tests: ${this.testResults.filter(r => !r.success).length}`,
      '',
      'Performance Test Results:',
      ...this.testResults.map(result => 
        `- ${result.testName} (${result.deviceId}): ${result.success ? 'PASS' : 'FAIL'}` +
        (result.error ? ` - ${result.error}` : '')
      ),
      '',
      'Current Environment:',
      this.currentTestEnvironment ? 
        `- Name: ${this.currentTestEnvironment.name}` : '- No environment active',
      '',
      'Mock System Status:',
      `- Mocking Enabled: ${mockSystem.isMockingEnabled()}`,
      `- Configuration: ${JSON.stringify(mockSystem.getConfiguration(), null, 2)}`,
    ];
    
    return report.join('\n');
  }
}

// Export singleton instance
export const testUtils = TestUtils.getInstance();

// Predefined test environments
export const predefinedTestEnvironments = {
  /**
   * macOS development environment with Intel Arc GPUs
   */
  macOSWithIntelArc: (): TestEnvironment => ({
    name: 'macOS-Intel-Arc',
    description: 'macOS development with Intel Arc GPU simulation',
    mockDevices: [
      {
        id: 'mock-intel-arc-a770',
        name: 'Intel Arc A770',
        type: 'discrete',
        vendor: 'intel',
        deviceId: '56A0',
        priority: 8,
        driverVersion: '31.0.101.4887',
        memory: 16384,
        capabilities: {
          openvinoCompatible: true,
          cudaCompatible: false,
          coremlCompatible: false,
        },
        powerEfficiency: 'good',
        performance: 'high',
      }
    ],
    openvinoCapabilities: {
      isInstalled: true,
      version: '2024.6.0',
      supportedDevices: ['mock-intel-arc-a770'],
      runtimePath: '/opt/intel/openvino_2024/runtime',
      modelFormats: ['ONNX', 'TensorFlow', 'PyTorch', 'OpenVINO IR'],
    },
    environmentVariables: {
      NODE_ENV: 'development',
      FORCE_MOCK_INTEL_GPU: 'true',
    },
  }),

  /**
   * Multiple Intel GPU environment
   */
  multipleIntelGPUs: (): TestEnvironment => ({
    name: 'Multiple-Intel-GPUs',
    description: 'Environment with multiple Intel GPU devices',
    mockDevices: [
      {
        id: 'mock-intel-arc-a770',
        name: 'Intel Arc A770',
        type: 'discrete',
        vendor: 'intel',
        deviceId: '56A0',
        priority: 8,
        driverVersion: '31.0.101.4887',
        memory: 16384,
        capabilities: {
          openvinoCompatible: true,
          cudaCompatible: false,
          coremlCompatible: false,
        },
        powerEfficiency: 'good',
        performance: 'high',
      },
      {
        id: 'mock-intel-xe-graphics',
        name: 'Intel Core Ultra Processors with Intel Arc Graphics.(Integrated graphic unit)',
        type: 'integrated',
        vendor: 'intel',
        deviceId: '9A49',
        priority: 5,
        driverVersion: '31.0.101.4887',
        memory: 'shared',
        capabilities: {
          openvinoCompatible: true,
          cudaCompatible: false,
          coremlCompatible: false,
        },
        powerEfficiency: 'excellent',
        performance: 'medium',
      }
    ],
    openvinoCapabilities: {
      isInstalled: true,
      version: '2024.6.0',
      supportedDevices: ['mock-intel-arc-a770', 'mock-intel-xe-graphics'],
      runtimePath: '/opt/intel/openvino_2024/runtime',
      modelFormats: ['ONNX', 'TensorFlow', 'PyTorch', 'OpenVINO IR'],
    },
    environmentVariables: {
      NODE_ENV: 'development',
      FORCE_MOCK_INTEL_GPU: 'true',
    },
  }),

  /**
   * Error simulation environment
   */
  errorSimulation: (): TestEnvironment => ({
    name: 'Error-Simulation',
    description: 'Environment for testing error handling',
    mockDevices: [],
    openvinoCapabilities: {
      isInstalled: false,
      version: '',
      supportedDevices: [],
      modelFormats: [],
    },
    environmentVariables: {
      NODE_ENV: 'development',
      FORCE_MOCK_INTEL_GPU: 'true',
      SIMULATE_GPU_ERRORS: 'true',
    },
  }),

  /**
   * Production-like environment
   */
  productionLike: (): TestEnvironment => ({
    name: 'Production-Like',
    description: 'Production-like environment without mocking',
    mockDevices: [],
    openvinoCapabilities: {
      isInstalled: false,
      version: '',
      supportedDevices: [],
      modelFormats: [],
    },
    environmentVariables: {
      NODE_ENV: 'production',
    },
  }),
};

// Predefined test scenarios
export const predefinedTestScenarios = {
  singleIntelGPU: (): TestScenario => ({
    name: 'Single Intel GPU Detection',
    description: 'Test detection of single Intel GPU device',
    expectedDeviceCount: 1,
    expectedOpenVINOCompatibility: true,
  }),

  multipleIntelGPUs: (): TestScenario => ({
    name: 'Multiple Intel GPU Detection',
    description: 'Test detection of multiple Intel GPU devices',
    expectedDeviceCount: 2,
    expectedOpenVINOCompatibility: true,
  }),

  noIntelGPUs: (): TestScenario => ({
    name: 'No Intel GPU Detection',
    description: 'Test behavior when no Intel GPUs are present',
    expectedDeviceCount: 0,
    expectedOpenVINOCompatibility: false,
  }),

  openvinoNotInstalled: (): TestScenario => ({
    name: 'OpenVINO Not Installed',
    description: 'Test behavior when OpenVINO is not installed',
    expectedDeviceCount: 0,
    expectedOpenVINOCompatibility: false,
  }),
};