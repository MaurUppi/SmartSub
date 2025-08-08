/**
 * OpenVINO Detection and Validation System
 *
 * This module provides comprehensive OpenVINO toolkit detection:
 * - Version identification and validation
 * - Runtime path detection
 * - Supported device enumeration
 * - Model format compatibility checking
 * - Installation method detection
 */

import { exec, spawn } from 'child_process';
import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { platform } from 'os';
import { promisify } from 'util';

import { OpenVINOInfo, DetectionResult } from '../../types/gpu';
import { logMessage as logger } from '../helpers/logger';

const execAsync = promisify(exec);

export class OpenVINODetector {
  private readonly timeoutMs = 10000;
  private readonly minRequiredVersion = '2024.6.0';

  /**
   * Main OpenVINO detection method
   */
  public async detectOpenVINO(): Promise<DetectionResult<OpenVINOInfo>> {
    const startTime = Date.now();

    try {
      logger('Starting OpenVINO detection...');

      // Try multiple detection methods
      const detectionMethods = [
        () => this.detectViaPython(),
        () => this.detectViaCommandLine(),
        () => this.detectViaEnvironmentPath(),
        () => this.detectViaCommonPaths(),
      ];

      for (const method of detectionMethods) {
        try {
          const result = await method();
          if (result) {
            const detectionTime = Date.now() - startTime;
            logger(`OpenVINO detected successfully in ${detectionTime}ms`);

            return {
              success: true,
              data: result,
              timestamp: new Date(),
              detectionTimeMs: detectionTime,
            };
          }
        } catch (error) {
          logger(`OpenVINO detection method failed: ${error}`);
          continue;
        }
      }

      // No detection method succeeded
      return {
        success: false,
        data: null,
        error: 'OpenVINO not found using any detection method',
        timestamp: new Date(),
        detectionTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      const errorMsg = `OpenVINO detection failed: ${error}`;
      logger(errorMsg);

      return {
        success: false,
        data: null,
        error: errorMsg,
        timestamp: new Date(),
        detectionTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Detect OpenVINO via Python package
   */
  private async detectViaPython(): Promise<OpenVINOInfo | null> {
    try {
      const pythonScript = `
import sys
try:
    import openvino as ov
    print(f"VERSION:{ov.__version__}")
    
    # Try to get runtime info
    core = ov.Core()
    devices = core.available_devices
    print(f"DEVICES:{','.join(devices)}")
    
    # Check for Intel GPU devices
    intel_devices = [d for d in devices if 'GPU' in d or 'INTEL' in d.upper()]
    print(f"INTEL_DEVICES:{','.join(intel_devices)}")
    
    # Get model formats (basic check)
    print("FORMATS:ONNX,IR,TensorFlow,PyTorch")
    
    print("SUCCESS:Python detection successful")
except ImportError as e:
    print(f"ERROR:OpenVINO not installed - {e}")
    sys.exit(1)
except Exception as e:
    print(f"ERROR:Detection failed - {e}")
    sys.exit(1)
      `;

      const { stdout } = await execAsync(
        `python -c "${pythonScript.replace(/\n/g, '; ')}"`,
        { timeout: this.timeoutMs },
      );

      return this.parseScriptOutput(stdout, 'package');
    } catch (error) {
      logger(`Python-based OpenVINO detection failed: ${error}`);
      return null;
    }
  }

  /**
   * Detect OpenVINO via command line tools
   */
  private async detectViaCommandLine(): Promise<OpenVINOInfo | null> {
    try {
      // Try common OpenVINO CLI tools
      const commands = [
        'benchmark_app --help',
        'mo --help',
        'openvino-dev --help',
      ];

      for (const command of commands) {
        try {
          const { stdout, stderr } = await execAsync(command, {
            timeout: 5000,
          });

          if (stdout.includes('OpenVINO') || stderr.includes('OpenVINO')) {
            // Extract version from help output
            const versionMatch = (stdout + stderr).match(/(\d+\.\d+\.\d+)/);
            const version = versionMatch ? versionMatch[1] : 'unknown';

            return {
              isInstalled: true,
              version,
              runtimePath: 'detected-via-cli',
              supportedDevices: ['GPU', 'CPU'], // Basic assumption
              modelFormats: ['ONNX', 'IR'],
              validationStatus: this.validateVersion(version)
                ? 'valid'
                : 'invalid',
              installationMethod: 'package',
              detectionErrors: [],
            };
          }
        } catch (error) {
          // Continue to next command
          continue;
        }
      }

      return null;
    } catch (error) {
      logger(`CLI-based OpenVINO detection failed: ${error}`);
      return null;
    }
  }

  /**
   * Detect OpenVINO via environment PATH
   */
  private async detectViaEnvironmentPath(): Promise<OpenVINOInfo | null> {
    try {
      const currentPlatform = platform();
      const pathSeparator = currentPlatform === 'win32' ? ';' : ':';
      const executable = currentPlatform === 'win32' ? '.exe' : '';

      const envPath = process.env.PATH || '';
      const paths = envPath.split(pathSeparator);

      for (const path of paths) {
        if (path.toLowerCase().includes('openvino')) {
          try {
            // Check if this is a valid OpenVINO installation
            const setupEnvScript =
              currentPlatform === 'win32'
                ? join(path, 'setupvars.bat')
                : join(path, 'setupvars.sh');

            const exists = await fs
              .access(setupEnvScript)
              .then(() => true)
              .catch(() => false);

            if (exists) {
              // Found OpenVINO installation
              const version = await this.extractVersionFromPath(path);

              return {
                isInstalled: true,
                version: version || 'unknown',
                runtimePath: path,
                supportedDevices: ['GPU', 'CPU', 'MYRIAD', 'HDDL'],
                modelFormats: ['ONNX', 'IR', 'TensorFlow', 'PyTorch'],
                validationStatus:
                  version && this.validateVersion(version)
                    ? 'valid'
                    : 'unknown',
                installationMethod: 'manual',
                detectionErrors: [],
              };
            }
          } catch (error) {
            continue;
          }
        }
      }

      return null;
    } catch (error) {
      logger(`Environment PATH OpenVINO detection failed: ${error}`);
      return null;
    }
  }

  /**
   * Detect OpenVINO in common installation paths
   */
  private async detectViaCommonPaths(): Promise<OpenVINOInfo | null> {
    try {
      const currentPlatform = platform();

      let commonPaths: string[] = [];

      switch (currentPlatform) {
        case 'win32':
          commonPaths = [
            'C:\\Program Files (x86)\\Intel\\openvino_2024',
            'C:\\Program Files\\Intel\\openvino_2024',
            'C:\\intel\\openvino_2024',
            'C:\\openvino',
          ];
          break;

        case 'linux':
          commonPaths = [
            '/opt/intel/openvino_2024',
            '/usr/local/intel/openvino_2024',
            '/home/intel/openvino_2024',
            process.env.HOME
              ? join(process.env.HOME, 'intel', 'openvino_2024')
              : '',
          ].filter(Boolean);
          break;

        case 'darwin':
          commonPaths = [
            '/opt/intel/openvino_2024',
            '/usr/local/intel/openvino_2024',
            process.env.HOME
              ? join(process.env.HOME, 'intel', 'openvino_2024')
              : '',
          ].filter(Boolean);
          break;
      }

      for (const path of commonPaths) {
        try {
          const exists = await fs
            .access(path)
            .then(() => true)
            .catch(() => false);

          if (exists) {
            const version = await this.extractVersionFromPath(path);

            return {
              isInstalled: true,
              version: version || 'unknown',
              runtimePath: path,
              supportedDevices: ['GPU', 'CPU', 'MYRIAD', 'HDDL'],
              modelFormats: ['ONNX', 'IR', 'TensorFlow', 'PyTorch'],
              validationStatus:
                version && this.validateVersion(version) ? 'valid' : 'unknown',
              installationMethod: 'manual',
              detectionErrors: [],
            };
          }
        } catch (error) {
          continue;
        }
      }

      return null;
    } catch (error) {
      logger(`Common paths OpenVINO detection failed: ${error}`);
      return null;
    }
  }

  /**
   * Parse script output to extract OpenVINO info
   */
  private parseScriptOutput(
    output: string,
    installationMethod: string,
  ): OpenVINOInfo | null {
    try {
      const lines = output.trim().split('\n');
      let version = 'unknown';
      let devices: string[] = [];
      let intelDevices: string[] = [];
      let formats: string[] = [];
      let success = false;

      for (const line of lines) {
        if (line.startsWith('VERSION:')) {
          version = line.substring(8);
        } else if (line.startsWith('DEVICES:')) {
          devices = line.substring(8).split(',').filter(Boolean);
        } else if (line.startsWith('INTEL_DEVICES:')) {
          intelDevices = line.substring(14).split(',').filter(Boolean);
        } else if (line.startsWith('FORMATS:')) {
          formats = line.substring(8).split(',').filter(Boolean);
        } else if (line.startsWith('SUCCESS:')) {
          success = true;
        }
      }

      if (success) {
        return {
          isInstalled: true,
          version,
          runtimePath: 'python-package',
          supportedDevices: devices.length > 0 ? devices : ['GPU', 'CPU'],
          modelFormats: formats.length > 0 ? formats : ['ONNX', 'IR'],
          validationStatus: this.validateVersion(version) ? 'valid' : 'invalid',
          installationMethod,
          detectionErrors: [],
        };
      }

      return null;
    } catch (error) {
      logger(`Failed to parse script output: ${error}`);
      return null;
    }
  }

  /**
   * Extract version from installation path
   */
  private async extractVersionFromPath(path: string): Promise<string | null> {
    try {
      // Try to find version in path name
      const versionMatch = path.match(/(\d+\.\d+\.\d+)/);
      if (versionMatch) {
        return versionMatch[1];
      }

      // Try to read version from version file
      const versionFiles = [
        join(path, 'version.txt'),
        join(path, 'runtime', 'version.txt'),
        join(path, 'VERSION'),
      ];

      for (const versionFile of versionFiles) {
        try {
          const content = await fs.readFile(versionFile, 'utf-8');
          const match = content.match(/(\d+\.\d+\.\d+)/);
          if (match) {
            return match[1];
          }
        } catch (error) {
          continue;
        }
      }

      return null;
    } catch (error) {
      logger(`Version extraction failed: ${error}`);
      return null;
    }
  }

  /**
   * Validate OpenVINO version against minimum requirements
   */
  private validateVersion(version: string): boolean {
    try {
      if (version === 'unknown') return false;

      const versionParts = version.split('.').map(Number);
      const minParts = this.minRequiredVersion.split('.').map(Number);

      for (let i = 0; i < Math.max(versionParts.length, minParts.length); i++) {
        const vPart = versionParts[i] || 0;
        const minPart = minParts[i] || 0;

        if (vPart > minPart) return true;
        if (vPart < minPart) return false;
      }

      return true; // Equal versions are valid
    } catch (error) {
      logger(`Version validation failed: ${error}`);
      return false;
    }
  }
}
