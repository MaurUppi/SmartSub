/**
 * Main Jest Configuration
 *
 * This is the primary Jest configuration that orchestrates different test environments
 * by delegating to specific configurations in the jest/ directory.
 */

module.exports = {
  // Multiple test environments for different test types
  projects: [
    // Node.js environment for backend/main process tests
    '<rootDir>/jest/jest.config.node.js',

    // JSDOM environment for React component tests
    '<rootDir>/jest/jest.config.jsdom.js',
  ],

  // Coverage configuration (global)
  collectCoverage: false, // Let individual projects handle their own coverage
  coverageDirectory: '<rootDir>/coverage',

  // Test timeout
  testTimeout: 30000,

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,

  // Error handling
  bail: false, // Continue running tests after first failure
  errorOnDeprecated: true,

  // Performance
  maxWorkers: '50%', // Use half the available CPU cores

  // Cache configuration
  cache: true,
  cacheDirectory: '<rootDir>/node_modules/.cache/jest',
};
