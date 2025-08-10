import * as GPUConfigTypes from '../../../types/gpu-config';

describe('GPU Configuration Type Definitions', () => {
  it('should export AddonInfo interface', () => {
    const addonInfo: GPUConfigTypes.AddonInfo = {
      type: 'openvino',
      path: 'addon-openvino.node',
      displayName: 'Intel OpenVINO',
      deviceConfig: {
        deviceId: 'GPU.0',
        memory: 16384,
        type: 'discrete',
      },
    };
    expect(addonInfo).toBeDefined();
    expect(addonInfo.type).toBe('openvino');
  });

  it('should export WhisperFunction interface', () => {
    const whisperFunc: GPUConfigTypes.WhisperFunction = (params, callback) => {
      callback(null, { result: 'test' });
    };
    expect(typeof whisperFunc).toBe('function');
  });

  it('should export GPUConfig interface', () => {
    const config: GPUConfigTypes.GPUConfig = {
      addonInfo: {} as GPUConfigTypes.AddonInfo,
      whisperParams: {} as GPUConfigTypes.WhisperGPUParams,
      performanceHints: {} as GPUConfigTypes.PerformanceHints,
      environmentConfig: {} as GPUConfigTypes.EnvironmentConfig,
    };
    expect(config).toBeDefined();
  });

  it('should export WhisperGPUParams interface', () => {
    const params: GPUConfigTypes.WhisperGPUParams = {
      use_gpu: true,
      openvino_device: 'GPU.0',
      performance_mode: 'throughput',
    };
    expect(params.use_gpu).toBe(true);
    expect(params.performance_mode).toBe('throughput');
  });

  it('should export PerformanceHints interface', () => {
    const hints: GPUConfigTypes.PerformanceHints = {
      expectedSpeedup: 3.5,
      memoryUsage: 'medium',
      powerEfficiency: 'good',
      processingPriority: 'high',
    };
    expect(hints.expectedSpeedup).toBe(3.5);
  });

  it('should export EnvironmentConfig interface', () => {
    const envConfig: GPUConfigTypes.EnvironmentConfig = {
      openvinoDeviceId: 'GPU.0',
      openvino_cache_dir: '/tmp/openvino_cache',
      openvino_enable_optimizations: true,
    };
    expect(envConfig.openvinoDeviceId).toBe('GPU.0');
  });

  it('should export VADSettings interface', () => {
    const vadSettings: GPUConfigTypes.VADSettings = {
      useVAD: true,
      vadThreshold: 0.5,
      vadMinSpeechDuration: 250,
      vadMinSilenceDuration: 100,
      vadMaxSpeechDuration: 30000,
      vadSpeechPad: 30,
      vadSamplesOverlap: 0.1,
    };
    expect(vadSettings.useVAD).toBe(true);
    expect(vadSettings.vadThreshold).toBe(0.5);
  });
});
