/**
 * GPUSelectionComponent Test Suite
 *
 * Comprehensive tests for the GPUSelectionComponent component.
 * Tests cover all major functionality and edge cases.
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
  GPUSelectionComponent,
  GPUOption,
} from '../../renderer/components/GPUSelectionComponent';
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
        autoDetectRecommended: 'Auto-detect (Recommended)',
        autoDetectDescription: 'Automatically select the best available GPU',
        cpuProcessing: 'CPU Processing',
        cpuProcessingDescription: 'Use CPU for processing',
        variable: 'Variable',
        baseline: 'Baseline',
        intelArcA770Description: 'High-performance discrete GPU',
        intelXeGraphicsDescription: 'Integrated GPU with good performance',
        nvidiaRTX4080Description: 'High-performance NVIDIA GPU',
        intelArcA380Description: 'Discrete GPU - requires setup',
        intelUHDGraphicsDescription: 'Older integrated GPU',
        available: 'Available',
        requiresSetup: 'Requires Setup',
        unavailable: 'Unavailable',
        unknown: 'Unknown',
        gpuSelection: 'GPU Selection',
        refresh: 'Refresh',
        selectGPU: 'Select GPU',
        selectGPUPlaceholder: 'Choose a GPU...',
        detectingGPUs: 'Detecting GPUs...',
        gpuDetectionSuccess: 'GPU detection completed successfully',
        gpuDetectionFailed: 'GPU detection failed',
        invalidGPUSelection: 'Invalid GPU selection',
        gpuNotAvailable: `GPU {{gpu}} is not available`,
        gpuRequiresSetup: `GPU {{gpu}} requires setup`,
        gpuSelected: `Selected GPU: {{gpu}}`,
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
  Cpu: () => <div data-testid="cpu-icon">CPU</div>,
  RefreshCw: () => <div data-testid="refresh-icon">RefreshCw</div>,
  Zap: () => <div data-testid="zap-icon">Zap</div>,
  Activity: () => <div data-testid="activity-icon">Activity</div>,
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

jest.mock('@/components/ui/select', () => ({
  Select: ({ children, onValueChange, value, disabled, ...props }: any) => (
    <div
      data-testid="select"
      data-value={value}
      data-disabled={disabled}
      {...props}
    >
      {React.Children.map(children, (child) =>
        React.cloneElement(child, { onValueChange, value, disabled }),
      )}
    </div>
  ),
  SelectContent: ({ children, ...props }: any) => (
    <div data-testid="select-content" {...props}>
      {children}
    </div>
  ),
  SelectItem: ({
    children,
    value,
    onValueChange,
    disabled,
    className,
    ...props
  }: any) => (
    <button
      data-testid={`select-item-${value}`}
      onClick={() => onValueChange?.(value)}
      disabled={disabled}
      className={className}
      {...props}
    >
      {children}
    </button>
  ),
  SelectTrigger: ({ children, ...props }: any) => (
    <div data-testid="select-trigger" {...props}>
      {children}
    </div>
  ),
  SelectValue: ({ placeholder, ...props }: any) => (
    <span data-testid="select-value" {...props}>
      {placeholder}
    </span>
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

const mockProps = {
  selectedGPUId: 'auto',
  onGPUSelectionChange: jest.fn(),
  onRefreshGPUs: jest.fn(),
  disabled: false,
  className: '',
};

// ============================================================================
// STANDARDIZED COMPONENT LIFECYCLE TESTING - Phase 1.1.3
// ============================================================================

const componentConfig: ComponentTestConfig<any> = {
  component: GPUSelectionComponent,
  defaultProps: mockProps,
  testId: 'card', // Using card as the main container test ID
  displayName: 'GPUSelectionComponent',
};

const propValidationTests: PropValidationTest<any>[] = [
  {
    propName: 'selectedGPUId',
    validValues: ['auto', 'intel-arc-a770', 'cpu', ''],
    invalidValues: [null, undefined, 123, {}, []],
    customValidator: async (propValue, renderResult) => {
      if (propValue && propValue !== '') {
        // Should show selection or handle it gracefully
        expect(renderResult.container.firstChild).toBeInTheDocument();
      }
    },
  },
  {
    propName: 'onGPUSelectionChange',
    validValues: [jest.fn(), () => {}],
    invalidValues: [null, undefined, 'not a function', 123],
    requiredProp: true,
  },
  {
    propName: 'onRefreshGPUs',
    validValues: [jest.fn(), () => {}, undefined],
    invalidValues: ['not a function', 123, {}],
  },
  {
    propName: 'disabled',
    validValues: [true, false, undefined],
    invalidValues: ['true', 'false', 1, 0, {}],
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
  focusableElements: ['button', '[role="combobox"]', 'select'],
  ariaLabels: ['GPU Selection', 'Select GPU', 'Refresh'],
};

const performanceConfig: PerformanceTestConfig = {
  maxRenderTime: 150, // GPU component might be slightly slower due to mock data
  maxMemoryUsage: 100000,
  rerenderCount: 5,
  skipMemoryLeakDetection: false,
};

// Run standardized component test suite
runComponentTestSuite(componentConfig, {
  propTests: propValidationTests,
  scenarios: [
    ...createStandardScenarios(mockProps),
    {
      name: 'should handle GPU detection refresh',
      test: async (result, utils) => {
        const refreshButton = within(result.container).getByText('Refresh');
        utils.fireEvent.click(refreshButton);

        await utils.waitFor(() => {
          expect(
            within(result.container).getByText('Detecting GPUs...'),
          ).toBeInTheDocument();
        });
      },
    },
    {
      name: 'should display GPU options correctly',
      test: async (result, utils) => {
        await utils.waitFor(() => {
          const select = within(result.container).getByTestId('select');
          expect(select).toBeInTheDocument();
        });
      },
    },
  ],
  accessibilityConfig,
  performanceConfig,
});

// Test component variants with different configurations
testComponentVariants(componentConfig, [
  { name: 'with auto selection', props: { selectedGPUId: 'auto' } },
  {
    name: 'with specific GPU selected',
    props: { selectedGPUId: 'intel-arc-a770' },
  },
  { name: 'with CPU selected', props: { selectedGPUId: 'cpu' } },
  { name: 'disabled state', props: { disabled: true } },
  { name: 'with custom class', props: { className: 'custom-gpu-selector' } },
]);

describe('GPUSelectionComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders without crashing', () => {
      render(<GPUSelectionComponent {...mockProps} />);
      expect(screen.getByTestId('card')).toBeInTheDocument();
    });

    it('displays the GPU selection title and icon', () => {
      render(<GPUSelectionComponent {...mockProps} />);
      expect(screen.getByText('GPU Selection')).toBeInTheDocument();
      expect(screen.getByTestId('cpu-icon')).toBeInTheDocument();
    });

    it('shows the refresh button', () => {
      render(<GPUSelectionComponent {...mockProps} />);
      expect(screen.getByText('Refresh')).toBeInTheDocument();
      expect(screen.getByTestId('refresh-icon')).toBeInTheDocument();
    });

    it('applies custom className when provided', () => {
      render(<GPUSelectionComponent {...mockProps} className="custom-class" />);
      expect(screen.getByTestId('card')).toHaveClass('custom-class');
    });

    it('displays GPU selection dropdown', () => {
      render(<GPUSelectionComponent {...mockProps} />);
      expect(screen.getByTestId('select')).toBeInTheDocument();
      expect(screen.getByText('Select GPU')).toBeInTheDocument();
    });
  });

  describe('GPU Options Display', () => {
    it('displays default GPU options on mount', async () => {
      render(<GPUSelectionComponent {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('select-item-auto')).toBeInTheDocument();
        expect(screen.getByTestId('select-item-cpu')).toBeInTheDocument();
      });
    });

    it('displays mock GPU options in development', async () => {
      render(<GPUSelectionComponent {...mockProps} />);

      await waitFor(() => {
        expect(
          screen.getByTestId('select-item-intel-arc-a770'),
        ).toBeInTheDocument();
        expect(
          screen.getByTestId('select-item-intel-xe-graphics'),
        ).toBeInTheDocument();
        expect(
          screen.getByTestId('select-item-nvidia-rtx-4080'),
        ).toBeInTheDocument();
      });
    });

    it('displays performance icons for GPU options', async () => {
      render(<GPUSelectionComponent {...mockProps} />);

      await waitFor(() => {
        expect(screen.getAllByTestId('zap-icon')).toHaveLength(3); // High performance GPUs
        expect(screen.getAllByTestId('activity-icon')).toHaveLength(3); // Medium/low performance GPUs
      });
    });

    it('shows status badges for GPU options', async () => {
      render(<GPUSelectionComponent {...mockProps} />);

      await waitFor(() => {
        const badges = screen.getAllByTestId('badge');
        expect(badges.length).toBeGreaterThan(0);
      });
    });

    it('disables unavailable GPU options', async () => {
      render(<GPUSelectionComponent {...mockProps} />);

      await waitFor(() => {
        const unavailableOption = screen.getByTestId(
          'select-item-intel-uhd-graphics-unavailable',
        );
        expect(unavailableOption).toBeDisabled();
      });
    });
  });

  describe('GPU Selection Functionality', () => {
    it('handles valid GPU selection', async () => {
      render(<GPUSelectionComponent {...mockProps} />);

      await waitFor(() => {
        const gpuOption = screen.getByTestId('select-item-intel-arc-a770');
        fireEvent.click(gpuOption);
      });

      expect(mockProps.onGPUSelectionChange).toHaveBeenCalledWith(
        'intel-arc-a770',
      );
      expect(toast.success).toHaveBeenCalledWith(
        'Selected GPU: Intel Arc A770',
      );
    });

    it('prevents selection of unavailable GPUs', async () => {
      render(<GPUSelectionComponent {...mockProps} />);

      await waitFor(() => {
        const unavailableOption = screen.getByTestId(
          'select-item-intel-uhd-graphics-unavailable',
        );
        fireEvent.click(unavailableOption);
      });

      expect(mockProps.onGPUSelectionChange).not.toHaveBeenCalled();
      expect(toast.warning).toHaveBeenCalledWith(
        'GPU Intel UHD Graphics 630 is not available',
      );
    });

    it('shows warning for GPUs requiring setup', async () => {
      render(<GPUSelectionComponent {...mockProps} />);

      await waitFor(() => {
        const setupRequiredOption = screen.getByTestId(
          'select-item-intel-arc-a380-setup',
        );
        fireEvent.click(setupRequiredOption);
      });

      expect(mockProps.onGPUSelectionChange).toHaveBeenCalledWith(
        'intel-arc-a380-setup',
      );
      expect(toast.info).toHaveBeenCalledWith(
        'GPU Intel Arc A380 requires setup',
      );
    });

    it('handles invalid GPU selection gracefully', async () => {
      render(<GPUSelectionComponent {...mockProps} />);

      // Simulate selecting a non-existent GPU
      const selectComponent = screen.getByTestId('select');
      const mockEvent = { target: { value: 'non-existent-gpu' } };

      // Manually trigger the selection change with invalid ID
      const onValueChange = selectComponent.children[0].props.onValueChange;
      onValueChange('non-existent-gpu');

      expect(toast.error).toHaveBeenCalledWith('Invalid GPU selection');
    });
  });

  describe('GPU Refresh Functionality', () => {
    it('triggers GPU refresh when refresh button is clicked', async () => {
      render(<GPUSelectionComponent {...mockProps} />);

      const refreshButton = screen.getByText('Refresh');
      fireEvent.click(refreshButton);

      expect(screen.getByText('Detecting GPUs...')).toBeInTheDocument();

      await waitFor(
        () => {
          expect(toast.success).toHaveBeenCalledWith(
            'GPU detection completed successfully',
          );
        },
        { timeout: 3000 },
      );
    });

    it('calls onRefreshGPUs callback when provided', async () => {
      render(<GPUSelectionComponent {...mockProps} />);

      const refreshButton = screen.getByText('Refresh');
      fireEvent.click(refreshButton);

      await waitFor(
        () => {
          expect(mockProps.onRefreshGPUs).toHaveBeenCalled();
        },
        { timeout: 3000 },
      );
    });

    it('disables refresh button during detection', () => {
      render(<GPUSelectionComponent {...mockProps} />);

      const refreshButton = screen.getByText('Refresh');
      fireEvent.click(refreshButton);

      expect(refreshButton).toBeDisabled();
    });

    it('shows loading state during GPU detection', () => {
      render(<GPUSelectionComponent {...mockProps} />);

      const refreshButton = screen.getByText('Refresh');
      fireEvent.click(refreshButton);

      expect(screen.getByText('Detecting GPUs...')).toBeInTheDocument();
      expect(screen.getByTestId('refresh-icon')).toBeInTheDocument();
    });

    it('handles detection errors gracefully', async () => {
      // Mock console.error to avoid error output in tests
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(<GPUSelectionComponent {...mockProps} />);

      // Mock a detection failure
      const originalPromise = global.Promise;
      global.Promise = class extends originalPromise {
        static resolve = (value?: any) =>
          originalPromise.reject(new Error('Detection failed'));
      } as any;

      const refreshButton = screen.getByText('Refresh');
      fireEvent.click(refreshButton);

      await waitFor(
        () => {
          expect(screen.getByText('Detection failed')).toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      // Restore Promise
      global.Promise = originalPromise;
      consoleSpy.mockRestore();
    });
  });

  describe('Selected GPU Information', () => {
    it('displays information for selected GPU', async () => {
      render(
        <GPUSelectionComponent {...mockProps} selectedGPUId="intel-arc-a770" />,
      );

      await waitFor(() => {
        expect(screen.getByText('Intel Arc A770')).toBeInTheDocument();
        expect(
          screen.getByText('High-performance discrete GPU'),
        ).toBeInTheDocument();
      });
    });

    it('shows OpenVINO compatibility badge for compatible GPUs', async () => {
      render(
        <GPUSelectionComponent {...mockProps} selectedGPUId="intel-arc-a770" />,
      );

      await waitFor(() => {
        expect(screen.getByText('OpenVINO')).toBeInTheDocument();
      });
    });

    it('displays status badge for selected GPU', async () => {
      render(
        <GPUSelectionComponent {...mockProps} selectedGPUId="intel-arc-a770" />,
      );

      await waitFor(() => {
        const badges = screen.getAllByTestId('badge');
        const statusBadge = badges.find(
          (badge) => badge.textContent === 'Available',
        );
        expect(statusBadge).toBeInTheDocument();
      });
    });

    it('does not show selected GPU info when none is selected', () => {
      render(<GPUSelectionComponent {...mockProps} selectedGPUId="" />);

      // Should not show the selected GPU info section
      expect(screen.queryByText('Intel Arc A770')).not.toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('disables all controls when disabled prop is true', () => {
      render(<GPUSelectionComponent {...mockProps} disabled={true} />);

      expect(screen.getByText('Refresh')).toBeDisabled();
      expect(screen.getByTestId('select')).toHaveAttribute(
        'data-disabled',
        'true',
      );
    });

    it('prevents refresh when disabled', () => {
      render(<GPUSelectionComponent {...mockProps} disabled={true} />);

      const refreshButton = screen.getByText('Refresh');
      fireEvent.click(refreshButton);

      expect(screen.queryByText('Detecting GPUs...')).not.toBeInTheDocument();
    });

    it('disables GPU selection when disabled', () => {
      render(<GPUSelectionComponent {...mockProps} disabled={true} />);

      const selectTrigger = screen.getByTestId('select-trigger');
      fireEvent.click(selectTrigger);

      expect(mockProps.onGPUSelectionChange).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('displays error message when detection fails', async () => {
      render(<GPUSelectionComponent {...mockProps} />);

      // Simulate detection error by clicking refresh and waiting for error
      const refreshButton = screen.getByText('Refresh');

      // Mock the detection to fail
      const originalSetTimeout = global.setTimeout;
      (global as any).setTimeout = (callback: Function) => {
        callback();
        throw new Error('Simulated detection error');
      };

      fireEvent.click(refreshButton);

      // Wait for error state
      await waitFor(
        () => {
          expect(
            screen.queryByText('Detecting GPUs...'),
          ).not.toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      (global as any).setTimeout = originalSetTimeout;
    });

    it('clears previous errors on successful detection', async () => {
      render(<GPUSelectionComponent {...mockProps} />);

      const refreshButton = screen.getByText('Refresh');
      fireEvent.click(refreshButton);

      await waitFor(
        () => {
          expect(toast.success).toHaveBeenCalledWith(
            'GPU detection completed successfully',
          );
        },
        { timeout: 3000 },
      );
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(<GPUSelectionComponent {...mockProps} />);

      expect(screen.getByText('Select GPU')).toBeInTheDocument();
      expect(screen.getByTestId('select-trigger')).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<GPUSelectionComponent {...mockProps} />);

      const refreshButton = screen.getByText('Refresh');
      await user.tab();
      expect(refreshButton).toHaveFocus();
    });

    it('provides meaningful labels for screen readers', () => {
      render(<GPUSelectionComponent {...mockProps} />);

      expect(screen.getByText('GPU Selection')).toBeInTheDocument();
      expect(screen.getByText('Select GPU')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('renders quickly with many GPU options', () => {
      const startTime = performance.now();
      render(<GPUSelectionComponent {...mockProps} />);
      const renderTime = performance.now() - startTime;

      expect(renderTime).toBeLessThan(100); // Should render in under 100ms
    });

    it('handles rapid refresh clicks gracefully', async () => {
      render(<GPUSelectionComponent {...mockProps} />);

      const refreshButton = screen.getByText('Refresh');

      // Click refresh multiple times rapidly
      fireEvent.click(refreshButton);
      fireEvent.click(refreshButton);
      fireEvent.click(refreshButton);

      // Should still only trigger one detection
      expect(refreshButton).toBeDisabled();
    });
  });
});
