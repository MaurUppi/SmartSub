import { useState, useEffect, useCallback } from 'react';

export interface GPUOption {
  id: string;
  displayName: string;
  type:
    | 'auto'
    | 'nvidia'
    | 'intel-discrete'
    | 'intel-integrated'
    | 'apple'
    | 'amd'
    | 'cpu';
  status: 'available' | 'unavailable' | 'requires-setup' | 'cpu-only';
  performance: 'high' | 'medium' | 'low';
  description: string;
  driverVersion?: string;
  memory?: number | 'shared';
  powerEfficiency: 'excellent' | 'good' | 'moderate';
  estimatedSpeed?: string;
  openvinoCompatible?: boolean;
  cpuOnlyProcessing?: boolean; // NEW: Indicates AMD GPU with CPU-only processing
  fallbackReason?: string; // NEW: Explains why falling back to CPU-only
}

export interface GPUDetectionResult {
  gpus: GPUOption[];
  detectedCount: number;
  preferredGPU: GPUOption | null;
  hasOpenVINOSupport: boolean;
  isDetecting: boolean;
  lastDetection: Date | null;
  error: string | null;
}

export interface UseGPUDetectionOptions {
  autoDetect?: boolean;
  refreshInterval?: number;
  enableCaching?: boolean;
  mockMode?: boolean;
}

export interface UseGPUDetectionReturn extends GPUDetectionResult {
  refreshGPUs: () => Promise<void>;
  selectGPU: (gpuId: string) => void;
  selectedGPU: GPUOption | null;
  clearError: () => void;
  getGPUById: (id: string) => GPUOption | undefined;
  validateGPUSelection: (gpuId: string) => { isValid: boolean; error?: string };
}

// Default GPU options that are always available
const getDefaultGPUOptions = (): GPUOption[] => [
  {
    id: 'auto',
    displayName: 'Auto-detect (Recommended)',
    type: 'auto',
    status: 'available',
    performance: 'high',
    description: 'Automatically select the best available GPU for your system',
    powerEfficiency: 'excellent',
    estimatedSpeed: 'Variable',
    openvinoCompatible: true,
  },
  {
    id: 'cpu',
    displayName: 'CPU Processing',
    type: 'cpu',
    status: 'available',
    performance: 'medium',
    description: 'Use CPU for processing - slower but always available',
    powerEfficiency: 'excellent',
    estimatedSpeed: 'Baseline',
    openvinoCompatible: true,
  },
];

// Mock GPU options for development and testing
const getMockGPUOptions = (): GPUOption[] => [
  {
    id: 'intel-arc-a770',
    displayName: 'Intel Arc A770',
    type: 'intel-discrete',
    status: 'available',
    performance: 'high',
    description:
      'High-performance discrete GPU with excellent OpenVINO support',
    driverVersion: '31.0.101.5381',
    memory: 16384,
    powerEfficiency: 'good',
    estimatedSpeed: '3-4x faster',
    openvinoCompatible: true,
  },
  {
    id: 'intel-xe-graphics',
    displayName: 'Intel Core Ultra Processors with Intel Arc Graphics',
    type: 'intel-integrated',
    status: 'available',
    performance: 'medium',
    description:
      'Integrated GPU with good OpenVINO performance and excellent power efficiency',
    driverVersion: '31.0.101.5381',
    memory: 'shared',
    powerEfficiency: 'excellent',
    estimatedSpeed: '2-3x faster',
    openvinoCompatible: true,
  },
  {
    id: 'nvidia-rtx-4080',
    displayName: 'NVIDIA GeForce RTX 4080',
    type: 'nvidia',
    status: 'available',
    performance: 'high',
    description:
      'High-performance NVIDIA GPU - requires additional setup for OpenVINO',
    driverVersion: '537.13',
    memory: 16384,
    powerEfficiency: 'good',
    estimatedSpeed: '4-5x faster',
    openvinoCompatible: false,
  },
  {
    id: 'intel-arc-a380-setup',
    displayName: 'Intel Arc A380',
    type: 'intel-discrete',
    status: 'requires-setup',
    performance: 'medium',
    description: 'Discrete GPU detected but requires driver setup',
    memory: 6144,
    powerEfficiency: 'good',
    estimatedSpeed: '2-3x faster',
    openvinoCompatible: true,
  },
  {
    id: 'intel-uhd-graphics-unavailable',
    displayName: 'Intel UHD Graphics 630',
    type: 'intel-integrated',
    status: 'unavailable',
    performance: 'low',
    description: 'Older integrated GPU with limited OpenVINO support',
    memory: 'shared',
    powerEfficiency: 'excellent',
    estimatedSpeed: '1.5x faster',
    openvinoCompatible: false,
  },
  // NEW: AMD GPU mock options for development (Requirements #4, #7, #8)
  {
    id: 'amd-rx-7800-xt-mock',
    displayName: 'AMD Radeon RX 7800 XT',
    type: 'amd',
    status: 'cpu-only',
    performance: 'medium',
    description:
      'High-end AMD GPU - uses CPU processing with OpenVINO optimization',
    driverVersion: '24.1.1',
    memory: 16384,
    powerEfficiency: 'good',
    estimatedSpeed: '2x faster (CPU processing)',
    openvinoCompatible: true,
    cpuOnlyProcessing: true,
    fallbackReason:
      'AMD GPUs automatically use optimized CPU processing with OpenVINO acceleration for better compatibility',
  },
];

const STORAGE_KEY = 'gpu-detection-cache';
const SELECTED_GPU_KEY = 'selected-gpu-id';

export const useGPUDetection = (
  options: UseGPUDetectionOptions = {},
): UseGPUDetectionReturn => {
  const {
    autoDetect = true,
    refreshInterval = 0, // 0 means no auto-refresh
    enableCaching = true,
    mockMode = process.env.NODE_ENV === 'development',
  } = options;

  const [gpus, setGpus] = useState<GPUOption[]>([]);
  const [selectedGPU, setSelectedGPU] = useState<GPUOption | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [lastDetection, setLastDetection] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load cached data on mount
  useEffect(() => {
    if (enableCaching) {
      try {
        const cached = localStorage.getItem(STORAGE_KEY);
        const selectedId = localStorage.getItem(SELECTED_GPU_KEY);

        if (cached) {
          const cachedData = JSON.parse(cached);
          if (Array.isArray(cachedData.gpus)) {
            setGpus(cachedData.gpus);
            setLastDetection(
              cachedData.lastDetection
                ? new Date(cachedData.lastDetection)
                : null,
            );

            // Restore selected GPU
            if (selectedId) {
              const selected = cachedData.gpus.find(
                (gpu: GPUOption) => gpu.id === selectedId,
              );
              if (selected) {
                setSelectedGPU(selected);
              }
            }
          }
        }
      } catch (error) {
        console.warn('Failed to load cached GPU data:', error);
      }
    }
  }, [enableCaching]);

  // Save to cache whenever GPUs or selection changes
  useEffect(() => {
    if (enableCaching && gpus.length > 0) {
      try {
        const cacheData = {
          gpus,
          lastDetection: lastDetection?.toISOString(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cacheData));

        if (selectedGPU) {
          localStorage.setItem(SELECTED_GPU_KEY, selectedGPU.id);
        }
      } catch (error) {
        console.warn('Failed to save GPU data to cache:', error);
      }
    }
  }, [gpus, selectedGPU, lastDetection, enableCaching]);

  // GPU detection function
  const detectGPUs = useCallback(async (): Promise<GPUOption[]> => {
    if (mockMode) {
      // In mock mode, return combined default and mock options
      return [...getDefaultGPUOptions(), ...getMockGPUOptions()];
    }

    try {
      // In real mode, use IPC to communicate with main process for hardware detection
      const detectedGPUs = await window?.ipc?.invoke('detectGPUs');

      if (Array.isArray(detectedGPUs)) {
        return [...getDefaultGPUOptions(), ...detectedGPUs];
      } else {
        // Fallback to default options if detection fails
        return getDefaultGPUOptions();
      }
    } catch (error) {
      console.warn('GPU detection failed, using fallback options:', error);
      return getDefaultGPUOptions();
    }
  }, [mockMode]);

  // Refresh GPUs function
  const refreshGPUs = useCallback(async () => {
    setIsDetecting(true);
    setError(null);

    try {
      // Simulate detection time for better UX
      const detectionPromise = detectGPUs();
      const delayPromise = new Promise((resolve) => setTimeout(resolve, 1000));

      const [detectedGPUs] = await Promise.all([
        detectionPromise,
        delayPromise,
      ]);

      setGpus(detectedGPUs);
      setLastDetection(new Date());

      // Update selected GPU if it's no longer available
      if (selectedGPU) {
        const updatedSelected = detectedGPUs.find(
          (gpu) => gpu.id === selectedGPU.id,
        );
        if (updatedSelected) {
          setSelectedGPU(updatedSelected);
        } else {
          // Auto-select the best available GPU
          const autoGPU = detectedGPUs.find((gpu) => gpu.id === 'auto');
          setSelectedGPU(autoGPU || detectedGPUs[0] || null);
        }
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'GPU detection failed';
      setError(errorMessage);
      console.error('GPU detection error:', error);
    } finally {
      setIsDetecting(false);
    }
  }, [detectGPUs, selectedGPU]);

  // Auto-detect on mount
  useEffect(() => {
    if (autoDetect && gpus.length === 0) {
      refreshGPUs();
    }
  }, [autoDetect, gpus.length, refreshGPUs]);

  // Set up refresh interval
  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(refreshGPUs, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval, refreshGPUs]);

  // GPU selection function with validation
  const selectGPU = useCallback(
    (gpuId: string) => {
      const gpu = gpus.find((g) => g.id === gpuId);
      if (gpu) {
        setSelectedGPU(gpu);
        setError(null);
      } else {
        setError(`GPU with ID "${gpuId}" not found`);
      }
    },
    [gpus],
  );

  // Clear error function
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Get GPU by ID
  const getGPUById = useCallback(
    (id: string) => {
      return gpus.find((gpu) => gpu.id === id);
    },
    [gpus],
  );

  // Validate GPU selection
  const validateGPUSelection = useCallback(
    (gpuId: string) => {
      const gpu = gpus.find((g) => g.id === gpuId);

      if (!gpu) {
        return { isValid: false, error: 'GPU not found' };
      }

      if (gpu.status === 'unavailable') {
        return { isValid: false, error: 'GPU is not available' };
      }

      return { isValid: true };
    },
    [gpus],
  );

  // Computed values
  const detectedCount = gpus.length;
  const preferredGPU =
    gpus.find(
      (gpu) =>
        gpu.status === 'available' &&
        gpu.openvinoCompatible &&
        gpu.performance === 'high',
    ) ||
    gpus.find((gpu) => gpu.id === 'auto') ||
    null;

  const hasOpenVINOSupport = gpus.some(
    (gpu) => gpu.status === 'available' && gpu.openvinoCompatible,
  );

  return {
    // State
    gpus,
    detectedCount,
    preferredGPU,
    hasOpenVINOSupport,
    isDetecting,
    lastDetection,
    error,
    selectedGPU,

    // Actions
    refreshGPUs,
    selectGPU,
    clearError,
    getGPUById,
    validateGPUSelection,
  };
};

export default useGPUDetection;
