/**
 * Platform Detection Hook
 * Provides cross-platform detection capabilities for the renderer process
 */

import { useState, useEffect, useMemo } from 'react';

export type PlatformType = 'darwin' | 'win32' | 'linux' | 'unknown';

export interface PlatformCapabilities {
  supportsCUDA: boolean;
  supportsOpenVINO: boolean;
  supportsAppleML: boolean;
  platformName: string;
  displayName: string;
}

export interface UsePlatformReturn {
  platform: PlatformType;
  capabilities: PlatformCapabilities;
  isMacOS: boolean;
  isWindows: boolean;
  isLinux: boolean;
  isAppleSilicon: boolean;
}

const getPlatformCapabilities = (
  platform: PlatformType,
): PlatformCapabilities => {
  switch (platform) {
    case 'darwin':
      return {
        supportsCUDA: false, // Apple Silicon and modern Intel Macs don't support CUDA
        supportsOpenVINO: false, // OpenVINO not supported on macOS currently
        supportsAppleML: true,
        platformName: 'macOS',
        displayName: 'Apple macOS',
      };

    case 'win32':
      return {
        supportsCUDA: true,
        supportsOpenVINO: true,
        supportsAppleML: false,
        platformName: 'Windows',
        displayName: 'Microsoft Windows',
      };

    case 'linux':
      return {
        supportsCUDA: true,
        supportsOpenVINO: true,
        supportsAppleML: false,
        platformName: 'Linux',
        displayName: 'Linux',
      };

    default:
      return {
        supportsCUDA: false,
        supportsOpenVINO: false,
        supportsAppleML: false,
        platformName: 'Unknown',
        displayName: 'Unknown Platform',
      };
  }
};

export const usePlatform = (): UsePlatformReturn => {
  const [platform, setPlatform] = useState<PlatformType>('unknown');
  const [isAppleSilicon, setIsAppleSilicon] = useState(false);

  // Detect platform via IPC
  useEffect(() => {
    const detectPlatform = async () => {
      try {
        // Get platform info from main process
        const platformInfo = await window?.ipc?.invoke('getPlatformInfo');

        if (platformInfo && platformInfo.platform) {
          setPlatform(platformInfo.platform as PlatformType);
          setIsAppleSilicon(platformInfo.isAppleSilicon || false);
        } else {
          // Fallback to user agent detection (less reliable)
          const userAgent = navigator.userAgent.toLowerCase();
          if (userAgent.includes('mac')) {
            setPlatform('darwin');
          } else if (userAgent.includes('win')) {
            setPlatform('win32');
          } else if (userAgent.includes('linux')) {
            setPlatform('linux');
          }
        }
      } catch (error) {
        console.warn('Platform detection failed, using fallback:', error);

        // Fallback detection using navigator
        const userAgent = navigator.userAgent.toLowerCase();
        if (userAgent.includes('mac')) {
          setPlatform('darwin');
        } else if (userAgent.includes('win')) {
          setPlatform('win32');
        } else if (userAgent.includes('linux')) {
          setPlatform('linux');
        }
      }
    };

    detectPlatform();
  }, []);

  // Compute platform capabilities
  const capabilities = useMemo(() => {
    return getPlatformCapabilities(platform);
  }, [platform]);

  // Convenience boolean flags
  const isMacOS = platform === 'darwin';
  const isWindows = platform === 'win32';
  const isLinux = platform === 'linux';

  return {
    platform,
    capabilities,
    isMacOS,
    isWindows,
    isLinux,
    isAppleSilicon,
  };
};

export default usePlatform;
