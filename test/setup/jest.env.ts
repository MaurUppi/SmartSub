/**
 * Jest Environment Setup
 * Sets up environment variables for testing
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.FORCE_MOCK_INTEL_GPU = 'true';
process.env.TEST_ENVIRONMENT = 'jest';

// Suppress console logs in tests unless specifically needed
if (process.env.VERBOSE_TESTS !== 'true') {
  const originalConsole = console;
  console.log = jest.fn();
  console.info = jest.fn();
  console.warn = jest.fn();
  console.error = originalConsole.error; // Keep error logs for debugging
}

export {};