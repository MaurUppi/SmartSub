/**
 * Test suite for GPU Selection Dropbox Component
 * Task UE-3: GPU Dropbox Selection Feature Implementation
 */

import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import GPUSelectionDropbox from '../../renderer/components/GPUSelectionDropbox';
import { useGPUSelection } from '../../renderer/hooks/useGPUSelection';
import { usePlatform } from '../../renderer/hooks/usePlatform';

// Mock hooks
jest.mock('../../renderer/hooks/useGPUSelection');
jest.mock('../../renderer/hooks/usePlatform');

// Mock translation hook
jest.mock('next-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      if (options && key === 'gpuSelectionChanged') {
        return `GPU selection changed to ${options.gpu}`;
      }
      return key;
    },
    i18n: { language: 'en' },
  }),
}));

// Mock toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock UI components
jest.mock('@/components/ui/select', () => ({
  Select: ({ children, onValueChange, disabled }: any) => (
    <div data-testid="gpu-select" data-disabled={disabled}>
      {children}
      <button onClick={() => onValueChange?.('test-gpu')}>Change</button>
    </div>
  ),
  SelectTrigger: ({ children }: any) => (
    <div data-testid="select-trigger">{children}</div>
  ),
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value, disabled }: any) => (
    <div data-testid={`select-item-${value}`} data-disabled={disabled}>
      {children}
    </div>
  ),
}));

jest.mock('@/components/ui/form', () => ({
  FormControl: ({ children }: any) => children,
  FormDescription: ({ children }: any) => (
    <div data-testid="form-description">{children}</div>
  ),
  FormField: ({ children }: any) => children,
  FormItem: ({ children }: any) => <div>{children}</div>,
  FormLabel: ({ children, className }: any) => (
    <label className={className}>{children}</label>
  ),
}));

jest.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: any) => children,
  Tooltip: ({ children }: any) => children,
  TooltipTrigger: ({ children }: any) => children,
  TooltipContent: ({ children }: any) => (
    <div data-testid="tooltip-content">{children}</div>
  ),
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled} data-testid="refresh-button">
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant }: any) => (
    <span data-testid="badge" data-variant={variant}>
      {children}
    </span>
  ),
}));

describe('GPU Selection Dropbox Component', () => {
  const mockUsePlatform = usePlatform as jest.MockedFunction<
    typeof usePlatform
  >;
  const mockUseGPUSelection = useGPUSelection as jest.MockedFunction<
    typeof useGPUSelection
  >;

  const mockGPUs = [
    {
      id: 'auto',
      name: 'Auto-detect (Recommended)',
      type: 'auto' as const,
      vendor: 'auto' as const,
      available: true,
      recommended: true,
    },
    {
      id: 'intel-0',
      name: 'Intel Arc A770',
      type: 'intel-arc' as const,
      vendor: 'intel' as const,
      memory: 16384,
      available: true,
      recommended: true,
    },
    {
      id: 'nvidia-0',
      name: 'NVIDIA RTX 4090',
      type: 'nvidia' as const,
      vendor: 'nvidia' as const,
      memory: 24576,
      available: true,
      recommended: false,
    },
    {
      id: 'cpu',
      name: 'CPU Only',
      type: 'cpu' as const,
      vendor: 'cpu' as const,
      available: true,
      recommended: false,
    },
  ];

  const defaultGPUSelectionMock = {
    availableGPUs: mockGPUs,
    selectedGPU: 'auto',
    isGPUSelectionSupported: true,
    isLoading: false,
    error: null,
    selectGPU: jest.fn(),
    refreshGPUList: jest.fn(),
    getGPUDisplayName: jest.fn(
      (id: string) => mockGPUs.find((gpu) => gpu.id === id)?.name || id,
    ),
    isGPURecommended: jest.fn(
      (id: string) =>
        mockGPUs.find((gpu) => gpu.id === id)?.recommended || false,
    ),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseGPUSelection.mockReturnValue(defaultGPUSelectionMock);
  });

  describe('Windows Platform Behavior', () => {
    beforeEach(() => {
      mockUsePlatform.mockReturnValue({
        platform: 'win32',
        capabilities: {
          supportsCUDA: true,
          supportsOpenVINO: true,
          supportsAppleML: false,
          platformName: 'Windows',
          displayName: 'Microsoft Windows',
        },
        isMacOS: false,
        isWindows: true,
        isLinux: false,
        isAppleSilicon: false,
      });
    });

    test('should render GPU selection dropdown on Windows', () => {
      render(<GPUSelectionDropbox />);

      expect(screen.getByText('GPU Selection')).toBeInTheDocument();
      expect(screen.getByTestId('gpu-select')).toBeInTheDocument();
      expect(screen.getByTestId('gpu-select')).toHaveAttribute(
        'data-disabled',
        'false',
      );
    });

    test('should display available GPU options', () => {
      render(<GPUSelectionDropbox />);

      expect(screen.getByTestId('select-item-auto')).toBeInTheDocument();
      expect(screen.getByTestId('select-item-intel-0')).toBeInTheDocument();
      expect(screen.getByTestId('select-item-nvidia-0')).toBeInTheDocument();
      expect(screen.getByTestId('select-item-cpu')).toBeInTheDocument();
    });

    test('should show recommended badges for suitable GPUs', () => {
      render(<GPUSelectionDropbox />);

      const badges = screen.getAllByTestId('badge');
      const recommendedBadges = badges.filter(
        (badge) => badge.textContent === 'Recommended',
      );

      expect(recommendedBadges.length).toBeGreaterThan(0);
    });

    test('should handle GPU selection change', async () => {
      const mockSelectGPU = jest.fn().mockResolvedValue(undefined);
      mockUseGPUSelection.mockReturnValue({
        ...defaultGPUSelectionMock,
        selectGPU: mockSelectGPU,
      });

      render(<GPUSelectionDropbox />);

      const changeButton = screen.getByText('Change');
      fireEvent.click(changeButton);

      await waitFor(() => {
        expect(mockSelectGPU).toHaveBeenCalledWith('test-gpu');
      });
    });

    test('should show refresh button on supported platforms', () => {
      render(<GPUSelectionDropbox />);

      expect(screen.getByTestId('refresh-button')).toBeInTheDocument();
    });

    test('should handle refresh GPU list', async () => {
      const mockRefreshGPUList = jest.fn().mockResolvedValue(undefined);
      mockUseGPUSelection.mockReturnValue({
        ...defaultGPUSelectionMock,
        refreshGPUList: mockRefreshGPUList,
      });

      render(<GPUSelectionDropbox />);

      const refreshButton = screen.getByTestId('refresh-button');
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(mockRefreshGPUList).toHaveBeenCalled();
      });
    });

    test('should display appropriate description for selected GPU', () => {
      mockUseGPUSelection.mockReturnValue({
        ...defaultGPUSelectionMock,
        selectedGPU: 'intel-0',
      });

      render(<GPUSelectionDropbox showDescription={true} />);

      const description = screen.getByTestId('form-description');
      expect(description).toHaveTextContent(
        'Uses Intel Arc A770 for GPU acceleration',
      );
    });
  });

  describe('macOS Platform Behavior', () => {
    beforeEach(() => {
      mockUsePlatform.mockReturnValue({
        platform: 'darwin',
        capabilities: {
          supportsCUDA: false,
          supportsOpenVINO: false,
          supportsAppleML: true,
          platformName: 'macOS',
          displayName: 'Apple macOS',
        },
        isMacOS: true,
        isWindows: false,
        isLinux: false,
        isAppleSilicon: true,
      });

      mockUseGPUSelection.mockReturnValue({
        ...defaultGPUSelectionMock,
        isGPUSelectionSupported: false,
        availableGPUs: [mockGPUs[0], mockGPUs[3]], // Only auto and CPU
      });
    });

    test('should disable GPU selection on macOS', () => {
      render(<GPUSelectionDropbox />);

      const select = screen.getByTestId('gpu-select');
      expect(select).toHaveAttribute('data-disabled', 'true');
    });

    test('should show grayed out label on macOS', () => {
      render(<GPUSelectionDropbox />);

      const label = screen.getByText('GPU Selection');
      expect(label).toHaveClass('text-muted-foreground');
    });

    test('should show Apple Silicon notice', () => {
      render(<GPUSelectionDropbox />);

      expect(screen.getByText('Apple Silicon Notice')).toBeInTheDocument();
      expect(
        screen.getByText(/GPU selection is not available on Apple Silicon/),
      ).toBeInTheDocument();
    });

    test('should not show refresh button on unsupported platform', () => {
      render(<GPUSelectionDropbox />);

      expect(screen.queryByTestId('refresh-button')).not.toBeInTheDocument();
    });

    test('should show platform not supported description', () => {
      render(<GPUSelectionDropbox showDescription={true} />);

      const description = screen.getByTestId('form-description');
      expect(description).toHaveTextContent(
        'GPU selection not supported on this platform',
      );
    });
  });

  describe('Loading and Error States', () => {
    test('should show loading state', () => {
      mockUseGPUSelection.mockReturnValue({
        ...defaultGPUSelectionMock,
        isLoading: true,
      });

      render(<GPUSelectionDropbox />);

      const select = screen.getByTestId('gpu-select');
      expect(select).toHaveAttribute('data-disabled', 'true');
    });

    test('should display error message', () => {
      const errorMessage = 'Failed to detect GPUs';
      mockUseGPUSelection.mockReturnValue({
        ...defaultGPUSelectionMock,
        error: errorMessage,
      });

      render(<GPUSelectionDropbox />);

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    test('should show no GPUs detected when list is empty', () => {
      mockUseGPUSelection.mockReturnValue({
        ...defaultGPUSelectionMock,
        availableGPUs: [],
      });

      render(<GPUSelectionDropbox />);

      expect(screen.getByText('No GPUs detected')).toBeInTheDocument();
    });
  });

  describe('GPU Selection Integration', () => {
    test('should handle form integration', async () => {
      const mockForm = {
        setValue: jest.fn(),
      };

      const mockSelectGPU = jest.fn().mockResolvedValue(undefined);
      mockUseGPUSelection.mockReturnValue({
        ...defaultGPUSelectionMock,
        selectGPU: mockSelectGPU,
      });

      render(<GPUSelectionDropbox form={mockForm} />);

      const changeButton = screen.getByText('Change');
      fireEvent.click(changeButton);

      await waitFor(() => {
        expect(mockSelectGPU).toHaveBeenCalledWith('test-gpu');
        expect(mockForm.setValue).toHaveBeenCalledWith(
          'selectedGPU',
          'test-gpu',
        );
      });
    });

    test('should display success toast on GPU change', async () => {
      const { toast } = await import('sonner');
      const mockSelectGPU = jest.fn().mockResolvedValue(undefined);
      mockUseGPUSelection.mockReturnValue({
        ...defaultGPUSelectionMock,
        selectGPU: mockSelectGPU,
      });

      render(<GPUSelectionDropbox />);

      const changeButton = screen.getByText('Change');
      fireEvent.click(changeButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          'GPU selection changed to test-gpu',
        );
      });
    });

    test('should display error toast on GPU selection failure', async () => {
      const { toast } = await import('sonner');
      const errorMessage = 'GPU not available';
      const mockSelectGPU = jest
        .fn()
        .mockRejectedValue(new Error(errorMessage));
      mockUseGPUSelection.mockReturnValue({
        ...defaultGPUSelectionMock,
        selectGPU: mockSelectGPU,
      });

      render(<GPUSelectionDropbox />);

      const changeButton = screen.getByText('Change');
      fireEvent.click(changeButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(errorMessage);
      });
    });
  });

  describe('GPU Device Display', () => {
    test('should show GPU vendor indicators', () => {
      render(<GPUSelectionDropbox />);

      // Check for vendor color indicators (represented as CSS classes)
      const selectItems = screen.getAllByTestId(/select-item-/);
      expect(selectItems.length).toBeGreaterThan(0);
    });

    test('should display GPU memory information in description', () => {
      mockUseGPUSelection.mockReturnValue({
        ...defaultGPUSelectionMock,
        selectedGPU: 'intel-0',
      });

      render(<GPUSelectionDropbox showDescription={true} />);

      const description = screen.getByTestId('form-description');
      expect(description).toHaveTextContent('16 GB VRAM'); // 16384 MB = 16 GB
    });

    test('should handle unavailable GPUs', () => {
      const unavailableGPUs = mockGPUs.map((gpu) => ({
        ...gpu,
        available: false,
      }));
      mockUseGPUSelection.mockReturnValue({
        ...defaultGPUSelectionMock,
        availableGPUs: unavailableGPUs,
      });

      render(<GPUSelectionDropbox />);

      const unavailableBadges = screen
        .getAllByTestId('badge')
        .filter((badge) => badge.textContent === 'Unavailable');
      expect(unavailableBadges.length).toBe(unavailableGPUs.length);
    });
  });

  describe('Accessibility and UX', () => {
    test('should have proper tooltip content for different platforms', () => {
      // Test Windows tooltip
      mockUsePlatform.mockReturnValue({
        platform: 'win32',
        capabilities: {
          supportsCUDA: true,
          supportsOpenVINO: true,
          supportsAppleML: false,
          platformName: 'Windows',
          displayName: 'Microsoft Windows',
        },
        isMacOS: false,
        isWindows: true,
        isLinux: false,
        isAppleSilicon: false,
      });

      const { rerender } = render(<GPUSelectionDropbox />);

      let tooltip = screen.getByTestId('tooltip-content');
      expect(tooltip).toHaveTextContent(
        'Select a GPU device for accelerated processing',
      );

      // Test macOS tooltip
      mockUsePlatform.mockReturnValue({
        platform: 'darwin',
        capabilities: {
          supportsCUDA: false,
          supportsOpenVINO: false,
          supportsAppleML: true,
          platformName: 'macOS',
          displayName: 'Apple macOS',
        },
        isMacOS: true,
        isWindows: false,
        isLinux: false,
        isAppleSilicon: true,
      });

      rerender(<GPUSelectionDropbox />);

      tooltip = screen.getByTestId('tooltip-content');
      expect(tooltip).toHaveTextContent(
        'GPU selection is not available on Apple Silicon',
      );
    });

    test('should disable refresh button during loading', () => {
      mockUseGPUSelection.mockReturnValue({
        ...defaultGPUSelectionMock,
        isLoading: true,
      });

      render(<GPUSelectionDropbox />);

      const refreshButton = screen.getByTestId('refresh-button');
      expect(refreshButton).toBeDisabled();
    });
  });
});
