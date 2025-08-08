import { app, ipcMain } from 'electron';
import os from 'os';
import { store } from './store';
import { defaultUserConfig } from './utils';
import { getAndInitializeProviders } from './providerManager';
import { logMessage } from './logger';
import { LogEntry } from './store/types';
import { getBuildInfo } from './buildInfo';

console.log(app.getVersion(), 'version');
export function setupStoreHandlers() {
  // 启动时初始化服务商配置
  getAndInitializeProviders().then(async () => {
    const osInfo = {
      platform: os.platform(),
      arch: os.arch(),
      version: os.version(),
      model: os.machine(),
      cpuModel: os?.cpus()?.[0]?.model,
      release: os.release(),
      totalmem: os.totalmem(),
      freemem: os.freemem(),
      type: os.type(),
      buildInfo: getBuildInfo(),
    };
    logMessage(`osInfo: ${JSON.stringify(osInfo, null, 2)}`, 'info');
    logMessage('Translation providers initialized', 'info');
  });

  // Provider 相关处理
  ipcMain.on('setTranslationProviders', async (event, providers) => {
    store.set('translationProviders', providers);
  });

  ipcMain.handle('getTranslationProviders', async () => {
    return getAndInitializeProviders();
  });

  // 用户配置相关处理
  ipcMain.on('setUserConfig', async (event, config) => {
    store.set('userConfig', config);
  });

  ipcMain.handle('getUserConfig', async () => {
    const storedConfig = store.get('userConfig');
    return { ...defaultUserConfig, ...storedConfig };
  });

  // 设置相关处理
  ipcMain.handle('setSettings', async (event, settings) => {
    const preSettings = store.get('settings');
    store.set('settings', { ...preSettings, ...settings });
  });

  ipcMain.handle('getSettings', async () => {
    return store.get('settings');
  });

  // 日志相关处理
  ipcMain.handle(
    'addLog',
    async (event, logEntry: Omit<LogEntry, 'timestamp'>) => {
      const logs = store.get('logs');
      const newLog = {
        ...logEntry,
        timestamp: Date.now(),
      };
      store.set('logs', [...logs, newLog]);
      event.sender.send('newLog', newLog);
    },
  );

  ipcMain.handle('getLogs', async () => {
    return store.get('logs');
  });

  ipcMain.handle('clearLogs', async () => {
    store.set('logs', []);
    return true;
  });

  // 平台信息处理
  ipcMain.handle('getPlatformInfo', async () => {
    const isAppleSilicon = os.arch() === 'arm64' && os.platform() === 'darwin';

    return {
      platform: os.platform(),
      arch: os.arch(),
      version: os.version(),
      model: os.machine(),
      cpuModel: os?.cpus()?.[0]?.model,
      release: os.release(),
      type: os.type(),
      isAppleSilicon,
      buildInfo: getBuildInfo(),
    };
  });

  // GPU 配置管道处理
  ipcMain.handle('configureGPUPipeline', async (event, config) => {
    try {
      const { gpuId, gpuType, vendor } = config;

      // Log GPU selection for debugging
      console.log('Configuring GPU pipeline:', { gpuId, gpuType, vendor });

      // Store GPU configuration in settings
      await store.set('gpuConfig', {
        selectedGPU: gpuId,
        gpuType: gpuType,
        vendor: vendor,
        configuredAt: new Date().toISOString(),
      });

      // TODO: Apply GPU configuration to processing pipeline
      // This will be implemented when the actual processing pipeline is integrated

      return { success: true, message: 'GPU pipeline configured successfully' };
    } catch (error) {
      console.error('Failed to configure GPU pipeline:', error);
      return { success: false, message: error.message };
    }
  });

  // GPU 检测刷新处理
  ipcMain.handle('refreshGPUDetection', async () => {
    try {
      // Re-run GPU detection
      // This will trigger the useGPUDetection hook to refresh
      console.log('Refreshing GPU detection...');

      // TODO: Implement actual GPU re-detection logic
      // For now, just return success to trigger hook refresh

      return { success: true, message: 'GPU detection refreshed' };
    } catch (error) {
      console.error('Failed to refresh GPU detection:', error);
      return { success: false, message: error.message };
    }
  });

  // 清理配置
  ipcMain.handle('clearConfig', async () => {
    store.clear();
    return true;
  });
}
