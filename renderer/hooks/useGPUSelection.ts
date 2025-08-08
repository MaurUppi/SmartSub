/**
 * GPU Selection Hook
 * Manages GPU device detection, selection, and pipeline configuration
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { usePlatform } from './usePlatform';
import { useGPUDetection } from './useGPUDetection';

export interface GPUDevice {
  id: string;
  name: string;
  type:
    | 'intel-arc'
    | 'intel-xe'
    | 'intel-integrated'
    | 'nvidia'
    | 'auto'
    | 'cpu';
  vendor: 'intel' | 'nvidia' | 'auto' | 'cpu';
  memory?: number;
  driverVersion?: string;
  available: boolean;
  recommended?: boolean;
}

export interface UseGPUSelectionReturn {
  availableGPUs: GPUDevice[];
  selectedGPU: string;
  isGPUSelectionSupported: boolean;
  isLoading: boolean;
  error: string | null;
  selectGPU: (gpuId: string) => Promise<void>;
  refreshGPUList: () => Promise<void>;
  getGPUDisplayName: (gpuId: string) => string;
  isGPURecommended: (gpuId: string) => boolean;
}

const DEFAULT_GPU_OPTIONS: GPUDevice[] = [
  {
    id: 'auto',
    name: 'Auto-detect (Recommended)',
    type: 'auto',
    vendor: 'auto',
    available: true,
    recommended: true,
  },
  {
    id: 'cpu',
    name: 'CPU Only',
    type: 'cpu',
    vendor: 'cpu',
    available: true,
    recommended: false,
  },
];

export const useGPUSelection = (): UseGPUSelectionReturn => {
  const { capabilities, isMacOS, isWindows, platform } = usePlatform();
  const {
    gpus,
    isDetecting: gpuDetectionLoading,
    error: gpuDetectionError,
    hasOpenVINOSupport,
  } = useGPUDetection();

  const [selectedGPU, setSelectedGPU] = useState<string>('auto');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Determine if GPU selection is supported on this platform
  const isGPUSelectionSupported = useMemo(() => {
    return (
      isWindows && (capabilities.supportsCUDA || capabilities.supportsOpenVINO)
    );
  }, [isWindows, capabilities]);

  // Build available GPU list based on detection and platform
  const availableGPUs = useMemo(() => {
    const devices: GPUDevice[] = [...DEFAULT_GPU_OPTIONS];

    // Only add detected GPUs on supported platforms
    if (isGPUSelectionSupported && gpus && gpus.length > 0) {
      // Convert GPUOptions to GPUDevices, filtering out the defaults we already have
      const detectedGPUs = gpus.filter(
        (gpu) => gpu.id !== 'auto' && gpu.id !== 'cpu',
      );

      detectedGPUs.forEach((gpu) => {
        let vendor: 'intel' | 'nvidia' | 'auto' | 'cpu' = 'intel';
        let recommended = false;

        // Determine vendor and recommendation based on GPU type and name
        if (gpu.type === 'nvidia') {
          vendor = 'nvidia';
          recommended = false; // NVIDIA is for CUDA, not primary for OpenVINO
        } else if (
          gpu.type === 'intel-discrete' ||
          gpu.displayName.toLowerCase().includes('arc')
        ) {
          vendor = 'intel';
          recommended = true; // Intel Arc is recommended for OpenVINO
        } else if (gpu.type === 'intel-integrated') {
          vendor = 'intel';
          recommended = false;
        }

        devices.push({
          id: gpu.id,
          name: gpu.displayName,
          type: gpu.type as any,
          vendor,
          memory: typeof gpu.memory === 'number' ? gpu.memory : undefined,
          driverVersion: gpu.driverVersion,
          available: gpu.status === 'available',
          recommended,
        });
      });
    }

    return devices;
  }, [isGPUSelectionSupported, gpus]);

  // Load saved GPU selection from settings
  useEffect(() => {
    const loadSelectedGPU = async () => {
      try {
        setIsLoading(true);
        const settings = await window?.ipc?.invoke('getSettings');
        const savedGPU = settings?.selectedGPU || 'auto';

        // Validate that saved GPU is still available
        const isValidSelection = availableGPUs.some(
          (gpu) => gpu.id === savedGPU,
        );
        if (isValidSelection) {
          setSelectedGPU(savedGPU);
        } else {
          // Fallback to auto if saved GPU is no longer available
          setSelectedGPU('auto');
          await window?.ipc?.invoke('setSettings', { selectedGPU: 'auto' });
        }
      } catch (err) {
        console.error('Failed to load GPU selection:', err);
        setError('Failed to load GPU preferences');
      } finally {
        setIsLoading(false);
      }
    };

    if (platform !== 'unknown' && !gpuDetectionLoading) {
      loadSelectedGPU();
    }
  }, [platform, gpuDetectionLoading, availableGPUs]);

  // Select a GPU and save preference
  const selectGPU = useCallback(
    async (gpuId: string) => {
      try {
        const selectedDevice = availableGPUs.find((gpu) => gpu.id === gpuId);

        if (!selectedDevice) {
          throw new Error(`GPU device "${gpuId}" not found`);
        }

        if (!selectedDevice.available) {
          throw new Error(
            `GPU device "${selectedDevice.name}" is not available`,
          );
        }

        // Save selection to settings
        await window?.ipc?.invoke('setSettings', { selectedGPU: gpuId });
        setSelectedGPU(gpuId);

        // Trigger GPU configuration update
        await window?.ipc?.invoke('configureGPUPipeline', {
          gpuId: gpuId,
          gpuType: selectedDevice.type,
          vendor: selectedDevice.vendor,
        });

        setError(null);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to select GPU';
        setError(errorMessage);
        throw err;
      }
    },
    [availableGPUs],
  );

  // Refresh GPU list by re-running detection
  const refreshGPUList = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Trigger GPU re-detection
      await window?.ipc?.invoke('refreshGPUDetection');

      // The useGPUDetection hook will automatically update
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to refresh GPU list';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get display name for GPU
  const getGPUDisplayName = useCallback(
    (gpuId: string): string => {
      const gpu = availableGPUs.find((g) => g.id === gpuId);
      return gpu ? gpu.name : gpuId;
    },
    [availableGPUs],
  );

  // Check if GPU is recommended
  const isGPURecommended = useCallback(
    (gpuId: string): boolean => {
      const gpu = availableGPUs.find((g) => g.id === gpuId);
      return gpu?.recommended || false;
    },
    [availableGPUs],
  );

  return {
    availableGPUs,
    selectedGPU,
    isGPUSelectionSupported,
    isLoading: isLoading || gpuDetectionLoading,
    error: error || gpuDetectionError,
    selectGPU,
    refreshGPUList,
    getGPUDisplayName,
    isGPURecommended,
  };
};

export default useGPUSelection;
