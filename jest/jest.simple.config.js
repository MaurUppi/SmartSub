/**
 * Simple Jest Configuration for Task 1.1 Validation
 */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',

  // Test files
  testMatch: ['<rootDir>/test/minimal.test.ts'],

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

  // Module extensions
  moduleFileExtensions: ['ts', 'js', 'json'],

  // Test timeout
  testTimeout: 30000,

  // Verbose output
  verbose: true,

  // Environment
  setupFiles: ['<rootDir>/test/setup/simple-env.ts'],
};
