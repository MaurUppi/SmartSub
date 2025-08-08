/**
 * IPC Testing Utilities
 *
 * Provides utilities for testing IPC communication in Jest tests
 * Works with the comprehensive bidirectional IPC mock system
 */

// Get the mock system from electron-mock.js
const electronMock = require('./electron-mock.js');
const { ipcMockSystem } = electronMock;

export class IPCTestUtils {
  /**
   * Wait for IPC events to be processed
   */
  static async waitForIPCEvents(): Promise<void> {
    // Wait for the mock system to process all queued events
    await new Promise((resolve) => setTimeout(resolve, 10));
    if (ipcMockSystem && ipcMockSystem.processEventQueue) {
      await ipcMockSystem.processEventQueue();
    }
  }

  /**
   * Set up a mock IPC handler for testing
   */
  static setupMockHandler(
    channel: string,
    handler: (event: any, ...args: any[]) => any,
  ): void {
    if (ipcMockSystem && ipcMockSystem.handlers) {
      ipcMockSystem.handlers.set(channel, handler);
    }
  }

  /**
   * Set up a mock IPC listener for testing
   */
  static setupMockListener(
    channel: string,
    listener: (event: any, ...args: any[]) => void,
  ): void {
    if (ipcMockSystem && ipcMockSystem.listeners) {
      if (!ipcMockSystem.listeners.has(channel)) {
        ipcMockSystem.listeners.set(channel, []);
      }
      ipcMockSystem.listeners.get(channel).push(listener);
    }
  }

  /**
   * Set up a mock renderer listener for testing
   */
  static setupMockRendererListener(
    channel: string,
    listener: (event: any, ...args: any[]) => void,
  ): void {
    if (ipcMockSystem && ipcMockSystem.rendererListeners) {
      if (!ipcMockSystem.rendererListeners.has(channel)) {
        ipcMockSystem.rendererListeners.set(channel, []);
      }
      ipcMockSystem.rendererListeners.get(channel).push(listener);
    }
  }

  /**
   * Simulate an IPC invoke call from renderer to main
   */
  static async simulateInvoke(channel: string, ...args: any[]): Promise<any> {
    if (ipcMockSystem) {
      return new Promise((resolve, reject) => {
        ipcMockSystem.eventQueue.push({
          type: 'invoke',
          channel,
          args,
          resolve,
          reject,
          timestamp: Date.now(),
        });
        ipcMockSystem.processEventQueue();
      });
    }
    return null;
  }

  /**
   * Simulate an IPC send call from renderer to main
   */
  static async simulateSend(channel: string, ...args: any[]): Promise<void> {
    if (ipcMockSystem) {
      ipcMockSystem.eventQueue.push({
        type: 'send',
        channel,
        args,
        timestamp: Date.now(),
      });
      await ipcMockSystem.processEventQueue();
    }
  }

  /**
   * Simulate a webContents.send call from main to renderer
   */
  static async simulateMainToRenderer(
    channel: string,
    ...args: any[]
  ): Promise<void> {
    if (ipcMockSystem) {
      ipcMockSystem.eventQueue.push({
        type: 'reply',
        channel,
        args,
        timestamp: Date.now(),
      });
      await ipcMockSystem.processEventQueue();
    }
  }

  /**
   * Clear all IPC handlers and listeners
   */
  static clearAllMocks(): void {
    if (ipcMockSystem) {
      if (ipcMockSystem.handlers) {
        ipcMockSystem.handlers.clear();
      }
      if (ipcMockSystem.listeners) {
        ipcMockSystem.listeners.clear();
      }
      if (ipcMockSystem.rendererListeners) {
        ipcMockSystem.rendererListeners.clear();
      }
      if (ipcMockSystem.eventQueue) {
        ipcMockSystem.eventQueue.length = 0;
      }
    }
  }

  /**
   * Get the current state of the IPC mock system
   */
  static getMockSystemState(): any {
    if (!ipcMockSystem) return null;

    return {
      handlersCount: ipcMockSystem.handlers ? ipcMockSystem.handlers.size : 0,
      listenersCount: ipcMockSystem.listeners
        ? ipcMockSystem.listeners.size
        : 0,
      rendererListenersCount: ipcMockSystem.rendererListeners
        ? ipcMockSystem.rendererListeners.size
        : 0,
      queuedEventsCount: ipcMockSystem.eventQueue
        ? ipcMockSystem.eventQueue.length
        : 0,
      isProcessingEvents: ipcMockSystem.isProcessingEvents || false,
    };
  }

  /**
   * Create a realistic mock event object for testing
   */
  static createMockEvent(): any {
    const mockSender = {
      send: jest.fn((channel: string, ...args: any[]) => {
        IPCTestUtils.simulateMainToRenderer(channel, ...args);
      }),
      postMessage: jest.fn(),
      executeJavaScript: jest.fn(() => Promise.resolve()),
      insertCSS: jest.fn(() => Promise.resolve()),
      removeInsertedCSS: jest.fn(),
    };

    return {
      sender: mockSender,
      reply: (channel: string, ...args: any[]) =>
        mockSender.send(channel, ...args),
      returnValue: undefined,
      preventDefault: jest.fn(),
      defaultPrevented: false,
    };
  }

  /**
   * Create a mock window.ipc object for renderer tests
   */
  static createMockWindowIpc(): any {
    return {
      send: (channel: string, value: any) =>
        IPCTestUtils.simulateSend(channel, value),
      invoke: (channel: string, ...args: any[]) =>
        IPCTestUtils.simulateInvoke(channel, ...args),
      on: (channel: string, callback: (...args: any[]) => void) => {
        IPCTestUtils.setupMockRendererListener(channel, (event, ...args) =>
          callback(...args),
        );
        return () => {
          // Cleanup function
          if (ipcMockSystem && ipcMockSystem.rendererListeners) {
            const listeners = ipcMockSystem.rendererListeners.get(channel);
            if (listeners) {
              // Remove the listener (simplified for testing)
              listeners.length = 0;
            }
          }
        };
      },
    };
  }
}

// Export common IPC channels used in the application
export const CommonIPCChannels = {
  // File operations
  GET_DROPPED_FILES: 'getDroppedFiles',
  READ_SUBTITLE_FILE: 'readSubtitleFile',
  READ_RAW_FILE_CONTENT: 'readRawFileContent',
  SAVE_SUBTITLE_FILE: 'saveSubtitleFile',
  CHECK_FILE_EXISTS: 'checkFileExists',
  GET_DIRECTORY_FILES: 'getDirectoryFiles',
  SELECT_DIRECTORY: 'selectDirectory',

  // Settings
  GET_APP_SETTINGS: 'getAppSettings',
  SET_APP_SETTINGS: 'setAppSettings',

  // GPU and hardware
  GET_GPU_INFO: 'getGPUInfo',
  SELECT_OPTIMAL_GPU: 'selectOptimalGPU',

  // Parameters
  GET_CUSTOM_PARAMETERS: 'getCustomParameters',
  SET_CUSTOM_PARAMETERS: 'setCustomParameters',
  VALIDATE_PARAMETER_CONFIGURATION: 'validateParameterConfiguration',

  // External
  OPEN_EXTERNAL: 'openExternal',

  // Messages and events
  MESSAGE: 'message',
  OPEN_DIALOG: 'openDialog',
  OPEN_URL: 'openUrl',
  FILE_SELECTED: 'file-selected',
  TASK_FILE_CHANGE: 'taskFileChange',
  GPU_SELECTED: 'gpuSelected',
} as const;

export default IPCTestUtils;
