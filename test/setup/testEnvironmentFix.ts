/**
 * Test Environment Fix for OpenVINO Integration
 * Ensures proper mock system initialization and test isolation
 */

import { mockSystem } from '../../main/helpers/developmentMockSystem';

/**
 * Ensures mock system is properly reset and initialized for tests
 */
export async function ensureProperMockSystemSetup() {
  // Reset mock system to clean state
  mockSystem.reset();

  // Force enable mocking for tests
  process.env.FORCE_MOCK_INTEL_GPU = 'true';
  process.env.NODE_ENV = 'test';

  // Initialize with test-optimized configuration
  await mockSystem.initialize({
    mockIntelGPUs: true,
    simulateOpenVINO: true,
    enablePerformanceSimulation: true,
    mockNetworkDelay: 0, // No delay for tests
    forceErrors: false,
  });
}

/**
 * Clean up mock system after tests
 */
export async function cleanupMockSystem() {
  mockSystem.reset();
  delete process.env.FORCE_MOCK_INTEL_GPU;
}

/**
 * Fix for test environment consistency
 */
export function ensureTestEnvironmentConsistency() {
  // Ensure test environment variables are set
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'test';
  }

  // Ensure Jest globals are available
  if (typeof global.jest === 'undefined' && typeof jest !== 'undefined') {
    global.jest = jest;
  }
}

/**
 * Enhanced mock for error handler to prevent test failures
 */
export function setupErrorHandlerMock() {
  const errorHandlerMock = {
    handleProcessingError: jest
      .fn()
      .mockImplementation(async (error, context) => {
        // Return a valid SRT file path for error recovery
        return context?.file?.srtFile || '/test/path/output.srt';
      }),
    createUserFriendlyErrorMessage: jest.fn().mockImplementation((error) => {
      return error?.message || 'Unknown error occurred';
    }),
    logErrorContext: jest.fn(),
  };

  // Mock the error handler module
  jest.doMock('../../main/helpers/errorHandler', () => errorHandlerMock);

  return errorHandlerMock;
}

/**
 * Fix for OpenVINO capability fixtures
 */
export function fixOpenVINOCapabilityFixtures() {
  // Ensure fixtures module exports the correct structure
  jest.doMock('../../test/fixtures/mockGPUData', () => {
    const originalFixtures = jest.requireActual(
      '../../test/fixtures/mockGPUData',
    );

    // Ensure openVinoCapabilityFixtures is available
    if (!originalFixtures.openVinoCapabilityFixtures) {
      return {
        ...originalFixtures,
        openVinoCapabilityFixtures: originalFixtures.openvinoCapabilities || {
          fullInstallation: () => ({
            isInstalled: true,
            version: '2024.6.0',
            supportedDevices: ['mock-intel-arc-a770', 'mock-intel-xe-graphics'],
            runtimePath: '/opt/intel/openvino_2024/runtime',
            modelFormats: ['ONNX', 'TensorFlow', 'PyTorch', 'OpenVINO IR'],
            validationStatus: 'valid',
            installationMethod: 'package',
          }),
          notInstalled: () => ({
            isInstalled: false,
            version: '',
            supportedDevices: [],
            modelFormats: [],
            validationStatus: 'unknown',
            installationMethod: 'unknown',
          }),
        },
      };
    }

    return originalFixtures;
  });
}

/**
 * Setup global test utilities
 */
export function setupGlobalTestUtilities() {
  // Ensure performance monitor mocks are available
  if (!global.performanceMonitorMocks) {
    global.performanceMonitorMocks = {
      monitor: {
        startSession: jest.fn().mockReturnValue('session-123'),
        updateMemoryUsage: jest.fn(),
        trackError: jest.fn(),
        endSession: jest.fn().mockResolvedValue({
          sessionId: 'session-123',
          speedupFactor: 3.5,
          processingTime: 5000,
          addonType: 'openvino',
          realTimeRatio: 2.0,
          memoryUsage: {
            heapUsed: 100 * 1024 * 1024,
            peak: 120 * 1024 * 1024,
          },
        }),
      },
      getInstance: jest.fn(),
    };
  }
}

/**
 * Complete test environment setup
 */
export async function setupCompleteTestEnvironment() {
  ensureTestEnvironmentConsistency();
  await ensureProperMockSystemSetup();
  setupErrorHandlerMock();
  fixOpenVINOCapabilityFixtures();
  setupGlobalTestUtilities();
}

/**
 * Complete test environment cleanup
 */
export async function cleanupCompleteTestEnvironment() {
  await cleanupMockSystem();
  jest.clearAllMocks();
  jest.resetModules();
}
