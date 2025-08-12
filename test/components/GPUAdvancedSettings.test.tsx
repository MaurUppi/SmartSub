/**
 * GPUAdvancedSettings Test Suite
 *
 * Comprehensive tests for the GPUAdvancedSettings component.
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
  GPUAdvancedSettings,
  GPUOption,
} from '../../renderer/components/GPUAdvancedSettings';
import { toast } from 'sonner';
import {
  runComponentTestSuite,
  createStandardScenarios,
  testComponentVariants,
  ComponentTestConfig,
  PropValidationTest,
  AccessibilityTestConfig,
  PerformanceTestConfig,
} from '../utils/componentTestHelpers';

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
  },
}));

// Mock next-i18next
jest.mock('next-i18next', () => ({
  useTranslation: () => ({
    t: function (key, params) {
      const translations: Record<string, string> = {
        advancedSettings: 'Advanced Settings',
        reset: 'Reset',
        save: 'Save',
        cacheConfiguration: 'Cache Configuration',
        cacheDirectory: 'Cache Directory',
        cacheDirTooltip: 'Directory where OpenVINO stores cached models',
        cacheDirPlaceholder: 'E.g., C:\\openvino\\cache',
        browse: 'Browse',
        enableCaching: 'Enable Caching',
        enableCachingTooltip: 'Cache compiled models for faster loading',
        enableModelCaching: 'Enable Model Caching',
        enableModelCachingTooltip: 'Cache individual model optimizations',
        devicePreferences: 'Device Preferences',
        devicePreference: 'Device Preference',
        devicePreferenceTooltip: 'Preferred GPU type for OpenVINO inference',
        autoDetect: 'Auto Detect',
        autoDetectDescription: 'Automatically select best available device',
        discreteGPU: 'Discrete GPU',
        discreteGPUPreference: 'Prefer discrete/dedicated GPUs',
        integratedGPU: 'Integrated GPU',
        integratedGPUPreference: 'Prefer integrated/shared GPUs',
        performanceOptimization: 'Performance Optimization',
        enableOptimizations: 'Enable Optimizations',
        enableOptimizationsTooltip: 'Enable OpenVINO performance optimizations',
        enableDynamicShapes: 'Enable Dynamic Shapes',
        enableDynamicShapesTooltip: 'Support for variable input dimensions',
        numThreads: 'Number of Threads',
        numThreadsTooltip: 'Number of CPU threads for inference',
        debugAndLogging: 'Debug and Logging',
        logLevel: 'Log Level',
        logLevelTooltip: 'Verbosity level for OpenVINO logging',
        errorLevel: 'Error',
        errorLevelDescription: 'Only show error messages',
        warningLevel: 'Warning',
        warningLevelDescription: 'Show warnings and errors',
        infoLevel: 'Info',
        infoLevelDescription: 'Show informational messages',
        debugLevel: 'Debug',
        debugLevelDescription: 'Show all debug information',
        enableTelemetry: 'Enable Telemetry',
        enableTelemetryTooltip: 'Send anonymous usage data to Intel',
        advancedSettingsNotAvailable:
          'Advanced settings are not available for this GPU',
        cacheDirRequired: 'Cache directory is required',
        cacheDirTooLong: 'Cache directory path is too long',
        cacheDirInvalidChars: 'Cache directory contains invalid characters',
        threadsInvalidRange: 'Number of threads must be between 1 and 32',
        fixValidationErrors: 'Please fix validation errors before saving',
        advancedSettingsSaved: 'Advanced settings saved successfully',
        advancedSettingsSaveFailed: 'Failed to save advanced settings',
        settingsResetToDefaults: 'Settings reset to defaults',
        cacheDirSelectionFailed: 'Failed to select cache directory',
        unsavedChanges: 'You have unsaved changes',
        validationErrorsExist: 'Please fix the validation errors below',
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
  Settings: () => <div data-testid="settings-icon">Settings</div>,
  Folder: () => <div data-testid="folder-icon">Folder</div>,
  RotateCcw: () => <div data-testid="rotate-ccw-icon">RotateCcw</div>,
  HelpCircle: () => <div data-testid="help-circle-icon">HelpCircle</div>,
  Save: () => <div data-testid="save-icon">Save</div>,
  Zap: () => <div data-testid="zap-icon">Zap</div>,
  HardDrive: () => <div data-testid="hard-drive-icon">HardDrive</div>,
  Monitor: () => <div data-testid="monitor-icon">Monitor</div>,
  AlertTriangle: () => (
    <div data-testid="alert-triangle-icon">AlertTriangle</div>
  ),
  CheckCircle: () => <div data-testid="check-circle-icon">CheckCircle</div>,
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
      disabled={Boolean(disabled)}
      data-variant={variant}
      data-size={size}
      className={className}
      {...props}
    >
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input data-testid="input" {...props} />,
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ children, htmlFor, ...props }: any) => (
    <label htmlFor={htmlFor} {...props}>
      {children}
    </label>
  ),
}));

jest.mock('@/components/ui/switch', () => ({
  Switch: ({ checked, onCheckedChange, id, ...props }: any) => (
    <input
      type="checkbox"
      data-testid="switch"
      id={id}
      checked={checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      {...props}
    />
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

jest.mock('@/components/ui/select', () => ({
  Select: ({ children, onValueChange, value, disabled, ...props }: any) => (
    <div
      data-testid="select"
      data-value={value}
      data-disabled={disabled}
      {...props}
    >
      {React.Children.map(children, (child) =>
        React.cloneElement(child, { onValueChange, disabled }),
      )}
    </div>
  ),
  SelectContent: ({ children, onValueChange, disabled, ...props }: any) => {
    // Pass down the props to children, filtering invalid DOM props
    const { value, ...validProps } = props;
    return (
      <div data-testid="select-content" {...validProps}>
        {React.Children.map(children, (child) => {
          // Preserve child's own disabled prop if it exists, otherwise use parent disabled
          const childDisabled =
            child.props.disabled !== undefined
              ? child.props.disabled
              : disabled;
          return React.cloneElement(child, {
            onValueChange,
            disabled: childDisabled,
          });
        })}
      </div>
    );
  },
  SelectItem: ({
    children,
    value,
    onValueChange,
    disabled,
    className,
    ...props
  }: any) => {
    return (
      <button
        data-testid={`select-item-${value}`}
        onClick={() => onValueChange?.(value)}
        disabled={disabled}
        className={className}
        {...props}
      >
        {children}
      </button>
    );
  },
  SelectTrigger: ({ children, ...props }: any) => {
    // Remove invalid props that React doesn't recognize
    const { onValueChange, value, disabled, ...validProps } = props;
    return (
      <div data-testid="select-trigger" {...validProps}>
        {children}
      </div>
    );
  },
  SelectValue: ({ placeholder, ...props }: any) => (
    <span data-testid="select-value" {...props}>
      {placeholder}
    </span>
  ),
}));

jest.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: any) => <div>{children}</div>,
  Tooltip: ({ children }: any) => <div>{children}</div>,
  TooltipTrigger: ({ children }: any) => <div>{children}</div>,
  TooltipContent: ({ children }: any) => (
    <div data-testid="tooltip-content">{children}</div>
  ),
}));

// Mock window.ipc
Object.defineProperty(window, 'ipc', {
  value: {
    invoke: jest.fn(),
  },
  writable: true,
});

// Sample GPU options for testing
const mockCompatibleGPU: GPUOption = {
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

const mockIncompatibleGPU: GPUOption = {
  id: 'nvidia-rtx-4080',
  displayName: 'NVIDIA GeForce RTX 4080',
  type: 'nvidia',
  status: 'available',
  performance: 'high',
  description: 'High-performance NVIDIA GPU',
  driverVersion: '537.13',
  memory: 16384,
  powerEfficiency: 'good',
  estimatedSpeed: '4-5x faster',
  openvinoCompatible: false,
};

const mockIntegratedGPU: GPUOption = {
  id: 'intel-xe-graphics',
  displayName: 'Intel Xe Graphics',
  type: 'intel-integrated',
  status: 'available',
  performance: 'medium',
  description: 'Integrated GPU',
  memory: 'shared',
  powerEfficiency: 'excellent',
  openvinoCompatible: true,
};

// ============================================================================
// STANDARDIZED COMPONENT LIFECYCLE TESTING - Phase 1.1.3
// ============================================================================

const componentConfig: ComponentTestConfig<any> = {
  component: GPUAdvancedSettings,
  defaultProps: { selectedGPU: mockCompatibleGPU },
  testId: 'card',
  displayName: 'GPUAdvancedSettings',
};

const propValidationTests: PropValidationTest<any>[] = [
  {
    propName: 'selectedGPU',
    validValues: [mockCompatibleGPU, mockIntegratedGPU, null],
    invalidValues: ['invalid', 123, {}, []],
    customValidator: async (propValue, renderResult) => {
      if (propValue && propValue.openvinoCompatible) {
        // Should show settings for compatible GPU
        expect(
          within(renderResult.container).getByText('Advanced Settings'),
        ).toBeInTheDocument();
      } else {
        // Should show not available message for incompatible GPU
        expect(
          within(renderResult.container).getByText(
            'Advanced settings are not available for this GPU',
          ),
        ).toBeInTheDocument();
      }
    },
  },
  {
    propName: 'onSettingsChange',
    validValues: [jest.fn(), () => {}, undefined],
    invalidValues: ['not a function', 123, {}],
  },
  {
    propName: 'className',
    validValues: ['', 'custom-class', 'multiple classes here'],
    invalidValues: [123, {}, [], null],
  },
];

const accessibilityConfig: AccessibilityTestConfig = {
  skipAxeCheck: false,
  skipAriaLabels: false,
  skipKeyboardNavigation: false,
  skipFocusManagement: false,
  focusableElements: ['button', 'input', '[role="combobox"]', 'select'],
  ariaLabels: ['Cache Directory', 'Enable Caching', 'Number of Threads'],
};

const performanceConfig: PerformanceTestConfig = {
  maxRenderTime: 200, // Settings component may be slower due to form elements
  maxMemoryUsage: 150000,
  rerenderCount: 3,
  skipMemoryLeakDetection: false,
};

// Run standardized component test suite
runComponentTestSuite(componentConfig, {
  propTests: propValidationTests,
  scenarios: [
    ...createStandardScenarios({ selectedGPU: mockCompatibleGPU }),
    {
      name: 'should handle cache directory browse',
      test: async (result, utils) => {
        const browseButton = within(result.container).getByText('Browse');
        utils.fireEvent.click(browseButton);
        // Should not crash when browse is clicked
        expect(browseButton).toBeInTheDocument();
      },
    },
    {
      name: 'should validate form inputs',
      test: async (result, utils) => {
        const cacheDirInput = within(result.container).getByLabelText(
          'Cache Directory',
        );
        utils.fireEvent.change(cacheDirInput, { target: { value: '' } });
        utils.fireEvent.blur(cacheDirInput);

        await utils.waitFor(() => {
          expect(
            within(result.container).getByText('Cache directory is required'),
          ).toBeInTheDocument();
        });
      },
    },
  ],
  accessibilityConfig,
  performanceConfig,
});

// Test component variants with different GPU configurations
testComponentVariants(componentConfig, [
  {
    name: 'with compatible discrete GPU',
    props: { selectedGPU: mockCompatibleGPU },
  },
  {
    name: 'with compatible integrated GPU',
    props: { selectedGPU: mockIntegratedGPU },
  },
  {
    name: 'with incompatible GPU',
    props: { selectedGPU: mockIncompatibleGPU },
  },
  { name: 'with no GPU selected', props: { selectedGPU: null } },
  {
    name: 'with custom class',
    props: { selectedGPU: mockCompatibleGPU, className: 'custom-settings' },
  },
]);

describe('GPUAdvancedSettings', () => {
  beforeEach(async () => {
    jest.clearAllMocks();

    // Set up default IPC mock responses
    (window.ipc.invoke as jest.Mock).mockImplementation((channel) => {
      if (channel === 'getOpenVINOSettings') {
        return Promise.resolve({}); // Return empty settings by default
      }
      if (channel === 'setOpenVINOSettings') {
        return Promise.resolve(true);
      }
      if (channel === 'selectDirectory') {
        return Promise.resolve({ canceled: true, filePaths: [] });
      }
      return Promise.resolve({});
    });

    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });
  });

  describe('Visibility Control', () => {
    it('shows settings for compatible discrete GPU', async () => {
      render(<GPUAdvancedSettings selectedGPU={mockCompatibleGPU} />);

      await waitFor(
        () => {
          expect(screen.getByText('Advanced Settings')).toBeInTheDocument();
          const settingsIcons = screen.getAllByTestId('settings-icon');
          expect(settingsIcons.length).toBeGreaterThan(0);
        },
        { timeout: 3000 },
      );
    });

    it('shows settings for compatible integrated GPU', async () => {
      render(<GPUAdvancedSettings selectedGPU={mockIntegratedGPU} />);

      await waitFor(() => {
        expect(screen.getByText('Advanced Settings')).toBeInTheDocument();
      });
    });

    it('hides settings for incompatible GPU', async () => {
      render(<GPUAdvancedSettings selectedGPU={mockIncompatibleGPU} />);

      await waitFor(() => {
        expect(screen.getByTestId('alert')).toBeInTheDocument();
        expect(
          screen.getByText('Advanced settings are not available for this GPU'),
        ).toBeInTheDocument();
      });
    });

    it('hides settings when no GPU is selected', async () => {
      render(<GPUAdvancedSettings selectedGPU={null} />);

      await waitFor(() => {
        expect(screen.getByTestId('alert')).toBeInTheDocument();
        expect(
          screen.getByText('Advanced settings are not available for this GPU'),
        ).toBeInTheDocument();
      });
    });
  });

  describe('Cache Configuration', () => {
    it('displays cache configuration section', async () => {
      render(<GPUAdvancedSettings selectedGPU={mockCompatibleGPU} />);

      await waitFor(
        () => {
          expect(screen.getByText('Cache Configuration')).toBeInTheDocument();
          expect(screen.getByTestId('hard-drive-icon')).toBeInTheDocument();
        },
        { timeout: 3000 },
      );
    });

    it('shows cache directory input with browse button', async () => {
      render(<GPUAdvancedSettings selectedGPU={mockCompatibleGPU} />);

      await waitFor(
        () => {
          expect(screen.getByLabelText('Cache Directory')).toBeInTheDocument();
          expect(screen.getByText('Browse')).toBeInTheDocument();
          expect(screen.getByTestId('folder-icon')).toBeInTheDocument();
        },
        { timeout: 3000 },
      );
    });

    it('handles cache directory selection', async () => {
      (window.ipc.invoke as jest.Mock).mockResolvedValue({
        canceled: false,
        filePaths: ['/path/to/cache'],
      });

      render(<GPUAdvancedSettings selectedGPU={mockCompatibleGPU} />);

      const browseButton = screen.getByText('Browse');
      fireEvent.click(browseButton);

      await waitFor(() => {
        expect(window.ipc.invoke).toHaveBeenCalledWith('selectDirectory');
      });
    });

    it('handles browse cancellation gracefully', async () => {
      (window.ipc.invoke as jest.Mock).mockResolvedValue({
        canceled: true,
        filePaths: [],
      });

      render(<GPUAdvancedSettings selectedGPU={mockCompatibleGPU} />);

      const browseButton = screen.getByText('Browse');
      fireEvent.click(browseButton);

      await waitFor(() => {
        expect(window.ipc.invoke).toHaveBeenCalledWith('selectDirectory');
      });

      // Should not show error toast for cancellation
      expect(toast.error).not.toHaveBeenCalled();
    });

    it('shows caching toggle switches', async () => {
      render(<GPUAdvancedSettings selectedGPU={mockCompatibleGPU} />);

      await waitFor(
        () => {
          expect(screen.getByLabelText('Enable Caching')).toBeInTheDocument();
          expect(
            screen.getByLabelText('Enable Model Caching'),
          ).toBeInTheDocument();
        },
        { timeout: 3000 },
      );
    });

    it('toggles caching settings', async () => {
      render(<GPUAdvancedSettings selectedGPU={mockCompatibleGPU} />);

      await waitFor(
        () => {
          const enableCachingSwitch = screen.getByLabelText('Enable Caching');
          fireEvent.click(enableCachingSwitch);
          expect(enableCachingSwitch).toBeChecked();
        },
        { timeout: 3000 },
      );
    });
  });

  describe('Device Preferences', () => {
    it('displays device preferences section', async () => {
      render(<GPUAdvancedSettings selectedGPU={mockCompatibleGPU} />);

      await waitFor(
        () => {
          expect(screen.getByText('Device Preferences')).toBeInTheDocument();
          expect(screen.getByTestId('monitor-icon')).toBeInTheDocument();
        },
        { timeout: 3000 },
      );
    });

    it('shows device preference dropdown', async () => {
      render(<GPUAdvancedSettings selectedGPU={mockCompatibleGPU} />);

      await waitFor(
        () => {
          expect(screen.getByText('Device Preference')).toBeInTheDocument();
          expect(screen.getByTestId('select')).toBeInTheDocument();
        },
        { timeout: 3000 },
      );
    });

    it('displays device preference options', async () => {
      render(<GPUAdvancedSettings selectedGPU={mockCompatibleGPU} />);

      await waitFor(
        () => {
          expect(screen.getByTestId('select-item-auto')).toBeInTheDocument();
          expect(
            screen.getByTestId('select-item-discrete'),
          ).toBeInTheDocument();
          expect(
            screen.getByTestId('select-item-integrated'),
          ).toBeInTheDocument();
        },
        { timeout: 3000 },
      );
    });

    it('handles device preference selection', async () => {
      render(<GPUAdvancedSettings selectedGPU={mockCompatibleGPU} />);

      await waitFor(
        () => {
          const discreteOption = screen.getByTestId('select-item-discrete');
          fireEvent.click(discreteOption);

          expect(screen.getByTestId('select')).toHaveAttribute(
            'data-value',
            'discrete',
          );
        },
        { timeout: 3000 },
      );
    });
  });

  describe('Performance Optimization', () => {
    it('displays performance optimization section', async () => {
      render(<GPUAdvancedSettings selectedGPU={mockCompatibleGPU} />);

      await waitFor(
        () => {
          expect(
            screen.getByText('Performance Optimization'),
          ).toBeInTheDocument();
          expect(screen.getByTestId('zap-icon')).toBeInTheDocument();
        },
        { timeout: 3000 },
      );
    });

    it('shows optimization toggles', async () => {
      render(<GPUAdvancedSettings selectedGPU={mockCompatibleGPU} />);

      await waitFor(
        () => {
          expect(
            screen.getByLabelText('Enable Optimizations'),
          ).toBeInTheDocument();
          expect(
            screen.getByLabelText('Enable Dynamic Shapes'),
          ).toBeInTheDocument();
        },
        { timeout: 3000 },
      );
    });

    it('shows number of threads input', async () => {
      render(<GPUAdvancedSettings selectedGPU={mockCompatibleGPU} />);

      await waitFor(
        () => {
          expect(
            screen.getByLabelText('Number of Threads'),
          ).toBeInTheDocument();
        },
        { timeout: 3000 },
      );
    });

    it('handles thread count changes', async () => {
      render(<GPUAdvancedSettings selectedGPU={mockCompatibleGPU} />);

      await waitFor(
        () => {
          const threadsInput = screen.getByLabelText('Number of Threads');
          fireEvent.change(threadsInput, { target: { value: '8' } });
          expect(threadsInput).toHaveValue(8);
        },
        { timeout: 3000 },
      );
    });

    it('toggles optimization settings', async () => {
      render(<GPUAdvancedSettings selectedGPU={mockCompatibleGPU} />);

      await waitFor(
        () => {
          const optimizationsSwitch = screen.getByLabelText(
            'Enable Optimizations',
          );
          fireEvent.click(optimizationsSwitch);
          expect(optimizationsSwitch).toBeChecked();
        },
        { timeout: 3000 },
      );
    });
  });

  describe('Debug and Logging', () => {
    it('displays debug and logging section', async () => {
      render(<GPUAdvancedSettings selectedGPU={mockCompatibleGPU} />);

      await waitFor(
        () => {
          expect(screen.getByText('Debug and Logging')).toBeInTheDocument();
        },
        { timeout: 3000 },
      );
    });

    it('shows log level dropdown', async () => {
      render(<GPUAdvancedSettings selectedGPU={mockCompatibleGPU} />);

      await waitFor(() => {
        expect(screen.getByText('Log Level')).toBeInTheDocument();
      });
    });

    it('displays log level options', async () => {
      render(<GPUAdvancedSettings selectedGPU={mockCompatibleGPU} />);

      await waitFor(
        () => {
          expect(screen.getByTestId('select-item-error')).toBeInTheDocument();
          expect(screen.getByTestId('select-item-warning')).toBeInTheDocument();
          expect(screen.getByTestId('select-item-info')).toBeInTheDocument();
          expect(screen.getByTestId('select-item-debug')).toBeInTheDocument();
        },
        { timeout: 3000 },
      );
    });

    it('shows telemetry toggle', async () => {
      render(<GPUAdvancedSettings selectedGPU={mockCompatibleGPU} />);

      await waitFor(
        () => {
          expect(screen.getByLabelText('Enable Telemetry')).toBeInTheDocument();
        },
        { timeout: 3000 },
      );
    });

    it('handles log level selection', async () => {
      render(<GPUAdvancedSettings selectedGPU={mockCompatibleGPU} />);

      await waitFor(() => {
        const debugOption = screen.getByTestId('select-item-debug');
        fireEvent.click(debugOption);
        // Should update the select value
        expect(screen.getByTestId('select')).toBeTruthy();
      });
    });
  });

  describe('Validation', () => {
    it('validates cache directory input', async () => {
      render(<GPUAdvancedSettings selectedGPU={mockCompatibleGPU} />);

      await waitFor(
        () => {
          expect(screen.getByText('Cache Directory')).toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      const cacheDirInput = screen.getByPlaceholderText(
        'E.g., C:\\openvino\\cache',
      );

      // Test empty directory
      fireEvent.change(cacheDirInput, { target: { value: '' } });
      fireEvent.blur(cacheDirInput);

      await waitFor(
        () => {
          expect(
            screen.getByText('Cache directory is required'),
          ).toBeInTheDocument();
        },
        { timeout: 3000 },
      );
    });

    it('validates thread count range', async () => {
      render(<GPUAdvancedSettings selectedGPU={mockCompatibleGPU} />);

      await waitFor(() => {
        const threadsInput = screen.getByLabelText('Number of Threads');

        // Test invalid range
        fireEvent.change(threadsInput, { target: { value: '50' } });
        fireEvent.blur(threadsInput);
      });

      await waitFor(() => {
        expect(
          screen.getByText('Number of threads must be between 1 and 32'),
        ).toBeInTheDocument();
      });
    });

    it('validates cache directory path length', async () => {
      render(<GPUAdvancedSettings selectedGPU={mockCompatibleGPU} />);

      await waitFor(() => {
        const cacheDirInput = screen.getByLabelText('Cache Directory');
        const longPath = 'a'.repeat(300);

        fireEvent.change(cacheDirInput, { target: { value: longPath } });
        fireEvent.blur(cacheDirInput);
      });

      await waitFor(() => {
        expect(
          screen.getByText('Cache directory path is too long'),
        ).toBeInTheDocument();
      });
    });

    it('validates cache directory invalid characters', async () => {
      render(<GPUAdvancedSettings selectedGPU={mockCompatibleGPU} />);

      await waitFor(() => {
        const cacheDirInput = screen.getByLabelText('Cache Directory');

        fireEvent.change(cacheDirInput, { target: { value: '/path<>:"|?*' } });
        fireEvent.blur(cacheDirInput);
      });

      await waitFor(() => {
        expect(
          screen.getByText('Cache directory contains invalid characters'),
        ).toBeInTheDocument();
      });
    });
  });

  describe('Save and Reset Functionality', () => {
    it('shows save and reset buttons', async () => {
      render(<GPUAdvancedSettings selectedGPU={mockCompatibleGPU} />);

      await waitFor(
        () => {
          expect(screen.getByText('Save')).toBeInTheDocument();
          expect(screen.getByText('Reset')).toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      const saveIcons = screen.getAllByTestId('save-icon');
      expect(saveIcons.length).toBeGreaterThan(0);
      const rotateIcons = screen.getAllByTestId('rotate-ccw-icon');
      expect(rotateIcons.length).toBeGreaterThan(0);
    });

    it('disables save button when no changes made', async () => {
      render(<GPUAdvancedSettings selectedGPU={mockCompatibleGPU} />);

      await waitFor(
        () => {
          const saveButton = screen.getByText('Save');
          expect(saveButton).toBeDisabled();
        },
        { timeout: 3000 },
      );
    });

    it('enables save button when changes are made', async () => {
      render(<GPUAdvancedSettings selectedGPU={mockCompatibleGPU} />);

      await waitFor(() => {
        const cacheDirInput = screen.getByLabelText('Cache Directory');
        fireEvent.change(cacheDirInput, { target: { value: '/new/path' } });
      });

      await waitFor(() => {
        const saveButton = screen.getByText('Save');
        expect(saveButton).not.toBeDisabled();
      });
    });

    it('handles save operation successfully', async () => {
      (window.ipc.invoke as jest.Mock).mockResolvedValue(true);

      render(<GPUAdvancedSettings selectedGPU={mockCompatibleGPU} />);

      await waitFor(() => {
        const cacheDirInput = screen.getByLabelText('Cache Directory');
        fireEvent.change(cacheDirInput, { target: { value: '/valid/path' } });
      });

      await waitFor(() => {
        const saveButton = screen.getByText('Save');
        fireEvent.click(saveButton);
      });

      await waitFor(
        () => {
          expect(window.ipc.invoke).toHaveBeenCalledWith(
            'setOpenVINOSettings',
            expect.any(Object),
          );
          expect(toast.success).toHaveBeenCalledWith(
            'Advanced settings saved successfully',
          );
        },
        { timeout: 3000 },
      );
    });

    it('handles save operation failure', async () => {
      (window.ipc.invoke as jest.Mock).mockRejectedValue(
        new Error('Save failed'),
      );

      render(<GPUAdvancedSettings selectedGPU={mockCompatibleGPU} />);

      await waitFor(() => {
        const cacheDirInput = screen.getByLabelText('Cache Directory');
        fireEvent.change(cacheDirInput, { target: { value: '/valid/path' } });
      });

      await waitFor(() => {
        const saveButton = screen.getByText('Save');
        fireEvent.click(saveButton);
      });

      await waitFor(
        () => {
          expect(toast.error).toHaveBeenCalledWith(
            'Failed to save advanced settings',
          );
        },
        { timeout: 3000 },
      );
    });

    it('resets settings to defaults', async () => {
      render(<GPUAdvancedSettings selectedGPU={mockCompatibleGPU} />);

      await waitFor(
        () => {
          const resetButton = screen.getByText('Reset');
          fireEvent.click(resetButton);
          expect(toast.info).toHaveBeenCalledWith('Settings reset to defaults');
        },
        { timeout: 3000 },
      );
    });

    it('prevents save with validation errors', async () => {
      render(<GPUAdvancedSettings selectedGPU={mockCompatibleGPU} />);

      await waitFor(() => {
        const cacheDirInput = screen.getByLabelText('Cache Directory');
        fireEvent.change(cacheDirInput, { target: { value: '' } });
      });

      await waitFor(() => {
        const saveButton = screen.getByText('Save');
        fireEvent.click(saveButton);
        expect(toast.error).toHaveBeenCalledWith(
          'Please fix validation errors before saving',
        );
      });
    });
  });

  describe('Settings Persistence', () => {
    it('loads settings from storage on mount', async () => {
      const mockSettings = {
        cacheDir: '/existing/path',
        enableCaching: false,
        numThreads: 8,
      };

      (window.ipc.invoke as jest.Mock).mockResolvedValue(mockSettings);

      render(<GPUAdvancedSettings selectedGPU={mockCompatibleGPU} />);

      await waitFor(
        () => {
          expect(window.ipc.invoke).toHaveBeenCalledWith('getOpenVINOSettings');
        },
        { timeout: 3000 },
      );
    });

    it('calls onSettingsChange callback when settings are saved', async () => {
      const mockOnSettingsChange = jest.fn();
      (window.ipc.invoke as jest.Mock).mockResolvedValue(true);

      render(
        <GPUAdvancedSettings
          selectedGPU={mockCompatibleGPU}
          onSettingsChange={mockOnSettingsChange}
        />,
      );

      await waitFor(() => {
        const cacheDirInput = screen.getByLabelText('Cache Directory');
        fireEvent.change(cacheDirInput, { target: { value: '/valid/path' } });
      });

      await waitFor(() => {
        const saveButton = screen.getByText('Save');
        fireEvent.click(saveButton);
      });

      await waitFor(
        () => {
          expect(mockOnSettingsChange).toHaveBeenCalledWith(expect.any(Object));
        },
        { timeout: 3000 },
      );
    });
  });

  describe('Status Indicators', () => {
    it('shows unsaved changes alert', async () => {
      render(<GPUAdvancedSettings selectedGPU={mockCompatibleGPU} />);

      await waitFor(() => {
        const cacheDirInput = screen.getByLabelText('Cache Directory');
        fireEvent.change(cacheDirInput, { target: { value: '/new/path' } });
      });

      await waitFor(() => {
        expect(
          screen.getByText('You have unsaved changes'),
        ).toBeInTheDocument();
        expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
      });
    });

    it('shows validation errors alert', async () => {
      render(<GPUAdvancedSettings selectedGPU={mockCompatibleGPU} />);

      await waitFor(() => {
        const cacheDirInput = screen.getByLabelText('Cache Directory');
        fireEvent.change(cacheDirInput, { target: { value: '' } });
      });

      await waitFor(() => {
        expect(
          screen.getByText('Please fix the validation errors below'),
        ).toBeInTheDocument();
        expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility and UX', () => {
    it('provides help tooltips for settings', async () => {
      render(<GPUAdvancedSettings selectedGPU={mockCompatibleGPU} />);

      await waitFor(
        () => {
          const helpIcons = screen.getAllByTestId('help-circle-icon');
          expect(helpIcons.length).toBeGreaterThan(5); // Multiple help tooltips
        },
        { timeout: 3000 },
      );
    });

    it('includes semantic sections with separators', async () => {
      render(<GPUAdvancedSettings selectedGPU={mockCompatibleGPU} />);

      await waitFor(
        () => {
          // Verify all 4 unique separators exist
          const cacheSeparator = screen.getByTestId(
            'gpu-advanced-separator-cache',
          );
          const deviceSeparator = screen.getByTestId(
            'gpu-advanced-separator-device',
          );
          const performanceSeparator = screen.getByTestId(
            'gpu-advanced-separator-performance',
          );
          const debugSeparator = screen.getByTestId(
            'gpu-advanced-separator-debug',
          );

          expect(cacheSeparator).toBeInTheDocument();
          expect(deviceSeparator).toBeInTheDocument();
          expect(performanceSeparator).toBeInTheDocument();
          expect(debugSeparator).toBeInTheDocument();
        },
        { timeout: 3000 },
      );
    });

    it('applies custom className when provided', async () => {
      render(
        <GPUAdvancedSettings
          selectedGPU={mockCompatibleGPU}
          className="custom-class"
        />,
      );

      await waitFor(
        () => {
          expect(screen.getByTestId('card')).toHaveClass('custom-class');
        },
        { timeout: 3000 },
      );
    });

    it('provides proper labels for form controls', async () => {
      render(<GPUAdvancedSettings selectedGPU={mockCompatibleGPU} />);

      await waitFor(
        () => {
          expect(screen.getByLabelText('Cache Directory')).toBeInTheDocument();
          expect(screen.getByLabelText('Enable Caching')).toBeInTheDocument();
          expect(
            screen.getByLabelText('Number of Threads'),
          ).toBeInTheDocument();
        },
        { timeout: 3000 },
      );
    });
  });
});
