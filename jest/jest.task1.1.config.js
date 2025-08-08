/**
 * Jest Configuration for Task 1.1 Only
 * Focused test configuration for validating Task 1.1 completion
 */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',

  // Root directories
  rootDir: '.',
  testMatch: [
    '<rootDir>/test/unit/developmentMockSystem.test.ts',
    '<rootDir>/test/unit/testUtils.test.ts',
    '<rootDir>/test/unit/mockEnvironment.test.ts',
    '<rootDir>/test/unit/mockGPUData.test.ts',
    '<rootDir>/test/integration/task1.1.integration.test.ts',
  ],

  // TypeScript configuration
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: {
          module: 'commonjs',
          target: 'es2020',
          lib: ['es2020'],
          allowJs: true,
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          strict: false,
          skipLibCheck: true,
          forceConsistentCasingInFileNames: true,
          resolveJsonModule: true,
        },
      },
    ],
  },

  // Module resolution
  moduleFileExtensions: ['ts', 'js', 'json'],

  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'main/helpers/developmentMockSystem.ts',
    'main/helpers/testUtils.ts',
    'test/setup/mockEnvironment.ts',
    'test/fixtures/mockGPUData.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'text-summary', 'html', 'lcov'],

  // Test timeout
  testTimeout: 30000,

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,

  // Test environment setup
  setupFiles: ['<rootDir>/test/setup/jest.env.ts'],

  // Custom matchers
  setupFilesAfterEnv: ['<rootDir>/test/setup/jest.matchers.ts'],

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    '/coverage/',
    '/docs/',
    '/renderer/',
  ],

  // Module path mapping to avoid import issues
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};
