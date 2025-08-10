/**
 * GPU Performance Monitoring Type Definitions
 * @since 2025.1
 */

export interface PerformanceMetrics {
  sessionId: string;
  timestamp: number;

  // Processing information
  model: string;
  audioFile: string;
  audioDuration: number;
  addonType: string;
  gpuDisplayName: string;

  // Timing metrics
  startTime: number;
  endTime: number;
  processingTime: number;

  // Performance metrics
  speedupFactor: number;
  tokensPerSecond: number;
  realTimeRatio: number;

  // Resource metrics
  memoryUsage: MemoryUsage;
  gpuUtilization?: number;

  // Quality metrics
  transcriptionLength: number;
  errorCount: number;

  // Environment information
  deviceConfig: any;
  environmentConfig: any;
}

export interface MemoryUsage {
  heapUsed: number;
  heapTotal: number;
  external: number;
  arrayBuffers: number;
  rss: number;
  peak?: number;
}

export interface PerformanceReport {
  summary: PerformanceSummary;
  trends: PerformanceTrend[];
  recommendations: string[];
  averages: PerformanceAverage[];
}

export interface PerformanceSummary {
  totalSessions: number;
  averageSpeedup: number;
  totalProcessingTime: number;
  totalAudioDuration: number;
  mostUsedGPU: string;
  averageMemoryUsage: number;
}

export interface PerformanceTrend {
  addonType: string;
  averageSpeedup: number;
  sessionCount: number;
  trend: 'improving' | 'stable' | 'degrading';
}

export interface PerformanceAverage {
  addonType: string;
  model: string;
  averageSpeedup: number;
  averageProcessingTime: number;
  sessionCount: number;
}
