/**
 * Complete Electron App Mock for Jest Testing
 * Provides comprehensive app API coverage for test stability
 */

const path = require('path');
const os = require('os');

// Create jest mock functions using safe approach
const createMockFn = () => {
  if (typeof global.jest !== 'undefined' && global.jest.fn) {
    return global.jest.fn();
  }
  return function mockFunction() {};
};

const createMockReturnValue = (value) => {
  if (typeof global.jest !== 'undefined' && global.jest.fn) {
    return global.jest.fn(() => value);
  }
  return () => value;
};

const createMockResolvedValue = (value) => {
  if (typeof global.jest !== 'undefined' && global.jest.fn) {
    return global.jest.fn(() => Promise.resolve(value));
  }
  return () => Promise.resolve(value);
};

const createMockImplementation = (impl) => {
  if (typeof global.jest !== 'undefined' && global.jest.fn) {
    return global.jest.fn().mockImplementation(impl);
  }
  return impl;
};

// Complete Electron app mock with all methods used in the application
const mockApp = {
  // Path methods
  getAppPath: () => path.join(os.tmpdir(), 'test-app'),
  getPath: (pathName) => {
    const basePath = os.tmpdir();
    switch (pathName) {
      case 'userData':
        return path.join(basePath, 'test-user-data');
      case 'temp':
        return path.join(basePath, 'test-temp');
      case 'home':
        return path.join(basePath, 'test-home');
      case 'appData':
        return path.join(basePath, 'test-app-data');
      case 'desktop':
        return path.join(basePath, 'test-desktop');
      case 'documents':
        return path.join(basePath, 'test-documents');
      case 'downloads':
        return path.join(basePath, 'test-downloads');
      case 'music':
        return path.join(basePath, 'test-music');
      case 'pictures':
        return path.join(basePath, 'test-pictures');
      case 'videos':
        return path.join(basePath, 'test-videos');
      case 'logs':
        return path.join(basePath, 'test-logs');
      case 'crashDumps':
        return path.join(basePath, 'test-crash-dumps');
      default:
        return path.join(basePath, 'test-default');
    }
  },
  setPath: createMockFn(),

  // Application info methods
  getVersion: () => '2.5.2-test',
  getName: () => 'smartsub-test',
  isPackaged: false,
  getLocale: () => 'en-US',
  getSystemLocale: () => 'en-US',

  // Application lifecycle methods
  quit: createMockFn(),
  exit: createMockFn(),
  relaunch: createMockFn(),
  isReady: createMockReturnValue(true),
  whenReady: createMockResolvedValue(),

  // Window management
  focus: createMockFn(),
  hide: createMockFn(),
  show: createMockFn(),

  // Event handling
  on: createMockFn(),
  once: createMockFn(),
  off: createMockFn(),
  emit: createMockFn(),
  removeListener: createMockFn(),
  removeAllListeners: createMockFn(),

  // Platform specific
  dock: {
    setBadge: createMockFn(),
    getBadge: createMockReturnValue(''),
    hide: createMockFn(),
    show: createMockFn(),
    setIcon: createMockFn(),
  },

  // Security
  setSecureKeyboardEntryEnabled: createMockFn(),

  // Other methods
  getFileIcon: createMockResolvedValue({
    toDataURL: () => 'data:image/png;base64,test',
  }),
  getJumpListSettings: createMockReturnValue({ removedItems: [] }),
  setJumpList: createMockFn(),
  requestSingleInstanceLock: createMockReturnValue(true),
  hasSingleInstanceLock: createMockReturnValue(true),
  releaseSingleInstanceLock: createMockFn(),
  setUserTasks: createMockFn(),
  getGPUFeatureStatus: createMockReturnValue({}),
  setBadgeCount: createMockFn(),
  getBadgeCount: createMockReturnValue(0),
  getLoginItemSettings: createMockReturnValue({ openAtLogin: false }),
  setLoginItemSettings: createMockFn(),
  isEmojiPanelSupported: createMockReturnValue(false),
  showEmojiPanel: createMockFn(),
  startAccessingSecurityScopedResource: createMockReturnValue(createMockFn()),
  enableSandbox: createMockFn(),
  isInApplicationsFolder: createMockReturnValue(true),
  moveToApplicationsFolder: createMockReturnValue(true),
  isSecureKeyboardEntryEnabled: createMockReturnValue(false),
  setAboutPanelOptions: createMockFn(),
  showAboutPanel: createMockFn(),
  commandLine: {
    appendSwitch: createMockFn(),
    appendArgument: createMockFn(),
    hasSwitch: createMockReturnValue(false),
    getSwitchValue: createMockReturnValue(''),
  },
};

// Complete BrowserWindow mock
const mockBrowserWindow = {
  getAllWindows: createMockReturnValue([]),
  getFocusedWindow: createMockReturnValue(null),
  fromWebContents: createMockReturnValue(null),
  fromBrowserView: createMockReturnValue(null),
  fromId: createMockReturnValue(null),
};

// Mock BrowserWindow constructor
const MockBrowserWindowClass = createMockImplementation(() => ({
  id: 1,
  webContents: {
    id: 1,
    send: createMockImplementation((channel, ...args) => {
      // Simulate webContents.send() -> ipcRenderer.on() pattern
      ipcMockSystem.eventQueue.push({
        type: 'reply',
        channel,
        args,
        timestamp: Date.now(),
      });
      ipcMockSystem.processEventQueue();
    }),
    postMessage: createMockFn(),
    executeJavaScript: createMockResolvedValue(),
    insertCSS: createMockResolvedValue(),
    removeInsertedCSS: createMockFn(),
    setWindowOpenHandler: createMockFn(),
    on: createMockFn(),
    once: createMockFn(),
    off: createMockFn(),
    removeListener: createMockFn(),
    removeAllListeners: createMockFn(),
    session: {
      clearStorageData: createMockResolvedValue(),
    },
  },
  loadURL: createMockResolvedValue(),
  loadFile: createMockResolvedValue(),
  close: createMockFn(),
  destroy: createMockFn(),
  focus: createMockFn(),
  blur: createMockFn(),
  isFocused: createMockReturnValue(false),
  isDestroyed: createMockReturnValue(false),
  show: createMockFn(),
  showInactive: createMockFn(),
  hide: createMockFn(),
  isVisible: createMockReturnValue(true),
  isModal: createMockReturnValue(false),
  maximize: createMockFn(),
  unmaximize: createMockFn(),
  isMaximized: createMockReturnValue(false),
  minimize: createMockFn(),
  restore: createMockFn(),
  isMinimized: createMockReturnValue(false),
  setFullScreen: createMockFn(),
  isFullScreen: createMockReturnValue(false),
  setBounds: createMockFn(),
  getBounds: createMockReturnValue({ x: 0, y: 0, width: 800, height: 600 }),
  setContentBounds: createMockFn(),
  getContentBounds: createMockReturnValue({
    x: 0,
    y: 0,
    width: 800,
    height: 600,
  }),
  setSize: createMockFn(),
  getSize: createMockReturnValue([800, 600]),
  setContentSize: createMockFn(),
  getContentSize: createMockReturnValue([800, 600]),
  setMinimumSize: createMockFn(),
  getMinimumSize: createMockReturnValue([0, 0]),
  setMaximumSize: createMockFn(),
  getMaximumSize: createMockReturnValue([0, 0]),
  setResizable: createMockFn(),
  isResizable: createMockReturnValue(true),
  setMovable: createMockFn(),
  isMovable: createMockReturnValue(true),
  setMinimizable: createMockFn(),
  isMinimizable: createMockReturnValue(true),
  setMaximizable: createMockFn(),
  isMaximizable: createMockReturnValue(true),
  setFullScreenable: createMockFn(),
  isFullScreenable: createMockReturnValue(true),
  setClosable: createMockFn(),
  isClosable: createMockReturnValue(true),
  setAlwaysOnTop: createMockFn(),
  isAlwaysOnTop: createMockReturnValue(false),
  moveTop: createMockFn(),
  center: createMockFn(),
  setPosition: createMockFn(),
  getPosition: createMockReturnValue([0, 0]),
  setTitle: createMockFn(),
  getTitle: createMockReturnValue('Test Window'),
  on: createMockFn(),
  once: createMockFn(),
  off: createMockFn(),
  removeListener: createMockFn(),
  removeAllListeners: createMockFn(),
}));

// Add static methods to the constructor
Object.assign(MockBrowserWindowClass, mockBrowserWindow);

// Mock other Electron modules
const mockDialog = {
  showOpenDialog: createMockResolvedValue({ canceled: false, filePaths: [] }),
  showSaveDialog: createMockResolvedValue({ canceled: false, filePath: '' }),
  showMessageBox: createMockResolvedValue({ response: 0 }),
  showErrorBox: createMockFn(),
  showCertificateTrustDialog: createMockResolvedValue(),
};

const mockShell = {
  showItemInFolder: createMockFn(),
  openPath: createMockResolvedValue(''),
  openExternal: createMockResolvedValue(),
  moveItemToTrash: createMockResolvedValue(true),
  beep: createMockFn(),
  writeShortcutLink: createMockResolvedValue(true),
  readShortcutLink: createMockResolvedValue({}),
};

// Comprehensive Bidirectional IPC Communication System
class IPCMockSystem {
  constructor() {
    this.handlers = new Map(); // ipcMain.handle() handlers
    this.listeners = new Map(); // ipcMain.on() listeners
    this.rendererListeners = new Map(); // ipcRenderer.on() listeners
    this.eventQueue = []; // For async event processing
    this.isProcessingEvents = false;
  }

  // Process queued events asynchronously to simulate real IPC timing
  async processEventQueue() {
    if (this.isProcessingEvents) return;
    this.isProcessingEvents = true;

    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift();
      await new Promise((resolve) => setTimeout(resolve, 1)); // Simulate async delay

      try {
        if (event.type === 'invoke') {
          await this.processInvokeEvent(event);
        } else if (event.type === 'send') {
          await this.processSendEvent(event);
        } else if (event.type === 'reply') {
          await this.processReplyEvent(event);
        }
      } catch (error) {
        console.warn('IPC Mock Event Processing Error:', error);
      }
    }

    this.isProcessingEvents = false;
  }

  // Process ipcRenderer.invoke() -> ipcMain.handle() pattern
  async processInvokeEvent(event) {
    const { channel, args, resolve, reject } = event;

    if (this.handlers.has(channel)) {
      try {
        const handler = this.handlers.get(channel);
        const mockEvent = this.createMockEvent();
        const result = await handler(mockEvent, ...args);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    } else {
      // Provide realistic fallbacks for common channels
      const fallbackResult = this.getFallbackResponse(channel, args);
      resolve(fallbackResult);
    }
  }

  // Process ipcRenderer.send() -> ipcMain.on() pattern
  async processSendEvent(event) {
    const { channel, args } = event;

    if (this.listeners.has(channel)) {
      const listeners = this.listeners.get(channel);
      const mockEvent = this.createMockEvent();

      for (const listener of listeners) {
        try {
          await listener(mockEvent, ...args);
        } catch (error) {
          console.warn(
            `IPC Mock Send Event Error for channel ${channel}:`,
            error,
          );
        }
      }
    }
  }

  // Process webContents.send() -> ipcRenderer.on() pattern
  async processReplyEvent(event) {
    const { channel, args } = event;

    if (this.rendererListeners.has(channel)) {
      const listeners = this.rendererListeners.get(channel);
      const mockEvent = this.createMockEvent();

      for (const listener of listeners) {
        try {
          await listener(mockEvent, ...args);
        } catch (error) {
          console.warn(
            `IPC Mock Reply Event Error for channel ${channel}:`,
            error,
          );
        }
      }
    }
  }

  // Create realistic mock event object
  createMockEvent() {
    const mockSender = {
      send: (channel, ...args) => {
        // Simulate webContents.send() -> ipcRenderer.on()
        this.eventQueue.push({
          type: 'reply',
          channel,
          args,
          timestamp: Date.now(),
        });
        this.processEventQueue();
      },
      postMessage: createMockFn(),
      executeJavaScript: createMockResolvedValue(),
      insertCSS: createMockResolvedValue(),
      removeInsertedCSS: createMockFn(),
    };

    return {
      sender: mockSender,
      reply: (channel, ...args) => mockSender.send(channel, ...args),
      returnValue: undefined,
      preventDefault: createMockFn(),
      defaultPrevented: false,
    };
  }

  // Provide realistic fallback responses for common IPC channels
  getFallbackResponse(channel, args) {
    const fallbacks = {
      getDroppedFiles: [],
      readSubtitleFile: [],
      readRawFileContent: { content: '' },
      saveSubtitleFile: { success: true },
      checkFileExists: { exists: true },
      getDirectoryFiles: { files: [] },
      selectDirectory: { canceled: false, filePaths: [] },
      getCustomParameters: null,
      setCustomParameters: true,
      validateParameterConfiguration: [],
      openExternal: true,
      getAppSettings: {
        whisperCommand: 'whisper',
        modelsPath: '/mock/models',
        useCuda: false,
        useOpenVINO: false,
        maxContext: -1,
      },
      setAppSettings: true,
      getGPUInfo: {
        nvidia: false,
        intel: [],
        apple: false,
        cpu: true,
        openvinoVersion: null,
      },
      selectOptimalGPU: {
        type: 'cpu',
        displayName: 'CPU',
        fallbackReason: 'Default fallback',
      },
    };

    return fallbacks[channel] || null;
  }
}

// Create global IPC mock system instance
const ipcMockSystem = new IPCMockSystem();

// Enhanced ipcMain mock with bidirectional communication
const mockIpcMain = {
  handle: createMockImplementation((channel, handler) => {
    ipcMockSystem.handlers.set(channel, handler);
  }),

  on: createMockImplementation((channel, listener) => {
    if (!ipcMockSystem.listeners.has(channel)) {
      ipcMockSystem.listeners.set(channel, []);
    }
    ipcMockSystem.listeners.get(channel).push(listener);
  }),

  once: createMockImplementation((channel, listener) => {
    const onceWrapper = (...args) => {
      listener(...args);
      // Remove after first call
      const listeners = ipcMockSystem.listeners.get(channel) || [];
      const index = listeners.indexOf(onceWrapper);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };

    if (!ipcMockSystem.listeners.has(channel)) {
      ipcMockSystem.listeners.set(channel, []);
    }
    ipcMockSystem.listeners.get(channel).push(onceWrapper);
  }),

  off: createMockImplementation((channel, listener) => {
    if (ipcMockSystem.listeners.has(channel)) {
      const listeners = ipcMockSystem.listeners.get(channel);
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }),

  removeHandler: createMockImplementation((channel) => {
    ipcMockSystem.handlers.delete(channel);
  }),

  removeAllListeners: createMockImplementation((channel) => {
    if (channel) {
      ipcMockSystem.listeners.delete(channel);
    } else {
      ipcMockSystem.listeners.clear();
    }
  }),
};

// Enhanced ipcRenderer mock with bidirectional communication
const mockIpcRenderer = {
  invoke: createMockImplementation((channel, ...args) => {
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
  }),

  send: createMockImplementation((channel, ...args) => {
    ipcMockSystem.eventQueue.push({
      type: 'send',
      channel,
      args,
      timestamp: Date.now(),
    });
    ipcMockSystem.processEventQueue();
  }),

  sendSync: createMockImplementation((channel, ...args) => {
    // For sync calls, return fallback immediately
    return ipcMockSystem.getFallbackResponse(channel, args);
  }),

  on: createMockImplementation((channel, listener) => {
    if (!ipcMockSystem.rendererListeners.has(channel)) {
      ipcMockSystem.rendererListeners.set(channel, []);
    }
    ipcMockSystem.rendererListeners.get(channel).push(listener);

    // Return cleanup function
    return () => {
      const listeners = ipcMockSystem.rendererListeners.get(channel) || [];
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }),

  once: createMockImplementation((channel, listener) => {
    const onceWrapper = (...args) => {
      listener(...args);
      // Remove after first call
      const listeners = ipcMockSystem.rendererListeners.get(channel) || [];
      const index = listeners.indexOf(onceWrapper);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };

    if (!ipcMockSystem.rendererListeners.has(channel)) {
      ipcMockSystem.rendererListeners.set(channel, []);
    }
    ipcMockSystem.rendererListeners.get(channel).push(onceWrapper);

    // Return cleanup function
    return () => {
      const listeners = ipcMockSystem.rendererListeners.get(channel) || [];
      const index = listeners.indexOf(onceWrapper);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }),

  off: createMockImplementation((channel, listener) => {
    if (ipcMockSystem.rendererListeners.has(channel)) {
      const listeners = ipcMockSystem.rendererListeners.get(channel);
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }),

  removeListener: createMockImplementation((channel, listener) => {
    mockIpcRenderer.off(channel, listener);
  }),

  removeAllListeners: createMockImplementation((channel) => {
    if (channel) {
      ipcMockSystem.rendererListeners.delete(channel);
    } else {
      ipcMockSystem.rendererListeners.clear();
    }
  }),
};

// Mock contextBridge for preload context
const mockContextBridge = {
  exposeInMainWorld: createMockImplementation((apiKey, api) => {
    // Simulate contextBridge.exposeInMainWorld behavior
    global[apiKey] = api;
    if (typeof window !== 'undefined') {
      window[apiKey] = api;
    }
  }),
};

// Create realistic window.ipc handler matching preload.ts
const createWindowIpcHandler = () => ({
  send: (channel, value) => mockIpcRenderer.send(channel, value),
  invoke: (channel, ...args) => mockIpcRenderer.invoke(channel, ...args),
  on: (channel, callback) => {
    const subscription = (_event, ...args) => callback(...args);
    const cleanup = mockIpcRenderer.on(channel, subscription);
    return cleanup;
  },
});

// Set global mocks
global.app = mockApp;
global.BrowserWindow = MockBrowserWindowClass;
global.dialog = mockDialog;
global.shell = mockShell;
global.ipcMain = mockIpcMain;
global.ipcRenderer = mockIpcRenderer;
global.contextBridge = mockContextBridge;

// Setup window.ipc for tests that expect it
if (typeof window !== 'undefined') {
  window.ipc = createWindowIpcHandler();
} else if (typeof global !== 'undefined') {
  global.window = global.window || {};
  global.window.ipc = createWindowIpcHandler();
}

// Export for module mocking and test utilities
module.exports = {
  app: mockApp,
  BrowserWindow: MockBrowserWindowClass,
  dialog: mockDialog,
  shell: mockShell,
  ipcMain: mockIpcMain,
  ipcRenderer: mockIpcRenderer,
  contextBridge: mockContextBridge,
  ipcMockSystem: ipcMockSystem, // Export for advanced test scenarios
  createWindowIpcHandler: createWindowIpcHandler,
};
