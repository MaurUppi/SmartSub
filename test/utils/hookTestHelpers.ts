/**
 * Hook Testing Utilities
 * Provides reusable utilities for testing React hooks consistently
 */

import { renderHook, act } from '@testing-library/react';
import { ReactNode } from 'react';

// Type definitions for hook testing
export interface HookTestResult<T> {
  result: {
    current: T;
  };
  rerender: (newProps?: any) => void;
  unmount: () => void;
}

export interface MockStateManager<T> {
  getState: () => T;
  setState: (newState: Partial<T>) => void;
  resetState: () => void;
}

/**
 * Renders a hook for testing with optional wrapper component
 */
export function renderHookWithWrapper<T, P = any>(
  hook: (props: P) => T,
  options: {
    initialProps?: P;
    wrapper?: React.ComponentType<{ children: ReactNode }>;
  } = {},
): HookTestResult<T> {
  return renderHook(hook, options);
}

/**
 * Creates a mock state manager for consistent state testing
 */
export function createMockStateManager<T>(
  initialState: T,
): MockStateManager<T> {
  let state = { ...initialState };
  const originalState = { ...initialState };

  return {
    getState: () => ({ ...state }),
    setState: (newState: Partial<T>) => {
      state = { ...state, ...newState };
    },
    resetState: () => {
      state = { ...originalState };
    },
  };
}

/**
 * Utility for testing async hook actions
 */
export async function waitForHookAction<T>(
  hookResult: HookTestResult<T>,
  action: () => void | Promise<void>,
  timeout = 5000,
): Promise<void> {
  await act(async () => {
    await action();
  });
}

/**
 * Helper for testing hook state changes
 */
export function expectHookStateChange<T>(
  hookResult: HookTestResult<T>,
  propertyPath: string,
  expectedValue: any,
): void {
  const result = hookResult.result.current as any;
  const actualValue = getNestedProperty(result, propertyPath);
  expect(actualValue).toEqual(expectedValue);
}

/**
 * Helper for testing multiple hook state properties
 */
export function expectHookState<T>(
  hookResult: HookTestResult<T>,
  expectedState: Record<string, any>,
): void {
  const result = hookResult.result.current as any;

  Object.entries(expectedState).forEach(([key, expectedValue]) => {
    const actualValue = getNestedProperty(result, key);
    expect(actualValue).toEqual(expectedValue);
  });
}

/**
 * Helper for testing hook method calls
 */
export function expectHookMethodCalled(
  mockMethod: jest.MockedFunction<any>,
  times = 1,
  withArgs?: any[],
): void {
  expect(mockMethod).toHaveBeenCalledTimes(times);
  if (withArgs) {
    expect(mockMethod).toHaveBeenCalledWith(...withArgs);
  }
}

/**
 * Helper for testing hook side effects
 */
export async function testHookSideEffect<T>(
  hookResult: HookTestResult<T>,
  action: () => void | Promise<void>,
  sideEffectCheck: () => void | Promise<void>,
): Promise<void> {
  await waitForHookAction(hookResult, action);
  await sideEffectCheck();
}

/**
 * Utility for setting up common hook test scenarios
 */
export interface HookTestScenario<T, P = any> {
  name: string;
  initialProps?: P;
  setup?: () => void | Promise<void>;
  expectations: (hookResult: HookTestResult<T>) => void | Promise<void>;
  cleanup?: () => void | Promise<void>;
}

export async function runHookTestScenarios<T, P = any>(
  hook: (props: P) => T,
  scenarios: HookTestScenario<T, P>[],
  commonSetup?: () => void | Promise<void>,
  commonCleanup?: () => void | Promise<void>,
): Promise<void> {
  for (const scenario of scenarios) {
    describe(scenario.name, () => {
      let hookResult: HookTestResult<T>;

      beforeEach(async () => {
        if (commonSetup) await commonSetup();
        if (scenario.setup) await scenario.setup();

        hookResult = renderHookWithWrapper(hook, {
          initialProps: scenario.initialProps,
        });
      });

      afterEach(async () => {
        if (hookResult) hookResult.unmount();
        if (scenario.cleanup) await scenario.cleanup();
        if (commonCleanup) await commonCleanup();
      });

      it('should meet expectations', async () => {
        await scenario.expectations(hookResult);
      });
    });
  }
}

/**
 * Mock timer utilities for testing time-dependent hooks
 */
export const mockTimers = {
  setup: () => {
    jest.useFakeTimers();
  },

  cleanup: () => {
    jest.useRealTimers();
  },

  advanceBy: (ms: number) => {
    act(() => {
      jest.advanceTimersByTime(ms);
    });
  },

  advanceToNext: () => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
  },

  runAll: () => {
    act(() => {
      jest.runAllTimers();
    });
  },
};

/**
 * Helper for testing localStorage interactions in hooks
 */
export const mockLocalStorage = {
  setup: (initialData: Record<string, string> = {}) => {
    const store: Record<string, string> = { ...initialData };

    jest
      .spyOn(Storage.prototype, 'getItem')
      .mockImplementation((key: string) => {
        return store[key] || null;
      });

    jest
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation((key: string, value: string) => {
        store[key] = value;
      });

    jest
      .spyOn(Storage.prototype, 'removeItem')
      .mockImplementation((key: string) => {
        delete store[key];
      });

    jest.spyOn(Storage.prototype, 'clear').mockImplementation(() => {
      Object.keys(store).forEach((key) => delete store[key]);
    });

    return store;
  },

  cleanup: () => {
    jest.restoreAllMocks();
  },
};

/**
 * Helper for testing IPC interactions in hooks
 */
export const mockIPC = {
  setup: (mockResponses: Record<string, any> = {}) => {
    const mockInvoke = jest
      .fn()
      .mockImplementation((channel: string, ...args: any[]) => {
        return Promise.resolve(mockResponses[channel] || null);
      });

    const mockSend = jest.fn();
    const mockOn = jest.fn();
    const mockRemoveListener = jest.fn();

    Object.defineProperty(window, 'ipc', {
      value: {
        invoke: mockInvoke,
        send: mockSend,
        on: mockOn,
        removeListener: mockRemoveListener,
      },
      writable: true,
    });

    return {
      invoke: mockInvoke,
      send: mockSend,
      on: mockOn,
      removeListener: mockRemoveListener,
    };
  },

  cleanup: () => {
    delete (window as any).ipc;
  },
};

/**
 * Helper function to get nested object properties
 */
function getNestedProperty(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Hook test assertion helpers
 */
export const hookAssertions = {
  // Assert hook returns expected shape
  hasShape: <T>(
    hookResult: HookTestResult<T>,
    expectedShape: Record<string, string>,
  ) => {
    const result = hookResult.result.current as any;

    Object.entries(expectedShape).forEach(([key, expectedType]) => {
      expect(result).toHaveProperty(key);
      expect(typeof result[key]).toBe(expectedType);
    });
  },

  // Assert hook method exists and is callable
  hasMethod: <T>(hookResult: HookTestResult<T>, methodName: string) => {
    const result = hookResult.result.current as any;
    expect(result).toHaveProperty(methodName);
    expect(typeof result[methodName]).toBe('function');
  },

  // Assert hook state property has expected value
  stateEquals: <T>(
    hookResult: HookTestResult<T>,
    statePath: string,
    expectedValue: any,
  ) => {
    expectHookStateChange(hookResult, statePath, expectedValue);
  },

  // Assert hook state property has changed
  stateChanged: <T>(
    hookResult: HookTestResult<T>,
    statePath: string,
    previousValue: any,
  ) => {
    const result = hookResult.result.current as any;
    const currentValue = getNestedProperty(result, statePath);
    expect(currentValue).not.toEqual(previousValue);
  },
};

export default {
  renderHookWithWrapper,
  createMockStateManager,
  waitForHookAction,
  expectHookStateChange,
  expectHookState,
  expectHookMethodCalled,
  testHookSideEffect,
  runHookTestScenarios,
  mockTimers,
  mockLocalStorage,
  mockIPC,
  hookAssertions,
};
