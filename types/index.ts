/**
 * Central export point for all type definitions
 * @since 2025.1
 */

// Core GPU types
export * from './gpu';
export * from './gpu-config';
export * from './gpu-performance';
export * from './gpu-error';

// Application types
export * from './settings';
export * from './types';

// Parameter types (core types from provider.ts, UI types from parameterSystem.ts)
export type {
  ParameterValue,
  ValidationRule,
  ParameterCategory,
  ParameterDefinition,
  ValidationError,
  CustomParameterConfig,
  Provider,
  ExtendedProvider,
  ProcessedParameters,
} from './provider';

// UI-specific parameter types
export type {
  UIParameterCategory,
  ParameterType,
  NewParameterForm,
  PreviewValidationResult,
  PreviewMetrics,
  IpcParameterMessage,
  IpcParameterResponse,
  ParameterRegistry,
  ParameterValidationResult,
  ParameterManagerConfig,
  ParameterApplyResult,
} from './parameterSystem';

// Provider types
export type { ProviderField, ProviderType } from './provider';
export {
  PROVIDER_TYPES,
  CONFIG_TEMPLATES,
  defaultUserPrompt,
  defaultSystemPrompt,
} from './provider';

// Window types
export * from './window';

// Convenience re-exports for common application types
export type {
  // Core Application types from ./types
  IFiles,
  IFormData,
  ISystemInfo,
  ITask,
  TaskStatus,
  ITaskProgress,
  FileStatus,
  Subtitle,
  SubtitleStats,
  PlayerSubtitleTrack,
  TranslationResult,
} from './types';
