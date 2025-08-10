/**
 * Jest Global Teardown
 * Runs once after all tests
 */

import { globalTeardown } from './mockEnvironment';

export default async (): Promise<void> => {
  console.log('🧹 Cleaning up global test environment...');

  try {
    await globalTeardown();
    console.log('✅ Global test environment cleanup complete');
    console.log('🏁 OpenVINO Integration Test Suite finished');
  } catch (error) {
    console.error('❌ Global test environment cleanup failed:', error);
    throw error;
  }
};
