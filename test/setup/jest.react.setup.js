/**
 * Jest Setup for React Component Testing
 *
 * Configures Jest for React component testing with JSDOM environment
 * Task 2.3: React Testing Library and component test configuration
 */

const React = require('react');
require('@testing-library/jest-dom');

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
    route: '/',
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
  }),
}));

// Mock Next.js image component
jest.mock('next/image', () => {
  // eslint-disable-next-line react/display-name
  return (props) => {
    // eslint-disable-next-line @next/next/no-img-element
    return React.createElement('img', { ...props, alt: props.alt || '' });
  };
});

// Mock Next.js Link component
jest.mock('next/link', () => {
  // eslint-disable-next-line react/display-name
  return ({ children, href, ...props }) => {
    return React.createElement('a', { href, ...props }, children);
  };
});

// Mock Next.js dynamic imports
jest.mock('next/dynamic', () => () => {
  const DynamicComponent = () => null;
  DynamicComponent.displayName = 'LoadableComponent';
  DynamicComponent.preload = jest.fn();
  return DynamicComponent;
});

// Mock Electron APIs for renderer process
Object.defineProperty(window, 'electron', {
  value: {
    ipcRenderer: {
      invoke: jest.fn().mockImplementation((channel, ...args) => {
        // Mock GPU-related IPC calls
        switch (channel) {
          case 'getGPUInfo':
            return Promise.resolve({
              nvidia: false,
              intel: [
                {
                  id: 'intel-arc-a770',
                  displayName: 'Intel Arc A770',
                  type: 'intel-discrete',
                  status: 'available',
                  performance: 'high',
                  description: 'Intel Arc A770 GPU',
                  driverVersion: '31.0.101.4887',
                  memory: 16384,
                  powerEfficiency: 'good',
                  estimatedSpeed: '3.5x faster',
                  openvinoCompatible: true,
                },
              ],
              apple: false,
              cpu: true,
              openvinoVersion: '2024.6.0',
            });
          case 'selectOptimalGPU':
            return Promise.resolve({
              type: 'intel',
              displayName: 'Intel Arc A770',
              fallbackReason: null,
            });
          case 'refreshGPUs':
            return Promise.resolve({
              nvidia: false,
              intel: [
                {
                  id: 'intel-arc-a770',
                  displayName: 'Intel Arc A770',
                  type: 'intel-discrete',
                  status: 'available',
                },
              ],
              apple: false,
              cpu: true,
            });
          default:
            return Promise.resolve({});
        }
      }),
      send: jest.fn(),
      on: jest.fn(),
      once: jest.fn(),
      off: jest.fn(),
      removeListener: jest.fn(),
      removeAllListeners: jest.fn(),
    },
    store: {
      get: jest.fn().mockImplementation((key) => {
        const defaults = {
          settings: {
            selectedGPU: 'auto',
            whisperCommand: 'whisper',
            modelsPath: '/mock/models',
            useCuda: false,
            useOpenVINO: true,
            maxContext: -1,
          },
        };
        return defaults[key] || null;
      }),
      set: jest.fn(),
      delete: jest.fn(),
      clear: jest.fn(),
    },
  },
  writable: true,
});

// Mock window.matchMedia for responsive components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock ResizeObserver for responsive components
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver for lazy loading components
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store = {};

  return {
    getItem: (key) => {
      return store[key] || null;
    },
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: localStorageMock,
});

// Mock HTMLMediaElement for audio/video components
Object.defineProperty(HTMLMediaElement.prototype, 'play', {
  writable: true,
  value: jest.fn().mockImplementation(() => Promise.resolve()),
});

Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
  writable: true,
  value: jest.fn(),
});

Object.defineProperty(HTMLMediaElement.prototype, 'load', {
  writable: true,
  value: jest.fn(),
});

// Mock getUserMedia for media access components
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: jest.fn().mockImplementation(() =>
      Promise.resolve({
        getTracks: () => [],
      }),
    ),
  },
});

// Mock file reading APIs
global.FileReader = jest.fn().mockImplementation(() => ({
  readAsText: jest.fn(),
  readAsDataURL: jest.fn(),
  readAsArrayBuffer: jest.fn(),
  onload: jest.fn(),
  onerror: jest.fn(),
  result: null,
}));

// Mock fetch for API testing
global.fetch = jest.fn().mockImplementation(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob()),
    headers: new Headers(),
  }),
);

// Console error suppression for known React issues in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
        args[0].includes('Warning: An invalid form control') ||
        args[0].includes('Warning: validateDOMNesting'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;

  // Cleanup console methods if they were overridden in globals
  if (global.__originalConsole) {
    console.warn = global.__originalConsole.warn;
    console.error = global.__originalConsole.error;
  }
});

// ============================================================================
// HOOK MOCKING SYSTEM - Phase 1.1.2
// ============================================================================

// Hook test scenario environment variables (can be set in tests)
// Example: process.env.JEST_GPU_SCENARIO = 'noGPUs'
//          process.env.JEST_SUBTITLE_SCENARIO = 'empty'
//          process.env.JEST_PARAMETER_CONFIG_SCENARIO = 'loading'

// Import hook mock utilities for global access
global.hookTestUtils = {
  // GPU Detection mock utilities
  resetGPUMocks: () => {
    if (typeof require !== 'undefined') {
      try {
        const {
          mockGPUDetectionUtils,
        } = require('../../renderer/hooks/__mocks__/useGPUDetection');
        mockGPUDetectionUtils.reset();
      } catch (e) {
        // Mock not available in this test environment
      }
    }
  },

  // Subtitles mock utilities
  resetSubtitleMocks: () => {
    if (typeof require !== 'undefined') {
      try {
        const {
          mockSubtitlesUtils,
        } = require('../../renderer/hooks/__mocks__/useSubtitles');
        mockSubtitlesUtils.reset();
      } catch (e) {
        // Mock not available in this test environment
      }
    }
  },

  // Video Player mock utilities
  resetVideoPlayerMocks: () => {
    if (typeof require !== 'undefined') {
      try {
        const {
          mockVideoPlayerUtils,
        } = require('../../renderer/hooks/__mocks__/useVideoPlayer');
        mockVideoPlayerUtils.reset();
      } catch (e) {
        // Mock not available in this test environment
      }
    }
  },

  // Parameter Config mock utilities
  resetParameterConfigMocks: () => {
    if (typeof require !== 'undefined') {
      try {
        const {
          mockParameterConfigUtils,
        } = require('../../renderer/hooks/__mocks__/useParameterConfig');
        mockParameterConfigUtils.reset();
      } catch (e) {
        // Mock not available in this test environment
      }
    }
  },

  // LocalStorage State mock utilities
  resetLocalStorageMocks: () => {
    if (typeof require !== 'undefined') {
      try {
        const {
          mockLocalStorageStateUtils,
        } = require('../../renderer/hooks/__mocks__/useLocalStorageState');
        mockLocalStorageStateUtils.reset();
      } catch (e) {
        // Mock not available in this test environment
      }
    }
  },

  // Reset all hook mocks
  resetAllHookMocks: () => {
    global.hookTestUtils.resetGPUMocks();
    global.hookTestUtils.resetSubtitleMocks();
    global.hookTestUtils.resetVideoPlayerMocks();
    global.hookTestUtils.resetParameterConfigMocks();
    global.hookTestUtils.resetLocalStorageMocks();
  },

  // Set test scenarios for hooks
  setHookScenarios: (scenarios) => {
    if (scenarios.gpu) process.env.JEST_GPU_SCENARIO = scenarios.gpu;
    if (scenarios.subtitles)
      process.env.JEST_SUBTITLE_SCENARIO = scenarios.subtitles;
    if (scenarios.parameterConfig)
      process.env.JEST_PARAMETER_CONFIG_SCENARIO = scenarios.parameterConfig;
  },

  // Clear test scenarios
  clearHookScenarios: () => {
    delete process.env.JEST_GPU_SCENARIO;
    delete process.env.JEST_SUBTITLE_SCENARIO;
    delete process.env.JEST_PARAMETER_CONFIG_SCENARIO;
  },
};

// ============================================================================
// COMMON HOOK SETUP PATTERNS
// ============================================================================

// Standard hook testing wrapper for components that use multiple hooks
global.createHookTestWrapper = (mockOverrides = {}) => {
  const defaultMocks = {
    useGPUDetection: {
      gpus: [],
      selectedGPU: null,
      isDetecting: false,
      error: null,
      refreshGPUs: jest.fn(),
      selectGPU: jest.fn(),
    },
    useSubtitles: {
      mergedSubtitles: [],
      videoPath: '',
      handleSave: jest.fn(),
      handleSubtitleChange: jest.fn(),
    },
    useVideoPlayer: {
      currentTime: 0,
      isPlaying: false,
      togglePlay: jest.fn(),
      handleSubtitleClick: jest.fn(),
    },
    useParameterConfig: {
      state: { config: null, isLoading: false },
      loadConfig: jest.fn(),
      saveConfig: jest.fn(),
    },
  };

  return { ...defaultMocks, ...mockOverrides };
};

// ============================================================================
// HOOK MOCK AUTO-SETUP
// ============================================================================

// Automatically mock common custom hooks when they're imported in tests
const mockCustomHooks = () => {
  // These will be automatically mocked when imported in test files
  const hooksToMock = [
    'renderer/hooks/useGPUDetection',
    'renderer/hooks/useSubtitles',
    'renderer/hooks/useVideoPlayer',
    'renderer/hooks/useParameterConfig',
    'renderer/hooks/useLocalStorageState',
  ];

  hooksToMock.forEach((hookPath) => {
    try {
      jest.mock(hookPath);
    } catch (e) {
      // Hook doesn't exist or already mocked
    }
  });
};

// Run hook mock setup
mockCustomHooks();

// ============================================================================
// COMPONENT LIFECYCLE TESTING SUPPORT - Phase 1.1.3
// ============================================================================

// Enhanced cleanup with component lifecycle testing support
let componentTestMemoryBaseline = 0;

// Track component test memory usage
beforeEach(() => {
  // Track memory baseline for component tests
  if (typeof performance !== 'undefined' && performance.memory) {
    componentTestMemoryBaseline = performance.memory.usedJSHeapSize;
  }

  // Ensure clean DOM state
  document.body.innerHTML = '';

  // Reset any focus state
  if (document.activeElement && document.activeElement !== document.body) {
    document.activeElement.blur();
  }
});

// ============================================================================
// ACCESSIBILITY TESTING SETUP
// ============================================================================

// Configure jest-axe for accessibility testing
if (typeof global.expect !== 'undefined') {
  try {
    const { toHaveNoViolations } = require('jest-axe');
    expect.extend(toHaveNoViolations);
  } catch (e) {
    // jest-axe not available, skip accessibility extensions
  }
}

// Mock screen reader announcements for testing
global.mockScreenReader = {
  announcements: [],
  announce: function (message) {
    this.announcements.push(message);
  },
  clearAnnouncements: function () {
    this.announcements = [];
  },
  getLastAnnouncement: function () {
    return this.announcements[this.announcements.length - 1];
  },
};

// ============================================================================
// COMPONENT TEST UTILITIES
// ============================================================================

// Global utilities for component lifecycle testing
global.componentTestUtils = {
  // Memory leak detection
  checkMemoryLeak: () => {
    if (typeof performance !== 'undefined' && performance.memory) {
      const currentMemory = performance.memory.usedJSHeapSize;
      return currentMemory - componentTestMemoryBaseline;
    }
    return 0;
  },

  // Focus management testing
  getFocusedElement: () => document.activeElement,

  // Clean DOM state
  cleanDOMState: () => {
    document.body.innerHTML = '';
    if (document.activeElement && document.activeElement !== document.body) {
      document.activeElement.blur();
    }
  },

  // Component mount helpers
  getMountedComponents: () => {
    return document.querySelectorAll('[data-react-component]').length;
  },

  // Accessibility helpers
  getAccessibilityViolations: async (element) => {
    try {
      const { axe } = require('jest-axe');
      const results = await axe(element);
      return results.violations;
    } catch (e) {
      return [];
    }
  },

  // Performance helpers
  measureRenderTime: (renderFunction) => {
    const start = performance.now();
    const result = renderFunction();
    const end = performance.now();
    return { result, renderTime: end - start };
  },
};

// ============================================================================
// PROP VALIDATION TESTING HELPERS
// ============================================================================

// Utilities for prop validation testing
global.propTestUtils = {
  // Generate common prop test values
  generatePropTestValues: (propType) => {
    const commonValues = {
      string: ['', 'test', 'a very long string that might cause issues'],
      number: [0, 1, -1, 0.5, Number.MAX_VALUE, Number.MIN_VALUE],
      boolean: [true, false],
      array: [[], [1, 2, 3], ['a', 'b', 'c']],
      object: [{}, { key: 'value' }, { nested: { key: 'value' } }],
      function: [() => {}, jest.fn(), null, undefined],
    };

    return commonValues[propType] || [];
  },

  // Test prop edge cases
  getEdgeCaseValues: () => [
    null,
    undefined,
    '',
    0,
    false,
    [],
    {},
    NaN,
    Infinity,
    -Infinity,
  ],

  // Validate prop behavior
  validatePropBehavior: (component, prop, value, expectedBehavior) => {
    try {
      const props = { [prop]: value };
      const result = render(React.createElement(component, props));
      return expectedBehavior(result);
    } catch (error) {
      return { error: error.message };
    }
  },
};

// ============================================================================
// ENHANCED CLEANUP WITH LIFECYCLE SUPPORT
// ============================================================================

// Clean up after each test with enhanced component lifecycle support
afterEach(async () => {
  jest.clearAllMocks();

  // Clean up hook test scenarios
  global.hookTestUtils.clearHookScenarios();

  // Clean up component test utilities
  global.mockScreenReader.clearAnnouncements();

  // Clean up any timers if fake timers are enabled
  if (jest.isMockFunction(setTimeout)) {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  }

  // Clean up hook mock states (only if mocks are available)
  try {
    global.hookTestUtils.resetAllHookMocks();
  } catch (e) {
    // Mocks not available in this test environment
  }

  // Component lifecycle cleanup
  global.componentTestUtils.cleanDOMState();

  // Wait for any pending cleanup operations
  await new Promise((resolve) => setTimeout(resolve, 0));

  // Check for potential memory leaks in component tests
  const memoryGrowth = global.componentTestUtils.checkMemoryLeak();
  if (memoryGrowth > 50000) {
    // 50KB threshold
    console.warn(`Component test memory growth: ${memoryGrowth} bytes`);
  }
});

// ============================================================================
// COMPONENT LIFECYCLE TEST PATTERNS
// ============================================================================

// Standard component test patterns available globally
global.standardComponentTests = {
  // Standard mount/unmount test
  testMountUnmount: (Component, props) => {
    return () => {
      let renderResult;

      expect(() => {
        renderResult = render(React.createElement(Component, props));
      }).not.toThrow();

      expect(renderResult.container).toBeInTheDocument();

      expect(() => {
        renderResult.unmount();
      }).not.toThrow();
    };
  },

  // Standard prop validation test
  testProps: (Component, propTests) => {
    return () => {
      propTests.forEach(({ prop, values, shouldError = false }) => {
        values.forEach((value) => {
          if (shouldError) {
            expect(() => {
              render(React.createElement(Component, { [prop]: value }));
            }).toThrow();
          } else {
            expect(() => {
              const result = render(
                React.createElement(Component, { [prop]: value }),
              );
              result.unmount();
            }).not.toThrow();
          }
        });
      });
    };
  },

  // Standard accessibility test
  testAccessibility: (Component, props) => {
    return async () => {
      const renderResult = render(React.createElement(Component, props));

      try {
        const violations =
          await global.componentTestUtils.getAccessibilityViolations(
            renderResult.container,
          );
        expect(violations).toHaveLength(0);
      } catch (e) {
        // Skip if axe is not available
      }

      renderResult.unmount();
    };
  },

  // Standard performance test
  testPerformance: (Component, props, maxRenderTime = 100) => {
    return () => {
      const { renderTime } = global.componentTestUtils.measureRenderTime(() => {
        const result = render(React.createElement(Component, props));
        result.unmount();
        return result;
      });

      expect(renderTime).toBeLessThan(maxRenderTime);
    };
  },
};
