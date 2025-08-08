/**
 * Jest Configuration for Task 4.3: Production Validation & Release Preparation
 *
 * This configuration runs comprehensive production validation tests including:
 * - End-to-end Intel GPU workflows
 * - Regression testing for existing functionality
 * - Production deployment validation
 */

module.exports = {
  displayName: 'Task 4.3 - Production Validation',

  // Test environment
  testEnvironment: 'node',

  // Test file patterns - focus on Task 4.3 production validation tests
  testMatch: [
    '<rootDir>/test/e2e/intelGPUWorkflow.test.ts',
    '<rootDir>/test/regression/existingFunctionality.test.ts',
    '<rootDir>/test/production/deploymentValidation.test.ts',
  ],

  // TypeScript support
  preset: 'ts-jest',

  // Module resolution
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@main/(.*)$': '<rootDir>/main/$1',
    '^@renderer/(.*)$': '<rootDir>/renderer/$1',
    '^@test/(.*)$': '<rootDir>/test/$1',
  },

  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/test/setup/jest.setup.ts',
    '<rootDir>/test/setup/jest.matchers.ts',
  ],

  // Global setup and teardown
  globalSetup: '<rootDir>/test/setup/jest.globalSetup.ts',
  globalTeardown: '<rootDir>/test/setup/jest.globalTeardown.ts',

  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage/task4.3',
  coverageReporters: ['text', 'lcov', 'html', 'json'],

  // Coverage thresholds for production validation
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95,
    },
    // Specific thresholds for production validation components
    './test/e2e/intelGPUWorkflow.test.ts': {
      branches: 95,
      functions: 100,
      lines: 98,
      statements: 98,
    },
    './test/regression/existingFunctionality.test.ts': {
      branches: 92,
      functions: 98,
      lines: 96,
      statements: 96,
    },
    './test/production/deploymentValidation.test.ts': {
      branches: 88,
      functions: 95,
      lines: 93,
      statements: 93,
    },
  },

  // Files to include in coverage
  collectCoverageFrom: [
    'main/helpers/**/*.ts',
    'main/hardware/**/*.ts',
    'renderer/components/**/*.tsx',
    'renderer/hooks/**/*.ts',
    '!**/*.d.ts',
    '!**/*.test.ts',
    '!**/*.test.tsx',
    '!**/node_modules/**',
    '!**/coverage/**',
  ],

  // Transform configuration
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx',
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
        },
      },
    ],
  },

  // File extensions to process
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  // Test timeout for long-running production tests
  testTimeout: 300000, // 5 minutes for comprehensive tests

  // Verbose output for production validation
  verbose: true,

  // Fail fast on production validation errors
  bail: 1,

  // Maximum number of concurrent workers
  maxWorkers: '50%',

  // Cache configuration
  cache: true,
  cacheDirectory: '<rootDir>/node_modules/.cache/jest/task4.3',

  // Mock configuration
  clearMocks: true,
  restoreMocks: true,

  // Error handling
  errorOnDeprecated: true,

  // Reporter configuration for production validation
  reporters: ['default'],

  // Custom environment variables for production testing
  testEnvironmentOptions: {
    NODE_ENV: 'production',
    INTEL_GPU_TESTING: 'true',
    OPENVINO_TESTING: 'true',
    PRODUCTION_VALIDATION: 'true',
  },
};
