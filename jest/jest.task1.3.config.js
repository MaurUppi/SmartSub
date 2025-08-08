/**
 * Jest Configuration for Task 1.3: Enhanced Settings Integration
 * Comprehensive test suite for Intel GPU settings and migration
 */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',

  // Test file patterns for Task 1.3
  testMatch: [
    '<rootDir>/../test/unit/settingsExtension.test.ts',
    '<rootDir>/../test/unit/settingsMigration.test.ts',
    '<rootDir>/../test/unit/settingsValidation.test.ts',
  ],

  // Module resolution
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/../$1',
    '^main/(.*)$': '<rootDir>/../main/$1',
    '^types/(.*)$': '<rootDir>/../types/$1',
    '^test/(.*)$': '<rootDir>/../test/$1',
  },

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/../test/setup/settingsTestSetup.ts'],

  // Coverage configuration
  collectCoverageFrom: [
    '../main/helpers/store/**/*.ts',
    '../main/helpers/settingsMigration.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/test/**',
  ],

  // Test timeout for comprehensive tests
  testTimeout: 15000,

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
