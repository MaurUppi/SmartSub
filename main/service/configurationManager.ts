/**
 * Configuration Management Service
 *
 * Provides centralized configuration storage, validation, and migration
 * for custom parameter configurations across the application.
 */

import { ipcMain } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';
import { app } from 'electron';
import type { CustomParameterConfig } from 'types/provider';
import type { ParameterValidationResult } from 'types/parameterSystem';
import {
  ConfigurationMetadata,
  StoredConfiguration,
  ConfigurationExport,
  ConfigurationValidationOptions,
} from 'types/settings';
import { parameterValidator, ValidationContext } from './parameterValidator';
import { migrationManager } from './migrationManager';

export class ConfigurationManager {
  private readonly configDir: string;
  private readonly configurationsFile: string;
  private readonly templatesFile: string;
  private readonly backupDir: string;
  private configurations: Map<string, StoredConfiguration> = new Map();
  // Templates functionality removed as requested
  private isInitialized = false;

  constructor() {
    const userDataPath = app.getPath('userData');
    this.configDir = path.join(userDataPath, 'parameter-configs');
    this.configurationsFile = path.join(this.configDir, 'configurations.json');
    this.templatesFile = path.join(this.configDir, 'templates.json');
    this.backupDir = path.join(this.configDir, 'backups');

    // Debug logging for path verification
    console.log('🔧 [CONFIG-MANAGER] Path Configuration:');
    console.log('  📂 userData:', userDataPath);
    console.log('  📂 configDir:', this.configDir);
    console.log('  📄 configurationsFile:', this.configurationsFile);
    console.log('  📄 templatesFile:', this.templatesFile);
    console.log('  📂 backupDir:', this.backupDir);

    this.setupIpcHandlers();
  }

  /**
   * Initialize the configuration manager
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('🔧 [CONFIG-MANAGER] Already initialized, skipping');
      return;
    }

    console.log('🚀 [CONFIG-MANAGER] Starting initialization...');

    // Verify path setup is correct
    const expectedDevPath = app.getPath('userData').includes('-dev');
    console.log('🔍 [CONFIG-MANAGER] Environment check:');
    console.log('  NODE_ENV:', process.env.NODE_ENV);
    console.log('  isDev path:', expectedDevPath);
    console.log('  Current userData:', app.getPath('userData'));

    try {
      console.log('📁 [CONFIG-MANAGER] Ensuring directories...');
      await this.ensureDirectories();

      console.log('🔄 [CONFIG-MANAGER] Initializing migration manager...');
      await migrationManager.initialize();

      console.log('📥 [CONFIG-MANAGER] Loading configurations...');
      await this.loadConfigurations();

      console.log('📄 [CONFIG-MANAGER] Loading templates...');
      await this.loadTemplates();

      console.log('🔄 [CONFIG-MANAGER] Performing migrations...');
      await this.performMigrations();

      this.isInitialized = true;
      console.log(
        '✅ [CONFIG-MANAGER] Configuration Manager initialized successfully',
      );
      console.log(
        '📊 [CONFIG-MANAGER] Loaded configurations count:',
        this.configurations.size,
      );
    } catch (error) {
      console.error(
        '❌ [CONFIG-MANAGER] Failed to initialize Configuration Manager:',
        error,
      );
      throw error;
    }
  }

  /**
   * Get configuration for a specific provider
   */
  async getConfiguration(
    providerId: string,
  ): Promise<CustomParameterConfig | null> {
    console.log(
      '📥 [CONFIG-MANAGER] Getting configuration for provider:',
      providerId,
    );
    await this.ensureInitialized();

    const stored = this.configurations.get(providerId);
    const result = stored ? stored.config : null;
    console.log('📥 [CONFIG-MANAGER] Configuration found:', !!result, result);
    return result;
  }

  /**
   * Save configuration for a specific provider
   */
  async saveConfiguration(
    providerId: string,
    config: CustomParameterConfig,
    options: ConfigurationValidationOptions = {},
  ): Promise<void> {
    console.log(
      '💾 [CONFIG-MANAGER] Saving configuration for provider:',
      providerId,
      'options:',
      options,
    );
    await this.ensureInitialized();

    // Validate configuration
    console.log('🔍 [CONFIG-MANAGER] Validating configuration...');
    const validation = await this.validateConfiguration(
      config,
      options,
      providerId,
    );
    if (!validation.isValid) {
      console.error(
        '❌ [CONFIG-MANAGER] Validation failed:',
        validation.errors,
      );
      throw new Error(
        `Configuration validation failed: ${validation.errors.map((e) => e.message).join(', ')}`,
      );
    }
    console.log('✅ [CONFIG-MANAGER] Validation passed');

    // Create backup before saving
    console.log('📋 [CONFIG-MANAGER] Creating backup...');
    await this.createBackup(providerId);

    const now = new Date().toISOString();
    const stored: StoredConfiguration = {
      config,
      metadata: {
        version: '1.0.0',
        createdAt:
          this.configurations.get(providerId)?.metadata.createdAt || now,
        lastModified: now,
        checksum: await this.calculateChecksum(config),
      },
    };

    console.log('🗃️ [CONFIG-MANAGER] Storing configuration in memory...');
    this.configurations.set(providerId, stored);

    console.log('💿 [CONFIG-MANAGER] Persisting to disk...');
    await this.persistConfigurations();
    console.log('✅ [CONFIG-MANAGER] Save completed successfully');
  }

  /**
   * Delete configuration for a specific provider
   */
  async deleteConfiguration(providerId: string): Promise<boolean> {
    await this.ensureInitialized();

    if (this.configurations.has(providerId)) {
      await this.createBackup(providerId);
      this.configurations.delete(providerId);
      await this.persistConfigurations();
      return true;
    }

    return false;
  }

  /**
   * List all available configurations
   */
  async listConfigurations(): Promise<
    Array<{ providerId: string; metadata: ConfigurationMetadata }>
  > {
    await this.ensureInitialized();

    return Array.from(this.configurations.entries()).map(
      ([providerId, stored]) => ({
        providerId,
        metadata: stored.metadata,
      }),
    );
  }

  /**
   * Get provider configuration statistics
   */
  async getProviderStatistics(providerId: string): Promise<{
    parameterCount: number;
    headerCount: number;
    bodyCount: number;
    lastModified: string | null;
    configSize: number;
    hasValidationErrors: boolean;
  } | null> {
    await this.ensureInitialized();

    const stored = this.configurations.get(providerId);
    if (!stored) {
      return null;
    }

    const config = stored.config;
    const headerCount = Object.keys(config.headerParameters || {}).length;
    const bodyCount = Object.keys(config.bodyParameters || {}).length;

    // Calculate approximate config size
    const configSize = JSON.stringify(config).length;

    // Check for validation errors
    const validation = await this.validateConfiguration(config, {}, providerId);

    return {
      parameterCount: headerCount + bodyCount,
      headerCount,
      bodyCount,
      lastModified: stored.metadata.lastModified,
      configSize,
      hasValidationErrors: !validation.isValid,
    };
  }

  /**
   * Get system-wide configuration health metrics
   */
  async getSystemHealth(): Promise<{
    totalProviders: number;
    totalParameters: number;
    configsWithErrors: number;
    storageSize: number;
    lastBackup: string | null;
  }> {
    await this.ensureInitialized();

    let totalParameters = 0;
    let configsWithErrors = 0;
    let storageSize = 0;

    for (const [providerId, stored] of Array.from(
      this.configurations.entries(),
    )) {
      const config = stored.config;
      const headerCount = Object.keys(config.headerParameters || {}).length;
      const bodyCount = Object.keys(config.bodyParameters || {}).length;
      totalParameters += headerCount + bodyCount;

      storageSize += JSON.stringify(stored).length;

      // Check for validation errors
      const validation = await this.validateConfiguration(
        config,
        {},
        providerId,
      );
      if (!validation.isValid) {
        configsWithErrors++;
      }
    }

    // Get last backup timestamp
    let lastBackup: string | null = null;
    try {
      const backupFiles = await fs.readdir(this.backupDir);
      if (backupFiles.length > 0) {
        const sortedBackups = backupFiles
          .filter((file) => file.endsWith('.json'))
          .sort()
          .reverse();
        if (sortedBackups.length > 0) {
          const backupStat = await fs.stat(
            path.join(this.backupDir, sortedBackups[0]),
          );
          lastBackup = backupStat.mtime.toISOString();
        }
      }
    } catch (error) {
      console.warn('Failed to get backup info:', error);
    }

    return {
      totalProviders: this.configurations.size,
      totalParameters,
      configsWithErrors,
      storageSize,
      lastBackup,
    };
  }

  /**
   * Clone configuration from one provider to another
   */
  async cloneConfiguration(
    sourceProviderId: string,
    targetProviderId: string,
    options: { overwrite?: boolean } = {},
  ): Promise<boolean> {
    await this.ensureInitialized();

    const sourceConfig = this.configurations.get(sourceProviderId);
    if (!sourceConfig) {
      throw new Error(
        `Source provider configuration not found: ${sourceProviderId}`,
      );
    }

    // Check if target already exists
    if (this.configurations.has(targetProviderId) && !options.overwrite) {
      throw new Error(
        `Target provider configuration already exists: ${targetProviderId}. Use overwrite option to replace.`,
      );
    }

    // Clone the configuration
    const clonedConfig: CustomParameterConfig = {
      headerParameters: { ...sourceConfig.config.headerParameters },
      bodyParameters: { ...sourceConfig.config.bodyParameters },
      configVersion: sourceConfig.config.configVersion,
      lastModified: Date.now(),
    };

    // Save cloned configuration
    await this.saveConfiguration(targetProviderId, clonedConfig);

    console.log(
      `✅ [CONFIG-MANAGER] Configuration cloned from ${sourceProviderId} to ${targetProviderId}`,
    );
    return true;
  }

  /**
   * Bulk update configurations
   */
  async bulkUpdateConfigurations(
    updates: Array<{ providerId: string; config: CustomParameterConfig }>,
    options: { validateAll?: boolean; createBackups?: boolean } = {},
  ): Promise<{
    successful: string[];
    failed: Array<{ providerId: string; error: string }>;
  }> {
    await this.ensureInitialized();

    const results = {
      successful: [] as string[],
      failed: [] as Array<{ providerId: string; error: string }>,
    };

    // Validate all configurations first if requested
    if (options.validateAll) {
      for (const { providerId, config } of updates) {
        try {
          const validation = await this.validateConfiguration(
            config,
            {},
            providerId,
          );
          if (!validation.isValid) {
            results.failed.push({
              providerId,
              error: `Validation failed: ${validation.errors.map((e) => e.message).join(', ')}`,
            });
          }
        } catch (error) {
          results.failed.push({
            providerId,
            error: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          });
        }
      }

      // If any validation failed and validateAll is true, abort entire operation
      if (results.failed.length > 0) {
        return results;
      }
    }

    // Create backups if requested
    if (options.createBackups) {
      for (const { providerId } of updates) {
        if (this.configurations.has(providerId)) {
          try {
            await this.createBackup(providerId);
          } catch (error) {
            console.warn(`Failed to create backup for ${providerId}:`, error);
          }
        }
      }
    }

    // Perform updates
    for (const { providerId, config } of updates) {
      try {
        await this.saveConfiguration(providerId, config);
        results.successful.push(providerId);
      } catch (error) {
        results.failed.push({
          providerId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    console.log(
      `📊 [CONFIG-MANAGER] Bulk update completed: ${results.successful.length} successful, ${results.failed.length} failed`,
    );
    return results;
  }

  /**
   * Validate a configuration using the parameter validator
   */
  async validateConfiguration(
    config: CustomParameterConfig,
    options: ConfigurationValidationOptions = {},
    providerId?: string,
  ): Promise<ParameterValidationResult> {
    const {
      strictValidation = true,
      allowUnknownKeys = false,
      validateValues = true,
    } = options;

    // Create validation context
    const context: ValidationContext = {
      providerId: providerId || 'unknown',
      isProduction: process.env.NODE_ENV === 'production',
      securityLevel: strictValidation ? 'high' : 'medium',
    };

    // Use the parameter validator for comprehensive validation
    const result = await parameterValidator.validateConfiguration(
      config,
      context,
      {
        allowedValueTypes: validateValues
          ? undefined
          : ['string', 'number', 'boolean', 'object', 'array'],
        maxParameterCount: 50,
        maxKeyLength: 128,
        maxValueLength: 2048,
      },
    );

    // Add additional checks for configuration-specific validation
    if (result.isValid && strictValidation && !allowUnknownKeys) {
      const allowedKeys = [
        'headerParameters',
        'bodyParameters',
        'configVersion',
        'lastModified',
      ];
      const configKeys = Object.keys(config);
      const unknownKeys = configKeys.filter(
        (key) => !allowedKeys.includes(key),
      );

      if (unknownKeys.length > 0) {
        result.errors.push({
          key: 'config',
          type: 'format',
          message: `Unknown configuration keys: ${unknownKeys.join(', ')}`,
        });
        result.isValid = false;
      }
    }

    return result;
  }

  /**
   * Export configurations and templates
   */
  async exportConfigurations(): Promise<ConfigurationExport> {
    await this.ensureInitialized();

    const configurations: Record<string, StoredConfiguration> = {};
    for (const [providerId, stored] of Array.from(this.configurations)) {
      configurations[providerId] = stored;
    }

    return {
      configurations,
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
    };
  }

  /**
   * Import configurations and templates
   */
  async importConfigurations(
    exportData: ConfigurationExport,
    options: {
      overwriteExisting?: boolean;
      validateBeforeImport?: boolean;
    } = {},
  ): Promise<{ imported: number; skipped: number; errors: string[] }> {
    await this.ensureInitialized();

    const { overwriteExisting = false, validateBeforeImport = true } = options;
    const results = { imported: 0, skipped: 0, errors: [] as string[] };

    // Create backup before import
    await this.createFullBackup();

    try {
      // Import configurations
      for (const [providerId, stored] of Object.entries(
        exportData.configurations,
      )) {
        if (!overwriteExisting && this.configurations.has(providerId)) {
          results.skipped++;
          continue;
        }

        if (validateBeforeImport) {
          const validation = await this.validateConfiguration(stored.config);
          if (!validation.isValid) {
            results.errors.push(
              `Configuration for ${providerId}: ${validation.errors.map((e) => e.message).join(', ')}`,
            );
            continue;
          }
        }

        this.configurations.set(providerId, stored);
        results.imported++;
      }

      // Templates import not currently supported

      // Persist changes
      await this.persistConfigurations();
      await this.persistTemplates();
    } catch (error) {
      results.errors.push(
        `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }

    return results;
  }

  /**
   * Create a backup of current configuration
   */
  private async createBackup(providerId: string): Promise<void> {
    const stored = this.configurations.get(providerId);
    if (!stored) return;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(
      this.backupDir,
      `${providerId}-${timestamp}.json`,
    );

    await fs.writeFile(backupFile, JSON.stringify(stored, null, 2), 'utf8');

    // Clean old backups (keep last 10 per provider)
    await this.cleanOldBackups(providerId);
  }

  /**
   * Create a full backup of all configurations
   */
  private async createFullBackup(): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(
      this.backupDir,
      `full-backup-${timestamp}.json`,
    );

    const fullBackup = {
      configurations: Object.fromEntries(this.configurations),
      backupAt: new Date().toISOString(),
    };

    await fs.writeFile(backupFile, JSON.stringify(fullBackup, null, 2), 'utf8');
  }

  /**
   * Clean old backup files for a provider
   */
  private async cleanOldBackups(providerId: string): Promise<void> {
    try {
      const files = await fs.readdir(this.backupDir);
      const providerBackups = files
        .filter(
          (file) => file.startsWith(`${providerId}-`) && file.endsWith('.json'),
        )
        .sort()
        .reverse();

      // Keep only the latest 10 backups per provider
      const filesToDelete = providerBackups.slice(10);
      for (const file of filesToDelete) {
        await fs.unlink(path.join(this.backupDir, file));
      }
    } catch (error) {
      console.warn('Failed to clean old backups:', error);
    }
  }

  /**
   * Calculate checksum for configuration integrity
   */
  private async calculateChecksum(
    config: CustomParameterConfig,
  ): Promise<string> {
    const crypto = await import('crypto');
    const content = JSON.stringify(config, Object.keys(config).sort());
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Ensure required directories exist
   */
  private async ensureDirectories(): Promise<void> {
    await fs.mkdir(this.configDir, { recursive: true });
    await fs.mkdir(this.backupDir, { recursive: true });
  }

  /**
   * Load configurations from disk
   */
  private async loadConfigurations(): Promise<void> {
    try {
      const data = await fs.readFile(this.configurationsFile, 'utf8');
      const parsed = JSON.parse(data);
      this.configurations = new Map(Object.entries(parsed));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.warn('Failed to load configurations:', error);
      }
      this.configurations = new Map();
    }
  }

  /**
   * Load templates from disk
   */
  private async loadTemplates(): Promise<void> {
    try {
      await fs.readFile(this.templatesFile, 'utf8');
      // Templates not supported
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.warn('Failed to load templates:', error);
      }
      // Templates not supported
    }
  }

  /**
   * Persist configurations to disk
   */
  private async persistConfigurations(): Promise<void> {
    const data = Object.fromEntries(this.configurations);
    await fs.writeFile(
      this.configurationsFile,
      JSON.stringify(data, null, 2),
      'utf8',
    );
  }

  /**
   * Persist templates to disk
   */
  private async persistTemplates(): Promise<void> {
    // Templates not supported - stub method
  }

  /**
   * Perform any necessary migrations using the migration manager
   */
  private async performMigrations(): Promise<void> {
    try {
      // Check if migrations are needed
      const needsMigration = await migrationManager.needsMigration(
        this.configurations,
      );

      if (needsMigration) {
        console.log('Performing configuration migrations...');

        const result = await migrationManager.migrateConfigurations(
          this.configurations,
        );

        if (result.success) {
          console.log(
            `Successfully applied ${result.migrationsApplied} migrations`,
          );

          // Persist migrated configurations
          await this.persistConfigurations();
        } else {
          console.error('Migration failed:', result.errors);

          // Log errors but don't fail initialization
          for (const error of result.errors) {
            console.error('Migration error:', error);
          }
        }

        if (result.backupPath) {
          console.log(`Migration backup created at: ${result.backupPath}`);
        }
      }
    } catch (error) {
      console.error('Migration process failed:', error);
      // Don't fail initialization for migration errors
    }
  }

  /**
   * Ensure the manager is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  /**
   * Set up IPC handlers for renderer communication
   */
  private setupIpcHandlers(): void {
    ipcMain.handle('config-manager:get', async (_, providerId: string) => {
      console.log(
        '📡 [CONFIG-MANAGER] IPC get request for provider:',
        providerId,
      );
      try {
        const result = await this.getConfiguration(providerId);
        console.log('📡 [CONFIG-MANAGER] IPC get response:', result);
        return result;
      } catch (error) {
        console.error('❌ [CONFIG-MANAGER] IPC get error:', error);
        throw error;
      }
    });

    ipcMain.handle(
      'config-manager:save',
      async (
        _,
        providerId: string,
        config: CustomParameterConfig,
        options?: ConfigurationValidationOptions,
      ) => {
        console.log(
          '📡 [CONFIG-MANAGER] IPC save request for provider:',
          providerId,
          'config:',
          JSON.stringify(config, null, 2),
        );
        try {
          await this.saveConfiguration(providerId, config, options);
          console.log('✅ [CONFIG-MANAGER] IPC save successful');
          return { success: true };
        } catch (error) {
          console.error('❌ [CONFIG-MANAGER] IPC save error:', error);
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      },
    );

    ipcMain.handle('config-manager:delete', async (_, providerId: string) => {
      const result = await this.deleteConfiguration(providerId);
      return { success: result };
    });

    ipcMain.handle('config-manager:list', async () => {
      return await this.listConfigurations();
    });

    ipcMain.handle(
      'config-manager:validate',
      async (
        _,
        config: CustomParameterConfig,
        options?: ConfigurationValidationOptions,
        providerId?: string,
      ) => {
        return await this.validateConfiguration(config, options, providerId);
      },
    );

    ipcMain.handle('config-manager:export', async () => {
      return await this.exportConfigurations();
    });

    ipcMain.handle(
      'config-manager:import',
      async (
        _,
        exportData: ConfigurationExport,
        options?: {
          overwriteExisting?: boolean;
          validateBeforeImport?: boolean;
        },
      ) => {
        return await this.importConfigurations(exportData, options);
      },
    );

    // Migration management handlers
    ipcMain.handle(
      'config-manager:get-migration-status',
      async (_, providerId: string) => {
        const stored = this.configurations.get(providerId);
        if (!stored) {
          return null;
        }
        return migrationManager.getMigrationStatus(stored);
      },
    );

    ipcMain.handle('config-manager:get-applied-migrations', async () => {
      return migrationManager.getAppliedMigrations();
    });

    ipcMain.handle('config-manager:get-available-migrations', async () => {
      return migrationManager.getAvailableMigrations();
    });

    // Enhanced management capabilities
    ipcMain.handle(
      'config-manager:get-provider-statistics',
      async (_, providerId: string) => {
        try {
          return await this.getProviderStatistics(providerId);
        } catch (error) {
          console.error(
            '❌ [CONFIG-MANAGER] IPC get-provider-statistics error:',
            error,
          );
          throw error;
        }
      },
    );

    ipcMain.handle('config-manager:get-system-health', async () => {
      try {
        return await this.getSystemHealth();
      } catch (error) {
        console.error(
          '❌ [CONFIG-MANAGER] IPC get-system-health error:',
          error,
        );
        throw error;
      }
    });

    ipcMain.handle(
      'config-manager:clone-configuration',
      async (
        _,
        sourceProviderId: string,
        targetProviderId: string,
        options?: { overwrite?: boolean },
      ) => {
        try {
          const result = await this.cloneConfiguration(
            sourceProviderId,
            targetProviderId,
            options,
          );
          return { success: result };
        } catch (error) {
          console.error(
            '❌ [CONFIG-MANAGER] IPC clone-configuration error:',
            error,
          );
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      },
    );

    ipcMain.handle(
      'config-manager:bulk-update',
      async (
        _,
        updates: Array<{ providerId: string; config: CustomParameterConfig }>,
        options?: { validateAll?: boolean; createBackups?: boolean },
      ) => {
        try {
          return await this.bulkUpdateConfigurations(updates, options);
        } catch (error) {
          console.error('❌ [CONFIG-MANAGER] IPC bulk-update error:', error);
          return {
            successful: [],
            failed: [
              {
                providerId: 'system',
                error: error instanceof Error ? error.message : 'Unknown error',
              },
            ],
          };
        }
      },
    );
  }
}

// Export singleton instance
export const configurationManager = new ConfigurationManager();
