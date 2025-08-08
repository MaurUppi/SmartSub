/**
 * Jest Global Setup for SmartSub Test Environment
 *
 * This file sets up global variables and configurations needed before
 * any tests run. It's loaded before setupFilesAfterEnv.
 */

// Suppress console warnings for known React testing issues
const originalWarn = console.warn;
const originalError = console.error;

console.warn = (...args) => {
  const message = args[0];
  if (
    typeof message === 'string' &&
    (message.includes('ReactDOM.render is no longer supported') ||
      message.includes('Warning: An invalid form control') ||
      message.includes('Warning: validateDOMNesting') ||
      message.includes('Warning: React.createElement') ||
      message.includes('act()'))
  ) {
    return;
  }
  originalWarn.apply(console, args);
};

console.error = (...args) => {
  const message = args[0];
  if (
    typeof message === 'string' &&
    (message.includes('Warning: ReactDOM.render is no longer supported') ||
      message.includes('The above error occurred in the') ||
      message.includes('Consider adding an error boundary'))
  ) {
    return;
  }
  originalError.apply(console, args);
};

// Global test configuration
global.TEST_CONFIG = {
  TIMEOUT: 30000,
  MOCK_DELAY: 100,
  PERFORMANCE_THRESHOLD: 100,
  MEMORY_THRESHOLD: 100000,
};

// Mock performance API if not available
if (typeof global.performance === 'undefined') {
  global.performance = {
    now: () => Date.now(),
    memory: {
      usedJSHeapSize: 0,
      totalJSHeapSize: 0,
      jsHeapSizeLimit: 0,
    },
  };
}

// Mock IntersectionObserver
if (typeof global.IntersectionObserver === 'undefined') {
  global.IntersectionObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));
}

// Mock ResizeObserver
if (typeof global.ResizeObserver === 'undefined') {
  global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));
}

// Mock MutationObserver
if (typeof global.MutationObserver === 'undefined') {
  global.MutationObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    disconnect: jest.fn(),
    takeRecords: jest.fn(() => []),
  }));
}

// Mock requestAnimationFrame
if (typeof global.requestAnimationFrame === 'undefined') {
  global.requestAnimationFrame = (callback) => {
    return setTimeout(callback, 16);
  };
}

// Mock cancelAnimationFrame
if (typeof global.cancelAnimationFrame === 'undefined') {
  global.cancelAnimationFrame = (id) => {
    clearTimeout(id);
  };
}

// Mock crypto for Node.js environment
if (typeof global.crypto === 'undefined') {
  global.crypto = {
    getRandomValues: (arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
    randomUUID: () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    },
  };
}

// Mock TextEncoder/TextDecoder
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = class TextEncoder {
    encode(string) {
      return new Uint8Array(Buffer.from(string, 'utf8'));
    }
  };
}

if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = class TextDecoder {
    decode(buffer) {
      return Buffer.from(buffer).toString('utf8');
    }
  };
}

// Mock URL
if (typeof global.URL === 'undefined') {
  global.URL = class URL {
    constructor(url, base) {
      this.href = url;
      this.origin = base || 'http://localhost:3000';
      this.protocol = 'http:';
      this.host = 'localhost:3000';
      this.hostname = 'localhost';
      this.port = '3000';
      this.pathname = '/';
      this.search = '';
      this.hash = '';
    }

    toString() {
      return this.href;
    }
  };
}

// Mock FileReader
if (typeof global.FileReader === 'undefined') {
  global.FileReader = class FileReader {
    constructor() {
      this.readyState = 0;
      this.result = null;
      this.error = null;
      this.onload = null;
      this.onloadend = null;
      this.onerror = null;
      this.onabort = null;
      this.onloadstart = null;
      this.onprogress = null;
    }

    readAsText(file) {
      this.readyState = 2;
      this.result = 'mock file content';
      if (this.onload) this.onload();
      if (this.onloadend) this.onloadend();
    }

    readAsDataURL(file) {
      this.readyState = 2;
      this.result = 'data:text/plain;base64,bW9jayBmaWxlIGNvbnRlbnQ=';
      if (this.onload) this.onload();
      if (this.onloadend) this.onloadend();
    }

    readAsArrayBuffer(file) {
      this.readyState = 2;
      this.result = new ArrayBuffer(16);
      if (this.onload) this.onload();
      if (this.onloadend) this.onloadend();
    }

    abort() {
      this.readyState = 0;
      if (this.onabort) this.onabort();
    }
  };
}

// Setup test environment flags
process.env.NODE_ENV = 'test';
process.env.JEST_ENVIRONMENT = 'jsdom';

// Store original console methods for cleanup
global.__originalConsole = {
  warn: originalWarn,
  error: originalError,
};
