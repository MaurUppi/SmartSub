import { spawn } from 'child_process';
import { app } from 'electron';
import path from 'path';
import { isAppleSilicon, isWin32, getExtraResourcesPath } from './utils';
import { BrowserWindow, DownloadItem } from 'electron';
import decompress from 'decompress';
import fs from 'fs-extra';
import { store } from './store';
import { checkCudaSupport } from './cudaUtils';
import { logMessage } from './logger';

export const getPath = (key?: string) => {
  const userDataPath = app.getPath('userData');
  const settings = store.get('settings') || {
    modelsPath: path.join(userDataPath, 'whisper-models'),
  };
  // 使用用户自定义的模型路径或默认路径
  const modelsPath =
    settings.modelsPath || path.join(userDataPath, 'whisper-models');
  if (!fs.existsSync(modelsPath)) {
    fs.mkdirSync(modelsPath, { recursive: true });
  }
  const res = {
    userDataPath,
    modelsPath,
  };
  if (key) return res[key];
  return res;
};

export const getModelsInstalled = () => {
  const modelsPath = getPath('modelsPath');
  try {
    const models = fs
      .readdirSync(modelsPath)
      ?.filter((file) => file.startsWith('ggml-') && file.endsWith('.bin'));
    return models.map((model) =>
      model.replace('ggml-', '').replace('.bin', ''),
    );
  } catch (e) {
    return [];
  }
};

export const deleteModel = async (model: string) => {
  const modelsPath = getPath('modelsPath');
  const modelPath = path.join(modelsPath, `ggml-${model}.bin`);
  const coreMLModelPath = path.join(
    modelsPath,
    `ggml-${model}-encoder.mlmodelc`,
  );

  return new Promise((resolve, reject) => {
    try {
      if (fs.existsSync(modelPath)) {
        fs.unlinkSync(modelPath);
      }
      if (fs.existsSync(coreMLModelPath)) {
        fs.removeSync(coreMLModelPath); // 递归删除目录
      }
      resolve('ok');
    } catch (error) {
      console.error('删除模型失败:', error);
      reject(error);
    }
  });
};

export const downloadModelSync = async (
  model: string,
  source: string,
  onProcess: (progress: number, message: string) => void,
  needsCoreML = true,
) => {
  const modelsPath = getPath('modelsPath');
  const modelPath = path.join(modelsPath, `ggml-${model}.bin`);
  const coreMLModelPath = path.join(
    modelsPath,
    `ggml-${model}-encoder.mlmodelc`,
  );

  // 检查模型文件是否已存在
  if (fs.existsSync(modelPath)) {
    // 如果不需要CoreML支持，或者不是Apple Silicon，或者CoreML文件已存在，则直接返回
    if (!needsCoreML || !isAppleSilicon() || fs.existsSync(coreMLModelPath)) {
      return;
    }
  }

  const baseUrl = `https://${
    source === 'huggingface' ? 'huggingface.co' : 'hf-mirror.com'
  }/ggerganov/whisper.cpp/resolve/main`;
  const url = `${baseUrl}/ggml-${model}.bin`;

  // 只有在需要CoreML支持且是Apple Silicon时才下载CoreML模型
  const needDownloadCoreML = needsCoreML && isAppleSilicon();
  const coreMLUrl = needDownloadCoreML
    ? `${baseUrl}/ggml-${model}-encoder.mlmodelc.zip`
    : '';

  return new Promise((resolve, reject) => {
    const win = new BrowserWindow({ show: false });
    let downloadCount = 0;
    const totalDownloads = needDownloadCoreML ? 2 : 1;
    let totalBytes = { normal: 0, coreML: 0 };
    let receivedBytes = { normal: 0, coreML: 0 };

    const willDownloadHandler = (_event: unknown, item: DownloadItem) => {
      const isCoreML = item.getFilename().includes('-encoder.mlmodelc');

      // 检查是否为当前模型的下载项
      if (!item.getFilename().includes(`ggml-${model}`)) {
        return; // 忽略不匹配的下载项
      }

      // 如果是CoreML文件但不需要下载CoreML，则取消下载
      if (isCoreML && !needDownloadCoreML) {
        item.cancel();
        return;
      }

      const savePath = isCoreML
        ? path.join(modelsPath, `ggml-${model}-encoder.mlmodelc.zip`)
        : modelPath;
      item.setSavePath(savePath);

      const type = isCoreML ? 'coreML' : 'normal';
      totalBytes[type] = item.getTotalBytes();

      item.on('updated', (_event: unknown, state: string) => {
        if (state === 'progressing' && !item.isPaused()) {
          receivedBytes[type] = item.getReceivedBytes();
          const totalProgress =
            (receivedBytes.normal + receivedBytes.coreML) /
            (totalBytes.normal + totalBytes.coreML);
          const percent = totalProgress * 100;
          onProcess(totalProgress, `${percent.toFixed(2)}%`);
        }
      });

      item.once('done', async (_event: unknown, state: string) => {
        if (state === 'completed') {
          downloadCount++;

          if (isCoreML) {
            try {
              const zipPath = path.join(
                modelsPath,
                `ggml-${model}-encoder.mlmodelc.zip`,
              );
              await decompress(zipPath, modelsPath);
              fs.unlinkSync(zipPath); // 删除zip文件
              onProcess(1, `Core ML ${model} 解压完成`);
            } catch (error) {
              console.error('解压Core ML模型失败:', error);
              reject(new Error(`解压Core ML模型失败: ${error.message}`));
            }
          }

          if (downloadCount === totalDownloads) {
            onProcess(1, `${model} 下载完成`);
            cleanup();
            resolve(1);
          }
        } else {
          cleanup();
          reject(new Error(`${model} download error: ${state}`));
        }
      });
    };

    const cleanup = () => {
      win.webContents.session.removeListener(
        'will-download',
        willDownloadHandler,
      );
      win.destroy();
    };

    win.webContents.session.on('will-download', willDownloadHandler);
    win.webContents.downloadURL(url);

    // 只有在需要时才下载CoreML模型
    if (needDownloadCoreML) {
      win.webContents.downloadURL(coreMLUrl);
    }
  });
};

export async function checkOpenAiWhisper(): Promise<boolean> {
  return new Promise((resolve) => {
    const command = isWin32() ? 'whisper.exe' : 'whisper';
    const env = { ...process.env, PYTHONIOENCODING: 'UTF-8' };
    const childProcess = spawn(command, ['-h'], { env, shell: true });

    const timeout = setTimeout(() => {
      childProcess.kill();
      resolve(false);
    }, 5000);

    childProcess.on('error', (error) => {
      clearTimeout(timeout);
      console.log('spawn error: ', error);
      resolve(false);
    });

    childProcess.on('exit', (code) => {
      clearTimeout(timeout);
      console.log('exit code: ', code);
      resolve(code === 0);
    });
  });
}

// 判断 encoder 模型是否存在
export const hasEncoderModel = (model) => {
  const encoderModelPath = path.join(
    getPath('modelsPath'),
    `ggml-${model}-encoder.mlmodelc`,
  );
  return fs.existsSync(encoderModelPath);
};

/**
 * Enhanced Whisper Addon Loading with Intel GPU Support
 * Intelligent GPU selection with user override and comprehensive fallback chains
 */
export async function loadWhisperAddon(
  model: string,
  existingGpuCapabilities?: any,
) {
  const settings = (store.get('settings') as any) || {};
  const { selectedGPUId, gpuPreference } = settings;

  // GPU selection and addon loading logic

  logMessage('Starting enhanced whisper addon loading', 'info');
  logMessage(`Model: ${model}`, 'info');

  // Import GPU selection modules
  const {
    selectOptimalGPU,
    resolveSpecificGPU,
    getGPUSelectionConfig,
    logGPUSelection,
  } = require('./gpuSelector');
  const {
    loadAndValidateAddon,
    handleAddonLoadingError,
    createFallbackChain,
    logAddonLoadAttempt,
  } = require('./addonManager');
  const { detectAvailableGPUs } = require('./hardware/hardwareDetection');

  try {
    // Use existing GPU capabilities or detect if not provided
    const gpuCapabilities = existingGpuCapabilities || detectAvailableGPUs();

    // Only log capabilities if we had to detect them (avoid duplicate logging)
    if (!existingGpuCapabilities) {
      logMessage(
        `GPU capabilities detected: ${JSON.stringify({
          nvidia: gpuCapabilities.nvidia,
          intelCount: gpuCapabilities.intel.length,
          apple: gpuCapabilities.apple,
          openvinoVersion: gpuCapabilities.openvinoVersion,
        })}`,
        'info',
      );
    }

    let selectedAddon = null;

    // 1. Handle explicit GPU selection (user override)
    if (selectedGPUId && selectedGPUId !== 'auto') {
      selectedAddon = resolveSpecificGPU(selectedGPUId, gpuCapabilities);
      if (selectedAddon) {
        logMessage(
          `Using user-selected GPU: ${selectedAddon.displayName}`,
          'info',
        );
      } else {
        logMessage(
          `User-selected GPU ${selectedGPUId} not available, falling back to auto-detection`,
          'warning',
        );
      }
    }

    // 2. Fallback to priority-based selection
    if (!selectedAddon) {
      const priority = gpuPreference || ['nvidia', 'intel', 'apple', 'cpu'];
      selectedAddon = selectOptimalGPU(priority, gpuCapabilities, model);
    }

    // Log selection decision
    logGPUSelection(selectedAddon, gpuCapabilities);
    logAddonLoadAttempt(selectedAddon);

    // 3. Load and validate the selected addon
    try {
      const whisperFunction = await loadAndValidateAddon(selectedAddon);

      logMessage(
        `Successfully loaded ${selectedAddon.type} addon for model ${model}`,
        'info',
      );

      // Set environment variables for OpenVINO if needed
      if (selectedAddon.type === 'openvino' && selectedAddon.deviceConfig) {
        process.env.OPENVINO_DEVICE_ID = selectedAddon.deviceConfig.deviceId;
        logMessage(
          `Set OpenVINO device ID: ${selectedAddon.deviceConfig.deviceId}`,
          'debug',
        );
      }

      return whisperFunction;
    } catch (loadError) {
      logMessage(
        `Failed to load ${selectedAddon.type} addon: ${loadError.message}`,
        'error',
      );

      // 4. Handle loading failure with fallback chain
      const fallbackChain = createFallbackChain(selectedAddon);

      if (fallbackChain.length > 0) {
        logMessage(
          `Attempting recovery with ${fallbackChain.length} fallback options`,
          'info',
        );
        return await handleAddonLoadingError(
          loadError,
          selectedAddon,
          fallbackChain,
        );
      } else {
        throw new Error(
          `No fallback options available for ${selectedAddon.type}`,
        );
      }
    }
  } catch (error) {
    logMessage(`Enhanced addon loading failed: ${error.message}`, 'error');

    // 5. Emergency fallback to legacy loading system
    logMessage(
      'Attempting emergency fallback to legacy addon loading',
      'warning',
    );
    return await loadWhisperAddonLegacy(model);
  }
}

/**
 * Legacy addon loading system (preserved for emergency fallback)
 */
async function loadWhisperAddonLegacy(model: string) {
  const platform = process.platform;
  const settings = store.get('settings') || { useCuda: false };
  const useCuda = settings.useCuda || false;

  let addonPath: string;

  if (platform === 'win32' && useCuda) {
    // 检查 CUDA 支持
    const hasCudaSupport = await checkCudaSupport();

    if (hasCudaSupport) {
      addonPath = path.join(getExtraResourcesPath(), 'addons', 'addon.node');
    } else {
      // 如果不支持 CUDA，使用 no-cuda 版本
      addonPath = path.join(
        getExtraResourcesPath(),
        'addons',
        'addon-no-cuda.node',
      );
    }
  } else if (isAppleSilicon() && hasEncoderModel(model)) {
    addonPath = path.join(
      getExtraResourcesPath(),
      'addons',
      'addon.coreml.node',
    );
  } else {
    addonPath = path.join(getExtraResourcesPath(), 'addons', 'addon.node');
  }

  if (!addonPath) {
    throw new Error('Unsupported platform or architecture');
  }

  const module = { exports: { whisper: null } };
  process.dlopen(module, addonPath);

  if (!module.exports.whisper) {
    throw new Error('Legacy addon loading failed - whisper function not found');
  }

  logMessage('Emergency fallback to legacy addon loading successful', 'info');

  return module.exports.whisper as (
    params: any,
    callback: (error: Error | null, result?: any) => void,
  ) => void;
}
