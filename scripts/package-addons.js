/**
 * Package Addons Script for OpenVINO Integration
 * Platform-specific addon selection and packaging logic
 *
 * This script handles:
 * 1. Platform-specific OpenVINO addon selection
 * 2. Fallback to standard addons when OpenVINO unavailable
 * 3. Copying correct addon files to distribution
 * 4. Validation of addon file integrity
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Addon file mappings based on platform and type
const ADDON_MAPPINGS = {
  // Standard addons (always included)
  standard: {
    win32: {
      cpu: 'addon.node',
      cuda: 'addon.node', // Windows standard addon includes CUDA support
    },
    linux: {
      cpu: 'addon.node',
      cuda: 'addon.node', // Linux standard addon
    },
    darwin: {
      cpu: 'addon.node',
      coreml:
        process.arch === 'arm64'
          ? 'addon-macos-arm64-coreml.node'
          : 'addon.coreml.node',
    },
  },

  // OpenVINO-specific addons (conditional)
  openvino: {
    win32: {
      openvino: 'addon-windows-openvino.node',
      fallback: 'addon-windows-openvino-u22.node', // Alternative Windows build
    },
    linux: {
      openvino: 'addon-linux-openvino.node',
      fallback: 'addon-linux-openvino-u22.node', // Ubuntu 22.04 build
    },
    darwin: {
      openvino:
        process.arch === 'arm64'
          ? 'addon-macos-arm-openvino.node'
          : 'addon-macos-x86-openvino.node',
      'openvino-arm': 'addon-macos-arm-openvino.node',
      'openvino-x86': 'addon-macos-x86-openvino.node',
      fallback: 'addon.coreml.node', // Fallback to CoreML on macOS
    },
  },
};

class AddonPackager {
  constructor() {
    this.platform = process.platform;
    this.arch = process.arch;
    this.openvinoVersion = process.env.OPENVINO_VERSION;
    this.buildType = process.env.BUILD_TYPE;
    this.outputDir = path.join(process.cwd(), 'extraResources', 'addons');
    this.sourceDir = path.join(process.cwd(), 'addons');

    console.log(`Packaging addons for ${this.platform}-${this.arch}`);
    console.log(`OpenVINO Version: ${this.openvinoVersion || 'Not specified'}`);
    console.log(`Build Type: ${this.buildType || 'standard'}`);
  }

  /**
   * Main entry point for addon packaging
   */
  async packageAddons() {
    try {
      // Ensure output directory exists
      this.ensureOutputDirectory();

      // Copy standard addons (always included)
      await this.copyStandardAddons();

      // Copy OpenVINO addons if available
      if (this.shouldIncludeOpenVINO()) {
        await this.copyOpenVINOAddons();
      }

      // Validate packaged addons
      await this.validatePackagedAddons();

      // Generate addon manifest
      await this.generateAddonManifest();

      console.log('✅ Addon packaging completed successfully');
    } catch (error) {
      console.error('❌ Addon packaging failed:', error.message);
      throw error;
    }
  }

  /**
   * Ensure output directory exists
   */
  ensureOutputDirectory() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
      console.log(`📁 Created addon output directory: ${this.outputDir}`);
    }
  }

  /**
   * Copy standard addons that are always included
   */
  async copyStandardAddons() {
    console.log('📦 Copying standard addons...');

    const standardAddons = ADDON_MAPPINGS.standard[this.platform];
    if (!standardAddons) {
      throw new Error(
        `No standard addons defined for platform: ${this.platform}`,
      );
    }

    for (const [type, filename] of Object.entries(standardAddons)) {
      const sourcePath = path.join(this.sourceDir, filename);
      const destPath = path.join(this.outputDir, filename);

      // Check if source exists in extraResources (current location)
      const currentSourcePath = path.join(
        process.cwd(),
        'extraResources',
        'addons',
        filename,
      );
      const finalSourcePath = fs.existsSync(sourcePath)
        ? sourcePath
        : currentSourcePath;

      if (fs.existsSync(finalSourcePath)) {
        fs.copyFileSync(finalSourcePath, destPath);
        console.log(`  ✓ Copied ${type} addon: ${filename}`);
      } else {
        console.warn(`  ⚠️  Standard ${type} addon not found: ${filename}`);
      }
    }
  }

  /**
   * Check if OpenVINO addons should be included
   */
  shouldIncludeOpenVINO() {
    return !!(this.openvinoVersion || this.buildType === 'openvino');
  }

  /**
   * Copy platform-specific OpenVINO addons
   */
  async copyOpenVINOAddons() {
    console.log('🔧 Copying OpenVINO addons...');

    const openvinoAddons = ADDON_MAPPINGS.openvino[this.platform];
    if (!openvinoAddons) {
      console.log(
        `  ℹ️  No OpenVINO addons defined for platform: ${this.platform}`,
      );
      return;
    }

    for (const [type, filename] of Object.entries(openvinoAddons)) {
      const sourcePath = path.join(this.sourceDir, filename);
      const destPath = path.join(this.outputDir, filename);

      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, destPath);
        console.log(`  ✓ Copied OpenVINO ${type} addon: ${filename}`);
      } else {
        console.warn(`  ⚠️  OpenVINO ${type} addon not found: ${filename}`);
      }
    }
  }

  /**
   * Validate that packaged addons are valid Node.js addons
   */
  async validatePackagedAddons() {
    console.log('🔍 Validating packaged addons...');

    let addonFiles = [];
    try {
      addonFiles = fs.readdirSync(this.outputDir) || [];
    } catch (error) {
      console.warn(`Could not read addon directory: ${error.message}`);
      return;
    }

    const nodeFiles = addonFiles.filter(
      (file) => file && file.endsWith('.node'),
    );

    for (const addonFile of nodeFiles) {
      const addonPath = path.join(this.outputDir, addonFile);

      try {
        // Basic file validation
        const stats = fs.statSync(addonPath);
        if (stats.size === 0) {
          throw new Error(`Addon file is empty: ${addonFile}`);
        }

        console.log(`  ✓ ${addonFile} (${this.formatFileSize(stats.size)})`);
      } catch (error) {
        console.error(`  ❌ Invalid addon: ${addonFile} - ${error.message}`);
        throw error;
      }
    }
  }

  /**
   * Generate addon manifest for runtime selection
   */
  async generateAddonManifest() {
    console.log('📄 Generating addon manifest...');

    let addonFiles = [];
    try {
      addonFiles = fs.readdirSync(this.outputDir) || [];
    } catch (error) {
      console.warn(
        `Could not read addon directory for manifest: ${error.message}`,
      );
      addonFiles = [];
    }

    const nodeFiles = addonFiles.filter(
      (file) => file && file.endsWith('.node'),
    );

    const manifest = {
      platform: this.platform,
      arch: this.arch,
      openvinoVersion: this.openvinoVersion,
      buildType: this.buildType,
      generatedAt: new Date().toISOString(),
      addons: {},
    };

    // Categorize addons by type
    for (const addonFile of nodeFiles) {
      const addonPath = path.join(this.outputDir, addonFile);
      const stats = fs.statSync(addonPath);

      const addonType = this.detectAddonType(addonFile);

      manifest.addons[addonType] = {
        filename: addonFile,
        size: stats.size,
        available: true,
        checksum: this.calculateChecksum(addonPath),
      };
    }

    // Write manifest
    const manifestPath = path.join(this.outputDir, 'addon-manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

    console.log(`  ✓ Manifest written to: addon-manifest.json`);
    console.log(`  📊 Total addons: ${Object.keys(manifest.addons).length}`);
  }

  /**
   * Detect addon type from filename
   */
  detectAddonType(filename) {
    if (filename.includes('openvino')) return 'openvino';
    if (filename.includes('cuda')) return 'cuda';
    if (filename.includes('coreml')) return 'coreml';
    if (filename.includes('cpu') || filename === 'addon.node') return 'cpu';
    return 'unknown';
  }

  /**
   * Calculate simple checksum for addon file
   */
  calculateChecksum(filePath) {
    const crypto = require('crypto');
    const data = fs.readFileSync(filePath);
    return crypto
      .createHash('sha256')
      .update(data)
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes) {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  }
}

/**
 * Clean up old addon files before packaging
 */
function cleanOldAddons() {
  const outputDir = path.join(process.cwd(), 'extraResources', 'addons');

  if (fs.existsSync(outputDir)) {
    console.log('🧹 Cleaning old addon manifest...');

    const files = fs.readdirSync(outputDir);
    for (const file of files) {
      // Only clean manifest files, preserve existing addon files
      // They will be overwritten if needed during the copy process
      if (file === 'addon-manifest.json') {
        fs.unlinkSync(path.join(outputDir, file));
        console.log(`  🗑️  Removed: ${file}`);
      }
    }
  }
}

// Main execution
if (require.main === module) {
  (async () => {
    try {
      // Clean old addons first
      cleanOldAddons();

      // Package addons
      const packager = new AddonPackager();
      await packager.packageAddons();

      process.exit(0);
    } catch (error) {
      console.error('Fatal error during addon packaging:', error);
      process.exit(1);
    }
  })();
}

module.exports = { AddonPackager, ADDON_MAPPINGS };
