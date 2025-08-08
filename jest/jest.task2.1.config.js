/**
 * Jest Configuration for Task 2.1: Enhanced Addon Loading System
 * Comprehensive test suite for Intel GPU addon loading and fallback chains
 */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',

  // Test file patterns for Task 2.1
  testMatch: [
    '**/test/unit/addonLoading.test.ts',
    '**/test/unit/gpuSelection.test.ts',
    '**/test/unit/addonManager.test.ts',
    '**/test/unit/fallbackChains.test.ts',
  ],

  // Module resolution
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^main/(.*)$': '<rootDir>/main/$1',
    '^types/(.*)$': '<rootDir>/types/$1',
    '^test/(.*)$': '<rootDir>/test/$1',
  },

  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/test/setup/settingsTestSetup.ts',
    '<rootDir>/test/setup/addonTestSetup.ts',
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'main/helpers/whisper.ts',
    'main/helpers/gpuSelector.ts',
    'main/helpers/addonManager.ts',
    'main/helpers/hardware/**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/test/**',
  ],

  // Test timeout for addon loading tests
  testTimeout: 20000,

  // Verbose output for detailed test results
  verbose: true,

  // Transform configuration
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: {
          module: 'commonjs',
          target: 'es2020',
          lib: ['es2020'],
          declaration: false,
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          forceConsistentCasingInFileNames: true,
          resolveJsonModule: true,
        },
      },
    ],
  },
};
