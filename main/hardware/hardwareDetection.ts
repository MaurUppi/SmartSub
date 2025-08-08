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
      // Return cached result if available and recent (less than 30 seconds old)
      if (this.cachedCapabilities && this.lastDetectionTime) {
        const cacheAge = Date.now() - this.lastDetectionTime.getTime();
        const cacheValidityMs = 30 * 1000; // 30 seconds

        if (cacheAge < cacheValidityMs) {
          logger('Returning cached GPU capabilities');
          // Return a deep copy to prevent timestamp mutation issues in tests
          return {
            ...this.cachedCapabilities,
            detectionTimestamp: this.lastDetectionTime, // Keep original timestamp
          };
        }
      }

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
        nvidia: nvidiaGPUs.length > 0,
        intel: this.sortGPUsByPriority(intelGPUs),
        amd: [],
        apple: appleGPUs.length > 0,
        openvinoVersion: openvinoInfo ? openvinoInfo.version : false,
        recommendedGPU,
        openvinoInfo,
        detectionTimestamp: new Date(),
        detectionPlatform: this.mapPlatformName(currentPlatform),
        detectionSuccess: true,
        detectionErrors: [],
        capabilities: {
          hasIntelGPU: intelGPUs.length > 0,
          hasNvidiaGPU: nvidiaGPUs.length > 0,
          hasAMDGPU: false,
          hasAppleGPU: appleGPUs.length > 0,
          hasOpenVINO: !!openvinoInfo,
        },
        // Backward compatibility arrays
        nvidiaGPUs: this.sortGPUsByPriority(nvidiaGPUs),
        appleGPUs: this.sortGPUsByPriority(appleGPUs),
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
        nvidia: false,
        intel: [],
        amd: [],
        apple: false,
        openvinoVersion: false,
        recommendedGPU: null,
        openvinoInfo: null,
        detectionTimestamp: new Date(),
        detectionPlatform: this.mapPlatformName(platform() as any),
        detectionSuccess: false,
        detectionErrors: [errorMsg],
        capabilities: {
          hasIntelGPU: false,
          hasNvidiaGPU: false,
          hasAMDGPU: false,
          hasAppleGPU: false,
          hasOpenVINO: false,
        },
      };
    }
  }

  /**
   * Enumerate Intel GPUs specifically
   */
  public async enumerateIntelGPUs(): Promise<GPUDevice[]> {
    const capabilities = await this.detectAvailableGPUs();
    return capabilities.intel;
  }

  /**
   * Check OpenVINO support and compatibility
   */
  public async checkOpenVINOSupport(): Promise<OpenVINOInfo | false> {
    if (this.config.enableMockMode) {
      const mockCapabilities = await mockSystem.getOpenVINOCapabilities();
      // Return false if OpenVINO is not installed in mock mode
      return mockCapabilities.isInstalled ? mockCapabilities : false;
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
    const mockOpenVINO = await mockSystem.getOpenVINOCapabilities();

    const intelGPUs = mockDevices.filter((gpu) => gpu.vendor === 'intel');
    const nvidiaGPUs = mockDevices.filter((gpu) => gpu.vendor === 'nvidia');
    const appleGPUs = mockDevices.filter((gpu) => gpu.vendor === 'apple');

    return {
      totalGPUs: mockDevices.length,
      nvidia: nvidiaGPUs.length > 0,
      intel: this.sortGPUsByPriority(intelGPUs),
      amd: [],
      apple: appleGPUs.length > 0,
      openvinoVersion: mockOpenVINO.isInstalled ? mockOpenVINO.version : false,
      recommendedGPU: this.selectRecommendedGPU(mockDevices),
      openvinoInfo: mockOpenVINO,
      detectionTimestamp: new Date(),
      detectionPlatform: 'darwin', // Mock runs on macOS
      detectionSuccess: true,
      detectionErrors: [],
      capabilities: {
        hasIntelGPU: intelGPUs.length > 0,
        hasNvidiaGPU: nvidiaGPUs.length > 0,
        hasAMDGPU: false,
        hasAppleGPU: appleGPUs.length > 0,
        hasOpenVINO: mockOpenVINO.isInstalled,
      },
      // Backward compatibility arrays
      nvidiaGPUs: this.sortGPUsByPriority(nvidiaGPUs),
      appleGPUs: this.sortGPUsByPriority(appleGPUs),
    };
  }

  /**
   * Select recommended GPU based on priority and performance with hybrid system handling
   */
  private selectRecommendedGPU(gpus: GPUDevice[]): GPUDevice | null {
    if (gpus.length === 0) return null;

    // Separate GPUs by vendor
    const nvidiaGPUs = gpus.filter((gpu) => gpu.vendor === 'nvidia');
    const intelGPUs = gpus.filter((gpu) => gpu.vendor === 'intel');
    const appleGPUs = gpus.filter((gpu) => gpu.vendor === 'apple');
    const amdGPUs = gpus.filter((gpu) => gpu.vendor === 'amd');

    // Edge case handling for hybrid systems

    // 1. Intel + NVIDIA hybrid systems: NVIDIA has priority
    // 2. Intel iGPU + NVIDIA dGPU on Windows: NVIDIA has priority
    if (nvidiaGPUs.length > 0 && intelGPUs.length > 0) {
      logger('Hybrid Intel + NVIDIA system detected: Prioritizing NVIDIA GPU');
      return this.selectBestFromVendor(nvidiaGPUs);
    }

    // 3. Multiple NVIDIA cards: Use integrated GPU by default (if available)
    if (nvidiaGPUs.length > 1) {
      const integratedNvidia = nvidiaGPUs.filter(
        (gpu) => gpu.type === 'integrated',
      );
      if (integratedNvidia.length > 0) {
        logger(
          'Multiple NVIDIA GPUs detected: Using integrated GPU by default',
        );
        return this.selectBestFromVendor(integratedNvidia);
      }
      // If no integrated NVIDIA, fall back to best discrete
      logger(
        'Multiple NVIDIA GPUs detected: No integrated found, using best discrete',
      );
      return this.selectBestFromVendor(nvidiaGPUs);
    }

    // Standard priority order: NVIDIA > Intel > Apple > AMD
    if (nvidiaGPUs.length > 0) {
      return this.selectBestFromVendor(nvidiaGPUs);
    }
    if (intelGPUs.length > 0) {
      return this.selectBestFromVendor(intelGPUs);
    }
    if (appleGPUs.length > 0) {
      return this.selectBestFromVendor(appleGPUs);
    }
    if (amdGPUs.length > 0) {
      return this.selectBestFromVendor(amdGPUs);
    }

    return null;
  }

  /**
   * Select best GPU from a specific vendor's GPUs
   */
  private selectBestFromVendor(gpus: GPUDevice[]): GPUDevice {
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
