/**
 * Settings Migration for Intel OpenVINO GPU Integration
 * Handles backward compatibility and seamless user experience during updates
 */

import { store } from './store';
import { logMessage } from './logger';
import path from 'path';
import { app } from 'electron';
import {
  SettingsMigrationContext,
  ValidationResult,
} from '../../types/settings';

interface LegacySettings {
  [key: string]: any;
  useCuda?: boolean;
}

interface ModernSettings extends LegacySettings {
  useOpenVINO?: boolean;
  selectedGPUId?: string;
  gpuPreference?: string[];
  gpuAutoDetection?: boolean;
  openvinoPreferences?: {
    cacheDir: string;
    devicePreference: 'discrete' | 'integrated' | 'auto';
    enableOptimizations: boolean;
  };
}

export class SettingsMigration {
  private static readonly MIGRATION_VERSION = '1.3.0';
  private static readonly BACKUP_KEY = 'settingsBackup_v1.2';

  /**
   * Main migration function - called during application startup
   */
  static async migrateSettings(): Promise<SettingsMigrationContext> {
    logMessage('Starting settings migration for Intel GPU support', 'info');

    const context: SettingsMigrationContext = {
      currentVersion: this.MIGRATION_VERSION,
      backupCreated: false,
      migrationApplied: false,
      preservedSettings: [],
    };

    try {
      // Get current settings
      const currentSettings = store.get('settings') as LegacySettings;

      // Check if migration is needed
      const needsMigration = this.needsMigration(currentSettings);

      if (!needsMigration) {
        logMessage('Settings migration not required', 'info');
        return context;
      }

      // Create backup
      context.backupCreated = this.createBackup(currentSettings);

      // Perform migration
      const migratedSettings = this.performMigration(currentSettings);

      // Validate migrated settings
      const validation = this.validateSettings(migratedSettings);

      if (!validation.isValid) {
        logMessage(
          `Settings validation failed: ${validation.errors.join(', ')}`,
          'error',
        );
        this.restoreBackup();
        return context;
      }

      // Apply migrated settings
      store.set('settings', migratedSettings);
      context.migrationApplied = true;
      context.preservedSettings = Object.keys(currentSettings);

      logMessage('Settings migration completed successfully', 'info');

      if (validation.warnings.length > 0) {
        logMessage(
          `Migration warnings: ${validation.warnings.join(', ')}`,
          'warning',
        );
      }

      return context;
    } catch (error) {
      logMessage(`Settings migration failed: ${error.message}`, 'error');
      this.restoreBackup();
      return context;
    }
  }

  /**
   * Check if migration is needed based on presence of new settings
   */
  private static needsMigration(settings: LegacySettings): boolean {
    // Check if new Intel GPU settings are missing
    return (
      settings.useOpenVINO === undefined ||
      settings.selectedGPUId === undefined ||
      settings.gpuPreference === undefined ||
      settings.gpuAutoDetection === undefined ||
      settings.openvinoPreferences === undefined
    );
  }

  /**
   * Create backup of current settings
   */
  private static createBackup(settings: LegacySettings): boolean {
    try {
      const backupData = {
        timestamp: Date.now(),
        version: 'pre-1.3.0',
        settings: { ...settings },
      };

      store.set(this.BACKUP_KEY, backupData);
      logMessage('Settings backup created successfully', 'info');
      return true;
    } catch (error) {
      logMessage(`Failed to create settings backup: ${error.message}`, 'error');
      return false;
    }
  }

  /**
   * Perform the actual migration
   */
  private static performMigration(
    legacySettings: LegacySettings,
  ): ModernSettings {
    const migratedSettings: ModernSettings = {
      ...legacySettings, // Preserve all existing settings

      // Add new Intel GPU settings with intelligent defaults
      useOpenVINO: false, // Conservative default - require user opt-in
      selectedGPUId: 'auto', // Auto-detect by default
      gpuAutoDetection: true,

      // Set GPU preference based on existing CUDA setting
      gpuPreference: this.determineGPUPreference(legacySettings),

      // OpenVINO preferences with sensible defaults
      openvinoPreferences: {
        cacheDir: path.join(app.getPath('userData'), 'openvino-cache'),
        devicePreference: 'auto', // Let system choose best Intel GPU
        enableOptimizations: true,
      },
    };

    return migratedSettings;
  }

  /**
   * Determine GPU preference order based on existing settings
   */
  private static determineGPUPreference(settings: LegacySettings): string[] {
    // If user has CUDA enabled, prioritize NVIDIA
    if (settings.useCuda === true) {
      return ['nvidia', 'intel', 'apple', 'cpu'];
    }

    // If CUDA disabled, user might prefer other options
    if (settings.useCuda === false) {
      return ['intel', 'apple', 'cpu', 'nvidia'];
    }

    // Default order for undefined CUDA setting
    return ['nvidia', 'intel', 'apple', 'cpu'];
  }

  /**
   * Validate migrated settings structure and values
   */
  private static validateSettings(settings: ModernSettings): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: [],
    };

    // Validate required fields are present
    const requiredFields = [
      'useOpenVINO',
      'selectedGPUId',
      'gpuPreference',
      'gpuAutoDetection',
      'openvinoPreferences',
    ];

    for (const field of requiredFields) {
      if (settings[field] === undefined) {
        result.errors.push(`Missing required field: ${field}`);
        result.isValid = false;
      }
    }

    // Validate selectedGPUId format
    if (settings.selectedGPUId && typeof settings.selectedGPUId !== 'string') {
      result.errors.push('selectedGPUId must be a string');
      result.isValid = false;
    }

    // Validate gpuPreference array
    if (settings.gpuPreference) {
      if (!Array.isArray(settings.gpuPreference)) {
        result.errors.push('gpuPreference must be an array');
        result.isValid = false;
      } else {
        const validTypes = ['nvidia', 'intel', 'apple', 'cpu'];
        const invalidTypes = settings.gpuPreference.filter(
          (type) => !validTypes.includes(type),
        );

        if (invalidTypes.length > 0) {
          result.errors.push(
            `Invalid GPU types in preference: ${invalidTypes.join(', ')}`,
          );
          result.isValid = false;
        }
      }
    }

    // Validate openvinoPreferences structure
    if (settings.openvinoPreferences) {
      const prefs = settings.openvinoPreferences;

      if (!prefs.cacheDir || typeof prefs.cacheDir !== 'string') {
        result.errors.push(
          'openvinoPreferences.cacheDir must be a non-empty string',
        );
        result.isValid = false;
      }

      const validDevicePrefs = ['discrete', 'integrated', 'auto'];
      if (!validDevicePrefs.includes(prefs.devicePreference)) {
        result.errors.push(
          'openvinoPreferences.devicePreference must be discrete, integrated, or auto',
        );
        result.isValid = false;
      }

      if (typeof prefs.enableOptimizations !== 'boolean') {
        result.errors.push(
          'openvinoPreferences.enableOptimizations must be a boolean',
        );
        result.isValid = false;
      }
    }

    // Add suggestions for user experience
    if (settings.useCuda === true && settings.useOpenVINO === true) {
      result.warnings.push(
        'Both CUDA and OpenVINO enabled - system will use GPU preference order',
      );
    }

    if (settings.selectedGPUId !== 'auto') {
      result.suggestions.push(
        'Consider using auto-detection for optimal GPU selection',
      );
    }

    return result;
  }

  /**
   * Restore settings from backup in case of migration failure
   */
  private static restoreBackup(): boolean {
    try {
      const backup = store.get(this.BACKUP_KEY);

      if (!backup || !backup.settings) {
        logMessage('No backup available for restoration', 'warning');
        return false;
      }

      store.set('settings', backup.settings);
      logMessage('Settings restored from backup', 'info');
      return true;
    } catch (error) {
      logMessage(
        `Failed to restore settings backup: ${error.message}`,
        'error',
      );
      return false;
    }
  }

  /**
   * Clean up old backup data (call after successful migration)
   */
  static cleanupOldBackups(): void {
    try {
      // Keep only the most recent backup
      const currentBackup = store.get(this.BACKUP_KEY);

      if (currentBackup && currentBackup.timestamp) {
        const backupAge = Date.now() - currentBackup.timestamp;
        const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days

        if (backupAge > maxAge) {
          store.delete(this.BACKUP_KEY);
          logMessage('Old settings backup cleaned up', 'info');
        }
      }
    } catch (error) {
      logMessage(`Failed to cleanup old backups: ${error.message}`, 'warning');
    }
  }

  /**
   * Get migration status for UI display
   */
  static getMigrationStatus(): {
    migrationVersion: string;
    hasBackup: boolean;
    backupTimestamp?: number;
  } {
    const backup = store.get(this.BACKUP_KEY);

    return {
      migrationVersion: this.MIGRATION_VERSION,
      hasBackup: !!backup,
      backupTimestamp: backup?.timestamp,
    };
  }
}

// Export convenience function for application startup
export async function initializeSettingsMigration(): Promise<SettingsMigrationContext> {
  return SettingsMigration.migrateSettings();
}
