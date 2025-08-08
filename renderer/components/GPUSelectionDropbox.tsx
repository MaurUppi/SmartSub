/**
 * GPU Selection Dropbox Component
 * Provides GPU device selection interface in the Advanced Settings
 */

import React, { useState } from 'react';
import { useTranslation } from 'next-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  HelpCircle,
  RefreshCw,
  Zap,
  Cpu,
  Monitor,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from 'lib/utils';
import { useGPUSelection, GPUDevice } from '../hooks/useGPUSelection';
import { usePlatform } from '../hooks/usePlatform';

export interface GPUSelectionDropboxProps {
  form?: any; // React Hook Form instance (optional)
  className?: string;
  showDescription?: boolean;
}

const getGPUIcon = (gpuType: GPUDevice['type']) => {
  switch (gpuType) {
    case 'intel-arc':
    case 'intel-xe':
    case 'intel-integrated':
      return <Monitor className="h-4 w-4" />;
    case 'nvidia':
      return <Zap className="h-4 w-4" />;
    case 'auto':
      return <RefreshCw className="h-4 w-4" />;
    case 'cpu':
      return <Cpu className="h-4 w-4" />;
    default:
      return <Monitor className="h-4 w-4" />;
  }
};

const getVendorColor = (vendor: GPUDevice['vendor']) => {
  switch (vendor) {
    case 'intel':
      return 'bg-blue-500';
    case 'nvidia':
      return 'bg-green-500';
    case 'auto':
      return 'bg-gray-500';
    case 'cpu':
      return 'bg-orange-500';
    default:
      return 'bg-gray-500';
  }
};

const GPUSelectionDropbox: React.FC<GPUSelectionDropboxProps> = ({
  form,
  className,
  showDescription = true,
}) => {
  const { t } = useTranslation('home');
  const { t: tCommon } = useTranslation('common');
  const { isMacOS, isWindows, platform } = usePlatform();
  const {
    availableGPUs,
    selectedGPU,
    isGPUSelectionSupported,
    isLoading,
    error,
    selectGPU,
    refreshGPUList,
    getGPUDisplayName,
    isGPURecommended,
  } = useGPUSelection();

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Handle GPU selection change
  const handleGPUChange = async (gpuId: string) => {
    try {
      await selectGPU(gpuId);

      // Update form if provided
      if (form) {
        form.setValue('selectedGPU', gpuId);
      }

      const gpuName = getGPUDisplayName(gpuId);
      toast.success(t('gpuSelectionChanged', { gpu: gpuName }));
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to select GPU';
      toast.error(errorMessage);
    }
  };

  // Handle manual GPU list refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshGPUList();
      toast.success(t('gpuListRefreshed'));
    } catch (err) {
      toast.error(t('gpuRefreshFailed'));
    } finally {
      setIsRefreshing(false);
    }
  };

  // Generate tooltip content based on platform
  const getTooltipContent = () => {
    if (isMacOS) {
      return 'GPU selection is not available on Apple Silicon. OpenVINO GPU acceleration is not supported on macOS.';
    }

    if (!isWindows) {
      return 'GPU selection is only supported on Windows platforms.';
    }

    return 'Select a GPU device for accelerated processing. Auto-detect will choose the best available option.';
  };

  // Generate selection description
  const getSelectionDescription = () => {
    const selectedDevice = availableGPUs.find((gpu) => gpu.id === selectedGPU);

    if (!selectedDevice) {
      return 'No GPU selected';
    }

    if (selectedDevice.id === 'auto') {
      return 'Automatically detects and uses the best available GPU';
    }

    if (selectedDevice.id === 'cpu') {
      return 'Uses CPU for processing (slowest but most compatible)';
    }

    let description = `Uses ${selectedDevice.name} for GPU acceleration`;

    if (selectedDevice.memory) {
      description += ` (${Math.round(selectedDevice.memory / 1024)} GB VRAM)`;
    }

    return description;
  };

  // Render GPU option with details
  const renderGPUOption = (gpu: GPUDevice) => {
    return (
      <div className="flex items-center gap-3 py-1">
        <div
          className={cn('w-2 h-2 rounded-full', getVendorColor(gpu.vendor))}
        />
        <div className="flex items-center gap-2">
          {getGPUIcon(gpu.type)}
          <span className="font-medium">{gpu.name}</span>
        </div>
        <div className="flex gap-1 ml-auto">
          {gpu.recommended && (
            <Badge variant="secondary" className="text-xs">
              Recommended
            </Badge>
          )}
          {!gpu.available && (
            <Badge variant="destructive" className="text-xs">
              Unavailable
            </Badge>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FormLabel
            className={cn(
              'text-sm font-medium',
              !isGPUSelectionSupported && 'text-muted-foreground',
            )}
          >
            GPU Selection
          </FormLabel>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-sm">
                <p>{getTooltipContent()}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Refresh button for supported platforms */}
        {isGPUSelectionSupported && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading || isRefreshing}
            className="h-8 w-8 p-0"
          >
            <RefreshCw
              className={cn(
                'h-4 w-4',
                (isLoading || isRefreshing) && 'animate-spin',
              )}
            />
          </Button>
        )}
      </div>

      {/* GPU Selection Dropdown */}
      <FormControl>
        <Select
          value={selectedGPU}
          onValueChange={handleGPUChange}
          disabled={!isGPUSelectionSupported || isLoading}
        >
          <SelectTrigger
            className={cn(
              !isGPUSelectionSupported && 'opacity-50 cursor-not-allowed',
            )}
          >
            <SelectValue placeholder="Select GPU device..." />
          </SelectTrigger>
          <SelectContent>
            {availableGPUs.map((gpu) => (
              <SelectItem
                key={gpu.id}
                value={gpu.id}
                disabled={!gpu.available}
                className="py-3"
              >
                {renderGPUOption(gpu)}
              </SelectItem>
            ))}

            {availableGPUs.length === 0 && (
              <SelectItem value="no-gpus" disabled>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                  No GPUs detected
                </div>
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </FormControl>

      {/* Selection Description */}
      {showDescription && (
        <FormDescription className="text-xs">
          {isGPUSelectionSupported
            ? getSelectionDescription()
            : 'GPU selection not supported on this platform'}
        </FormDescription>
      )}

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Platform Notice for macOS */}
      {isMacOS && (
        <div className="p-3 bg-muted/50 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="text-xs text-muted-foreground">
              <p className="font-medium">Apple Silicon Notice</p>
              <p>
                GPU selection is not available on Apple Silicon. Use Apple
                CoreML for hardware acceleration instead.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GPUSelectionDropbox;
