/**
 * Window and IPC Type Tests
 *
 * Comprehensive tests for window/IPC types to ensure:
 * 1. All IPC channel types are properly defined and functional
 * 2. Channel argument and return type mappings are correct
 * 3. IPC message and response structures work as expected
 * 4. Handler function types provide proper type safety
 * 5. Global window interface augmentation functions correctly
 */

import * as WindowTypes from '../../../types/window';

describe('Window and IPC Type Definitions', () => {
  describe('IPC Channel Types', () => {
    it('should have all IPC channels defined correctly', () => {
      const storeChannels: WindowTypes.IPCChannels[] = [
        'getStore',
        'setStore',
        'deleteStore',
        'resetStore',
      ];

      const taskChannels: WindowTypes.IPCChannels[] = [
        'processTask',
        'cancelTask',
        'getTaskStatus',
      ];

      const gpuChannels: WindowTypes.IPCChannels[] = [
        'detectGPUs',
        'selectGPU',
        'getGPUCapabilities',
      ];

      const settingsChannels: WindowTypes.IPCChannels[] = [
        'getSettings',
        'updateSettings',
        'getOpenVINOSettings',
        'setOpenVINOSettings',
      ];

      const systemChannels: WindowTypes.IPCChannels[] = [
        'selectDirectory',
        'openExternal',
        'getSystemInfo',
        'checkForUpdates',
      ];

      const allChannels = [
        ...storeChannels,
        ...taskChannels,
        ...gpuChannels,
        ...settingsChannels,
        ...systemChannels,
      ];

      expect(allChannels).toHaveLength(18);
      expect(
        storeChannels.every((channel) => typeof channel === 'string'),
      ).toBe(true);
      expect(taskChannels.every((channel) => typeof channel === 'string')).toBe(
        true,
      );
      expect(gpuChannels.every((channel) => typeof channel === 'string')).toBe(
        true,
      );
      expect(
        settingsChannels.every((channel) => typeof channel === 'string'),
      ).toBe(true);
      expect(
        systemChannels.every((channel) => typeof channel === 'string'),
      ).toBe(true);
    });

    it('should have all IPC event channels defined correctly', () => {
      const eventChannels: WindowTypes.IPCEventChannels[] = [
        'taskStatusChange',
        'taskProgress',
        'gpuDetectionComplete',
        'settingsChanged',
      ];

      expect(eventChannels).toHaveLength(4);
      expect(
        eventChannels.every((channel) => typeof channel === 'string'),
      ).toBe(true);
    });
  });

  describe('IPC Message Types', () => {
    it('should export IPCMessage interface correctly', () => {
      const message: WindowTypes.IPCMessage<string> = {
        id: 'test-id-123',
        timestamp: Date.now(),
        data: 'test-data',
      };

      expect(message.id).toBe('test-id-123');
      expect(typeof message.timestamp).toBe('number');
      expect(message.data).toBe('test-data');

      // Test without optional fields
      const minimalMessage: WindowTypes.IPCMessage<number> = {
        data: 42,
      };

      expect(minimalMessage.data).toBe(42);
      expect(minimalMessage.id).toBeUndefined();
      expect(minimalMessage.timestamp).toBeUndefined();
    });

    it('should export IPCResponse interface correctly', () => {
      const successResponse: WindowTypes.IPCResponse<{ result: string }> = {
        success: true,
        data: { result: 'operation completed' },
        timestamp: Date.now(),
      };

      expect(successResponse.success).toBe(true);
      expect(successResponse.data?.result).toBe('operation completed');
      expect(typeof successResponse.timestamp).toBe('number');

      const errorResponse: WindowTypes.IPCResponse = {
        success: false,
        error: 'Operation failed',
      };

      expect(errorResponse.success).toBe(false);
      expect(errorResponse.error).toBe('Operation failed');
      expect(errorResponse.data).toBeUndefined();
    });

    it('should export IPCError interface correctly', () => {
      const error: WindowTypes.IPCError = {
        code: 'INVALID_PARAMETER',
        message: 'The provided parameter is invalid',
        details: { paramName: 'temperature', providedValue: -1 },
        stack: 'Error stack trace here',
      };

      expect(error.code).toBe('INVALID_PARAMETER');
      expect(error.message).toBe('The provided parameter is invalid');
      expect(error.details.paramName).toBe('temperature');
      expect(error.stack).toBe('Error stack trace here');

      // Test minimal error
      const minimalError: WindowTypes.IPCError = {
        code: 'UNKNOWN_ERROR',
        message: 'An unknown error occurred',
      };

      expect(minimalError.code).toBe('UNKNOWN_ERROR');
      expect(minimalError.details).toBeUndefined();
      expect(minimalError.stack).toBeUndefined();
    });
  });

  describe('Handler Function Types', () => {
    it('should define IPCHandler type correctly', () => {
      const mockEvent = {} as any; // Mock Electron.IpcMainInvokeEvent

      // Sync handler
      const syncHandler: WindowTypes.IPCHandler<string, number> = (
        event,
        arg,
      ) => {
        expect(typeof arg).toBe('string');
        return 42;
      };

      const syncResult = syncHandler(mockEvent, 'test');
      expect(syncResult).toBe(42);

      // Async handler
      const asyncHandler: WindowTypes.IPCHandler<number, string> = async (
        event,
        arg,
      ) => {
        expect(typeof arg).toBe('number');
        return `Result: ${arg}`;
      };

      expect(asyncHandler(mockEvent, 100)).toBeInstanceOf(Promise);
    });

    it('should define IPCEventHandler type correctly', () => {
      const mockEvent = {} as any; // Mock Electron.IpcMainEvent

      const eventHandler: WindowTypes.IPCEventHandler<string> = (
        event,
        ...args
      ) => {
        expect(args).toHaveLength(1);
        expect(typeof args[0]).toBe('string');
      };

      // Event handlers should not return anything
      const result = eventHandler(mockEvent, 'test-event-data');
      expect(result).toBeUndefined();
    });

    it('should define IpcHandler preload type correctly', () => {
      const mockIpcHandler: WindowTypes.IpcHandler = {
        invoke: async (channel: string, ...args: any[]) => {
          expect(typeof channel).toBe('string');
          return { success: true, data: args };
        },
        send: (channel: string, ...args: any[]) => {
          expect(typeof channel).toBe('string');
          // Send should not return anything
        },
        on: (channel: string, callback: Function) => {
          expect(typeof channel).toBe('string');
          expect(typeof callback).toBe('function');
          // Return unsubscribe function
          return () => {};
        },
      };

      expect(typeof mockIpcHandler.invoke).toBe('function');
      expect(typeof mockIpcHandler.send).toBe('function');
      expect(typeof mockIpcHandler.on).toBe('function');
    });
  });

  describe('Channel-Specific Type Mappings', () => {
    it('should provide type-safe channel arguments for store channels', () => {
      type GetStoreArgs = WindowTypes.IPCChannelArgs['getStore'];
      const getArgs: GetStoreArgs = ['testKey'];
      expect(getArgs).toHaveLength(1);
      expect(typeof getArgs[0]).toBe('string');

      type SetStoreArgs = WindowTypes.IPCChannelArgs['setStore'];
      const setArgs: SetStoreArgs = ['testKey', { value: 'testValue' }];
      expect(setArgs).toHaveLength(2);
      expect(typeof setArgs[0]).toBe('string');

      type DeleteStoreArgs = WindowTypes.IPCChannelArgs['deleteStore'];
      const deleteArgs: DeleteStoreArgs = ['testKey'];
      expect(deleteArgs).toHaveLength(1);

      type ResetStoreArgs = WindowTypes.IPCChannelArgs['resetStore'];
      const resetArgs: ResetStoreArgs = [];
      expect(resetArgs).toHaveLength(0);
    });

    it('should provide type-safe channel arguments for task channels', () => {
      type ProcessTaskArgs = WindowTypes.IPCChannelArgs['processTask'];
      const processArgs: ProcessTaskArgs = ['task-123', { priority: 'high' }];
      expect(processArgs).toHaveLength(2);
      expect(typeof processArgs[0]).toBe('string');

      type CancelTaskArgs = WindowTypes.IPCChannelArgs['cancelTask'];
      const cancelArgs: CancelTaskArgs = ['task-123'];
      expect(cancelArgs).toHaveLength(1);

      type GetTaskStatusArgs = WindowTypes.IPCChannelArgs['getTaskStatus'];
      const statusArgs: GetTaskStatusArgs = ['task-123'];
      expect(statusArgs).toHaveLength(1);
    });

    it('should provide type-safe channel arguments for GPU channels', () => {
      type DetectGPUsArgs = WindowTypes.IPCChannelArgs['detectGPUs'];
      const detectArgs: DetectGPUsArgs = [];
      expect(detectArgs).toHaveLength(0);

      type SelectGPUArgs = WindowTypes.IPCChannelArgs['selectGPU'];
      const selectArgs: SelectGPUArgs = ['gpu-id-123'];
      expect(selectArgs).toHaveLength(1);
      expect(typeof selectArgs[0]).toBe('string');

      type GetGPUCapabilitiesArgs =
        WindowTypes.IPCChannelArgs['getGPUCapabilities'];
      const capabilitiesArgs: GetGPUCapabilitiesArgs = [];
      expect(capabilitiesArgs).toHaveLength(0);
    });

    it('should provide type-safe channel arguments for settings channels', () => {
      type GetSettingsArgs = WindowTypes.IPCChannelArgs['getSettings'];
      const getArgs: GetSettingsArgs = [];
      expect(getArgs).toHaveLength(0);

      type UpdateSettingsArgs = WindowTypes.IPCChannelArgs['updateSettings'];
      const updateArgs: UpdateSettingsArgs = [{ theme: 'dark' }];
      expect(updateArgs).toHaveLength(1);

      type GetOpenVINOSettingsArgs =
        WindowTypes.IPCChannelArgs['getOpenVINOSettings'];
      const getOpenVINOArgs: GetOpenVINOSettingsArgs = [];
      expect(getOpenVINOArgs).toHaveLength(0);

      type SetOpenVINOSettingsArgs =
        WindowTypes.IPCChannelArgs['setOpenVINOSettings'];
      const setOpenVINOArgs: SetOpenVINOSettingsArgs = [{ device: 'CPU' }];
      expect(setOpenVINOArgs).toHaveLength(1);
    });

    it('should provide type-safe channel arguments for system channels', () => {
      type SelectDirectoryArgs = WindowTypes.IPCChannelArgs['selectDirectory'];
      const selectArgs: SelectDirectoryArgs = [{ defaultPath: '/home' }];
      expect(selectArgs).toHaveLength(1);

      type OpenExternalArgs = WindowTypes.IPCChannelArgs['openExternal'];
      const openArgs: OpenExternalArgs = ['https://example.com'];
      expect(openArgs).toHaveLength(1);
      expect(typeof openArgs[0]).toBe('string');

      type GetSystemInfoArgs = WindowTypes.IPCChannelArgs['getSystemInfo'];
      const systemArgs: GetSystemInfoArgs = [];
      expect(systemArgs).toHaveLength(0);

      type CheckForUpdatesArgs = WindowTypes.IPCChannelArgs['checkForUpdates'];
      const updateArgs: CheckForUpdatesArgs = [];
      expect(updateArgs).toHaveLength(0);
    });
  });

  describe('Channel Return Type Mappings', () => {
    it('should provide correct return types for store channels', () => {
      type GetStoreReturn = WindowTypes.IPCChannelReturns['getStore'];
      type SetStoreReturn = WindowTypes.IPCChannelReturns['setStore'];
      type DeleteStoreReturn = WindowTypes.IPCChannelReturns['deleteStore'];
      type ResetStoreReturn = WindowTypes.IPCChannelReturns['resetStore'];

      // Test that types accept expected values
      const getResult: GetStoreReturn = { value: 'test' };
      const setResult: SetStoreReturn = true;
      const deleteResult: DeleteStoreReturn = false;
      const resetResult: ResetStoreReturn = true;

      expect(setResult).toBe(true);
      expect(deleteResult).toBe(false);
      expect(resetResult).toBe(true);
    });

    it('should provide correct return types for task channels', () => {
      type ProcessTaskReturn = WindowTypes.IPCChannelReturns['processTask'];
      type CancelTaskReturn = WindowTypes.IPCChannelReturns['cancelTask'];
      type GetTaskStatusReturn = WindowTypes.IPCChannelReturns['getTaskStatus'];

      const processResult: ProcessTaskReturn = {
        success: true,
        result: { output: 'completed' },
      };
      const cancelResult: CancelTaskReturn = true;
      const statusResult: GetTaskStatusReturn = {
        status: 'running',
        progress: 0.75,
      };

      expect(processResult.success).toBe(true);
      expect(cancelResult).toBe(true);
      expect(statusResult.status).toBe('running');
      expect(statusResult.progress).toBe(0.75);
    });

    it('should provide correct return types for system channels', () => {
      type SelectDirectoryReturn =
        WindowTypes.IPCChannelReturns['selectDirectory'];
      type OpenExternalReturn = WindowTypes.IPCChannelReturns['openExternal'];
      type CheckForUpdatesReturn =
        WindowTypes.IPCChannelReturns['checkForUpdates'];

      const selectResult: SelectDirectoryReturn = {
        canceled: false,
        filePaths: ['/selected/path'],
      };
      const openResult: OpenExternalReturn = undefined;
      const updateResult: CheckForUpdatesReturn = {
        available: true,
        version: '2.1.0',
      };

      expect(selectResult.canceled).toBe(false);
      expect(selectResult.filePaths).toEqual(['/selected/path']);
      expect(openResult).toBeUndefined();
      expect(updateResult.available).toBe(true);
      expect(updateResult.version).toBe('2.1.0');
    });
  });

  describe('Global Window Interface Augmentation', () => {
    it('should augment global Window interface with ipc property', () => {
      // Test that window.ipc type exists and has correct structure
      type WindowIpc = NonNullable<Window['ipc']>;

      // Mock window.ipc for testing
      const mockWindowIpc: WindowIpc = {
        invoke: async <T = any>(
          channel: WindowTypes.IPCChannels | string,
          ...args: any[]
        ): Promise<T> => {
          expect(typeof channel).toBe('string');
          return {} as T;
        },
        send: (
          channel:
            | WindowTypes.IPCChannels
            | WindowTypes.IPCEventChannels
            | string,
          ...args: any[]
        ): void => {
          expect(typeof channel).toBe('string');
        },
        on: (
          channel: WindowTypes.IPCEventChannels | string,
          callback: (...args: any[]) => void,
        ): (() => void) => {
          expect(typeof channel).toBe('string');
          expect(typeof callback).toBe('function');
          return () => {};
        },
        once: (
          channel: WindowTypes.IPCEventChannels | string,
          callback: (...args: any[]) => void,
        ): void => {
          expect(typeof channel).toBe('string');
          expect(typeof callback).toBe('function');
        },
        removeAllListeners: (
          channel?: WindowTypes.IPCEventChannels | string,
        ): void => {
          if (channel) expect(typeof channel).toBe('string');
        },
      };

      expect(typeof mockWindowIpc.invoke).toBe('function');
      expect(typeof mockWindowIpc.send).toBe('function');
      expect(typeof mockWindowIpc.on).toBe('function');
      expect(typeof mockWindowIpc.once).toBe('function');
      expect(typeof mockWindowIpc.removeAllListeners).toBe('function');
    });
  });

  describe('Type Export Validation', () => {
    it('should export all required window/IPC types', () => {
      // Validate that all expected types can be used (TypeScript compilation test)
      const channelTest: WindowTypes.IPCChannels = 'getStore';
      const eventChannelTest: WindowTypes.IPCEventChannels = 'taskStatusChange';

      expect(channelTest).toBe('getStore');
      expect(eventChannelTest).toBe('taskStatusChange');
    });

    it('should support complete IPC workflow with type safety', () => {
      // Test complete workflow from message to response
      const message: WindowTypes.IPCMessage<
        WindowTypes.IPCChannelArgs['processTask']
      > = {
        id: 'msg-123',
        timestamp: Date.now(),
        data: ['task-456', { priority: 'high' }],
      };

      const response: WindowTypes.IPCResponse<
        WindowTypes.IPCChannelReturns['processTask']
      > = {
        success: true,
        data: { success: true, result: { output: 'Task completed' } },
        timestamp: Date.now(),
      };

      expect(message.data[0]).toBe('task-456');
      expect(message.data[1].priority).toBe('high');
      expect(response.data?.success).toBe(true);
      expect(response.data?.result?.output).toBe('Task completed');
    });
  });
});
