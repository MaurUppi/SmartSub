/**
 * Parameter System Types for Dynamic Parameter Management
 *
 * This file contains shared types for the dynamic parameter system that allows
 * users to configure custom AI model parameters without code modification.
 */

import type {
  ParameterDefinition,
  ValidationError,
  ParameterValue,
  CustomParameterConfig,
  ExtendedProvider,
  ValidationRule,
  ParameterCategory,
  ProcessedParameters,
} from './provider';

// Re-export parameter-specific types for easy importing
export type {
  ParameterValue,
  CustomParameterConfig,
  ExtendedProvider,
  ParameterDefinition,
  ValidationRule,
  ParameterCategory,
  ProcessedParameters,
  ValidationError,
} from './provider';

// Additional parameter system specific types

export interface ParameterRegistry {
  [key: string]: ParameterDefinition;
}

export interface ParameterValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  convertedValue?: any;
}

export interface ParameterManagerConfig {
  enableValidation: boolean;
  maxParametersPerProvider: number;
  allowedParameterTypes: Array<
    'string' | 'number' | 'boolean' | 'object' | 'array'
  >;
}

export interface ParameterApplyResult {
  success: boolean;
  appliedCount: number;
  skippedCount: number;
  errors: ValidationError[];
}

// IPC Message types for parameter management
export interface IpcParameterMessage {
  action: 'get' | 'set' | 'delete' | 'reset' | 'validate';
  providerId: string;
  data?: any;
}

export interface IpcParameterResponse {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * UI-specific parameter types
 * @since 2025.1
 */

/** UI parameter category for component organization */
export type UIParameterCategory = 'headers' | 'body';

/** Parameter data types for UI */
export type ParameterType =
  | 'string'
  | 'integer'
  | 'float'
  | 'boolean'
  | 'object'
  | 'array';

/** Form interface for creating new parameters */
export interface NewParameterForm {
  key: string;
  type: ParameterType;
  value: any;
  category: UIParameterCategory;
}

/** Validation result for parameter preview system */
export interface PreviewValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/** Metrics for parameter preview system */
export interface PreviewMetrics {
  headerCount: number;
  bodyParamCount: number;
  estimatedSize: number;
  complexity: 'low' | 'medium' | 'high';
}
