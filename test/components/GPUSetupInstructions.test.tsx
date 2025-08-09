/**
 * GPUSetupInstructions Test Suite
 *
 * Comprehensive tests for the GPUSetupInstructions component.
 */

import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  GPUSetupInstructions,
  GPUOption,
} from '../../renderer/components/GPUSetupInstructions';

// Mock next-i18next
jest.mock('next-i18next', () => ({
  useTranslation: () => ({
    t: function (key, params) {
      const translations: Record<string, string> = {
        setupInstructions: 'Setup Instructions',
        setupRequired: 'Setup required for {{gpu}}',
        gpuReadyToUse: '{{gpu}} is ready to use',
        gpuNotSupported: '{{gpu}} is not supported',
        requirements: 'Requirements',
        selectPlatform: 'Select Platform',
        general: 'General',
        step1IntelDriverSetup: 'Step 1: Intel Driver Setup',
        step2OpenVINOSetup: 'Step 2: OpenVINO Setup',
        validateSetup: 'Validate Setup',
        testGPUSetup: 'Test GPU Setup',
        testGPUSetupDescription: 'Verify that your GPU is working correctly',
        validating: 'Validating...',
        testSetup: 'Test Setup',
        note: 'Note',
        setupRequirementsNote:
          'Please ensure all requirements are met before proceeding',
        installOpenVINO: 'Install OpenVINO Toolkit',
        installOpenVINODescription: 'Download and install the OpenVINO toolkit',
        downloadOpenVINO: 'Download OpenVINO',
        installPythonBindings: 'Install Python Bindings',
        installPythonBindingsDescription:
          'Install OpenVINO Python bindings via pip',
        installViaPip: 'Install via pip',
        verifyInstallation: 'Verify Installation',
        verifyInstallationDescription:
          'Test that OpenVINO is working correctly',
        testInstallation: 'Test Installation',
        downloadArcDrivers: 'Download Intel Arc Drivers',
        downloadArcDriversDescription:
          'Download the latest Intel Arc GPU drivers',
        downloadIntegratedDrivers: 'Download Intel Integrated Graphics Drivers',
        downloadIntegratedDriversDescription:
          'Download the latest integrated graphics drivers',
        downloadDrivers: 'Download Drivers',
        installDrivers: 'Install Drivers',
        installDriversDescription:
          'Run the driver installer with administrator privileges',
        runInstaller: 'Run Installer',
        restartSystem: 'Restart System',
        restartSystemDescription:
          'Restart your computer to complete driver installation',
        verifyDriver: 'Verify Driver Installation',
        verifyDriverDescription:
          'Check that the GPU is recognized by the system',
        checkDeviceManager: 'Check Device Manager',
        markComplete: 'Mark Complete',
        windowsInstructions: 'Windows Instructions',
        windowsStep1: 'Download and run the Intel Graphics installer',
        windowsStep2: 'Follow the installation wizard',
        windowsStep3: 'Restart your computer when prompted',
        windowsStep4: 'Verify installation in Device Manager',
        linuxInstructions: 'Linux Instructions',
        linuxStep1: 'Add Intel graphics repository to your package manager',
        linuxStep2: 'Update package lists and install drivers',
        linuxStep3: 'Configure graphics stack and kernel modules',
        linuxStep4: 'Restart and verify installation',
        generalInstructions: 'General Instructions',
        generalStep1: 'Visit Intel support website for drivers',
        generalStep2: 'Download appropriate drivers for your GPU',
        generalStep3: 'Follow platform-specific installation guide',
        openvinoVersion: 'OpenVINO 2024.6.0 or later',
        supportedOS: 'Windows 10/11 or Ubuntu 20.04+',
        arcDriverRequirement: 'Intel Arc Graphics Driver 31.0.101.5000+',
        integratedDriverRequirement: 'Intel Graphics Driver 31.0.101.5000+',
        memoryRequirement: 'At least {{memory}}GB system memory recommended',
      };

      if (params) {
        return (
          translations[key]?.replace(
            /\{\{(\w+)\}\}/g,
            (match, param) => params[param] || match,
          ) || key
        );
      }

      return translations[key] || key;
    },
  }),
}));

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Download: () => <div data-testid="download-icon">Download</div>,
  ExternalLink: () => <div data-testid="external-link-icon">ExternalLink</div>,
  CheckCircle: () => <div data-testid="check-circle-icon">CheckCircle</div>,
  AlertTriangle: () => (
    <div data-testid="alert-triangle-icon">AlertTriangle</div>
  ),
  Settings: () => <div data-testid="settings-icon">Settings</div>,
  Monitor: () => <div data-testid="monitor-icon">Monitor</div>,
  Package: () => <div data-testid="package-icon">Package</div>,
  Terminal: () => <div data-testid="terminal-icon">Terminal</div>,
  Info: () => <div data-testid="info-icon">Info</div>,
  PlayCircle: () => <div data-testid="play-circle-icon">PlayCircle</div>,
}));

// Mock UI components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className, ...props }: any) => (
    <div data-testid="card" className={className} {...props}>
      {children}
    </div>
  ),
  CardContent: ({ children, className, ...props }: any) => (
    <div data-testid="card-content" className={className} {...props}>
      {children}
    </div>
  ),
  CardHeader: ({ children, className, ...props }: any) => (
    <div data-testid="card-header" className={className} {...props}>
      {children}
    </div>
  ),
  CardTitle: ({ children, className, ...props }: any) => (
    <div data-testid="card-title" className={className} {...props}>
      {children}
    </div>
  ),
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    onClick,
    disabled,
    variant,
    size,
    className,
    ...props
  }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      data-variant={variant}
      data-size={size}
      className={className}
      {...props}
    >
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className, ...props }: any) => (
    <span
      data-testid="badge"
      data-variant={variant}
      className={className}
      {...props}
    >
      {children}
    </span>
  ),
}));

jest.mock('@/components/ui/separator', () => ({
  Separator: (props: any) => <hr data-testid="separator" {...props} />,
}));

jest.mock('@/components/ui/alert', () => ({
  Alert: ({ children, variant, className, ...props }: any) => (
    <div
      data-testid="alert"
      data-variant={variant}
      className={className}
      {...props}
    >
      {children}
    </div>
  ),
  AlertDescription: ({ children, ...props }: any) => (
    <div data-testid="alert-description" {...props}>
      {children}
    </div>
  ),
}));

// Mock window.ipc for external link handling
Object.defineProperty(window, 'ipc', {
  value: {
    invoke: jest.fn(),
  },
  writable: true,
});

// Sample GPU options for testing
const mockAvailableGPU: GPUOption = {
  id: 'intel-arc-a770',
  displayName: 'Intel Arc A770',
  type: 'intel-discrete',
  status: 'available',
  performance: 'high',
  description: 'High-performance discrete GPU',
  driverVersion: '31.0.101.5381',
  memory: 16384,
  powerEfficiency: 'good',
  estimatedSpeed: '3-4x faster',
  openvinoCompatible: true,
};

const mockSetupRequiredGPU: GPUOption = {
  id: 'intel-arc-a380',
  displayName: 'Intel Arc A380',
  type: 'intel-discrete',
  status: 'requires-setup',
  performance: 'medium',
  description: 'Discrete GPU requiring driver setup',
  memory: 6144,
  powerEfficiency: 'good',
  estimatedSpeed: '2-3x faster',
  openvinoCompatible: true,
};

const mockUnavailableGPU: GPUOption = {
  id: 'old-gpu',
  displayName: 'Old GPU',
  type: 'intel-integrated',
  status: 'unavailable',
  performance: 'low',
  description: 'Unsupported GPU',
  memory: 'shared',
  powerEfficiency: 'excellent',
  openvinoCompatible: false,
};

const mockIntegratedGPU: GPUOption = {
  id: 'intel-xe-graphics',
  displayName: 'Intel Xe Graphics',
  type: 'intel-integrated',
  status: 'requires-setup',
  performance: 'medium',
  description: 'Integrated GPU requiring setup',
  memory: 'shared',
  powerEfficiency: 'excellent',
  openvinoCompatible: true,
};

describe('GPUSetupInstructions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Available GPU State', () => {
    it('shows ready-to-use message for available GPUs', () => {
      render(<GPUSetupInstructions gpu={mockAvailableGPU} />);

      expect(screen.getByTestId('alert')).toBeInTheDocument();
      expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
      expect(
        screen.getByText('Intel Arc A770 is ready to use'),
      ).toBeInTheDocument();
    });

    it('does not show setup instructions for available GPUs', () => {
      render(<GPUSetupInstructions gpu={mockAvailableGPU} />);

      expect(screen.queryByText('Setup Instructions')).not.toBeInTheDocument();
      expect(screen.queryByText('Requirements')).not.toBeInTheDocument();
    });
  });

  describe('Unavailable GPU State', () => {
    it('shows not supported message for unavailable GPUs', () => {
      render(<GPUSetupInstructions gpu={mockUnavailableGPU} />);

      expect(screen.getByTestId('alert')).toBeInTheDocument();
      expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument();
      expect(screen.getByText('Old GPU is not supported')).toBeInTheDocument();
    });

    it('applies destructive variant for unavailable GPUs', () => {
      render(<GPUSetupInstructions gpu={mockUnavailableGPU} />);

      expect(screen.getByTestId('alert')).toHaveAttribute(
        'data-variant',
        'destructive',
      );
    });
  });

  describe('Setup Required State', () => {
    it('renders full setup instructions for GPUs requiring setup', () => {
      render(<GPUSetupInstructions gpu={mockSetupRequiredGPU} />);

      expect(
        screen.getByText('Setup Instructions - Intel Arc A380'),
      ).toBeInTheDocument();
      const settingsIcons = screen.getAllByTestId('settings-icon');
      expect(settingsIcons.length).toBeGreaterThan(0);
    });

    it('shows setup required alert', () => {
      render(<GPUSetupInstructions gpu={mockSetupRequiredGPU} />);

      expect(
        screen.getByText('Setup required for Intel Arc A380'),
      ).toBeInTheDocument();
      const infoIcons = screen.getAllByTestId('info-icon');
      expect(infoIcons.length).toBeGreaterThan(0);
    });

    it('displays requirements section', () => {
      render(<GPUSetupInstructions gpu={mockSetupRequiredGPU} />);

      expect(screen.getByText('Requirements')).toBeInTheDocument();
      expect(
        screen.getByText('OpenVINO 2024.6.0 or later'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Windows 10/11 or Ubuntu 20.04+'),
      ).toBeInTheDocument();
    });

    it('shows appropriate requirements based on GPU type', () => {
      render(<GPUSetupInstructions gpu={mockSetupRequiredGPU} />);

      expect(
        screen.getByText('Intel Arc Graphics Driver 31.0.101.5000+'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('At least 6GB system memory recommended'),
      ).toBeInTheDocument();
    });

    it('shows integrated GPU requirements correctly', () => {
      render(<GPUSetupInstructions gpu={mockIntegratedGPU} />);

      expect(
        screen.getByText('Intel Graphics Driver 31.0.101.5000+'),
      ).toBeInTheDocument();
    });
  });

  describe('Platform Selection', () => {
    it('displays platform selection buttons', () => {
      render(<GPUSetupInstructions gpu={mockSetupRequiredGPU} />);

      expect(screen.getByText('Select Platform')).toBeInTheDocument();
      expect(screen.getByText('Windows')).toBeInTheDocument();
      expect(screen.getByText('Linux')).toBeInTheDocument();
      expect(screen.getByText('General')).toBeInTheDocument();
    });

    it('defaults to Windows platform', () => {
      render(<GPUSetupInstructions gpu={mockSetupRequiredGPU} />);

      const windowsButton = screen.getByText('Windows');
      expect(windowsButton).toBeInTheDocument();
      // Check that Windows instructions are visible
      expect(
        screen.getByText('Download and run the Intel Graphics installer'),
      ).toBeInTheDocument();
    });

    it('switches to Linux platform when clicked', () => {
      render(<GPUSetupInstructions gpu={mockSetupRequiredGPU} />);

      const linuxButton = screen.getByText('Linux');
      fireEvent.click(linuxButton);

      expect(
        screen.getByText(
          'Add Intel graphics repository to your package manager',
        ),
      ).toBeInTheDocument();
    });

    it('switches to General platform when clicked', () => {
      render(<GPUSetupInstructions gpu={mockSetupRequiredGPU} />);

      const generalButton = screen.getByText('General');
      fireEvent.click(generalButton);

      expect(
        screen.getByText('Visit Intel support website for drivers'),
      ).toBeInTheDocument();
    });
  });

  describe('Driver Setup Instructions', () => {
    it('displays Intel driver setup section', () => {
      render(<GPUSetupInstructions gpu={mockSetupRequiredGPU} />);

      expect(
        screen.getByText('Step 1: Intel Driver Setup'),
      ).toBeInTheDocument();
      const downloadIcons = screen.getAllByTestId('download-icon');
      expect(downloadIcons.length).toBeGreaterThan(0);
    });

    it('shows driver download step with external link', () => {
      render(<GPUSetupInstructions gpu={mockSetupRequiredGPU} />);

      expect(
        screen.getByText('Download Intel Arc Drivers'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Download the latest Intel Arc GPU drivers'),
      ).toBeInTheDocument();
      expect(screen.getByText('Download Drivers')).toBeInTheDocument();
    });

    it('displays all driver setup steps', () => {
      render(<GPUSetupInstructions gpu={mockSetupRequiredGPU} />);

      expect(screen.getByText('Install Drivers')).toBeInTheDocument();
      expect(screen.getByText('Restart System')).toBeInTheDocument();
      expect(
        screen.getByText('Verify Driver Installation'),
      ).toBeInTheDocument();
    });

    it('shows step numbers for uncompleted steps', () => {
      render(<GPUSetupInstructions gpu={mockSetupRequiredGPU} />);

      // Look for step numbers in the UI
      const stepNumbers = screen.getAllByText(/^[1-4]$/);
      expect(stepNumbers.length).toBeGreaterThan(0);
    });

    it('handles step completion', () => {
      render(<GPUSetupInstructions gpu={mockSetupRequiredGPU} />);

      const markCompleteButtons = screen.getAllByText('Mark Complete');
      expect(markCompleteButtons.length).toBeGreaterThan(0);

      fireEvent.click(markCompleteButtons[0]);

      // Should show check circle for completed step
      const checkCircleIcons = screen.getAllByTestId('check-circle-icon');
      expect(checkCircleIcons.length).toBeGreaterThan(0);
    });
  });

  describe('OpenVINO Setup Instructions', () => {
    it('displays OpenVINO setup section', () => {
      render(<GPUSetupInstructions gpu={mockSetupRequiredGPU} />);

      expect(screen.getByText('Step 2: OpenVINO Setup')).toBeInTheDocument();
      const packageIcons = screen.getAllByTestId('package-icon');
      expect(packageIcons.length).toBeGreaterThan(0);
    });

    it('shows OpenVINO installation steps', () => {
      render(<GPUSetupInstructions gpu={mockSetupRequiredGPU} />);

      expect(screen.getByText('Install OpenVINO Toolkit')).toBeInTheDocument();
      expect(screen.getByText('Install Python Bindings')).toBeInTheDocument();
      expect(screen.getByText('Verify Installation')).toBeInTheDocument();
    });

    it('displays pip install command badge', () => {
      render(<GPUSetupInstructions gpu={mockSetupRequiredGPU} />);

      expect(screen.getByText('pip install openvino')).toBeInTheDocument();
    });

    it('provides external download links', () => {
      render(<GPUSetupInstructions gpu={mockSetupRequiredGPU} />);

      const downloadButtons = screen.getAllByText('Download OpenVINO');
      expect(downloadButtons.length).toBeGreaterThan(0);
    });
  });

  describe('External Link Handling', () => {
    it('opens external links through IPC', () => {
      render(<GPUSetupInstructions gpu={mockSetupRequiredGPU} />);

      const downloadButton = screen.getByText('Download Drivers');
      fireEvent.click(downloadButton);

      expect(window.ipc.invoke).toHaveBeenCalledWith(
        'openExternal',
        'https://www.intel.com/content/www/us/en/support/articles/000090440/graphics.html',
      );
    });

    it('opens different links for integrated GPUs', () => {
      render(<GPUSetupInstructions gpu={mockIntegratedGPU} />);

      const downloadButton = screen.getByText('Download Drivers');
      fireEvent.click(downloadButton);

      expect(window.ipc.invoke).toHaveBeenCalledWith(
        'openExternal',
        'https://www.intel.com/content/www/us/en/support/detect.html',
      );
    });
  });

  describe('Setup Validation', () => {
    it('displays setup validation section', () => {
      render(<GPUSetupInstructions gpu={mockSetupRequiredGPU} />);

      expect(screen.getByText('Validate Setup')).toBeInTheDocument();
      expect(screen.getByText('Test GPU Setup')).toBeInTheDocument();
      expect(
        screen.getByText('Verify that your GPU is working correctly'),
      ).toBeInTheDocument();
    });

    it('handles setup validation click', async () => {
      const mockOnSetupValidation = jest.fn();
      render(
        <GPUSetupInstructions
          gpu={mockSetupRequiredGPU}
          onSetupValidation={mockOnSetupValidation}
        />,
      );

      const testButton = screen.getByText('Test Setup');
      fireEvent.click(testButton);

      expect(screen.getByText('Validating...')).toBeInTheDocument();
      expect(testButton).toBeDisabled();

      await waitFor(
        () => {
          expect(mockOnSetupValidation).toHaveBeenCalled();
        },
        { timeout: 3000 },
      );
    });

    it('shows validation progress with spinner', () => {
      render(<GPUSetupInstructions gpu={mockSetupRequiredGPU} />);

      const testButton = screen.getByText('Test Setup');
      fireEvent.click(testButton);

      expect(screen.getByText('Validating...')).toBeInTheDocument();
      // The spinner should be present in the button
      const validatingButton = screen.getByText('Validating...');
      expect(validatingButton.closest('button')).toBeDisabled();
    });
  });

  describe('Platform-Specific Instructions', () => {
    it('shows Windows-specific instructions by default', () => {
      render(<GPUSetupInstructions gpu={mockSetupRequiredGPU} />);

      expect(screen.getByText('Windows Instructions')).toBeInTheDocument();
      expect(
        screen.getByText('Download and run the Intel Graphics installer'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Follow the installation wizard'),
      ).toBeInTheDocument();
    });

    it('shows Linux-specific instructions when selected', () => {
      render(<GPUSetupInstructions gpu={mockSetupRequiredGPU} />);

      fireEvent.click(screen.getByText('Linux'));

      expect(screen.getByText('Linux Instructions')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Add Intel graphics repository to your package manager',
        ),
      ).toBeInTheDocument();
    });

    it('numbers platform instructions correctly', () => {
      render(<GPUSetupInstructions gpu={mockSetupRequiredGPU} />);

      const instructionSteps = screen.getAllByText(/^[1-4]$/);
      expect(instructionSteps.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility and UX', () => {
    it('applies custom className when provided', () => {
      render(
        <GPUSetupInstructions
          gpu={mockSetupRequiredGPU}
          className="custom-class"
        />,
      );

      expect(screen.getByTestId('card')).toHaveClass('custom-class');
    });

    it('provides appropriate ARIA labels and semantic structure', () => {
      render(<GPUSetupInstructions gpu={mockSetupRequiredGPU} />);

      expect(screen.getByTestId('card-header')).toBeInTheDocument();
      expect(screen.getByTestId('card-content')).toBeInTheDocument();
    });

    it('includes separators for visual organization', () => {
      render(<GPUSetupInstructions gpu={mockSetupRequiredGPU} />);

      const separators = screen.getAllByTestId('separator');
      expect(separators.length).toBeGreaterThan(3);
    });

    it('displays icons consistently throughout interface', () => {
      render(<GPUSetupInstructions gpu={mockSetupRequiredGPU} />);

      // All these icons appear multiple times in the interface
      const settingsIcons = screen.getAllByTestId('settings-icon');
      expect(settingsIcons.length).toBeGreaterThan(0);

      const downloadIcons = screen.getAllByTestId('download-icon');
      expect(downloadIcons.length).toBeGreaterThan(0);

      const packageIcons = screen.getAllByTestId('package-icon');
      expect(packageIcons.length).toBeGreaterThan(0);

      const playCircleIcons = screen.getAllByTestId('play-circle-icon');
      expect(playCircleIcons.length).toBeGreaterThan(0);
    });

    it('provides helpful note at the end', () => {
      render(<GPUSetupInstructions gpu={mockSetupRequiredGPU} />);

      expect(screen.getByText('Note:')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Please ensure all requirements are met before proceeding',
        ),
      ).toBeInTheDocument();
    });
  });
});
