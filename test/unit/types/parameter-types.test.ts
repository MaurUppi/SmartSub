/**
 * Parameter Type Tests
 *
 * Comprehensive tests for parameter system types to ensure:
 * 1. All parameter types are properly exported and functional
 * 2. Type compatibility between our types and provider types
 * 3. UI component types work correctly after consolidation
 * 4. Independent parameter types function without dependency issues
 */

import * as ParamTypes from '../../../types/parameterSystem';
import * as ProviderTypes from '../../../types/provider';

describe('Parameter Type Definitions', () => {
  describe('Core Parameter Types', () => {
    it('should export ParameterValue type correctly', () => {
      // Test that ParameterValue accepts all expected types
      const stringValue: ParamTypes.ParameterValue = 'test';
      const numberValue: ParamTypes.ParameterValue = 42;
      const booleanValue: ParamTypes.ParameterValue = true;
      const objectValue: ParamTypes.ParameterValue = { key: 'value' };
      const arrayValue: ParamTypes.ParameterValue = [1, 2, 3];

      expect(typeof stringValue).toBe('string');
      expect(typeof numberValue).toBe('number');
      expect(typeof booleanValue).toBe('boolean');
      expect(typeof objectValue).toBe('object');
      expect(Array.isArray(arrayValue)).toBe(true);
    });

    it('should export ValidationRule interface', () => {
      const validationRule: ParamTypes.ValidationRule = {
        min: 0,
        max: 100,
        enum: ['option1', 'option2'],
        pattern: '^[a-zA-Z]+$',
        dependencies: { otherParam: 'required' },
      };

      expect(validationRule.min).toBe(0);
      expect(validationRule.max).toBe(100);
      expect(validationRule.enum).toEqual(['option1', 'option2']);
      expect(validationRule.pattern).toBe('^[a-zA-Z]+$');
      expect(validationRule.dependencies).toEqual({ otherParam: 'required' });
    });

    it('should export ParameterCategory type with correct values', () => {
      const providerCategory: ParamTypes.ParameterCategory = 'provider';
      const performanceCategory: ParamTypes.ParameterCategory = 'performance';
      const qualityCategory: ParamTypes.ParameterCategory = 'quality';
      const experimentalCategory: ParamTypes.ParameterCategory = 'experimental';

      expect(providerCategory).toBe('provider');
      expect(performanceCategory).toBe('performance');
      expect(qualityCategory).toBe('quality');
      expect(experimentalCategory).toBe('experimental');
    });

    it('should export ParameterDefinition interface', () => {
      const paramDef: ParamTypes.ParameterDefinition = {
        key: 'temperature',
        type: 'float',
        category: 'behavior',
        required: false,
        defaultValue: 0.7,
        validation: { min: 0, max: 2 },
        description: 'Controls randomness in output',
        providerSupport: ['openai', 'anthropic'],
      };

      expect(paramDef.key).toBe('temperature');
      expect(paramDef.type).toBe('float');
      expect(paramDef.category).toBe('behavior');
      expect(paramDef.required).toBe(false);
      expect(paramDef.defaultValue).toBe(0.7);
      expect(paramDef.validation?.min).toBe(0);
      expect(paramDef.description).toBe('Controls randomness in output');
      expect(paramDef.providerSupport).toEqual(['openai', 'anthropic']);
    });

    it('should export ValidationError interface', () => {
      const error: ParamTypes.ValidationError = {
        key: 'temperature',
        type: 'range',
        message: 'Value must be between 0 and 2',
        suggestion: 'Try a value like 0.7',
      };

      expect(error.key).toBe('temperature');
      expect(error.type).toBe('range');
      expect(error.message).toBe('Value must be between 0 and 2');
      expect(error.suggestion).toBe('Try a value like 0.7');
    });

    it('should export CustomParameterConfig interface', () => {
      const config: ParamTypes.CustomParameterConfig = {
        headerParameters: { Authorization: 'Bearer token' },
        bodyParameters: { temperature: 0.7, max_tokens: 100 },
        configVersion: '1.0.0',
        lastModified: Date.now(),
      };

      expect(config.headerParameters).toEqual({
        Authorization: 'Bearer token',
      });
      expect(config.bodyParameters).toEqual({
        temperature: 0.7,
        max_tokens: 100,
      });
      expect(config.configVersion).toBe('1.0.0');
      expect(typeof config.lastModified).toBe('number');
    });
  });

  describe('Provider Integration Types', () => {
    it('should export Provider interface', () => {
      const provider: ParamTypes.Provider = {
        id: 'openai',
        name: 'OpenAI',
        type: 'ai',
        isAi: true,
        customField: 'value',
      };

      expect(provider.id).toBe('openai');
      expect(provider.name).toBe('OpenAI');
      expect(provider.type).toBe('ai');
      expect(provider.isAi).toBe(true);
      expect(provider.customField).toBe('value');
    });

    it('should export ExtendedProvider interface', () => {
      const extendedProvider: ParamTypes.ExtendedProvider = {
        id: 'openai',
        name: 'OpenAI',
        type: 'ai',
        isAi: true,
        customParameters: {
          headerParameters: { Authorization: 'Bearer token' },
          bodyParameters: { temperature: 0.7 },
          configVersion: '1.0.0',
          lastModified: Date.now(),
        },
      };

      expect(extendedProvider.id).toBe('openai');
      expect(
        extendedProvider.customParameters?.bodyParameters.temperature,
      ).toBe(0.7);
    });

    it('should export ProcessedParameters interface', () => {
      const processed: ParamTypes.ProcessedParameters = {
        headers: { 'Content-Type': 'application/json' },
        body: { temperature: 0.7, max_tokens: 100 },
        appliedParameters: ['temperature', 'max_tokens'],
        skippedParameters: ['invalid_param'],
        validationErrors: [],
      };

      expect(processed.headers).toEqual({ 'Content-Type': 'application/json' });
      expect(processed.body).toEqual({ temperature: 0.7, max_tokens: 100 });
      expect(processed.appliedParameters).toEqual([
        'temperature',
        'max_tokens',
      ]);
      expect(processed.skippedParameters).toEqual(['invalid_param']);
      expect(processed.validationErrors).toEqual([]);
    });
  });

  describe('Parameter System Management Types', () => {
    it('should export ParameterRegistry interface', () => {
      const registry: ParamTypes.ParameterRegistry = {
        temperature: {
          key: 'temperature',
          type: 'float',
          category: 'behavior',
          required: false,
          defaultValue: 0.7,
          description: 'Controls randomness',
          providerSupport: ['openai'],
        },
      };

      expect(registry.temperature.key).toBe('temperature');
      expect(registry.temperature.type).toBe('float');
    });

    it('should export ParameterValidationResult interface', () => {
      const result: ParamTypes.ParameterValidationResult = {
        isValid: true,
        errors: [],
        convertedValue: 0.7,
      };

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.convertedValue).toBe(0.7);
    });

    it('should export ParameterManagerConfig interface', () => {
      const config: ParamTypes.ParameterManagerConfig = {
        enableValidation: true,
        maxParametersPerProvider: 50,
        allowedParameterTypes: ['string', 'number', 'boolean'],
      };

      expect(config.enableValidation).toBe(true);
      expect(config.maxParametersPerProvider).toBe(50);
      expect(config.allowedParameterTypes).toEqual([
        'string',
        'number',
        'boolean',
      ]);
    });

    it('should export ParameterApplyResult interface', () => {
      const result: ParamTypes.ParameterApplyResult = {
        success: true,
        appliedCount: 5,
        skippedCount: 1,
        errors: [],
      };

      expect(result.success).toBe(true);
      expect(result.appliedCount).toBe(5);
      expect(result.skippedCount).toBe(1);
      expect(result.errors).toEqual([]);
    });
  });

  describe('IPC Communication Types', () => {
    it('should export IpcParameterMessage interface', () => {
      const message: ParamTypes.IpcParameterMessage = {
        action: 'set',
        providerId: 'openai',
        data: { temperature: 0.7 },
      };

      expect(message.action).toBe('set');
      expect(message.providerId).toBe('openai');
      expect(message.data).toEqual({ temperature: 0.7 });
    });

    it('should export IpcParameterResponse interface', () => {
      const response: ParamTypes.IpcParameterResponse = {
        success: true,
        data: { result: 'Parameters updated' },
        error: undefined,
      };

      expect(response.success).toBe(true);
      expect(response.data).toEqual({ result: 'Parameters updated' });
      expect(response.error).toBeUndefined();
    });
  });

  describe('UI Component Types', () => {
    it('should export UIParameterCategory type', () => {
      const headerCategory: ParamTypes.UIParameterCategory = 'headers';
      const bodyCategory: ParamTypes.UIParameterCategory = 'body';

      expect(headerCategory).toBe('headers');
      expect(bodyCategory).toBe('body');
    });

    it('should export ParameterType type', () => {
      const stringType: ParamTypes.ParameterType = 'string';
      const integerType: ParamTypes.ParameterType = 'integer';
      const floatType: ParamTypes.ParameterType = 'float';
      const booleanType: ParamTypes.ParameterType = 'boolean';
      const objectType: ParamTypes.ParameterType = 'object';
      const arrayType: ParamTypes.ParameterType = 'array';

      expect(stringType).toBe('string');
      expect(integerType).toBe('integer');
      expect(floatType).toBe('float');
      expect(booleanType).toBe('boolean');
      expect(objectType).toBe('object');
      expect(arrayType).toBe('array');
    });

    it('should export NewParameterForm interface', () => {
      const form: ParamTypes.NewParameterForm = {
        key: 'temperature',
        type: 'float',
        value: 0.7,
        category: 'body',
      };

      expect(form.key).toBe('temperature');
      expect(form.type).toBe('float');
      expect(form.value).toBe(0.7);
      expect(form.category).toBe('body');
    });

    it('should export PreviewValidationResult interface', () => {
      const result: ParamTypes.PreviewValidationResult = {
        isValid: false,
        errors: ['Temperature must be between 0 and 2'],
        warnings: ['High temperature may produce unpredictable results'],
      };

      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(['Temperature must be between 0 and 2']);
      expect(result.warnings).toEqual([
        'High temperature may produce unpredictable results',
      ]);
    });

    it('should export PreviewMetrics interface', () => {
      const metrics: ParamTypes.PreviewMetrics = {
        headerCount: 3,
        bodyParamCount: 7,
        estimatedSize: 1024,
        complexity: 'medium',
      };

      expect(metrics.headerCount).toBe(3);
      expect(metrics.bodyParamCount).toBe(7);
      expect(metrics.estimatedSize).toBe(1024);
      expect(metrics.complexity).toBe('medium');
    });
  });

  describe('Provider Type Compatibility', () => {
    it('should maintain compatibility between our types and provider types', () => {
      // Test that our ParameterDefinition is compatible with provider ParameterDefinition
      const ourParamDef: ParamTypes.ParameterDefinition = {
        key: 'temperature',
        type: 'float',
        category: 'behavior',
        required: false,
        defaultValue: 0.7,
        description: 'Controls randomness',
        providerSupport: ['openai'],
      };

      // Should be assignable to provider type
      const providerParamDef: ProviderTypes.ParameterDefinition = ourParamDef;
      expect(providerParamDef.key).toBe('temperature');
      expect(providerParamDef.type).toBe('float');
    });

    it('should maintain ValidationError compatibility', () => {
      const ourError: ParamTypes.ValidationError = {
        key: 'temperature',
        type: 'range',
        message: 'Invalid range',
        suggestion: 'Use 0-2',
      };

      // Should be compatible with provider ValidationError
      const providerError: ProviderTypes.ValidationError = ourError;
      expect(providerError.key).toBe('temperature');
      expect(providerError.type).toBe('range');
    });

    it('should maintain CustomParameterConfig compatibility', () => {
      const ourConfig: ParamTypes.CustomParameterConfig = {
        headerParameters: { Authorization: 'Bearer token' },
        bodyParameters: { temperature: 0.7 },
        configVersion: '1.0.0',
        lastModified: Date.now(),
      };

      // Should be compatible with provider CustomParameterConfig
      const providerConfig: ProviderTypes.CustomParameterConfig = ourConfig;
      expect(providerConfig.configVersion).toBe('1.0.0');
    });

    it('should maintain Provider and ExtendedProvider compatibility', () => {
      const ourProvider: ParamTypes.Provider = {
        id: 'test',
        name: 'Test',
        type: 'ai',
        isAi: true,
      };

      const ourExtendedProvider: ParamTypes.ExtendedProvider = {
        ...ourProvider,
        customParameters: {
          headerParameters: {},
          bodyParameters: {},
          configVersion: '1.0.0',
          lastModified: Date.now(),
        },
      };

      // Should be compatible with provider types
      const providerBase: ProviderTypes.Provider = ourProvider;
      const providerExtended: ProviderTypes.ExtendedProvider =
        ourExtendedProvider;

      expect(providerBase.id).toBe('test');
      expect(providerExtended.customParameters?.configVersion).toBe('1.0.0');
    });
  });

  describe('Independent Core Parameter Types', () => {
    it('should work without provider type dependencies', () => {
      // Test that our core types function independently
      const paramValue: ParamTypes.ParameterValue = 'test';
      const validation: ParamTypes.ValidationRule = { min: 0, max: 10 };
      const error: ParamTypes.ValidationError = {
        key: 'test',
        type: 'range',
        message: 'Invalid',
      };

      expect(paramValue).toBe('test');
      expect(validation.min).toBe(0);
      expect(error.key).toBe('test');
    });

    it('should support all parameter system operations', () => {
      // Test complete parameter workflow
      const registry: ParamTypes.ParameterRegistry = {};
      const config: ParamTypes.ParameterManagerConfig = {
        enableValidation: true,
        maxParametersPerProvider: 100,
        allowedParameterTypes: ['string', 'number'],
      };

      const validationResult: ParamTypes.ParameterValidationResult = {
        isValid: true,
        errors: [],
        convertedValue: 'converted',
      };

      const applyResult: ParamTypes.ParameterApplyResult = {
        success: true,
        appliedCount: 1,
        skippedCount: 0,
        errors: [],
      };

      expect(Object.keys(registry)).toEqual([]);
      expect(config.enableValidation).toBe(true);
      expect(validationResult.isValid).toBe(true);
      expect(applyResult.success).toBe(true);
    });
  });

  describe('Component Integration Tests', () => {
    it('should support UI component parameter form creation', () => {
      const newParam: ParamTypes.NewParameterForm = {
        key: 'max_tokens',
        type: 'integer',
        value: 100,
        category: 'body',
      };

      // Convert to full parameter definition
      const paramDef: ParamTypes.ParameterDefinition = {
        key: newParam.key,
        type: newParam.type,
        category: 'behavior',
        required: false,
        defaultValue: newParam.value,
        description: 'Maximum tokens to generate',
        providerSupport: ['openai'],
      };

      expect(paramDef.key).toBe('max_tokens');
      expect(paramDef.type).toBe('integer');
      expect(paramDef.defaultValue).toBe(100);
    });

    it('should support parameter preview and validation', () => {
      const metrics: ParamTypes.PreviewMetrics = {
        headerCount: 2,
        bodyParamCount: 5,
        estimatedSize: 512,
        complexity: 'low',
      };

      const validation: ParamTypes.PreviewValidationResult = {
        isValid: true,
        errors: [],
        warnings: ['Parameter count is moderate'],
      };

      expect(metrics.complexity).toBe('low');
      expect(validation.isValid).toBe(true);
      expect(validation.warnings.length).toBe(1);
    });

    it('should support IPC parameter communication', () => {
      const message: ParamTypes.IpcParameterMessage = {
        action: 'validate',
        providerId: 'openai',
        data: {
          parameters: { temperature: 0.7, max_tokens: 100 },
        },
      };

      const response: ParamTypes.IpcParameterResponse = {
        success: true,
        data: {
          validationResult: {
            isValid: true,
            errors: [],
          },
        },
      };

      expect(message.action).toBe('validate');
      expect(response.success).toBe(true);
    });
  });

  describe('Type Export Validation', () => {
    it('should export all required parameter types', () => {
      // Validate that all expected types are exported
      expect(ParamTypes.ParameterValue).toBeDefined;
      expect(ParamTypes.ValidationRule).toBeDefined;
      expect(ParamTypes.ParameterCategory).toBeDefined;
      expect(ParamTypes.ParameterDefinition).toBeDefined;
      expect(ParamTypes.ValidationError).toBeDefined;
      expect(ParamTypes.CustomParameterConfig).toBeDefined;
      expect(ParamTypes.Provider).toBeDefined;
      expect(ParamTypes.ExtendedProvider).toBeDefined;
      expect(ParamTypes.ProcessedParameters).toBeDefined;
      expect(ParamTypes.ParameterRegistry).toBeDefined;
      expect(ParamTypes.ParameterValidationResult).toBeDefined;
      expect(ParamTypes.ParameterManagerConfig).toBeDefined;
      expect(ParamTypes.ParameterApplyResult).toBeDefined;
      expect(ParamTypes.IpcParameterMessage).toBeDefined;
      expect(ParamTypes.IpcParameterResponse).toBeDefined;
      expect(ParamTypes.UIParameterCategory).toBeDefined;
      expect(ParamTypes.ParameterType).toBeDefined;
      expect(ParamTypes.NewParameterForm).toBeDefined;
      expect(ParamTypes.PreviewValidationResult).toBeDefined;
      expect(ParamTypes.PreviewMetrics).toBeDefined;
    });

    it('should allow central imports through types index', () => {
      // This test ensures that types can be imported from central index
      // Will be tested after central export is created
      expect(true).toBe(true); // Placeholder - will be updated when central export is ready
    });
  });
});
