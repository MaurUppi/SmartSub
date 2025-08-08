/**
 * Windows GPU Detection System
 *
 * This module provides Windows-specific GPU detection using:
 * - WMI (Windows Management Instrumentation)
 * - SystemInformation library
 * - Registry queries for driver information
 * - Intel GPU specific detection patterns
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import si from 'systeminformation';

import { GPUDevice, DetectionResult, WindowsGPUInfo } from '../../types/gpu';
import { logMessage as logger } from '../helpers/logger';
import { gpuClassifier } from './gpuClassification';

const execAsync = promisify(exec);

export class WindowsGPUDetector {
  private readonly timeoutMs = 15000;

  /**
   * Main Windows GPU detection method
   */
  public async detectGPUs(): Promise<DetectionResult<GPUDevice[]>> {
    const startTime = Date.now();

    try {
      logger('Starting Windows GPU detection...');

      // Use multiple detection methods for comprehensive coverage
      const [wmiResults, siResults] = await Promise.allSettled([
        this.detectViaWMI(),
        this.detectViaSystemInformation(),
      ]);

      const allGPUs: GPUDevice[] = [];

      // Process WMI results
      if (wmiResults.status === 'fulfilled' && wmiResults.value) {
        allGPUs.push(...wmiResults.value);
      }

      // Process SystemInformation results (merge with WMI data)
      if (siResults.status === 'fulfilled' && siResults.value) {
        const siGPUs = siResults.value;

        // Add unique GPUs from SI that weren't found by WMI
        for (const siGPU of siGPUs) {
          const existingGPU = allGPUs.find(
            (gpu) => gpu.name === siGPU.name || gpu.deviceId === siGPU.deviceId,
          );

          if (!existingGPU) {
            allGPUs.push(siGPU);
          }
        }
      }

      // Filter for Intel GPUs and add additional validation
      const intelGPUs = allGPUs.filter((gpu) => gpu.vendor === 'intel');
      const validatedGPUs = await this.validateIntelGPUs(intelGPUs);

      // Include non-Intel GPUs as well for complete picture
      const nonIntelGPUs = allGPUs.filter((gpu) => gpu.vendor !== 'intel');
      const finalResults = [...validatedGPUs, ...nonIntelGPUs];

      const detectionTime = Date.now() - startTime;
      logger(
        `Windows GPU detection completed: ${finalResults.length} GPUs found in ${detectionTime}ms`,
      );

      return {
        success: true,
        data: finalResults,
        timestamp: new Date(),
        detectionTimeMs: detectionTime,
      };
    } catch (error) {
      const errorMsg = `Windows GPU detection failed: ${error}`;
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
   * Detect GPUs using Windows Management Instrumentation (WMI)
   */
  private async detectViaWMI(): Promise<GPUDevice[]> {
    try {
      const wmiScript = `
Get-WmiObject -Class Win32_VideoController | Where-Object { $_.Name -ne $null } | ForEach-Object {
    $gpu = $_
    $driverVersion = if ($gpu.DriverVersion) { $gpu.DriverVersion } else { "unknown" }
    $adapterRAM = if ($gpu.AdapterRAM -and $gpu.AdapterRAM -gt 0) { [math]::Round($gpu.AdapterRAM / 1MB) } else { "shared" }
    $deviceId = if ($gpu.PNPDeviceID) { ($gpu.PNPDeviceID -split '\\\\')[1] } else { "unknown" }
    
    Write-Output "GPU_START"
    Write-Output "Name: $($gpu.Name)"
    Write-Output "DeviceID: $deviceId"
    Write-Output "DriverVersion: $driverVersion"
    Write-Output "Memory: $adapterRAM"
    Write-Output "Status: $($gpu.Status)"
    Write-Output "Availability: $($gpu.Availability)"
    Write-Output "PNPDeviceID: $($gpu.PNPDeviceID)"
    Write-Output "GPU_END"
}
      `;

      const { stdout } = await execAsync(
        `powershell -Command "${wmiScript.replace(/\n/g, '; ')}"`,
        { timeout: this.timeoutMs },
      );

      return this.parseWMIOutput(stdout);
    } catch (error) {
      logger(`WMI GPU detection failed: ${error}`);
      throw error;
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
        if (!vendor) continue; // Skip unknown vendors

        const classification = gpuClassifier.classifyGPU(controller.model);
        const memory = controller.vram
          ? Math.round(controller.vram / (1024 * 1024))
          : 'shared';

        const gpuDevice: GPUDevice = {
          id: `si-gpu-${i}`,
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
          platformInfo: {
            windowsDeviceId: controller.deviceId,
            driverPath: controller.driverVersion,
          },
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
   * Parse WMI PowerShell output
   */
  private parseWMIOutput(output: string): GPUDevice[] {
    const gpuDevices: GPUDevice[] = [];
    const lines = output
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    let currentGPU: Partial<WindowsGPUInfo> = {};
    let gpuIndex = 0;

    for (const line of lines) {
      if (line === 'GPU_START') {
        currentGPU = {};
        continue;
      }

      if (line === 'GPU_END') {
        if (currentGPU.name) {
          const gpuDevice = this.convertWMIInfoToGPUDevice(
            currentGPU as WindowsGPUInfo,
            gpuIndex,
          );
          if (gpuDevice) {
            gpuDevices.push(gpuDevice);
            gpuIndex++;
          }
        }
        continue;
      }

      const [key, ...valueParts] = line.split(':');
      const value = valueParts.join(':').trim();

      switch (key) {
        case 'Name':
          currentGPU.name = value;
          break;
        case 'DeviceID':
          currentGPU.deviceId = value;
          break;
        case 'DriverVersion':
          currentGPU.driverVersion = value;
          break;
        case 'Memory':
          currentGPU.memory = isNaN(Number(value)) ? 0 : Number(value);
          break;
        case 'Status':
          currentGPU.status = value;
          break;
        case 'PNPDeviceID':
          // Extract vendor ID from PNP Device ID
          const vendorMatch = value.match(/VEN_([A-F0-9]{4})/i);
          if (vendorMatch) {
            currentGPU.vendorId = vendorMatch[1];
          }
          break;
      }
    }

    return gpuDevices;
  }

  /**
   * Convert WMI info to GPUDevice
   */
  private convertWMIInfoToGPUDevice(
    wmiInfo: WindowsGPUInfo,
    index: number,
  ): GPUDevice | null {
    if (!wmiInfo.name) return null;

    const vendor = this.determineVendor(wmiInfo.name);
    if (!vendor) return null;

    const classification = gpuClassifier.classifyGPU(wmiInfo.name);

    return {
      id: `wmi-gpu-${index}`,
      name: wmiInfo.name,
      type: classification.isDiscreteGPU ? 'discrete' : 'integrated',
      vendor,
      deviceId: wmiInfo.deviceId || 'unknown',
      priority: gpuClassifier.calculateGPUPriority(wmiInfo.name),
      driverVersion: wmiInfo.driverVersion || 'unknown',
      memory: wmiInfo.memory || 'shared',
      capabilities: {
        openvinoCompatible: vendor === 'intel',
        cudaCompatible: vendor === 'nvidia',
        coremlCompatible: vendor === 'apple',
      },
      powerEfficiency: classification.powerClass,
      performance: classification.performanceClass,
      detectionMethod: 'wmi',
      platformInfo: {
        windowsDeviceId: wmiInfo.deviceId,
        driverPath: wmiInfo.driverVersion,
      },
    };
  }

  /**
   * Determine GPU vendor from name
   */
  private determineVendor(name: string): 'nvidia' | 'intel' | 'apple' | null {
    const nameLower = name.toLowerCase();

    if (
      nameLower.includes('intel') ||
      nameLower.includes('arc') ||
      nameLower.includes('xe')
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

    if (nameLower.includes('apple') || nameLower.includes('metal')) {
      return 'apple';
    }

    return null;
  }

  /**
   * Validate Intel GPUs with additional checks
   */
  private async validateIntelGPUs(gpus: GPUDevice[]): Promise<GPUDevice[]> {
    const validatedGPUs: GPUDevice[] = [];

    for (const gpu of gpus) {
      try {
        // Additional Intel GPU validation
        if (gpu.vendor === 'intel') {
          // Check if driver is properly installed
          const hasValidDriver =
            gpu.driverVersion && gpu.driverVersion !== 'unknown';

          // Update OpenVINO compatibility based on driver status
          gpu.capabilities.openvinoCompatible =
            hasValidDriver && gpu.capabilities.openvinoCompatible;

          if (!hasValidDriver) {
            logger(
              `Intel GPU ${gpu.name} has invalid driver: ${gpu.driverVersion}`,
            );
          }
        }

        validatedGPUs.push(gpu);
      } catch (error) {
        logger(`GPU validation failed for ${gpu.name}: ${error}`);
        // Still include GPU but mark as potentially problematic
        validatedGPUs.push(gpu);
      }
    }

    return validatedGPUs;
  }
}
