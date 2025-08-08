/**
 * Hardware Detection System for Intel OpenVINO Integration
 *
 * This module provides comprehensive hardware detection capabilities for:
 * - Intel Core Ultra processors with integrated graphics
 * - Intel Arc discrete GPUs (A-series)
 * - Multi-GPU detection with priority ranking
 * - OpenVINO toolkit validation and compatibility
 * - Cross-platform support (Windows, Linux, macOS)
 */

import { platform } from 'os';
import {
  GPUDevice,
  GPUCapabilities,
  OpenVINOInfo,
  HardwareDetectionConfig,
  DetectionResult,
  GPUClassification,
  OpenVINOValidation,
  HardwareDetectionEvent,
} from '../../types/gpu';
import { logMessage as logger } from '../helpers/logger';
import { coreUltraDetector } from '../helpers/coreUltraDetection';
import { mockSystem } from '../helpers/developmentMockSystem';

// Import platform-specific detection modules
import { WindowsGPUDetector } from './windowsDetection';
import { LinuxGPUDetector } from './linuxDetection';
import { MacOSGPUDetector } from './macosDetection';
import { OpenVINODetector } from './openvinoDetection';
import { GPUClassifier } from './gpuClassification';

/**
 * Main Hardware Detection System
 * Coordinates platform-specific detection and provides unified interface
 */
export class HardwareDetectionSystem {
  private static instance: HardwareDetectionSystem;
  private config: HardwareDetectionConfig;
  private eventListeners: ((event: HardwareDetectionEvent) => void)[] = [];
  private cachedCapabilities?: GPUCapabilities;
  private lastDetectionTime: Date | null = null;

  private constructor(config?: Partial<HardwareDetectionConfig>) {
    this.config = {
      enableIntelGPU: true,
      enableNvidiaGPU: true,
      enableAppleGPU: true,
      enableOpenVINOValidation: true,
      timeoutMs: 10000,
      preferredGPUType: 'auto',
      enableMockMode: process.env.NODE_ENV === 'development',
      ...config,
    };
  }

  public static getInstance(
    config?: Partial<HardwareDetectionConfig>,
  ): HardwareDetectionSystem {
    if (!HardwareDetectionSystem.instance) {
      HardwareDetectionSystem.instance = new HardwareDetectionSystem(config);
    }
    return HardwareDetectionSystem.instance;
  }

  /**
   * Main detection method - coordinates all hardware detection
   */
  public async detectAvailableGPUs(): Promise<GPUCapabilities> {
    const startTime = Date.now();
    this.emitEvent('detection_start', { config: this.config });

    try {
      // Use mock system in development mode
      if (this.config.enableMockMode) {
        return await this.getMockCapabilities();
      }

      // Platform-specific detection
      const currentPlatform = platform() as 'win32' | 'linux' | 'darwin';
      const gpuDevices = await this.detectGPUsByPlatform(currentPlatform);

      // Filter and classify GPUs
      const intelGPUs = gpuDevices.filter((gpu) => gpu.vendor === 'intel');
      const nvidiaGPUs = gpuDevices.filter((gpu) => gpu.vendor === 'nvidia');
      const appleGPUs = gpuDevices.filter((gpu) => gpu.vendor === 'apple');

      // Detect Intel Core Ultra processors
      const coreUltraInfo = await coreUltraDetector.detect();

      // OpenVINO validation
      let openvinoInfo: OpenVINOInfo | null = null;
      if (this.config.enableOpenVINOValidation && intelGPUs.length > 0) {
        openvinoInfo = await this.detectOpenVINOSupport();
      }

      // Determine recommended GPU
      const recommendedGPU = this.selectRecommendedGPU([
        ...intelGPUs,
        ...nvidiaGPUs,
        ...appleGPUs,
      ]);

      const capabilities: GPUCapabilities = {
        totalGPUs: gpuDevices.length,
        intelGPUs: this.sortGPUsByPriority(intelGPUs),
        nvidiaGPUs: this.sortGPUsByPriority(nvidiaGPUs),
        appleGPUs: this.sortGPUsByPriority(appleGPUs),
        recommendedGPU,
        openvinoInfo,
        detectionTimestamp: new Date(),
        detectionPlatform: this.mapPlatformName(currentPlatform),
        detectionSuccess: true,
        detectionErrors: [],
      };

      this.cachedCapabilities = capabilities;
      this.lastDetectionTime = new Date();

      this.emitEvent('detection_complete', {
        capabilities,
        detectionTimeMs: Date.now() - startTime,
      });

      return capabilities;
    } catch (error) {
      const errorMsg = `Hardware detection failed: ${error}`;
      logger(errorMsg);

      this.emitEvent('error', { error: errorMsg });

      return {
        totalGPUs: 0,
        intelGPUs: [],
        nvidiaGPUs: [],
        appleGPUs: [],
        recommendedGPU: null,
        openvinoInfo: null,
        detectionTimestamp: new Date(),
        detectionPlatform: this.mapPlatformName(platform() as any),
        detectionSuccess: false,
        detectionErrors: [errorMsg],
      };
    }
  }

  /**
   * Enumerate Intel GPUs specifically
   */
  public async enumerateIntelGPUs(): Promise<GPUDevice[]> {
    const capabilities = await this.detectAvailableGPUs();
    return capabilities.intelGPUs;
  }

  /**
   * Check OpenVINO support and compatibility
   */
  public async checkOpenVINOSupport(): Promise<OpenVINOInfo | false> {
    if (this.config.enableMockMode) {
      return mockSystem.getOpenVINOCapabilities();
    }

    try {
      const detector = new OpenVINODetector();
      const result = await detector.detectOpenVINO();
      return result.success ? result.data : false;
    } catch (error) {
      logger(`OpenVINO detection failed: ${error}`);
      return false;
    }
  }

  /**
   * Validate GPU compatibility with specific model
   */
  public validateGPUCompatibility(gpu: GPUDevice, model: string): boolean {
    const classifier = new GPUClassifier();
    const validation = classifier.validateModelCompatibility(gpu, model);
    return validation.compatibilityScore >= 80; // 80% compatibility threshold
  }

  /**
   * Classify Intel GPU type and characteristics
   */
  public classifyIntelGPUType(gpuName: string): 'discrete' | 'integrated' {
    const classifier = new GPUClassifier();
    return classifier.classifyGPUType(gpuName);
  }

  /**
   * Get Intel GPU priority for ranking
   */
  public getIntelGPUPriority(gpuName: string): number {
    const classifier = new GPUClassifier();
    return classifier.calculateGPUPriority(gpuName);
  }

  /**
   * Validate OpenVINO version compatibility
   */
  public validateOpenVINOVersion(version: string): boolean {
    // OpenVINO 2024.6.0+ required per whisper.cpp documentation
    const minVersion = '2024.6.0';
    return this.compareVersions(version, minVersion) >= 0;
  }

  /**
   * Platform-specific GPU detection
   */
  private async detectGPUsByPlatform(
    currentPlatform: string,
  ): Promise<GPUDevice[]> {
    switch (currentPlatform) {
      case 'win32':
        const windowsDetector = new WindowsGPUDetector();
        const windowsResult = await windowsDetector.detectGPUs();
        return windowsResult.success ? windowsResult.data || [] : [];

      case 'linux':
        const linuxDetector = new LinuxGPUDetector();
        const linuxResult = await linuxDetector.detectGPUs();
        return linuxResult.success ? linuxResult.data || [] : [];

      case 'darwin':
        const macosDetector = new MacOSGPUDetector();
        const macosResult = await macosDetector.detectGPUs();
        return macosResult.success ? macosResult.data || [] : [];

      default:
        throw new Error(`Unsupported platform: ${currentPlatform}`);
    }
  }

  /**
   * Get mock capabilities for development
   */
  private async getMockCapabilities(): Promise<GPUCapabilities> {
    const mockDevices = await mockSystem.enumerateGPUDevices();
    const mockOpenVINO = mockSystem.getOpenVINOCapabilities();

    const intelGPUs = mockDevices.filter((gpu) => gpu.vendor === 'intel');
    const nvidiaGPUs = mockDevices.filter((gpu) => gpu.vendor === 'nvidia');
    const appleGPUs = mockDevices.filter((gpu) => gpu.vendor === 'apple');

    return {
      totalGPUs: mockDevices.length,
      intelGPUs: this.sortGPUsByPriority(intelGPUs),
      nvidiaGPUs: this.sortGPUsByPriority(nvidiaGPUs),
      appleGPUs: this.sortGPUsByPriority(appleGPUs),
      recommendedGPU: this.selectRecommendedGPU(mockDevices),
      openvinoInfo: mockOpenVINO,
      detectionTimestamp: new Date(),
      detectionPlatform: 'darwin', // Mock runs on macOS
      detectionSuccess: true,
      detectionErrors: [],
    };
  }

  /**
   * Select recommended GPU based on priority and performance
   */
  private selectRecommendedGPU(gpus: GPUDevice[]): GPUDevice | null {
    if (gpus.length === 0) return null;

    // Sort by priority (higher is better) and then by performance
    const sorted = gpus.sort((a, b) => {
      if (a.priority !== b.priority) return b.priority - a.priority;

      const perfOrder = { high: 3, medium: 2, low: 1 };
      return perfOrder[b.performance] - perfOrder[a.performance];
    });

    return sorted[0];
  }

  /**
   * Sort GPUs by priority and performance
   */
  private sortGPUsByPriority(gpus: GPUDevice[]): GPUDevice[] {
    return gpus.sort((a, b) => {
      if (a.priority !== b.priority) return b.priority - a.priority;

      const perfOrder = { high: 3, medium: 2, low: 1 };
      return perfOrder[b.performance] - perfOrder[a.performance];
    });
  }

  /**
   * Detect OpenVINO support
   */
  private async detectOpenVINOSupport(): Promise<OpenVINOInfo | null> {
    try {
      const detector = new OpenVINODetector();
      const result = await detector.detectOpenVINO();
      return result.success ? result.data : null;
    } catch (error) {
      logger(`OpenVINO detection error: ${error}`);
      return null;
    }
  }

  /**
   * Map platform names to standard format
   */
  private mapPlatformName(platform: string): 'windows' | 'linux' | 'darwin' {
    switch (platform) {
      case 'win32':
        return 'windows';
      case 'linux':
        return 'linux';
      case 'darwin':
        return 'darwin';
      default:
        return 'linux'; // Default fallback
    }
  }

  /**
   * Compare version strings
   */
  private compareVersions(version1: string, version2: string): number {
    const v1Parts = version1.split('.').map(Number);
    const v2Parts = version2.split('.').map(Number);

    const maxLength = Math.max(v1Parts.length, v2Parts.length);

    for (let i = 0; i < maxLength; i++) {
      const v1Part = v1Parts[i] || 0;
      const v2Part = v2Parts[i] || 0;

      if (v1Part !== v2Part) {
        return v1Part - v2Part;
      }
    }

    return 0;
  }

  /**
   * Event handling
   */
  public addEventListener(
    listener: (event: HardwareDetectionEvent) => void,
  ): void {
    this.eventListeners.push(listener);
  }

  public removeEventListener(
    listener: (event: HardwareDetectionEvent) => void,
  ): void {
    const index = this.eventListeners.indexOf(listener);
    if (index > -1) {
      this.eventListeners.splice(index, 1);
    }
  }

  private emitEvent(type: HardwareDetectionEvent['type'], data: any): void {
    const event: HardwareDetectionEvent = {
      type,
      timestamp: new Date(),
      data,
      message: `Hardware detection event: ${type}`,
    };

    this.eventListeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        logger(`Event listener error: ${error}`);
      }
    });
  }

  /**
   * Cache management
   */
  public clearCache(): void {
    this.cachedCapabilities = undefined;
    this.lastDetectionTime = null;
  }

  public getCachedCapabilities(): GPUCapabilities | null {
    return this.cachedCapabilities || null;
  }

  /**
   * Configuration management
   */
  public updateConfig(newConfig: Partial<HardwareDetectionConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.clearCache(); // Clear cache when config changes
  }

  public getConfig(): HardwareDetectionConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const hardwareDetector = HardwareDetectionSystem.getInstance();

// Export core functions for direct use
export async function detectAvailableGPUs(): Promise<GPUCapabilities> {
  return hardwareDetector.detectAvailableGPUs();
}

export async function enumerateIntelGPUs(): Promise<GPUDevice[]> {
  return hardwareDetector.enumerateIntelGPUs();
}

export async function checkOpenVINOSupport(): Promise<OpenVINOInfo | false> {
  return hardwareDetector.checkOpenVINOSupport();
}

export function validateGPUCompatibility(
  gpu: GPUDevice,
  model: string,
): boolean {
  return hardwareDetector.validateGPUCompatibility(gpu, model);
}

export function classifyIntelGPUType(
  gpuName: string,
): 'discrete' | 'integrated' {
  return hardwareDetector.classifyIntelGPUType(gpuName);
}

export function getIntelGPUPriority(gpuName: string): number {
  return hardwareDetector.getIntelGPUPriority(gpuName);
}

export function validateOpenVINOVersion(version: string): boolean {
  return hardwareDetector.validateOpenVINOVersion(version);
}
