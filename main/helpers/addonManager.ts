/**
 * Addon Manager for Intel OpenVINO Integration
 * Comprehensive addon loading system with intelligent selection and error recovery
 */

import path from 'path';
import fs from 'fs';
import { getExtraResourcesPath } from './utils';
import {
  logMessage,
  logOpenVINOAddonEvent,
  logAddonLoadingEvent,
  generateCorrelationId,
  logPerformanceMetrics,
  LogCategory,
} from './logger';
import { AddonInfo } from './gpuSelector';

export interface WhisperFunction {
  (params: any, callback: (error: Error | null, result?: any) => void): void;
}

export interface LoadedAddon {
  whisper: WhisperFunction;
  type: string;
  displayName: string;
  deviceConfig: any;
}

/**
 * Load and validate addon based on addon info
 */
export async function loadAndValidateAddon(
  addonInfo: AddonInfo,
): Promise<WhisperFunction> {
  const correlationId = generateCorrelationId();
  const addonPath = resolveAddonPath(addonInfo.path);

  // Log addon loading attempt with detailed context
  logAddonLoadingEvent(
    'load_attempt',
    addonInfo.type,
    {
      addonPath,
      displayName: addonInfo.displayName,
      deviceConfig: addonInfo.deviceConfig,
    },
    correlationId,
  );

  try {
    const startTime = Date.now();

    // Special handling for OpenVINO addon loading
    if (addonInfo.type === 'openvino') {
      const whisperFunc = await loadOpenVINOAddon(
        addonInfo,
        addonPath,
        correlationId,
      );

      // Log successful OpenVINO addon loading with performance metrics
      const loadTime = Date.now() - startTime;
      logPerformanceMetrics(
        'openvino_addon_loading',
        {
          duration: loadTime,
          addonType: 'openvino',
          deviceId: addonInfo.deviceConfig?.deviceId,
        },
        correlationId,
      );

      return whisperFunc;
    }

    // Standard addon loading for other types
    const module = { exports: { whisper: null } };
    process.dlopen(module, addonPath);

    // Validate addon structure
    validateAddonStructure(module);

    if (!module.exports || !module.exports.whisper) {
      throw new Error(
        `Addon loaded but whisper function not found in ${addonPath}`,
      );
    }

    // Test addon functionality (skip for CoreML to avoid validation issues)
    if (addonInfo.type !== 'coreml') {
      await validateAddonFunctionality(module.exports.whisper, addonInfo);
    } else {
      logMessage(
        'Skipping validation for CoreML addon (file existence already verified)',
        'debug',
      );
    }

    // Log successful addon loading
    const loadTime = Date.now() - startTime;
    logAddonLoadingEvent(
      'load_success',
      addonInfo.type,
      {
        addonPath,
        loadTime,
        validated: true,
      },
      correlationId,
    );

    logPerformanceMetrics(
      'addon_loading',
      {
        duration: loadTime,
        addonType: addonInfo.type,
      },
      correlationId,
    );

    return module.exports.whisper;
  } catch (error) {
    // Log addon loading failure with detailed error context
    logAddonLoadingEvent(
      'load_failed',
      addonInfo.type,
      {
        addonPath,
        errorMessage: error.message,
        errorStack: error.stack,
      },
      correlationId,
    );

    throw new Error(`Addon loading failed: ${error.message}`);
  }
}

/**
 * Resolve addon path - now simplified to directly use platform-specific files
 */
function resolveAddonPath(addonFileName: string): string {
  const addonsDir = path.join(getExtraResourcesPath(), 'addons');
  const directPath = path.join(addonsDir, addonFileName);

  // Check if the platform-specific addon file exists directly
  if (fs.existsSync(directPath)) {
    logMessage(`Using platform-specific addon: ${addonFileName}`, 'debug');
    return directPath;
  }

  // Log missing file for debugging
  logMessage(`Platform-specific addon not found: ${addonFileName}`, 'warning');

  // Return path anyway - let the loading process handle the error
  return directPath;
}

/**
 * Resolve addon path using addon manifest (packaged distribution)
 */
function resolveAddonPathWithManifest(
  addonFileName: string,
  addonsDir: string,
  manifest: any,
): string {
  // Map generic addon names to addon types
  const addonTypeMapping = {
    'addon-cuda.node': 'cuda',
    'addon-openvino.node': 'openvino',
    'addon-coreml.node': 'coreml',
    'addon-cpu.node': 'cpu',
    'addon.node': 'cpu', // Standard fallback
  };

  const requestedType = addonTypeMapping[addonFileName];
  if (!requestedType) {
    logMessage(`Unknown addon type for: ${addonFileName}`, 'warning');
    return path.join(addonsDir, addonFileName);
  }

  // Check if requested addon type is available in manifest
  if (
    manifest.addons &&
    manifest.addons[requestedType] &&
    manifest.addons[requestedType].available
  ) {
    const availableAddon = manifest.addons[requestedType];
    const resolvedPath = path.join(addonsDir, availableAddon.filename);

    logMessage(
      `Resolved ${requestedType} addon from manifest: ${availableAddon.filename}`,
      'debug',
    );

    // Verify file actually exists
    if (fs.existsSync(resolvedPath)) {
      return resolvedPath;
    } else {
      logMessage(
        `Manifest references missing file: ${availableAddon.filename}`,
        'warning',
      );
    }
  }

  // Fallback to direct file check
  logMessage(
    `Requested addon type ${requestedType} not found in manifest, falling back`,
    'warning',
  );
  return findFallbackAddon(addonsDir, requestedType);
}

/**
 * Get OpenVINO addon name based on platform and architecture
 */
function getOpenVINOAddonName(): string {
  switch (process.platform) {
    case 'win32':
      return 'addon-windows-openvino.node';
    case 'linux':
      return 'addon-linux-openvino.node';
    case 'darwin':
      // macOS: distinguish between ARM64 and x64
      return process.arch === 'arm64'
        ? 'addon-macos-arm-openvino.node'
        : 'addon-macos-x86-openvino.node';
    default:
      return 'addon-openvino.node'; // Fallback
  }
}

/**
 * Legacy addon path resolution (development/non-packaged)
 */
function resolveAddonPathLegacy(
  addonFileName: string,
  addonsDir: string,
): string {
  // Map addon types to actual file names based on platform
  const addonMapping = {
    'addon-cuda.node':
      process.platform === 'win32'
        ? 'addon-windows-cuda.node'
        : 'addon-linux-cuda.node',
    'addon-openvino.node': getOpenVINOAddonName(),
    'addon-coreml.node': 'addon-macos-coreml.node',
    'addon-cpu.node':
      process.platform === 'win32'
        ? 'addon-windows-cpu.node'
        : 'addon-linux-cpu.node',
  };

  const mappedFileName = addonMapping[addonFileName] || addonFileName;
  const fullPath = path.join(addonsDir, mappedFileName);

  logMessage(`Resolved addon path (legacy): ${fullPath}`, 'debug');

  return fullPath;
}

/**
 * Find fallback addon when requested type is not available
 */
function findFallbackAddon(addonsDir: string, requestedType: string): string {
  // Define fallback priority based on requested type
  const fallbackPriority = {
    openvino: [
      'addon-windows-openvino.node',
      'addon-linux-openvino.node',
      'addon-macos-arm-openvino.node',
      'addon-macos-x86-openvino.node',
      'addon.coreml.node',
      'addon.node',
    ],
    cuda: ['addon-windows-cuda.node', 'addon-linux-cuda.node', 'addon.node'],
    coreml: ['addon.coreml.node', 'addon.node'],
    cpu: ['addon.node'],
  };

  const fallbacks = fallbackPriority[requestedType] || ['addon.node'];

  for (const fallbackFile of fallbacks) {
    const fallbackPath = path.join(addonsDir, fallbackFile);

    if (fs.existsSync(fallbackPath)) {
      logMessage(
        `Using fallback addon: ${fallbackFile} for ${requestedType}`,
        'info',
      );
      return fallbackPath;
    }
  }

  // Ultimate fallback - return requested path anyway (will fail later)
  logMessage(`No suitable fallback found for ${requestedType}`, 'error');
  return path.join(addonsDir, 'addon.node');
}

/**
 * Setup OpenVINO environment variables
 */
export function setupOpenVINOEnvironment(deviceConfig: any): void {
  if (!deviceConfig) {
    process.env.OPENVINO_DEVICE_ID = 'CPU';
    return;
  }

  // Set OpenVINO device ID
  if (deviceConfig.deviceId) {
    process.env.OPENVINO_DEVICE_ID = deviceConfig.deviceId;
    logMessage(`Set OPENVINO_DEVICE_ID=${deviceConfig.deviceId}`, 'debug');
  }

  // Get settings from store for additional OpenVINO preferences
  const { store } = require('./storeManager');
  const settings = store.get('settings') || {};
  const openvinoPreferences = settings.openvinoPreferences || {};

  // Set OpenVINO cache directory
  const cacheDir =
    openvinoPreferences.cacheDir ||
    path.join(
      process.env.HOME || process.env.USERPROFILE || '',
      '.openvino-cache',
    );
  process.env.OPENVINO_CACHE_DIR = cacheDir;
  logMessage(`Set OPENVINO_CACHE_DIR=${cacheDir}`, 'debug');

  // Set optimizations
  process.env.OPENVINO_ENABLE_OPTIMIZATIONS =
    openvinoPreferences.enableOptimizations !== false ? 'true' : 'false';

  // Set OpenVINO performance hints
  if (deviceConfig.type === 'discrete') {
    process.env.OPENVINO_PERFORMANCE_HINT = 'THROUGHPUT';
  } else {
    process.env.OPENVINO_PERFORMANCE_HINT = 'LATENCY';
  }
}

/**
 * Setup OpenVINO environment variables (internal version)
 */
function setupOpenVINOEnvironmentInternal(addonInfo: AddonInfo): void {
  if (!addonInfo.deviceConfig) {
    return;
  }

  // Set OpenVINO device ID
  if (addonInfo.deviceConfig.deviceId) {
    process.env.OPENVINO_GPU_DEVICE = addonInfo.deviceConfig.deviceId;
    logMessage(
      `Set OPENVINO_GPU_DEVICE=${addonInfo.deviceConfig.deviceId}`,
      'debug',
    );
  }

  // Set OpenVINO cache directory
  const cacheDir =
    process.env.OPENVINO_CACHE_DIR ||
    path.join(
      process.env.HOME || process.env.USERPROFILE || '',
      '.openvino-cache',
    );
  process.env.OPENVINO_CACHE_DIR = cacheDir;
  logMessage(`Set OPENVINO_CACHE_DIR=${cacheDir}`, 'debug');

  // Set OpenVINO performance hints
  if (addonInfo.deviceConfig.type === 'discrete') {
    process.env.OPENVINO_PERFORMANCE_HINT = 'THROUGHPUT';
  } else {
    process.env.OPENVINO_PERFORMANCE_HINT = 'LATENCY';
  }
}

/**
 * Validate addon functionality with a simple test call
 */
async function validateAddonFunctionality(
  whisperFunc: WhisperFunction,
  addonInfo: AddonInfo,
): Promise<void> {
  return new Promise((resolve, reject) => {
    // Create minimal test parameters
    const testParams = {
      model: '', // Empty model path for validation test
      validate_only: true, // Custom flag to indicate validation mode
    };

    const timeout = setTimeout(() => {
      reject(new Error('Addon validation timeout'));
    }, 5000);

    try {
      whisperFunc(testParams, (error: Error | null, result?: any) => {
        clearTimeout(timeout);

        if (
          error &&
          !error.message.includes('model') &&
          !error.message.includes('file')
        ) {
          // Ignore model-related errors during validation
          reject(new Error(`Addon validation failed: ${error.message}`));
        } else {
          // Addon is functional (model errors are expected during validation)
          resolve();
        }
      });
    } catch (syncError) {
      clearTimeout(timeout);
      reject(new Error(`Addon validation failed: ${syncError.message}`));
    }
  });
}

/**
 * Handle addon loading errors with recovery strategies
 */
export async function handleAddonLoadingError(
  error: Error,
  addonInfo: AddonInfo,
  fallbackOptions: AddonInfo[],
): Promise<WhisperFunction> {
  const recoveryCorrelationId = generateCorrelationId();

  // Log error recovery initiation
  logMessage(
    `Initiating error recovery for ${addonInfo.type} addon`,
    'info',
    LogCategory.ERROR_RECOVERY,
    {
      originalError: error.message,
      failedAddon: addonInfo,
      fallbackCount: fallbackOptions.length,
    },
    recoveryCorrelationId,
  );

  if (fallbackOptions.length === 0) {
    throw new Error('No fallback options available');
  }

  // Try fallback options
  for (const fallback of fallbackOptions) {
    try {
      logAddonLoadingEvent(
        'fallback_used',
        fallback.type,
        {
          originalAddon: addonInfo.type,
          fallbackReason: fallback.fallbackReason || error.message,
        },
        recoveryCorrelationId,
      );

      const whisperFunc = await loadAndValidateAddon(fallback);

      // Log successful recovery
      logMessage(
        `Successfully recovered using ${fallback.type} fallback`,
        'success',
        LogCategory.ERROR_RECOVERY,
        {
          originalAddon: addonInfo.type,
          fallbackAddon: fallback.type,
          recoverySuccessful: true,
        },
        recoveryCorrelationId,
      );

      return whisperFunc;
    } catch (fallbackError) {
      logMessage(
        `Fallback ${fallback.type} also failed: ${fallbackError.message}`,
        'warning',
        LogCategory.ERROR_RECOVERY,
        {
          fallbackAddon: fallback.type,
          fallbackError: fallbackError.message,
        },
        recoveryCorrelationId,
      );
    }
  }

  // If all fallbacks fail, log final failure and throw error
  logMessage(
    'All fallback options exhausted - complete addon loading failure',
    'error',
    LogCategory.ERROR_RECOVERY,
    {
      originalAddon: addonInfo.type,
      originalError: error.message,
      fallbackAttempts: fallbackOptions.length,
      allFallbacksFailed: true,
    },
    recoveryCorrelationId,
  );

  throw new Error('All fallback options exhausted');
}

/**
 * Create platform-aware fallback chain based on failed addon type
 */
export function createFallbackChain(failedAddonInfo: AddonInfo): AddonInfo[] {
  const fallbacks: AddonInfo[] = [];
  const platform = process.platform;
  const arch = process.arch;

  // Import platform-specific addon name functions
  const {
    getCUDAAddonName,
    getOpenVINOAddonName,
    getCoreMLAddonName,
    getCPUAddonName,
  } = require('./gpuSelector');

  // Platform-specific fallback logic
  if (platform === 'darwin' && arch === 'arm64') {
    // macOS ARM64: Only CPU fallback available
    if (failedAddonInfo.type === 'coreml') {
      fallbacks.push({
        type: 'cpu',
        path: getCPUAddonName(),
        displayName: 'CPU Processing (macOS ARM64 Fallback)',
        deviceConfig: null,
        fallbackReason: 'Apple CoreML failed',
      });
    }
  } else if (platform === 'darwin' && arch === 'x64') {
    // macOS Intel: OpenVINO → CPU
    if (failedAddonInfo.type === 'openvino') {
      fallbacks.push({
        type: 'cpu',
        path: getCPUAddonName(),
        displayName: 'CPU Processing (macOS Intel Fallback)',
        deviceConfig: null,
        fallbackReason: 'Intel OpenVINO failed',
      });
    }
  } else if (platform === 'win32') {
    // Windows: CUDA → OpenVINO → CPU
    switch (failedAddonInfo.type) {
      case 'cuda':
        fallbacks.push(
          {
            type: 'openvino',
            path: getOpenVINOAddonName(),
            displayName: 'Intel OpenVINO (Windows Fallback from CUDA)',
            deviceConfig: null,
            fallbackReason: 'NVIDIA CUDA failed',
          },
          {
            type: 'cpu',
            path: getCPUAddonName(),
            displayName: 'CPU Processing (Windows Final Fallback)',
            deviceConfig: null,
            fallbackReason: 'GPU acceleration failed',
          },
        );
        break;
      case 'openvino':
        fallbacks.push({
          type: 'cpu',
          path: getCPUAddonName(),
          displayName: 'CPU Processing (Windows Fallback)',
          deviceConfig: null,
          fallbackReason: 'Intel OpenVINO failed',
        });
        break;
    }
  } else if (platform === 'linux') {
    // Linux: OpenVINO → CPU
    if (failedAddonInfo.type === 'openvino') {
      fallbacks.push({
        type: 'cpu',
        path: getCPUAddonName(),
        displayName: 'CPU Processing (Linux Fallback)',
        deviceConfig: null,
        fallbackReason: 'Intel OpenVINO failed',
      });
    }
  }

  logMessage(
    `Created ${fallbacks.length} platform-specific fallback options for ${failedAddonInfo.type} on ${platform}-${arch}`,
    'debug',
  );

  return fallbacks;
}

/**
 * Log addon loading attempt for debugging
 */
export function logAddonLoadAttempt(addonInfo: AddonInfo | null): void {
  if (!addonInfo) {
    logMessage(
      'Addon loading attempt with null addon info',
      'warning',
      LogCategory.ADDON_LOADING,
    );
    return;
  }

  const context = {
    addonType: addonInfo.type,
    displayName: addonInfo.displayName,
    path: addonInfo.path,
    deviceConfig: addonInfo.deviceConfig,
    fallbackReason: addonInfo.fallbackReason,
  };

  logMessage(
    `Attempting to load ${addonInfo.type} addon`,
    'info',
    LogCategory.ADDON_LOADING,
    context,
  );
}

/**
 * Get addon performance info for monitoring
 */
export function getAddonPerformanceInfo(addonInfo: AddonInfo) {
  const performanceInfo = {
    type: addonInfo.type,
    expectedPerformance: getExpectedPerformance(addonInfo),
    powerEfficiency: getPowerEfficiency(addonInfo),
    memoryUsage: getExpectedMemoryUsage(addonInfo),
  };

  return performanceInfo;
}

/**
 * Get expected performance characteristics
 */
function getExpectedPerformance(addonInfo: AddonInfo): string {
  switch (addonInfo.type) {
    case 'cuda':
      return 'high'; // NVIDIA GPUs typically offer high performance

    case 'openvino':
      if (addonInfo.deviceConfig?.type === 'discrete') {
        return 'high'; // Intel Arc discrete GPUs
      } else {
        return 'medium'; // Intel integrated GPUs
      }

    case 'coreml':
      return 'medium'; // Apple CoreML performance varies by chip

    case 'cpu':
      return 'low'; // CPU is baseline performance

    default:
      return 'unknown';
  }
}

/**
 * Get power efficiency characteristics
 */
function getPowerEfficiency(addonInfo: AddonInfo): string {
  switch (addonInfo.type) {
    case 'cuda':
      return 'moderate'; // NVIDIA GPUs consume more power

    case 'openvino':
      if (addonInfo.deviceConfig?.type === 'integrated') {
        return 'excellent'; // Intel integrated GPUs are very efficient
      } else {
        return 'good'; // Intel discrete GPUs are relatively efficient
      }

    case 'coreml':
      return 'excellent'; // Apple Silicon is highly efficient

    case 'cpu':
      return 'good'; // CPU efficiency depends on workload

    default:
      return 'unknown';
  }
}

/**
 * Get expected memory usage
 */
function getExpectedMemoryUsage(addonInfo: AddonInfo): string {
  // Memory usage depends more on model size than addon type
  if (addonInfo.deviceConfig?.memory === 'shared') {
    return 'shared'; // Integrated GPUs use shared memory
  }

  return 'dedicated'; // Discrete GPUs and CPU use dedicated memory
}

/**
 * Load OpenVINO addon with enhanced initialization and validation
 */
async function loadOpenVINOAddon(
  addonInfo: AddonInfo,
  addonPath: string,
  correlationId?: string,
): Promise<WhisperFunction> {
  const openvinoCorrelationId = correlationId || generateCorrelationId();

  // Log OpenVINO addon loading initiation
  logOpenVINOAddonEvent(
    'loading_initiated',
    {
      addonPath,
      deviceConfig: addonInfo.deviceConfig,
      displayName: addonInfo.displayName,
    },
    openvinoCorrelationId,
  );

  try {
    // Step 1: Setup OpenVINO environment variables
    setupOpenVINOEnvironmentInternal(addonInfo);

    // Step 2: Validate OpenVINO addon file exists
    if (!validateOpenVINOAddon(addonPath)) {
      logOpenVINOAddonEvent(
        'loading_failed',
        {
          addonPath,
          reason: 'File validation failed',
          errorMessage: 'OpenVINO addon file not found or invalid',
        },
        openvinoCorrelationId,
      );
      throw new Error(`OpenVINO addon file not found or invalid: ${addonPath}`);
    }

    // Step 3: Initialize OpenVINO environment
    setupOpenVINOEnvironment(addonInfo.deviceConfig || {});

    // Step 4: Load the OpenVINO addon
    const module = { exports: { whisper: null } };

    try {
      process.dlopen(module, addonPath);
    } catch (loadError) {
      logOpenVINOAddonEvent(
        'loading_failed',
        {
          addonPath,
          reason: 'Process dlopen failed',
          errorMessage: loadError.message,
          errorStack: loadError.stack,
        },
        openvinoCorrelationId,
      );
      throw new Error(`Failed to load OpenVINO addon: ${loadError.message}`);
    }

    // Step 5: Validate addon structure
    validateAddonStructure(module);

    // Step 6: Create OpenVINO-specific whisper function wrapper
    const openvinoWhisperFunction = createOpenVINOWhisperWrapper(
      module.exports.whisper,
      addonInfo,
    );

    // Step 7: Test OpenVINO functionality
    await validateOpenVINOFunctionality(
      openvinoWhisperFunction,
      addonInfo,
      openvinoCorrelationId,
    );

    // Log successful OpenVINO addon loading
    logOpenVINOAddonEvent(
      'loading_success',
      {
        addonPath,
        deviceConfig: addonInfo.deviceConfig,
        validated: true,
        environmentVariables: {
          OPENVINO_DEVICE_ID: process.env.OPENVINO_DEVICE_ID,
          OPENVINO_CACHE_DIR: process.env.OPENVINO_CACHE_DIR,
          OPENVINO_PERFORMANCE_HINT: process.env.OPENVINO_PERFORMANCE_HINT,
        },
      },
      openvinoCorrelationId,
    );

    return openvinoWhisperFunction;
  } catch (error) {
    logOpenVINOAddonEvent(
      'loading_failed',
      {
        addonPath,
        reason: 'OpenVINO integration failed',
        errorMessage: error.message,
        errorStack: error.stack,
      },
      openvinoCorrelationId,
    );
    throw new Error(`OpenVINO integration failed: ${error.message}`);
  }
}

/**
 * Validate OpenVINO addon file exists and is valid
 */
function validateOpenVINOAddon(addonPath: string): boolean {
  try {
    if (!fs.existsSync(addonPath)) {
      logMessage(`OpenVINO addon file does not exist: ${addonPath}`, 'warning');
      return false;
    }

    const stats = fs.statSync(addonPath);
    if (!stats.isFile() || stats.size === 0) {
      logMessage(`OpenVINO addon file is invalid: ${addonPath}`, 'warning');
      return false;
    }

    logMessage(`OpenVINO addon file validated: ${addonPath}`, 'debug');
    return true;
  } catch (error) {
    logMessage(
      `Error validating OpenVINO addon file: ${error.message}`,
      'error',
    );
    return false;
  }
}

/**
 * Create OpenVINO-specific whisper function wrapper
 */
function createOpenVINOWhisperWrapper(
  originalWhisperFunction: WhisperFunction,
  addonInfo: AddonInfo,
): WhisperFunction {
  return (
    params: any,
    callback: (error: Error | null, result?: any) => void,
  ): void => {
    try {
      // Enhanced parameter processing for OpenVINO
      const openvinoParams = {
        ...params,
        // Add OpenVINO-specific parameters
        openvino_device: addonInfo.deviceConfig?.deviceId || 'CPU',
        openvino_cache_dir: process.env.OPENVINO_CACHE_DIR,
        openvino_performance_hint:
          process.env.OPENVINO_PERFORMANCE_HINT || 'LATENCY',
      };

      logMessage(
        `OpenVINO processing with device: ${openvinoParams.openvino_device}`,
        'debug',
      );

      // Call original whisper function with enhanced parameters
      originalWhisperFunction(
        openvinoParams,
        (error: Error | null, result?: any) => {
          if (error) {
            logMessage(`OpenVINO processing error: ${error.message}`, 'error');
            callback(
              new Error(`OpenVINO processing failed: ${error.message}`),
              null,
            );
          } else {
            logMessage('OpenVINO processing completed successfully', 'debug');
            callback(null, result);
          }
        },
      );
    } catch (wrapperError) {
      logMessage(`OpenVINO wrapper error: ${wrapperError.message}`, 'error');
      callback(
        new Error(`OpenVINO wrapper failed: ${wrapperError.message}`),
        null,
      );
    }
  };
}

/**
 * Validate OpenVINO-specific functionality
 */
async function validateOpenVINOFunctionality(
  whisperFunc: WhisperFunction,
  addonInfo: AddonInfo,
  correlationId?: string,
): Promise<void> {
  const validationCorrelationId = correlationId || generateCorrelationId();

  // Log validation start
  logOpenVINOAddonEvent(
    'validation_started',
    {
      deviceConfig: addonInfo.deviceConfig,
      testParameters: {
        model: '',
        validate_only: true,
        openvino_device: addonInfo.deviceConfig?.deviceId || 'CPU',
      },
    },
    validationCorrelationId,
  );
  return new Promise((resolve, reject) => {
    // Create OpenVINO-specific test parameters
    const testParams = {
      model: '', // Empty model path for validation test
      validate_only: true, // Custom flag to indicate validation mode
      openvino_device: addonInfo.deviceConfig?.deviceId || 'CPU',
    };

    const timeout = setTimeout(() => {
      reject(new Error('OpenVINO addon validation timeout'));
    }, 10000); // Longer timeout for OpenVINO initialization

    try {
      whisperFunc(testParams, (error: Error | null, result?: any) => {
        clearTimeout(timeout);

        if (
          error &&
          !error.message.includes('model') &&
          !error.message.includes('file')
        ) {
          // Ignore model-related errors during validation
          logOpenVINOAddonEvent(
            'validation_failed',
            {
              errorMessage: error.message,
              testParameters: testParams,
            },
            validationCorrelationId,
          );
          reject(
            new Error(`OpenVINO addon validation failed: ${error.message}`),
          );
        } else {
          // OpenVINO addon is functional (model errors are expected during validation)
          logOpenVINOAddonEvent(
            'validation_passed',
            {
              deviceConfig: addonInfo.deviceConfig,
              testParameters: testParams,
              expectedModelErrors: error ? true : false,
            },
            validationCorrelationId,
          );
          resolve();
        }
      });
    } catch (syncError) {
      clearTimeout(timeout);
      logOpenVINOAddonEvent(
        'validation_failed',
        {
          errorMessage: syncError.message,
          errorStack: syncError.stack,
          testParameters: testParams,
          reason: 'Synchronous validation error',
        },
        validationCorrelationId,
      );
      reject(
        new Error(`OpenVINO addon validation failed: ${syncError.message}`),
      );
    }
  });
}

/**
 * Validate addon structure after loading
 */
export function validateAddonStructure(module: any): void {
  if (!module.exports) {
    throw new Error('Invalid addon structure: Missing exports');
  }

  if (!module.exports.whisper) {
    throw new Error('Invalid addon structure: Missing whisper function');
  }

  if (typeof module.exports.whisper !== 'function') {
    throw new Error('Invalid addon structure: Invalid whisper function');
  }
}
