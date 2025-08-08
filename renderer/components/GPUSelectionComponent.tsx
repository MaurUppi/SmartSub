import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'next-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Zap, Cpu, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { GPUSelectionOption } from '../../types/settings';

export interface GPUSelectionProps {
  selectedGPUId: string;
  onGPUSelectionChange: (gpuId: string) => void;
  onRefreshGPUs?: () => void;
  disabled?: boolean;
  className?: string;
}

export interface GPUOption {
  id: string;
  displayName: string;
  type:
    | 'auto'
    | 'nvidia'
    | 'intel-discrete'
    | 'intel-integrated'
    | 'apple'
    | 'cpu';
  status: 'available' | 'unavailable' | 'requires-setup';
  performance: 'high' | 'medium' | 'low';
  description: string;
  driverVersion?: string;
  memory?: number | 'shared';
  powerEfficiency: 'excellent' | 'good' | 'moderate';
  estimatedSpeed?: string;
  openvinoCompatible?: boolean;
}

// Default GPU options that are always available
const getDefaultGPUOptions = (t: any): GPUOption[] => [
  {
    id: 'auto',
    displayName: t('autoDetectRecommended'),
    type: 'auto',
    status: 'available',
    performance: 'high',
    description: t('autoDetectDescription'),
    powerEfficiency: 'excellent',
    estimatedSpeed: t('variable'),
  },
  {
    id: 'cpu',
    displayName: t('cpuProcessing'),
    type: 'cpu',
    status: 'available',
    performance: 'medium',
    description: t('cpuProcessingDescription'),
    powerEfficiency: 'excellent',
    estimatedSpeed: t('baseline'),
  },
];

// Mock GPU options for development and testing
const getMockGPUOptions = (t: any): GPUOption[] => [
  {
    id: 'intel-arc-a770',
    displayName: 'Intel Arc A770',
    type: 'intel-discrete',
    status: 'available',
    performance: 'high',
    description: t('intelArcA770Description'),
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
    description: t('intelXeGraphicsDescription'),
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
    description: t('nvidiaRTX4080Description'),
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
    description: t('intelArcA380Description'),
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
    description: t('intelUHDGraphicsDescription'),
    memory: 'shared',
    powerEfficiency: 'excellent',
    estimatedSpeed: '1.5x faster',
    openvinoCompatible: false,
  },
];

const getPerformanceIcon = (performance: string) => {
  switch (performance) {
    case 'high':
      return <Zap className="w-4 h-4 text-green-500" />;
    case 'medium':
      return <Activity className="w-4 h-4 text-yellow-500" />;
    case 'low':
      return <Cpu className="w-4 h-4 text-gray-500" />;
    default:
      return <Activity className="w-4 h-4 text-gray-500" />;
  }
};

const getStatusBadge = (status: string, t: any) => {
  switch (status) {
    case 'available':
      return (
        <Badge variant="outline" className="text-green-600 border-green-300">
          {t('available')}
        </Badge>
      );
    case 'requires-setup':
      return (
        <Badge variant="outline" className="text-orange-600 border-orange-300">
          {t('requiresSetup')}
        </Badge>
      );
    case 'unavailable':
      return (
        <Badge variant="outline" className="text-red-600 border-red-300">
          {t('unavailable')}
        </Badge>
      );
    default:
      return <Badge variant="outline">{t('unknown')}</Badge>;
  }
};

export const GPUSelectionComponent: React.FC<GPUSelectionProps> = ({
  selectedGPUId,
  onGPUSelectionChange,
  onRefreshGPUs,
  disabled = false,
  className = '',
}) => {
  const { t } = useTranslation('settings');
  const [availableGPUs, setAvailableGPUs] = useState<GPUOption[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [detectionError, setDetectionError] = useState<string | null>(null);

  // Initialize GPU options
  useEffect(() => {
    const defaultOptions = getDefaultGPUOptions(t);
    const mockOptions = getMockGPUOptions(t);
    setAvailableGPUs([...defaultOptions, ...mockOptions]);
  }, [t]);

  // GPU detection and refresh functionality
  const handleRefreshGPUs = useCallback(async () => {
    if (disabled) return;

    setIsRefreshing(true);
    setDetectionError(null);

    try {
      // In a real implementation, this would call the hardware detection
      // For now, we simulate the detection process
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Simulate successful detection
      const defaultOptions = getDefaultGPUOptions(t);
      const mockOptions = getMockGPUOptions(t);
      setAvailableGPUs([...defaultOptions, ...mockOptions]);

      toast.success(t('gpuDetectionSuccess'));
      onRefreshGPUs?.();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : t('gpuDetectionFailed');
      setDetectionError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsRefreshing(false);
    }
  }, [disabled, onRefreshGPUs, t]);

  // Handle GPU selection change with validation
  const handleGPUSelectionChange = useCallback(
    (value: string) => {
      const selectedGPU = availableGPUs.find((gpu) => gpu.id === value);

      if (!selectedGPU) {
        toast.error(t('invalidGPUSelection'));
        return;
      }

      if (selectedGPU.status === 'unavailable') {
        toast.warning(t('gpuNotAvailable', { gpu: selectedGPU.displayName }));
        return;
      }

      onGPUSelectionChange(value);

      if (selectedGPU.status === 'requires-setup') {
        toast.info(t('gpuRequiresSetup', { gpu: selectedGPU.displayName }));
      } else {
        toast.success(t('gpuSelected', { gpu: selectedGPU.displayName }));
      }
    },
    [availableGPUs, onGPUSelectionChange, t],
  );

  const selectedGPU = availableGPUs.find((gpu) => gpu.id === selectedGPUId);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Cpu className="mr-2" />
            {t('gpuSelection')}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshGPUs}
            disabled={disabled || isRefreshing}
            className="flex items-center"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
            />
            {t('refresh')}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {detectionError && (
          <div className="p-3 rounded-md bg-red-50 border border-red-200">
            <p className="text-sm text-red-600">{detectionError}</p>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium">{t('selectGPU')}</label>
          <Select
            value={selectedGPUId}
            onValueChange={handleGPUSelectionChange}
            disabled={disabled || isRefreshing}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('selectGPUPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {availableGPUs.map((gpu) => (
                <SelectItem
                  key={gpu.id}
                  value={gpu.id}
                  disabled={gpu.status === 'unavailable'}
                  className="cursor-pointer"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center space-x-2">
                      {getPerformanceIcon(gpu.performance)}
                      <span
                        className={
                          gpu.status === 'unavailable' ? 'text-gray-400' : ''
                        }
                      >
                        {gpu.displayName}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {getStatusBadge(gpu.status, t)}
                      {gpu.estimatedSpeed && gpu.status === 'available' && (
                        <Badge variant="secondary" className="text-xs">
                          {gpu.estimatedSpeed}
                        </Badge>
                      )}
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedGPU && (
          <div className="p-3 rounded-md bg-blue-50 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">{selectedGPU.displayName}</h4>
                <p className="text-sm text-gray-600">
                  {selectedGPU.description}
                </p>
              </div>
              <div className="text-right">
                {getStatusBadge(selectedGPU.status, t)}
                {selectedGPU.openvinoCompatible && (
                  <Badge
                    variant="outline"
                    className="ml-2 text-green-600 border-green-300"
                  >
                    OpenVINO
                  </Badge>
                )}
              </div>
            </div>
          </div>
        )}

        {isRefreshing && (
          <div className="flex items-center justify-center p-4">
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            <span className="text-sm text-gray-600">{t('detectingGPUs')}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GPUSelectionComponent;
