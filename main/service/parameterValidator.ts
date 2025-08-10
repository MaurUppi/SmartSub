/**
 * Parameter Validation Service
 *
 * Provides comprehensive validation for custom parameter configurations
 * including type checking, constraint validation, and security checks.
 */

import type {
  CustomParameterConfig,
  ParameterValue,
  ValidationError,
} from 'types/provider';

export interface ValidationRules {
  maxParameterCount?: number;
  maxKeyLength?: number;
  maxValueLength?: number;
  allowedValueTypes?: Array<
    'string' | 'number' | 'boolean' | 'object' | 'array'
  >;
  reservedKeys?: string[];
  requireHttpsForSecrets?: boolean;
  disallowedPatterns?: RegExp[];
}

export interface ValidationContext {
  providerId: string;
  isProduction?: boolean;
  securityLevel?: 'low' | 'medium' | 'high';
}

export class ParameterValidator {
  private readonly defaultRules: ValidationRules = {
    maxParameterCount: 50,
    maxKeyLength: 128,
    maxValueLength: 2048,
    allowedValueTypes: ['string', 'number', 'boolean', 'object', 'array'],
    reservedKeys: [
      'authorization',
      'content-type',
      'user-agent',
      'accept',
      'accept-encoding',
      'accept-language',
      'connection',
      'host',
      'content-length',
      'transfer-encoding',
      'upgrade',
      'via',
      'warning',
      'x-forwarded-for',
      'x-forwarded-host',
      'x-forwarded-proto',
    ],
    requireHttpsForSecrets: true,
    disallowedPatterns: [
      /password/i,
      /secret/i,
      /token/i,
      /key/i,
      /auth/i,
      /credential/i,
      /private/i,
    ],
  };

  /**
   * Validate a complete parameter configuration
   */
  async validateConfiguration(
    config: CustomParameterConfig,
    context: ValidationContext,
    customRules?: Partial<ValidationRules>,
  ): Promise<{ isValid: boolean; errors: ValidationError[] }> {
    const rules = { ...this.defaultRules, ...customRules };
    const errors: ValidationError[] = [];

    try {
      // Structure validation
      const structureErrors = this.validateStructure(config);
      if (structureErrors && Array.isArray(structureErrors)) {
        errors.push(...structureErrors);
      }

      // Header parameters validation
      if (config.headerParameters) {
        const headerErrors = this.validateParameters(
          config.headerParameters,
          'header',
          rules,
          context,
        );
        if (headerErrors && Array.isArray(headerErrors)) {
          errors.push(...headerErrors);
        }
      }

      // Body parameters validation
      if (config.bodyParameters) {
        const bodyErrors = this.validateParameters(
          config.bodyParameters,
          'body',
          rules,
          context,
        );
        if (bodyErrors && Array.isArray(bodyErrors)) {
          errors.push(...bodyErrors);
        }
      }

      // Cross-parameter validation
      const crossErrors = this.validateCrossParameters(config, rules, context);
      if (crossErrors && Array.isArray(crossErrors)) {
        errors.push(...crossErrors);
      }

      // Security validation
      const securityErrors = this.validateSecurity(config, rules, context);
      if (securityErrors && Array.isArray(securityErrors)) {
        errors.push(...securityErrors);
      }
    } catch (error) {
      errors.push({
        key: 'config',
        type: 'system',
        message: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate configuration structure
   */
  private validateStructure(config: CustomParameterConfig): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!config || typeof config !== 'object') {
      errors.push({
        key: 'config',
        message: 'Configuration must be a valid object',
        type: 'type',
      });
      return errors;
    }

    // Check for required fields structure
    if (
      config.headerParameters &&
      typeof config.headerParameters !== 'object'
    ) {
      errors.push({
        key: 'headerParameters',
        message: 'Header parameters must be an object',
        type: 'type',
      });
    }

    if (config.bodyParameters && typeof config.bodyParameters !== 'object') {
      errors.push({
        key: 'bodyParameters',
        message: 'Body parameters must be an object',
        type: 'type',
      });
    }

    // Validate version if present
    if (config.configVersion && typeof config.configVersion !== 'string') {
      errors.push({
        key: 'configVersion',
        message: 'Configuration version must be a string',
        type: 'type',
      });
    }

    return errors;
  }

  /**
   * Validate individual parameters
   */
  private validateParameters(
    parameters: Record<string, ParameterValue>,
    parameterType: 'header' | 'body',
    rules: ValidationRules,
    context: ValidationContext,
  ): ValidationError[] {
    const errors: ValidationError[] = [];
    const parameterCount = Object.keys(parameters).length;

    // Check parameter count limit
    if (rules.maxParameterCount && parameterCount > rules.maxParameterCount) {
      errors.push({
        key: `${parameterType}Parameters`,
        message: `Too many ${parameterType} parameters. Maximum allowed: ${rules.maxParameterCount}`,
        type: 'range',
      });
    }

    for (const [key, value] of Object.entries(parameters)) {
      const keyErrors = this.validateParameterKey(key, parameterType, rules);
      if (keyErrors && Array.isArray(keyErrors)) {
        errors.push(...keyErrors);
      }

      const valueErrors = this.validateParameterValue(
        key,
        value,
        parameterType,
        rules,
        context,
      );
      if (valueErrors && Array.isArray(valueErrors)) {
        errors.push(...valueErrors);
      }
    }

    return errors;
  }

  /**
   * Validate parameter key
   */
  private validateParameterKey(
    key: string,
    parameterType: 'header' | 'body',
    rules: ValidationRules,
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check key length
    if (rules.maxKeyLength && key.length > rules.maxKeyLength) {
      errors.push({
        key: key,
        message: `Parameter key too long. Maximum length: ${rules.maxKeyLength}`,
        type: 'range',
      });
    }

    // Check for empty key
    if (!key || key.trim().length === 0) {
      errors.push({
        key: key,
        message: 'Parameter key cannot be empty',
        type: 'format',
      });
    }

    // Check for reserved keys
    if (rules.reservedKeys && rules.reservedKeys.includes(key.toLowerCase())) {
      errors.push({
        key: key,
        message: `Parameter key '${key}' is reserved and cannot be used`,
        type: 'format',
      });
    }

    // Check for invalid characters in key
    if (parameterType === 'header' && !/^[a-zA-Z0-9\-_]+$/.test(key)) {
      errors.push({
        key: key,
        message: `Invalid characters in header key '${key}'. Only alphanumeric, hyphens, and underscores are allowed`,
        type: 'format',
      });
    }

    return errors;
  }

  /**
   * Validate parameter value
   */
  private validateParameterValue(
    key: string,
    value: ParameterValue,
    parameterType: 'header' | 'body',
    rules: ValidationRules,
    _context: ValidationContext,
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    if (value === null || value === undefined) {
      return errors; // Null/undefined values are allowed
    }

    const valueType = Array.isArray(value) ? 'array' : typeof value;

    // Check allowed value types
    if (
      rules.allowedValueTypes &&
      !rules.allowedValueTypes.includes(valueType as any)
    ) {
      errors.push({
        key: key,
        message: `Invalid value type '${valueType}' for parameter '${key}'. Allowed types: ${rules.allowedValueTypes.join(', ')}`,
        type: 'type',
      });
    }

    // Check value length for strings
    if (typeof value === 'string') {
      if (rules.maxValueLength && value.length > rules.maxValueLength) {
        errors.push({
          key: key,
          message: `Parameter value too long. Maximum length: ${rules.maxValueLength}`,
          type: 'range',
        });
      }

      // Check for potentially sensitive data patterns
      if (rules.disallowedPatterns) {
        for (const pattern of rules.disallowedPatterns) {
          if (pattern.test(key) || pattern.test(value)) {
            errors.push({
              key: key,
              message: `Parameter '${key}' may contain sensitive data. Consider using environment variables or secure storage`,
              type: 'system',
            });
            break;
          }
        }
      }
    }

    // Validate object values
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      try {
        JSON.stringify(value);
      } catch (error) {
        errors.push({
          key: key,
          message: `Parameter '${key}' contains non-serializable object`,
          type: 'type',
        });
      }
    }

    // Header-specific validation
    if (parameterType === 'header') {
      const headerErrors = this.validateHeaderValue(key, value);
      if (headerErrors && Array.isArray(headerErrors)) {
        errors.push(...headerErrors);
      }
    }

    return errors;
  }

  /**
   * Validate header-specific values
   */
  private validateHeaderValue(
    key: string,
    value: ParameterValue,
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    // Headers should typically be strings
    if (typeof value !== 'string' && value !== null && value !== undefined) {
      errors.push({
        key: key,
        message: `Header '${key}' should be a string value`,
        type: 'type',
      });
    }

    // Check for control characters in header values
    if (typeof value === 'string' && /[\x00-\x1F\x7F]/.test(value)) {
      errors.push({
        key: key,
        message: `Header '${key}' contains invalid control characters`,
        type: 'format',
      });
    }

    return errors;
  }

  /**
   * Cross-parameter validation
   */
  private validateCrossParameters(
    config: CustomParameterConfig,
    _rules: ValidationRules,
    _context: ValidationContext,
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check for duplicate keys between headers and body
    const headerKeys = Object.keys(config.headerParameters || {});
    const bodyKeys = Object.keys(config.bodyParameters || {});
    const duplicates = headerKeys.filter((key) => bodyKeys.includes(key));

    if (duplicates.length > 0) {
      errors.push({
        key: 'parameters',
        message: `Duplicate parameter keys found in headers and body: ${duplicates.join(', ')}`,
        type: 'dependency',
      });
    }

    // Check for conflicting content-type specifications
    const hasContentTypeHeader = headerKeys.some(
      (key) => key.toLowerCase() === 'content-type',
    );
    const hasBodyParams = bodyKeys.length > 0;

    if (hasContentTypeHeader && hasBodyParams) {
      // This might be intentional, but worth flagging
      errors.push({
        key: 'parameters',
        message:
          'Both Content-Type header and body parameters are specified. Ensure they are compatible',
        type: 'dependency',
      });
    }

    return errors;
  }

  /**
   * Security-focused validation
   */
  private validateSecurity(
    config: CustomParameterConfig,
    _rules: ValidationRules,
    context: ValidationContext,
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    const allParams = {
      ...config.headerParameters,
      ...config.bodyParameters,
    };

    // Check for potentially sensitive parameter names or values
    for (const [key, value] of Object.entries(allParams)) {
      if (typeof value === 'string') {
        // Check for hardcoded credentials patterns
        if (this.containsCredentialPattern(key, value)) {
          errors.push({
            key: key,
            message: `Parameter '${key}' appears to contain hardcoded credentials. Use environment variables or secure configuration`,
            type: 'system',
          });
        }

        // Check for URLs with embedded credentials
        if (this.containsUrlWithCredentials(value)) {
          errors.push({
            key: key,
            message: `Parameter '${key}' contains URL with embedded credentials`,
            type: 'system',
          });
        }
      }
    }

    // Production-specific checks
    if (context.isProduction) {
      // In production, be more strict about certain patterns
      for (const [key, value] of Object.entries(allParams)) {
        if (
          typeof value === 'string' &&
          (value.includes('localhost') ||
            value.includes('127.0.0.1') ||
            value.includes('development') ||
            value.includes('test'))
        ) {
          errors.push({
            key: key,
            message: `Parameter '${key}' contains development/test values in production environment`,
            type: 'system',
          });
        }
      }
    }

    return errors;
  }

  /**
   * Check if parameter contains credential patterns
   */
  private containsCredentialPattern(key: string, value: string): boolean {
    const credentialPatterns = [
      /^[A-Za-z0-9+/]{20,}={0,2}$/, // Base64-like patterns
      /^[a-f0-9]{32,}$/i, // Hex patterns (API keys, tokens)
      /^sk-[a-zA-Z0-9]{20,}$/, // OpenAI-style API keys
      /^xoxb-[a-zA-Z0-9-]+$/, // Slack bot tokens
      /^ghp_[a-zA-Z0-9]{36}$/, // GitHub personal access tokens
    ];

    const suspiciousKeyWords = [
      'password',
      'secret',
      'token',
      'key',
      'auth',
      'credential',
      'private',
      'secure',
      'confidential',
    ];

    // Check if key suggests credentials
    const keyLower = key.toLowerCase();
    const hasCredentialKey = suspiciousKeyWords.some((word) =>
      keyLower.includes(word),
    );

    // Check if value matches credential patterns
    const hasCredentialPattern = credentialPatterns.some((pattern) =>
      pattern.test(value),
    );

    return hasCredentialKey && (hasCredentialPattern || value.length > 20);
  }

  /**
   * Check if value contains URL with embedded credentials
   */
  private containsUrlWithCredentials(value: string): boolean {
    const urlWithCredentialsPattern = /https?:\/\/[^:]+:[^@]+@/;
    return urlWithCredentialsPattern.test(value);
  }
}

// Export singleton instance
export const parameterValidator = new ParameterValidator();
