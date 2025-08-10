/**
 * Jest Custom Matchers
 * Custom matchers for OpenVINO integration testing
 */

declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveGPUDevice(deviceId: string): R;
      toBeOpenVINOCompatible(): R;
      toHavePerformanceMetrics(): R;
    }
  }
}

expect.extend({
  toHaveGPUDevice(received: any[], deviceId: string) {
    const device = received.find((d: any) => d.id === deviceId);

    if (device) {
      return {
        message: () =>
          `Expected array not to contain GPU device with ID ${deviceId}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `Expected array to contain GPU device with ID ${deviceId}`,
        pass: false,
      };
    }
  },

  toBeOpenVINOCompatible(received: any) {
    const isCompatible = received.capabilities?.openvinoCompatible === true;

    if (isCompatible) {
      return {
        message: () => `Expected device not to be OpenVINO compatible`,
        pass: true,
      };
    } else {
      return {
        message: () => `Expected device to be OpenVINO compatible`,
        pass: false,
      };
    }
  },

  toHavePerformanceMetrics(received: any) {
    const hasMetrics =
      received.processingTime !== undefined &&
      received.memoryUsage !== undefined &&
      received.powerConsumption !== undefined &&
      received.throughput !== undefined;

    if (hasMetrics) {
      return {
        message: () => `Expected object not to have performance metrics`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `Expected object to have performance metrics (processingTime, memoryUsage, powerConsumption, throughput)`,
        pass: false,
      };
    }
  },
});

export {};
