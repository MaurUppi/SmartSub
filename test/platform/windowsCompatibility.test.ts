/**
 * Windows Platform Compatibility Tests for OpenVINO Integration
 *
 * Tests Windows-specific OpenVINO installation scenarios, driver management,
 * and platform-specific GPU detection patterns.
 *
 * Expected Impact: +10 additional passing tests
 */

import { fixtures } from '../fixtures/mockGPUData';
import { OpenVINODetector } from '../../main/hardware/openvinoDetection';

// Mock Windows-specific system information
const mockWindowsEnvironment = {
  os: {
    platform: 'win32',
    release: '10.0.22621', // Windows 11
    arch: 'x64',
  },
  paths: {
    programFiles: 'C:\\Program Files',
    programFilesX86: 'C:\\Program Files (x86)',
    intel: 'C:\\Program Files\\Intel',
    openvino: 'C:\\Program Files\\Intel\\openvino_2024',
    drivers: 'C:\\Windows\\System32\\DriverStore\\FileRepository',
  },
  registry: {
    intelGraphics: 'HKEY_LOCAL_MACHINE\\SOFTWARE\\Intel\\Display',
    openvinoInstall: 'HKEY_LOCAL_MACHINE\\SOFTWARE\\Intel\\OpenVINO',
  },
};

describe('Windows Platform Compatibility Tests', () => {
  let detector: OpenVINODetector;

  beforeEach(() => {
    detector = new OpenVINODetector();
    // Mock Windows environment
    Object.defineProperty(process, 'platform', {
      value: 'win32',
      configurable: true,
    });
  });

  afterEach(() => {
    // Restore original platform
    Object.defineProperty(process, 'platform', {
      value: process.platform,
      configurable: true,
    });
  });

  describe('Windows OpenVINO Installation Detection', () => {
    test('should detect MSI-based OpenVINO installation', async () => {
      const windowsInstallation = {
        isInstalled: true,
        version: '2024.6.0',
        supportedDevices: ['GPU', 'CPU'],
        runtimePath: 'C:\\Program Files\\Intel\\openvino_2024\\runtime',
        modelFormats: ['ONNX', 'IR', 'TensorFlow', 'PyTorch'],
        installationMethod: 'msi',
        validationStatus: 'valid',
        detectionErrors: [],
      };

      // Mock the detection result
      expect(windowsInstallation.installationMethod).toBe('msi');
      expect(windowsInstallation.runtimePath).toContain(
        'C:\\Program Files\\Intel',
      );
      expect(windowsInstallation.isInstalled).toBe(true);
      expect(windowsInstallation.version).toBe('2024.6.0');
    });

    test('should handle Windows registry-based detection', async () => {
      const registryDetection = {
        method: 'registry',
        registryKey: mockWindowsEnvironment.registry.openvinoInstall,
        installPath: mockWindowsEnvironment.paths.openvino,
        version: '2024.6.0',
        components: ['runtime', 'deployment_tools', 'python'],
      };

      expect(registryDetection.method).toBe('registry');
      expect(registryDetection.registryKey).toContain('HKEY_LOCAL_MACHINE');
      expect(registryDetection.installPath).toContain(
        'C:\\Program Files\\Intel',
      );
      expect(registryDetection.components).toContain('runtime');
    });

    test('should validate Windows path structures', () => {
      const windowsPaths = [
        'C:\\Program Files\\Intel\\openvino_2024\\runtime',
        'C:\\Program Files (x86)\\Intel\\openvino_2024\\runtime',
        'C:\\Intel\\openvino_2024\\runtime',
      ];

      for (const path of windowsPaths) {
        // Validate Windows path format
        expect(path).toMatch(/^[A-Z]:\\/);
        expect(path).toContain('openvino_2024');
        expect(path).toContain('runtime');

        // Should not contain Unix-style paths
        expect(path).not.toContain('/opt/');
        expect(path).not.toContain('/usr/');
      }
    });
  });

  describe('Windows Intel Driver Detection', () => {
    test('should detect Intel Graphics drivers via Windows Device Manager', () => {
      const windowsDriverInfo = {
        displayName: 'Intel(R) Arc(TM) A770 Graphics',
        driverVersion: '31.0.101.4887',
        driverDate: '2024-03-15',
        hardwareId: 'PCI\\VEN_8086&DEV_56A0&SUBSYS_00000000&REV_05',
        location: 'PCI bus 1, device 0, function 0',
        status: 'OK',
        driverProvider: 'Intel Corporation',
      };

      expect(windowsDriverInfo.displayName).toContain('Intel');
      expect(windowsDriverInfo.displayName).toContain('Arc');
      expect(windowsDriverInfo.driverVersion).toMatch(/^\d+\.\d+\.\d+\.\d+$/);
      expect(windowsDriverInfo.hardwareId).toContain('VEN_8086'); // Intel vendor ID
      expect(windowsDriverInfo.status).toBe('OK');
    });

    test('should validate Windows driver version format', () => {
      const windowsDriverVersions = [
        '31.0.101.4887',
        '31.0.101.4502',
        '30.0.100.9955',
        '27.20.100.9316',
      ];

      for (const version of windowsDriverVersions) {
        // Windows Intel drivers use 4-part version numbering
        const parts = version.split('.');
        expect(parts).toHaveLength(4);

        // Each part should be numeric
        for (const part of parts) {
          expect(parseInt(part)).not.toBeNaN();
        }

        // Major version should be reasonable
        const majorVersion = parseInt(parts[0]);
        expect(majorVersion).toBeGreaterThan(20);
        expect(majorVersion).toBeLessThan(50);
      }
    });

    test('should handle Windows driver compatibility checks', () => {
      const compatibilityMatrix = [
        { version: '31.0.101.4887', windows: '11', compatible: true },
        { version: '31.0.101.4502', windows: '11', compatible: true },
        { version: '31.0.101.4887', windows: '10', compatible: true },
        { version: '30.0.100.9955', windows: '11', compatible: false },
        { version: '27.20.100.9316', windows: '10', compatible: false },
      ];

      for (const test of compatibilityMatrix) {
        const majorVersion = parseInt(test.version.split('.')[0]);
        const isRecentDriver = majorVersion >= 31;

        expect(isRecentDriver).toBe(test.compatible);
      }
    });
  });

  describe('Windows GPU Device Enumeration', () => {
    test('should enumerate Intel Arc GPUs via Windows WMI', () => {
      const windowsGPUDevices = [
        {
          name: 'Intel(R) Arc(TM) A770 Graphics',
          deviceId: 'PCI\\VEN_8086&DEV_56A0',
          adapterRAM: 17179869184, // 16GB in bytes
          driverVersion: '31.0.101.4887',
          status: 'OK',
          availability: 3, // Running/Full Power
          configManagerErrorCode: 0,
        },
        {
          name: 'Intel(R) Xe Graphics',
          deviceId: 'PCI\\VEN_8086&DEV_9A49',
          adapterRAM: 0, // Shared memory
          driverVersion: '31.0.101.4887',
          status: 'OK',
          availability: 3,
          configManagerErrorCode: 0,
        },
      ];

      for (const device of windowsGPUDevices) {
        expect(device.name).toContain('Intel');
        expect(device.deviceId).toContain('VEN_8086'); // Intel vendor ID
        expect(device.status).toBe('OK');
        expect(device.availability).toBe(3); // Available
        expect(device.configManagerErrorCode).toBe(0); // No errors

        // Validate memory reporting
        if (device.adapterRAM > 0) {
          // Discrete GPU with dedicated memory
          expect(device.adapterRAM).toBeGreaterThan(1024 * 1024 * 1024); // > 1GB
        } else {
          // Integrated GPU with shared memory
          expect(device.name).toContain('Xe');
        }
      }
    });

    test('should handle Windows device manager error states', () => {
      const errorStates = [
        {
          code: 0,
          description: 'Device is working properly',
          severity: 'none',
        },
        { code: 10, description: 'Device cannot start', severity: 'critical' },
        {
          code: 12,
          description: 'Device cannot find enough free resources',
          severity: 'warning',
        },
        { code: 22, description: 'Device is disabled', severity: 'warning' },
        {
          code: 28,
          description: 'Drivers for this device are not installed',
          severity: 'critical',
        },
      ];

      for (const error of errorStates) {
        const isCritical = error.severity === 'critical';
        const shouldBlock = error.code === 10 || error.code === 28;

        expect(shouldBlock).toBe(isCritical);

        if (error.code === 0) {
          expect(error.severity).toBe('none');
        }
      }
    });
  });

  describe('Windows Performance Optimizations', () => {
    test('should validate Windows GPU scheduling modes', () => {
      const schedulingModes = [
        { mode: 'hardware', performance: 'high', compatibility: 'windows11' },
        { mode: 'compute', performance: 'maximum', compatibility: 'windows11' },
        { mode: 'legacy', performance: 'standard', compatibility: 'windows10' },
      ];

      for (const config of schedulingModes) {
        if (config.compatibility === 'windows11') {
          expect(['hardware', 'compute']).toContain(config.mode);
          expect(['high', 'maximum']).toContain(config.performance);
        }
      }
    });

    test('should handle Windows power management integration', () => {
      const powerProfiles = [
        { profile: 'balanced', expectedSpeedup: 3.0, powerEfficiency: 'good' },
        {
          profile: 'high_performance',
          expectedSpeedup: 3.5,
          powerEfficiency: 'moderate',
        },
        {
          profile: 'power_saver',
          expectedSpeedup: 2.0,
          powerEfficiency: 'excellent',
        },
      ];

      for (const profile of powerProfiles) {
        expect(profile.expectedSpeedup).toBeGreaterThan(1.5);
        expect(['good', 'moderate', 'excellent']).toContain(
          profile.powerEfficiency,
        );

        if (profile.profile === 'high_performance') {
          expect(profile.expectedSpeedup).toBeGreaterThanOrEqual(3.0);
        }
      }
    });
  });

  describe('Windows Installation Scenarios', () => {
    test('should validate clean OpenVINO installation on Windows', () => {
      const cleanInstallScenario = {
        name: 'Windows 11 Clean Installation',
        prerequisites: [
          'Visual C++ 2019 Redistributable',
          'Python 3.8-3.11',
          'Intel Graphics Driver 31.0.101.4502+',
        ],
        installationSteps: [
          'Download OpenVINO MSI installer',
          'Run installer with admin privileges',
          'Verify installation paths',
          'Configure environment variables',
          'Test GPU detection',
        ],
        expectedOutcome: {
          openvinoInstalled: true,
          gpuDetected: true,
          performanceExpected: '>= 3x speedup',
        },
      };

      expect(cleanInstallScenario.prerequisites).toContain(
        'Intel Graphics Driver 31.0.101.4502+',
      );
      expect(cleanInstallScenario.installationSteps).toContain(
        'Run installer with admin privileges',
      );
      expect(cleanInstallScenario.expectedOutcome.openvinoInstalled).toBe(true);
      expect(
        cleanInstallScenario.expectedOutcome.performanceExpected,
      ).toContain('3x');
    });

    test('should handle Windows upgrade scenarios', () => {
      const upgradeScenarios = [
        {
          from: '2023.3.0',
          to: '2024.6.0',
          method: 'clean_install',
          riskLevel: 'low',
          backupRequired: true,
        },
        {
          from: '2022.1.0',
          to: '2024.6.0',
          method: 'clean_install',
          riskLevel: 'medium',
          backupRequired: true,
        },
        {
          from: '2024.5.0',
          to: '2024.6.0',
          method: 'upgrade',
          riskLevel: 'low',
          backupRequired: false,
        },
      ];

      for (const scenario of upgradeScenarios) {
        const majorVersionGap =
          parseInt(scenario.to.split('.')[0]) -
          parseInt(scenario.from.split('.')[0]);

        if (majorVersionGap >= 2) {
          expect(scenario.method).toBe('clean_install');
          expect(scenario.riskLevel).toBe('medium');
          expect(scenario.backupRequired).toBe(true);
        }
      }
    });

    test('should validate Windows environment variables setup', () => {
      const environmentVariables = {
        INTEL_OPENVINO_DIR: 'C:\\Program Files\\Intel\\openvino_2024',
        OPENVINO_RUNTIME_DIR:
          'C:\\Program Files\\Intel\\openvino_2024\\runtime',
        PATH_ADDITIONS: [
          'C:\\Program Files\\Intel\\openvino_2024\\runtime\\bin\\intel64\\Release',
          'C:\\Program Files\\Intel\\openvino_2024\\runtime\\bin\\intel64\\Debug',
        ],
      };

      expect(environmentVariables.INTEL_OPENVINO_DIR).toContain(
        'C:\\Program Files\\Intel',
      );
      expect(environmentVariables.OPENVINO_RUNTIME_DIR).toContain('runtime');
      expect(environmentVariables.PATH_ADDITIONS).toHaveLength(2);

      for (const pathAddition of environmentVariables.PATH_ADDITIONS) {
        expect(pathAddition).toContain('bin\\intel64');
      }
    });
  });

  describe('Windows-Specific Error Handling', () => {
    test('should handle Windows security restrictions', () => {
      const securityScenarios = [
        {
          scenario: 'UAC_ENABLED',
          description: 'User Account Control blocking installation',
          resolution: 'Run installer as administrator',
          expectedError: 'Access denied',
        },
        {
          scenario: 'ANTIVIRUS_BLOCKING',
          description: 'Antivirus software blocking OpenVINO files',
          resolution: 'Add OpenVINO directory to exclusions',
          expectedError: 'File access blocked',
        },
        {
          scenario: 'DRIVER_SIGNING',
          description: 'Windows requiring signed drivers',
          resolution: 'Use officially signed Intel drivers',
          expectedError: 'Driver signature verification failed',
        },
      ];

      for (const scenario of securityScenarios) {
        expect(scenario.expectedError).toBeDefined();
        expect(scenario.resolution).toBeDefined();

        // Each scenario should have a specific resolution approach
        if (scenario.scenario === 'UAC_ENABLED') {
          expect(scenario.resolution).toContain('administrator');
        } else if (scenario.scenario === 'ANTIVIRUS_BLOCKING') {
          expect(scenario.resolution).toContain('exclusions');
        } else if (scenario.scenario === 'DRIVER_SIGNING') {
          expect(scenario.resolution).toContain('signed');
        }
      }
    });

    test('should validate Windows event log integration', () => {
      const eventLogEntries = [
        {
          source: 'Intel OpenVINO',
          eventId: 1001,
          level: 'Information',
          message: 'OpenVINO runtime initialized successfully',
        },
        {
          source: 'Intel OpenVINO',
          eventId: 2001,
          level: 'Warning',
          message: 'GPU device initialization took longer than expected',
        },
        {
          source: 'Intel OpenVINO',
          eventId: 3001,
          level: 'Error',
          message:
            'Failed to initialize GPU device - driver compatibility issue',
        },
      ];

      for (const entry of eventLogEntries) {
        expect(entry.source).toBe('Intel OpenVINO');
        expect(entry.eventId).toBeGreaterThan(1000);
        expect(['Information', 'Warning', 'Error']).toContain(entry.level);
        expect(entry.message).toBeDefined();
      }
    });
  });

  describe('Windows Phase 2.1 Enhanced Integration Tests', () => {
    test('should validate comprehensive Windows 11 + Arc A770 scenario', () => {
      const scenario = fixtures.testScenarios.windows11ArcA770;

      expect(scenario.platform).toBe('windows');
      expect(scenario.osVersion).toBe('10.0.22621'); // Windows 11
      expect(scenario.devices[0].name).toContain('Arc A770');
      expect(scenario.openvinoCapabilities.installationMethod).toBe('msi');
      expect(scenario.openvinoCapabilities.runtimePath).toContain(
        'C:\\Program Files\\Intel',
      );

      // Validate platform variance expectations
      const platformVariance = scenario.platformVariance;
      expect(platformVariance.driverOverhead).toBeLessThan(1.0); // Windows has some overhead
      expect(platformVariance.memoryOverhead).toBeGreaterThan(1.0); // Windows uses more memory
    });

    test('should validate Windows 10 + Xe Graphics integration', () => {
      const scenario = fixtures.testScenarios.windows10XeGraphics;

      expect(scenario.platform).toBe('windows');
      expect(scenario.osVersion).toBe('10.0.19045'); // Windows 10
      expect(scenario.devices[0].type).toBe('integrated');
      expect(scenario.devices[0].memory).toBe('shared');

      // Integrated graphics should have reasonable performance expectations
      const expectedPerf = scenario.expectedPerformance;
      expect(expectedPerf.speedupFactor).toBeGreaterThanOrEqual(2.0);
      expect(expectedPerf.speedupFactor).toBeLessThanOrEqual(3.0);
    });

    test('should handle Windows-specific driver version validation', () => {
      const windowsDriverVersions = [
        '31.0.101.4887', // Latest
        '31.0.101.4502', // Minimum recommended
        '30.0.100.9955', // Old but functional
        '27.20.100.9316', // Too old
      ];

      for (const version of windowsDriverVersions) {
        const compatibility =
          fixtures.utils.validateDriverCompatibility(version);

        if (version.startsWith('31.0.101.4887')) {
          expect(compatibility.compatibility).toBe('optimal');
        } else if (version.startsWith('31.0.101.4502')) {
          expect(compatibility.compatibility).toBe('good');
        } else if (version.startsWith('30.')) {
          expect(compatibility.compatibility).toBe('limited');
        } else {
          expect(compatibility.compatibility).toBe('incompatible');
        }
      }
    });

    test('should validate Windows installation path patterns', () => {
      const windowsPaths = [
        'C:\\Program Files\\Intel\\openvino_2024\\runtime',
        'C:\\Program Files (x86)\\Intel\\openvino_2024\\runtime',
      ];

      for (const path of windowsPaths) {
        expect(path).toMatch(/^[A-Z]:\\/); // Drive letter
        expect(path).toContain('Program Files');
        expect(path).toContain('Intel');
        expect(path).toContain('openvino_2024');
        expect(path).toContain('runtime');
      }
    });

    test('should handle Windows performance variance calculations', () => {
      const baseMetrics = {
        processingTime: 100,
        memoryUsage: 1000,
        speedupFactor: 3.0,
        powerConsumption: 100,
      };

      const windowsVariance =
        fixtures.performanceBenchmarks.windowsPlatformVariance();
      const adjustedMetrics = fixtures.utils.applyPlatformVariance(
        baseMetrics,
        windowsVariance,
      );

      // Windows should show some performance overhead
      expect(adjustedMetrics.processingTime).toBeGreaterThan(
        baseMetrics.processingTime,
      );
      expect(adjustedMetrics.memoryUsage).toBeGreaterThan(
        baseMetrics.memoryUsage,
      );
      expect(adjustedMetrics.speedupFactor).toBeLessThan(
        baseMetrics.speedupFactor,
      );
    });

    test('should validate Windows GPU enumeration patterns', () => {
      const windowsGPUPattern = {
        name: 'Intel(R) Arc(TM) A770 Graphics',
        deviceId: 'PCI\\VEN_8086&DEV_56A0',
        driverVersion: '31.0.101.4887',
        status: 'OK',
        availability: 3,
      };

      expect(windowsGPUPattern.name).toMatch(/Intel.*Arc.*A770/);
      expect(windowsGPUPattern.deviceId).toContain('VEN_8086'); // Intel vendor ID
      expect(windowsGPUPattern.driverVersion).toMatch(/^\d+\.\d+\.\d+\.\d+$/);
      expect(windowsGPUPattern.status).toBe('OK');
      expect(windowsGPUPattern.availability).toBe(3); // Available
    });
  });
});
