/**
 * Window type declarations for SmartSub
 * Extends the global Window interface with Electron IPC functionality
 *
 * Note: Parameter-specific IPC types (IpcParameterMessage, IpcParameterResponse)
 * are kept in parameterSystem.ts as they are domain-specific.
 *
 * This file contains general IPC types and window interface definitions.
 */

// IPC Channel definitions for type safety
export type IPCChannels =
  // Store channels
  | 'getStore'
  | 'setStore'
  | 'deleteStore'
  | 'resetStore'
  // Task channels
  | 'processTask'
  | 'cancelTask'
  | 'getTaskStatus'
  // GPU channels
  | 'detectGPUs'
  | 'selectGPU'
  | 'getGPUCapabilities'
  // Settings channels
  | 'getSettings'
  | 'updateSettings'
  | 'getOpenVINOSettings'
  | 'setOpenVINOSettings'
  // System channels
  | 'selectDirectory'
  | 'openExternal'
  | 'getSystemInfo'
  | 'checkForUpdates';

// IPC Event channels
export type IPCEventChannels =
  | 'taskStatusChange'
  | 'taskProgress'
  | 'gpuDetectionComplete'
  | 'settingsChanged';

// ============= IPC MESSAGE TYPES =============

/**
 * Base IPC message structure
 */
export interface IPCMessage<T = any> {
  id?: string;
  timestamp?: number;
  data: T;
}

/**
 * Base IPC response structure
 */
export interface IPCResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp?: number;
}

/**
 * IPC Error structure
 */
export interface IPCError {
  code: string;
  message: string;
  details?: any;
  stack?: string;
}

// ============= HANDLER TYPES =============

/**
 * IPC Handler function type
 */
export type IPCHandler<TArgs = any, TResult = any> = (
  event: Electron.IpcMainInvokeEvent,
  ...args: TArgs[]
) => Promise<TResult> | TResult;

/**
 * IPC Event Handler function type
 */
export type IPCEventHandler<TArgs = any> = (
  event: Electron.IpcMainEvent,
  ...args: TArgs[]
) => void;

/**
 * Preload script handler type
 * @since 2025.1
 */
export type IpcHandler = {
  invoke: (channel: string, ...args: any[]) => Promise<any>;
  send: (channel: string, ...args: any[]) => void;
  on: (channel: string, callback: Function) => () => void;
};

// ============= CHANNEL-SPECIFIC TYPES =============

/**
 * Channel argument mappings for type safety
 */
export interface IPCChannelArgs {
  // Store channels
  getStore: [key: string];
  setStore: [key: string, value: any];
  deleteStore: [key: string];
  resetStore: [];

  // Task channels
  processTask: [taskId: string, options: any];
  cancelTask: [taskId: string];
  getTaskStatus: [taskId: string];

  // GPU channels
  detectGPUs: [];
  selectGPU: [gpuId: string];
  getGPUCapabilities: [];

  // Settings channels
  getSettings: [];
  updateSettings: [settings: Partial<any>];
  getOpenVINOSettings: [];
  setOpenVINOSettings: [settings: any];

  // System channels
  selectDirectory: [options?: any];
  openExternal: [url: string];
  getSystemInfo: [];
  checkForUpdates: [];
}

/**
 * Channel return type mappings
 */
export interface IPCChannelReturns {
  getStore: any;
  setStore: boolean;
  deleteStore: boolean;
  resetStore: boolean;
  processTask: { success: boolean; result?: any };
  cancelTask: boolean;
  getTaskStatus: { status: string; progress?: number };
  detectGPUs: any; // GPUCapabilities
  selectGPU: boolean;
  getGPUCapabilities: any; // GPUCapabilities
  getSettings: any; // EnhancedSettings
  updateSettings: boolean;
  getOpenVINOSettings: any; // OpenVINOPreferences
  setOpenVINOSettings: boolean;
  selectDirectory: { canceled: boolean; filePaths: string[] };
  openExternal: void;
  getSystemInfo: any;
  checkForUpdates: { available: boolean; version?: string };
}

declare global {
  interface Window {
    ipc?: {
      invoke: <T = any>(
        channel: IPCChannels | string,
        ...args: any[]
      ) => Promise<T>;
      send: (
        channel: IPCChannels | IPCEventChannels | string,
        ...args: any[]
      ) => void;
      on: (
        channel: IPCEventChannels | string,
        callback: (...args: any[]) => void,
      ) => () => void;
      once: (
        channel: IPCEventChannels | string,
        callback: (...args: any[]) => void,
      ) => void;
      removeAllListeners: (channel?: IPCEventChannels | string) => void;
    };
  }
}

export {};
