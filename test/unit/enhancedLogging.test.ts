/**
 * Test suite for Enhanced Logging System
 * Task UE-4: Enhanced Logging System
 */

import { LogCategory, LogEntry } from '../../main/helpers/store/types';

// Mock electron modules
jest.mock('electron', () => ({
  app: {
    getPath: jest.fn((name) => {
      const mockPaths = {
        userData: '/mock/user/data',
        appData: '/mock/app/data',
        temp: '/mock/temp',
      };
      return mockPaths[name] || '/mock/default';
    }),
  },
  BrowserWindow: {
    getAllWindows: jest.fn(() => [
      {
        webContents: {
          send: jest.fn(),
        },
      },
    ]),
  },
}));

// Mock store to avoid dependencies
const mockStore = {
  logs: [] as LogEntry[],
  get: jest.fn((key: string) => {
    if (key === 'logs') return mockStore.logs;
    return [];
  }),
  set: jest.fn((key: string, value: any) => {
    if (key === 'logs') mockStore.logs = value;
  }),
};

jest.mock('../../main/helpers/store', () => ({
  store: mockStore,
}));

// Import after mocking
import {
  logMessage,
  logOpenVINOAddonEvent,
  logGPUDetectionEvent,
  logAddonLoadingEvent,
  logPerformanceMetrics,
  logSystemInfo,
  logUserAction,
  generateCorrelationId,
  getLogsByCategory,
  getLogsByCorrelationId,
  clearLogsByCategory,
  exportLogs,
} from '../../main/helpers/logger';

describe('Enhanced Logging System', () => {
  beforeEach(() => {
    // Clear logs before each test
    mockStore.logs = [];
    jest.clearAllMocks();
  });

  describe('Basic Logging Functionality', () => {
    test('should log basic message with default parameters', () => {
      logMessage('Test message');

      const logs = mockStore.logs;
      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        message: 'Test message',
        type: 'info',
        category: LogCategory.GENERAL,
      });
      expect(logs[0].timestamp).toBeGreaterThan(0);
    });

    test('should log message with all parameters', () => {
      const correlationId = 'test-correlation-id';
      const context = { testKey: 'testValue' };

      logMessage(
        'Test message with context',
        'warning',
        LogCategory.GPU_DETECTION,
        context,
        correlationId,
      );

      const logs = mockStore.logs;
      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        message: 'Test message with context',
        type: 'warning',
        category: LogCategory.GPU_DETECTION,
        context: context,
        correlationId: correlationId,
      });
    });

    test('should log Error objects correctly', () => {
      const error = new Error('Test error message');

      logMessage(error, 'error');

      const logs = mockStore.logs;
      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        message: 'Test error message',
        type: 'error',
        category: LogCategory.GENERAL,
      });
    });

    test('should maintain log size limit', () => {
      // Mock a large number of existing logs
      const existingLogs = Array(1005)
        .fill(null)
        .map((_, i) => ({
          message: `Log ${i}`,
          type: 'info',
          category: LogCategory.GENERAL,
          timestamp: Date.now() - (1005 - i),
        }));

      mockStore.logs = existingLogs;

      logMessage('New log entry');

      const logs = mockStore.logs;
      expect(logs).toHaveLength(1000); // Should maintain MAX_LOGS limit
      expect(logs[logs.length - 1].message).toBe('New log entry');
    });
  });

  describe('Correlation ID Management', () => {
    test('should generate unique correlation IDs', () => {
      const id1 = generateCorrelationId();
      const id2 = generateCorrelationId();

      expect(id1).toMatch(/^op_\d+_\d+$/);
      expect(id2).toMatch(/^op_\d+_\d+$/);
      expect(id1).not.toBe(id2);
    });

    test('should retrieve logs by correlation ID', () => {
      const correlationId = generateCorrelationId();

      logMessage('Message 1', 'info', LogCategory.GENERAL, {}, correlationId);
      logMessage(
        'Message 2',
        'warning',
        LogCategory.GPU_DETECTION,
        {},
        correlationId,
      );
      logMessage('Message 3', 'error', LogCategory.OPENVINO_ADDON); // Different correlation ID

      const relatedLogs = getLogsByCorrelationId(correlationId);
      expect(relatedLogs).toHaveLength(2);
      expect(relatedLogs[0].message).toBe('Message 1');
      expect(relatedLogs[1].message).toBe('Message 2');
    });
  });

  describe('OpenVINO Addon Logging', () => {
    test('should log OpenVINO addon loading initiated', () => {
      const correlationId = generateCorrelationId();
      const context = {
        addonPath: '/path/to/addon-macos-arm-openvino.node',
        deviceConfig: { deviceId: 'CPU', type: 'integrated' },
      };

      logOpenVINOAddonEvent('loading_initiated', context, correlationId);

      const logs = mockStore.logs;
      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        message: 'OpenVINO addon loading initiated',
        type: 'info',
        category: LogCategory.OPENVINO_ADDON,
        correlationId: correlationId,
      });
      expect(logs[0].context).toMatchObject({
        event: 'loading_initiated',
        platform: process.platform,
        arch: process.arch,
        ...context,
      });
    });

    test('should log OpenVINO addon loading success', () => {
      const context = {
        addonPath: '/path/to/addon-windows-openvino.node',
        loadTime: 1250,
        validated: true,
      };

      logOpenVINOAddonEvent('loading_success', context);

      const logs = mockStore.logs;
      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        message: 'OpenVINO addon loaded successfully',
        type: 'success',
        category: LogCategory.OPENVINO_ADDON,
      });
    });

    test('should log OpenVINO addon loading failure', () => {
      const context = {
        addonPath: '/path/to/addon-linux-openvino.node',
        errorMessage: 'File not found',
        reason: 'Addon file missing',
      };

      logOpenVINOAddonEvent('loading_failed', context);

      const logs = mockStore.logs;
      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        message: 'OpenVINO addon loading failed',
        type: 'error',
        category: LogCategory.OPENVINO_ADDON,
      });
      expect(logs[0].context.errorMessage).toBe('File not found');
    });

    test('should log OpenVINO validation events', () => {
      const correlationId = generateCorrelationId();

      logOpenVINOAddonEvent(
        'validation_started',
        {
          deviceConfig: { deviceId: 'GPU.0' },
        },
        correlationId,
      );

      logOpenVINOAddonEvent(
        'validation_passed',
        {
          deviceConfig: { deviceId: 'GPU.0' },
          testSuccessful: true,
        },
        correlationId,
      );

      const logs = getLogsByCorrelationId(correlationId);
      expect(logs).toHaveLength(2);
      expect(logs[0].message).toBe('OpenVINO addon validation started');
      expect(logs[1].message).toBe('OpenVINO addon validation passed');
    });
  });

  describe('GPU Detection Logging', () => {
    test('should log GPU detection started', () => {
      const context = {
        platform: 'win32',
        detectionMethod: 'wmi_query',
      };

      logGPUDetectionEvent('detection_started', context);

      const logs = mockStore.logs;
      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        message: 'GPU detection started',
        type: 'info',
        category: LogCategory.GPU_DETECTION,
      });
    });

    test('should log GPU device found', () => {
      const context = {
        gpuName: 'Intel Arc A770',
        memory: 16384,
        driverVersion: '31.0.101.4146',
        gpuType: 'discrete',
      };

      logGPUDetectionEvent('gpu_found', context);

      const logs = mockStore.logs;
      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        message: 'GPU device detected',
        type: 'success',
        category: LogCategory.GPU_DETECTION,
      });
      expect(logs[0].context.gpuName).toBe('Intel Arc A770');
      expect(logs[0].context.memory).toBe(16384);
    });

    test('should log GPU detection failure', () => {
      const context = {
        reason: 'No compatible GPUs found',
        attemptedDetections: ['nvidia', 'intel', 'apple'],
      };

      logGPUDetectionEvent('detection_failed', context);

      const logs = mockStore.logs;
      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        message: 'GPU detection failed',
        type: 'error',
        category: LogCategory.GPU_DETECTION,
      });
    });

    test('should log complete GPU detection workflow', () => {
      const correlationId = generateCorrelationId();

      logGPUDetectionEvent('detection_started', {}, correlationId);
      logGPUDetectionEvent(
        'gpu_found',
        { gpuName: 'Intel Xe Graphics' },
        correlationId,
      );
      logGPUDetectionEvent(
        'gpu_validated',
        { gpuName: 'Intel Xe Graphics', validated: true },
        correlationId,
      );
      logGPUDetectionEvent(
        'detection_completed',
        { totalGPUsFound: 1 },
        correlationId,
      );

      const workflowLogs = getLogsByCorrelationId(correlationId);
      expect(workflowLogs).toHaveLength(4);

      const messageTypes = workflowLogs.map((log) => log.message);
      expect(messageTypes).toEqual([
        'GPU detection started',
        'GPU device detected',
        'GPU device validated',
        'GPU detection completed',
      ]);
    });
  });

  describe('Generic Addon Loading Logging', () => {
    test('should log addon load attempts', () => {
      const context = {
        addonPath: '/path/to/addon.node',
        displayName: 'CUDA Addon',
      };

      logAddonLoadingEvent('load_attempt', 'cuda', context);

      const logs = mockStore.logs;
      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        message: 'Attempting to load cuda addon',
        type: 'info',
        category: LogCategory.ADDON_LOADING,
      });
      expect(logs[0].context.addonType).toBe('cuda');
    });

    test('should log fallback usage', () => {
      const context = {
        originalAddon: 'openvino',
        fallbackReason: 'Intel GPU not available',
      };

      logAddonLoadingEvent('fallback_used', 'cuda', context);

      const logs = mockStore.logs;
      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        message: 'Using fallback for cuda addon',
        type: 'warning',
        category: LogCategory.ADDON_LOADING,
      });
    });
  });

  describe('Performance Metrics Logging', () => {
    test('should log performance metrics', () => {
      const correlationId = generateCorrelationId();
      const metrics = {
        duration: 15420,
        speedup: 2.8,
        gpuUsed: 'Intel Arc A770',
        modelUsed: 'medium',
        fileSize: 52428800,
        memoryUsage: 4096,
      };

      logPerformanceMetrics('subtitle_generation', metrics, correlationId);

      const logs = mockStore.logs;
      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        message: 'Performance metrics for subtitle_generation',
        type: 'info',
        category: LogCategory.PERFORMANCE,
        correlationId: correlationId,
      });
      expect(logs[0].context).toMatchObject({
        operation: 'subtitle_generation',
        ...metrics,
      });
    });

    test('should log performance metrics with minimal data', () => {
      const metrics = {
        duration: 5000,
      };

      logPerformanceMetrics('addon_loading', metrics);

      const logs = mockStore.logs;
      expect(logs).toHaveLength(1);
      expect(logs[0].context.operation).toBe('addon_loading');
      expect(logs[0].context.duration).toBe(5000);
    });
  });

  describe('System Information Logging', () => {
    test('should log system information with automatic platform data', () => {
      const info = {
        totalMemory: 16777216000,
        availableGPUs: ['Intel Arc A770', 'Intel Xe Graphics'],
        openvinoVersion: '2024.6.0',
      };

      logSystemInfo(info);

      const logs = mockStore.logs;
      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        message: 'System information captured',
        type: 'info',
        category: LogCategory.SYSTEM_INFO,
      });
      expect(logs[0].context).toMatchObject({
        ...info,
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
      });
    });
  });

  describe('User Action Logging', () => {
    test('should log user actions', () => {
      const context = {
        buttonClicked: 'generate_subtitles',
        selectedModel: 'medium',
        selectedGPU: 'intel-arc-a770',
      };

      logUserAction('start_subtitle_generation', context);

      const logs = mockStore.logs;
      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        message: 'User action: start_subtitle_generation',
        type: 'info',
        category: LogCategory.USER_ACTION,
      });
      expect(logs[0].context.action).toBe('start_subtitle_generation');
    });

    test('should log user actions without context', () => {
      logUserAction('open_settings');

      const logs = mockStore.logs;
      expect(logs).toHaveLength(1);
      expect(logs[0].context.action).toBe('open_settings');
    });
  });

  describe('Log Filtering and Management', () => {
    beforeEach(() => {
      // Set up test data with different categories
      logMessage('General message', 'info', LogCategory.GENERAL);
      logMessage('GPU message', 'info', LogCategory.GPU_DETECTION);
      logMessage('OpenVINO message', 'info', LogCategory.OPENVINO_ADDON);
      logMessage('Performance message', 'info', LogCategory.PERFORMANCE);
      logMessage('Another GPU message', 'warning', LogCategory.GPU_DETECTION);
    });

    test('should filter logs by category', () => {
      const gpuLogs = getLogsByCategory(LogCategory.GPU_DETECTION);
      expect(gpuLogs).toHaveLength(2);
      expect(gpuLogs[0].message).toBe('GPU message');
      expect(gpuLogs[1].message).toBe('Another GPU message');

      const openvinoLogs = getLogsByCategory(LogCategory.OPENVINO_ADDON);
      expect(openvinoLogs).toHaveLength(1);
      expect(openvinoLogs[0].message).toBe('OpenVINO message');
    });

    test('should clear logs by category', () => {
      expect(mockStore.logs).toHaveLength(5);

      clearLogsByCategory(LogCategory.GPU_DETECTION);

      const remainingLogs = mockStore.logs;
      expect(remainingLogs).toHaveLength(3);
      expect(
        remainingLogs.every(
          (log) => log.category !== LogCategory.GPU_DETECTION,
        ),
      ).toBe(true);
    });

    test('should export logs by categories', () => {
      const selectedCategories = [
        LogCategory.GPU_DETECTION,
        LogCategory.OPENVINO_ADDON,
      ];
      const exportedLogs = exportLogs(selectedCategories);

      expect(exportedLogs).toHaveLength(3);
      expect(
        exportedLogs.every((log) => selectedCategories.includes(log.category)),
      ).toBe(true);
    });

    test('should export all logs when no categories specified', () => {
      const allLogs = exportLogs();
      expect(allLogs).toHaveLength(5);

      const noCategoryLogs = exportLogs([]);
      expect(noCategoryLogs).toHaveLength(5);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle undefined context gracefully', () => {
      logMessage('Test message', 'info', LogCategory.GENERAL, undefined);

      const logs = mockStore.logs;
      expect(logs).toHaveLength(1);
      expect(logs[0].context).toBeUndefined();
    });

    test('should handle empty correlation ID', () => {
      logMessage('Test message', 'info', LogCategory.GENERAL, {}, '');

      const logs = mockStore.logs;
      expect(logs).toHaveLength(1);
      expect(logs[0].correlationId).toBe('');
    });

    test('should handle missing store data', () => {
      mockStore.logs = undefined;

      logMessage('Test message');

      const logs = mockStore.logs;
      expect(logs).toHaveLength(1);
    });

    test('should handle circular references in context', () => {
      const circular = { test: 'value' };
      circular.self = circular;

      // Should not throw an error
      expect(() => {
        logMessage('Test message', 'info', LogCategory.GENERAL, circular);
      }).not.toThrow();
    });
  });

  describe('Integration Scenarios', () => {
    test('should handle complete OpenVINO loading workflow', () => {
      const correlationId = generateCorrelationId();

      // Simulate complete OpenVINO loading workflow
      logOpenVINOAddonEvent(
        'loading_initiated',
        {
          addonPath: '/path/to/addon-windows-openvino.node',
        },
        correlationId,
      );

      logOpenVINOAddonEvent(
        'validation_started',
        {
          deviceConfig: { deviceId: 'GPU.0' },
        },
        correlationId,
      );

      logOpenVINOAddonEvent(
        'validation_passed',
        {
          testSuccessful: true,
        },
        correlationId,
      );

      logOpenVINOAddonEvent(
        'loading_success',
        {
          loadTime: 1240,
          validated: true,
        },
        correlationId,
      );

      logPerformanceMetrics(
        'openvino_loading',
        {
          duration: 1240,
          deviceId: 'GPU.0',
        },
        correlationId,
      );

      // Verify complete workflow
      const workflowLogs = getLogsByCorrelationId(correlationId);
      expect(workflowLogs).toHaveLength(5);

      const openvinoLogs = getLogsByCategory(LogCategory.OPENVINO_ADDON);
      expect(openvinoLogs).toHaveLength(4);

      const performanceLogs = getLogsByCategory(LogCategory.PERFORMANCE);
      expect(performanceLogs).toHaveLength(1);
    });

    test('should handle GPU detection and selection workflow', () => {
      const correlationId = generateCorrelationId();

      // Simulate GPU detection workflow
      logGPUDetectionEvent(
        'detection_started',
        {
          platform: 'win32',
          requestedPriority: ['intel', 'nvidia', 'cpu'],
        },
        correlationId,
      );

      logGPUDetectionEvent(
        'gpu_found',
        {
          gpuType: 'intel',
          gpuName: 'Intel Xe Graphics',
          memory: 'shared',
        },
        correlationId,
      );

      logGPUDetectionEvent(
        'gpu_validated',
        {
          gpuType: 'intel',
          validated: true,
          memoryCheck: true,
        },
        correlationId,
      );

      logGPUDetectionEvent(
        'detection_completed',
        {
          selectedGPU: 'Intel Xe Graphics',
          totalFound: 1,
        },
        correlationId,
      );

      logAddonLoadingEvent(
        'load_attempt',
        'openvino',
        {
          selectedGPU: 'Intel Xe Graphics',
        },
        correlationId,
      );

      // Verify workflow completeness
      const workflowLogs = getLogsByCorrelationId(correlationId);
      expect(workflowLogs).toHaveLength(5);

      const detectionEvents = workflowLogs.filter(
        (log) => log.category === LogCategory.GPU_DETECTION,
      );
      expect(detectionEvents).toHaveLength(4);

      const loadingEvents = workflowLogs.filter(
        (log) => log.category === LogCategory.ADDON_LOADING,
      );
      expect(loadingEvents).toHaveLength(1);
    });
  });
});
