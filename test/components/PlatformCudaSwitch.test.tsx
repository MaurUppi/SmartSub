/**
 * Test suite for Platform-wise CUDA Switch Enhancement
 * Task UE-2: Platform-Wise CUDA Switch Enhancement
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { usePlatform } from '../../renderer/hooks/usePlatform';

// Mock the platform hook
jest.mock('../../renderer/hooks/usePlatform');

// Mock translation hook
jest.mock('next-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    locale: 'en',
    push: jest.fn(),
  }),
}));

// Mock IPC
const mockIpcInvoke = jest.fn();
global.window = {
  ...global.window,
  ipc: {
    invoke: mockIpcInvoke,
  },
} as any;

// Mock toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock UI components
jest.mock('@/components/ui/switch', () => ({
  Switch: ({ checked, onCheckedChange, disabled, id, ...props }: any) => (
    <button
      data-testid={id || 'switch'}
      data-checked={checked}
      data-disabled={disabled}
      onClick={() => onCheckedChange?.(!checked)}
      {...props}
    >
      Switch
    </button>
  ),
}));

jest.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: any) => children,
  Tooltip: ({ children }: any) => children,
  TooltipTrigger: ({ children }: any) => children,
  TooltipContent: ({ children }: any) => (
    <div data-testid="tooltip">{children}</div>
  ),
}));

describe('Platform-wise CUDA Switch Enhancement', () => {
  const mockUsePlatform = usePlatform as jest.MockedFunction<
    typeof usePlatform
  >;

  beforeEach(() => {
    jest.clearAllMocks();
    mockIpcInvoke.mockResolvedValue({});
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
    });

    test('should disable CUDA switch on macOS', async () => {
      // Import component after mocking
      const Settings = (await import('../../renderer/pages/[locale]/settings'))
        .default;

      render(<Settings />);

      await waitFor(() => {
        // Find all switches and check if any are disabled (CUDA switch should be disabled on macOS)
        const switches = screen.getAllByText('Switch');
        const disabledSwitches = switches.filter(
          (sw) => sw.getAttribute('data-disabled') === 'true',
        );
        expect(disabledSwitches.length).toBeGreaterThan(0);
      });
    });

    test('should show appropriate tooltip message for macOS', async () => {
      const Settings = (await import('../../renderer/pages/[locale]/settings'))
        .default;

      render(<Settings />);

      // The tooltip message will be in the rendered content somewhere
      await waitFor(() => {
        expect(screen.getByText('cudaNotAvailableOnMac')).toBeInTheDocument();
      });
    });

    test('should show error toast when trying to enable CUDA on macOS', async () => {
      const { toast } = await import('sonner');
      const Settings = (await import('../../renderer/pages/[locale]/settings'))
        .default;

      render(<Settings />);

      await waitFor(async () => {
        const cudaSwitch = screen.getByTestId('cuda-switch');

        // Try to enable CUDA switch
        fireEvent.click(cudaSwitch);

        await waitFor(() => {
          expect(toast.error).toHaveBeenCalledWith(
            'CUDA is not available on Apple Silicon. Use Apple CoreML for GPU acceleration instead.',
          );
        });
      });
    });

    test('should gray out CUDA label text on macOS', async () => {
      const Settings = (await import('../../renderer/pages/[locale]/settings'))
        .default;

      render(<Settings />);

      await waitFor(() => {
        const cudaLabel = screen.getByText('useCuda');
        expect(cudaLabel).toHaveClass('text-muted-foreground');
      });
    });
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

    test('should enable CUDA switch on Windows', async () => {
      const Settings = (await import('../../renderer/pages/[locale]/settings'))
        .default;

      render(<Settings />);

      await waitFor(() => {
        const cudaSwitch = screen.getByTestId('cuda-switch');
        expect(cudaSwitch).toHaveAttribute('data-disabled', 'false');
      });
    });

    test('should show normal tooltip message for Windows', async () => {
      const Settings = (await import('../../renderer/pages/[locale]/settings'))
        .default;

      render(<Settings />);

      await waitFor(() => {
        const tooltip = screen.getByTestId('tooltip');
        expect(tooltip).toHaveTextContent('useCudaTip');
      });
    });

    test('should allow CUDA switch toggle on Windows', async () => {
      mockIpcInvoke.mockResolvedValue({
        useCuda: false,
      });

      const Settings = (await import('../../renderer/pages/[locale]/settings'))
        .default;

      render(<Settings />);

      await waitFor(async () => {
        const cudaSwitch = screen.getByTestId('cuda-switch');

        // Enable CUDA switch
        fireEvent.click(cudaSwitch);

        await waitFor(() => {
          expect(mockIpcInvoke).toHaveBeenCalledWith('setSettings', {
            useCuda: true,
          });
        });
      });
    });

    test('should not gray out CUDA label text on Windows', async () => {
      const Settings = (await import('../../renderer/pages/[locale]/settings'))
        .default;

      render(<Settings />);

      await waitFor(() => {
        const cudaLabel = screen.getByText('useCuda');
        expect(cudaLabel).not.toHaveClass('text-muted-foreground');
      });
    });
  });

  describe('Linux Platform Behavior', () => {
    beforeEach(() => {
      mockUsePlatform.mockReturnValue({
        platform: 'linux',
        capabilities: {
          supportsCUDA: true,
          supportsOpenVINO: true,
          supportsAppleML: false,
          platformName: 'Linux',
          displayName: 'Linux',
        },
        isMacOS: false,
        isWindows: false,
        isLinux: true,
        isAppleSilicon: false,
      });
    });

    test('should enable CUDA switch on Linux', async () => {
      const Settings = (await import('../../renderer/pages/[locale]/settings'))
        .default;

      render(<Settings />);

      await waitFor(() => {
        const cudaSwitch = screen.getByTestId('cuda-switch');
        expect(cudaSwitch).toHaveAttribute('data-disabled', 'false');
      });
    });

    test('should allow CUDA functionality on Linux', async () => {
      mockIpcInvoke.mockResolvedValue({
        useCuda: false,
      });

      const Settings = (await import('../../renderer/pages/[locale]/settings'))
        .default;

      render(<Settings />);

      await waitFor(async () => {
        const cudaSwitch = screen.getByTestId('cuda-switch');

        fireEvent.click(cudaSwitch);

        await waitFor(() => {
          expect(mockIpcInvoke).toHaveBeenCalledWith('setSettings', {
            useCuda: true,
          });
        });
      });
    });
  });

  describe('Platform Detection Integration', () => {
    test('should adapt switch behavior based on platform capabilities', async () => {
      // Test with unknown platform initially
      mockUsePlatform.mockReturnValue({
        platform: 'unknown',
        capabilities: {
          supportsCUDA: false,
          supportsOpenVINO: false,
          supportsAppleML: false,
          platformName: 'Unknown',
          displayName: 'Unknown Platform',
        },
        isMacOS: false,
        isWindows: false,
        isLinux: false,
        isAppleSilicon: false,
      });

      const Settings = (await import('../../renderer/pages/[locale]/settings'))
        .default;

      const { rerender } = render(<Settings />);

      // Initially disabled due to unknown platform
      await waitFor(() => {
        const cudaSwitch = screen.getByTestId('cuda-switch');
        expect(cudaSwitch).toHaveAttribute('data-disabled', 'true');
      });

      // Update to Windows platform
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

      rerender(<Settings />);

      // Now enabled due to Windows platform
      await waitFor(() => {
        const cudaSwitch = screen.getByTestId('cuda-switch');
        expect(cudaSwitch).toHaveAttribute('data-disabled', 'false');
      });
    });
  });
});
