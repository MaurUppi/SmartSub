import React, { useState } from 'react';
import { useTranslation } from 'next-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Download,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  Settings,
  Monitor,
  Package,
  Terminal,
  Info,
  PlayCircle,
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

export interface GPUSetupInstructionsProps {
  gpu: GPUOption;
  onSetupValidation?: () => void;
  className?: string;
}

interface SetupStep {
  id: string;
  title: string;
  description: string;
  action?: string;
  link?: string;
  icon: React.ReactNode;
  isOptional?: boolean;
}

const getOpenVINOSetupSteps = (t: any): SetupStep[] => [
  {
    id: 'openvino-install',
    title: t('installOpenVINO'),
    description: t('installOpenVINODescription'),
    action: t('downloadOpenVINO'),
    link: 'https://www.intel.com/content/www/us/en/developer/tools/openvino-toolkit/download.html',
    icon: <Package className="w-5 h-5" />,
  },
  {
    id: 'python-bindings',
    title: t('installPythonBindings'),
    description: t('installPythonBindingsDescription'),
    action: t('installViaPip'),
    icon: <Terminal className="w-5 h-5" />,
  },
  {
    id: 'verify-installation',
    title: t('verifyInstallation'),
    description: t('verifyInstallationDescription'),
    action: t('testInstallation'),
    icon: <CheckCircle className="w-5 h-5" />,
  },
];

const getIntelDriverSetupSteps = (gpuType: string, t: any): SetupStep[] => {
  const isDiscrete = gpuType === 'intel-discrete';

  return [
    {
      id: 'driver-download',
      title: isDiscrete
        ? t('downloadArcDrivers')
        : t('downloadIntegratedDrivers'),
      description: isDiscrete
        ? t('downloadArcDriversDescription')
        : t('downloadIntegratedDriversDescription'),
      action: t('downloadDrivers'),
      link: isDiscrete
        ? 'https://www.intel.com/content/www/us/en/support/articles/000090440/graphics.html'
        : 'https://www.intel.com/content/www/us/en/support/detect.html',
      icon: <Download className="w-5 h-5" />,
    },
    {
      id: 'driver-install',
      title: t('installDrivers'),
      description: t('installDriversDescription'),
      action: t('runInstaller'),
      icon: <Settings className="w-5 h-5" />,
    },
    {
      id: 'restart-system',
      title: t('restartSystem'),
      description: t('restartSystemDescription'),
      icon: <Monitor className="w-5 h-5" />,
    },
    {
      id: 'verify-driver',
      title: t('verifyDriver'),
      description: t('verifyDriverDescription'),
      action: t('checkDeviceManager'),
      icon: <CheckCircle className="w-5 h-5" />,
    },
  ];
};

const getPlatformSpecificInstructions = (platform: string, t: any) => {
  switch (platform) {
    case 'windows':
      return {
        title: t('windowsInstructions'),
        icon: <Monitor className="w-5 h-5" />,
        steps: [
          t('windowsStep1'),
          t('windowsStep2'),
          t('windowsStep3'),
          t('windowsStep4'),
        ],
      };
    case 'linux':
      return {
        title: t('linuxInstructions'),
        icon: <Terminal className="w-5 h-5" />,
        steps: [
          t('linuxStep1'),
          t('linuxStep2'),
          t('linuxStep3'),
          t('linuxStep4'),
        ],
      };
    default:
      return {
        title: t('generalInstructions'),
        icon: <Info className="w-5 h-5" />,
        steps: [t('generalStep1'), t('generalStep2'), t('generalStep3')],
      };
  }
};

const getRequirements = (gpu: GPUOption, t: any) => {
  const requirements = [t('openvinoVersion'), t('supportedOS')];

  if (gpu.type === 'intel-discrete') {
    requirements.push(t('arcDriverRequirement'));
  } else if (gpu.type === 'intel-integrated') {
    requirements.push(t('integratedDriverRequirement'));
  }

  if (gpu.memory && typeof gpu.memory === 'number') {
    requirements.push(
      t('memoryRequirement', { memory: Math.round(gpu.memory / 1024) }),
    );
  }

  return requirements;
};

export const GPUSetupInstructions: React.FC<GPUSetupInstructionsProps> = ({
  gpu,
  onSetupValidation,
  className = '',
}) => {
  const { t } = useTranslation('settings');
  const [currentPlatform, setCurrentPlatform] = useState<
    'windows' | 'linux' | 'general'
  >('windows');
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [isValidating, setIsValidating] = useState(false);

  if (gpu.status === 'available') {
    return (
      <Alert className={className}>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          {t('gpuReadyToUse', { gpu: gpu.displayName })}
        </AlertDescription>
      </Alert>
    );
  }

  if (gpu.status === 'unavailable') {
    return (
      <Alert variant="destructive" className={className}>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {t('gpuNotSupported', { gpu: gpu.displayName })}
        </AlertDescription>
      </Alert>
    );
  }

  const openvinoSteps = getOpenVINOSetupSteps(t);
  const driverSteps = getIntelDriverSetupSteps(gpu.type, t);
  const platformInstructions = getPlatformSpecificInstructions(
    currentPlatform,
    t,
  );
  const requirements = getRequirements(gpu, t);

  const handleStepComplete = (stepId: string) => {
    setCompletedSteps((prev) => new Set(Array.from(prev).concat(stepId)));
  };

  const handleSetupValidation = async () => {
    setIsValidating(true);
    try {
      // Simulate validation process
      await new Promise((resolve) => setTimeout(resolve, 2000));
      onSetupValidation?.();
    } finally {
      setIsValidating(false);
    }
  };

  const handleExternalLink = (url: string) => {
    window?.ipc?.invoke('openExternal', url);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Settings className="mr-2" />
          {t('setupInstructions')} - {gpu.displayName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* GPU Status Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            {t('setupRequired', { gpu: gpu.displayName })}
          </AlertDescription>
        </Alert>

        {/* Requirements Section */}
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center">
            <CheckCircle className="w-4 h-4 mr-2" />
            {t('requirements')}
          </h3>
          <ul className="space-y-2">
            {requirements.map((req, index) => (
              <li key={index} className="flex items-center text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                {req}
              </li>
            ))}
          </ul>
        </div>

        <Separator />

        {/* Platform Selection */}
        <div className="space-y-3">
          <h3 className="font-semibold">{t('selectPlatform')}</h3>
          <div className="flex space-x-2">
            <Button
              variant={currentPlatform === 'windows' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentPlatform('windows')}
            >
              Windows
            </Button>
            <Button
              variant={currentPlatform === 'linux' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentPlatform('linux')}
            >
              Linux
            </Button>
            <Button
              variant={currentPlatform === 'general' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentPlatform('general')}
            >
              {t('general')}
            </Button>
          </div>
        </div>

        <Separator />

        {/* Intel GPU Driver Setup */}
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center">
            <Download className="w-4 h-4 mr-2" />
            {t('step1IntelDriverSetup')}
          </h3>
          <div className="space-y-3">
            {driverSteps.map((step, index) => (
              <div
                key={step.id}
                className="flex items-start space-x-3 p-3 rounded-lg border"
              >
                <div className="flex-shrink-0 mt-0.5">
                  {completedSteps.has(step.id) ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <div className="w-5 h-5 border-2 border-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium">{index + 1}</span>
                    </div>
                  )}
                </div>
                <div className="flex-grow">
                  <h4 className="font-medium flex items-center">
                    {step.icon}
                    <span className="ml-2">{step.title}</span>
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {step.description}
                  </p>
                  <div className="flex items-center space-x-2 mt-2">
                    {step.link && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExternalLink(step.link!)}
                        className="flex items-center"
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        {step.action}
                      </Button>
                    )}
                    {!completedSteps.has(step.id) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStepComplete(step.id)}
                        className="flex items-center"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        {t('markComplete')}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* OpenVINO Setup */}
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center">
            <Package className="w-4 h-4 mr-2" />
            {t('step2OpenVINOSetup')}
          </h3>
          <div className="space-y-3">
            {openvinoSteps.map((step, index) => (
              <div
                key={step.id}
                className="flex items-start space-x-3 p-3 rounded-lg border"
              >
                <div className="flex-shrink-0 mt-0.5">
                  {completedSteps.has(step.id) ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <div className="w-5 h-5 border-2 border-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium">{index + 1}</span>
                    </div>
                  )}
                </div>
                <div className="flex-grow">
                  <h4 className="font-medium flex items-center">
                    {step.icon}
                    <span className="ml-2">{step.title}</span>
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {step.description}
                  </p>
                  <div className="flex items-center space-x-2 mt-2">
                    {step.link && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExternalLink(step.link!)}
                        className="flex items-center"
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        {step.action}
                      </Button>
                    )}
                    {step.id === 'python-bindings' && (
                      <Badge variant="outline" className="text-xs">
                        pip install openvino
                      </Badge>
                    )}
                    {!completedSteps.has(step.id) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStepComplete(step.id)}
                        className="flex items-center"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        {t('markComplete')}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Platform-Specific Instructions */}
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center">
            {platformInstructions.icon}
            <span className="ml-2">{platformInstructions.title}</span>
          </h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <ol className="space-y-2">
              {platformInstructions.steps.map((step, index) => (
                <li key={index} className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center mr-3 mt-0.5">
                    {index + 1}
                  </span>
                  <span className="text-sm">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <Separator />

        {/* Setup Validation */}
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center">
            <PlayCircle className="w-4 h-4 mr-2" />
            {t('validateSetup')}
          </h3>
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div>
              <p className="font-medium">{t('testGPUSetup')}</p>
              <p className="text-sm text-gray-600">
                {t('testGPUSetupDescription')}
              </p>
            </div>
            <Button
              onClick={handleSetupValidation}
              disabled={isValidating}
              className="flex items-center"
            >
              {isValidating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {t('validating')}
                </>
              ) : (
                <>
                  <PlayCircle className="w-4 h-4 mr-2" />
                  {t('testSetup')}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Version Requirements */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>{t('note')}:</strong> {t('setupRequirementsNote')}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default GPUSetupInstructions;
