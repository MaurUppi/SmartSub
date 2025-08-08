/**
 * Jest Configuration for Task 1.2: Hardware Detection System Tests
 */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',

  // Test files for Task 1.2
  testMatch: [
    '<rootDir>/test/unit/hardwareDetection.test.ts',
    '<rootDir>/test/unit/gpuClassification.test.ts',
    '<rootDir>/test/unit/openvinoDetection.test.ts',
  ],

  // TypeScript configuration
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        isolatedModules: true,
        tsconfig: {
          module: 'commonjs',
          target: 'es2020',
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          strict: false,
          skipLibCheck: true,
          resolveJsonModule: true,
        },
      },
    ],
  },

  // Module resolution
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@main/(.*)$': '<rootDir>/main/$1',
    '^@test/(.*)$': '<rootDir>/test/$1',
    systeminformation: '<rootDir>/test/mocks/systeminformation.js',
    electron: '<rootDir>/test/mocks/electron.js',
    'electron-store': '<rootDir>/test/mocks/electron-store.js',
  },

  // Module extensions
  moduleFileExtensions: ['ts', 'js', 'json'],

  // Test timeout
  testTimeout: 30000,

  // Verbose output
  verbose: true,

  // Environment setup
  setupFiles: [
    '<rootDir>/test/setup/electron-mock.js',
    '<rootDir>/test/setup/simple-env.ts',
  ],

  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage/task1.2',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'main/hardware/**/*.ts',
    'main/helpers/coreUltraDetection.ts',
    'types/gpu.d.ts',
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
