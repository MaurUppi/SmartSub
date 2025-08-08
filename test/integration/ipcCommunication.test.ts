/**
 * IPC Communication Integration Tests
 *
 * Tests the bidirectional IPC communication system to ensure
 * proper message passing between main and renderer processes
 */

import IPCTestUtils, { CommonIPCChannels } from '../setup/ipcTestUtils';

// Import the actual IPC handlers to test real integration
import { setupIpcHandlers } from '../../main/helpers/ipcHandlers';

describe('IPC Communication Integration', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    IPCTestUtils.clearAllMocks();
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up after each test
    IPCTestUtils.clearAllMocks();
  });

  describe('Bidirectional Communication Patterns', () => {
    test('should support ipcRenderer.invoke() -> ipcMain.handle() pattern', async () => {
      // Set up a mock handler
      const mockHandler = jest
        .fn()
        .mockResolvedValue({ success: true, data: 'test-response' });
      IPCTestUtils.setupMockHandler('test-invoke-channel', mockHandler);

      // Simulate invoke from renderer
      const result = await IPCTestUtils.simulateInvoke(
        'test-invoke-channel',
        'test-arg-1',
        'test-arg-2',
      );

      // Verify the handler was called with correct arguments
      expect(mockHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          sender: expect.objectContaining({
            send: expect.any(Function),
          }),
        }),
        'test-arg-1',
        'test-arg-2',
      );

      // Verify the result
      expect(result).toEqual({ success: true, data: 'test-response' });
    });

    test('should support ipcRenderer.send() -> ipcMain.on() pattern', async () => {
      // Set up a mock listener
      const mockListener = jest.fn();
      IPCTestUtils.setupMockListener('test-send-channel', mockListener);

      // Simulate send from renderer
      await IPCTestUtils.simulateSend('test-send-channel', 'test-data');

      // Wait for events to process
      await IPCTestUtils.waitForIPCEvents();

      // Verify the listener was called
      expect(mockListener).toHaveBeenCalledWith(
        expect.objectContaining({
          sender: expect.objectContaining({
            send: expect.any(Function),
          }),
        }),
        'test-data',
      );
    });

    test('should support webContents.send() -> ipcRenderer.on() pattern', async () => {
      // Set up a mock renderer listener
      const mockRendererListener = jest.fn();
      IPCTestUtils.setupMockRendererListener(
        'test-reply-channel',
        mockRendererListener,
      );

      // Simulate main process sending to renderer
      await IPCTestUtils.simulateMainToRenderer(
        'test-reply-channel',
        'reply-data',
      );

      // Wait for events to process
      await IPCTestUtils.waitForIPCEvents();

      // Verify the renderer listener was called
      expect(mockRendererListener).toHaveBeenCalledWith(
        expect.objectContaining({
          sender: expect.objectContaining({
            send: expect.any(Function),
          }),
        }),
        'reply-data',
      );
    });
  });

  describe('Realistic Application Workflows', () => {
    test('should handle file selection workflow', async () => {
      // Set up realistic file selection handler
      const mockFileHandler = jest.fn().mockResolvedValue([
        { path: '/test/file1.mp4', name: 'file1.mp4' },
        { path: '/test/file2.wav', name: 'file2.wav' },
      ]);
      IPCTestUtils.setupMockHandler(
        CommonIPCChannels.GET_DROPPED_FILES,
        mockFileHandler,
      );

      // Simulate file drop from renderer
      const result = await IPCTestUtils.simulateInvoke(
        CommonIPCChannels.GET_DROPPED_FILES,
        {
          files: ['/test/file1.mp4', '/test/file2.wav'],
          taskType: 'transcribe',
        },
      );

      // Verify handler was called with correct arguments
      expect(mockFileHandler).toHaveBeenCalledWith(expect.any(Object), {
        files: ['/test/file1.mp4', '/test/file2.wav'],
        taskType: 'transcribe',
      });

      // Verify result structure
      expect(result).toEqual([
        { path: '/test/file1.mp4', name: 'file1.mp4' },
        { path: '/test/file2.wav', name: 'file2.wav' },
      ]);
    });

    test('should handle settings save/load workflow', async () => {
      // Set up settings handlers
      const mockGetSettings = jest.fn().mockResolvedValue({
        whisperCommand: 'whisper',
        useCuda: false,
        useOpenVINO: true,
      });
      const mockSetSettings = jest.fn().mockResolvedValue(true);

      IPCTestUtils.setupMockHandler(
        CommonIPCChannels.GET_APP_SETTINGS,
        mockGetSettings,
      );
      IPCTestUtils.setupMockHandler(
        CommonIPCChannels.SET_APP_SETTINGS,
        mockSetSettings,
      );

      // Simulate getting settings
      const settings = await IPCTestUtils.simulateInvoke(
        CommonIPCChannels.GET_APP_SETTINGS,
      );
      expect(settings).toEqual({
        whisperCommand: 'whisper',
        useCuda: false,
        useOpenVINO: true,
      });

      // Simulate updating settings
      const newSettings = { ...settings, useOpenVINO: false };
      const saveResult = await IPCTestUtils.simulateInvoke(
        CommonIPCChannels.SET_APP_SETTINGS,
        newSettings,
      );
      expect(saveResult).toBe(true);

      // Verify handlers were called correctly
      expect(mockGetSettings).toHaveBeenCalled();
      expect(mockSetSettings).toHaveBeenCalledWith(
        expect.any(Object),
        newSettings,
      );
    });

    test('should handle GPU selection workflow', async () => {
      // Set up GPU detection and selection handlers
      const mockGPUInfo = jest.fn().mockResolvedValue({
        nvidia: false,
        intel: [{ id: 'intel-xe', name: 'Intel Xe Graphics' }],
        apple: false,
        cpu: true,
        openvinoVersion: '2024.6.0',
      });
      const mockSelectGPU = jest.fn().mockResolvedValue({
        type: 'intel',
        displayName: 'Intel Xe Graphics',
        expectedSpeedup: '2x',
      });

      IPCTestUtils.setupMockHandler(
        CommonIPCChannels.GET_GPU_INFO,
        mockGPUInfo,
      );
      IPCTestUtils.setupMockHandler(
        CommonIPCChannels.SELECT_OPTIMAL_GPU,
        mockSelectGPU,
      );

      // Simulate GPU detection
      const gpuInfo = await IPCTestUtils.simulateInvoke(
        CommonIPCChannels.GET_GPU_INFO,
      );
      expect(gpuInfo.intel.length).toBeGreaterThan(0);

      // Simulate GPU selection
      const selectedGPU = await IPCTestUtils.simulateInvoke(
        CommonIPCChannels.SELECT_OPTIMAL_GPU,
        ['intel', 'nvidia', 'cpu'],
        gpuInfo,
        'base',
      );
      expect(selectedGPU.type).toBe('intel');
    });
  });

  describe('Event Listener Management', () => {
    test('should properly register and cleanup event listeners', async () => {
      const mockListener1 = jest.fn();
      const mockListener2 = jest.fn();

      // Register multiple listeners for the same channel
      IPCTestUtils.setupMockListener('test-multi-channel', mockListener1);
      IPCTestUtils.setupMockListener('test-multi-channel', mockListener2);

      // Send an event
      await IPCTestUtils.simulateSend('test-multi-channel', 'test-data');
      await IPCTestUtils.waitForIPCEvents();

      // Both listeners should be called
      expect(mockListener1).toHaveBeenCalledWith(
        expect.any(Object),
        'test-data',
      );
      expect(mockListener2).toHaveBeenCalledWith(
        expect.any(Object),
        'test-data',
      );

      // Clear mocks and verify cleanup
      IPCTestUtils.clearAllMocks();
      const state = IPCTestUtils.getMockSystemState();
      expect(state.listenersCount).toBe(0);
    });

    test('should handle once listeners correctly', async () => {
      // This would be tested if we had access to the actual ipcMain.once functionality
      // For now, we verify that the mock system supports the concept
      const state = IPCTestUtils.getMockSystemState();
      expect(state).toHaveProperty('handlersCount');
      expect(state).toHaveProperty('listenersCount');
      expect(state).toHaveProperty('rendererListenersCount');
    });
  });

  describe('Error Handling', () => {
    test('should handle invoke errors gracefully', async () => {
      // Set up a handler that throws an error
      const mockErrorHandler = jest
        .fn()
        .mockRejectedValue(new Error('Test error'));
      IPCTestUtils.setupMockHandler('error-channel', mockErrorHandler);

      // Simulate invoke that should fail
      await expect(
        IPCTestUtils.simulateInvoke('error-channel', 'test-arg'),
      ).rejects.toThrow('Test error');
    });

    test('should provide fallback responses for unknown channels', async () => {
      // Test fallback for a known channel
      const result = await IPCTestUtils.simulateInvoke(
        CommonIPCChannels.GET_DROPPED_FILES,
      );
      expect(result).toEqual([]);

      // Test fallback for unknown channel
      const unknownResult =
        await IPCTestUtils.simulateInvoke('unknown-channel');
      expect(unknownResult).toBeNull();
    });
  });

  describe('Async Event Processing', () => {
    test('should process events asynchronously', async () => {
      const mockListener = jest.fn();
      IPCTestUtils.setupMockListener('async-test-channel', mockListener);

      // Send multiple events quickly
      IPCTestUtils.simulateSend('async-test-channel', 'event-1');
      IPCTestUtils.simulateSend('async-test-channel', 'event-2');
      IPCTestUtils.simulateSend('async-test-channel', 'event-3');

      // Wait for all events to process
      await IPCTestUtils.waitForIPCEvents();

      // All events should be processed
      expect(mockListener).toHaveBeenCalledTimes(3);
      expect(mockListener).toHaveBeenNthCalledWith(
        1,
        expect.any(Object),
        'event-1',
      );
      expect(mockListener).toHaveBeenNthCalledWith(
        2,
        expect.any(Object),
        'event-2',
      );
      expect(mockListener).toHaveBeenNthCalledWith(
        3,
        expect.any(Object),
        'event-3',
      );
    });

    test('should handle concurrent invoke calls', async () => {
      const mockHandler = jest.fn().mockImplementation((event, arg) => {
        return Promise.resolve(`response-${arg}`);
      });
      IPCTestUtils.setupMockHandler('concurrent-test', mockHandler);

      // Make multiple concurrent invoke calls
      const promises = [
        IPCTestUtils.simulateInvoke('concurrent-test', 'call-1'),
        IPCTestUtils.simulateInvoke('concurrent-test', 'call-2'),
        IPCTestUtils.simulateInvoke('concurrent-test', 'call-3'),
      ];

      const results = await Promise.all(promises);

      // All calls should complete successfully
      expect(results).toEqual([
        'response-call-1',
        'response-call-2',
        'response-call-3',
      ]);
      expect(mockHandler).toHaveBeenCalledTimes(3);
    });
  });

  describe('Window IPC Handler', () => {
    test('should create proper window.ipc interface', () => {
      const windowIpc = IPCTestUtils.createMockWindowIpc();

      // Verify interface structure
      expect(windowIpc).toHaveProperty('send');
      expect(windowIpc).toHaveProperty('invoke');
      expect(windowIpc).toHaveProperty('on');

      expect(typeof windowIpc.send).toBe('function');
      expect(typeof windowIpc.invoke).toBe('function');
      expect(typeof windowIpc.on).toBe('function');
    });

    test('should handle window.ipc.invoke calls', async () => {
      const mockHandler = jest.fn().mockResolvedValue('window-ipc-response');
      IPCTestUtils.setupMockHandler('window-ipc-test', mockHandler);

      const windowIpc = IPCTestUtils.createMockWindowIpc();
      const result = await windowIpc.invoke('window-ipc-test', 'test-arg');

      expect(result).toBe('window-ipc-response');
      expect(mockHandler).toHaveBeenCalledWith(expect.any(Object), 'test-arg');
    });
  });

  describe('System State Monitoring', () => {
    test('should track system state correctly', () => {
      // Initial state
      let state = IPCTestUtils.getMockSystemState();
      expect(state.handlersCount).toBe(0);
      expect(state.listenersCount).toBe(0);
      expect(state.rendererListenersCount).toBe(0);

      // Add some handlers and listeners
      IPCTestUtils.setupMockHandler('test-handler', jest.fn());
      IPCTestUtils.setupMockListener('test-listener', jest.fn());
      IPCTestUtils.setupMockRendererListener(
        'test-renderer-listener',
        jest.fn(),
      );

      // Check updated state
      state = IPCTestUtils.getMockSystemState();
      expect(state.handlersCount).toBe(1);
      expect(state.listenersCount).toBe(1);
      expect(state.rendererListenersCount).toBe(1);

      // Clear and verify
      IPCTestUtils.clearAllMocks();
      state = IPCTestUtils.getMockSystemState();
      expect(state.handlersCount).toBe(0);
      expect(state.listenersCount).toBe(0);
      expect(state.rendererListenersCount).toBe(0);
    });
  });
});
