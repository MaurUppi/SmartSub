/**
 * Test suite for CI Workflow OpenVINO Integration
 * Task UE-5: CI Workflow Integration for OpenVINO Addons
 */

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

describe('CI Workflow OpenVINO Integration', () => {
  const workflowPath = path.join(
    __dirname,
    '../../.github/workflows/release.yml',
  );
  let workflowContent: string;
  let workflowData: any;

  beforeAll(() => {
    // Read the workflow file
    workflowContent = fs.readFileSync(workflowPath, 'utf8');
    workflowData = yaml.load(workflowContent) as any;
  });

  describe('Workflow Structure Validation', () => {
    test('should have release workflow defined', () => {
      expect(workflowData).toBeDefined();
      expect(workflowData.name).toBe('Build/release');
    });

    test('should have build_artifacts job', () => {
      expect(workflowData.jobs).toBeDefined();
      expect(workflowData.jobs.build_artifacts).toBeDefined();
    });

    test('should have OpenVINO build matrix entries', () => {
      const matrix = workflowData.jobs.build_artifacts.strategy.matrix;
      expect(matrix).toBeDefined();
      expect(matrix.include).toBeDefined();

      // Find OpenVINO builds
      const openvinoBuilds = matrix.include.filter(
        (entry: any) => entry.build_type === 'openvino',
      );

      expect(openvinoBuilds.length).toBeGreaterThan(0);
      expect(
        openvinoBuilds.some((build: any) => build.os === 'windows-2022'),
      ).toBe(true);
      expect(
        openvinoBuilds.some((build: any) => build.os === 'ubuntu-latest'),
      ).toBe(true);
      expect(openvinoBuilds.some((build: any) => build.os === 'macos-15')).toBe(
        true,
      );
      expect(openvinoBuilds.some((build: any) => build.os === 'macos-13')).toBe(
        true,
      );
    });
  });

  describe('OpenVINO Addon Download Step', () => {
    test('should have OpenVINO addon download step', () => {
      const downloadStep = workflowContent.includes(
        'Download OpenVINO addons from fork',
      );
      expect(downloadStep).toBe(true);
    });

    test('should use default tag detection logic', () => {
      // Check for default tag detection
      expect(workflowContent).toContain(
        'DEFAULT_TAG=$(curl -s https://api.github.com/repos/MaurUppi/whisper.cpp-openvino/releases',
      );
      expect(workflowContent).toContain('startswith("default-v")');
      expect(workflowContent).toContain('head -1');
    });

    test('should have fallback to latest tag', () => {
      expect(workflowContent).toContain(
        'No default tag found, falling back to latest release',
      );
      expect(workflowContent).toContain('DEFAULT_TAG="latest"');
    });

    test('should download from correct repository', () => {
      expect(workflowContent).toContain(
        'https://github.com/MaurUppi/whisper.cpp-openvino',
      );
    });

    test('should have download verification', () => {
      expect(workflowContent).toContain('Verify download succeeded');
      expect(workflowContent).toContain('Failed to download');
      expect(workflowContent).toContain('exit 1');
    });

    test('should have download success confirmation', () => {
      expect(workflowContent).toContain('Successfully downloaded');
      expect(workflowContent).toContain('wc -c');
    });
  });

  describe('OpenVINO Addon Preparation Steps', () => {
    test('should have macOS OpenVINO preparation step', () => {
      expect(workflowContent).toContain('Prepare macOS OpenVINO addon');
      expect(workflowContent).toContain('addon-macos-arm-openvino.node');
      expect(workflowContent).toContain('addon-macos-x86-openvino.node');
    });

    test('should have Windows OpenVINO preparation step', () => {
      expect(workflowContent).toContain('Prepare Windows OpenVINO addon');
      expect(workflowContent).toContain('addon-windows-openvino.node');
    });

    test('should have Linux OpenVINO preparation step', () => {
      expect(workflowContent).toContain('Prepare Linux OpenVINO addon');
      expect(workflowContent).toContain('addon-linux-openvino.node');
    });

    test('should create fallback chain for all platforms', () => {
      // Check that addons are copied to both generic and specific names
      expect(workflowContent).toContain('extraResources/addons/addon.node');
      expect(workflowContent).toContain(
        'extraResources/addons/${{ matrix.addon_name }}',
      );
    });

    test('should have debug output for addon preparation', () => {
      expect(workflowContent).toContain('OpenVINO addon files prepared:');
      expect(workflowContent).toContain('ls -la extraResources/addons/');
    });
  });

  describe('OpenVINO Build Matrix Validation', () => {
    test('should have correct OpenVINO version', () => {
      const matrix = workflowData.jobs.build_artifacts.strategy.matrix;
      const openvinoBuilds = matrix.include.filter(
        (entry: any) => entry.build_type === 'openvino',
      );

      openvinoBuilds.forEach((build: any) => {
        expect(build.openvino_version).toBe('2024.6.0');
      });
    });

    test('should have correct addon names for each platform', () => {
      const matrix = workflowData.jobs.build_artifacts.strategy.matrix;
      const openvinoBuilds = matrix.include.filter(
        (entry: any) => entry.build_type === 'openvino',
      );

      const expectedAddonNames = [
        'addon-windows-openvino.node',
        'addon-linux-openvino.node',
        'addon-linux-openvino-u22.node',
        'addon-macos-arm-openvino.node',
        'addon-macos-x86-openvino.node',
      ];

      const actualAddonNames = openvinoBuilds.map(
        (build: any) => build.addon_name,
      );

      expectedAddonNames.forEach((expectedName) => {
        expect(actualAddonNames).toContain(expectedName);
      });
    });

    test('should have platform-specific artifact suffixes', () => {
      const matrix = workflowData.jobs.build_artifacts.strategy.matrix;
      const openvinoBuilds = matrix.include.filter(
        (entry: any) => entry.build_type === 'openvino',
      );

      openvinoBuilds.forEach((build: any) => {
        expect(build.artifact_suffix).toContain('openvino');
        expect(build.artifact_suffix).toContain('2024-6-0');
      });
    });
  });

  describe('Workflow Integration Completeness', () => {
    test('should run OpenVINO download only for OpenVINO builds', () => {
      expect(workflowContent).toContain("if: matrix.build_type == 'openvino'");
    });

    test('should have conditional preparation steps', () => {
      expect(workflowContent).toContain(
        "matrix.os_build_arg == 'mac' && matrix.build_type == 'openvino'",
      );
      expect(workflowContent).toContain(
        "matrix.os_build_arg == 'win' && matrix.build_type == 'openvino'",
      );
      expect(workflowContent).toContain(
        "matrix.os_build_arg == 'linux' && matrix.build_type == 'openvino'",
      );
    });

    test('should preserve existing non-OpenVINO build functionality', () => {
      expect(workflowContent).toContain('Download addon (Non-OpenVINO builds)');
      expect(workflowContent).toContain("matrix.build_type != 'openvino'");
      expect(workflowContent).toContain(
        'https://github.com/buxuku/whisper.cpp',
      );
    });

    test('should maintain build environment variables', () => {
      expect(workflowContent).toContain('BUILD_PLATFORM');
      expect(workflowContent).toContain('BUILD_ARCH');
      expect(workflowContent).toContain('OPENVINO_VERSION');
      expect(workflowContent).toContain('BUILD_TYPE');
    });
  });

  describe('Error Handling and Robustness', () => {
    test('should have proper error handling for download failures', () => {
      expect(workflowContent).toContain(
        'if [ ! -f "temp-artifacts/${{ matrix.addon_name }}" ]; then',
      );
      expect(workflowContent).toContain('ERROR: Failed to download');
    });

    test('should have informative error messages', () => {
      expect(workflowContent).toContain(
        'ERROR: Failed to download ${{ matrix.addon_name }}',
      );
      expect(workflowContent).toContain(
        'Successfully downloaded ${{ matrix.addon_name }}',
      );
    });

    test('should validate download success', () => {
      expect(workflowContent).toContain(
        'wc -c < temp-artifacts/${{ matrix.addon_name }}',
      );
    });

    test('should have debug output for troubleshooting', () => {
      expect(workflowContent).toContain('Fetching latest default tag');
      expect(workflowContent).toContain('Found default tag: $DEFAULT_TAG');
      expect(workflowContent).toContain(
        'Downloading ${{ matrix.addon_name }} from tag $DEFAULT_TAG',
      );
    });
  });
});
