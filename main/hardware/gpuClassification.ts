/**
 * GPU Classification System for Intel OpenVINO Integration
 *
 * This module provides comprehensive GPU classification capabilities:
 * - Intel GPU type detection (discrete vs integrated)
 * - Performance and power efficiency rating
 * - Priority ranking for multi-GPU scenarios
 * - Model compatibility validation
 */

import {
  GPUDevice,
  GPUClassification,
  OpenVINOValidation,
} from '../../types/gpu';
import { logMessage as logger } from '../helpers/logger';

export class GPUClassifier {
  private intelArcPatterns = [
    /Intel\s*Arc\s*A\d+/i,
    /Arc\s*A\d+/i,
    /Intel.*Arc.*Graphics/i,
  ];

  private intelCoreUltraPatterns = [
    /Intel\s*Core\s*Ultra.*Arc.*Graphics/i,
    /Core\s*Ultra.*Intel\s*Arc/i,
    /Intel\s*Core\s*Ultra.*Integrated.*graphic/i,
  ];

  private intelIntegratedPatterns = [
    /Intel.*Xe.*Graphics/i,
    /Intel.*Iris.*Xe/i,
    /Intel.*UHD.*Graphics/i,
    /Intel.*HD.*Graphics/i,
  ];

  /**
   * Classify GPU type (discrete vs integrated)
   */
  public classifyGPUType(gpuName: string): 'discrete' | 'integrated' {
    // Handle null/undefined input
    if (!gpuName) return 'integrated';

    // Intel Core Ultra integrated graphics (check first, most specific)
    if (this.intelCoreUltraPatterns.some((pattern) => pattern.test(gpuName))) {
      return 'integrated';
    }

    // Intel Arc A-series are discrete GPUs (but not Core Ultra integrated)
    if (
      this.intelArcPatterns.some((pattern) => pattern.test(gpuName)) &&
      !this.intelCoreUltraPatterns.some((pattern) => pattern.test(gpuName))
    ) {
      return 'discrete';
    }

    // Other Intel integrated graphics
    if (this.intelIntegratedPatterns.some((pattern) => pattern.test(gpuName))) {
      return 'integrated';
    }

    // Default classification logic
    const nameLower = gpuName.toLowerCase();

    // Check for discrete indicators (but exclude Core Ultra)
    if (nameLower.includes('arc') && !nameLower.includes('core ultra')) {
      return 'discrete';
    }

    if (
      nameLower.includes('integrated') ||
      nameLower.includes('xe') ||
      nameLower.includes('iris') ||
      nameLower.includes('core ultra')
    ) {
      return 'integrated';
    }

    // Conservative default
    return 'integrated';
  }

  /**
   * Calculate GPU priority for ranking (higher = better)
   */
  public calculateGPUPriority(gpuName: string): number {
    if (!gpuName) return 1;

    let priority = 0;
    const nameLower = gpuName.toLowerCase();

    // Intel Arc discrete GPUs get highest priority
    if (nameLower.includes('arc')) {
      priority += 50;

      // Specific Arc model priorities
      if (nameLower.includes('a770')) priority += 20;
      else if (nameLower.includes('a750')) priority += 18;
      else if (nameLower.includes('a580')) priority += 15;
      else if (nameLower.includes('a380')) priority += 12;
      else if (nameLower.includes('a310')) priority += 10;
    }

    // Intel Core Ultra integrated graphics
    if (this.intelCoreUltraPatterns.some((pattern) => pattern.test(gpuName))) {
      priority += 30;
    }

    // Other Intel integrated graphics
    if (nameLower.includes('xe')) {
      priority += 25;
    }

    if (nameLower.includes('iris')) {
      priority += 20;
      if (nameLower.includes('max')) priority += 5; // Iris Xe MAX
    }

    if (nameLower.includes('uhd')) {
      priority += 15;
    }

    if (nameLower.includes('hd')) {
      priority += 10;
    }

    // Memory-based priority adjustments
    if (nameLower.includes('16gb')) priority += 8;
    else if (nameLower.includes('12gb')) priority += 6;
    else if (nameLower.includes('8gb')) priority += 4;
    else if (nameLower.includes('4gb')) priority += 2;

    return Math.max(priority, 1); // Minimum priority of 1
  }

  /**
   * Determine performance class
   */
  public getPerformanceClass(gpuName: string): 'high' | 'medium' | 'low' {
    if (!gpuName) return 'low';

    const nameLower = gpuName.toLowerCase();

    // High performance: Arc A770, A750
    if (nameLower.includes('a770') || nameLower.includes('a750')) {
      return 'high';
    }

    // Medium performance: Arc A580, A380, Core Ultra integrated
    if (
      nameLower.includes('a580') ||
      nameLower.includes('a380') ||
      this.intelCoreUltraPatterns.some((pattern) => pattern.test(gpuName))
    ) {
      return 'medium';
    }

    // Medium performance: Iris Xe MAX
    if (nameLower.includes('iris') && nameLower.includes('max')) {
      return 'medium';
    }

    // Low performance: Basic integrated graphics
    if (nameLower.includes('uhd') || nameLower.includes('hd')) {
      return 'low';
    }

    // Default classification
    if (nameLower.includes('arc')) {
      return 'medium'; // Conservative for unknown Arc models
    }

    return 'low'; // Conservative default
  }

  /**
   * Determine power efficiency class
   */
  public getPowerEfficiency(
    gpuName: string,
  ): 'excellent' | 'good' | 'moderate' {
    if (!gpuName) return 'good';

    const nameLower = gpuName.toLowerCase();

    // Excellent efficiency: Intel Core Ultra integrated graphics
    if (this.intelCoreUltraPatterns.some((pattern) => pattern.test(gpuName))) {
      return 'excellent';
    }

    // Excellent efficiency: Modern integrated graphics
    if (nameLower.includes('xe') || nameLower.includes('iris')) {
      return 'excellent';
    }

    // Good efficiency: Smaller Arc models
    if (nameLower.includes('a380') || nameLower.includes('a310')) {
      return 'good';
    }

    // Moderate efficiency: Larger Arc models
    if (
      nameLower.includes('a770') ||
      nameLower.includes('a750') ||
      nameLower.includes('a580')
    ) {
      return 'moderate';
    }

    // Good efficiency: Other integrated graphics
    if (nameLower.includes('uhd') || nameLower.includes('hd')) {
      return 'good';
    }

    return 'good'; // Conservative default
  }

  /**
   * Comprehensive GPU classification
   */
  public classifyGPU(gpuName: string): GPUClassification {
    const isIntelGPU = this.isIntelGPU(gpuName);
    const gpuType = this.classifyGPUType(gpuName);

    // Arc series detection: discrete Arc GPUs but NOT Core Ultra integrated
    const isArcSeries =
      this.intelArcPatterns.some((pattern) => pattern.test(gpuName)) &&
      !this.intelCoreUltraPatterns.some((pattern) => pattern.test(gpuName));

    return {
      isIntelGPU,
      isDiscreteGPU: gpuType === 'discrete',
      isIntegratedGPU: gpuType === 'integrated',
      isArcSeries,
      isCoreUltraIntegrated: this.intelCoreUltraPatterns.some((pattern) =>
        pattern.test(gpuName),
      ),
      priority: this.calculateGPUPriority(gpuName),
      performanceClass: this.getPerformanceClass(gpuName),
      powerClass: this.getPowerEfficiency(gpuName),
    };
  }

  /**
   * Validate model compatibility with GPU
   */
  public validateModelCompatibility(
    gpu: GPUDevice,
    model: string,
  ): OpenVINOValidation {
    const warnings: string[] = [];
    const errors: string[] = [];
    const recommendations: string[] = [];
    let compatibilityScore = 0;

    // Base compatibility for Intel GPUs
    if (gpu.vendor === 'intel' && gpu.capabilities.openvinoCompatible) {
      compatibilityScore += 40;
    } else if (gpu.vendor !== 'intel') {
      errors.push('Non-Intel GPU not supported for OpenVINO acceleration');
      return this.createValidationResult(false, 0, [], warnings, errors);
    }

    // OpenVINO compatibility check
    if (!gpu.capabilities.openvinoCompatible) {
      errors.push('GPU does not support OpenVINO acceleration');
      return this.createValidationResult(false, 0, [], warnings, errors);
    }

    // Model-specific validation
    const modelLower = model.toLowerCase();

    // Large models need more VRAM
    if (modelLower.includes('large') || modelLower.includes('medium')) {
      if (typeof gpu.memory === 'number' && gpu.memory >= 8192) {
        compatibilityScore += 30;
        recommendations.push('Sufficient VRAM for large model processing');
      } else if (typeof gpu.memory === 'number' && gpu.memory >= 4096) {
        compatibilityScore += 20;
        warnings.push('Limited VRAM may affect performance with large models');
      } else {
        compatibilityScore += 10;
        warnings.push('Low VRAM may cause issues with large models');
      }
    } else {
      // Small models are less demanding
      compatibilityScore += 25;
    }

    // GPU type specific validation
    if (gpu.type === 'discrete') {
      compatibilityScore += 20;
      recommendations.push('Discrete GPU provides optimal performance');
    } else {
      compatibilityScore += 15;
      if (
        this.intelCoreUltraPatterns.some((pattern) => pattern.test(gpu.name))
      ) {
        recommendations.push(
          'Intel Core Ultra integrated graphics provide good performance',
        );
      } else {
        warnings.push('Integrated graphics may have reduced performance');
      }
    }

    // Performance class validation
    switch (gpu.performance) {
      case 'high':
        compatibilityScore += 15;
        break;
      case 'medium':
        compatibilityScore += 10;
        break;
      case 'low':
        compatibilityScore += 5;
        warnings.push('GPU performance may be limited for this model');
        break;
    }

    // Driver version validation
    if (gpu.driverVersion && gpu.driverVersion !== 'unknown') {
      compatibilityScore += 5;
    } else {
      warnings.push('Driver version could not be detected');
    }

    const isValid = compatibilityScore >= 80 && errors.length === 0;

    return this.createValidationResult(
      isValid,
      Math.min(compatibilityScore, 100),
      recommendations,
      warnings,
      errors,
    );
  }

  /**
   * Check if GPU is Intel GPU
   */
  private isIntelGPU(gpuName: string): boolean {
    const nameLower = gpuName.toLowerCase();
    return (
      nameLower.includes('intel') ||
      nameLower.includes('arc') ||
      nameLower.includes('xe') ||
      nameLower.includes('iris')
    );
  }

  /**
   * Create validation result object
   */
  private createValidationResult(
    valid: boolean,
    score: number,
    recommendations: string[],
    warnings: string[],
    errors: string[],
  ): OpenVINOValidation {
    return {
      versionValid: true, // Handled separately
      deviceSupported: valid,
      runtimeAvailable: true, // Handled separately
      modelFormatSupported: true, // Assume ONNX support
      compatibilityScore: score,
      recommendations,
      warnings,
      errors,
    };
  }
}

// Export singleton instance
export const gpuClassifier = new GPUClassifier();
