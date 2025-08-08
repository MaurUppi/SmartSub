/**
 * Mock implementation of useLocalStorageState hook
 * Provides configurable localStorage state scenarios for testing
 */

// Mock localStorage storage
let mockStorage: Record<string, string> = {};

// Global mock state tracking
let mockCalls = {
  getItemCalled: false,
  setItemCalled: false,
  removeItemCalled: false,
};

// Mock implementation
export const useLocalStorageState = jest.fn(
  <T>(
    key: string,
    defaultValue: T,
    options?: {
      serialize?: (value: T) => string;
      deserialize?: (value: string) => T;
    },
  ): [T, (value: T | ((prevValue: T) => T)) => void, () => void] => {
    const { serialize = JSON.stringify, deserialize = JSON.parse } =
      options || {};

    // Get initial value from mock storage
    const getStoredValue = (): T => {
      try {
        mockCalls.getItemCalled = true;
        const storedValue = mockStorage[key];
        if (storedValue === undefined || storedValue === null) {
          return defaultValue;
        }
        return deserialize(storedValue);
      } catch (error) {
        console.warn(`Error reading localStorage key "${key}":`, error);
        return defaultValue;
      }
    };

    const [state, setState] = useState<T>(getStoredValue());

    const setValue = jest.fn((value: T | ((prevValue: T) => T)) => {
      try {
        mockCalls.setItemCalled = true;
        const valueToStore =
          typeof value === 'function'
            ? (value as (prevValue: T) => T)(state)
            : value;
        setState(valueToStore);
        mockStorage[key] = serialize(valueToStore);
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    });

    const removeValue = jest.fn(() => {
      try {
        mockCalls.removeItemCalled = true;
        setState(defaultValue);
        delete mockStorage[key];
      } catch (error) {
        console.warn(`Error removing localStorage key "${key}":`, error);
      }
    });

    return [state, setValue, removeValue];
  },
);

// Mock useState for internal state management
const useState = <T>(initialValue: T): [T, (value: T) => void] => {
  let value = initialValue;

  const setValue = (newValue: T) => {
    value = newValue;
  };

  return [value, setValue];
};

// Test utilities for controlling mock behavior
export const mockLocalStorageStateUtils = {
  // Reset mock state
  reset: () => {
    mockStorage = {};
    mockCalls = {
      getItemCalled: false,
      setItemCalled: false,
      removeItemCalled: false,
    };
    jest.clearAllMocks();
  },

  // Set initial storage values
  setStorageValue: (key: string, value: any) => {
    mockStorage[key] =
      typeof value === 'string' ? value : JSON.stringify(value);
  },

  // Get storage value
  getStorageValue: (key: string) => {
    return mockStorage[key];
  },

  // Get all storage values
  getAllStorage: () => ({ ...mockStorage }),

  // Set multiple storage values
  setStorageValues: (values: Record<string, any>) => {
    Object.entries(values).forEach(([key, value]) => {
      mockStorage[key] =
        typeof value === 'string' ? value : JSON.stringify(value);
    });
  },

  // Clear storage
  clearStorage: () => {
    mockStorage = {};
  },

  // Get mock call information
  getMockCalls: () => ({ ...mockCalls }),

  // Check if specific methods were called
  wasGetItemCalled: () => mockCalls.getItemCalled,
  wasSetItemCalled: () => mockCalls.setItemCalled,
  wasRemoveItemCalled: () => mockCalls.removeItemCalled,

  // Simulate localStorage errors
  simulateStorageError: (operation: 'get' | 'set' | 'remove') => {
    const originalConsoleWarn = console.warn;
    console.warn = jest.fn();

    // This would be implemented by modifying the mock to throw errors
    // For now, we'll just track that error simulation was requested

    return () => {
      console.warn = originalConsoleWarn;
    };
  },

  // Test storage quota exceeded scenario
  simulateQuotaExceeded: () => {
    // Mock implementation would modify the storage setter to throw QuotaExceededError
    const error = new Error('QuotaExceededError');
    error.name = 'QuotaExceededError';
    return error;
  },
};

export default useLocalStorageState;
