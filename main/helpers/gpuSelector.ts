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
import { detectAvailableGPUs } from './hardware/hardwareDetection';
import { checkOpenVINOSupport } from './hardware/openvinoDetection';
import { checkCudaSupport } from './cudaUtils';
import { store } from './store';
import { isAppleSilicon } from './utils';
import { hasEncoderModel } from './whisper';

/**
 * Get platform-specific addon filename for each acceleration type
 */
function getCUDAAddonName(): string {
  switch (process.platform) {
    case 'win32':
      return 'addon-windows-cuda.node';
    case 'linux':
      return 'addon-linux-cuda.node';
    default:
      return 'addon-cuda.node'; // Fallback for unsupported platforms
  }
}

function getOpenVINOAddonName(): string {
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

function getCoreMLAddonName(): string {
  switch (process.platform) {
    case 'darwin':
      return process.arch === 'arm64'
        ? 'addon-macos-arm64-coreml.node'
        : 'addon-macos-coreml.node';
    default:
      return 'addon-coreml.node'; // Fallback for non-macOS
  }
}

function getCPUAddonName(): string {
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

export interface AddonInfo {
  type: 'cuda' | 'openvino' | 'coreml' | 'cpu';
  path: string;
  displayName: string;
  deviceConfig: {
    deviceId?: string;
    memory?: number | 'shared';
    type?: 'discrete' | 'integrated';
  } | null;
  fallbackReason?: string;
}

export interface GPUCapabilities {
  nvidia: boolean;
  intel: any[];
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

  // Emergency CPU fallback
  logGPUDetectionEvent(
    'detection_completed',
    {
      finalSelection: {
        type: 'cpu',
        reason: 'All GPU acceleration methods unavailable',
      },
      totalPriorityOptions: priority.length,
      successfulSelection: false,
      emergencyFallback: true,
    },
    correlationId,
  );

  return {
    type: 'cpu',
    path: getCPUAddonName(),
    displayName: 'CPU Processing (Emergency Fallback)',
    deviceConfig: null,
    fallbackReason: 'All GPU acceleration methods unavailable',
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
        { gpuType, availableTypes: ['nvidia', 'intel', 'apple', 'cpu'] },
        correlationId,
      );
      return null;
  }
}

/**
 * Try NVIDIA CUDA GPU
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

  if (!validateModelSupport('cuda', model)) {
    logGPUDetectionEvent(
      'gpu_validated',
      {
        gpuType: 'nvidia',
        validated: false,
        reason: `Model ${model} not supported on CUDA`,
      },
      correlationId,
    );
    return null;
  }

  // Log successful NVIDIA GPU detection
  logGPUDetectionEvent(
    'gpu_found',
    {
      gpuType: 'nvidia',
      available: true,
      model,
      validated: true,
    },
    correlationId,
  );

  return {
    type: 'cuda',
    path: getCUDAAddonName(),
    displayName: 'NVIDIA CUDA GPU',
    deviceConfig: null,
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

  // Handle NVIDIA GPU selection
  if (gpuId.includes('nvidia') && capabilities.nvidia) {
    return {
      type: 'cuda',
      path: getCUDAAddonName(),
      displayName: 'NVIDIA CUDA GPU (User Selected)',
      deviceConfig: null,
    };
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
  const settings = store.get('settings') || {};

  return {
    useCuda: settings.useCuda || false,
    useOpenVINO: settings.useOpenVINO || false,
    selectedGPUId: settings.selectedGPUId || 'auto',
    gpuPreference: settings.gpuPreference || [
      'nvidia',
      'intel',
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
