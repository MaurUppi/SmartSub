/**
 * GPU Selection Engine for Intel OpenVINO Integration
 * Intelligent GPU selection with user override capabilities and comprehensive fallback chains
 */

import {
  logMessage,
  logGPUDetectionEvent,
  generateCorrelationId,
  LogCategory,
} from './logger';
import {
  checkCudaSupport,
  getCUDAAddonName as getCUDAAddonNameFromUtils,
} from './cudaUtils';
import { store } from './store';
import { isAppleSilicon } from './utils';
import { hasEncoderModel } from './whisper';

/**
 * Get platform-specific addon filename for CUDA acceleration
 * Enhanced with version-specific detection (Requirement #2)
 */
export function getCUDAAddonName(): string {
  // Use enhanced CUDA detection for version-specific addon selection
  try {
    return getCUDAAddonNameFromUtils();
  } catch (error) {
    // Fallback to generic platform-specific addon if detection fails
    switch (process.platform) {
      case 'win32':
        return 'addon-windows-cuda.node';
      case 'linux':
        return 'addon-linux-cuda.node';
      default:
        return 'addon-cuda.node'; // Fallback for unsupported platforms
    }
  }
}

export function getOpenVINOAddonName(): string {
  switch (process.platform) {
    case 'win32':
      return 'addon-windows-openvino.node';
    case 'linux':
      return 'addon-linux-openvino.node';
    case 'darwin':
      return process.arch === 'arm64'
        ? 'addon-macos-arm-openvino.node'
        : 'addon-macos-x86-openvino.node';
    default:
      return 'addon-openvino.node'; // Fallback
  }
}

export function getCoreMLAddonName(): string {
  switch (process.platform) {
    case 'darwin':
      return process.arch === 'arm64'
        ? 'addon-macos-arm64-coreml.node'
        : 'addon-macos-coreml.node';
    default:
      return 'addon-coreml.node'; // Fallback for non-macOS
  }
}

export function getCPUAddonName(): string {
  switch (process.platform) {
    case 'win32':
      return 'addon-windows-cpu.node';
    case 'linux':
      return 'addon-linux-cpu.node';
    case 'darwin':
      return process.arch === 'arm64'
        ? 'addon-macos-arm64.node'
        : 'addon-macos-x64.node';
    default:
      return 'addon.node'; // Generic fallback
  }
}

/**
 * Get no-CUDA fallback addon name for AMD Windows scenario (Requirement #7)
 */
function getNoCudaAddonName(): string {
  switch (process.platform) {
    case 'win32':
      return 'addon-windows-no-cuda.node'; // ✅ NEW: Fallback addon for AMD Windows
    default:
      return getCPUAddonName(); // Use CPU addon for other platforms
  }
}

export interface AddonInfo {
  type: 'cuda' | 'openvino' | 'coreml' | 'cpu';
  path: string;
  displayName: string;
  deviceConfig: {
    deviceId?: string;
    memory?: number | 'shared';
    type?: 'discrete' | 'integrated';
    // ✅ NEW: CUDA-specific configuration (Requirement #2)
    cudaVersion?: string;
    driverVersion?: string;
    majorVersion?: number;
  } | null;
  fallbackReason?: string;
}

export interface GPUCapabilities {
  nvidia: boolean;
  intel: any[];
  amd: any[]; // ✅ NEW: AMD GPU support for requirements #4, #7, #8
  intelAll: any[];
  apple: boolean;
  cpu: boolean;
  openvinoVersion: string | false;
  capabilities: {
    multiGPU: boolean;
    hybridSystem: boolean;
  };
}

/**
 * Select optimal GPU addon based on user preferences and system capabilities
 */
export function selectOptimalGPU(
  priority: string[],
  capabilities: GPUCapabilities,
  model: string,
): AddonInfo {
  const correlationId = generateCorrelationId();

  // Log GPU selection process initiation
  logGPUDetectionEvent(
    'detection_started',
    {
      priority,
      model,
      systemCapabilities: {
        nvidia: capabilities.nvidia,
        intelCount: capabilities.intel.length,
        amdCount: capabilities.amd.length, // ✅ NEW: AMD GPU count logging
        apple: capabilities.apple,
        openvinoVersion: capabilities.openvinoVersion,
      },
    },
    correlationId,
  );

  for (const gpuType of priority) {
    const addonInfo = tryGPUType(gpuType, capabilities, model, correlationId);

    if (addonInfo) {
      // Log successful GPU selection
      logGPUDetectionEvent(
        'gpu_validated',
        {
          selectedGPU: {
            type: addonInfo.type,
            displayName: addonInfo.displayName,
            deviceConfig: addonInfo.deviceConfig,
          },
          priority: gpuType,
          model,
        },
        correlationId,
      );

      logGPUDetectionEvent(
        'detection_completed',
        {
          finalSelection: addonInfo,
          totalPriorityOptions: priority.length,
          successfulSelection: true,
        },
        correlationId,
      );

      return addonInfo;
    }
  }

  // Enhanced fallback chain when primary GPU options fail
  logGPUDetectionEvent(
    'detection_failed',
    {
      reason:
        'Primary GPU priority options failed, trying enhanced fallback chain',
      failedPriorities: priority,
      totalPriorityOptions: priority.length,
    },
    correlationId,
  );

  // Try enhanced fallback chain
  const fallbackResult = tryEnhancedFallbackChain(
    capabilities,
    model,
    correlationId,
  );

  if (fallbackResult) {
    logGPUDetectionEvent(
      'detection_completed',
      {
        finalSelection: fallbackResult,
        totalPriorityOptions: priority.length,
        successfulSelection: true,
        usedFallbackChain: true,
      },
      correlationId,
    );

    return fallbackResult;
  }

  // Ultimate emergency CPU fallback
  logGPUDetectionEvent(
    'detection_completed',
    {
      finalSelection: {
        type: 'cpu',
        reason: 'All GPU acceleration and fallback methods unavailable',
      },
      totalPriorityOptions: priority.length,
      successfulSelection: false,
      emergencyFallback: true,
      fallbackChainFailed: true,
    },
    correlationId,
  );

  return {
    type: 'cpu',
    path: getCPUAddonName(),
    displayName: 'CPU Processing (Ultimate Emergency Fallback)',
    deviceConfig: null,
    fallbackReason: 'All GPU acceleration and fallback methods unavailable',
  };
}

/**
 * Enhanced fallback chain when primary GPU selection fails
 * Tries multiple fallback options across different platforms and configurations
 */
function tryEnhancedFallbackChain(
  capabilities: GPUCapabilities,
  model: string,
  correlationId?: string,
): AddonInfo | null {
  const platform = process.platform;
  const arch = process.arch;

  logGPUDetectionEvent(
    'fallback_chain_started',
    {
      platform,
      arch,
      systemCapabilities: {
        nvidia: capabilities.nvidia,
        intelCount: capabilities.intel.length,
        amdCount: capabilities.amd.length,
        apple: capabilities.apple,
        openvinoVersion: capabilities.openvinoVersion,
      },
    },
    correlationId,
  );

  // Platform-specific fallback chains
  if (platform === 'win32') {
    return tryWindowsFallbackChain(capabilities, model, correlationId);
  } else if (platform === 'linux') {
    return tryLinuxFallbackChain(capabilities, model, correlationId);
  } else if (platform === 'darwin') {
    return tryMacOSFallbackChain(capabilities, model, arch, correlationId);
  }

  // Generic cross-platform fallback
  return tryGenericFallbackChain(capabilities, model, correlationId);
}

/**
 * Windows-specific enhanced fallback chain
 */
function tryWindowsFallbackChain(
  capabilities: GPUCapabilities,
  model: string,
  correlationId?: string,
): AddonInfo | null {
  const fallbackOptions = [
    'openvino', // Try OpenVINO first (most capable)
    'no-cuda', // Try no-CUDA addon (Windows-specific)
    'cpu', // Basic CPU processing
  ];

  for (const option of fallbackOptions) {
    try {
      const result = tryWindowsFallbackOption(
        option,
        capabilities,
        model,
        correlationId,
      );
      if (result) {
        logGPUDetectionEvent(
          'fallback_chain_success',
          {
            platform: 'win32',
            successfulFallback: option,
            result: {
              type: result.type,
              path: result.path,
              displayName: result.displayName,
            },
          },
          correlationId,
        );
        return result;
      }
    } catch (error) {
      logGPUDetectionEvent(
        'fallback_chain_option_failed',
        {
          platform: 'win32',
          failedFallback: option,
          error: error.message,
        },
        correlationId,
      );
    }
  }

  return null;
}

/**
 * Try specific Windows fallback option
 */
function tryWindowsFallbackOption(
  option: string,
  capabilities: GPUCapabilities,
  _model: string,
  _correlationId?: string,
): AddonInfo | null {
  switch (option) {
    case 'openvino':
      if (capabilities.openvinoVersion !== false) {
        return {
          type: 'openvino',
          path: getOpenVINOAddonName(),
          displayName: 'CPU Processing (OpenVINO Fallback)',
          deviceConfig: null,
          fallbackReason:
            'Primary GPU options failed - using OpenVINO fallback',
        };
      }
      throw new Error('OpenVINO not available');

    case 'no-cuda':
      return {
        type: 'cpu',
        path: getNoCudaAddonName(),
        displayName: 'CPU Processing (No-CUDA Fallback)',
        deviceConfig: null,
        fallbackReason: 'Primary GPU options failed - using no-CUDA fallback',
      };

    case 'cpu':
      return {
        type: 'cpu',
        path: getCPUAddonName(),
        displayName: 'CPU Processing (Basic Fallback)',
        deviceConfig: null,
        fallbackReason:
          'All acceleration options failed - using basic CPU processing',
      };

    default:
      throw new Error(`Unknown Windows fallback option: ${option}`);
  }
}

/**
 * Linux-specific enhanced fallback chain
 */
function tryLinuxFallbackChain(
  capabilities: GPUCapabilities,
  model: string,
  correlationId?: string,
): AddonInfo | null {
  const fallbackOptions = ['openvino', 'cpu'];

  for (const option of fallbackOptions) {
    try {
      const result = tryLinuxFallbackOption(
        option,
        capabilities,
        model,
        correlationId,
      );
      if (result) {
        logGPUDetectionEvent(
          'fallback_chain_success',
          {
            platform: 'linux',
            successfulFallback: option,
            result: {
              type: result.type,
              path: result.path,
              displayName: result.displayName,
            },
          },
          correlationId,
        );
        return result;
      }
    } catch (error) {
      logGPUDetectionEvent(
        'fallback_chain_option_failed',
        {
          platform: 'linux',
          failedFallback: option,
          error: error.message,
        },
        correlationId,
      );
    }
  }

  return null;
}

/**
 * Try specific Linux fallback option
 */
function tryLinuxFallbackOption(
  option: string,
  capabilities: GPUCapabilities,
  _model: string,
  _correlationId?: string,
): AddonInfo | null {
  switch (option) {
    case 'openvino':
      if (capabilities.openvinoVersion !== false) {
        return {
          type: 'openvino',
          path: getOpenVINOAddonName(),
          displayName: 'CPU Processing (Linux OpenVINO Fallback)',
          deviceConfig: null,
          fallbackReason:
            'Primary GPU options failed - using OpenVINO fallback',
        };
      }
      throw new Error('OpenVINO not available');

    case 'cpu':
      return {
        type: 'cpu',
        path: getCPUAddonName(),
        displayName: 'CPU Processing (Linux Fallback)',
        deviceConfig: null,
        fallbackReason:
          'All acceleration options failed - using CPU processing',
      };

    default:
      throw new Error(`Unknown Linux fallback option: ${option}`);
  }
}

/**
 * macOS-specific enhanced fallback chain
 */
function tryMacOSFallbackChain(
  capabilities: GPUCapabilities,
  model: string,
  arch: string,
  correlationId?: string,
): AddonInfo | null {
  const fallbackOptions =
    arch === 'arm64' ? ['coreml', 'cpu'] : ['openvino', 'cpu'];

  for (const option of fallbackOptions) {
    try {
      const result = tryMacOSFallbackOption(
        option,
        capabilities,
        model,
        arch,
        correlationId,
      );
      if (result) {
        logGPUDetectionEvent(
          'fallback_chain_success',
          {
            platform: 'darwin',
            arch,
            successfulFallback: option,
            result: {
              type: result.type,
              path: result.path,
              displayName: result.displayName,
            },
          },
          correlationId,
        );
        return result;
      }
    } catch (error) {
      logGPUDetectionEvent(
        'fallback_chain_option_failed',
        {
          platform: 'darwin',
          arch,
          failedFallback: option,
          error: error.message,
        },
        correlationId,
      );
    }
  }

  return null;
}

/**
 * Try specific macOS fallback option
 */
function tryMacOSFallbackOption(
  option: string,
  capabilities: GPUCapabilities,
  _model: string,
  arch: string,
  _correlationId?: string,
): AddonInfo | null {
  switch (option) {
    case 'coreml':
      if (capabilities.apple && arch === 'arm64') {
        return {
          type: 'coreml',
          path: getCoreMLAddonName(),
          displayName: 'Apple CoreML (macOS Fallback)',
          deviceConfig: null,
          fallbackReason: 'Primary GPU options failed - using CoreML fallback',
        };
      }
      throw new Error('CoreML not available or not on Apple Silicon');

    case 'openvino':
      if (capabilities.openvinoVersion !== false) {
        return {
          type: 'openvino',
          path: getOpenVINOAddonName(),
          displayName: 'CPU Processing (macOS OpenVINO Fallback)',
          deviceConfig: null,
          fallbackReason:
            'Primary GPU options failed - using OpenVINO fallback',
        };
      }
      throw new Error('OpenVINO not available');

    case 'cpu':
      return {
        type: 'cpu',
        path: getCPUAddonName(),
        displayName: 'CPU Processing (macOS Fallback)',
        deviceConfig: null,
        fallbackReason:
          'All acceleration options failed - using CPU processing',
      };

    default:
      throw new Error(`Unknown macOS fallback option: ${option}`);
  }
}

/**
 * Generic cross-platform fallback chain
 */
function tryGenericFallbackChain(
  _capabilities: GPUCapabilities,
  _model: string,
  _correlationId?: string,
): AddonInfo | null {
  // Last resort: try basic CPU processing
  return {
    type: 'cpu',
    path: getCPUAddonName(),
    displayName: 'CPU Processing (Generic Fallback)',
    deviceConfig: null,
    fallbackReason:
      'Platform-specific fallbacks unavailable - using generic CPU processing',
  };
}

/**
 * Try to use a specific GPU type
 */
function tryGPUType(
  gpuType: string,
  capabilities: GPUCapabilities,
  model: string,
  correlationId?: string,
): AddonInfo | null {
  switch (gpuType) {
    case 'nvidia':
      return tryNVIDIAGPU(capabilities, model, correlationId);

    case 'intel':
      return tryIntelGPU(capabilities, model, correlationId);

    case 'amd': // ✅ NEW: AMD GPU support for requirements #4, #7, #8
      return tryAMDGPU(capabilities, model, correlationId);

    case 'apple':
      return tryAppleGPU(capabilities, model, correlationId);

    case 'cpu':
      return {
        type: 'cpu',
        path: getCPUAddonName(),
        displayName: 'CPU Processing',
        deviceConfig: null,
      };

    default:
      logMessage(
        `Unknown GPU type: ${gpuType}`,
        'warning',
        LogCategory.GPU_DETECTION,
        { gpuType, availableTypes: ['nvidia', 'intel', 'amd', 'apple', 'cpu'] },
        correlationId,
      );
      return null;
  }
}

/**
 * Try NVIDIA CUDA GPU
 * Enhanced with version-specific CUDA detection (Requirement #2)
 */
function tryNVIDIAGPU(
  capabilities: GPUCapabilities,
  model: string,
  correlationId?: string,
): AddonInfo | null {
  if (!capabilities.nvidia) {
    logGPUDetectionEvent(
      'gpu_found',
      {
        gpuType: 'nvidia',
        available: false,
        reason: 'NVIDIA GPU not detected',
      },
      correlationId,
    );
    return null;
  }

  // Enhanced CUDA version detection (Requirement #2)
  const cudaInfo = checkCudaSupport();
  if (!cudaInfo) {
    logGPUDetectionEvent(
      'gpu_validated',
      {
        gpuType: 'nvidia',
        validated: false,
        reason:
          'CUDA not available or detection failed - attempting OpenVINO fallback',
      },
      correlationId,
    );

    // Edge case: CUDA installation failures - Automatic fallback to OpenVINO
    logMessage(
      'CUDA installation failure detected, attempting OpenVINO fallback',
      'info',
    );

    // Check if Intel GPUs are available for OpenVINO fallback
    if (capabilities.intel.length > 0) {
      logMessage(
        'Intel GPU detected, falling back to OpenVINO processing',
        'info',
      );
      return tryIntelGPU(capabilities, model, correlationId);
    }

    // If no Intel GPU, try CPU with OpenVINO if available
    if (capabilities.openvinoVersion) {
      logMessage('No Intel GPU for fallback, trying CPU with OpenVINO', 'info');
      return {
        type: 'openvino',
        path: getOpenVINOAddonName(),
        displayName: 'CPU Processing with OpenVINO (CUDA Fallback)',
        deviceConfig: {
          driverVersion: 'CUDA fallback',
        },
      };
    }

    return null;
  }

  if (!validateModelSupport('cuda', model)) {
    logGPUDetectionEvent(
      'gpu_validated',
      {
        gpuType: 'nvidia',
        validated: false,
        reason: `Model ${model} not supported on CUDA`,
        cudaVersion: cudaInfo.version,
      },
      correlationId,
    );
    return null;
  }

  // Log successful NVIDIA GPU detection with CUDA version info
  logGPUDetectionEvent(
    'gpu_found',
    {
      gpuType: 'nvidia',
      available: true,
      model,
      validated: true,
      cudaVersion: cudaInfo.version,
      driverVersion: cudaInfo.driverVersion,
      versionSpecificAddon: cudaInfo.addonName,
    },
    correlationId,
  );

  return {
    type: 'cuda',
    path: cudaInfo.addonName, // ✅ NEW: Use version-specific addon name
    displayName: `NVIDIA CUDA GPU (CUDA ${cudaInfo.version})`, // ✅ NEW: Include version in display name
    deviceConfig: {
      cudaVersion: cudaInfo.version,
      driverVersion: cudaInfo.driverVersion,
      majorVersion: cudaInfo.majorVersion,
    },
  };
}

/**
 * Try Intel OpenVINO GPU
 */
function tryIntelGPU(
  capabilities: GPUCapabilities,
  model: string,
  correlationId?: string,
): AddonInfo | null {
  if (capabilities.intel.length === 0) {
    logGPUDetectionEvent(
      'gpu_found',
      {
        gpuType: 'intel',
        available: false,
        reason: 'No Intel GPU detected',
      },
      correlationId,
    );
    return null;
  }

  if (!capabilities.openvinoVersion) {
    logGPUDetectionEvent(
      'gpu_validated',
      {
        gpuType: 'intel',
        validated: false,
        reason: 'OpenVINO toolkit not available',
        intelGPUCount: capabilities.intel.length,
      },
      correlationId,
    );
    return null;
  }

  if (!validateModelSupport('openvino', model)) {
    logGPUDetectionEvent(
      'gpu_validated',
      {
        gpuType: 'intel',
        validated: false,
        reason: `Model ${model} not supported on OpenVINO`,
        intelGPUCount: capabilities.intel.length,
        openvinoVersion: capabilities.openvinoVersion,
      },
      correlationId,
    );
    return null;
  }

  const bestIntelGPU = selectBestIntelGPU(capabilities.intel, model);

  if (!bestIntelGPU) {
    logGPUDetectionEvent(
      'gpu_validated',
      {
        gpuType: 'intel',
        validated: false,
        reason: 'No suitable Intel GPU found for model requirements',
        intelGPUCount: capabilities.intel.length,
        model,
        modelMemoryRequirements: getModelMemoryRequirements(model),
      },
      correlationId,
    );
    return null;
  }

  // Log successful Intel GPU selection
  logGPUDetectionEvent(
    'gpu_found',
    {
      gpuType: 'intel',
      available: true,
      selectedGPU: {
        name: bestIntelGPU.name,
        deviceId: bestIntelGPU.deviceId,
        memory: bestIntelGPU.memory,
        type: bestIntelGPU.type,
      },
      model,
      openvinoVersion: capabilities.openvinoVersion,
    },
    correlationId,
  );

  return {
    type: 'openvino',
    path: getOpenVINOAddonName(),
    displayName: `Intel ${bestIntelGPU.name}`,
    deviceConfig: {
      deviceId: bestIntelGPU.deviceId,
      memory: bestIntelGPU.memory,
      type: bestIntelGPU.type,
    },
  };
}

/**
 * Try Apple CoreML GPU
 */
function tryAppleGPU(
  capabilities: GPUCapabilities,
  model: string,
  correlationId?: string,
): AddonInfo | null {
  if (!capabilities.apple) {
    logGPUDetectionEvent(
      'gpu_found',
      {
        gpuType: 'apple',
        available: false,
        reason: 'Apple CoreML not available',
      },
      correlationId,
    );
    return null;
  }

  if (!isAppleSilicon()) {
    logGPUDetectionEvent(
      'gpu_validated',
      {
        gpuType: 'apple',
        validated: false,
        reason: 'Not running on Apple Silicon',
        platform: process.platform,
        arch: process.arch,
      },
      correlationId,
    );
    return null;
  }

  if (!hasEncoderModel(model)) {
    logGPUDetectionEvent(
      'gpu_validated',
      {
        gpuType: 'apple',
        validated: false,
        reason: `CoreML encoder model not available for ${model}`,
        model,
      },
      correlationId,
    );
    return null;
  }

  if (!validateModelSupport('coreml', model)) {
    logGPUDetectionEvent(
      'gpu_validated',
      {
        gpuType: 'apple',
        validated: false,
        reason: `Model ${model} not supported on CoreML`,
        model,
      },
      correlationId,
    );
    return null;
  }

  // Log successful Apple GPU selection
  logGPUDetectionEvent(
    'gpu_found',
    {
      gpuType: 'apple',
      available: true,
      model,
      validated: true,
      platform: process.platform,
      arch: process.arch,
    },
    correlationId,
  );

  return {
    type: 'coreml',
    path: getCoreMLAddonName(),
    displayName: 'Apple CoreML',
    deviceConfig: null,
  };
}

/**
 * Enhanced AMD Windows Fallback Chain (Requirement #7)
 * Implements: OpenVINO → no-cuda → CPU fallback sequence
 */
function tryAMDWindowsFallbackChain(
  capabilities: GPUCapabilities,
  model: string,
  correlationId?: string,
): AddonInfo | null {
  const fallbackChain = ['openvino', 'no-cuda', 'cpu'];
  const platform = 'win32';

  for (let i = 0; i < fallbackChain.length; i++) {
    const fallbackType = fallbackChain[i];

    try {
      const addonInfo = tryFallbackOption(
        fallbackType,
        capabilities,
        model,
        platform,
        correlationId,
      );

      if (addonInfo) {
        logGPUDetectionEvent(
          'gpu_validated',
          {
            gpuType: 'amd',
            validated: true,
            reason: `AMD on Windows - successful ${fallbackType} fallback`,
            fallbackChain,
            selectedFallback: fallbackType,
            fallbackIndex: i,
            platform,
          },
          correlationId,
        );

        return addonInfo;
      }
    } catch (error) {
      logGPUDetectionEvent(
        'gpu_validated',
        {
          gpuType: 'amd',
          validated: false,
          reason: `AMD on Windows - ${fallbackType} fallback failed: ${error.message}`,
          fallbackChain,
          failedFallback: fallbackType,
          fallbackIndex: i,
          platform,
          error: error.message,
        },
        correlationId,
      );
      // Continue to next fallback option
    }
  }

  // All fallbacks failed
  logGPUDetectionEvent(
    'gpu_validated',
    {
      gpuType: 'amd',
      validated: false,
      reason: 'AMD on Windows - all fallback options exhausted',
      fallbackChain,
      platform,
      allFallbacksFailed: true,
    },
    correlationId,
  );

  return null;
}

/**
 * Try a specific fallback option in the AMD Windows fallback chain
 */
function tryFallbackOption(
  fallbackType: string,
  capabilities: GPUCapabilities,
  _model: string,
  _platform: string,
  _correlationId?: string,
): AddonInfo | null {
  switch (fallbackType) {
    case 'openvino':
      // Try OpenVINO addon
      if (capabilities.openvinoVersion !== false) {
        return {
          type: 'openvino',
          path: getOpenVINOAddonName(),
          displayName: 'CPU Processing (AMD GPU detected - OpenVINO)',
          deviceConfig: null,
          fallbackReason:
            'AMD GPU detected - CPU processing with OpenVINO (primary fallback)',
        };
      }
      throw new Error('OpenVINO toolkit not available');

    case 'no-cuda':
      // Try no-CUDA addon (Windows-specific fallback)
      try {
        const noCudaPath = getNoCudaAddonName();
        return {
          type: 'cpu',
          path: noCudaPath,
          displayName: 'CPU Processing (AMD GPU detected - No CUDA)',
          deviceConfig: null,
          fallbackReason:
            'AMD GPU detected - CPU processing with no-CUDA addon (secondary fallback)',
        };
      } catch (error) {
        throw new Error(`No-CUDA addon not available: ${error.message}`);
      }

    case 'cpu':
      // Emergency CPU fallback
      return {
        type: 'cpu',
        path: getCPUAddonName(),
        displayName: 'CPU Processing (AMD GPU detected - Emergency CPU)',
        deviceConfig: null,
        fallbackReason:
          'AMD GPU detected - emergency CPU processing (final fallback)',
      };

    default:
      throw new Error(`Unknown fallback type: ${fallbackType}`);
  }
}

/**
 * Try AMD GPU (Requirements #4, #7, #8)
 * AMD GPUs are handled with CPU-only processing and appropriate fallback chains
 */
function tryAMDGPU(
  capabilities: GPUCapabilities,
  model: string,
  correlationId?: string,
): AddonInfo | null {
  if (capabilities.amd.length === 0) {
    logGPUDetectionEvent(
      'gpu_found',
      {
        gpuType: 'amd',
        available: false,
        reason: 'No AMD GPU detected',
      },
      correlationId,
    );
    return null;
  }

  // AMD GPUs detected - apply CPU-only policy per requirements
  const platform = process.platform;
  const arch = process.arch;

  logGPUDetectionEvent(
    'gpu_found',
    {
      gpuType: 'amd',
      available: true,
      amdGPUCount: capabilities.amd.length,
      platform,
      arch,
      policy: 'cpu_only_processing',
    },
    correlationId,
  );

  // Requirements #4, #7, #8: AMD GPUs → CPU support ONLY with appropriate addon
  if (platform === 'win32') {
    // Requirement #7: AMD + Windows → Enhanced fallback chain: OpenVINO → no-cuda → CPU
    return tryAMDWindowsFallbackChain(capabilities, model, correlationId);
  } else if (platform === 'linux') {
    // Requirement #8: AMD + Linux → CPU only + OpenVINO
    logGPUDetectionEvent(
      'gpu_validated',
      {
        gpuType: 'amd',
        validated: true,
        reason: 'AMD on Linux - using OpenVINO with CPU-only processing',
        fallback: 'openvino',
        platform,
      },
      correlationId,
    );

    return {
      type: 'openvino',
      path: getOpenVINOAddonName(),
      displayName: 'CPU Processing (AMD GPU detected - OpenVINO)',
      deviceConfig: null,
      fallbackReason: 'AMD GPU detected - CPU processing with OpenVINO',
    };
  } else if (platform === 'darwin' && arch === 'x64') {
    // Requirement #4: AMD/NVIDIA + macOS Intel → CPU only + OpenVINO
    logGPUDetectionEvent(
      'gpu_validated',
      {
        gpuType: 'amd',
        validated: true,
        reason: 'AMD on macOS Intel - using OpenVINO with CPU-only processing',
        fallback: 'openvino',
        platform,
        arch,
      },
      correlationId,
    );

    return {
      type: 'openvino',
      path: getOpenVINOAddonName(),
      displayName: 'CPU Processing (AMD GPU detected - OpenVINO)',
      deviceConfig: null,
      fallbackReason: 'AMD GPU detected - CPU processing with OpenVINO',
    };
  }

  // Unsupported platform combination
  logGPUDetectionEvent(
    'gpu_validated',
    {
      gpuType: 'amd',
      validated: false,
      reason: 'AMD GPU detected on unsupported platform combination',
      platform,
      arch,
    },
    correlationId,
  );

  return null;
}

/**
 * Resolve specific GPU by ID (user override)
 */
export function resolveSpecificGPU(
  gpuId: string,
  capabilities: GPUCapabilities,
): AddonInfo | null {
  const correlationId = generateCorrelationId();

  logMessage(
    `User-requested specific GPU resolution: ${gpuId}`,
    'info',
    LogCategory.GPU_DETECTION,
    {
      requestedGpuId: gpuId,
      systemCapabilities: {
        nvidia: capabilities.nvidia,
        intelCount: capabilities.intel.length,
        apple: capabilities.apple,
      },
    },
    correlationId,
  );

  if (gpuId === 'auto') {
    return null; // Let automatic selection handle this
  }

  // Handle NVIDIA GPU selection (Enhanced with version-specific CUDA - Requirement #2)
  if (gpuId.includes('nvidia') && capabilities.nvidia) {
    const cudaInfo = checkCudaSupport();

    if (cudaInfo) {
      return {
        type: 'cuda',
        path: cudaInfo.addonName, // ✅ NEW: Use version-specific addon
        displayName: `NVIDIA CUDA GPU (CUDA ${cudaInfo.version} - User Selected)`,
        deviceConfig: {
          cudaVersion: cudaInfo.version,
          driverVersion: cudaInfo.driverVersion,
          majorVersion: cudaInfo.majorVersion,
        },
      };
    } else {
      // Fallback if CUDA detection fails
      return {
        type: 'cuda',
        path: getCUDAAddonName(),
        displayName: 'NVIDIA CUDA GPU (User Selected)',
        deviceConfig: null,
      };
    }
  }

  // Handle Intel GPU selection
  if (gpuId.includes('intel')) {
    const intelGPU = capabilities.intelAll.find((gpu) => gpu.id === gpuId);

    if (intelGPU && capabilities.openvinoVersion) {
      return {
        type: 'openvino',
        path: getOpenVINOAddonName(),
        displayName: `Intel ${intelGPU.name} (User Selected)`,
        deviceConfig: {
          deviceId: intelGPU.deviceId,
          memory: intelGPU.memory,
          type: intelGPU.type,
        },
      };
    }
  }

  // Handle AMD GPU selection (Requirements #4, #7, #8)
  if (gpuId.includes('amd') && capabilities.amd.length > 0) {
    // AMD GPUs always result in CPU-only processing per requirements
    const platform = process.platform;

    if (platform === 'win32') {
      // Requirement #7: AMD + Windows → CPU only + OpenVINO/fallback
      return {
        type: 'openvino',
        path: getOpenVINOAddonName(),
        displayName: 'CPU Processing (AMD GPU - User Selected)',
        deviceConfig: null,
        fallbackReason: 'AMD GPU selected - CPU processing with OpenVINO',
      };
    } else if (
      platform === 'linux' ||
      (platform === 'darwin' && process.arch === 'x64')
    ) {
      // Requirements #8, #4: AMD + Linux/macOS Intel → CPU only + OpenVINO
      return {
        type: 'openvino',
        path: getOpenVINOAddonName(),
        displayName: 'CPU Processing (AMD GPU - User Selected)',
        deviceConfig: null,
        fallbackReason: 'AMD GPU selected - CPU processing with OpenVINO',
      };
    }
  }

  // Handle Apple GPU selection
  if (gpuId.includes('apple') && capabilities.apple) {
    return {
      type: 'coreml',
      path: getCoreMLAddonName(),
      displayName: 'Apple CoreML (User Selected)',
      deviceConfig: null,
    };
  }

  // Handle CPU selection
  if (gpuId.includes('cpu')) {
    return {
      type: 'cpu',
      path: getCPUAddonName(),
      displayName: 'CPU Processing (User Selected)',
      deviceConfig: null,
    };
  }

  logGPUDetectionEvent(
    'detection_failed',
    {
      requestedGpuId: gpuId,
      reason: 'GPU ID not found or not available',
      systemCapabilities: capabilities,
    },
    correlationId,
  );

  return null;
}

/**
 * Select best Intel GPU based on model requirements
 */
export function selectBestIntelGPU(
  intelGPUs: any[],
  model: string,
): any | null {
  if (intelGPUs.length === 0) {
    return null;
  }

  // Filter by memory requirements
  const modelMemoryRequirements = getModelMemoryRequirements(model);
  const suitableGPUs = intelGPUs.filter((gpu) => validateGPUMemory(gpu, model));

  if (suitableGPUs.length === 0) {
    logMessage(
      `No Intel GPU has sufficient memory for model ${model}`,
      'warning',
      LogCategory.GPU_DETECTION,
      {
        model,
        requiredMemoryMB: modelMemoryRequirements,
        availableGPUs: intelGPUs.map((gpu) => ({
          name: gpu.name,
          memory: gpu.memory,
          type: gpu.type,
        })),
      },
    );
    return null;
  }

  // Sort by preference: discrete > integrated, then by performance
  const sortedGPUs = suitableGPUs.sort((a, b) => {
    // Prefer discrete over integrated
    if (a.type !== b.type) {
      return a.type === 'discrete' ? -1 : 1;
    }

    // Within same type, prefer higher performance
    const perfOrder = { high: 0, medium: 1, low: 2 };
    return perfOrder[a.performance] - perfOrder[b.performance];
  });

  return sortedGPUs[0];
}

/**
 * Validate if GPU has sufficient memory for model
 */
export function validateGPUMemory(gpu: any, model: string): boolean {
  const requiredMemory = getModelMemoryRequirements(model);

  // Handle shared memory (integrated GPUs)
  if (gpu.memory === 'shared') {
    // Assume integrated GPUs can handle models up to 'medium' size
    return ['tiny', 'base', 'small', 'medium'].includes(model);
  }

  // For discrete GPUs, check actual memory
  return gpu.memory >= requiredMemory;
}

/**
 * Get memory requirements for whisper models
 */
export function getModelMemoryRequirements(model: string): number {
  const requirements = {
    tiny: 1024, // 1GB
    base: 1024, // 1GB
    small: 2048, // 2GB
    medium: 3072, // 3GB
    large: 6400, // 6.4GB (realistic for FP16)
    'large-v2': 6400, // 6.4GB
    'large-v3': 6400, // 6.4GB
  };

  return requirements[model] || 2048; // Default to 2GB for unknown models
}

/**
 * Validate if addon type supports the model
 */
export function validateModelSupport(
  addonType: string,
  model: string,
): boolean {
  // All addon types support all standard whisper models
  const supportedModels = [
    'tiny',
    'base',
    'small',
    'medium',
    'large',
    'large-v2',
    'large-v3',
  ];

  // Check if it's a standard model
  if (supportedModels.includes(model)) {
    return true;
  }

  // Handle quantized models
  if (model.includes('-q5_') || model.includes('-q8_')) {
    // Quantized models might have different support
    const baseModel = model.split('-q')[0];
    return supportedModels.includes(baseModel);
  }

  // For unknown models, assume supported but log warning
  logMessage(
    `Unknown model validation - assuming supported`,
    'warning',
    LogCategory.GPU_DETECTION,
    {
      model,
      addonType,
      assumption: 'supported',
      knownModels: supportedModels,
    },
  );
  return true;
}

/**
 * Get GPU selection configuration from settings
 */
export function getGPUSelectionConfig() {
  const settings: any = store.get('settings') || {};

  return {
    useCuda: settings.useCuda || false,
    useOpenVINO: settings.useOpenVINO || false,
    selectedGPUId: settings.selectedGPUId || 'auto',
    gpuPreference: settings.gpuPreference || [
      'nvidia',
      'intel',
      'amd', // ✅ NEW: AMD GPU in preference order
      'apple',
      'cpu',
    ],
    gpuAutoDetection: settings.gpuAutoDetection !== false, // Default to true
  };
}

/**
 * Log GPU selection decision for debugging
 */
export function logGPUSelection(
  addonInfo: AddonInfo,
  capabilities: GPUCapabilities,
): void {
  const correlationId = generateCorrelationId();

  const logData = {
    selectedAddon: {
      type: addonInfo.type,
      displayName: addonInfo.displayName,
      deviceConfig: addonInfo.deviceConfig,
      fallbackReason: addonInfo.fallbackReason,
    },
    systemCapabilities: {
      nvidia: capabilities.nvidia,
      intelGPUCount: capabilities.intel.length,
      amdGPUCount: capabilities.amd.length, // ✅ NEW: AMD GPU count logging
      apple: capabilities.apple,
      openvinoVersion: capabilities.openvinoVersion,
      multiGPU: capabilities.capabilities.multiGPU,
      hybridSystem: capabilities.capabilities.hybridSystem,
    },
    userSettings: getGPUSelectionConfig(),
  };

  logMessage(
    'Final GPU selection decision logged',
    'info',
    LogCategory.GPU_DETECTION,
    logData,
    correlationId,
  );
}
