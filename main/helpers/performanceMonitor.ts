/**
 * Performance Monitoring Module for Intel OpenVINO Integration
 * Comprehensive performance tracking, analytics, and optimization
 */

import { logMessage } from './logger';
import { store } from './store';
import { AddonInfo, GPUConfig } from '../../types/gpu-config';
import {
  PerformanceMetrics,
  MemoryUsage,
  PerformanceReport,
  PerformanceSummary,
  PerformanceTrend,
  PerformanceAverage,
} from '../../types/gpu-performance';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';

/**
 * Performance monitoring class for GPU operations
 */
export class GPUPerformanceMonitor {
  private static instance: GPUPerformanceMonitor;
  private metricsHistory: PerformanceMetrics[] = [];
  private currentSession: Partial<PerformanceMetrics> | null = null;
  private metricsFilePath: string;

  constructor() {
    this.metricsFilePath = path.join(
      app.getPath('userData'),
      'performance-metrics.json',
    );
    this.loadMetricsHistory();
  }

  static getInstance(): GPUPerformanceMonitor {
    if (!GPUPerformanceMonitor.instance) {
      GPUPerformanceMonitor.instance = new GPUPerformanceMonitor();
    }
    return GPUPerformanceMonitor.instance;
  }

  /**
   * Start performance monitoring session
   */
  startSession(config: GPUConfig, audioFile: string, model: string): string {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.currentSession = {
      sessionId,
      timestamp: Date.now(),
      model,
      audioFile: path.basename(audioFile),
      addonType: config.addonInfo.type,
      gpuDisplayName: config.addonInfo.displayName,
      startTime: Date.now(),
      deviceConfig: config.addonInfo.deviceConfig,
      environmentConfig: config.environmentConfig,
      errorCount: 0,
    };

    logMessage(`Started performance monitoring session: ${sessionId}`, 'info');
    return sessionId;
  }

  /**
   * Update memory usage during processing
   */
  updateMemoryUsage(): void {
    if (!this.currentSession) return;

    const memoryUsage = process.memoryUsage();
    this.currentSession.memoryUsage = {
      heapUsed: memoryUsage.heapUsed,
      heapTotal: memoryUsage.heapTotal,
      external: memoryUsage.external,
      arrayBuffers: memoryUsage.arrayBuffers,
      rss: memoryUsage.rss,
      peak: Math.max(
        this.currentSession.memoryUsage?.peak || 0,
        memoryUsage.rss,
      ),
    };
  }

  /**
   * Track processing error
   */
  trackError(error: Error): void {
    if (!this.currentSession) return;

    this.currentSession.errorCount = (this.currentSession.errorCount || 0) + 1;
    logMessage(
      `Performance monitoring: Error tracked - ${error.message}`,
      'debug',
    );
  }

  /**
   * End performance monitoring session
   */
  async endSession(
    transcriptionResult: any,
    audioDuration: number,
  ): Promise<PerformanceMetrics> {
    if (!this.currentSession) {
      throw new Error('No active performance monitoring session');
    }

    const endTime = Date.now();
    const processingTime = endTime - this.currentSession.startTime!;
    const speedupFactor = await this.calculateSpeedup(
      processingTime,
      audioDuration,
    );

    const metrics: PerformanceMetrics = {
      ...this.currentSession,
      endTime,
      processingTime,
      audioDuration,
      speedupFactor,
      tokensPerSecond: this.calculateTokensPerSecond(
        transcriptionResult,
        processingTime,
      ),
      realTimeRatio: audioDuration / processingTime,
      transcriptionLength: transcriptionResult?.transcription?.length || 0,
      memoryUsage: this.currentSession.memoryUsage || this.getMemoryUsage(),
    } as PerformanceMetrics;

    // Store metrics
    this.metricsHistory.push(metrics);
    this.saveMetricsHistory();

    // Log performance summary
    this.logSessionSummary(metrics);

    this.currentSession = null;

    return metrics;
  }

  /**
   * Calculate processing speedup factor
   */
  private async calculateSpeedup(
    processingTime: number,
    audioDuration: number,
  ): Promise<number> {
    if (audioDuration <= 0) return 1.0;

    // Real-time factor (how many times faster than real-time)
    const realTimeFactor = audioDuration / processingTime;

    // Compare against baseline CPU performance if available
    const baselineSpeedup = await this.getBaselineSpeedup(audioDuration);

    return Math.max(realTimeFactor, baselineSpeedup);
  }

  /**
   * Get baseline speedup for comparison
   */
  private async getBaselineSpeedup(audioDuration: number): Promise<number> {
    // Look for recent CPU processing times for similar duration
    const cpuMetrics = this.metricsHistory
      .filter(
        (m) =>
          m.addonType === 'cpu' &&
          Math.abs(m.audioDuration - audioDuration) < 30000,
      )
      .slice(-5); // Last 5 similar CPU runs

    if (cpuMetrics.length === 0) {
      return 1.0; // No baseline available
    }

    const avgCpuTime =
      cpuMetrics.reduce((sum, m) => sum + m.processingTime, 0) /
      cpuMetrics.length;
    return audioDuration / avgCpuTime;
  }

  /**
   * Calculate tokens per second processing rate
   */
  private calculateTokensPerSecond(
    transcriptionResult: any,
    processingTime: number,
  ): number {
    if (!transcriptionResult?.transcription) return 0;

    // Estimate tokens (rough approximation: 1 token ≈ 4 characters)
    const estimatedTokens = transcriptionResult.transcription.length / 4;
    const processingTimeSeconds = processingTime / 1000;

    return processingTimeSeconds > 0
      ? estimatedTokens / processingTimeSeconds
      : 0;
  }

  /**
   * Get current memory usage
   */
  private getMemoryUsage(): MemoryUsage {
    const memoryUsage = process.memoryUsage();
    return {
      heapUsed: memoryUsage.heapUsed,
      heapTotal: memoryUsage.heapTotal,
      external: memoryUsage.external,
      arrayBuffers: memoryUsage.arrayBuffers,
      rss: memoryUsage.rss,
    };
  }

  /**
   * Log session performance summary
   */
  private logSessionSummary(metrics: PerformanceMetrics): void {
    logMessage(`Performance Summary for ${metrics.sessionId}:`, 'info');
    logMessage(
      `  GPU: ${metrics.gpuDisplayName} (${metrics.addonType})`,
      'info',
    );
    logMessage(`  Model: ${metrics.model}`, 'info');
    logMessage(
      `  Audio Duration: ${(metrics.audioDuration / 1000).toFixed(2)}s`,
      'info',
    );
    logMessage(
      `  Processing Time: ${(metrics.processingTime / 1000).toFixed(2)}s`,
      'info',
    );
    logMessage(
      `  Speedup Factor: ${metrics.speedupFactor.toFixed(2)}x`,
      'info',
    );
    logMessage(
      `  Real-time Ratio: ${metrics.realTimeRatio.toFixed(2)}x`,
      'info',
    );
    logMessage(
      `  Memory Peak: ${(metrics.memoryUsage.peak || metrics.memoryUsage.rss / 1024 / 1024).toFixed(2)}MB`,
      'info',
    );

    if (metrics.errorCount > 0) {
      logMessage(`  Errors: ${metrics.errorCount}`, 'warning');
    }
  }

  /**
   * Generate comprehensive performance report
   */
  static getPerformanceReport(): PerformanceReport {
    const monitor = GPUPerformanceMonitor.getInstance();
    const metrics = monitor.metricsHistory;

    if (metrics.length === 0) {
      return {
        summary: {
          totalSessions: 0,
          averageSpeedup: 0,
          totalProcessingTime: 0,
          totalAudioDuration: 0,
          mostUsedGPU: 'none',
          averageMemoryUsage: 0,
        },
        trends: [],
        recommendations: [],
        averages: [],
      };
    }

    const summary = GPUPerformanceMonitor.generateSummary(metrics);
    const trends = GPUPerformanceMonitor.analyzeTrends(metrics);
    const averages = GPUPerformanceMonitor.calculateAverages(metrics);
    const recommendations = GPUPerformanceMonitor.generateRecommendations(
      averages,
      trends,
    );

    return { summary, trends, recommendations, averages };
  }

  /**
   * Generate performance summary
   */
  private static generateSummary(
    metrics: PerformanceMetrics[],
  ): PerformanceSummary {
    const totalSessions = metrics.length;
    const averageSpeedup =
      metrics.reduce((sum, m) => sum + m.speedupFactor, 0) / totalSessions;
    const totalProcessingTime = metrics.reduce(
      (sum, m) => sum + m.processingTime,
      0,
    );
    const totalAudioDuration = metrics.reduce(
      (sum, m) => sum + m.audioDuration,
      0,
    );
    const averageMemoryUsage =
      metrics.reduce(
        (sum, m) => sum + (m.memoryUsage.peak || m.memoryUsage.rss),
        0,
      ) / totalSessions;

    // Find most used GPU
    const gpuCounts = metrics.reduce(
      (counts, m) => {
        counts[m.gpuDisplayName] = (counts[m.gpuDisplayName] || 0) + 1;
        return counts;
      },
      {} as Record<string, number>,
    );

    const mostUsedGPU =
      Object.entries(gpuCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || 'none';

    return {
      totalSessions,
      averageSpeedup,
      totalProcessingTime,
      totalAudioDuration,
      mostUsedGPU,
      averageMemoryUsage,
    };
  }

  /**
   * Analyze performance trends
   */
  private static analyzeTrends(
    metrics: PerformanceMetrics[],
  ): PerformanceTrend[] {
    const addonTypes = Array.from(new Set(metrics.map((m) => m.addonType)));

    return addonTypes.map((addonType) => {
      const addonMetrics = metrics.filter((m) => m.addonType === addonType);
      const averageSpeedup =
        addonMetrics.reduce((sum, m) => sum + m.speedupFactor, 0) /
        addonMetrics.length;

      // Simple trend analysis: compare first half vs second half
      const midpoint = Math.floor(addonMetrics.length / 2);
      const firstHalf = addonMetrics.slice(0, midpoint);
      const secondHalf = addonMetrics.slice(midpoint);

      let trend: 'improving' | 'stable' | 'degrading' = 'stable';

      if (firstHalf.length > 0 && secondHalf.length > 0) {
        const firstAvg =
          firstHalf.reduce((sum, m) => sum + m.speedupFactor, 0) /
          firstHalf.length;
        const secondAvg =
          secondHalf.reduce((sum, m) => sum + m.speedupFactor, 0) /
          secondHalf.length;

        if (secondAvg > firstAvg * 1.1) {
          trend = 'improving';
        } else if (secondAvg < firstAvg * 0.9) {
          trend = 'degrading';
        }
      }

      return {
        addonType,
        averageSpeedup,
        sessionCount: addonMetrics.length,
        trend,
      };
    });
  }

  /**
   * Calculate performance averages by addon type and model
   */
  private static calculateAverages(
    metrics: PerformanceMetrics[],
  ): PerformanceAverage[] {
    const combinations = new Set(
      metrics.map((m) => `${m.addonType}:${m.model}`),
    );

    return Array.from(combinations).map((combo) => {
      const [addonType, model] = combo.split(':');
      const filteredMetrics = metrics.filter(
        (m) => m.addonType === addonType && m.model === model,
      );

      const averageSpeedup =
        filteredMetrics.reduce((sum, m) => sum + m.speedupFactor, 0) /
        filteredMetrics.length;
      const averageProcessingTime =
        filteredMetrics.reduce((sum, m) => sum + m.processingTime, 0) /
        filteredMetrics.length;

      return {
        addonType,
        model,
        averageSpeedup,
        averageProcessingTime,
        sessionCount: filteredMetrics.length,
      };
    });
  }

  /**
   * Generate performance recommendations
   */
  static generateRecommendations(
    averages: PerformanceAverage[],
    trends: PerformanceTrend[],
  ): string[] {
    const recommendations: string[] = [];

    // Find best performing addon
    const bestAddon = averages.reduce(
      (best, current) =>
        current.averageSpeedup > best.averageSpeedup ? current : best,
      averages[0],
    );

    if (bestAddon && bestAddon.averageSpeedup > 2) {
      recommendations.push(
        `Best performance achieved with ${bestAddon.addonType} (${bestAddon.averageSpeedup.toFixed(2)}x speedup)`,
      );
    }

    // Check for degrading performance
    const degradingAddons = trends.filter((t) => t.trend === 'degrading');
    if (degradingAddons.length > 0) {
      recommendations.push(
        `Performance degradation detected for: ${degradingAddons.map((t) => t.addonType).join(', ')}`,
      );
    }

    // Memory optimization suggestions
    const highMemoryAddons = averages.filter((a) => a.sessionCount > 3);
    if (highMemoryAddons.length > 0) {
      recommendations.push(
        'Consider enabling memory optimization for frequently used GPU types',
      );
    }

    // Model-specific recommendations
    const largeModelResults = averages.filter((a) =>
      ['large', 'large-v2', 'large-v3'].includes(a.model),
    );
    if (largeModelResults.some((r) => r.averageSpeedup < 1.5)) {
      recommendations.push(
        'Large models may benefit from discrete GPU or increased memory allocation',
      );
    }

    return recommendations;
  }

  /**
   * Load metrics history from disk
   */
  private loadMetricsHistory(): void {
    try {
      if (fs.existsSync(this.metricsFilePath)) {
        const data = fs.readFileSync(this.metricsFilePath, 'utf8');
        this.metricsHistory = JSON.parse(data);
        logMessage(
          `Loaded ${this.metricsHistory.length} performance metrics from history`,
          'debug',
        );
      }
    } catch (error) {
      logMessage(
        `Failed to load performance metrics history: ${error.message}`,
        'warning',
      );
      this.metricsHistory = [];
    }
  }

  /**
   * Save metrics history to disk
   */
  private saveMetricsHistory(): void {
    try {
      // Keep only last 1000 entries to prevent file size growth
      const metricsToSave = this.metricsHistory.slice(-1000);
      fs.writeFileSync(
        this.metricsFilePath,
        JSON.stringify(metricsToSave, null, 2),
      );
      logMessage(
        `Saved ${metricsToSave.length} performance metrics to history`,
        'debug',
      );
    } catch (error) {
      logMessage(
        `Failed to save performance metrics history: ${error.message}`,
        'warning',
      );
    }
  }

  /**
   * Clear metrics history
   */
  static clearHistory(): void {
    const monitor = GPUPerformanceMonitor.getInstance();
    monitor.metricsHistory = [];
    monitor.saveMetricsHistory();
    logMessage('Performance metrics history cleared', 'info');
  }
}
