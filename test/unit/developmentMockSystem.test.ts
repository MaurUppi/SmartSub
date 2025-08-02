/**
 * Unit Tests for Development Mock System
 * 
 * Comprehensive test suite for the Intel OpenVINO GPU mock system,
 * covering all functionality required for macOS development.
 */

import { 
  DevelopmentMockSystem, 
  mockSystem, 
  mockSystemUtils,
  GPUDevice,
  OpenVINOCapabilities,
  MockEnvironmentConfig 
} from '../../main/helpers/developmentMockSystem';

import { 
  TestSuiteSetup,
  MockDataGenerators,
  TestAssertions,
  createTimeoutTest 
} from '../setup/mockEnvironment';

import { fixtures } from '../fixtures/mockGPUData';

describe('DevelopmentMockSystem', () => {
  beforeEach(async () => {
    await TestSuiteSetup.setupTestSuite('macOSWithIntelArc');
  });

  afterEach(async () => {
    await TestSuiteSetup.cleanupTestSuite();
    mockSystem.reset();
  });

  describe('Initialization', () => {
    test('should initialize singleton instance correctly', () => {
      const instance1 = DevelopmentMockSystem.getInstance();
      const instance2 = DevelopmentMockSystem.getInstance();
      
      expect(instance1).toBe(instance2);
      expect(instance1).toBeInstanceOf(DevelopmentMockSystem);
    });

    test('should initialize with default configuration', async () => {
      await mockSystem.initialize();
      
      const config = mockSystem.getConfiguration();
      expect(config.mockIntelGPUs).toBe(true);
      expect(config.simulateOpenVINO).toBe(true);
      expect(config.enablePerformanceSimulation).toBe(true);
      expect(config.mockNetworkDelay).toBeGreaterThanOrEqual(0);
      expect(config.forceErrors).toBe(false);
    });

    test('should initialize with custom configuration', async () => {
      const customConfig: Partial<MockEnvironmentConfig> = {
        mockNetworkDelay: 0,
        forceErrors: true,
        enablePerformanceSimulation: false,
      };

      await mockSystem.initialize(customConfig);
      
      const config = mockSystem.getConfiguration();
      expect(config.mockNetworkDelay).toBe(0);
      expect(config.forceErrors).toBe(true);
      expect(config.enablePerformanceSimulation).toBe(false);
    });

    test('should not reinitialize if already initialized', async () => {
      await mockSystem.initialize();
      const config1 = mockSystem.getConfiguration();
      
      await mockSystem.initialize({ mockNetworkDelay: 500 });
      const config2 = mockSystem.getConfiguration();
      
      expect(config1).toEqual(config2);
    });

    test('should detect development environment correctly', () => {
      const originalNodeEnv = process.env.NODE_ENV;
      const originalPlatform = process.platform;
      
      try {
        process.env.NODE_ENV = 'development';
        Object.defineProperty(process, 'platform', { value: 'darwin' });
        
        expect(mockSystem.isMockingEnabled()).toBe(true);
      } finally {
        process.env.NODE_ENV = originalNodeEnv;
        Object.defineProperty(process, 'platform', { value: originalPlatform });
      }
    });
  });

  describe('GPU Device Enumeration', () => {
    test('should enumerate default Intel GPU devices', async () => {
      await mockSystem.initialize();
      
      const devices = await mockSystem.enumerateGPUDevices();
      
      expect(devices).toHaveLength(4); // Default mock devices
      expect(devices).toHaveGPUDevice('mock-intel-arc-a770');
      expect(devices).toHaveGPUDevice('mock-intel-arc-a750');
      expect(devices).toHaveGPUDevice('mock-intel-xe-graphics');
      expect(devices).toHaveGPUDevice('mock-intel-iris-xe-graphics');
      
      devices.forEach(device => {
        TestAssertions.assertValidGPUDevice(device);
        expect(device.vendor).toBe('intel');
        expect(device).toBeOpenVINOCompatible();
      });
    });

    test('should enumerate custom GPU devices', async () => {
      const customDevices = [
        fixtures.gpuDevices.arcA770(),
        fixtures.gpuDevices.xeGraphics(),
      ];

      await mockSystem.initialize({ customGPUDevices: customDevices });
      
      const devices = await mockSystem.enumerateGPUDevices();
      
      expect(devices).toHaveLength(2);
      expect(devices[0].name).toBe('Intel Arc A770 16GB');
      expect(devices[1].name).toBe('Intel Xe Graphics');
    });

    test('should return empty array when mocking disabled', async () => {
      const originalNodeEnv = process.env.NODE_ENV;
      
      try {
        process.env.NODE_ENV = 'production';
        await mockSystem.initialize();
        
        const devices = await mockSystem.enumerateGPUDevices();
        expect(devices).toHaveLength(0);
      } finally {
        process.env.NODE_ENV = originalNodeEnv;
      }
    });

    test('should simulate network delay during enumeration', createTimeoutTest(async () => {
      await mockSystem.initialize({ mockNetworkDelay: 100 });
      
      const startTime = Date.now();
      await mockSystem.enumerateGPUDevices();
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeGreaterThanOrEqual(50); // At least half the delay
    }));

    test('should throw error when forced error mode enabled', async () => {
      await mockSystem.initialize({ forceErrors: true });
      
      await expect(mockSystem.enumerateGPUDevices())
        .rejects.toThrow('Mock error: GPU enumeration failed');
    });
  });

  describe('OpenVINO Capabilities', () => {
    test('should return valid OpenVINO capabilities', async () => {
      await mockSystem.initialize();
      
      const capabilities = await mockSystem.getOpenVINOCapabilities();
      
      TestAssertions.assertValidOpenVINOCapabilities(capabilities);
      expect(capabilities.isInstalled).toBe(true);
      expect(capabilities.version).toBe('2024.6.0');
      expect(capabilities.supportedDevices).toContain('mock-intel-arc-a770');
      expect(capabilities.modelFormats).toContain('ONNX');
      expect(capabilities.runtimePath).toBeTruthy();
    });

    test('should return no capabilities when mocking disabled', async () => {
      await mockSystem.initialize({ simulateOpenVINO: false });
      
      const capabilities = await mockSystem.getOpenVINOCapabilities();
      
      expect(capabilities.isInstalled).toBe(false);
      expect(capabilities.version).toBe('');
      expect(capabilities.supportedDevices).toHaveLength(0);
      expect(capabilities.modelFormats).toHaveLength(0);
    });

    test('should include only compatible devices in supported list', async () => {
      const customDevices = [
        fixtures.gpuDevices.arcA770(), // OpenVINO compatible
        fixtures.gpuDevices.uhd630(),  // Not OpenVINO compatible
        fixtures.gpuDevices.xeGraphics(), // OpenVINO compatible
      ];

      await mockSystem.initialize({ customGPUDevices: customDevices });
      
      const capabilities = await mockSystem.getOpenVINOCapabilities();
      
      expect(capabilities.supportedDevices).toHaveLength(2);
      expect(capabilities.supportedDevices).toContain('intel-arc-a770-16gb');
      expect(capabilities.supportedDevices).toContain('intel-xe-graphics');
      expect(capabilities.supportedDevices).not.toContain('intel-uhd-graphics-630');
    });

    test('should throw error when forced error mode enabled', async () => {
      await mockSystem.initialize({ forceErrors: true });
      
      await expect(mockSystem.getOpenVINOCapabilities())
        .rejects.toThrow('Mock error: OpenVINO detection failed');
    });
  });

  describe('Performance Simulation', () => {
    test('should simulate performance benchmark for discrete GPU', async () => {
      await mockSystem.initialize();
      const devices = await mockSystem.enumerateGPUDevices();
      const discreteDevice = devices.find(d => d.type === 'discrete');
      
      expect(discreteDevice).toBeTruthy();
      
      const metrics = await mockSystem.simulatePerformanceBenchmark(discreteDevice!.id);
      
      TestAssertions.assertValidPerformanceMetrics(metrics);
      
      // Discrete GPU should have better performance characteristics
      expect(metrics.processingTime).toBeLessThan(200);
      expect(metrics.throughput).toBeGreaterThan(50);
    });

    test('should simulate performance benchmark for integrated GPU', async () => {
      await mockSystem.initialize();
      const devices = await mockSystem.enumerateGPUDevices();
      const integratedDevice = devices.find(d => d.type === 'integrated');
      
      expect(integratedDevice).toBeTruthy();
      
      const metrics = await mockSystem.simulatePerformanceBenchmark(integratedDevice!.id);
      
      TestAssertions.assertValidPerformanceMetrics(metrics);
      
      // Integrated GPU should have different performance characteristics
      expect(metrics.processingTime).toBeGreaterThan(200);
      expect(metrics.powerConsumption).toBeLessThan(50);
    });

    test('should add realistic performance variance', async () => {
      await mockSystem.initialize();
      const devices = await mockSystem.enumerateGPUDevices();
      const device = devices[0];
      
      const metrics1 = await mockSystem.simulatePerformanceBenchmark(device.id);
      const metrics2 = await mockSystem.simulatePerformanceBenchmark(device.id);
      
      // Results should be different due to variance
      expect(metrics1.processingTime).not.toBe(metrics2.processingTime);
      expect(metrics1.memoryUsage).not.toBe(metrics2.memoryUsage);
      
      // But should be within reasonable range (±10%)
      const variance = Math.abs(metrics1.processingTime - metrics2.processingTime) / metrics1.processingTime;
      expect(variance).toBeLessThan(0.2); // Less than 20% variance
    });

    test('should throw error for non-existent device', async () => {
      await mockSystem.initialize();
      
      await expect(mockSystem.simulatePerformanceBenchmark('non-existent-device'))
        .rejects.toThrow('Mock device not found: non-existent-device');
    });

    test('should respect performance simulation setting', async () => {
      await mockSystem.initialize({ enablePerformanceSimulation: false });
      const devices = await mockSystem.enumerateGPUDevices();
      
      const startTime = Date.now();
      await mockSystem.simulatePerformanceBenchmark(devices[0].id);
      const endTime = Date.now();
      
      // Should complete quickly when simulation disabled
      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  describe('Device Management', () => {
    test('should add custom mock device', async () => {
      await mockSystem.initialize();
      
      const customDevice = MockDataGenerators.generateMockGPUDevice({
        name: 'Custom Test GPU',
        id: 'custom-test-gpu',
      });
      
      mockSystem.addMockDevice(customDevice);
      
      const devices = await mockSystem.enumerateGPUDevices();
      expect(devices).toHaveGPUDevice('custom-test-gpu');
      
      const foundDevice = mockSystem.getMockDevice('custom-test-gpu');
      expect(foundDevice).toBeTruthy();
      expect(foundDevice!.name).toBe('Custom Test GPU');
    });

    test('should remove mock device', async () => {
      await mockSystem.initialize();
      
      const devices = await mockSystem.enumerateGPUDevices();
      const deviceToRemove = devices[0];
      
      const removed = mockSystem.removeMockDevice(deviceToRemove.id);
      expect(removed).toBe(true);
      
      const updatedDevices = await mockSystem.enumerateGPUDevices();
      expect(updatedDevices).not.toHaveGPUDevice(deviceToRemove.id);
    });

    test('should return false when removing non-existent device', () => {
      const removed = mockSystem.removeMockDevice('non-existent-device');
      expect(removed).toBe(false);
    });

    test('should get all mock devices', async () => {
      await mockSystem.initialize();
      
      const devices = mockSystem.getAllMockDevices();
      expect(devices).toHaveLength(4); // Default mock devices
      
      devices.forEach(device => {
        TestAssertions.assertValidGPUDevice(device);
      });
    });
  });

  describe('Configuration Management', () => {
    test('should update configuration', () => {
      const newConfig: Partial<MockEnvironmentConfig> = {
        mockNetworkDelay: 200,
        forceErrors: true,
      };
      
      mockSystem.configure(newConfig);
      
      const config = mockSystem.getConfiguration();
      expect(config.mockNetworkDelay).toBe(200);
      expect(config.forceErrors).toBe(true);
    });

    test('should reset to default configuration', async () => {
      mockSystem.configure({ mockNetworkDelay: 500, forceErrors: true });
      mockSystem.reset();
      
      const config = mockSystem.getConfiguration();
      expect(config.mockNetworkDelay).toBe(100); // Default value
      expect(config.forceErrors).toBe(false);
    });

    test('should preserve configuration after reset and reinitialize', async () => {
      await mockSystem.initialize({ mockNetworkDelay: 0 });
      mockSystem.reset();
      
      await mockSystem.initialize();
      const config = mockSystem.getConfiguration();
      expect(config.mockNetworkDelay).toBe(100); // Back to default
    });
  });

  describe('Environment Detection', () => {
    test('should enable mocking in development on macOS', () => {
      const originalNodeEnv = process.env.NODE_ENV;
      const originalPlatform = process.platform;
      
      try {
        process.env.NODE_ENV = 'development';
        Object.defineProperty(process, 'platform', { value: 'darwin' });
        
        expect(mockSystem.isMockingEnabled()).toBe(true);
      } finally {
        process.env.NODE_ENV = originalNodeEnv;
        Object.defineProperty(process, 'platform', { value: originalPlatform });
      }
    });

    test('should disable mocking in production', () => {
      const originalNodeEnv = process.env.NODE_ENV;
      
      try {
        process.env.NODE_ENV = 'production';
        mockSystem.reset(); // Reset to pick up new environment
        
        expect(mockSystem.isMockingEnabled()).toBe(false);
      } finally {
        process.env.NODE_ENV = originalNodeEnv;
      }
    });

    test('should enable mocking when forced via environment variable', () => {
      const originalForceFlag = process.env.FORCE_MOCK_INTEL_GPU;
      const originalNodeEnv = process.env.NODE_ENV;
      
      try {
        process.env.NODE_ENV = 'production';
        process.env.FORCE_MOCK_INTEL_GPU = 'true';
        mockSystem.reset(); // Reset to pick up new environment
        
        expect(mockSystem.isMockingEnabled()).toBe(true);
      } finally {
        process.env.FORCE_MOCK_INTEL_GPU = originalForceFlag;
        process.env.NODE_ENV = originalNodeEnv;
      }
    });
  });

  describe('Utility Functions', () => {
    test('mockSystemUtils.createTestDevice should create valid device', () => {
      const device = mockSystemUtils.createTestDevice();
      
      TestAssertions.assertValidGPUDevice(device);
      expect(device.id).toBe('test-device');
      expect(device.vendor).toBe('intel');
      expect(device.capabilities.openvinoCompatible).toBe(true);
    });

    test('mockSystemUtils.createTestDevice should apply overrides', () => {
      const device = mockSystemUtils.createTestDevice({
        name: 'Custom Test Device',
        type: 'integrated',
        memory: 8192,
      });
      
      expect(device.name).toBe('Custom Test Device');
      expect(device.type).toBe('integrated');
      expect(device.memory).toBe(8192);
      expect(device.id).toBe('test-device'); // Should keep default
    });

    test('mockSystemUtils.createTestOpenVINOCapabilities should create valid capabilities', () => {
      const capabilities = mockSystemUtils.createTestOpenVINOCapabilities();
      
      TestAssertions.assertValidOpenVINOCapabilities(capabilities);
      expect(capabilities.isInstalled).toBe(true);
      expect(capabilities.version).toBe('2024.6.0');
    });

    test('mockSystemUtils.createTestOpenVINOCapabilities should apply overrides', () => {
      const capabilities = mockSystemUtils.createTestOpenVINOCapabilities({
        version: '2023.3.0',
        isInstalled: false,
      });
      
      expect(capabilities.version).toBe('2023.3.0');
      expect(capabilities.isInstalled).toBe(false);
    });
  });
});