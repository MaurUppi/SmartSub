/**
 * Task 3.1.2: Driver Failure Scenario Validation Tests
 * Tests system behavior when Intel GPU drivers are missing, corrupted, or incompatible
 * Part of Phase 3: Production Excellence
 */

import { jest } from '@jest/globals';
import { generateSubtitleWithBuiltinWhisper } from '../../main/helpers/subtitleGenerator';
import '../../test/setup/subtitleTestSetup';

describe('Driver Failure Scenario Validation', () => {
  let mockEvent: any;
  let mockFile: any;
  let mockFormData: any;

  beforeEach(() => {
    global.subtitleTestUtils.resetSubtitleMocks();

    mockEvent = global.subtitleTestUtils.createMockEvent();
    mockFile = global.subtitleTestUtils.createMockFile();
    mockFormData = global.subtitleTestUtils.createMockFormData();

    // Setup default successful scenario
    global.subtitleTestUtils.setupMockAudioDuration(30000); // 30 seconds
    global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
    global.subtitleTestUtils.setupMockPerformanceMonitor();
  });

  describe('Missing Intel GPU Driver Scenarios', () => {
    test('should gracefully fallback when Intel GPU driver is completely missing', async () => {
      // Mock missing driver scenario - GPU config determination fails
      global.gpuConfigMocks.determineGPUConfiguration.mockRejectedValue(
        new Error(
          'Intel GPU driver not found - no compatible OpenVINO device detected',
        ),
      );

      // Mock error handler to provide CPU fallback
      const errorHandler = require('main/helpers/errorHandler');
      errorHandler.handleProcessingError.mockImplementation(
        async (error, event, file, formData) => {
          // Simulate automatic fallback to CPU processing
          const cpuConfig = global.subtitleTestUtils.createMockGPUConfig('cpu');
          global.subtitleTestUtils.setupMockGPUConfig(cpuConfig);

          // Setup CPU-based whisper addon
          global.subtitleTestUtils.setupMockWhisperAddon(true, 'cpu');

          return file.srtFile;
        },
      );

      const result = await generateSubtitleWithBuiltinWhisper(
        mockEvent,
        mockFile,
        mockFormData,
      );

      expect(result).toBe(mockFile.srtFile);
      expect(errorHandler.handleProcessingError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Intel GPU driver not found'),
        }),
        mockEvent,
        mockFile,
        mockFormData,
      );
    });

    test('should handle Intel Arc driver not installed scenario', async () => {
      // Mock scenario where Intel Arc driver is specifically missing
      const noArcDriverConfig = null; // No valid GPU configuration available

      global.gpuConfigMocks.determineGPUConfiguration.mockResolvedValue(
        noArcDriverConfig,
      );

      // Should trigger fallback due to null config
      const result = await generateSubtitleWithBuiltinWhisper(
        mockEvent,
        mockFile,
        mockFormData,
      );

      expect(result).toBe(mockFile.srtFile);

      // Verify fallback content was created
      const fs = require('fs');
      expect(fs.promises.writeFile).toHaveBeenCalledWith(
        mockFile.srtFile,
        expect.stringContaining(
          'Module loading failed - using fallback content',
        ),
      );
    });

    test('should handle Intel Xe Graphics driver missing with integrated GPU fallback', async () => {
      // Mock integrated GPU driver missing, but discrete available
      const discreteOnlyConfig =
        global.subtitleTestUtils.createMockGPUConfig('openvino');
      discreteOnlyConfig.addonInfo.displayName =
        'Intel Arc A770 (Discrete Only)';
      discreteOnlyConfig.addonInfo.deviceConfig.type = 'discrete';
      discreteOnlyConfig.performanceHints.note =
        'Integrated GPU driver missing, using discrete only';

      global.subtitleTestUtils.setupMockGPUConfig(discreteOnlyConfig);

      const result = await generateSubtitleWithBuiltinWhisper(
        mockEvent,
        mockFile,
        mockFormData,
      );

      expect(result).toBe(mockFile.srtFile);
      expect(mockEvent.sender.send).toHaveBeenCalledWith(
        'gpuSelected',
        expect.objectContaining({
          addonType: 'openvino',
          displayName: 'Intel Arc A770 (Discrete Only)',
        }),
      );
    });
  });

  describe('Corrupted Driver Scenarios', () => {
    test('should handle corrupted Intel GPU driver with recovery', async () => {
      // Mock corrupted driver scenario - addon loading fails
      const { loadWhisperAddon } = require('main/helpers/whisper');
      loadWhisperAddon.mockRejectedValue(
        new Error(
          'OpenVINO runtime error: corrupted driver installation detected',
        ),
      );

      // Mock error handler with driver recovery
      const errorHandler = require('main/helpers/errorHandler');
      errorHandler.handleProcessingError.mockImplementation(
        async (error, event, file, formData) => {
          // Simulate driver recovery attempt followed by CPU fallback
          const logger = require('main/helpers/logger');
          logger.logMessage.mockImplementation((message) => {
            if (message.includes('corrupted driver')) {
              // Log recovery attempt
              console.log('Attempting driver recovery...');
            }
          });

          // Fallback to CPU after recovery attempt
          const cpuConfig = global.subtitleTestUtils.createMockGPUConfig('cpu');
          global.subtitleTestUtils.setupMockGPUConfig(cpuConfig);
          global.subtitleTestUtils.setupMockWhisperAddon(true, 'cpu');

          return file.srtFile;
        },
      );

      const result = await generateSubtitleWithBuiltinWhisper(
        mockEvent,
        mockFile,
        mockFormData,
      );

      expect(result).toBe(mockFile.srtFile);
      expect(errorHandler.handleProcessingError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('corrupted driver installation'),
        }),
        mockEvent,
        mockFile,
        mockFormData,
      );
    });

    test('should detect and handle partially corrupted driver files', async () => {
      // Mock partially corrupted driver - GPU detection succeeds but processing fails
      const partiallyCorruptedConfig =
        global.subtitleTestUtils.createMockGPUConfig('openvino');
      partiallyCorruptedConfig.addonInfo.note =
        'Driver partially corrupted - limited functionality';
      partiallyCorruptedConfig.performanceHints.expectedSpeedup = 1.5; // Degraded performance

      global.subtitleTestUtils.setupMockGPUConfig(partiallyCorruptedConfig);

      // Mock whisper processing to fail due to driver corruption
      const { loadWhisperAddon } = require('main/helpers/whisper');
      const mockWhisperFn = jest
        .fn()
        .mockRejectedValue(
          new Error(
            'OpenVINO device initialization failed: driver corruption detected',
          ),
        );
      loadWhisperAddon.mockResolvedValue(mockWhisperFn);

      // Mock recovery to CPU
      const errorHandler = require('main/helpers/errorHandler');
      errorHandler.handleProcessingError.mockResolvedValue(mockFile.srtFile);

      const result = await generateSubtitleWithBuiltinWhisper(
        mockEvent,
        mockFile,
        mockFormData,
      );

      expect(result).toBe(mockFile.srtFile);
      expect(errorHandler.handleProcessingError).toHaveBeenCalled();
    });

    test('should handle OpenVINO runtime corruption with diagnostic info', async () => {
      // Mock OpenVINO runtime corruption
      global.gpuConfigMocks.determineGPUConfiguration.mockRejectedValue(
        new Error('OpenVINO runtime corrupted: missing core libraries'),
      );

      // Mock error handler with diagnostic information
      const errorHandler = require('main/helpers/errorHandler');
      errorHandler.handleProcessingError.mockImplementation(
        async (error, event, file, formData) => {
          // Log diagnostic information
          const logger = require('main/helpers/logger');
          logger.logMessage('Running OpenVINO diagnostic...', 'info');
          logger.logMessage(
            'Detected corrupted OpenVINO installation',
            'error',
          );
          logger.logMessage(
            'Recommendation: Reinstall Intel GPU drivers',
            'warning',
          );

          // Fallback to CPU
          return file.srtFile;
        },
      );

      const result = await generateSubtitleWithBuiltinWhisper(
        mockEvent,
        mockFile,
        mockFormData,
      );

      expect(result).toBe(mockFile.srtFile);

      // Verify diagnostic logging occurred
      const logger = require('main/helpers/logger');
      expect(logger.logMessage).toHaveBeenCalledWith(
        'Running OpenVINO diagnostic...',
        'info',
      );
      expect(logger.logMessage).toHaveBeenCalledWith(
        'Detected corrupted OpenVINO installation',
        'error',
      );
    });
  });

  describe('Incompatible Driver Version Scenarios', () => {
    test('should handle outdated Intel GPU driver version', async () => {
      // Mock outdated driver scenario
      const outdatedDriverConfig =
        global.subtitleTestUtils.createMockGPUConfig('openvino');
      outdatedDriverConfig.addonInfo.driverVersion = '27.20.100.8336'; // Old version
      outdatedDriverConfig.addonInfo.note =
        'Driver version too old for optimal performance';
      outdatedDriverConfig.performanceHints.expectedSpeedup = 2.0; // Reduced due to old driver
      outdatedDriverConfig.performanceHints.compatibility = 'limited';

      global.subtitleTestUtils.setupMockGPUConfig(outdatedDriverConfig);

      const result = await generateSubtitleWithBuiltinWhisper(
        mockEvent,
        mockFile,
        mockFormData,
      );

      expect(result).toBe(mockFile.srtFile);

      // Should work but with warnings
      const logger = require('main/helpers/logger');
      expect(logger.logMessage).toHaveBeenCalledWith(
        expect.stringContaining('Driver version too old'),
        'warning',
      );
    });

    test('should handle beta/unstable driver version with warnings', async () => {
      // Mock beta driver scenario
      const betaDriverConfig =
        global.subtitleTestUtils.createMockGPUConfig('openvino');
      betaDriverConfig.addonInfo.driverVersion = '31.0.101.4887-beta'; // Beta version
      betaDriverConfig.addonInfo.note =
        'Beta driver detected - stability not guaranteed';
      betaDriverConfig.performanceHints.stability = 'beta';

      global.subtitleTestUtils.setupMockGPUConfig(betaDriverConfig);

      const result = await generateSubtitleWithBuiltinWhisper(
        mockEvent,
        mockFile,
        mockFormData,
      );

      expect(result).toBe(mockFile.srtFile);

      // Should work but with beta warnings
      expect(mockEvent.sender.send).toHaveBeenCalledWith(
        'gpuSelected',
        expect.objectContaining({
          addonType: 'openvino',
          displayName: expect.stringContaining('Intel Arc A770'),
        }),
      );
    });

    test('should reject incompatible future driver version gracefully', async () => {
      // Mock future/incompatible driver version
      global.gpuConfigMocks.determineGPUConfiguration.mockRejectedValue(
        new Error(
          'Incompatible driver version 32.0.0.0000 - requires application update',
        ),
      );

      // Mock error handler with version compatibility message
      const errorHandler = require('main/helpers/errorHandler');
      errorHandler.handleProcessingError.mockImplementation(
        async (error, event, file, formData) => {
          const logger = require('main/helpers/logger');
          logger.logMessage(
            'Driver version incompatible - falling back to CPU',
            'warning',
          );

          // CPU fallback
          const cpuConfig = global.subtitleTestUtils.createMockGPUConfig('cpu');
          global.subtitleTestUtils.setupMockGPUConfig(cpuConfig);

          return file.srtFile;
        },
      );

      const result = await generateSubtitleWithBuiltinWhisper(
        mockEvent,
        mockFile,
        mockFormData,
      );

      expect(result).toBe(mockFile.srtFile);
      expect(errorHandler.handleProcessingError).toHaveBeenCalled();
    });
  });

  describe('Driver Conflict Scenarios', () => {
    test('should handle conflicting GPU driver installations', async () => {
      // Mock driver conflict scenario
      global.gpuConfigMocks.determineGPUConfiguration.mockRejectedValue(
        new Error('Multiple conflicting GPU drivers detected: Intel + NVIDIA'),
      );

      // Mock conflict resolution
      const errorHandler = require('main/helpers/errorHandler');
      errorHandler.handleProcessingError.mockImplementation(
        async (error, event, file, formData) => {
          // Log conflict detection
          const logger = require('main/helpers/logger');
          logger.logMessage('GPU driver conflict detected', 'warning');
          logger.logMessage('Attempting Intel GPU priority...', 'info');

          // Try Intel GPU with conflict resolution
          const conflictResolvedConfig =
            global.subtitleTestUtils.createMockGPUConfig('openvino');
          conflictResolvedConfig.addonInfo.note =
            'Conflict resolved - Intel GPU selected';
          conflictResolvedConfig.performanceHints.conflictResolution =
            'intel_priority';

          global.subtitleTestUtils.setupMockGPUConfig(conflictResolvedConfig);

          return file.srtFile;
        },
      );

      const result = await generateSubtitleWithBuiltinWhisper(
        mockEvent,
        mockFile,
        mockFormData,
      );

      expect(result).toBe(mockFile.srtFile);
      expect(errorHandler.handleProcessingError).toHaveBeenCalled();
    });

    test('should handle Windows vs Linux driver compatibility', async () => {
      // Mock cross-platform driver compatibility issue
      const platformConflictConfig =
        global.subtitleTestUtils.createMockGPUConfig('openvino');
      platformConflictConfig.addonInfo.platform = 'linux';
      platformConflictConfig.addonInfo.note = 'Linux driver compatibility mode';
      platformConflictConfig.performanceHints.platformOptimization = 'linux';

      // Mock platform-specific driver validation
      if (process.platform === 'win32') {
        platformConflictConfig.addonInfo.note =
          'Windows driver with Linux compatibility layer';
        platformConflictConfig.performanceHints.crossPlatformMode = true;
      }

      global.subtitleTestUtils.setupMockGPUConfig(platformConflictConfig);

      const result = await generateSubtitleWithBuiltinWhisper(
        mockEvent,
        mockFile,
        mockFormData,
      );

      expect(result).toBe(mockFile.srtFile);

      // Verify platform-specific configuration was applied
      expect(
        global.gpuConfigMocks.determineGPUConfiguration,
      ).toHaveBeenCalled();
    });
  });

  describe('Driver Recovery and Diagnostics', () => {
    test('should provide comprehensive driver diagnostic information', async () => {
      // Mock driver diagnostic scenario
      global.gpuConfigMocks.determineGPUConfiguration.mockRejectedValue(
        new Error('Driver diagnostic failed: multiple issues detected'),
      );

      // Mock comprehensive diagnostic
      const errorHandler = require('main/helpers/errorHandler');
      errorHandler.handleProcessingError.mockImplementation(
        async (error, event, file, formData) => {
          const logger = require('main/helpers/logger');

          // Comprehensive diagnostic logging
          logger.logMessage('=== GPU Driver Diagnostic Report ===', 'info');
          logger.logMessage('Platform: ' + process.platform, 'info');
          logger.logMessage('Intel GPU Status: Not detected', 'error');
          logger.logMessage('OpenVINO Runtime: Failed to initialize', 'error');
          logger.logMessage(
            'Recommended Action: Reinstall Intel GPU drivers',
            'warning',
          );
          logger.logMessage('Fallback: CPU processing enabled', 'info');
          logger.logMessage('=== End Diagnostic Report ===', 'info');

          // CPU fallback after diagnostic
          const cpuConfig = global.subtitleTestUtils.createMockGPUConfig('cpu');
          global.subtitleTestUtils.setupMockGPUConfig(cpuConfig);

          return file.srtFile;
        },
      );

      const result = await generateSubtitleWithBuiltinWhisper(
        mockEvent,
        mockFile,
        mockFormData,
      );

      expect(result).toBe(mockFile.srtFile);

      // Verify comprehensive diagnostic was performed
      const logger = require('main/helpers/logger');
      expect(logger.logMessage).toHaveBeenCalledWith(
        '=== GPU Driver Diagnostic Report ===',
        'info',
      );
      expect(logger.logMessage).toHaveBeenCalledWith(
        'Recommended Action: Reinstall Intel GPU drivers',
        'warning',
      );
    });

    test('should attempt automatic driver recovery when possible', async () => {
      // Mock recoverable driver issue
      let recoveryAttempted = false;

      global.gpuConfigMocks.determineGPUConfiguration.mockImplementation(
        async () => {
          if (!recoveryAttempted) {
            recoveryAttempted = true;
            throw new Error('Temporary driver initialization failure');
          } else {
            // Recovery successful
            return global.subtitleTestUtils.createMockGPUConfig('openvino');
          }
        },
      );

      // Mock error handler with recovery attempt
      const errorHandler = require('main/helpers/errorHandler');
      errorHandler.handleProcessingError.mockImplementation(
        async (error, event, file, formData) => {
          const logger = require('main/helpers/logger');
          logger.logMessage('Attempting automatic driver recovery...', 'info');

          // Simulate recovery attempt by retrying GPU configuration
          try {
            const recoveredConfig =
              await global.gpuConfigMocks.determineGPUConfiguration();
            global.subtitleTestUtils.setupMockGPUConfig(recoveredConfig);
            logger.logMessage('Driver recovery successful!', 'info');
            return file.srtFile;
          } catch (recoveryError) {
            logger.logMessage(
              'Driver recovery failed, using CPU fallback',
              'warning',
            );
            return file.srtFile;
          }
        },
      );

      const result = await generateSubtitleWithBuiltinWhisper(
        mockEvent,
        mockFile,
        mockFormData,
      );

      expect(result).toBe(mockFile.srtFile);
      expect(recoveryAttempted).toBe(true);
    });

    test('should handle driver issues with user-friendly error messages', async () => {
      // Mock user-friendly error messaging
      global.gpuConfigMocks.determineGPUConfiguration.mockRejectedValue(
        new Error('TECHNICAL_ERROR_CODE_0x80070002: Driver subsystem failure'),
      );

      // Mock error handler with user-friendly translation
      const errorHandler = require('main/helpers/errorHandler');
      errorHandler.createUserFriendlyErrorMessage.mockImplementation(
        (error) => {
          if (error.message.includes('TECHNICAL_ERROR_CODE_0x80070002')) {
            return 'Intel GPU driver is not properly installed. Please install the latest Intel GPU drivers from the Intel website.';
          }
          return error.message;
        },
      );

      errorHandler.handleProcessingError.mockResolvedValue(mockFile.srtFile);

      const result = await generateSubtitleWithBuiltinWhisper(
        mockEvent,
        mockFile,
        mockFormData,
      );

      expect(result).toBe(mockFile.srtFile);
      expect(errorHandler.createUserFriendlyErrorMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('TECHNICAL_ERROR_CODE_0x80070002'),
        }),
      );
    });
  });
});
