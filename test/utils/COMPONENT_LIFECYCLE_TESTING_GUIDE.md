# Component Lifecycle Testing Guide - Phase 1.1.3

This guide documents the standardized component lifecycle testing patterns implemented as part of Phase 1.1.3 of the Test Infrastructure Enhancement project.

## Overview

The standardized component lifecycle testing system provides consistent patterns for:

- Component mount/unmount lifecycle testing
- Prop passing validation
- Accessibility testing support
- Memory leak detection
- Performance testing
- Component variant testing

## Core Features

### 1. Component Lifecycle Testing

- **Mount/Unmount Validation**: Ensures components mount and unmount without errors
- **Multiple Cycle Testing**: Tests multiple mount/unmount cycles to catch memory leaks
- **Rerender Testing**: Validates components handle prop changes gracefully
- **Memory Leak Detection**: Monitors memory usage growth during testing

### 2. Prop Validation Testing

- **Valid Value Testing**: Tests components with valid prop values
- **Invalid Value Handling**: Ensures components handle invalid props gracefully
- **Required Prop Validation**: Tests behavior with missing required props
- **Custom Validation**: Supports custom validation logic for complex props

### 3. Accessibility Testing

- **Axe Integration**: Automated accessibility violation detection
- **ARIA Label Validation**: Ensures interactive elements have proper labels
- **Keyboard Navigation**: Tests keyboard accessibility
- **Focus Management**: Validates focus behavior
- **Semantic Structure**: Checks heading hierarchy and landmarks

### 4. Performance Testing

- **Render Time Monitoring**: Ensures components render within acceptable timeframes
- **Rerender Performance**: Tests performance during multiple rerenders
- **Memory Usage Tracking**: Monitors memory consumption during testing

## Usage

### Basic Component Test Suite

```typescript
import {
  runComponentTestSuite,
  ComponentTestConfig,
  PropValidationTest,
  AccessibilityTestConfig,
  PerformanceTestConfig,
} from '../utils/componentTestHelpers';

const componentConfig: ComponentTestConfig<MyComponentProps> = {
  component: MyComponent,
  defaultProps: {
    /* default props */
  },
  testId: 'my-component',
  displayName: 'MyComponent',
};

const propTests: PropValidationTest<MyComponentProps>[] = [
  {
    propName: 'title',
    validValues: ['Test Title', ''],
    invalidValues: [null, undefined, 123],
    requiredProp: true,
  },
  // ... more prop tests
];

const accessibilityConfig: AccessibilityTestConfig = {
  skipAxeCheck: false,
  focusableElements: ['button', 'input'],
  ariaLabels: ['Submit', 'Cancel'],
};

const performanceConfig: PerformanceTestConfig = {
  maxRenderTime: 100,
  rerenderCount: 5,
};

// Run the complete test suite
runComponentTestSuite(componentConfig, {
  propTests,
  accessibilityConfig,
  performanceConfig,
  scenarios: [
    {
      name: 'should handle custom scenario',
      test: async (result, utils) => {
        // Custom test logic
      },
    },
  ],
});
```

### Component Variants Testing

```typescript
import { testComponentVariants } from '../utils/componentTestHelpers';

testComponentVariants(componentConfig, [
  { name: 'with dark theme', props: { theme: 'dark' } },
  { name: 'with disabled state', props: { disabled: true } },
  { name: 'with loading state', props: { isLoading: true } },
]);
```

### Manual Lifecycle Testing

```typescript
import {
  mountComponent,
  testComponentLifecycle,
} from '../utils/componentTestHelpers';

describe('Manual Lifecycle Tests', () => {
  it('should mount and unmount correctly', () => {
    const result = mountComponent(MyComponent, props);
    expect(result.container.firstChild).toBeInTheDocument();

    result.unmount();
    expect(result.container.firstChild).toBeNull();
  });
});
```

## Configuration Options

### ComponentTestConfig

```typescript
interface ComponentTestConfig<P = any> {
  component: ComponentType<P>; // React component to test
  defaultProps: P; // Default props for testing
  testId?: string; // Main test ID to check for
  displayName?: string; // Display name for test descriptions
  skipAccessibilityTests?: boolean; // Skip accessibility testing
  skipPerformanceTests?: boolean; // Skip performance testing
  customQueries?: Record<string, Function>; // Custom query functions
}
```

### PropValidationTest

```typescript
interface PropValidationTest<P = any> {
  propName: keyof P; // Name of the prop to test
  validValues: P[keyof P][]; // Array of valid values
  invalidValues?: any[]; // Array of invalid values
  requiredProp?: boolean; // Whether prop is required
  expectRender?: boolean; // Whether component should render
  expectError?: boolean; // Whether error is expected
  customValidator?: Function; // Custom validation function
}
```

### AccessibilityTestConfig

```typescript
interface AccessibilityTestConfig {
  skipAxeCheck?: boolean; // Skip axe accessibility check
  skipAriaLabels?: boolean; // Skip ARIA label validation
  skipKeyboardNavigation?: boolean; // Skip keyboard navigation test
  skipFocusManagement?: boolean; // Skip focus management test
  customAxeRules?: any; // Custom axe rules
  focusableElements?: string[]; // CSS selectors for focusable elements
  ariaLabels?: string[]; // Expected ARIA labels
}
```

### PerformanceTestConfig

```typescript
interface PerformanceTestConfig {
  maxRenderTime?: number; // Max render time in ms (default: 100)
  maxMemoryUsage?: number; // Max memory usage in bytes
  rerenderCount?: number; // Number of rerenders to test (default: 10)
  skipMemoryLeakDetection?: boolean; // Skip memory leak detection
}
```

## Global Testing Utilities

The system provides global utilities available in all tests:

### componentTestUtils

- `checkMemoryLeak()`: Check for memory leaks
- `getFocusedElement()`: Get currently focused element
- `cleanDOMState()`: Clean DOM state
- `getAccessibilityViolations()`: Get accessibility violations
- `measureRenderTime()`: Measure render performance

### propTestUtils

- `generatePropTestValues(type)`: Generate test values for prop types
- `getEdgeCaseValues()`: Get edge case values for testing
- `validatePropBehavior()`: Validate prop behavior

### standardComponentTests

- `testMountUnmount()`: Standard mount/unmount test
- `testProps()`: Standard prop validation test
- `testAccessibility()`: Standard accessibility test
- `testPerformance()`: Standard performance test

## Integration with React Testing Library

The system is built on top of React Testing Library and provides:

- Enhanced cleanup with memory leak detection
- Automatic DOM state management
- Accessibility testing integration with jest-axe
- Performance monitoring with browser APIs

## Best Practices

### 1. Use Comprehensive Prop Testing

```typescript
const propTests: PropValidationTest<Props>[] = [
  {
    propName: 'onClick',
    validValues: [jest.fn(), () => {}],
    invalidValues: [null, 'not a function', 123],
    requiredProp: true,
  },
  {
    propName: 'variant',
    validValues: ['primary', 'secondary', 'danger'],
    invalidValues: ['invalid', 123, null],
    customValidator: async (value, result) => {
      // Check if variant class is applied
      const element = result.container.firstChild;
      expect(element).toHaveClass(`variant-${value}`);
    },
  },
];
```

### 2. Test Component Variants

```typescript
testComponentVariants(config, [
  { name: 'default state', props: {} },
  { name: 'loading state', props: { isLoading: true } },
  { name: 'error state', props: { error: 'Something went wrong' } },
  { name: 'disabled state', props: { disabled: true } },
]);
```

### 3. Add Custom Test Scenarios

```typescript
const scenarios: ComponentTestScenario<Props>[] = [
  {
    name: 'should handle form submission',
    props: { onSubmit: jest.fn() },
    test: async (result, utils) => {
      const form = within(result.container).getByRole('form');
      utils.fireEvent.submit(form);

      await utils.waitFor(() => {
        expect(props.onSubmit).toHaveBeenCalled();
      });
    },
  },
];
```

### 4. Configure Accessibility Testing

```typescript
const accessibilityConfig: AccessibilityTestConfig = {
  skipAxeCheck: false,
  focusableElements: ['button', 'input[type="text"]', '[role="button"]'],
  ariaLabels: ['Submit Form', 'Cancel', 'Required Field'],
  customAxeRules: {
    rules: {
      'color-contrast': { enabled: true },
      'keyboard-navigation': { enabled: true },
    },
  },
};
```

## Expected Improvements

Phase 1.1.3 implementation should contribute:

- **+20-25 additional passing tests** through standardized lifecycle management
- **Consistent prop validation** across all component tests
- **Accessibility testing coverage** for all components
- **Memory leak detection** preventing production issues
- **Performance monitoring** ensuring optimal component behavior

## Migration from Existing Tests

To migrate existing component tests:

1. **Import the new utilities**:

```typescript
import {
  runComponentTestSuite,
  ComponentTestConfig,
  PropValidationTest,
} from '../utils/componentTestHelpers';
```

2. **Define component configuration**:

```typescript
const componentConfig: ComponentTestConfig<Props> = {
  component: YourComponent,
  defaultProps: {
    /* your default props */
  },
  testId: 'your-component',
  displayName: 'YourComponent',
};
```

3. **Define prop tests**:

```typescript
const propTests: PropValidationTest<Props>[] = [
  // Convert existing prop tests to this format
];
```

4. **Run the test suite**:

```typescript
runComponentTestSuite(componentConfig, {
  propTests,
  scenarios: [
    /* custom scenarios */
  ],
});
```

5. **Keep existing custom tests** alongside the standardized suite for specific functionality.

## Support and Troubleshooting

### Common Issues

1. **jest-axe not available**: Set `skipAxeCheck: true` in accessibility config
2. **Performance.memory not available**: Memory leak detection will be skipped automatically
3. **Component doesn't have testId**: Specify `testId` in component config or use container validation
4. **Custom prop validation fails**: Use `customValidator` function for complex prop testing

### Debug Mode

Enable debug logging by setting environment variable:

```bash
DEBUG_COMPONENT_TESTS=true npm test
```

This will provide detailed information about:

- Memory usage tracking
- Accessibility violation details
- Performance measurements
- Prop validation results

## Integration with CI/CD

The standardized testing patterns integrate with existing CI/CD:

- All tests use standard Jest/RTL APIs
- Memory leak warnings are logged but don't fail tests
- Performance thresholds can be configured per component
- Accessibility violations can be configured to fail builds

This system ensures consistent, comprehensive testing across all React components while maintaining compatibility with existing test infrastructure.
