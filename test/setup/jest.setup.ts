/**
 * Jest Setup Configuration
 * Individual test setup that runs before each test file
 */

// Import comprehensive electron mock system
const electronMock = require('./electron-mock.js');

// Mock electron before any modules are loaded using our comprehensive system
jest.mock('electron', () => electronMock);

// Mock electron-store to prevent initialization issues
jest.mock('electron-store', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn((key, defaultValue) => {
      // Return realistic default values for different keys
      if (key === 'settings') {
        return {
          whisperCommand: 'whisper',
          modelsPath: '/mock/models',
          useCuda: false,
          useOpenVINO: false,
          maxContext: -1,
        };
      }
      if (key === 'logs') {
        return []; // Return empty array for logs
      }
      return defaultValue;
    }),
    set: jest.fn(),
    has: jest.fn(() => true),
    delete: jest.fn(),
    clear: jest.fn(),
    size: 0,
    store: {},
  }));
});

import { mockEnvironmentSetup } from './mockEnvironment';
import { setupCompleteTestEnvironment } from './testEnvironmentFix';

// Task 1.2.3: File System Access Simulation Enhancement
// Mock fs-extra with comprehensive functionality
jest.mock('fs-extra', () => ({
  // File operations
  readFile: jest.fn().mockResolvedValue('mock file content'),
  writeFile: jest.fn().mockResolvedValue(undefined),
  readFileSync: jest.fn().mockReturnValue('mock file content'),
  writeFileSync: jest.fn().mockReturnValue(undefined),
  appendFile: jest.fn().mockResolvedValue(undefined),

  // Directory operations
  ensureDir: jest.fn().mockResolvedValue(undefined),
  ensureDirSync: jest.fn().mockReturnValue(undefined),
  readdir: jest.fn().mockResolvedValue(['file1.txt', 'file2.wav']),
  readdirSync: jest.fn().mockReturnValue(['file1.txt', 'file2.wav']),
  mkdir: jest.fn().mockResolvedValue(undefined),
  mkdirSync: jest.fn().mockReturnValue(undefined),
  rmdir: jest.fn().mockResolvedValue(undefined),

  // File/Directory checking
  pathExists: jest.fn().mockResolvedValue(true),
  pathExistsSync: jest.fn().mockReturnValue(true),
  exists: jest.fn().mockResolvedValue(true),
  existsSync: jest.fn().mockReturnValue(true),

  // File stats and info
  stat: jest.fn().mockResolvedValue({
    isFile: () => true,
    isDirectory: () => false,
    size: 1024,
    mtime: new Date(),
    ctime: new Date(),
  }),
  statSync: jest.fn().mockReturnValue({
    isFile: () => true,
    isDirectory: () => false,
    size: 1024,
    mtime: new Date(),
    ctime: new Date(),
  }),

  // Copy and move operations
  copy: jest.fn().mockResolvedValue(undefined),
  copySync: jest.fn().mockReturnValue(undefined),
  move: jest.fn().mockResolvedValue(undefined),
  moveSync: jest.fn().mockReturnValue(undefined),

  // Remove operations
  remove: jest.fn().mockResolvedValue(undefined),
  removeSync: jest.fn().mockReturnValue(undefined),
  unlink: jest.fn().mockResolvedValue(undefined),
  unlinkSync: jest.fn().mockReturnValue(undefined),

  // JSON operations
  readJson: jest.fn().mockResolvedValue({ mock: 'json data' }),
  readJsonSync: jest.fn().mockReturnValue({ mock: 'json data' }),
  writeJson: jest.fn().mockResolvedValue(undefined),
  writeJsonSync: jest.fn().mockReturnValue(undefined),

  // Stream operations
  createReadStream: jest.fn().mockReturnValue({
    on: jest.fn(),
    pipe: jest.fn(),
    close: jest.fn(),
  }),
  createWriteStream: jest.fn().mockReturnValue({
    write: jest.fn(),
    end: jest.fn(),
    on: jest.fn(),
  }),
}));

// Mock decompress with various archive format support
jest.mock('decompress', () => {
  const mockDecompress = jest
    .fn()
    .mockImplementation((input, output, options) => {
      // Simulate successful decompression
      return Promise.resolve([
        {
          path: 'extracted-file1.txt',
          type: 'file',
          data: Buffer.from('mock extracted content 1'),
        },
        {
          path: 'extracted-file2.bin',
          type: 'file',
          data: Buffer.from('mock extracted content 2'),
        },
      ]);
    });

  // Add format-specific plugins
  mockDecompress.zip = jest.fn();
  mockDecompress.tar = jest.fn();
  mockDecompress.targz = jest.fn();
  mockDecompress.tarbz2 = jest.fn();

  return mockDecompress;
});

// Enhanced path operations with platform-specific handling
jest.mock('path', () => {
  const originalPath = jest.requireActual('path');
  return {
    ...originalPath,
    // Platform-specific path handling
    join: jest.fn().mockImplementation((...segments) => {
      // Mock Windows-style paths on Windows, Unix-style elsewhere
      const separator = process.platform === 'win32' ? '\\' : '/';
      return segments.filter((segment) => segment).join(separator);
    }),

    resolve: jest.fn().mockImplementation((...segments) => {
      const separator = process.platform === 'win32' ? '\\' : '/';
      const prefix = process.platform === 'win32' ? 'C:' : '';
      const resolved = segments.filter((segment) => segment).join(separator);
      return prefix + separator + resolved;
    }),

    normalize: jest.fn().mockImplementation((path) => {
      const separator = process.platform === 'win32' ? '\\' : '/';
      return path.replace(/[/\\]/g, separator);
    }),

    dirname: jest.fn().mockImplementation((path) => {
      const separator = process.platform === 'win32' ? '\\' : '/';
      const parts = path.split(/[/\\]/);
      return parts.slice(0, -1).join(separator) || separator;
    }),

    basename: jest.fn().mockImplementation((path, ext) => {
      const parts = path.split(/[/\\]/);
      let base = parts[parts.length - 1] || '';
      if (ext && base.endsWith(ext)) {
        base = base.slice(0, -ext.length);
      }
      return base;
    }),

    extname: jest.fn().mockImplementation((path) => {
      const base = path.split(/[/\\]/).pop() || '';
      const lastDot = base.lastIndexOf('.');
      return lastDot > 0 ? base.slice(lastDot) : '';
    }),

    // Platform-specific properties
    sep: process.platform === 'win32' ? '\\' : '/',
    delimiter: process.platform === 'win32' ? ';' : ':',

    // Additional utility methods
    isAbsolute: jest.fn().mockImplementation((path) => {
      if (process.platform === 'win32') {
        return /^[A-Za-z]:/.test(path) || path.startsWith('\\\\');
      }
      return path.startsWith('/');
    }),

    relative: jest.fn().mockImplementation((from, to) => {
      // Simplified relative path calculation
      const separator = process.platform === 'win32' ? '\\' : '/';
      return `..${separator}mock-relative-path`;
    }),
  };
});

// Mock additional file system modules commonly used
jest.mock('glob', () => ({
  glob: jest.fn().mockImplementation((pattern, options, callback) => {
    const mockFiles = [
      '/mock/path/file1.wav',
      '/mock/path/file2.mp3',
      '/mock/path/subdir/file3.flac',
    ];

    if (typeof options === 'function') {
      options(null, mockFiles);
    } else if (callback) {
      callback(null, mockFiles);
    }
    return Promise.resolve(mockFiles);
  }),
  globSync: jest
    .fn()
    .mockReturnValue([
      '/mock/path/file1.wav',
      '/mock/path/file2.mp3',
      '/mock/path/subdir/file3.flac',
    ]),
}));

jest.mock('rimraf', () => ({
  rimraf: jest.fn().mockImplementation((path, callback) => {
    if (callback) callback(null);
    return Promise.resolve();
  }),
  rimrafSync: jest.fn().mockReturnValue(undefined),
}));

// Mock file watcher
jest.mock('chokidar', () => ({
  watch: jest.fn().mockReturnValue({
    on: jest.fn().mockReturnThis(),
    add: jest.fn().mockReturnThis(),
    unwatch: jest.fn().mockReturnThis(),
    close: jest.fn().mockResolvedValue(undefined),
  }),
}));

// Extend Jest matchers
import './jest.matchers';

// Setup test environment before each test file
beforeAll(async () => {
  // Individual test file setup can be added here
  console.log('Setting up test file environment...');
  // Ensure complete test environment is properly initialized
  await setupCompleteTestEnvironment();
});

afterAll(async () => {
  // Individual test file cleanup can be added here
  console.log('Cleaning up test file environment...');
  // Clean up test environment
  const { cleanupCompleteTestEnvironment } = require('./testEnvironmentFix');
  await cleanupCompleteTestEnvironment();
});
