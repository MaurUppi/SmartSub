import { execSync } from 'child_process';
import { logMessage } from './storeManager';

/**
 * CUDA version information interface
 */
export interface CUDAInfo {
  version: string;
  majorVersion: number;
  minorVersion: number;
  driverVersion: string;
  supported: boolean;
  addonName: string;
}

/**
 * Enhanced CUDA detection with version-specific addon selection (Requirement #2)
 * Detects CUDA version and returns appropriate addon name for Windows
 */
export function checkCudaSupport(): CUDAInfo | false {
  // Only support CUDA detection on Windows and Linux
  if (process.platform !== 'win32' && process.platform !== 'linux') {
    return false;
  }

  try {
    // Check if nvidia-smi exists (NVIDIA driver)
    const nsmiResult = execSync('nvidia-smi', {
      encoding: 'utf8',
      timeout: 5000,
    });
    logMessage(`nvidia-smi result: ${nsmiResult}`, 'info');

    // Extract CUDA version from nvidia-smi output
    const cudaVersionMatch = nsmiResult.match(/CUDA Version: (\d+\.\d+)/);
    const driverVersionMatch = nsmiResult.match(/Driver Version: ([0-9.]+)/);

    if (cudaVersionMatch) {
      const cudaVersionString = cudaVersionMatch[1];
      const cudaVersion = parseFloat(cudaVersionString);
      const [majorVersion, minorVersion] = cudaVersionString
        .split('.')
        .map(Number);
      const driverVersion = driverVersionMatch
        ? driverVersionMatch[1]
        : 'Unknown';

      logMessage(
        `Detected CUDA version: ${cudaVersion} (parsed from: ${cudaVersionString})`,
        'info',
      );
      logMessage(`Driver version: ${driverVersion}`, 'info');

      // Determine version-specific addon name (Requirement #2)
      const addonName = getCUDAVersionSpecificAddon(cudaVersion);
      logMessage(
        `Selected CUDA addon: ${addonName} for version ${cudaVersion}`,
        'info',
      );

      const cudaInfo: CUDAInfo = {
        version: cudaVersionString,
        majorVersion,
        minorVersion,
        driverVersion,
        supported: true,
        addonName,
      };

      logMessage(
        `CUDA detection successful: ${JSON.stringify(cudaInfo)}`,
        'info',
      );
      return cudaInfo;
    }

    logMessage('No CUDA version found in nvidia-smi output', 'warning');
    return false;
  } catch (error) {
    logMessage(`CUDA detection failed: ${error.message}`, 'warning');
    return false;
  }
}

/**
 * Get version-specific CUDA addon name based on detected CUDA version
 * Implements requirement #2: NVIDIA + Windows → CUDA version specific addon
 *
 * Maps to actual addon files:
 * - addon-windows-cuda-1241-generic.node (CUDA 12.41+)
 * - addon-windows-cuda-1220-generic.node (CUDA 12.20+)
 * - addon-windows-cuda-1180-generic.node (CUDA 11.80+)
 */
function getCUDAVersionSpecificAddon(cudaVersion: number): string {
  const platform = process.platform;

  if (platform === 'win32') {
    // Windows CUDA version-specific addons - match actual file names
    if (cudaVersion >= 12.41) {
      return 'addon-windows-cuda-1241-generic.node'; // CUDA 12.41+ (newest)
    } else if (cudaVersion >= 12.2) {
      return 'addon-windows-cuda-1220-generic.node'; // CUDA 12.20+
    } else if (cudaVersion >= 11.8) {
      return 'addon-windows-cuda-1180-generic.node'; // CUDA 11.80+
    } else if (cudaVersion >= 11.0) {
      // Fallback to oldest supported CUDA 11.x
      return 'addon-windows-cuda-1180-generic.node';
    } else {
      // Very old CUDA - fallback to CPU
      return 'addon-windows-no-cuda.node';
    }
  } else if (platform === 'linux') {
    // Linux CUDA version-specific addons (assuming similar naming)
    if (cudaVersion >= 12.41) {
      return 'addon-linux-cuda-1241-generic.node';
    } else if (cudaVersion >= 12.2) {
      return 'addon-linux-cuda-1220-generic.node';
    } else if (cudaVersion >= 11.8) {
      return 'addon-linux-cuda-1180-generic.node';
    } else if (cudaVersion >= 11.0) {
      return 'addon-linux-cuda-1180-generic.node';
    } else {
      return 'addon-linux-no-cuda.node';
    }
  }

  // Generic fallback
  return 'addon-cuda.node';
}

/**
 * Check if CUDA is supported (backward compatibility)
 * Returns simple boolean for legacy compatibility
 */
export function isCudaSupported(): boolean {
  const cudaInfo = checkCudaSupport();
  return cudaInfo !== false && cudaInfo.supported;
}

/**
 * Get recommended CUDA addon name for current system
 * Returns the version-specific addon name or fallback
 */
export function getCUDAAddonName(): string {
  const cudaInfo = checkCudaSupport();

  if (cudaInfo !== false && cudaInfo.supported) {
    return cudaInfo.addonName;
  }

  // Fallback to platform-generic CUDA addon
  switch (process.platform) {
    case 'win32':
      return 'addon-windows-cuda.node';
    case 'linux':
      return 'addon-linux-cuda.node';
    default:
      return 'addon-cuda.node';
  }
}
