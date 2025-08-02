/**
 * Simple Environment Setup for Testing
 */

// Set basic environment variables
process.env.NODE_ENV = 'test';
process.env.FORCE_MOCK_INTEL_GPU = 'true';
process.env.TEST_ENVIRONMENT = 'jest';

export {};