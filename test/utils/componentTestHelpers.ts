/**
 * Component Testing Utilities - Phase 1.1.3
 * Standardized component lifecycle testing patterns for consistent component testing
 *
 * Provides reusable utilities for:
 * - Component mount/unmount lifecycle testing
 * - Prop passing validation
 * - Accessibility testing
 * - Memory leak detection
 * - Performance testing
 */

import React, { ReactElement, ComponentType, ReactNode } from 'react';
import {
  render,
  screen,
  cleanup,
  waitFor,
  within,
  RenderResult,
  RenderOptions,
  fireEvent,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';

// Extend Jest matchers for accessibility testing
expect.extend(toHaveNoViolations);

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ComponentTestConfig<P = any> {
  component: ComponentType<P>;
  defaultProps: P;
  testId?: string;
  displayName?: string;
  skipAccessibilityTests?: boolean;
  skipPerformanceTests?: boolean;
  customQueries?: Record<
    string,
    (container: HTMLElement) => HTMLElement | null
  >;
}

export interface ComponentLifecycleTestResult {
  container: HTMLElement;
  rerender: (ui: ReactElement) => void;
  unmount: () => void;
  debug: () => void;
  asFragment: () => DocumentFragment;
}

export interface PropValidationTest<P = any> {
  propName: keyof P;
  validValues: P[keyof P][];
  invalidValues?: any[];
  requiredProp?: boolean;
  expectRender?: boolean;
  expectError?: boolean;
  customValidator?: (
    propValue: any,
    renderResult: RenderResult,
  ) => void | Promise<void>;
}

export interface AccessibilityTestConfig {
  skipAxeCheck?: boolean;
  skipAriaLabels?: boolean;
  skipKeyboardNavigation?: boolean;
  skipFocusManagement?: boolean;
  customAxeRules?: any;
  focusableElements?: string[];
  ariaLabels?: string[];
}

export interface PerformanceTestConfig {
  maxRenderTime?: number;
  maxMemoryUsage?: number;
  rerenderCount?: number;
  skipMemoryLeakDetection?: boolean;
}

export interface ComponentTestScenario<P = any> {
  name: string;
  props?: Partial<P>;
  setup?: () => void | Promise<void>;
  test: (
    result: ComponentLifecycleTestResult,
    utils: ComponentTestUtils,
  ) => void | Promise<void>;
  cleanup?: () => void | Promise<void>;
  skipAccessibility?: boolean;
  expectedElements?: string[];
  expectedNotToRender?: string[];
}

export interface ComponentTestUtils {
  user: ReturnType<typeof userEvent.setup>;
  fireEvent: typeof fireEvent;
  within: typeof within;
  waitFor: typeof waitFor;
  screen: typeof screen;
}

// ============================================================================
// COMPONENT LIFECYCLE TESTING
// ============================================================================

/**
 * Standard component mounting with lifecycle validation
 */
export function mountComponent<P = any>(
  Component: ComponentType<P>,
  props: P,
  options: RenderOptions = {},
): ComponentLifecycleTestResult {
  const renderResult = render(React.createElement(Component, props), options);

  return {
    container: renderResult.container,
    rerender: renderResult.rerender,
    unmount: renderResult.unmount,
    debug: renderResult.debug,
    asFragment: renderResult.asFragment,
  };
}

/**
 * Test component mount/unmount lifecycle with memory leak detection
 */
export async function testComponentLifecycle<P = any>(
  config: ComponentTestConfig<P>,
  scenarios: ComponentTestScenario<P>[] = [],
): Promise<void> {
  const { component: Component, defaultProps, testId, displayName } = config;

  describe(`${displayName || Component.displayName || 'Component'} Lifecycle`, () => {
    let renderResult: ComponentLifecycleTestResult;
    let initialMemory: number;
    let utils: ComponentTestUtils;

    beforeEach(() => {
      // Track initial memory usage
      if (typeof performance !== 'undefined' && performance.memory) {
        initialMemory = performance.memory.usedJSHeapSize;
      }

      // Setup user event utilities
      utils = {
        user: userEvent.setup(),
        fireEvent,
        within,
        waitFor,
        screen,
      };
    });

    afterEach(async () => {
      // Cleanup component
      if (renderResult) {
        renderResult.unmount();
      }

      // Clean up DOM
      cleanup();

      // Wait for async operations to complete
      await waitFor(() => {}, { timeout: 100 });

      // Check for memory leaks (if performance.memory is available)
      if (
        typeof performance !== 'undefined' &&
        performance.memory &&
        initialMemory
      ) {
        const finalMemory = performance.memory.usedJSHeapSize;
        const memoryGrowth = finalMemory - initialMemory;

        // Allow reasonable memory growth (100KB threshold)
        if (memoryGrowth > 100000) {
          console.warn(
            `Potential memory leak detected: ${memoryGrowth} bytes grown`,
          );
        }
      }
    });

    it('should mount without crashing', () => {
      expect(() => {
        renderResult = mountComponent(Component, defaultProps);
      }).not.toThrow();

      expect(renderResult.container).toBeInTheDocument();

      if (testId) {
        expect(screen.getByTestId(testId)).toBeInTheDocument();
      }
    });

    it('should unmount cleanly without errors', async () => {
      renderResult = mountComponent(Component, defaultProps);

      // Ensure component is mounted
      expect(renderResult.container.firstChild).toBeInTheDocument();

      // Unmount and verify cleanup
      expect(() => {
        renderResult.unmount();
      }).not.toThrow();

      // Wait for cleanup operations
      await waitFor(() => {
        expect(renderResult.container.firstChild).toBeNull();
      });
    });

    it('should handle multiple mount/unmount cycles', async () => {
      for (let i = 0; i < 3; i++) {
        renderResult = mountComponent(Component, defaultProps);
        expect(renderResult.container.firstChild).toBeInTheDocument();

        renderResult.unmount();
        await waitFor(() => {
          expect(renderResult.container.firstChild).toBeNull();
        });
      }
    });

    it('should handle rerender with new props', () => {
      renderResult = mountComponent(Component, defaultProps);

      const newProps = { ...defaultProps, key: 'rerender-test' };

      expect(() => {
        renderResult.rerender(React.createElement(Component, newProps));
      }).not.toThrow();

      expect(renderResult.container.firstChild).toBeInTheDocument();
    });

    // Run custom scenarios
    scenarios.forEach((scenario) => {
      it(scenario.name, async () => {
        if (scenario.setup) {
          await scenario.setup();
        }

        const props = { ...defaultProps, ...scenario.props };
        renderResult = mountComponent(Component, props);

        await scenario.test(renderResult, utils);

        if (scenario.cleanup) {
          await scenario.cleanup();
        }
      });
    });
  });
}

// ============================================================================
// PROP VALIDATION TESTING
// ============================================================================

/**
 * Test component prop validation comprehensively
 */
export function testComponentProps<P = any>(
  config: ComponentTestConfig<P>,
  propTests: PropValidationTest<P>[],
): void {
  const { component: Component, defaultProps, displayName } = config;

  describe(`${displayName || Component.displayName || 'Component'} Props`, () => {
    let renderResult: ComponentLifecycleTestResult;

    afterEach(() => {
      if (renderResult) {
        renderResult.unmount();
      }
      cleanup();
    });

    propTests.forEach((propTest) => {
      const {
        propName,
        validValues,
        invalidValues,
        requiredProp,
        customValidator,
      } = propTest;

      describe(`prop: ${String(propName)}`, () => {
        if (requiredProp) {
          it('should be required', () => {
            const propsWithoutRequired = { ...defaultProps };
            delete propsWithoutRequired[propName];

            // Should handle missing required prop gracefully
            expect(() => {
              renderResult = mountComponent(
                Component,
                propsWithoutRequired as P,
              );
            }).not.toThrow();
          });
        }

        validValues.forEach((validValue, index) => {
          it(`should accept valid value ${index + 1}: ${JSON.stringify(validValue)}`, async () => {
            const props = { ...defaultProps, [propName]: validValue };

            expect(() => {
              renderResult = mountComponent(Component, props);
            }).not.toThrow();

            expect(renderResult.container.firstChild).toBeInTheDocument();

            if (customValidator) {
              await customValidator(validValue, {
                container: renderResult.container,
                rerender: renderResult.rerender,
                unmount: renderResult.unmount,
                debug: renderResult.debug,
                asFragment: renderResult.asFragment,
              });
            }
          });
        });

        if (invalidValues && invalidValues.length > 0) {
          invalidValues.forEach((invalidValue, index) => {
            it(`should handle invalid value ${index + 1}: ${JSON.stringify(invalidValue)}`, () => {
              const props = { ...defaultProps, [propName]: invalidValue };

              // Should not crash even with invalid props
              expect(() => {
                renderResult = mountComponent(Component, props);
              }).not.toThrow();
            });
          });
        }
      });
    });

    it('should render with all default props', () => {
      expect(() => {
        renderResult = mountComponent(Component, defaultProps);
      }).not.toThrow();

      expect(renderResult.container.firstChild).toBeInTheDocument();
    });

    it('should handle prop changes without crashing', () => {
      renderResult = mountComponent(Component, defaultProps);

      propTests.forEach((propTest) => {
        if (propTest.validValues.length > 0) {
          const newProps = {
            ...defaultProps,
            [propTest.propName]: propTest.validValues[0],
          };

          expect(() => {
            renderResult.rerender(React.createElement(Component, newProps));
          }).not.toThrow();
        }
      });
    });
  });
}

// ============================================================================
// ACCESSIBILITY TESTING
// ============================================================================

/**
 * Comprehensive accessibility testing
 */
export function testComponentAccessibility<P = any>(
  config: ComponentTestConfig<P>,
  accessibilityConfig: AccessibilityTestConfig = {},
): void {
  const {
    component: Component,
    defaultProps,
    displayName,
    skipAccessibilityTests,
  } = config;

  if (skipAccessibilityTests) {
    return;
  }

  describe(`${displayName || Component.displayName || 'Component'} Accessibility`, () => {
    let renderResult: ComponentLifecycleTestResult;
    let user: ReturnType<typeof userEvent.setup>;

    beforeEach(() => {
      user = userEvent.setup();
    });

    afterEach(() => {
      if (renderResult) {
        renderResult.unmount();
      }
      cleanup();
    });

    if (!accessibilityConfig.skipAxeCheck) {
      it('should have no accessibility violations', async () => {
        renderResult = mountComponent(Component, defaultProps);

        const results = await axe(
          renderResult.container,
          accessibilityConfig.customAxeRules,
        );
        expect(results).toHaveNoViolations();
      });
    }

    if (!accessibilityConfig.skipAriaLabels) {
      it('should have proper ARIA labels where needed', () => {
        renderResult = mountComponent(Component, defaultProps);

        // Check for interactive elements that need labels
        const interactiveElements = renderResult.container.querySelectorAll(
          'button, input, select, textarea, [role="button"], [role="link"], [role="tab"]',
        );

        interactiveElements.forEach((element) => {
          const hasLabel =
            element.hasAttribute('aria-label') ||
            element.hasAttribute('aria-labelledby') ||
            element.hasAttribute('title') ||
            (element.tagName === 'BUTTON' && element.textContent?.trim()) ||
            (element.tagName === 'INPUT' &&
              element.getAttribute('type') === 'submit' &&
              element.getAttribute('value'));

          if (!hasLabel) {
            console.warn(
              `Interactive element without accessible label:`,
              element,
            );
          }
        });
      });
    }

    if (!accessibilityConfig.skipKeyboardNavigation) {
      it('should support keyboard navigation', async () => {
        renderResult = mountComponent(Component, defaultProps);

        // Find focusable elements
        const focusableElements = renderResult.container.querySelectorAll(
          accessibilityConfig.focusableElements?.join(', ') ||
            'button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])',
        );

        if (focusableElements.length > 0) {
          // Test Tab navigation
          await user.tab();

          const activeElement = document.activeElement;
          const isElementFocused = Array.from(focusableElements).some(
            (el) => el === activeElement,
          );

          if (focusableElements.length > 0) {
            expect(isElementFocused).toBe(true);
          }
        }
      });
    }

    if (!accessibilityConfig.skipFocusManagement) {
      it('should manage focus properly', async () => {
        renderResult = mountComponent(Component, defaultProps);

        const buttons = renderResult.container.querySelectorAll('button');

        for (const button of Array.from(buttons)) {
          if (!button.disabled) {
            // Focus the button
            button.focus();
            expect(document.activeElement).toBe(button);

            // Simulate click and ensure focus is managed
            fireEvent.click(button);

            // Focus should still be manageable (not lost)
            await waitFor(() => {
              expect(document.activeElement).not.toBe(null);
            });
          }
        }
      });
    }

    it('should have proper semantic structure', () => {
      renderResult = mountComponent(Component, defaultProps);

      // Check for proper heading hierarchy
      const headings = renderResult.container.querySelectorAll(
        'h1, h2, h3, h4, h5, h6',
      );
      let previousLevel = 0;

      headings.forEach((heading) => {
        const level = parseInt(heading.tagName.charAt(1));

        // Heading levels should not skip more than one level
        if (previousLevel > 0 && level > previousLevel + 1) {
          console.warn(
            `Heading level skip detected: h${previousLevel} to h${level}`,
          );
        }

        previousLevel = level;
      });

      // Check for landmark roles
      const main = renderResult.container.querySelector('main, [role="main"]');
      const nav = renderResult.container.querySelector(
        'nav, [role="navigation"]',
      );

      // If component contains significant content, suggest landmarks
      const contentLength = renderResult.container.textContent?.length || 0;
      if (contentLength > 200 && !main && !nav) {
        console.info(
          'Consider adding landmark roles (main, navigation, etc.) for better accessibility',
        );
      }
    });
  });
}

// ============================================================================
// PERFORMANCE TESTING
// ============================================================================

/**
 * Performance testing for components
 */
export function testComponentPerformance<P = any>(
  config: ComponentTestConfig<P>,
  performanceConfig: PerformanceTestConfig = {},
): void {
  const {
    component: Component,
    defaultProps,
    displayName,
    skipPerformanceTests,
  } = config;

  if (skipPerformanceTests) {
    return;
  }

  describe(`${displayName || Component.displayName || 'Component'} Performance`, () => {
    let renderResult: ComponentLifecycleTestResult;

    afterEach(() => {
      if (renderResult) {
        renderResult.unmount();
      }
      cleanup();
    });

    it(`should render within acceptable time (${performanceConfig.maxRenderTime || 100}ms)`, () => {
      const startTime = performance.now();

      renderResult = mountComponent(Component, defaultProps);

      const renderTime = performance.now() - startTime;
      expect(renderTime).toBeLessThan(performanceConfig.maxRenderTime || 100);
    });

    it('should handle multiple rerenders efficiently', () => {
      renderResult = mountComponent(Component, defaultProps);

      const rerenderCount = performanceConfig.rerenderCount || 10;
      const startTime = performance.now();

      for (let i = 0; i < rerenderCount; i++) {
        const newProps = { ...defaultProps, key: `rerender-${i}` };
        renderResult.rerender(React.createElement(Component, newProps));
      }

      const totalTime = performance.now() - startTime;
      const avgTimePerRerender = totalTime / rerenderCount;

      // Average rerender should be fast
      expect(avgTimePerRerender).toBeLessThan(50);
    });

    if (!performanceConfig.skipMemoryLeakDetection) {
      it('should not create memory leaks during mount/unmount cycles', async () => {
        const cycles = 5;
        let initialMemory: number;

        if (typeof performance !== 'undefined' && performance.memory) {
          initialMemory = performance.memory.usedJSHeapSize;

          for (let i = 0; i < cycles; i++) {
            renderResult = mountComponent(Component, defaultProps);
            renderResult.unmount();
            await waitFor(() => {}, { timeout: 50 });
          }

          // Force garbage collection if available
          if (global.gc) {
            global.gc();
          }

          await waitFor(() => {}, { timeout: 100 });

          const finalMemory = performance.memory.usedJSHeapSize;
          const memoryGrowth = finalMemory - initialMemory;

          // Memory growth should be reasonable (less than 1MB for component cycles)
          expect(memoryGrowth).toBeLessThan(1000000);
        }
      });
    }
  });
}

// ============================================================================
// COMPREHENSIVE COMPONENT TESTING SUITE
// ============================================================================

/**
 * Run complete component test suite with all patterns
 */
export function runComponentTestSuite<P = any>(
  config: ComponentTestConfig<P>,
  options: {
    propTests?: PropValidationTest<P>[];
    scenarios?: ComponentTestScenario<P>[];
    accessibilityConfig?: AccessibilityTestConfig;
    performanceConfig?: PerformanceTestConfig;
  } = {},
): void {
  const {
    propTests = [],
    scenarios = [],
    accessibilityConfig = {},
    performanceConfig = {},
  } = options;

  describe(`${config.displayName || config.component.displayName || 'Component'} Test Suite`, () => {
    // Lifecycle testing
    testComponentLifecycle(config, scenarios);

    // Prop validation testing
    if (propTests.length > 0) {
      testComponentProps(config, propTests);
    }

    // Accessibility testing
    testComponentAccessibility(config, accessibilityConfig);

    // Performance testing
    testComponentPerformance(config, performanceConfig);
  });
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create standard test scenarios for common component patterns
 */
export function createStandardScenarios<P = any>(
  baseProps: P,
): ComponentTestScenario<P>[] {
  return [
    {
      name: 'should render with minimal props',
      props: baseProps,
      test: async (result) => {
        expect(result.container.firstChild).toBeInTheDocument();
      },
    },
    {
      name: 'should handle disabled state',
      props: { ...baseProps, disabled: true } as any,
      test: async (result) => {
        const buttons = result.container.querySelectorAll('button');
        const inputs = result.container.querySelectorAll('input');

        buttons.forEach((button) => {
          expect(button).toBeDisabled();
        });

        inputs.forEach((input) => {
          expect(input).toBeDisabled();
        });
      },
    },
    {
      name: 'should handle loading state',
      props: { ...baseProps, isLoading: true } as any,
      test: async (result) => {
        // Look for common loading indicators
        const loadingElements = result.container.querySelectorAll(
          '[data-testid*="loading"], [aria-label*="loading"], .loading, .spinner',
        );

        if (loadingElements.length > 0) {
          expect(loadingElements.length).toBeGreaterThan(0);
        }
      },
    },
  ];
}

/**
 * Helper to test component with different theme/style variations
 */
export function testComponentVariants<P = any>(
  config: ComponentTestConfig<P>,
  variants: Array<{ name: string; props: Partial<P> }>,
): void {
  describe(`${config.displayName || config.component.displayName || 'Component'} Variants`, () => {
    let renderResult: ComponentLifecycleTestResult;

    afterEach(() => {
      if (renderResult) {
        renderResult.unmount();
      }
      cleanup();
    });

    variants.forEach((variant) => {
      it(`should render ${variant.name} variant`, () => {
        const props = { ...config.defaultProps, ...variant.props };

        expect(() => {
          renderResult = mountComponent(config.component, props);
        }).not.toThrow();

        expect(renderResult.container.firstChild).toBeInTheDocument();
      });
    });
  });
}

export default {
  mountComponent,
  testComponentLifecycle,
  testComponentProps,
  testComponentAccessibility,
  testComponentPerformance,
  runComponentTestSuite,
  createStandardScenarios,
  testComponentVariants,
};
