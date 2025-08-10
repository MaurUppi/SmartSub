/**
 * Parameter System Types for Dynamic Parameter Management
 *
 * This file contains shared types for the dynamic parameter system that allows
 * users to configure custom AI model parameters without code modification.
 */

/**
 * NOTE: We maintain our own parameter types to avoid dependency on UPSTREAM provider.ts
 * These types are compatible with provider types but are independently defined.
 * Use type guards when interfacing with provider code if needed.
 *
 * @since 2025.1
 */

// ============= CORE PARAMETER TYPES =============

/**
 * Value type for any parameter - can be primitive or complex
 */
export type ParameterValue = string | number | boolean | object | any[];

/**
 * Validation rule for parameter values
 */
export interface ValidationRule {
  min?: number;
  max?: number;
  enum?: any[];
  pattern?: string;
  dependencies?: Record<string, any>;
}

/**
 * Category classification for parameters
 */
export type ParameterCategory =
  | 'provider'
  | 'performance'
  | 'quality'
  | 'experimental';

/**
 * Complete definition of a parameter including validation and metadata
 */
export interface ParameterDefinition {
  key: string;
  type: 'string' | 'integer' | 'float' | 'boolean' | 'object' | 'array';
  category: 'core' | 'behavior' | 'response' | 'provider' | 'performance';
  required: boolean;
  defaultValue?: ParameterValue;
  validation?: ValidationRule;
  description: string;
  providerSupport: string[];
}

/**
 * Validation error structure for parameter validation failures
 */
export interface ValidationError {
  key: string;
  type: 'type' | 'range' | 'format' | 'dependency' | 'system';
  message: string;
  suggestion?: string;
}

/**
 * Configuration for custom parameters with versioning
 */
export interface CustomParameterConfig {
  headerParameters: Record<string, ParameterValue>;
  bodyParameters: Record<string, ParameterValue>;
  configVersion: string;
  lastModified: number;
}

/**
 * Base provider interface for type compatibility
 */
export interface Provider {
  id: string;
  name: string;
  type: string;
  isAi: boolean;
  [key: string]: any;
}

/**
 * Extended provider with custom parameter support
 */
export interface ExtendedProvider extends Provider {
  customParameters?: CustomParameterConfig;
}

/**
 * Result of parameter processing with validation results
 */
export interface ProcessedParameters {
  headers: Record<string, string | number>;
  body: Record<string, any>;
  appliedParameters: string[];
  skippedParameters: string[];
  validationErrors: ValidationError[];
}

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
