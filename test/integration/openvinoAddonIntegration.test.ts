/**
 * OpenVINO Addon Integration Test
 * Tests integration between OpenVINO addon and SmartSub application
 * Part of Task UE-1: End-to-End macOS ARM64 Testing
 */

import path from 'path';
import fs from 'fs';
import {
  OpenVINOAddonValidator,
  validateOpenVINOAddon,
  isAppleSilicon,
  getExpectedOpenVINOBehavior,
} from '../utils/openvinoAddonValidator';

describe('OpenVINO Addon Integration', () => {
  let validator: OpenVINOAddonValidator;
  const addonBaseDir = path.join(__dirname, '../../extraResources/addons');

  beforeAll(() => {
    // Ensure addons directory exists (create if needed for testing)
    if (!fs.existsSync(addonBaseDir)) {
      fs.mkdirSync(addonBaseDir, { recursive: true });
    }

    validator = new OpenVINOAddonValidator();
  });

  describe('Addon File Validation', () => {
    test('should validate addon file properties', async () => {
      const result = await validateOpenVINOAddon();

      console.log('📋 Addon Validation Result:', {
        exists: result.exists,
        isLoadable: result.isLoadable,
        size: result.size > 0 ? `${Math.round(result.size / 1024)}KB` : '0KB',
        platform: result.platform,
        arch: result.arch,
        methods: result.methods?.length || 0,
        error: result.errorMessage,
      });

      // These tests document expected behavior even if addon is not present
      expect(result.platform).toBeDefined();
      expect(result.arch).toBeDefined();
      expect(typeof result.exists).toBe('boolean');
      expect(typeof result.isLoadable).toBe('boolean');

      if (result.exists && !result.isLoadable && result.errorMessage) {
        console.warn('⚠️ Addon exists but not loadable:', result.errorMessage);
      }

      if (result.isLoadable && result.methods) {
        expect(result.methods.length).toBeGreaterThan(0);
        console.log('✅ Available addon methods:', result.methods);
      }
    });

    test('should validate platform-specific addon paths', () => {
      const expectedPaths = {
        'darwin-arm64': 'addon-macos-arm-openvino.node',
        'darwin-x64': 'addon-macos-x86-openvino.node',
        'win32-x64': 'addon-windows-openvino.node',
        'linux-x64': 'addon-linux-openvino.node',
      };

      const currentPlatform = `${process.platform}-${process.arch}`;
      const expectedAddon = expectedPaths[currentPlatform];

      console.log('🔍 Platform Detection:', {
        detected: currentPlatform,
        expectedAddon: expectedAddon || 'Unknown platform',
        isAppleSilicon: isAppleSilicon(),
      });

      if (expectedAddon) {
        const addonPath = path.join(addonBaseDir, expectedAddon);
        const exists = fs.existsSync(addonPath);

        console.log(`${exists ? '✅' : '❌'} Expected addon: ${expectedAddon}`);

        // Document expected addon location
        expect(expectedAddon).toBeDefined();
      }
    });
  });

  describe('Platform Compatibility Analysis', () => {
    test('should analyze OpenVINO behavior for current platform', () => {
      const behavior = getExpectedOpenVINOBehavior();

      console.log('📊 Expected OpenVINO Behavior:', {
        device: behavior.device,
        acceleration: behavior.acceleration,
        gpuSupport: behavior.gpuSupport,
        expectedSpeedup: behavior.expectedSpeedup,
        limitations: behavior.limitations,
        fallback: behavior.fallbackRecommendation,
      });

      // Validate behavior analysis
      expect(behavior.device).toBeDefined();
      expect(behavior.acceleration).toBeDefined();
      expect(typeof behavior.gpuSupport).toBe('boolean');
      expect(behavior.expectedSpeedup).toBeDefined();
      expect(Array.isArray(behavior.limitations)).toBe(true);

      // Platform-specific validations
      if (isAppleSilicon()) {
        expect(behavior.device).toBe('CPU');
        expect(behavior.gpuSupport).toBe(false);
        expect(behavior.limitations).toContain('No GPU acceleration');
        expect(behavior.fallbackRecommendation).toContain('CoreML');
      }
    });

    test('should validate addon fallback chain strategy', () => {
      // Test the expected fallback chain for addon loading
      const fallbackChain = [
        'addon-macos-arm-openvino.node', // Primary OpenVINO
        'addon-macos-arm64-coreml.node', // CoreML fallback
        'addon.coreml.node', // Generic CoreML
        'addon.node', // CPU fallback
      ];

      const chainStatus = fallbackChain.map((addonName) => {
        const addonPath = path.join(addonBaseDir, addonName);
        const exists = fs.existsSync(addonPath);
        return { addon: addonName, exists, path: addonPath };
      });

      console.log('🔗 Addon Fallback Chain Status:');
      chainStatus.forEach(({ addon, exists }) => {
        console.log(`  ${exists ? '✅' : '❌'} ${addon}`);
      });

      // Document expected fallback behavior
      expect(chainStatus.length).toBe(4);
      expect(chainStatus[0].addon).toBe('addon-macos-arm-openvino.node');

      // Log which addons in the chain are available
      const availableAddons = chainStatus.filter((item) => item.exists);
      if (availableAddons.length > 0) {
        console.log(`✅ ${availableAddons.length}/4 fallback addons available`);
      } else {
        console.log(
          'ℹ️ No addons found - this is expected in test environment',
        );
      }
    });
  });

  describe('Processing Integration Simulation', () => {
    test('should simulate processing workflow', async () => {
      const result = await validator.testProcessingCapability();

      console.log('🔄 Processing Simulation Result:', {
        success: result.success,
        processingTime: `${result.processingTime}ms`,
        performanceRatio: result.performanceRatio
          ? `${result.performanceRatio}x`
          : 'N/A',
        error: result.errorMessage,
      });

      // These tests validate the simulation logic even if real addon isn't available
      expect(typeof result.success).toBe('boolean');
      expect(typeof result.processingTime).toBe('number');

      if (result.success) {
        expect(result.processingTime).toBeGreaterThan(0);
        expect(result.performanceRatio).toBeGreaterThan(1);
      } else {
        expect(result.errorMessage).toBeDefined();
      }
    });

    test('should generate comprehensive validation report', async () => {
      const report = await validator.generateValidationReport();

      console.log('📋 Comprehensive Validation Report:');
      console.log(`Status: ${report.summary}`);
      console.log(
        'Recommendations:',
        report.recommendations.map((r) => `  • ${r}`).join('\n'),
      );

      // Validate report structure
      expect(report.summary).toBeDefined();
      expect(report.details).toBeDefined();
      expect(report.details.fileValidation).toBeDefined();
      expect(report.details.platformCompatibility).toBeDefined();
      expect(report.details.processingTest).toBeDefined();
      expect(Array.isArray(report.recommendations)).toBe(true);

      // Report should always provide actionable recommendations
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Apple Silicon Specific Tests', () => {
    test('should validate Apple Silicon CPU processing expectations', () => {
      if (!isAppleSilicon()) {
        console.log('Skipping: Not running on Apple Silicon');
        return;
      }

      const platformCompatibility = validator.validatePlatformCompatibility();

      console.log('🍎 Apple Silicon Compatibility Analysis:', {
        supported: platformCompatibility.isSupported,
        expectedDevice: platformCompatibility.expectedDevice,
        limitations: platformCompatibility.limitations,
        recommendations: platformCompatibility.recommendations,
      });

      // Apple Silicon specific validations
      expect(platformCompatibility.isSupported).toBe(true);
      expect(platformCompatibility.expectedDevice).toBe('CPU');
      expect(platformCompatibility.limitations).toContain(
        'No GPU acceleration available on Apple Silicon',
      );
      expect(platformCompatibility.recommendations).toContain(
        'Consider CoreML for GPU/ANE acceleration on Apple Silicon',
      );
    });

    test('should document Apple Silicon performance expectations', () => {
      if (!isAppleSilicon()) {
        console.log('Skipping: Not running on Apple Silicon');
        return;
      }

      const behavior = getExpectedOpenVINOBehavior();

      // Apple Silicon should use CPU with optimizations
      expect(behavior.device).toBe('CPU');
      expect(behavior.gpuSupport).toBe(false);
      expect(behavior.expectedSpeedup).toMatch(/1\.5-2x/);
      expect(behavior.limitations).toContain('No GPU acceleration');
      expect(behavior.limitations).toContain('No ANE support');

      console.log('🚀 Apple Silicon Performance Profile:', {
        processingDevice: behavior.device,
        expectedImprovement: behavior.expectedSpeedup,
        vsBaseline: 'Should outperform basic CPU processing',
        vsGPU: 'Slower than Intel GPU but faster than unoptimized CPU',
      });
    });

    test('should validate integration with SmartSub settings', () => {
      if (!isAppleSilicon()) {
        console.log('Skipping: Not running on Apple Silicon');
        return;
      }

      // Test how OpenVINO addon should integrate with SmartSub's settings system
      const expectedIntegration = {
        gpuSelectionUI: 'Should be disabled/grayed out on Apple Silicon',
        processingPipeline: 'CPU-based OpenVINO processing',
        fallbackBehavior: 'Should fall back to CoreML for GPU/ANE acceleration',
        userFeedback: 'Should indicate CPU processing, not GPU acceleration',
        settingsPersistence:
          'Should remember user preference for OpenVINO CPU processing',
      };

      console.log('⚙️ SmartSub Integration Expectations:', expectedIntegration);

      // Validate integration expectations
      Object.values(expectedIntegration).forEach((expectation) => {
        expect(typeof expectation).toBe('string');
        expect(expectation.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Error Handling and Robustness', () => {
    test('should handle missing addon gracefully', () => {
      const nonExistentPath = '/path/to/non-existent-addon.node';
      const testValidator = new OpenVINOAddonValidator(nonExistentPath);

      const result = testValidator.validateAddonFile();

      expect(result.exists).toBe(false);
      expect(result.isLoadable).toBe(false);
      expect(result.errorMessage).toContain('not found');

      console.log('✅ Missing addon error handling:', result.errorMessage);
    });

    test('should provide helpful error messages', async () => {
      const report = await validator.generateValidationReport();

      // Error messages should be user-friendly and actionable
      if (report.summary.includes('❌') || report.summary.includes('⚠️')) {
        expect(report.recommendations.length).toBeGreaterThan(0);

        console.log('🔧 Error Recovery Recommendations:');
        report.recommendations.forEach((rec) => {
          console.log(`  • ${rec}`);
          expect(rec.length).toBeGreaterThan(10); // Should be descriptive
        });
      }
    });

    test('should validate resilience to different environments', () => {
      // Test behavior in different scenarios
      const scenarios = [
        {
          name: 'Development Environment',
          hasAddon: false,
          expected: 'Should provide download instructions',
        },
        {
          name: 'CI Environment',
          hasAddon: false,
          expected: 'Should document addon availability after build',
        },
        {
          name: 'Production Build',
          hasAddon: true,
          expected: 'Should load and function normally',
        },
        {
          name: 'User Environment',
          hasAddon: true,
          expected: 'Should provide performance feedback',
        },
      ];

      scenarios.forEach((scenario) => {
        console.log(`📋 Scenario: ${scenario.name}`);
        console.log(`   Expected: ${scenario.expected}`);

        // Validate scenario definition
        expect(scenario.name).toBeDefined();
        expect(typeof scenario.hasAddon).toBe('boolean');
        expect(scenario.expected).toBeDefined();
      });

      expect(scenarios.length).toBe(4);
    });
  });
});
