/**
 * Jest Global Setup
 * Runs once before all tests
 */

import { globalSetup } from './mockEnvironment';

export default async (): Promise<void> => {
  console.log('🚀 Starting OpenVINO Integration Test Suite...');
  console.log('Setting up global test environment...');
  
  try {
    await globalSetup();
    console.log('✅ Global test environment setup complete');
  } catch (error) {
    console.error('❌ Global test environment setup failed:', error);
    throw error;
  }
};