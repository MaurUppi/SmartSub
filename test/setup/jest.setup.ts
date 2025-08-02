/**
 * Jest Setup Configuration
 * Individual test setup that runs before each test file
 */

import { mockEnvironmentSetup } from './mockEnvironment';

// Extend Jest matchers
import './jest.matchers';

// Setup test environment before each test file
beforeAll(async () => {
  // Individual test file setup can be added here
  console.log('Setting up test file environment...');
});

afterAll(async () => {
  // Individual test file cleanup can be added here
  console.log('Cleaning up test file environment...');
});