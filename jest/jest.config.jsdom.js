/**
 * Jest Configuration - JSDOM Environment
 * For React component tests
 */

const path = require('path');

module.exports = {
  rootDir: path.resolve(__dirname, '..'),
  displayName: 'jsdom',
  preset: 'ts-jest',
  testEnvironment: 'jsdom',

  testMatch: [
    '<rootDir>/renderer/**/*.test.tsx',
    '<rootDir>/renderer/**/*.test.ts',
    '<rootDir>/renderer/**/*.spec.tsx',
    '<rootDir>/renderer/**/*.spec.ts',
    '<rootDir>/test/components/**/*.test.tsx',
    '<rootDir>/test/components/**/*.test.ts',
  ],

  moduleFileExtensions: ['tsx', 'ts', 'jsx', 'js', 'json'],

  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: {
          module: 'commonjs',
          target: 'es2020',
          lib: ['es2020', 'dom', 'dom.iterable'],
          allowJs: true,
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          strict: true,
          skipLibCheck: true,
          forceConsistentCasingInFileNames: true,
          resolveJsonModule: true,
          jsx: 'react-jsx',
        },
      },
    ],
  },

  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/renderer/$1',
    '^@/components/(.*)$': '<rootDir>/renderer/components/$1',
    '^@/hooks/(.*)$': '<rootDir>/renderer/hooks/$1',
    '^@/lib/(.*)$': '<rootDir>/renderer/lib/$1',
    '^@/utils/(.*)$': '<rootDir>/renderer/utils/$1',
    '^@/types/(.*)$': '<rootDir>/types/$1',
    '^lib/(.*)$': '<rootDir>/renderer/lib/$1',
    '^components/(.*)$': '<rootDir>/renderer/components/$1',
    '^hooks/(.*)$': '<rootDir>/renderer/hooks/$1',
    '^@test/(.*)$': '<rootDir>/test/$1',
    '^types/(.*)$': '<rootDir>/types/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },

  setupFilesAfterEnv: [
    '<rootDir>/test/setup/jest.react.setup.js',
    '<rootDir>/test/setup/jest.setup.ts',
    '<rootDir>/test/setup/jest.matchers.ts',
  ],

  setupFiles: ['<rootDir>/test/setup/jest.env.ts'],

  // Coverage configuration
  collectCoverageFrom: [
    'renderer/**/*.{ts,tsx}',
    '!renderer/**/*.d.ts',
    '!renderer/**/*.stories.{ts,tsx}',
    '!renderer/**/__tests__/**',
    '!renderer/**/*.test.{ts,tsx}',
    '!**/node_modules/**',
    '!**/vendor/**',
  ],
};
