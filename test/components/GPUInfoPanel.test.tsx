/**
 * GPUInfoPanel Test Suite
 *
 * Comprehensive tests for the GPUInfoPanel component.
 */

import React from 'react';
import { render, screen, within } from '@testing-library/react';
import {
  GPUInfoPanel,
  GPUOption,
} from '../../renderer/components/GPUInfoPanel';

// Mock next-i18next
jest.mock('next-i18next', () => ({
  useTranslation: () => ({
    t: function (key, params) {
      const translations: Record<string, string> = {
        discreteGPU: 'Discrete GPU',
        discreteGPUDescription: 'Dedicated graphics card with its own memory',
        integratedGPU: 'Integrated GPU',
        integratedGPUDescription: 'Graphics processor built into the CPU',
        dedicatedGPU: 'Dedicated GPU',
        nvidiaGPUDescription: 'NVIDIA dedicated graphics card',
        appleGPU: 'Apple GPU',
        appleGPUDescription: 'Apple Silicon integrated graphics',
        cpuProcessing: 'CPU Processing',
        cpuProcessingDescription: 'Software-based processing using CPU',
        autoDetection: 'Auto Detection',
        autoDetectionDescription: 'Automatically select best option',
        unknown: 'Unknown',
        unknownGPUDescription: 'Unknown GPU type',
        highPerformance: 'High Performance',
        high: 'High',
        highPerformanceDescription: 'Excellent performance for demanding tasks',
        mediumPerformance: 'Medium Performance',
        medium: 'Medium',
        mediumPerformanceDescription: 'Good performance for most tasks',
        lowPerformance: 'Low Performance',
        low: 'Low',
        lowPerformanceDescription: 'Basic performance',
        unknownPerformance: 'Unknown Performance',
        unknownPerformanceDescription: 'Performance rating unknown',
        excellentEfficiency: 'Excellent Efficiency',
        excellent: 'Excellent',
        excellentEfficiencyDescription: 'Very power efficient',
        goodEfficiency: 'Good Efficiency',
        good: 'Good',
        goodEfficiencyDescription: 'Power efficient',
        moderateEfficiency: 'Moderate Efficiency',
        moderate: 'Moderate',
        moderateEfficiencyDescription: 'Average power efficiency',
        unknownEfficiency: 'Unknown Efficiency',
        unknownEfficiencyDescription: 'Power efficiency unknown',
        memoryUnknown: 'Memory Unknown',
        sharedMemory: 'Shared Memory',
        sharedMemoryDescription: 'Uses system RAM for graphics',
        dedicatedMemory: '{{memory}}GB Dedicated',
        dedicatedMemoryDescription: 'Has its own dedicated memory',
        gpuInformation: 'GPU Information',
        noGPUSelected: 'No GPU Selected',
        selectGPUToViewInfo: 'Select a GPU to view detailed information',
        gpuType: 'GPU Type',
        performanceRating: 'Performance Rating',
        powerEfficiency: 'Power Efficiency',
        memoryInformation: 'Memory Information',
        driverVersion: 'Driver Version',
        driverVersionDescription: 'Currently installed driver version',
        estimatedProcessingSpeed: 'Estimated Processing Speed',
        processingSpeedDescription: 'Relative to CPU baseline performance',
        available: 'Available',
        unavailable: 'Unavailable',
        'requires-setup': 'Requires Setup',
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
  Info: () => <div data-testid="info-icon">Info</div>,
  Zap: () => <div data-testid="zap-icon">Zap</div>,
  Activity: () => <div data-testid="activity-icon">Activity</div>,
  HardDrive: () => <div data-testid="harddrive-icon">HardDrive</div>,
  Settings: () => <div data-testid="settings-icon">Settings</div>,
  Timer: () => <div data-testid="timer-icon">Timer</div>,
  Battery: () => <div data-testid="battery-icon">Battery</div>,
  Cpu: () => <div data-testid="cpu-icon">Cpu</div>,
  Monitor: () => <div data-testid="monitor-icon">Monitor</div>,
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

// Sample GPU options for testing
const mockDiscreteGPU: GPUOption = {
  id: 'intel-arc-a770',
  displayName: 'Intel Arc A770',
  type: 'intel-discrete',
  status: 'available',
  performance: 'high',
  description: 'High-performance discrete GPU with excellent OpenVINO support',
  driverVersion: '31.0.101.5381',
  memory: 16384,
  powerEfficiency: 'good',
  estimatedSpeed: '3-4x faster',
  openvinoCompatible: true,
};

const mockIntegratedGPU: GPUOption = {
  id: 'intel-xe-graphics',
  displayName: 'Intel Xe Graphics',
  type: 'intel-integrated',
  status: 'available',
  performance: 'medium',
  description: 'Integrated GPU with good OpenVINO performance',
  driverVersion: '31.0.101.5381',
  memory: 'shared',
  powerEfficiency: 'excellent',
  estimatedSpeed: '2-3x faster',
  openvinoCompatible: true,
};

const mockNVIDIAGPU: GPUOption = {
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

const mockUnavailableGPU: GPUOption = {
  id: 'old-gpu',
  displayName: 'Old GPU',
  type: 'intel-integrated',
  status: 'unavailable',
  performance: 'low',
  description: 'Older GPU not supported',
  memory: 'shared',
  powerEfficiency: 'excellent',
  openvinoCompatible: false,
};

const mockSetupRequiredGPU: GPUOption = {
  id: 'setup-gpu',
  displayName: 'Setup Required GPU',
  type: 'intel-discrete',
  status: 'requires-setup',
  performance: 'medium',
  description: 'GPU requires driver setup',
  memory: 8192,
  powerEfficiency: 'good',
  openvinoCompatible: true,
};

describe('GPUInfoPanel', () => {
  describe('Empty State', () => {
    it('renders empty state when no GPU is selected', () => {
      render(<GPUInfoPanel selectedGPU={null} />);

      expect(screen.getByTestId('card')).toBeInTheDocument();
      expect(screen.getByTestId('info-icon')).toBeInTheDocument();
      expect(screen.getByText('No GPU Selected')).toBeInTheDocument();
      expect(
        screen.getByText('Select a GPU to view detailed information'),
      ).toBeInTheDocument();
    });

    it('applies border-dashed class in empty state', () => {
      render(<GPUInfoPanel selectedGPU={null} />);

      expect(screen.getByTestId('card')).toHaveClass('border-dashed');
    });

    it('shows empty state icon and text centered', () => {
      render(<GPUInfoPanel selectedGPU={null} />);

      const cardContent = screen.getByTestId('card-content');
      expect(cardContent).toBeInTheDocument();
      expect(within(cardContent).getByTestId('info-icon')).toBeInTheDocument();
    });
  });

  describe('GPU Information Display', () => {
    it('displays discrete GPU information correctly', () => {
      render(<GPUInfoPanel selectedGPU={mockDiscreteGPU} />);

      expect(screen.getByText('GPU Information')).toBeInTheDocument();
      expect(screen.getByText('Intel Arc A770')).toBeInTheDocument();
      expect(
        screen.getByText(
          'High-performance discrete GPU with excellent OpenVINO support',
        ),
      ).toBeInTheDocument();
    });

    it('displays integrated GPU information correctly', () => {
      render(<GPUInfoPanel selectedGPU={mockIntegratedGPU} />);

      expect(screen.getByText('Intel Xe Graphics')).toBeInTheDocument();
      expect(
        screen.getByText('Integrated GPU with good OpenVINO performance'),
      ).toBeInTheDocument();
    });

    it('shows OpenVINO compatibility badge for compatible GPUs', () => {
      render(<GPUInfoPanel selectedGPU={mockDiscreteGPU} />);

      expect(screen.getByText('OpenVINO')).toBeInTheDocument();
    });

    it('does not show OpenVINO badge for incompatible GPUs', () => {
      render(<GPUInfoPanel selectedGPU={mockNVIDIAGPU} />);

      expect(screen.queryByText('OpenVINO')).not.toBeInTheDocument();
    });

    it('displays appropriate status badges', () => {
      render(<GPUInfoPanel selectedGPU={mockDiscreteGPU} />);

      expect(screen.getByText('available')).toBeInTheDocument();
    });

    it('shows different status badge colors for different statuses', () => {
      const { rerender } = render(
        <GPUInfoPanel selectedGPU={mockDiscreteGPU} />,
      );
      expect(screen.getByText('available')).toBeInTheDocument();

      rerender(<GPUInfoPanel selectedGPU={mockUnavailableGPU} />);
      expect(screen.getByText('unavailable')).toBeInTheDocument();

      rerender(<GPUInfoPanel selectedGPU={mockSetupRequiredGPU} />);
      expect(screen.getByText('requires-setup')).toBeInTheDocument();
    });
  });

  describe('GPU Type Information', () => {
    it('displays discrete GPU type information', () => {
      render(<GPUInfoPanel selectedGPU={mockDiscreteGPU} />);

      expect(screen.getByText('GPU Type')).toBeInTheDocument();
      expect(screen.getByText('Discrete GPU')).toBeInTheDocument();
      expect(
        screen.getByText('Dedicated graphics card with its own memory'),
      ).toBeInTheDocument();
      expect(screen.getByTestId('monitor-icon')).toBeInTheDocument();
    });

    it('displays integrated GPU type information', () => {
      render(<GPUInfoPanel selectedGPU={mockIntegratedGPU} />);

      expect(screen.getByText('Integrated GPU')).toBeInTheDocument();
      expect(
        screen.getByText('Graphics processor built into the CPU'),
      ).toBeInTheDocument();
      expect(screen.getByTestId('cpu-icon')).toBeInTheDocument();
    });

    it('displays NVIDIA GPU type information', () => {
      render(<GPUInfoPanel selectedGPU={mockNVIDIAGPU} />);

      expect(screen.getByText('Dedicated GPU')).toBeInTheDocument();
      expect(
        screen.getByText('NVIDIA dedicated graphics card'),
      ).toBeInTheDocument();
    });
  });

  describe('Performance Rating Display', () => {
    it('displays high performance rating with correct badge and icon', () => {
      render(<GPUInfoPanel selectedGPU={mockDiscreteGPU} />);

      expect(screen.getByText('Performance Rating')).toBeInTheDocument();
      expect(screen.getByText('High')).toBeInTheDocument();
      expect(
        screen.getByText('Excellent performance for demanding tasks'),
      ).toBeInTheDocument();
      expect(screen.getByTestId('zap-icon')).toBeInTheDocument();
    });

    it('displays medium performance rating', () => {
      render(<GPUInfoPanel selectedGPU={mockIntegratedGPU} />);

      expect(screen.getByText('Medium')).toBeInTheDocument();
      expect(
        screen.getByText('Good performance for most tasks'),
      ).toBeInTheDocument();
      expect(screen.getByTestId('activity-icon')).toBeInTheDocument();
    });

    it('displays low performance rating', () => {
      render(<GPUInfoPanel selectedGPU={mockUnavailableGPU} />);

      expect(screen.getByText('Low')).toBeInTheDocument();
      expect(screen.getByText('Basic performance')).toBeInTheDocument();
    });

    it('shows estimated speed when available', () => {
      render(<GPUInfoPanel selectedGPU={mockDiscreteGPU} />);

      expect(screen.getByText('3-4x faster')).toBeInTheDocument();
    });
  });

  describe('Power Efficiency Display', () => {
    it('displays excellent power efficiency', () => {
      render(<GPUInfoPanel selectedGPU={mockIntegratedGPU} />);

      expect(screen.getByText('Power Efficiency')).toBeInTheDocument();
      expect(screen.getByText('Excellent')).toBeInTheDocument();
      expect(screen.getByText('Very power efficient')).toBeInTheDocument();
      expect(screen.getByTestId('battery-icon')).toBeInTheDocument();
    });

    it('displays good power efficiency', () => {
      render(<GPUInfoPanel selectedGPU={mockDiscreteGPU} />);

      expect(screen.getByText('Good')).toBeInTheDocument();
      expect(screen.getByText('Power efficient')).toBeInTheDocument();
    });

    it('displays moderate power efficiency', () => {
      const moderateGPU = {
        ...mockDiscreteGPU,
        powerEfficiency: 'moderate' as const,
      };
      render(<GPUInfoPanel selectedGPU={moderateGPU} />);

      expect(screen.getByText('Moderate')).toBeInTheDocument();
      expect(screen.getByText('Average power efficiency')).toBeInTheDocument();
    });
  });

  describe('Memory Information Display', () => {
    it('displays dedicated memory information', () => {
      render(<GPUInfoPanel selectedGPU={mockDiscreteGPU} />);

      expect(screen.getByText('Memory Information')).toBeInTheDocument();
      expect(screen.getByText('16GB Dedicated')).toBeInTheDocument();
      expect(
        screen.getByText('Has its own dedicated memory'),
      ).toBeInTheDocument();
      expect(screen.getByTestId('harddrive-icon')).toBeInTheDocument();
    });

    it('displays shared memory information', () => {
      render(<GPUInfoPanel selectedGPU={mockIntegratedGPU} />);

      expect(screen.getByText('Shared Memory')).toBeInTheDocument();
      expect(
        screen.getByText('Uses system RAM for graphics'),
      ).toBeInTheDocument();
    });

    it('handles unknown memory gracefully', () => {
      const unknownMemoryGPU = { ...mockDiscreteGPU, memory: undefined };
      render(<GPUInfoPanel selectedGPU={unknownMemoryGPU} />);

      expect(screen.getByText('Memory Unknown')).toBeInTheDocument();
    });

    it('formats memory sizes correctly', () => {
      const gpu8GB = { ...mockDiscreteGPU, memory: 8192 };
      render(<GPUInfoPanel selectedGPU={gpu8GB} />);

      expect(screen.getByText('8GB Dedicated')).toBeInTheDocument();
    });
  });

  describe('Driver Version Display', () => {
    it('displays driver version when available', () => {
      render(<GPUInfoPanel selectedGPU={mockDiscreteGPU} />);

      expect(screen.getByText('Driver Version')).toBeInTheDocument();
      expect(screen.getByText('31.0.101.5381')).toBeInTheDocument();
      expect(
        screen.getByText('Currently installed driver version'),
      ).toBeInTheDocument();
      expect(screen.getByTestId('settings-icon')).toBeInTheDocument();
    });

    it('does not display driver version section when not available', () => {
      const noDriverGPU = { ...mockDiscreteGPU, driverVersion: undefined };
      render(<GPUInfoPanel selectedGPU={noDriverGPU} />);

      expect(screen.queryByText('Driver Version')).not.toBeInTheDocument();
    });
  });

  describe('Processing Speed Display', () => {
    it('displays processing speed for available GPUs', () => {
      render(<GPUInfoPanel selectedGPU={mockDiscreteGPU} />);

      expect(
        screen.getByText('Estimated Processing Speed'),
      ).toBeInTheDocument();
      expect(screen.getByText('3-4x faster')).toBeInTheDocument();
      expect(
        screen.getByText('Relative to CPU baseline performance'),
      ).toBeInTheDocument();
      expect(screen.getByTestId('timer-icon')).toBeInTheDocument();
    });

    it('does not display processing speed for unavailable GPUs', () => {
      render(<GPUInfoPanel selectedGPU={mockUnavailableGPU} />);

      expect(
        screen.queryByText('Estimated Processing Speed'),
      ).not.toBeInTheDocument();
    });

    it('does not display processing speed when not provided', () => {
      const noSpeedGPU = { ...mockDiscreteGPU, estimatedSpeed: undefined };
      render(<GPUInfoPanel selectedGPU={noSpeedGPU} />);

      expect(
        screen.queryByText('Estimated Processing Speed'),
      ).not.toBeInTheDocument();
    });
  });

  describe('Layout and Structure', () => {
    it('includes separators between sections', () => {
      render(<GPUInfoPanel selectedGPU={mockDiscreteGPU} />);

      const separators = screen.getAllByTestId('separator');
      expect(separators.length).toBeGreaterThan(3); // Multiple sections with separators
    });

    it('maintains consistent section structure', () => {
      render(<GPUInfoPanel selectedGPU={mockDiscreteGPU} />);

      // Check that all major sections are present
      expect(screen.getByText('GPU Type')).toBeInTheDocument();
      expect(screen.getByText('Performance Rating')).toBeInTheDocument();
      expect(screen.getByText('Power Efficiency')).toBeInTheDocument();
      expect(screen.getByText('Memory Information')).toBeInTheDocument();
    });

    it('applies custom className when provided', () => {
      render(
        <GPUInfoPanel selectedGPU={mockDiscreteGPU} className="custom-class" />,
      );

      expect(screen.getByTestId('card')).toHaveClass('custom-class');
    });
  });

  describe('Edge Cases', () => {
    it('handles GPU with unknown type gracefully', () => {
      const unknownTypeGPU = { ...mockDiscreteGPU, type: 'unknown' as any };
      render(<GPUInfoPanel selectedGPU={unknownTypeGPU} />);

      expect(screen.getByText('Unknown')).toBeInTheDocument();
      expect(screen.getByText('Unknown GPU type')).toBeInTheDocument();
    });

    it('handles GPU with unknown performance gracefully', () => {
      const unknownPerfGPU = {
        ...mockDiscreteGPU,
        performance: 'unknown' as any,
      };
      render(<GPUInfoPanel selectedGPU={unknownPerfGPU} />);

      expect(screen.getByText('Unknown')).toBeInTheDocument();
    });

    it('handles GPU with unknown efficiency gracefully', () => {
      const unknownEffGPU = {
        ...mockDiscreteGPU,
        powerEfficiency: 'unknown' as any,
      };
      render(<GPUInfoPanel selectedGPU={unknownEffGPU} />);

      expect(screen.getByText('Unknown')).toBeInTheDocument();
    });

    it('handles GPU with minimal information', () => {
      const minimalGPU: GPUOption = {
        id: 'minimal',
        displayName: 'Minimal GPU',
        type: 'cpu',
        status: 'available',
        performance: 'low',
        description: 'Basic GPU',
        powerEfficiency: 'excellent',
      };

      render(<GPUInfoPanel selectedGPU={minimalGPU} />);

      expect(screen.getByText('Minimal GPU')).toBeInTheDocument();
      expect(screen.getByText('Basic GPU')).toBeInTheDocument();
    });
  });
});
