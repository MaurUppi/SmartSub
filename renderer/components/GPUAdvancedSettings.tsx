import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'next-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Settings,
  Folder,
  RotateCcw,
  HelpCircle,
  Save,
  Zap,
  HardDrive,
  Monitor,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';

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

export interface OpenVINOAdvancedSettings {
  cacheDir: string;
  devicePreference: 'discrete' | 'integrated' | 'auto';
  enableOptimizations: boolean;
  enableCaching: boolean;
  numThreads: number;
  enableDynamicShapes: boolean;
  enableModelCaching: boolean;
  logLevel: 'error' | 'warning' | 'info' | 'debug';
  enableTelemetry: boolean;
}

export interface GPUAdvancedSettingsProps {
  selectedGPU: GPUOption | null;
  onSettingsChange?: (settings: Partial<OpenVINOAdvancedSettings>) => void;
  className?: string;
}

const getDefaultSettings = (): OpenVINOAdvancedSettings => ({
  cacheDir: '',
  devicePreference: 'auto',
  enableOptimizations: true,
  enableCaching: true,
  numThreads: 4,
  enableDynamicShapes: false,
  enableModelCaching: true,
  logLevel: 'warning',
  enableTelemetry: false,
});

const getDevicePreferenceOptions = (t: any) => [
  {
    value: 'auto',
    label: t('autoDetect'),
    description: t('autoDetectDescription'),
  },
  {
    value: 'discrete',
    label: t('discreteGPU'),
    description: t('discreteGPUPreference'),
  },
  {
    value: 'integrated',
    label: t('integratedGPU'),
    description: t('integratedGPUPreference'),
  },
];

const getLogLevelOptions = (t: any) => [
  {
    value: 'error',
    label: t('errorLevel'),
    description: t('errorLevelDescription'),
  },
  {
    value: 'warning',
    label: t('warningLevel'),
    description: t('warningLevelDescription'),
  },
  {
    value: 'info',
    label: t('infoLevel'),
    description: t('infoLevelDescription'),
  },
  {
    value: 'debug',
    label: t('debugLevel'),
    description: t('debugLevelDescription'),
  },
];

export const GPUAdvancedSettings: React.FC<GPUAdvancedSettingsProps> = ({
  selectedGPU,
  onSettingsChange,
  className = '',
}) => {
  const { t } = useTranslation('settings');
  const [settings, setSettings] =
    useState<OpenVINOAdvancedSettings>(getDefaultSettings());
  const [hasChanges, setHasChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [isVisible, setIsVisible] = useState(false);

  // Show/hide based on selected GPU type
  useEffect(() => {
    const shouldShow =
      selectedGPU &&
      (selectedGPU.type === 'intel-discrete' ||
        selectedGPU.type === 'intel-integrated' ||
        selectedGPU.openvinoCompatible);
    setIsVisible(!!shouldShow);
  }, [selectedGPU]);

  // Load settings from storage on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedSettings = await window?.ipc?.invoke('getOpenVINOSettings');
        if (storedSettings) {
          setSettings({ ...getDefaultSettings(), ...storedSettings });
        }
      } catch (error) {
        console.warn('Failed to load OpenVINO settings:', error);
      }
    };
    loadSettings();
  }, []);

  // Validation functions
  const validateCacheDir = useCallback(
    (dir: string): string => {
      if (!dir.trim()) {
        return t('cacheDirRequired');
      }
      if (dir.length > 260) {
        return t('cacheDirTooLong');
      }
      // Basic path validation
      const invalidChars = /[<>:"|?*]/;
      if (invalidChars.test(dir)) {
        return t('cacheDirInvalidChars');
      }
      return '';
    },
    [t],
  );

  const validateNumThreads = useCallback(
    (threads: number): string => {
      if (threads < 1 || threads > 32) {
        return t('threadsInvalidRange');
      }
      return '';
    },
    [t],
  );

  const validateSettings = useCallback(
    (newSettings: OpenVINOAdvancedSettings) => {
      const errors: Record<string, string> = {};

      const cacheDirError = validateCacheDir(newSettings.cacheDir);
      if (cacheDirError) errors.cacheDir = cacheDirError;

      const threadsError = validateNumThreads(newSettings.numThreads);
      if (threadsError) errors.numThreads = threadsError;

      setValidationErrors(errors);
      return Object.keys(errors).length === 0;
    },
    [validateCacheDir, validateNumThreads],
  );

  // Handle settings changes
  const handleSettingChange = useCallback(
    <K extends keyof OpenVINOAdvancedSettings>(
      key: K,
      value: OpenVINOAdvancedSettings[K],
    ) => {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      setHasChanges(true);
      validateSettings(newSettings);
    },
    [settings, validateSettings],
  );

  // Handle cache directory selection
  const handleSelectCacheDir = async () => {
    try {
      const result = await window?.ipc?.invoke('selectDirectory');
      if (!result.canceled && result.filePaths.length > 0) {
        handleSettingChange('cacheDir', result.filePaths[0]);
      }
    } catch (error) {
      toast.error(t('cacheDirSelectionFailed'));
    }
  };

  // Save settings
  const handleSaveSettings = async () => {
    if (!validateSettings(settings)) {
      toast.error(t('fixValidationErrors'));
      return;
    }

    try {
      await window?.ipc?.invoke('setOpenVINOSettings', settings);
      setHasChanges(false);
      toast.success(t('advancedSettingsSaved'));
      onSettingsChange?.(settings);
    } catch (error) {
      toast.error(t('advancedSettingsSaveFailed'));
    }
  };

  // Reset to defaults
  const handleResetToDefaults = () => {
    const defaultSettings = getDefaultSettings();
    setSettings(defaultSettings);
    setHasChanges(true);
    setValidationErrors({});
    toast.info(t('settingsResetToDefaults'));
  };

  if (!isVisible) {
    return (
      <Alert className={className}>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{t('advancedSettingsNotAvailable')}</AlertDescription>
      </Alert>
    );
  }

  const devicePreferenceOptions = getDevicePreferenceOptions(t);
  const logLevelOptions = getLogLevelOptions(t);
  const hasValidationErrors = Object.keys(validationErrors).length > 0;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Settings className="mr-2" />
            {t('advancedSettings')}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetToDefaults}
              className="flex items-center"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              {t('reset')}
            </Button>
            <Button
              onClick={handleSaveSettings}
              disabled={!hasChanges || hasValidationErrors}
              size="sm"
              className="flex items-center"
            >
              <Save className="w-4 h-4 mr-1" />
              {t('save')}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Cache Configuration */}
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center">
            <HardDrive className="w-4 h-4 mr-2" />
            {t('cacheConfiguration')}
          </h3>

          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Label htmlFor="cache-dir">{t('cacheDirectory')}</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('cacheDirTooltip')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex gap-2">
                <Input
                  id="cache-dir"
                  value={settings.cacheDir}
                  onChange={(e) =>
                    handleSettingChange('cacheDir', e.target.value)
                  }
                  placeholder={t('cacheDirPlaceholder')}
                  className={`font-mono text-sm ${validationErrors.cacheDir ? 'border-red-300' : ''}`}
                />
                <Button
                  variant="outline"
                  onClick={handleSelectCacheDir}
                  className="flex items-center"
                >
                  <Folder className="w-4 h-4 mr-1" />
                  {t('browse')}
                </Button>
              </div>
              {validationErrors.cacheDir && (
                <p className="text-sm text-red-600">
                  {validationErrors.cacheDir}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Label htmlFor="enable-caching">{t('enableCaching')}</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('enableCachingTooltip')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Switch
                id="enable-caching"
                checked={settings.enableCaching}
                onCheckedChange={(checked) =>
                  handleSettingChange('enableCaching', checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Label htmlFor="enable-model-caching">
                  {t('enableModelCaching')}
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('enableModelCachingTooltip')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Switch
                id="enable-model-caching"
                checked={settings.enableModelCaching}
                onCheckedChange={(checked) =>
                  handleSettingChange('enableModelCaching', checked)
                }
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Device Preferences */}
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center">
            <Monitor className="w-4 h-4 mr-2" />
            {t('devicePreferences')}
          </h3>

          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Label>{t('devicePreference')}</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('devicePreferenceTooltip')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Select
                value={settings.devicePreference}
                onValueChange={(value: 'discrete' | 'integrated' | 'auto') =>
                  handleSettingChange('devicePreference', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {devicePreferenceOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-sm text-gray-500">
                          {option.description}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Separator />

        {/* Performance Optimization */}
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center">
            <Zap className="w-4 h-4 mr-2" />
            {t('performanceOptimization')}
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Label htmlFor="enable-optimizations">
                  {t('enableOptimizations')}
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('enableOptimizationsTooltip')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Switch
                id="enable-optimizations"
                checked={settings.enableOptimizations}
                onCheckedChange={(checked) =>
                  handleSettingChange('enableOptimizations', checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Label htmlFor="enable-dynamic-shapes">
                  {t('enableDynamicShapes')}
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('enableDynamicShapesTooltip')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Switch
                id="enable-dynamic-shapes"
                checked={settings.enableDynamicShapes}
                onCheckedChange={(checked) =>
                  handleSettingChange('enableDynamicShapes', checked)
                }
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Label htmlFor="num-threads">{t('numThreads')}</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('numThreadsTooltip')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="num-threads"
                type="number"
                min="1"
                max="32"
                value={settings.numThreads}
                onChange={(e) =>
                  handleSettingChange(
                    'numThreads',
                    parseInt(e.target.value) || 1,
                  )
                }
                className={`w-24 ${validationErrors.numThreads ? 'border-red-300' : ''}`}
              />
              {validationErrors.numThreads && (
                <p className="text-sm text-red-600">
                  {validationErrors.numThreads}
                </p>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Debug and Logging */}
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center">
            <Settings className="w-4 h-4 mr-2" />
            {t('debugAndLogging')}
          </h3>

          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Label>{t('logLevel')}</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('logLevelTooltip')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Select
                value={settings.logLevel}
                onValueChange={(
                  value: 'error' | 'warning' | 'info' | 'debug',
                ) => handleSettingChange('logLevel', value)}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {logLevelOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-sm text-gray-500">
                          {option.description}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Label htmlFor="enable-telemetry">{t('enableTelemetry')}</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('enableTelemetryTooltip')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Switch
                id="enable-telemetry"
                checked={settings.enableTelemetry}
                onCheckedChange={(checked) =>
                  handleSettingChange('enableTelemetry', checked)
                }
              />
            </div>
          </div>
        </div>

        {/* Status and Actions */}
        {hasChanges && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{t('unsavedChanges')}</AlertDescription>
          </Alert>
        )}

        {hasValidationErrors && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{t('validationErrorsExist')}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default GPUAdvancedSettings;
