/**
 * Jest Configuration for OpenVINO Integration Development
 * 
 * Comprehensive test configuration for Task 1.1 and future tasks
 */

module.exports = {
  // Test environment
  preset: 'ts-jest',
  testEnvironment: 'node',
  
  // Root directories
  rootDir: '.',
  testMatch: [
    '<rootDir>/test/**/*.test.ts',
    '<rootDir>/test/**/*.spec.ts'
  ],
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/test/setup/jest.setup.ts'
  ],
  
  // Global setup and teardown
  globalSetup: '<rootDir>/test/setup/jest.globalSetup.ts',
  globalTeardown: '<rootDir>/test/setup/jest.globalTeardown.ts',
  
  // TypeScript configuration
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        compilerOptions: {
          module: 'commonjs',
          target: 'es2020',
          lib: ['es2020'],
          allowJs: true,
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          strict: true,
          skipLibCheck: true,
          forceConsistentCasingInFileNames: true,
          resolveJsonModule: true,
        }
      }
    }]
  },
  
  // Module resolution
  moduleFileExtensions: ['ts', 'js', 'json'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@test/(.*)$': '<rootDir>/test/$1',
    '^@main/(.*)$': '<rootDir>/main/$1',
  },
  
  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'main/helpers/developmentMockSystem.ts',
    'main/helpers/testUtils.ts',
    'test/setup/mockEnvironment.ts',
    'test/fixtures/mockGPUData.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/vendor/**'
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json'
  ],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    }
  },
  
  // Test timeout
  testTimeout: 30000, // 30 seconds for integration tests
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,
  
  // Error handling
  bail: false, // Continue running tests after first failure
  errorOnDeprecated: true,
  
  // Test organization
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    '/coverage/'
  ],
  
  // Custom matchers
  setupFilesAfterEnv: [
    '<rootDir>/test/setup/jest.matchers.ts'
  ],
  
  // Performance monitoring
  slowTestThreshold: 5, // Warn about tests taking longer than 5 seconds
  
  // Parallel execution
  maxWorkers: '50%', // Use half the available CPU cores
  
  // Cache configuration
  cache: true,
  cacheDirectory: '<rootDir>/node_modules/.cache/jest',
  
  // Watch mode configuration
  watchman: true,
  watchPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/dist/'
  ],
  
  // Reporter configuration
  reporters: [
    'default',
    [
      'jest-html-reporter',
      {
        pageTitle: 'OpenVINO Integration Test Report',
        outputPath: '<rootDir>/coverage/test-report.html',
        includeFailureMsg: true,
        includeSuiteFailure: true,
        theme: 'lightTheme'
      }
    ]
  ],
  
  // Environment variables for testing
  setupFiles: [
    '<rootDir>/test/setup/jest.env.ts'
  ]
};