/**
 * Jest Configuration for Task 2.2: Subtitle Generation Integration
 * Enhanced subtitle generation testing with comprehensive coverage
 */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',

  // Root directory and module paths
  rootDir: '..',
  testMatch: [
    '**/test/unit/subtitleGeneration.test.ts',
    '**/test/e2e/subtitleGenerationWorkflow.test.ts',
    '**/test/functional/audioFormatHandling.test.ts',
    '**/test/functional/languageDetection.test.ts',
    '**/test/integration/workflowIntegrationTiming.test.ts',
  ],

  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/test/setup/settingsTestSetup.ts',
    '<rootDir>/test/setup/subtitleTestSetup.ts',
  ],

  // Module path mapping for absolute imports
  moduleNameMapper: {
    '^main/(.*)$': '<rootDir>/main/$1',
    '^types/(.*)$': '<rootDir>/types/$1',
    '^test/(.*)$': '<rootDir>/test/$1',
  },

  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'main/helpers/subtitleGenerator.ts',
    'main/helpers/gpuConfig.ts',
    'main/helpers/performanceMonitor.ts',
    'main/helpers/errorHandler.ts',
    'main/helpers/whisper.ts',
    'main/helpers/fileUtils.ts',
    'main/helpers/audioProcessor.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageDirectory: 'coverage/task2.2',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },

  // TypeScript configuration
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          experimentalDecorators: true,
          emitDecoratorMetadata: true,
          skipLibCheck: true,
          resolveJsonModule: true,
          baseUrl: '.',
          paths: {
            'main/*': ['main/*'],
            'types/*': ['types/*'],
            'test/*': ['test/*'],
          },
        },
      },
    ],
  },

  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  // Test timeout for complex GPU operations
  testTimeout: 30000,

  // Verbose output for detailed test results
  verbose: true,

  // Error handling
  errorOnDeprecated: true,

  // Clear mocks between tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};
