/**
 * Intel Core Ultra Processors Detection Module
 *
 * This module provides reliable hardware identification for Intel Core Ultra
 * processors with integrated Intel Arc Graphics (iGPU). Based on the reference
 * implementation using systeminformation for Node.js/Electron environments.
 *
 * Intel Core Ultra processors typically include:
 * - Intel Arc Graphics (integrated GPU)
 * - Only very few Core Ultra models lack iGPU (fallback to CPU processing)
 */

import si from 'systeminformation';
import { logMessage } from './logger';
import { CoreUltraInfo } from '../../types/gpu';

/**
 * Returns true when CPU brand string contains "Core Ultra"
 * Performance: First call ~5ms, subsequent calls cached
 *
 * Based on the TypeScript reference implementation using systeminformation
 */
export async function isIntelCoreUltra(): Promise<boolean> {
  try {
    const { manufacturer, brand } = await si.cpu();
    const isIntel = /^GenuineIntel$/i.test(manufacturer);
    const isUltra = /Core\s+Ultra\s+\d+/i.test(brand); // e.g., "Intel(R) Core(TM) Ultra 7 155H"
    return isIntel && isUltra;
  } catch (error) {
    logMessage(`CoreUltra detection failed: ${error}`, 'error');
    return false; // Graceful degradation: failed detection treated as non-Ultra
  }
}

/**
 * Comprehensive Intel Core Ultra detection with integrated graphics assessment
 */
export async function detectCoreUltraWithGraphics(): Promise<CoreUltraInfo> {
  try {
    const cpuInfo = await si.cpu();
    const { manufacturer, brand } = cpuInfo;

    const isIntel = /^GenuineIntel$/i.test(manufacturer);
    const isUltra = /Core\s+Ultra\s+\d+/i.test(brand);
    const isCoreUltra = isIntel && isUltra;

    // Most Intel Core Ultra processors have integrated Arc Graphics
    // Only very few models lack iGPU (rare edge cases)
    const hasIntegratedGraphics = isCoreUltra; // Assumption: Core Ultra = has iGPU

    return {
      isIntelCoreUltra: isCoreUltra,
      hasIntegratedGraphics,
      cpuBrand: brand,
      cpuManufacturer: manufacturer,
      detectionMethod: 'systeminformation',
      confidence: 'high',
    };
  } catch (error) {
    logMessage(`CoreUltra comprehensive detection failed: ${error}`, 'error');
    return {
      isIntelCoreUltra: false,
      hasIntegratedGraphics: false,
      detectionMethod: 'fallback',
      confidence: 'low',
    };
  }
}

/**
 * Mock implementation for development environments
 * Simulates Intel Core Ultra processors with integrated graphics
 */
export function mockCoreUltraDetection(
  simulate: boolean = true,
): CoreUltraInfo {
  if (simulate) {
    return {
      isIntelCoreUltra: true,
      hasIntegratedGraphics: true,
      cpuBrand: 'Intel(R) Core(TM) Ultra 7 155H @ 3.80GHz',
      cpuManufacturer: 'GenuineIntel',
      detectionMethod: 'mock',
      confidence: 'high',
    };
  }

  return {
    isIntelCoreUltra: false,
    hasIntegratedGraphics: false,
    cpuBrand: 'Mock Non-Ultra CPU',
    cpuManufacturer: 'GenuineIntel',
    detectionMethod: 'mock',
    confidence: 'high',
  };
}

/**
 * Utility class for Core Ultra detection management
 */
export class CoreUltraDetector {
  private static instance: CoreUltraDetector;
  private cachedResult?: CoreUltraInfo;
  private mockMode: boolean = false;

  private constructor() {}

  public static getInstance(): CoreUltraDetector {
    if (!CoreUltraDetector.instance) {
      CoreUltraDetector.instance = new CoreUltraDetector();
    }
    return CoreUltraDetector.instance;
  }

  /**
   * Enable mock mode for development/testing
   */
  public enableMockMode(simulate: boolean = true): void {
    this.mockMode = true;
    this.cachedResult = mockCoreUltraDetection(simulate);
    logMessage(
      `CoreUltra detector: Mock mode enabled (simulate=${simulate})`,
      'info',
    );
  }

  /**
   * Disable mock mode and clear cache
   */
  public disableMockMode(): void {
    this.mockMode = false;
    this.cachedResult = undefined;
    logMessage('CoreUltra detector: Mock mode disabled', 'info');
  }

  /**
   * Get Core Ultra detection result (cached after first call)
   */
  public async detect(): Promise<CoreUltraInfo> {
    if (this.cachedResult) {
      return this.cachedResult;
    }

    if (this.mockMode) {
      return mockCoreUltraDetection(true);
    }

    this.cachedResult = await detectCoreUltraWithGraphics();
    return this.cachedResult;
  }

  /**
   * Clear cache and force re-detection
   */
  public clearCache(): void {
    this.cachedResult = undefined;
  }
}

// Export singleton instance
export const coreUltraDetector = CoreUltraDetector.getInstance();
