#!/usr/bin/env node

/**
 * Local Build Addon Download Script
 * Downloads required whisper addons for local development builds
 * Based on platform detection and addon sources
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

// Configuration
const ADDON_SOURCES = {
  original: 'https://github.com/buxuku/whisper.cpp/releases/latest/download',
  openvino:
    'https://github.com/MaurUppi/whisper.cpp-openvino/releases/download',
};

const PLATFORM_ADDONS = {
  darwin: {
    arm64: [
      // macOS ARM64: CoreML ONLY - no fallbacks allowed
      {
        name: 'addon-macos-arm64-coreml.node',
        source: 'original',
        primary: true,
        strict: true,
      },
    ],
    x64: [
      // macOS Intel: OpenVINO primary, CPU fallback
      {
        name: 'addon-macos-x86-openvino.node',
        source: 'openvino',
        tag: 'default',
        primary: true,
      },
      { name: 'addon-macos-x64.node', source: 'original', fallback: true },
    ],
  },
  win32: {
    x64: [
      // Windows: OpenVINO primary, various CUDA options, CPU fallback
      {
        name: 'addon-windows-openvino.node',
        source: 'openvino',
        tag: 'default',
        primary: true,
      },
      { name: 'addon-windows-cuda-1241-optimized.node', source: 'original' },
      { name: 'addon-windows-cuda-1241-generic.node', source: 'original' },
      { name: 'addon-windows-cuda-1220-optimized.node', source: 'original' },
      { name: 'addon-windows-cuda-1220-generic.node', source: 'original' },
      { name: 'addon-windows-cuda-1180-optimized.node', source: 'original' },
      { name: 'addon-windows-cuda-1180-generic.node', source: 'original' },
      {
        name: 'addon-windows-no-cuda.node',
        source: 'original',
        fallback: true,
      },
    ],
  },
  linux: {
    x64: [
      // Linux: OpenVINO only
      {
        name: 'addon-linux-openvino.node',
        source: 'openvino',
        tag: 'default',
        primary: true,
      },
    ],
  },
};

// Utility functions
function log(message) {
  console.log(`[addon-download] ${message}`);
}

function error(message) {
  console.error(`[addon-download] ERROR: ${message}`);
}

function downloadFile(url, filePath) {
  return new Promise((resolve, reject) => {
    log(`Downloading: ${url}`);

    const file = fs.createWriteStream(filePath);
    const request = https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Handle redirect
        return downloadFile(response.headers.location, filePath)
          .then(resolve)
          .catch(reject);
      }

      if (response.statusCode !== 200) {
        reject(
          new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`),
        );
        return;
      }

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        log(
          `Downloaded: ${path.basename(filePath)} (${response.headers['content-length'] || 'unknown'} bytes)`,
        );
        resolve();
      });
    });

    request.on('error', (err) => {
      fs.unlink(filePath, () => {}); // Clean up on error
      reject(err);
    });

    file.on('error', (err) => {
      fs.unlink(filePath, () => {}); // Clean up on error
      reject(err);
    });
  });
}

async function getOpenVINODefaultTag() {
  return new Promise((resolve) => {
    const request = https.get(
      'https://api.github.com/repos/MaurUppi/whisper.cpp-openvino/releases',
      (response) => {
        let data = '';

        response.on('data', (chunk) => {
          data += chunk;
        });

        response.on('end', () => {
          try {
            const releases = JSON.parse(data);
            const defaultRelease = releases.find((release) =>
              release.tag_name.startsWith('default-v'),
            );

            if (defaultRelease) {
              log(`Found OpenVINO default tag: ${defaultRelease.tag_name}`);
              resolve(defaultRelease.tag_name);
            } else {
              log('No default tag found, using latest');
              resolve('latest');
            }
          } catch (err) {
            log('Failed to parse releases, using latest');
            resolve('latest');
          }
        });
      },
    );

    request.on('error', () => {
      log('Failed to fetch releases, using latest');
      resolve('latest');
    });
  });
}

function createFileMapping(addonDir, addonsConfig, platform, arch) {
  const platformAddons = addonsConfig.filter((a) => a.primary || a.fallback);
  const primaryAddon = addonsConfig.find((a) => a.primary);

  if (!primaryAddon) {
    log('No primary addon found for mapping');
    return;
  }

  const primaryPath = path.join(addonDir, primaryAddon.name);

  if (!fs.existsSync(primaryPath)) {
    log(`Primary addon not found: ${primaryAddon.name}`);
    return;
  }

  // Platform-specific mapping logic
  if (platform === 'darwin' && arch === 'arm64') {
    // macOS ARM64: Direct platform-specific addon loading - no generic files needed
    log(`macOS ARM64: Using direct platform-specific addon loading`);
    return;
  }

  if (platform === 'darwin' && arch === 'x64') {
    // macOS Intel: OpenVINO primary, CPU fallback
    const genericPath = path.join(addonDir, 'addon.node');
    fs.copyFileSync(primaryPath, genericPath);
    log(`Created mapping: ${primaryAddon.name} -> addon.node`);

    // Create fallback mapping if CPU addon exists
    const cpuAddon = addonsConfig.find(
      (a) => a.fallback && a.name.includes('x64'),
    );
    if (cpuAddon && fs.existsSync(path.join(addonDir, cpuAddon.name))) {
      const cpuFallbackPath = path.join(addonDir, 'addon.cpu.node');
      fs.copyFileSync(path.join(addonDir, cpuAddon.name), cpuFallbackPath);
      log(`Created fallback mapping: ${cpuAddon.name} -> addon.cpu.node`);
    }
    return;
  }

  // Default behavior for other platforms
  const genericPath = path.join(addonDir, 'addon.node');
  fs.copyFileSync(primaryPath, genericPath);
  log(`Created mapping: ${primaryAddon.name} -> addon.node`);
}

function updateManifest(addonDir, platformAddons) {
  const manifestPath = path.join(addonDir, 'addon-manifest.json');
  const platform = process.platform;
  const arch = process.arch;

  const manifest = {
    platform,
    arch,
    openvinoVersion: '2024.6.0',
    buildType:
      platform === 'darwin' && arch === 'arm64' ? 'coreml-strict' : 'multi',
    generatedAt: new Date().toISOString(),
    addons: {},
  };

  // Platform-specific manifest generation
  if (platform === 'darwin' && arch === 'arm64') {
    // macOS ARM64: CoreML strict mode
    const coremlAddon = platformAddons.find((addon) =>
      addon.name.includes('coreml'),
    );
    if (coremlAddon) {
      manifest.addons.coreml = {
        available: true,
        filename: coremlAddon.name,
      };
      manifest.addons.primary = coremlAddon.name; // Direct reference, no generic mapping
      manifest.strict = true; // Flag for strict mode
    }
  } else {
    // Other platforms: normal multi-addon support
    platformAddons.forEach((addon) => {
      const key = addon.name.includes('openvino')
        ? 'openvino'
        : addon.name.includes('coreml')
          ? 'coreml'
          : addon.name.includes('cuda')
            ? 'cuda'
            : addon.name.includes('x64') || addon.name.includes('no-cuda')
              ? 'cpu'
              : 'addon';

      manifest.addons[key] = {
        available: true,
        filename: addon.name,
      };

      if (addon.primary) {
        manifest.addons.primary = 'addon.node'; // Generic mapping for other platforms
      }
      if (addon.fallback) {
        manifest.addons.fallback = addon.name;
      }
    });
  }

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  log(`Updated addon manifest (${manifest.buildType} mode)`);
}

async function main() {
  try {
    log('Starting addon download for local build...');

    // Detect platform and architecture
    const platform = process.platform;
    const arch = process.arch;

    log(`Platform: ${platform}, Architecture: ${arch}`);

    const platformConfig = PLATFORM_ADDONS[platform];
    if (!platformConfig || !platformConfig[arch]) {
      error(`Unsupported platform: ${platform}-${arch}`);
      process.exit(1);
    }

    const addonsToDownload = platformConfig[arch];
    const addonDir = path.join(__dirname, '..', 'extraResources', 'addons');

    // Ensure addon directory exists
    if (!fs.existsSync(addonDir)) {
      fs.mkdirSync(addonDir, { recursive: true });
      log(`Created directory: ${addonDir}`);
    }

    // Get OpenVINO default tag if needed
    const openvinoTag = await getOpenVINODefaultTag();

    // Download each required addon
    let primaryAddon = null;

    for (const addon of addonsToDownload) {
      const filePath = path.join(addonDir, addon.name);

      // Skip if file already exists and is not empty
      if (fs.existsSync(filePath) && fs.statSync(filePath).size > 0) {
        log(`Addon already exists: ${addon.name}`);
        if (addon.primary) primaryAddon = addon.name;
        continue;
      }

      let downloadUrl;

      if (addon.source === 'original') {
        downloadUrl = `${ADDON_SOURCES.original}/${addon.name}`;
      } else if (addon.source === 'openvino') {
        const tag =
          addon.tag === 'default' ? openvinoTag : addon.tag || 'latest';
        downloadUrl = `${ADDON_SOURCES.openvino}/${tag}/${addon.name}`;
      }

      try {
        await downloadFile(downloadUrl, filePath);
        if (addon.primary) primaryAddon = addon.name;
      } catch (err) {
        error(`Failed to download ${addon.name}: ${err.message}`);
        // Don't exit - continue with other addons
      }
    }

    // Create file mappings
    createFileMapping(addonDir, addonsToDownload, platform, arch);

    // Update manifest
    updateManifest(addonDir, addonsToDownload);

    log('Addon download completed successfully!');
  } catch (err) {
    error(`Addon download failed: ${err.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main, downloadFile, getOpenVINODefaultTag };
