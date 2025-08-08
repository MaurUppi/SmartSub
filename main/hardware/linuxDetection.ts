/**
 * Linux GPU Detection System
 *
 * This module provides Linux-specific GPU detection using:
 * - lspci command for PCI device enumeration
 * - SystemInformation library
 * - /proc filesystem queries
 * - Intel GPU specific detection patterns
 */

import { exec } from 'child_process';
import { promises as fs } from 'fs';
import { promisify } from 'util';
import si from 'systeminformation';

import { GPUDevice, DetectionResult, LinuxGPUInfo } from '../../types/gpu';
import { logMessage as logger } from '../helpers/logger';
import { gpuClassifier } from './gpuClassification';

const execAsync = promisify(exec);

export class LinuxGPUDetector {
  private readonly timeoutMs = 15000;

  /**
   * Main Linux GPU detection method
   */
  public async detectGPUs(): Promise<DetectionResult<GPUDevice[]>> {
    const startTime = Date.now();

    try {
      logger('Starting Linux GPU detection...');

      // Use multiple detection methods for comprehensive coverage
      const [lspciResults, siResults, procResults] = await Promise.allSettled([
        this.detectViaLspci(),
        this.detectViaSystemInformation(),
        this.detectViaProcFS(),
      ]);

      const allGPUs: GPUDevice[] = [];

      // Process lspci results
      if (lspciResults.status === 'fulfilled' && lspciResults.value) {
        allGPUs.push(...lspciResults.value);
      }

      // Process SystemInformation results
      if (siResults.status === 'fulfilled' && siResults.value) {
        const siGPUs = siResults.value;

        // Merge with lspci data or add unique GPUs
        for (const siGPU of siGPUs) {
          const existingGPU = allGPUs.find(
            (gpu) =>
              gpu.name === siGPU.name ||
              gpu.platformInfo?.linuxPciId === siGPU.platformInfo?.linuxPciId,
          );

          if (!existingGPU) {
            allGPUs.push(siGPU);
          } else {
            // Merge additional information
            this.mergeGPUInfo(existingGPU, siGPU);
          }
        }
      }

      // Process /proc filesystem results
      if (procResults.status === 'fulfilled' && procResults.value) {
        // Add any additional information from /proc
        await this.enhanceWithProcInfo(allGPUs, procResults.value);
      }

      // Filter and validate Intel GPUs
      const intelGPUs = allGPUs.filter((gpu) => gpu.vendor === 'intel');
      const validatedGPUs = await this.validateIntelGPUs(intelGPUs);

      // Include non-Intel GPUs as well
      const nonIntelGPUs = allGPUs.filter((gpu) => gpu.vendor !== 'intel');
      const finalResults = [...validatedGPUs, ...nonIntelGPUs];

      const detectionTime = Date.now() - startTime;
      logger(
        `Linux GPU detection completed: ${finalResults.length} GPUs found in ${detectionTime}ms`,
      );

      return {
        success: true,
        data: finalResults,
        timestamp: new Date(),
        detectionTimeMs: detectionTime,
      };
    } catch (error) {
      const errorMsg = `Linux GPU detection failed: ${error}`;
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
   * Detect GPUs using lspci command
   */
  private async detectViaLspci(): Promise<GPUDevice[]> {
    try {
      // Get detailed PCI information
      const { stdout } = await execAsync(
        'lspci -nn -v | grep -A 20 -B 5 -E "(VGA|3D|Display)"',
        { timeout: this.timeoutMs },
      );

      return this.parseLspciOutput(stdout);
    } catch (error) {
      logger(`lspci GPU detection failed: ${error}`);
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
        if (!vendor) continue;

        const classification = gpuClassifier.classifyGPU(controller.model);
        const memory = controller.vram
          ? Math.round(controller.vram / (1024 * 1024))
          : 'shared';

        const gpuDevice: GPUDevice = {
          id: `si-linux-gpu-${i}`,
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
            coremlCompatible: false, // Not available on Linux
          },
          powerEfficiency: classification.powerClass,
          performance: classification.performanceClass,
          detectionMethod: 'systeminformation',
          platformInfo: {
            linuxPciId: controller.pciBus,
            kernelModule: this.detectKernelModule(controller.model),
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
   * Detect GPUs via /proc filesystem
   */
  private async detectViaProcFS(): Promise<Map<string, any>> {
    const procInfo = new Map<string, any>();

    try {
      // Read /proc/driver/nvidia/version for NVIDIA info
      try {
        const nvidiaVersion = await fs.readFile(
          '/proc/driver/nvidia/version',
          'utf-8',
        );
        procInfo.set('nvidia_driver', nvidiaVersion.trim());
      } catch (error) {
        // NVIDIA driver not installed
      }

      // Read /proc/meminfo for system memory info
      try {
        const meminfo = await fs.readFile('/proc/meminfo', 'utf-8');
        const totalMem = meminfo.match(/MemTotal:\s+(\d+)\s+kB/);
        if (totalMem) {
          procInfo.set(
            'system_memory',
            Math.round(parseInt(totalMem[1]) / 1024),
          );
        }
      } catch (error) {
        // Memory info not available
      }

      // Check for Intel GPU kernel modules
      try {
        const { stdout } = await execAsync('lsmod | grep -E "(i915|xe)"');
        const modules = stdout
          .trim()
          .split('\n')
          .map((line) => line.split(/\s+/)[0]);
        procInfo.set('intel_modules', modules);
      } catch (error) {
        // No Intel GPU modules loaded
      }

      return procInfo;
    } catch (error) {
      logger(`/proc filesystem detection failed: ${error}`);
      return procInfo;
    }
  }

  /**
   * Parse lspci output
   */
  private parseLspciOutput(output: string): GPUDevice[] {
    const gpuDevices: GPUDevice[] = [];
    const deviceBlocks = output
      .split(/(?=^\S)/m)
      .filter(
        (block) =>
          block.includes('VGA') ||
          block.includes('3D') ||
          block.includes('Display'),
      );

    for (let i = 0; i < deviceBlocks.length; i++) {
      const block = deviceBlocks[i];
      const lines = block
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

      let pciId = '';
      let deviceName = '';
      let vendor = '';
      let driver = '';
      let kernelModule = '';

      for (const line of lines) {
        // Extract PCI ID and device name from first line
        if (
          line.includes('VGA') ||
          line.includes('3D') ||
          line.includes('Display')
        ) {
          const match = line.match(
            /^([0-9a-f:\.]+)\s+.*?:\s*(.+?)(?:\s+\[([^\]]+)\])?$/,
          );
          if (match) {
            pciId = match[1];
            deviceName = match[2];
          }
        }

        // Extract kernel driver
        if (line.startsWith('Kernel driver in use:')) {
          driver = line.split(':')[1].trim();
        }

        // Extract kernel modules
        if (line.startsWith('Kernel modules:')) {
          kernelModule = line.split(':')[1].trim();
        }
      }

      if (deviceName) {
        const detectedVendor = this.determineVendor(deviceName);
        if (detectedVendor) {
          const classification = gpuClassifier.classifyGPU(deviceName);

          const gpuDevice: GPUDevice = {
            id: `lspci-gpu-${i}`,
            name: deviceName,
            type: classification.isDiscreteGPU ? 'discrete' : 'integrated',
            vendor: detectedVendor,
            deviceId: pciId,
            priority: gpuClassifier.calculateGPUPriority(deviceName),
            driverVersion: driver || 'unknown',
            memory: 'shared', // Will be updated if VRAM info available
            capabilities: {
              openvinoCompatible: detectedVendor === 'intel',
              cudaCompatible: detectedVendor === 'nvidia',
              coremlCompatible: false,
            },
            powerEfficiency: classification.powerClass,
            performance: classification.performanceClass,
            detectionMethod: 'lspci',
            platformInfo: {
              linuxPciId: pciId,
              driverPath: driver,
              kernelModule,
            },
          };

          gpuDevices.push(gpuDevice);
        }
      }
    }

    return gpuDevices;
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

    // Apple GPUs not typically found on Linux
    return null;
  }

  /**
   * Detect kernel module for GPU
   */
  private detectKernelModule(gpuName: string): string {
    const nameLower = gpuName.toLowerCase();

    if (nameLower.includes('intel')) {
      // Modern Intel GPUs use xe driver, older ones use i915
      if (nameLower.includes('arc')) {
        return 'xe';
      }
      return 'i915';
    }

    if (nameLower.includes('nvidia')) {
      return 'nvidia';
    }

    if (nameLower.includes('amd') || nameLower.includes('radeon')) {
      return 'amdgpu';
    }

    return 'unknown';
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

    // Merge platform info
    if (source.platformInfo) {
      target.platformInfo = { ...target.platformInfo, ...source.platformInfo };
    }
  }

  /**
   * Enhance GPU information with /proc data
   */
  private async enhanceWithProcInfo(
    gpus: GPUDevice[],
    procInfo: Map<string, any>,
  ): Promise<void> {
    const intelModules = procInfo.get('intel_modules') || [];

    for (const gpu of gpus) {
      if (gpu.vendor === 'intel') {
        // Update kernel module information
        if (intelModules.length > 0 && gpu.platformInfo) {
          gpu.platformInfo.kernelModule =
            intelModules.find(
              (mod: string) => mod === 'xe' || mod === 'i915',
            ) || gpu.platformInfo.kernelModule;
        }

        // Update OpenVINO compatibility based on driver availability
        const hasValidDriver =
          gpu.driverVersion && gpu.driverVersion !== 'unknown';
        gpu.capabilities.openvinoCompatible =
          hasValidDriver && intelModules.length > 0;
      }
    }
  }

  /**
   * Validate Intel GPUs with additional Linux-specific checks
   */
  private async validateIntelGPUs(gpus: GPUDevice[]): Promise<GPUDevice[]> {
    const validatedGPUs: GPUDevice[] = [];

    for (const gpu of gpus) {
      try {
        if (gpu.vendor === 'intel') {
          // Check if Intel GPU driver is properly loaded
          const hasKernelModule =
            gpu.platformInfo?.kernelModule &&
            gpu.platformInfo.kernelModule !== 'unknown';

          if (!hasKernelModule) {
            logger(`Intel GPU ${gpu.name} has no kernel module loaded`);
            gpu.capabilities.openvinoCompatible = false;
          }

          // Additional validation for driver version
          if (gpu.driverVersion === 'unknown') {
            logger(`Intel GPU ${gpu.name} has unknown driver version`);
          }
        }

        validatedGPUs.push(gpu);
      } catch (error) {
        logger(`GPU validation failed for ${gpu.name}: ${error}`);
        validatedGPUs.push(gpu);
      }
    }

    return validatedGPUs;
  }
}
