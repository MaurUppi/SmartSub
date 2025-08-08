# Hook Mocking System Guide

## Overview

This comprehensive hook mocking system provides standardized, reusable mocks for all custom React hooks in the SmartSub application. It's designed to improve test reliability, reduce boilerplate, and ensure consistent testing patterns across the codebase.

## Features

- **Configurable Test Scenarios**: Pre-built scenarios for common testing situations
- **Automatic Mock Setup**: Hooks are automatically mocked when imported in tests
- **Utility Functions**: Helper functions for controlling mock behavior during tests
- **State Management**: Consistent state tracking across all hook mocks
- **Global Reset**: Easy cleanup between tests

## Available Hook Mocks

### 1. useGPUDetection Mock

Located: `renderer/hooks/__mocks__/useGPUDetection.ts`

**Test Scenarios:**

- `default`: Standard GPU detection with Intel Arc A770 and integrated graphics
- `noGPUs`: Only auto-detect and CPU options available
- `detecting`: Shows detection in progress
- `errorState`: GPU detection failed
- `noOpenVINOSupport`: GPUs without OpenVINO compatibility
- `requiredSetup`: GPUs that need driver setup

**Usage Example:**

```javascript
import { mockGPUDetectionUtils } from 'renderer/hooks/__mocks__/useGPUDetection';

beforeEach(() => {
  mockGPUDetectionUtils.setScenario('noGPUs');
});

test('should handle no GPU scenario', () => {
  // Your test code here
  const { result } = renderHook(() => useGPUDetection());
  expect(result.current.gpus).toHaveLength(2); // auto + cpu only
});
```

### 2. useSubtitles Mock

Located: `renderer/hooks/__mocks__/useSubtitles.ts`

**Test Scenarios:**

- `default`: Standard subtitles with translations
- `empty`: No subtitles loaded
- `noTranslations`: Subtitles without translation content
- `generateOnly`: Generate-only mode (no translations)
- `partialTranslations`: Mix of translated and untranslated subtitles

**Usage Example:**

```javascript
import { mockSubtitlesUtils } from 'renderer/hooks/__mocks__/useSubtitles';

test('should handle empty subtitles', () => {
  mockSubtitlesUtils.setScenario('empty');

  const { result } = renderHook(() =>
    useSubtitles(mockFile, true, 'translate', mockFormData),
  );
  expect(result.current.mergedSubtitles).toHaveLength(0);
});
```

### 3. useVideoPlayer Mock

Located: `renderer/hooks/__mocks__/useVideoPlayer.ts`

**Features:**

- Mocked ReactPlayer ref with seekTo, getCurrentTime, getDuration
- Controllable playback state (playing, paused, current time)
- Subtitle navigation tracking
- Playback rate control

**Usage Example:**

```javascript
import { mockVideoPlayerUtils } from 'renderer/hooks/__mocks__/useVideoPlayer';

test('should seek to subtitle time', () => {
  const mockSubtitles = [{ startTimeInSeconds: 10 /* ... */ }];
  const { result } = renderHook(() =>
    useVideoPlayer(mockSubtitles, -1, jest.fn()),
  );

  act(() => {
    result.current.handleSubtitleClick(0);
  });

  const calls = mockVideoPlayerUtils.getMockCalls();
  expect(calls.handleSubtitleClickCalled).toBe(true);
});
```

### 4. useParameterConfig Mock

Located: `renderer/hooks/__mocks__/useParameterConfig.tsx`

**Test Scenarios:**

- `default`: Standard configuration with headers and body parameters
- `empty`: No configuration loaded
- `loading`: Configuration loading state
- `withErrors`: Configuration with validation errors
- `unsavedChanges`: Configuration with unsaved changes

**Usage Example:**

```javascript
import { mockParameterConfigUtils } from 'renderer/hooks/__mocks__/useParameterConfig';

test('should handle loading state', () => {
  mockParameterConfigUtils.setScenario('loading');

  const { result } = renderHook(() => useParameterConfig());
  expect(result.current.state.isLoading).toBe(true);
});
```

### 5. useLocalStorageState Mock

Located: `renderer/hooks/__mocks__/useLocalStorageState.tsx`

**Features:**

- Mock localStorage storage
- Serialization/deserialization support
- Error simulation for edge cases
- Storage quota testing

**Usage Example:**

```javascript
import { mockLocalStorageStateUtils } from 'renderer/hooks/__mocks__/useLocalStorageState';

test('should persist state to localStorage', () => {
  const { result } = renderHook(() =>
    useLocalStorageState('test-key', 'default'),
  );

  act(() => {
    result.current[1]('new-value'); // setValue
  });

  expect(mockLocalStorageStateUtils.getStorageValue('test-key')).toBe(
    '"new-value"',
  );
});
```

## Global Utilities

### Hook Test Utilities (Global)

Available via `global.hookTestUtils`:

```javascript
// Reset all hook mocks
global.hookTestUtils.resetAllHookMocks();

// Set multiple test scenarios at once
global.hookTestUtils.setHookScenarios({
  gpu: 'noGPUs',
  subtitles: 'empty',
  parameterConfig: 'loading',
});

// Clear all test scenarios
global.hookTestUtils.clearHookScenarios();
```

### Hook Test Helpers

Located: `test/utils/hookTestHelpers.ts`

**Key Functions:**

- `renderHookWithWrapper`: Enhanced hook rendering with wrapper support
- `waitForHookAction`: Async action testing
- `expectHookState`: State assertion helpers
- `mockTimers`: Timer mock utilities
- `mockLocalStorage`: localStorage mock utilities
- `mockIPC`: IPC communication mock utilities

**Usage Example:**

```javascript
import hookTestHelpers from 'test/utils/hookTestHelpers';

test('should handle async actions', async () => {
  const { result } = hookTestHelpers.renderHookWithWrapper(() => useMyHook());

  await hookTestHelpers.waitForHookAction(result, async () => {
    await result.current.asyncAction();
  });

  hookTestHelpers.expectHookState(result, {
    loading: false,
    data: expect.any(Object),
  });
});
```

## Environment Variables for Test Scenarios

Set these in your test files to control hook behavior:

```javascript
// GPU Detection scenarios
process.env.JEST_GPU_SCENARIO =
  'noGPUs' | 'detecting' | 'errorState' | 'noOpenVINOSupport' | 'requiredSetup';

// Subtitle scenarios
process.env.JEST_SUBTITLE_SCENARIO =
  'empty' | 'noTranslations' | 'generateOnly' | 'partialTranslations';

// Parameter Config scenarios
process.env.JEST_PARAMETER_CONFIG_SCENARIO =
  'empty' | 'loading' | 'withErrors' | 'unsavedChanges';
```

## Best Practices

### 1. Always Reset Between Tests

```javascript
beforeEach(() => {
  global.hookTestUtils.resetAllHookMocks();
});
```

### 2. Use Specific Scenarios for Edge Cases

```javascript
describe('error handling', () => {
  beforeEach(() => {
    global.hookTestUtils.setHookScenarios({
      gpu: 'errorState',
      subtitles: 'empty',
    });
  });

  // Your error tests...
});
```

### 3. Test Hook Interactions

```javascript
test('should sync GPU selection with parameter config', () => {
  const { result: gpuResult } = renderHook(() => useGPUDetection());
  const { result: configResult } = renderHook(() => useParameterConfig());

  act(() => {
    gpuResult.current.selectGPU('intel-arc-a770');
  });

  // Verify the interaction...
});
```

### 4. Test Multiple Hook States

```javascript
test('should handle complex state combinations', () => {
  const mockUtils = mockGPUDetectionUtils;
  mockUtils.setDetecting(true);
  mockUtils.setError('Detection failed');

  const { result } = renderHook(() => useGPUDetection());

  expect(result.current.isDetecting).toBe(true);
  expect(result.current.error).toBe('Detection failed');
});
```

## Common Patterns

### Testing Component with Multiple Hooks

```javascript
import { render, screen } from '@testing-library/react';
import { MyComponent } from './MyComponent';

// Mocks are automatically applied via jest.react.setup.js
test('should render component with mocked hooks', () => {
  global.hookTestUtils.setHookScenarios({
    gpu: 'default',
    subtitles: 'default',
  });

  render(<MyComponent />);

  expect(screen.getByText('GPU detected')).toBeInTheDocument();
});
```

### Testing Error States

```javascript
test('should handle hook errors gracefully', () => {
  mockGPUDetectionUtils.setError('Hardware detection failed');

  render(<GPUSelectionComponent />);

  expect(screen.getByText(/hardware detection failed/i)).toBeInTheDocument();
});
```

### Testing Async Hook Actions

```javascript
test('should handle async hook refresh', async () => {
  const { result } = renderHook(() => useGPUDetection());

  await waitForHookAction(result, async () => {
    await result.current.refreshGPUs();
  });

  const calls = mockGPUDetectionUtils.getMockCalls();
  expect(calls.refreshCalled).toBe(true);
});
```

## Troubleshooting

### Mock Not Working

1. Ensure the hook is properly imported in your test
2. Check that `jest.react.setup.js` is being loaded
3. Verify the mock file exists in the correct `__mocks__` directory

### State Not Resetting

1. Make sure you're calling `resetAllHookMocks()` in `beforeEach`
2. Check that you're not setting global state outside of test functions
3. Ensure cleanup is happening in `afterEach`

### TypeScript Errors

1. Import mock utilities with proper types
2. Use `jest.mocked()` for better type inference
3. Check that mock return types match the real hook interfaces

## Contributing

When adding new hooks:

1. Create the mock in `renderer/hooks/__mocks__/`
2. Add test utilities with a `Utils` export
3. Include the hook in `jest.react.setup.js` auto-mock list
4. Add global utilities to `hookTestUtils`
5. Document usage patterns in this guide

## Performance Impact

- Mocks are lazy-loaded only when needed
- Automatic cleanup prevents memory leaks
- Global utilities are cached for performance
- Mock state is lightweight and efficient
