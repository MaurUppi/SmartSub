import { BrowserWindow } from 'electron';
import { store } from './store';
import { LogEntry, LogCategory } from './store/types';

// Re-export LogCategory for convenience
export { LogCategory } from './store/types';

// Maximum number of logs to retain in memory
const MAX_LOGS = 1000;

// Correlation ID for tracking related log entries
let correlationIdCounter = 0;

/**
 * Enhanced logging function with category support and structured context
 */
export function logMessage(
  message: string | Error,
  type: 'info' | 'error' | 'warning' | 'debug' | 'success' = 'info',
  category: LogCategory = LogCategory.GENERAL,
  context?: Record<string, any>,
  correlationId?: string,
): void {
  const logs = store.get('logs');
  const logsArray = Array.isArray(logs) ? logs : [];
  const messageStr =
    message instanceof Error ? message.message : String(message);

  const newLog: LogEntry = {
    message: messageStr,
    type,
    category,
    timestamp: Date.now(),
    context,
    correlationId,
  };

  // Maintain log size limit
  const updatedLogs = [...logsArray, newLog].slice(-MAX_LOGS);
  store.set('logs', updatedLogs);

  // Send to renderer processes
  BrowserWindow.getAllWindows().forEach((window) => {
    window.webContents.send('newLog', newLog);
  });

  // Console output for development (with structured formatting)
  if (process.env.NODE_ENV === 'development' || type === 'error') {
    const timestamp = new Date(newLog.timestamp).toISOString();
    const categoryStr =
      category !== LogCategory.GENERAL ? `[${category}] ` : '';
    const contextStr = context ? ` | Context: ${JSON.stringify(context)}` : '';
    const correlationStr = correlationId ? ` | ID: ${correlationId}` : '';

    console.log(
      `${timestamp} [${type.toUpperCase()}] ${categoryStr}${messageStr}${contextStr}${correlationStr}`,
    );
  }
}

/**
 * Generate a unique correlation ID for tracking related operations
 */
export function generateCorrelationId(): string {
  return `op_${Date.now()}_${++correlationIdCounter}`;
}

/**
 * Log OpenVINO addon loading events with structured context
 */
export function logOpenVINOAddonEvent(
  event:
    | 'loading_initiated'
    | 'loading_success'
    | 'loading_failed'
    | 'validation_started'
    | 'validation_passed'
    | 'validation_failed',
  context: Record<string, any>,
  correlationId?: string,
): void {
  const eventMessages = {
    loading_initiated: 'OpenVINO addon loading initiated',
    loading_success: 'OpenVINO addon loaded successfully',
    loading_failed: 'OpenVINO addon loading failed',
    validation_started: 'OpenVINO addon validation started',
    validation_passed: 'OpenVINO addon validation passed',
    validation_failed: 'OpenVINO addon validation failed',
  };

  const eventTypes = {
    loading_initiated: 'info' as const,
    loading_success: 'success' as const,
    loading_failed: 'error' as const,
    validation_started: 'info' as const,
    validation_passed: 'success' as const,
    validation_failed: 'error' as const,
  };

  logMessage(
    eventMessages[event],
    eventTypes[event],
    LogCategory.OPENVINO_ADDON,
    {
      event,
      platform: process.platform,
      arch: process.arch,
      ...context,
    },
    correlationId,
  );
}

/**
 * Log GPU detection events with detailed hardware information
 */
export function logGPUDetectionEvent(
  event:
    | 'detection_started'
    | 'gpu_found'
    | 'gpu_validated'
    | 'detection_completed'
    | 'detection_failed'
    | 'fallback_chain_started'
    | 'fallback_chain_success'
    | 'fallback_chain_option_failed',
  context: Record<string, any>,
  correlationId?: string,
): void {
  const eventMessages = {
    detection_started: 'GPU detection started',
    gpu_found: 'GPU device detected',
    gpu_validated: 'GPU device validated',
    detection_completed: 'GPU detection completed',
    detection_failed: 'GPU detection failed',
    fallback_chain_started: 'Fallback chain started',
    fallback_chain_success: 'Fallback chain succeeded',
    fallback_chain_option_failed: 'Fallback chain option failed',
  };

  const eventTypes = {
    detection_started: 'info' as const,
    gpu_found: 'success' as const,
    gpu_validated: 'success' as const,
    detection_completed: 'info' as const,
    detection_failed: 'error' as const,
    fallback_chain_started: 'warning' as const,
    fallback_chain_success: 'success' as const,
    fallback_chain_option_failed: 'warning' as const,
  };

  // Create more specific message based on context
  let specificMessage = eventMessages[event];
  if (event === 'gpu_found' && context.gpuType) {
    const status = context.available ? 'found' : 'not available';
    specificMessage = `${context.gpuType.toUpperCase()} GPU ${status}`;
  }

  logMessage(
    specificMessage,
    eventTypes[event],
    LogCategory.GPU_DETECTION,
    {
      event,
      platform: process.platform,
      arch: process.arch,
      ...context,
    },
    correlationId,
  );
}

/**
 * Log addon loading events (generic)
 */
export function logAddonLoadingEvent(
  event: 'load_attempt' | 'load_success' | 'load_failed' | 'fallback_used',
  addonType: string,
  context: Record<string, any>,
  correlationId?: string,
): void {
  const eventMessages = {
    load_attempt: `Attempting to load ${addonType} addon`,
    load_success: `${addonType} addon loaded successfully`,
    load_failed: `${addonType} addon loading failed`,
    fallback_used: `Using fallback for ${addonType} addon`,
  };

  const eventTypes = {
    load_attempt: 'info' as const,
    load_success: 'success' as const,
    load_failed: 'error' as const,
    fallback_used: 'warning' as const,
  };

  logMessage(
    eventMessages[event],
    eventTypes[event],
    LogCategory.ADDON_LOADING,
    {
      event,
      addonType,
      ...context,
    },
    correlationId,
  );
}

/**
 * Log performance metrics
 */
export function logPerformanceMetrics(
  operation: string,
  metrics: {
    duration?: number;
    speedup?: number;
    gpuUsed?: string;
    modelUsed?: string;
    fileSize?: number;
    memoryUsage?: number;
    [key: string]: any;
  },
  correlationId?: string,
): void {
  logMessage(
    `Performance metrics for ${operation}`,
    'info',
    LogCategory.PERFORMANCE,
    {
      operation,
      ...metrics,
      timestamp: Date.now(),
    },
    correlationId,
  );
}
