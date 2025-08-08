/**
 * Jest Configuration - Node.js Environment
 * For backend/main process tests
 */

const path = require('path');

module.exports = {
  rootDir: path.resolve(__dirname, '..'),
  displayName: 'node',
  preset: 'ts-jest',
  testEnvironment: 'node',

  testMatch: [
    '<rootDir>/test/**/*.test.ts',
    '<rootDir>/test/**/*.spec.ts',
    '<rootDir>/main/**/*.test.ts',
  ],

  moduleFileExtensions: ['ts', 'js', 'json'],

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
          strict: true,
          skipLibCheck: true,
          forceConsistentCasingInFileNames: true,
          resolveJsonModule: true,
        },
      },
    ],
  },

  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@test/(.*)$': '<rootDir>/test/$1',
    '^@main/(.*)$': '<rootDir>/main/$1',
    '^main/(.*)$': '<rootDir>/main/$1',
    '^test/(.*)$': '<rootDir>/test/$1',
  },

  setupFilesAfterEnv: [
    '<rootDir>/test/setup/jest.setup.ts',
    '<rootDir>/test/setup/jest.matchers.ts',
    '<rootDir>/test/setup/settingsTestSetup.ts',
  ],

  setupFiles: ['<rootDir>/test/setup/jest.env.ts'],

  // Coverage configuration
  collectCoverageFrom: [
    'main/**/*.{ts,js}',
    'test/setup/**/*.{ts,js}',
    'test/fixtures/**/*.{ts,js}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/vendor/**',
  ],
};
