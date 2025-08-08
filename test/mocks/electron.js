/**
 * Complete Mock for Electron module in tests
 * Synchronized with electron-mock.js for consistency
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
    send: createMockFn(),
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

const mockIpcMain = {
  handle: createMockFn(),
  on: createMockFn(),
  once: createMockFn(),
  off: createMockFn(),
  removeHandler: createMockFn(),
  removeAllListeners: createMockFn(),
};

// Export electron modules
module.exports = {
  app: mockApp,
  BrowserWindow: MockBrowserWindowClass,
  dialog: mockDialog,
  shell: mockShell,
  ipcMain: mockIpcMain,
};
