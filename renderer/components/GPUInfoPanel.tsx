import React from 'react';
import { useTranslation } from 'next-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Info,
  Zap,
  Activity,
  HardDrive,
  Settings,
  Timer,
  Battery,
  Cpu,
  Monitor,
} from 'lucide-react';

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

export interface GPUInfoPanelProps {
  selectedGPU: GPUOption | null;
  className?: string;
}

const getGPUTypeInfo = (type: string, t: any) => {
  switch (type) {
    case 'intel-discrete':
      return {
        label: t('discreteGPU'),
        description: t('discreteGPUDescription'),
        icon: <Monitor className="w-4 h-4" />,
        color: 'text-blue-600',
      };
    case 'intel-integrated':
      return {
        label: t('integratedGPU'),
        description: t('integratedGPUDescription'),
        icon: <Cpu className="w-4 h-4" />,
        color: 'text-green-600',
      };
    case 'nvidia':
      return {
        label: t('dedicatedGPU'),
        description: t('nvidiaGPUDescription'),
        icon: <Monitor className="w-4 h-4" />,
        color: 'text-green-600',
      };
    case 'apple':
      return {
        label: t('appleGPU'),
        description: t('appleGPUDescription'),
        icon: <Cpu className="w-4 h-4" />,
        color: 'text-gray-600',
      };
    case 'amd':
      return {
        label: t('amdGPU'),
        description: t('amdGPUDescription'),
        icon: <Monitor className="w-4 h-4" />,
        color: 'text-red-600',
      };
    case 'cpu':
      return {
        label: t('cpuProcessing'),
        description: t('cpuProcessingDescription'),
        icon: <Cpu className="w-4 h-4" />,
        color: 'text-gray-600',
      };
    case 'auto':
      return {
        label: t('autoDetection'),
        description: t('autoDetectionDescription'),
        icon: <Settings className="w-4 h-4" />,
        color: 'text-purple-600',
      };
    default:
      return {
        label: t('unknown'),
        description: t('unknownGPUDescription'),
        icon: <Info className="w-4 h-4" />,
        color: 'text-gray-500',
      };
  }
};

const getPerformanceRating = (performance: string, t: any) => {
  switch (performance) {
    case 'high':
      return {
        label: t('highPerformance'),
        badge: (
          <Badge className="bg-green-100 text-green-800 border-green-300">
            {t('high')}
          </Badge>
        ),
        icon: <Zap className="w-4 h-4 text-green-500" />,
        description: t('highPerformanceDescription'),
      };
    case 'medium':
      return {
        label: t('mediumPerformance'),
        badge: (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
            {t('medium')}
          </Badge>
        ),
        icon: <Activity className="w-4 h-4 text-yellow-500" />,
        description: t('mediumPerformanceDescription'),
      };
    case 'low':
      return {
        label: t('lowPerformance'),
        badge: (
          <Badge className="bg-gray-100 text-gray-800 border-gray-300">
            {t('low')}
          </Badge>
        ),
        icon: <Activity className="w-4 h-4 text-gray-500" />,
        description: t('lowPerformanceDescription'),
      };
    default:
      return {
        label: t('unknownPerformance'),
        badge: <Badge variant="outline">{t('unknown')}</Badge>,
        icon: <Activity className="w-4 h-4 text-gray-500" />,
        description: t('unknownPerformanceDescription'),
      };
  }
};

const getPowerEfficiencyRating = (efficiency: string, t: any) => {
  switch (efficiency) {
    case 'excellent':
      return {
        label: t('excellentEfficiency'),
        badge: (
          <Badge className="bg-green-100 text-green-800 border-green-300">
            {t('excellent')}
          </Badge>
        ),
        icon: <Battery className="w-4 h-4 text-green-500" />,
        description: t('excellentEfficiencyDescription'),
      };
    case 'good':
      return {
        label: t('goodEfficiency'),
        badge: (
          <Badge className="bg-blue-100 text-blue-800 border-blue-300">
            {t('good')}
          </Badge>
        ),
        icon: <Battery className="w-4 h-4 text-blue-500" />,
        description: t('goodEfficiencyDescription'),
      };
    case 'moderate':
      return {
        label: t('moderateEfficiency'),
        badge: (
          <Badge className="bg-orange-100 text-orange-800 border-orange-300">
            {t('moderate')}
          </Badge>
        ),
        icon: <Battery className="w-4 h-4 text-orange-500" />,
        description: t('moderateEfficiencyDescription'),
      };
    default:
      return {
        label: t('unknownEfficiency'),
        badge: <Badge variant="outline">{t('unknown')}</Badge>,
        icon: <Battery className="w-4 h-4 text-gray-500" />,
        description: t('unknownEfficiencyDescription'),
      };
  }
};

const formatMemoryInfo = (memory: number | 'shared' | undefined, t: any) => {
  if (memory === undefined) {
    return t('memoryUnknown');
  }
  if (memory === 'shared') {
    return t('sharedMemory');
  }
  if (typeof memory === 'number') {
    const memoryGB = Math.round(memory / 1024);
    return t('dedicatedMemory', { memory: memoryGB });
  }
  return t('memoryUnknown');
};

export const GPUInfoPanel: React.FC<GPUInfoPanelProps> = ({
  selectedGPU,
  className = '',
}) => {
  const { t } = useTranslation('settings');

  if (!selectedGPU) {
    return (
      <Card className={`${className} border-dashed`}>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center text-gray-500">
            <Info className="w-8 h-8 mx-auto mb-2" />
            <p>{t('noGPUSelected')}</p>
            <p className="text-sm mt-1">{t('selectGPUToViewInfo')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const typeInfo = getGPUTypeInfo(selectedGPU.type, t);
  const performanceInfo = getPerformanceRating(selectedGPU.performance, t);
  const efficiencyInfo = getPowerEfficiencyRating(
    selectedGPU.powerEfficiency,
    t,
  );
  const memoryInfo = formatMemoryInfo(selectedGPU.memory, t);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Info className="mr-2" />
          {t('gpuInformation')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* GPU Name and Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">{selectedGPU.displayName}</h3>
            <div className="flex items-center space-x-2">
              {selectedGPU.openvinoCompatible && (
                <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                  OpenVINO
                </Badge>
              )}
              <Badge
                variant={
                  selectedGPU.status === 'available' ? 'default' : 'outline'
                }
                className={
                  selectedGPU.status === 'available'
                    ? 'bg-green-100 text-green-800 border-green-300'
                    : selectedGPU.status === 'requires-setup'
                      ? 'bg-orange-100 text-orange-800 border-orange-300'
                      : selectedGPU.status === 'cpu-only'
                        ? 'bg-blue-100 text-blue-800 border-blue-300'
                        : 'bg-red-100 text-red-800 border-red-300'
                }
              >
                {t(selectedGPU.status)}
              </Badge>
            </div>
          </div>
          <p className="text-sm text-gray-600">{selectedGPU.description}</p>
        </div>

        {/* NEW: CPU-only processing information for AMD GPUs (Requirements #4, #7, #8) */}
        {selectedGPU.cpuOnlyProcessing && (
          <>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-start space-x-2">
                <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-800">
                    {t('cpuOnlyProcessingTitle')}
                  </h4>
                  <p className="text-sm text-blue-700 mt-1">
                    {selectedGPU.fallbackReason || t('amdGpuCpuOnlyDefault')}
                  </p>
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-blue-600">
                      • {t('amdGpuCpuOnlyBenefit1')}
                    </p>
                    <p className="text-xs text-blue-600">
                      • {t('amdGpuCpuOnlyBenefit2')}
                    </p>
                    <p className="text-xs text-blue-600">
                      • {t('amdGpuCpuOnlyBenefit3')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        <Separator />

        {/* GPU Type */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <div className={typeInfo.color}>{typeInfo.icon}</div>
            <span className="font-medium">{t('gpuType')}</span>
          </div>
          <div className="pl-6">
            <p className="font-medium">{typeInfo.label}</p>
            <p className="text-sm text-gray-600">{typeInfo.description}</p>
          </div>
        </div>

        <Separator />

        {/* Performance Rating */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            {performanceInfo.icon}
            <span className="font-medium">{t('performanceRating')}</span>
          </div>
          <div className="pl-6">
            <div className="flex items-center space-x-2 mb-1">
              {performanceInfo.badge}
              {selectedGPU.estimatedSpeed && (
                <Badge variant="outline" className="text-xs">
                  {selectedGPU.estimatedSpeed}
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-600">
              {performanceInfo.description}
            </p>
          </div>
        </div>

        <Separator />

        {/* Power Efficiency */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            {efficiencyInfo.icon}
            <span className="font-medium">{t('powerEfficiency')}</span>
          </div>
          <div className="pl-6">
            <div className="mb-1">{efficiencyInfo.badge}</div>
            <p className="text-sm text-gray-600">
              {efficiencyInfo.description}
            </p>
          </div>
        </div>

        <Separator />

        {/* Memory Information */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <HardDrive className="w-4 h-4" />
            <span className="font-medium">{t('memoryInformation')}</span>
          </div>
          <div className="pl-6">
            <p className="font-medium">{memoryInfo}</p>
            <p className="text-sm text-gray-600">
              {selectedGPU.memory === 'shared'
                ? t('sharedMemoryDescription')
                : t('dedicatedMemoryDescription')}
            </p>
          </div>
        </div>

        {/* Driver Version */}
        {selectedGPU.driverVersion && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Settings className="w-4 h-4" />
                <span className="font-medium">{t('driverVersion')}</span>
              </div>
              <div className="pl-6">
                <p className="font-mono text-sm">{selectedGPU.driverVersion}</p>
                <p className="text-sm text-gray-600">
                  {t('driverVersionDescription')}
                </p>
              </div>
            </div>
          </>
        )}

        {/* Processing Speed Estimate */}
        {selectedGPU.estimatedSpeed &&
          (selectedGPU.status === 'available' ||
            selectedGPU.status === 'cpu-only') && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Timer className="w-4 h-4" />
                  <span className="font-medium">
                    {t('estimatedProcessingSpeed')}
                  </span>
                </div>
                <div className="pl-6">
                  <p
                    className={`font-medium ${
                      selectedGPU.status === 'cpu-only'
                        ? 'text-blue-600'
                        : 'text-green-600'
                    }`}
                  >
                    {selectedGPU.estimatedSpeed}
                  </p>
                  <p className="text-sm text-gray-600">
                    {selectedGPU.status === 'cpu-only'
                      ? t('cpuOnlyProcessingSpeedDescription')
                      : t('processingSpeedDescription')}
                  </p>
                </div>
              </div>
            </>
          )}
      </CardContent>
    </Card>
  );
};

export default GPUInfoPanel;
