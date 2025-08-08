/**
 * Development Mock System for Intel OpenVINO GPU Acceleration
 *
 * This module provides comprehensive mocking capabilities for macOS development
 * environments where Intel Core Ultra processors with Intel Arc Graphics are not available. It simulates:
 * - Intel Core Ultra processor detection with integrated graphics
 * - Intel GPU detection and enumeration (discrete Arc A-series + integrated graphics)
 * - OpenVINO toolkit validation and compatibility
 * - Hardware capability reporting and performance characteristics simulation
 */

import { logMessage } from './logger';
import { platform } from 'os';
import { coreUltraDetector, CoreUltraInfo } from './coreUltraDetection';

// Core interfaces from design.md
export interface GPUDevice {
  id: string;
  name: string;
  type: 'discrete' | 'integrated';
  vendor: 'nvidia' | 'intel' | 'apple' | 'amd';
  deviceId: string;
  priority: number;
  driverVersion: string;
  memory: number | 'shared';
  capabilities: {
    openvinoCompatible: boolean;
    cudaCompatible: boolean;
    coremlCompatible: boolean;
  };
  powerEfficiency: 'excellent' | 'good' | 'moderate';
  performance: 'high' | 'medium' | 'low';
  detectionMethod: 'wmi' | 'lspci' | 'systeminformation' | 'mock';
  platformInfo?: {
    windowsDeviceId?: string;
    linuxPciId?: string;
    driverPath?: string;
    kernelModule?: string;
  };
}

export interface OpenVINOCapabilities {
  isInstalled: boolean;
  version: string;
  supportedDevices: string[];
  runtimePath: string;
  modelFormats: string[];
  validationStatus: 'valid' | 'invalid' | 'unknown';
  installationMethod: 'package' | 'manual' | 'conda' | 'unknown';
  detectionErrors?: string[];
}

export interface MockEnvironmentConfig {
  mockIntelGPUs: boolean;
  simulateOpenVINO: boolean;
  enablePerformanceSimulation: boolean;
  mockNetworkDelay: number;
  forceErrors: boolean;
  customGPUDevices?: GPUDevice[];
}

/**
 * Development mock system that provides realistic Intel GPU simulation
 * for macOS development environments
 */
export class DevelopmentMockSystem {
  private static instance: DevelopmentMockSystem;
  private config: MockEnvironmentConfig;
  private mockDevices: GPUDevice[] = [];
  private isInitialized: boolean = false;

  private constructor() {
    this.config = this.getDefaultConfig();
  }

  public static getInstance(): DevelopmentMockSystem {
    if (!DevelopmentMockSystem.instance) {
      DevelopmentMockSystem.instance = new DevelopmentMockSystem();
    }
    return DevelopmentMockSystem.instance;
  }

  /**
   * Initialize the mock system with optional configuration
   */
  public async initialize(
    config?: Partial<MockEnvironmentConfig>,
  ): Promise<void> {
    if (this.isInitialized) {
      logMessage('DevelopmentMockSystem already initialized', 'warning');
      return;
    }

    this.config = { ...this.config, ...config };

    // Only enable mocking in development environment on macOS
    const shouldMock = this.shouldEnableMocking();

    if (shouldMock) {
      await this.initializeMockDevices();
      logMessage(
        'DevelopmentMockSystem initialized with mock Intel GPU devices',
        'info',
      );
    } else {
      logMessage(
        'DevelopmentMockSystem initialized - production environment detected',
        'info',
      );
    }

    this.isInitialized = true;
  }

  /**
   * Check if mocking should be enabled based on environment
   */
  private shouldEnableMocking(): boolean {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isMacOS = platform() === 'darwin';
    const mockForced = process.env.FORCE_MOCK_INTEL_GPU === 'true';

    return (isDevelopment && isMacOS) || mockForced;
  }

  /**
   * Get default mock environment configuration
   */
  private getDefaultConfig(): MockEnvironmentConfig {
    return {
      mockIntelGPUs: true,
      simulateOpenVINO: true,
      enablePerformanceSimulation: true,
      mockNetworkDelay: 100, // ms
      forceErrors: false,
    };
  }

  /**
   * Initialize mock GPU devices with realistic Intel GPU characteristics
   */
  private async initializeMockDevices(): Promise<void> {
    if (this.config.customGPUDevices) {
      this.mockDevices = [...this.config.customGPUDevices];
    } else {
      this.mockDevices = this.createDefaultMockDevices();
    }

    // Simulate device detection delay
    if (this.config.mockNetworkDelay > 0) {
      await new Promise((resolve) =>
        setTimeout(resolve, this.config.mockNetworkDelay),
      );
    }
  }

  /**
   * Create realistic mock Intel GPU devices
   */
  private createDefaultMockDevices(): GPUDevice[] {
    return [
      {
        id: 'mock-intel-arc-a770',
        name: 'Intel Arc A770',
        type: 'discrete',
        vendor: 'intel',
        deviceId: '56A0',
        priority: 8,
        driverVersion: '31.0.101.4887',
        memory: 16384, // 16GB
        capabilities: {
          openvinoCompatible: true,
          cudaCompatible: false,
          coremlCompatible: false,
        },
        powerEfficiency: 'good',
        performance: 'high',
        detectionMethod: 'mock',
      },
      {
        id: 'mock-intel-arc-a750',
        name: 'Intel Arc A750',
        type: 'discrete',
        vendor: 'intel',
        deviceId: '56A1',
        priority: 7,
        driverVersion: '31.0.101.4887',
        memory: 8192, // 8GB
        capabilities: {
          openvinoCompatible: true,
          cudaCompatible: false,
          coremlCompatible: false,
        },
        powerEfficiency: 'good',
        performance: 'high',
        detectionMethod: 'mock',
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
        detectionMethod: 'mock',
      },
      {
        id: 'mock-intel-iris-xe',
        name: 'Intel Core Ultra Processors with Intel Arc Graphics.(Integrated graphic unit)',
        type: 'integrated',
        vendor: 'intel',
        deviceId: '9A60',
        priority: 6,
        driverVersion: '31.0.101.4887',
        memory: 'shared',
        capabilities: {
          openvinoCompatible: true,
          cudaCompatible: false,
          coremlCompatible: false,
        },
        powerEfficiency: 'excellent',
        performance: 'medium',
        detectionMethod: 'mock',
      },
    ];
  }

  /**
   * Mock GPU device enumeration
   */
  public async enumerateGPUDevices(): Promise<GPUDevice[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.shouldEnableMocking() || !this.config.mockIntelGPUs) {
      return [];
    }

    // Simulate error conditions if forced
    if (this.config.forceErrors) {
      throw new Error('Mock error: GPU enumeration failed');
    }

    // Simulate detection delay
    if (this.config.mockNetworkDelay > 0) {
      await new Promise((resolve) =>
        setTimeout(resolve, this.config.mockNetworkDelay / 2),
      );
    }

    logMessage(
      `Mock GPU enumeration found ${this.mockDevices.length} Intel GPU devices`,
      'info',
    );
    return [...this.mockDevices];
  }

  /**
   * Mock OpenVINO capabilities detection
   */
  public async getOpenVINOCapabilities(): Promise<OpenVINOCapabilities> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.shouldEnableMocking() || !this.config.simulateOpenVINO) {
      return {
        isInstalled: false,
        version: '',
        supportedDevices: [],
        runtimePath: '',
        modelFormats: [],
        validationStatus: 'unknown',
        installationMethod: 'unknown',
      };
    }

    // Simulate error conditions if forced
    if (this.config.forceErrors) {
      throw new Error('Mock error: OpenVINO detection failed');
    }

    // Simulate detection delay
    if (this.config.mockNetworkDelay > 0) {
      await new Promise((resolve) =>
        setTimeout(resolve, this.config.mockNetworkDelay),
      );
    }

    const capabilities: OpenVINOCapabilities = {
      isInstalled: true,
      version: '2024.6.0',
      supportedDevices: this.mockDevices
        .filter((device) => device.capabilities.openvinoCompatible)
        .map((device) => device.id),
      runtimePath: '/opt/intel/openvino_2024/runtime',
      modelFormats: ['ONNX', 'TensorFlow', 'PyTorch', 'OpenVINO IR'],
      validationStatus: 'valid',
      installationMethod: 'package',
    };

    logMessage(
      `Mock OpenVINO capabilities detected: ${JSON.stringify(capabilities)}`,
      'info',
    );
    return capabilities;
  }

  /**
   * Mock performance benchmark simulation
   */
  public async simulatePerformanceBenchmark(deviceId: string): Promise<{
    processingTime: number;
    memoryUsage: number;
    powerConsumption: number;
    throughput: number;
  }> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const device = this.mockDevices.find((d) => d.id === deviceId);
    if (!device) {
      throw new Error(`Mock device not found: ${deviceId}`);
    }

    // Simulate benchmark delay
    if (this.config.enablePerformanceSimulation) {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 1s benchmark
    }

    // Generate realistic performance metrics based on device characteristics
    const baseMetrics = this.getBasePerformanceMetrics(device);
    const variance = 0.1; // 10% variance

    return {
      processingTime:
        baseMetrics.processingTime * (1 + (Math.random() - 0.5) * variance),
      memoryUsage:
        baseMetrics.memoryUsage * (1 + (Math.random() - 0.5) * variance),
      powerConsumption:
        baseMetrics.powerConsumption * (1 + (Math.random() - 0.5) * variance),
      throughput:
        baseMetrics.throughput * (1 + (Math.random() - 0.5) * variance),
    };
  }

  /**
   * Get base performance metrics for device type
   */
  private getBasePerformanceMetrics(device: GPUDevice) {
    const metrics = {
      discrete: {
        processingTime: 150, // ms per audio second
        memoryUsage: 2048, // MB
        powerConsumption: 120, // watts
        throughput: 85, // audio seconds per minute
      },
      integrated: {
        processingTime: 300, // ms per audio second
        memoryUsage: 1024, // MB
        powerConsumption: 25, // watts
        throughput: 45, // audio seconds per minute
      },
    };

    return metrics[device.type];
  }

  /**
   * Configure mock environment
   */
  public configure(config: Partial<MockEnvironmentConfig>): void {
    this.config = { ...this.config, ...config };
    logMessage(
      `DevelopmentMockSystem configuration updated: ${JSON.stringify(config)}`,
      'info',
    );
  }

  /**
   * Reset mock system to defaults
   */
  public reset(): void {
    this.config = this.getDefaultConfig();
    this.mockDevices = [];
    this.isInitialized = false;
    logMessage('DevelopmentMockSystem reset to defaults', 'info');
  }

  /**
   * Get current configuration
   */
  public getConfiguration(): MockEnvironmentConfig {
    return { ...this.config };
  }

  /**
   * Check if mock system is active
   */
  public isMockingEnabled(): boolean {
    return this.shouldEnableMocking() && this.config.mockIntelGPUs;
  }

  /**
   * Add custom mock device
   */
  public addMockDevice(device: GPUDevice): void {
    this.mockDevices.push(device);
    logMessage(`Added custom mock device: ${device.name}`, 'info');
  }

  /**
   * Remove mock device
   */
  public removeMockDevice(deviceId: string): boolean {
    const index = this.mockDevices.findIndex(
      (device) => device.id === deviceId,
    );
    if (index >= 0) {
      const removed = this.mockDevices.splice(index, 1)[0];
      logMessage(`Removed mock device: ${removed.name}`, 'info');
      return true;
    }
    return false;
  }

  /**
   * Get mock device by ID
   */
  public getMockDevice(deviceId: string): GPUDevice | undefined {
    return this.mockDevices.find((device) => device.id === deviceId);
  }

  /**
   * Get all mock devices
   */
  public getAllMockDevices(): GPUDevice[] {
    return [...this.mockDevices];
  }
}

// Export singleton instance for convenience
export const mockSystem = DevelopmentMockSystem.getInstance();

// Export utility functions for testing
export const mockSystemUtils = {
  /**
   * Create a test mock device
   */
  createTestDevice(overrides?: Partial<GPUDevice>): GPUDevice {
    return {
      id: 'test-device',
      name: 'Test Intel GPU',
      type: 'discrete',
      vendor: 'intel',
      deviceId: 'TEST',
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
      detectionMethod: 'mock',
      ...overrides,
    };
  },

  /**
   * Create test OpenVINO capabilities
   */
  createTestOpenVINOCapabilities(
    overrides?: Partial<OpenVINOCapabilities>,
  ): OpenVINOCapabilities {
    return {
      isInstalled: true,
      version: '2024.6.0',
      supportedDevices: ['test-device'],
      runtimePath: '/test/openvino',
      modelFormats: ['ONNX'],
      validationStatus: 'valid',
      installationMethod: 'package',
      ...overrides,
    };
  },
};
