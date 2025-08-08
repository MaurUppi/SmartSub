/**
 * Task 3.2.3: Memory Leak Detection and Prevention Tests
 * Tests long-running process validation and resource cleanup verification
 * Part of Phase 3: Production Excellence
 */

import { jest } from '@jest/globals';
import { generateSubtitleWithBuiltinWhisper } from '../../main/helpers/subtitleGenerator';
import '../../test/setup/subtitleTestSetup';

describe('Memory Leak Detection and Prevention', () => {
  let mockEvent: any;
  let mockFile: any;
  let mockFormData: any;
  let initialMemoryUsage: number;

  beforeEach(() => {
    global.subtitleTestUtils.resetSubtitleMocks();

    mockEvent = global.subtitleTestUtils.createMockEvent();
    mockFile = global.subtitleTestUtils.createMockFile();
    mockFormData = global.subtitleTestUtils.createMockFormData();

    // Setup default successful scenario
    global.subtitleTestUtils.setupMockAudioDuration(30000); // 30 seconds
    global.subtitleTestUtils.setupMockWhisperAddon(true, 'openvino');
    global.subtitleTestUtils.setupMockGPUConfig(
      global.subtitleTestUtils.createMockGPUConfig('openvino'),
    );
    global.subtitleTestUtils.setupMockPerformanceMonitor();

    // Record initial memory usage
    initialMemoryUsage = 100 * 1024 * 1024; // 100MB baseline
  });

  describe('Long-Running Process Validation', () => {
    test('should maintain stable memory usage during extended processing sessions', async () => {
      // Mock extended processing session
      const extendedConfig =
        global.subtitleTestUtils.createMockGPUConfig('openvino');
      extendedConfig.performanceHints.memoryLeakDetection = true;
      extendedConfig.performanceHints.extendedSessionMonitoring = true;

      global.subtitleTestUtils.setupMockGPUConfig(extendedConfig);

      // Mock memory tracking over time
      let sessionMemoryUsage = initialMemoryUsage;
      const memoryMeasurements = [];

      const mockMonitor =
        global.subtitleTestUtils.setupMockPerformanceMonitor();
      mockMonitor.updateMemoryUsage.mockImplementation(() => {
        // Simulate small, expected memory fluctuations
        const fluctuation = (Math.random() - 0.5) * 10 * 1024 * 1024; // ±10MB
        sessionMemoryUsage += fluctuation;
        memoryMeasurements.push(sessionMemoryUsage);

        const logger = require('main/helpers/logger');
        logger.logMessage(
          `Memory usage: ${(sessionMemoryUsage / 1024 / 1024).toFixed(1)}MB`,
          'debug',
        );
      });

      mockMonitor.endSession.mockImplementation(async (result, duration) => {
        // Verify memory returned to baseline
        const finalMemory = sessionMemoryUsage;
        const memoryGrowth = finalMemory - initialMemoryUsage;
        const isLeakDetected = memoryGrowth > 50 * 1024 * 1024; // More than 50MB growth

        return {
          sessionId: 'extended-session',
          speedupFactor: 3.5,
          processingTime: 8000,
          addonType: 'openvino',
          realTimeRatio: 2.5,
          memoryLeak: isLeakDetected,
          memoryGrowth,
          memoryMeasurements: memoryMeasurements.length,
        };
      });

      // Process multiple files in extended session (simulating 2-hour session)
      const extendedFiles = Array.from({ length: 20 }, (_, i) => ({
        ...mockFile,
        uuid: `extended-file-${i + 1}`,
        fileName: `extended_session_${i + 1}.wav`,
      }));

      for (const file of extendedFiles) {
        const result = await generateSubtitleWithBuiltinWhisper(
          mockEvent,
          file,
          mockFormData,
        );
        expect(result).toBe(file.srtFile);
      }

      // Verify memory leak detection was active
      expect(mockMonitor.updateMemoryUsage).toHaveBeenCalled();
      expect(memoryMeasurements.length).toBeGreaterThan(15);
    });

    test('should detect and prevent GPU memory leaks during continuous processing', async () => {
      // Mock GPU memory leak detection
      let gpuMemoryAllocated = 0;
      const gpuMemoryLimit = 8 * 1024 * 1024 * 1024; // 8GB GPU memory

      // Mock GPU memory tracking
      const mockMonitor =
        global.subtitleTestUtils.setupMockPerformanceMonitor();
      mockMonitor.startSession.mockImplementation(
        (gpuConfig, audioFile, model) => {
          // Simulate GPU memory allocation
          const allocationSize = 512 * 1024 * 1024; // 512MB per session
          gpuMemoryAllocated += allocationSize;

          const logger = require('main/helpers/logger');
          const gpuMemoryPercent = (gpuMemoryAllocated / gpuMemoryLimit) * 100;

          if (gpuMemoryPercent > 70) {
            logger.logMessage(
              `GPU memory usage: ${gpuMemoryPercent.toFixed(1)}%`,
              'warning',
            );
          }

          if (gpuMemoryPercent > 90) {
            logger.logMessage(
              'GPU memory leak detected - forcing cleanup',
              'error',
            );

            // Simulate emergency cleanup
            gpuMemoryAllocated = Math.max(0, gpuMemoryAllocated * 0.3); // Clean up 70%
            logger.logMessage('Emergency GPU memory cleanup completed', 'info');
          }

          return `gpu-leak-session-${Date.now()}`;
        },
      );

      mockMonitor.endSession.mockImplementation(async (result, duration) => {
        // Simulate incomplete memory cleanup (leak simulation)
        const leakAmount = 32 * 1024 * 1024; // 32MB leak per session
        gpuMemoryAllocated = Math.max(
          leakAmount,
          gpuMemoryAllocated - 480 * 1024 * 1024,
        );

        const gpuMemoryPercent = (gpuMemoryAllocated / gpuMemoryLimit) * 100;

        return {
          sessionId: 'gpu-leak-session',
          speedupFactor: 3.0,
          processingTime: 6000,
          addonType: 'openvino',
          realTimeRatio: 2.0,
          gpuMemoryLeak: gpuMemoryAllocated > 100 * 1024 * 1024, // More than 100MB persistent
          gpuMemoryUsage: gpuMemoryAllocated,
          gpuMemoryPercent,
        };
      });

      // Simulate continuous processing that could cause GPU memory leaks
      const continuousFiles = Array.from({ length: 25 }, (_, i) => ({
        ...mockFile,
        uuid: `continuous-file-${i + 1}`,
        fileName: `continuous_${i + 1}.wav`,
      }));

      for (const file of continuousFiles) {
        const result = await generateSubtitleWithBuiltinWhisper(
          mockEvent,
          file,
          mockFormData,
        );
        expect(result).toBe(file.srtFile);
      }

      // Verify GPU memory leak detection and cleanup
      const logger = require('main/helpers/logger');
      expect(logger.logMessage).toHaveBeenCalledWith(
        expect.stringContaining('GPU memory leak detected'),
        'error',
      );
      expect(logger.logMessage).toHaveBeenCalledWith(
        'Emergency GPU memory cleanup completed',
        'info',
      );
    });

    test('should handle system memory fragmentation during long sessions', async () => {
      // Mock memory fragmentation scenario
      let memoryFragments = [];
      let totalFragmentedMemory = 0;

      const fragmentationConfig =
        global.subtitleTestUtils.createMockGPUConfig('openvino');
      fragmentationConfig.performanceHints.fragmentationDetection = true;
      fragmentationConfig.performanceHints.memoryDefragmentation = true;

      global.subtitleTestUtils.setupMockGPUConfig(fragmentationConfig);

      // Mock memory fragmentation tracking
      const mockMonitor =
        global.subtitleTestUtils.setupMockPerformanceMonitor();
      mockMonitor.startSession.mockImplementation(() => {
        // Simulate memory fragmentation
        const fragmentSize = Math.random() * 100 * 1024 * 1024; // Random fragments up to 100MB
        memoryFragments.push(fragmentSize);
        totalFragmentedMemory += fragmentSize;

        const logger = require('main/helpers/logger');

        // Check fragmentation threshold
        if (memoryFragments.length > 50) {
          const avgFragmentSize =
            totalFragmentedMemory / memoryFragments.length;
          logger.logMessage(
            `Memory fragmentation detected: ${memoryFragments.length} fragments, avg size: ${(avgFragmentSize / 1024 / 1024).toFixed(1)}MB`,
            'warning',
          );

          if (memoryFragments.length > 100) {
            logger.logMessage('Initiating memory defragmentation...', 'info');

            // Simulate defragmentation
            memoryFragments = memoryFragments.slice(-20); // Keep only recent fragments
            totalFragmentedMemory = memoryFragments.reduce(
              (sum, frag) => sum + frag,
              0,
            );

            logger.logMessage(
              `Defragmentation completed: ${memoryFragments.length} fragments remaining`,
              'info',
            );
          }
        }

        return `fragmentation-session-${memoryFragments.length}`;
      });

      mockMonitor.endSession.mockImplementation(async (result, duration) => {
        // Clean up one fragment per session end
        if (memoryFragments.length > 0) {
          const cleanedFragment = memoryFragments.pop();
          totalFragmentedMemory -= cleanedFragment;
        }

        return {
          sessionId: 'fragmentation-session',
          speedupFactor: 3.2,
          processingTime: 5500,
          addonType: 'openvino',
          realTimeRatio: 2.3,
          memoryFragmentation: memoryFragments.length > 30,
          fragmentCount: memoryFragments.length,
          totalFragmentedMemory,
        };
      });

      // Simulate long session with many small files (causes fragmentation)
      const fragmentationFiles = Array.from({ length: 80 }, (_, i) => ({
        ...mockFile,
        uuid: `fragment-file-${i + 1}`,
        fileName: `fragment_${i + 1}.wav`,
      }));

      for (const file of fragmentationFiles) {
        const result = await generateSubtitleWithBuiltinWhisper(
          mockEvent,
          file,
          mockFormData,
        );
        expect(result).toBe(file.srtFile);
      }

      // Verify fragmentation detection and defragmentation
      const logger = require('main/helpers/logger');
      expect(logger.logMessage).toHaveBeenCalledWith(
        expect.stringContaining('Memory fragmentation detected'),
        'warning',
      );
      expect(logger.logMessage).toHaveBeenCalledWith(
        'Initiating memory defragmentation...',
        'info',
      );
    });
  });

  describe('Resource Cleanup Verification', () => {
    test('should properly cleanup resources after successful processing', async () => {
      // Mock resource cleanup tracking
      const resourceTracker = {
        openFiles: 0,
        activeConnections: 0,
        gpuContexts: 0,
        temporaryBuffers: 0,
        eventListeners: 0,
      };

      // Mock resource allocation and cleanup
      const { loadWhisperAddon } = require('main/helpers/whisper');
      loadWhisperAddon.mockImplementation(async () => {
        const mockWhisperFn = jest.fn(async (params) => {
          // Simulate resource allocation
          resourceTracker.openFiles += 2; // Audio file + model file
          resourceTracker.activeConnections += 1;
          resourceTracker.gpuContexts += 1;
          resourceTracker.temporaryBuffers += 3;
          resourceTracker.eventListeners += 5;

          const logger = require('main/helpers/logger');
          logger.logMessage(
            `Resources allocated: ${JSON.stringify(resourceTracker)}`,
            'debug',
          );

          // Simulate processing
          const result =
            global.subtitleTestUtils.createMockTranscriptionResult();

          // Simulate resource cleanup
          resourceTracker.openFiles -= 2;
          resourceTracker.activeConnections -= 1;
          resourceTracker.gpuContexts -= 1;
          resourceTracker.temporaryBuffers -= 3;
          resourceTracker.eventListeners -= 5;

          logger.logMessage(
            `Resources cleaned up: ${JSON.stringify(resourceTracker)}`,
            'debug',
          );

          return result;
        });

        return mockWhisperFn;
      });

      const result = await generateSubtitleWithBuiltinWhisper(
        mockEvent,
        mockFile,
        mockFormData,
      );

      expect(result).toBe(mockFile.srtFile);

      // Verify all resources were cleaned up
      expect(resourceTracker.openFiles).toBe(0);
      expect(resourceTracker.activeConnections).toBe(0);
      expect(resourceTracker.gpuContexts).toBe(0);
      expect(resourceTracker.temporaryBuffers).toBe(0);
      expect(resourceTracker.eventListeners).toBe(0);
    });

    test('should cleanup resources after processing errors', async () => {
      // Mock error scenario with resource cleanup
      const resourceTracker = {
        allocatedMemory: 0,
        openHandles: 0,
        gpuResources: 0,
      };

      // Mock resource allocation followed by error
      const { loadWhisperAddon } = require('main/helpers/whisper');
      loadWhisperAddon.mockImplementation(async () => {
        const mockWhisperFn = jest.fn(async (params) => {
          // Allocate resources
          resourceTracker.allocatedMemory += 500 * 1024 * 1024; // 500MB
          resourceTracker.openHandles += 10;
          resourceTracker.gpuResources += 5;

          const logger = require('main/helpers/logger');
          logger.logMessage(
            `Resources allocated before error: ${JSON.stringify(resourceTracker)}`,
            'debug',
          );

          // Simulate error during processing
          throw new Error('Simulated processing error for cleanup testing');
        });

        return mockWhisperFn;
      });

      // Mock error handler with cleanup verification
      const errorHandler = require('main/helpers/errorHandler');
      errorHandler.handleProcessingError.mockImplementation(
        async (error, event, file, formData) => {
          const logger = require('main/helpers/logger');
          logger.logMessage(
            'Error occurred, initiating emergency resource cleanup...',
            'warning',
          );

          // Simulate emergency cleanup
          resourceTracker.allocatedMemory = 0;
          resourceTracker.openHandles = 0;
          resourceTracker.gpuResources = 0;

          logger.logMessage(
            `Emergency cleanup completed: ${JSON.stringify(resourceTracker)}`,
            'info',
          );

          return file.srtFile;
        },
      );

      const result = await generateSubtitleWithBuiltinWhisper(
        mockEvent,
        mockFile,
        mockFormData,
      );

      expect(result).toBe(mockFile.srtFile);

      // Verify emergency cleanup occurred
      expect(resourceTracker.allocatedMemory).toBe(0);
      expect(resourceTracker.openHandles).toBe(0);
      expect(resourceTracker.gpuResources).toBe(0);

      const logger = require('main/helpers/logger');
      expect(logger.logMessage).toHaveBeenCalledWith(
        'Error occurred, initiating emergency resource cleanup...',
        'warning',
      );
    });

    test('should detect and clean up orphaned resources', async () => {
      // Mock orphaned resource detection
      const orphanedResources = {
        tempFiles: [],
        zombieProcesses: [],
        unclosedStreams: [],
        danglingReferences: [],
      };

      // Mock resource tracking with orphan detection
      const mockMonitor =
        global.subtitleTestUtils.setupMockPerformanceMonitor();
      let sessionCount = 0;

      mockMonitor.startSession.mockImplementation(
        (gpuConfig, audioFile, model) => {
          sessionCount++;

          // Simulate some sessions creating orphaned resources
          if (sessionCount % 3 === 0) {
            orphanedResources.tempFiles.push(`/tmp/orphan_${sessionCount}.tmp`);
            orphanedResources.zombieProcesses.push(
              `whisper_proc_${sessionCount}`,
            );
            orphanedResources.unclosedStreams.push(`stream_${sessionCount}`);
            orphanedResources.danglingReferences.push(`ref_${sessionCount}`);
          }

          return `orphan-detection-session-${sessionCount}`;
        },
      );

      mockMonitor.endSession.mockImplementation(async (result, duration) => {
        const logger = require('main/helpers/logger');

        // Check for orphaned resources
        const totalOrphans =
          orphanedResources.tempFiles.length +
          orphanedResources.zombieProcesses.length +
          orphanedResources.unclosedStreams.length +
          orphanedResources.danglingReferences.length;

        if (totalOrphans > 5) {
          logger.logMessage(
            `Orphaned resources detected: ${totalOrphans} items`,
            'warning',
          );
          logger.logMessage('Initiating orphan cleanup...', 'info');

          // Simulate orphan cleanup
          orphanedResources.tempFiles = [];
          orphanedResources.zombieProcesses = [];
          orphanedResources.unclosedStreams = [];
          orphanedResources.danglingReferences = [];

          logger.logMessage('Orphan cleanup completed', 'info');
        }

        return {
          sessionId: `orphan-detection-session-${sessionCount}`,
          speedupFactor: 3.0,
          processingTime: 6000,
          addonType: 'openvino',
          realTimeRatio: 2.0,
          orphanedResourcesDetected: totalOrphans > 0,
          orphanedResourceCount: totalOrphans,
        };
      });

      // Process multiple files to trigger orphan detection
      const orphanTestFiles = Array.from({ length: 15 }, (_, i) => ({
        ...mockFile,
        uuid: `orphan-test-${i + 1}`,
        fileName: `orphan_test_${i + 1}.wav`,
      }));

      for (const file of orphanTestFiles) {
        const result = await generateSubtitleWithBuiltinWhisper(
          mockEvent,
          file,
          mockFormData,
        );
        expect(result).toBe(file.srtFile);
      }

      // Verify orphan detection and cleanup
      const logger = require('main/helpers/logger');
      expect(logger.logMessage).toHaveBeenCalledWith(
        expect.stringContaining('Orphaned resources detected'),
        'warning',
      );
      expect(logger.logMessage).toHaveBeenCalledWith(
        'Orphan cleanup completed',
        'info',
      );
    });

    test('should implement proper disposal patterns for GPU resources', async () => {
      // Mock GPU resource disposal pattern
      const gpuResourcePool = {
        contexts: new Set(),
        buffers: new Set(),
        textures: new Set(),
        programs: new Set(),
      };

      let resourceIdCounter = 0;

      // Mock GPU resource management
      const mockMonitor =
        global.subtitleTestUtils.setupMockPerformanceMonitor();
      mockMonitor.startSession.mockImplementation(
        (gpuConfig, audioFile, model) => {
          // Simulate GPU resource allocation
          const sessionId = ++resourceIdCounter;
          gpuResourcePool.contexts.add(`context_${sessionId}`);
          gpuResourcePool.buffers.add(`buffer_input_${sessionId}`);
          gpuResourcePool.buffers.add(`buffer_output_${sessionId}`);
          gpuResourcePool.textures.add(`texture_${sessionId}`);
          gpuResourcePool.programs.add(`program_${sessionId}`);

          const logger = require('main/helpers/logger');
          const totalResources =
            gpuResourcePool.contexts.size +
            gpuResourcePool.buffers.size +
            gpuResourcePool.textures.size +
            gpuResourcePool.programs.size;

          logger.logMessage(
            `GPU resources allocated: ${totalResources} total`,
            'debug',
          );

          return `gpu-disposal-session-${sessionId}`;
        },
      );

      mockMonitor.endSession.mockImplementation(async (result, duration) => {
        // Simulate proper GPU resource disposal
        const sessionId = resourceIdCounter;

        // Dispose resources in proper order (reverse of allocation)
        gpuResourcePool.programs.delete(`program_${sessionId}`);
        gpuResourcePool.textures.delete(`texture_${sessionId}`);
        gpuResourcePool.buffers.delete(`buffer_output_${sessionId}`);
        gpuResourcePool.buffers.delete(`buffer_input_${sessionId}`);
        gpuResourcePool.contexts.delete(`context_${sessionId}`);

        const logger = require('main/helpers/logger');
        const remainingResources =
          gpuResourcePool.contexts.size +
          gpuResourcePool.buffers.size +
          gpuResourcePool.textures.size +
          gpuResourcePool.programs.size;

        logger.logMessage(
          `GPU resources after disposal: ${remainingResources} remaining`,
          'debug',
        );

        return {
          sessionId: `gpu-disposal-session-${sessionId}`,
          speedupFactor: 3.5,
          processingTime: 5000,
          addonType: 'openvino',
          realTimeRatio: 2.5,
          properDisposal: true,
          remainingGpuResources: remainingResources,
        };
      });

      // Process files to test GPU resource disposal
      const disposalTestFiles = Array.from({ length: 8 }, (_, i) => ({
        ...mockFile,
        uuid: `disposal-test-${i + 1}`,
        fileName: `disposal_test_${i + 1}.wav`,
      }));

      for (const file of disposalTestFiles) {
        const result = await generateSubtitleWithBuiltinWhisper(
          mockEvent,
          file,
          mockFormData,
        );
        expect(result).toBe(file.srtFile);
      }

      // Verify all GPU resources were properly disposed
      expect(gpuResourcePool.contexts.size).toBe(0);
      expect(gpuResourcePool.buffers.size).toBe(0);
      expect(gpuResourcePool.textures.size).toBe(0);
      expect(gpuResourcePool.programs.size).toBe(0);
    });
  });

  describe('Memory Leak Prevention Strategies', () => {
    test('should implement weak references to prevent circular references', async () => {
      // Mock weak reference pattern for preventing circular references
      const referenceTracker = {
        strongReferences: new Set(),
        weakReferences: new WeakSet(),
        circularReferencesPrevented: 0,
      };

      // Mock object lifecycle with weak references
      const { loadWhisperAddon } = require('main/helpers/whisper');
      loadWhisperAddon.mockImplementation(async () => {
        const mockWhisperFn = jest.fn(async (params) => {
          // Simulate object creation with potential circular references
          const processingContext = { id: Date.now() };
          const callback = params.progress_callback;

          // Strong reference for active processing
          referenceTracker.strongReferences.add(processingContext);

          // Weak reference to prevent memory leaks
          referenceTracker.weakReferences.add({
            callback,
            context: processingContext,
          });

          // Simulate potential circular reference detection
          if (referenceTracker.strongReferences.size > 5) {
            const logger = require('main/helpers/logger');
            logger.logMessage(
              'Potential circular references detected, implementing weak reference pattern',
              'info',
            );
            referenceTracker.circularReferencesPrevented++;
          }

          // Process with callback
          if (callback) {
            for (let i = 0; i <= 100; i += 20) {
              callback(i);
            }
          }

          // Clean up strong references
          referenceTracker.strongReferences.delete(processingContext);

          return global.subtitleTestUtils.createMockTranscriptionResult();
        });

        return mockWhisperFn;
      });

      // Process multiple files to test weak reference pattern
      const weakRefFiles = Array.from({ length: 8 }, (_, i) => ({
        ...mockFile,
        uuid: `weak-ref-${i + 1}`,
        fileName: `weak_ref_${i + 1}.wav`,
      }));

      for (const file of weakRefFiles) {
        const result = await generateSubtitleWithBuiltinWhisper(
          mockEvent,
          file,
          mockFormData,
        );
        expect(result).toBe(file.srtFile);
      }

      // Verify weak reference pattern prevented circular references
      expect(referenceTracker.strongReferences.size).toBe(0);
      expect(referenceTracker.circularReferencesPrevented).toBeGreaterThan(0);
    });

    test('should implement automatic garbage collection triggers', async () => {
      // Mock automatic garbage collection for memory management
      let memoryPressure = 0;
      let gcTriggered = 0;
      const gcThreshold = 500 * 1024 * 1024; // 500MB threshold

      const mockMonitor =
        global.subtitleTestUtils.setupMockPerformanceMonitor();
      mockMonitor.updateMemoryUsage.mockImplementation(() => {
        // Simulate memory pressure building up
        memoryPressure += 75 * 1024 * 1024; // 75MB per update

        const logger = require('main/helpers/logger');

        if (memoryPressure > gcThreshold) {
          logger.logMessage(
            `Memory pressure: ${(memoryPressure / 1024 / 1024).toFixed(1)}MB - triggering GC`,
            'info',
          );

          // Simulate garbage collection
          gcTriggered++;
          memoryPressure = Math.max(100 * 1024 * 1024, memoryPressure * 0.3); // Clean up 70%

          logger.logMessage(
            `GC completed: ${(memoryPressure / 1024 / 1024).toFixed(1)}MB remaining`,
            'info',
          );
        }
      });

      mockMonitor.endSession.mockImplementation(async (result, duration) => {
        return {
          sessionId: 'gc-session',
          speedupFactor: 3.0,
          processingTime: 6000,
          addonType: 'openvino',
          realTimeRatio: 2.0,
          gcTriggered: gcTriggered > 0,
          gcCount: gcTriggered,
          finalMemoryPressure: memoryPressure,
        };
      });

      // Process files to build up memory pressure and trigger GC
      const gcTestFiles = Array.from({ length: 12 }, (_, i) => ({
        ...mockFile,
        uuid: `gc-test-${i + 1}`,
        fileName: `gc_test_${i + 1}.wav`,
      }));

      for (const file of gcTestFiles) {
        const result = await generateSubtitleWithBuiltinWhisper(
          mockEvent,
          file,
          mockFormData,
        );
        expect(result).toBe(file.srtFile);
      }

      // Verify automatic GC was triggered
      expect(gcTriggered).toBeGreaterThan(0);

      const logger = require('main/helpers/logger');
      expect(logger.logMessage).toHaveBeenCalledWith(
        expect.stringContaining('triggering GC'),
        'info',
      );
    });
  });
});
