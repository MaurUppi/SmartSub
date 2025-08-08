/**
 * macOS GPU Detection System
 *
 * This module provides macOS-specific GPU detection using:
 * - SystemInformation library
 * - System Profiler (system_profiler command)
 * - IOKit framework queries
 * - Mock system integration for development
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import si from 'systeminformation';

import { GPUDevice, DetectionResult } from '../../types/gpu';
import { logMessage as logger } from '../helpers/logger';
import { gpuClassifier } from './gpuClassification';
import { mockSystem } from '../helpers/developmentMockSystem';

const execAsync = promisify(exec);

export class MacOSGPUDetector {
  private readonly timeoutMs = 15000;

  /**
   * Main macOS GPU detection method
   */
  public async detectGPUs(): Promise<DetectionResult<GPUDevice[]>> {
    const startTime = Date.now();

    try {
      logger('Starting macOS GPU detection...');

      // In development mode, use mock system for Intel GPU simulation
      if (process.env.NODE_ENV === 'development') {
        logger('Using mock system for macOS development environment');
        return await this.getMockResults();
      }

      // Use multiple detection methods for real hardware
      const [siResults, profilerResults] = await Promise.allSettled([
        this.detectViaSystemInformation(),
        this.detectViaSystemProfiler(),
      ]);

      const allGPUs: GPUDevice[] = [];

      // Process SystemInformation results
      if (siResults.status === 'fulfilled' && siResults.value) {
        allGPUs.push(...siResults.value);
      }

      // Process System Profiler results
      if (profilerResults.status === 'fulfilled' && profilerResults.value) {
        const profilerGPUs = profilerResults.value;

        // Merge with SI data or add unique GPUs
        for (const profilerGPU of profilerGPUs) {
          const existingGPU = allGPUs.find(
            (gpu) => gpu.name === profilerGPU.name,
          );

          if (!existingGPU) {
            allGPUs.push(profilerGPU);
          } else {
            // Merge additional information
            this.mergeGPUInfo(existingGPU, profilerGPU);
          }
        }
      }

      // Validate and enhance GPU information
      const validatedGPUs = await this.validateAndEnhanceGPUs(allGPUs);

      const detectionTime = Date.now() - startTime;
      logger(
        `macOS GPU detection completed: ${validatedGPUs.length} GPUs found in ${detectionTime}ms`,
      );

      return {
        success: true,
        data: validatedGPUs,
        timestamp: new Date(),
        detectionTimeMs: detectionTime,
      };
    } catch (error) {
      const errorMsg = `macOS GPU detection failed: ${error}`;
      logger(errorMsg);

      return {
        success: false,
        data: null,
        error: errorMsg,
        timestamp: new Date(),
        detectionTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Get mock results for development environment
   */
  private async getMockResults(): Promise<DetectionResult<GPUDevice[]>> {
    try {
      const mockDevices = await mockSystem.enumerateGPUDevices();

      return {
        success: true,
        data: mockDevices,
        timestamp: new Date(),
        detectionTimeMs: 100, // Simulated detection time
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: `Mock detection failed: ${error}`,
        timestamp: new Date(),
        detectionTimeMs: 100,
      };
    }
  }

  /**
   * Detect GPUs using SystemInformation library
   */
  private async detectViaSystemInformation(): Promise<GPUDevice[]> {
    try {
      const graphics = await si.graphics();
      const controllers = graphics.controllers || [];

      const gpuDevices: GPUDevice[] = [];

      for (let i = 0; i < controllers.length; i++) {
        const controller = controllers[i];

        if (!controller.model) continue;

        const vendor = this.determineVendor(controller.model);
        if (!vendor) continue;

        const classification = gpuClassifier.classifyGPU(controller.model);
        const memory = controller.vram
          ? Math.round(controller.vram / (1024 * 1024))
          : 'shared';

        const gpuDevice: GPUDevice = {
          id: `si-macos-gpu-${i}`,
          name: controller.model,
          type: classification.isDiscreteGPU ? 'discrete' : 'integrated',
          vendor,
          deviceId: controller.deviceId || 'unknown',
          priority: gpuClassifier.calculateGPUPriority(controller.model),
          driverVersion: controller.driverVersion || 'unknown',
          memory,
          capabilities: {
            openvinoCompatible: vendor === 'intel',
            cudaCompatible: vendor === 'nvidia',
            coremlCompatible: vendor === 'apple',
          },
          powerEfficiency: classification.powerClass,
          performance: classification.performanceClass,
          detectionMethod: 'systeminformation',
        };

        gpuDevices.push(gpuDevice);
      }

      return gpuDevices;
    } catch (error) {
      logger(`SystemInformation GPU detection failed: ${error}`);
      throw error;
    }
  }

  /**
   * Detect GPUs using system_profiler command
   */
  private async detectViaSystemProfiler(): Promise<GPUDevice[]> {
    try {
      const { stdout } = await execAsync(
        'system_profiler SPDisplaysDataType -json',
        { timeout: this.timeoutMs },
      );

      return this.parseSystemProfilerOutput(stdout);
    } catch (error) {
      logger(`System Profiler GPU detection failed: ${error}`);
      throw error;
    }
  }

  /**
   * Parse system_profiler JSON output
   */
  private parseSystemProfilerOutput(output: string): GPUDevice[] {
    try {
      const data = JSON.parse(output);
      const displays = data.SPDisplaysDataType || [];

      const gpuDevices: GPUDevice[] = [];

      for (let i = 0; i < displays.length; i++) {
        const display = displays[i];

        if (!display.sppci_model) continue;

        const vendor = this.determineVendor(display.sppci_model);
        if (!vendor) continue;

        const classification = gpuClassifier.classifyGPU(display.sppci_model);

        // Extract memory information
        let memory: number | 'shared' = 'shared';
        if (display.sppci_vram_shared) {
          memory = 'shared';
        } else if (display.vram) {
          const vramStr = display.vram.toString();
          const vramMatch = vramStr.match(/(\d+)\s*(MB|GB)/i);
          if (vramMatch) {
            const amount = parseInt(vramMatch[1]);
            memory =
              vramMatch[2].toUpperCase() === 'GB' ? amount * 1024 : amount;
          }
        }

        const gpuDevice: GPUDevice = {
          id: `profiler-gpu-${i}`,
          name: display.sppci_model,
          type: classification.isDiscreteGPU ? 'discrete' : 'integrated',
          vendor,
          deviceId: display.sppci_device_id || 'unknown',
          priority: gpuClassifier.calculateGPUPriority(display.sppci_model),
          driverVersion: display.sppci_driver_version || 'unknown',
          memory,
          capabilities: {
            openvinoCompatible: vendor === 'intel',
            cudaCompatible: vendor === 'nvidia',
            coremlCompatible: vendor === 'apple',
          },
          powerEfficiency: classification.powerClass,
          performance: classification.performanceClass,
          detectionMethod: 'systeminformation',
        };

        gpuDevices.push(gpuDevice);
      }

      return gpuDevices;
    } catch (error) {
      logger(`Failed to parse system_profiler output: ${error}`);
      return [];
    }
  }

  /**
   * Determine GPU vendor from name
   */
  private determineVendor(name: string): 'nvidia' | 'intel' | 'apple' | null {
    const nameLower = name.toLowerCase();

    if (
      nameLower.includes('intel') ||
      nameLower.includes('arc') ||
      nameLower.includes('xe') ||
      nameLower.includes('iris')
    ) {
      return 'intel';
    }

    if (
      nameLower.includes('nvidia') ||
      nameLower.includes('geforce') ||
      nameLower.includes('quadro') ||
      nameLower.includes('rtx') ||
      nameLower.includes('gtx')
    ) {
      return 'nvidia';
    }

    if (
      nameLower.includes('apple') ||
      nameLower.includes('metal') ||
      nameLower.includes('m1') ||
      nameLower.includes('m2') ||
      nameLower.includes('m3')
    ) {
      return 'apple';
    }

    return null;
  }

  /**
   * Merge GPU information from different sources
   */
  private mergeGPUInfo(target: GPUDevice, source: GPUDevice): void {
    // Merge driver information
    if (
      source.driverVersion &&
      source.driverVersion !== 'unknown' &&
      target.driverVersion === 'unknown'
    ) {
      target.driverVersion = source.driverVersion;
    }

    // Merge memory information
    if (typeof source.memory === 'number' && target.memory === 'shared') {
      target.memory = source.memory;
    }

    // Merge device ID information
    if (
      source.deviceId &&
      source.deviceId !== 'unknown' &&
      target.deviceId === 'unknown'
    ) {
      target.deviceId = source.deviceId;
    }
  }

  /**
   * Validate and enhance GPU information
   */
  private async validateAndEnhanceGPUs(
    gpus: GPUDevice[],
  ): Promise<GPUDevice[]> {
    const validatedGPUs: GPUDevice[] = [];

    for (const gpu of gpus) {
      try {
        // macOS-specific validation
        if (gpu.vendor === 'apple') {
          // Apple Silicon Macs have CoreML support by default
          gpu.capabilities.coremlCompatible = true;
          gpu.capabilities.openvinoCompatible = false; // Intel OpenVINO not compatible with Apple Silicon
          gpu.capabilities.cudaCompatible = false; // CUDA not available on Apple Silicon
        }

        if (gpu.vendor === 'intel') {
          // Intel GPUs on macOS (rare but possible in eGPU setups)
          // OpenVINO support depends on driver availability
          const hasValidDriver =
            gpu.driverVersion && gpu.driverVersion !== 'unknown';
          gpu.capabilities.openvinoCompatible = hasValidDriver;
        }

        if (gpu.vendor === 'nvidia') {
          // NVIDIA GPUs on macOS (possible in eGPU setups)
          // CUDA support depends on web drivers
          gpu.capabilities.cudaCompatible = true; // Assume available if detected
          gpu.capabilities.openvinoCompatible = false; // OpenVINO is Intel-specific
        }

        validatedGPUs.push(gpu);
      } catch (error) {
        logger(`GPU validation failed for ${gpu.name}: ${error}`);
        validatedGPUs.push(gpu); // Include even if validation fails
      }
    }

    return validatedGPUs;
  }
}
