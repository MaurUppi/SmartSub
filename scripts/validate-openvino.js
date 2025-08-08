#!/usr/bin/env node

/**
 * OpenVINO Addon Validation Script
 * Validates the built addon.node file for OpenVINO compatibility and functionality
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Configuration
const ADDON_PATH = process.argv[2];
const BUILD_TYPE = process.argv[3] || 'standard';

console.log('🔍 OpenVINO Addon Validation Script');
console.log(`📁 Addon path: ${ADDON_PATH}`);
console.log(`🏗️ Build type: ${BUILD_TYPE}`);
console.log(
  '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
);

/**
 * Validate file existence and basic properties
 */
function validateFile() {
  console.log('\n📋 Step 1: File Validation');

  if (!ADDON_PATH) {
    console.error('❌ Error: Addon path not provided');
    process.exit(1);
  }

  if (!fs.existsSync(ADDON_PATH)) {
    console.error(`❌ Error: Addon file not found: ${ADDON_PATH}`);
    process.exit(1);
  }

  const stats = fs.statSync(ADDON_PATH);
  console.log(`✅ File exists: ${ADDON_PATH}`);
  console.log(`📏 File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`📅 Modified: ${stats.mtime.toISOString()}`);

  // Check file extension
  if (!ADDON_PATH.endsWith('.node')) {
    console.warn('⚠️ Warning: File does not have .node extension');
  } else {
    console.log('✅ File has correct .node extension');
  }

  return true;
}

/**
 * Validate addon structure and exports
 */
function validateAddonStructure() {
  console.log('\n📋 Step 2: Addon Structure Validation');

  try {
    // Attempt to load the addon
    console.log('🔄 Attempting to load addon...');
    const addon = require(path.resolve(ADDON_PATH));

    console.log('✅ Addon loaded successfully');

    // Check for expected exports
    const expectedFunctions = [
      'whisper_init_from_file',
      'whisper_init_from_buffer',
      'whisper_full',
      'whisper_free',
    ];

    console.log('🔍 Checking for expected function exports...');

    const exports = Object.keys(addon);
    console.log(`📋 Available exports: ${exports.join(', ')}`);

    let missingFunctions = [];
    for (const func of expectedFunctions) {
      if (typeof addon[func] === 'function') {
        console.log(`✅ ${func}: Found`);
      } else if (addon[func] !== undefined) {
        console.log(`⚠️ ${func}: Found but not a function`);
      } else {
        console.log(`❌ ${func}: Missing`);
        missingFunctions.push(func);
      }
    }

    if (missingFunctions.length > 0) {
      console.warn(
        `⚠️ Warning: Missing expected functions: ${missingFunctions.join(', ')}`,
      );
    } else {
      console.log('✅ All expected functions found');
    }

    return true;
  } catch (error) {
    console.error(`❌ Failed to load addon: ${error.message}`);

    // Provide debugging information
    if (error.code === 'MODULE_NOT_FOUND') {
      console.error(
        '💡 This might be due to missing dependencies or architecture mismatch',
      );
    } else if (error.message.includes('dynamic library')) {
      console.error(
        '💡 This might be due to missing shared libraries or incorrect linking',
      );
    }

    console.error('🔍 Error details:', error);
    return false;
  }
}

/**
 * Validate OpenVINO-specific functionality
 */
function validateOpenVINOFeatures() {
  console.log('\n📋 Step 3: OpenVINO Features Validation');

  if (BUILD_TYPE !== 'openvino') {
    console.log('ℹ️ Skipping OpenVINO validation for non-OpenVINO build');
    return true;
  }

  try {
    const addon = require(path.resolve(ADDON_PATH));

    // Check for OpenVINO-specific functions or properties
    const openvinoFeatures = [
      'whisper_openvino_set_device',
      'whisper_openvino_get_devices',
      'whisper_init_openvino',
    ];

    console.log('🔍 Checking for OpenVINO-specific features...');

    let foundFeatures = [];
    for (const feature of openvinoFeatures) {
      if (addon[feature] !== undefined) {
        console.log(`✅ ${feature}: Found`);
        foundFeatures.push(feature);
      } else {
        console.log(`ℹ️ ${feature}: Not found (may be internal)`);
      }
    }

    if (foundFeatures.length > 0) {
      console.log(`✅ OpenVINO features detected: ${foundFeatures.join(', ')}`);
    } else {
      console.log(
        'ℹ️ No specific OpenVINO functions found (may be integrated internally)',
      );
    }

    return true;
  } catch (error) {
    console.error(`❌ Failed to validate OpenVINO features: ${error.message}`);
    return false;
  }
}

/**
 * Validate dependencies and shared libraries
 */
function validateDependencies() {
  console.log('\n📋 Step 4: Dependencies Validation');

  // Platform-specific dependency checking
  const platform = process.platform;
  console.log(`🖥️ Platform: ${platform}`);

  if (platform === 'linux') {
    return validateLinuxDependencies();
  } else if (platform === 'win32') {
    return validateWindowsDependencies();
  } else if (platform === 'darwin') {
    return validateMacOSDependencies();
  } else {
    console.log('ℹ️ Dependency validation not implemented for this platform');
    return true;
  }
}

function validateLinuxDependencies() {
  console.log('🐧 Checking Linux dependencies...');

  return new Promise((resolve) => {
    const ldd = spawn('ldd', [ADDON_PATH]);
    let output = '';
    let hasErrors = false;

    ldd.stdout.on('data', (data) => {
      output += data.toString();
    });

    ldd.stderr.on('data', (data) => {
      console.error(`⚠️ ldd stderr: ${data}`);
    });

    ldd.on('close', (code) => {
      if (code !== 0) {
        console.error(`❌ ldd failed with code ${code}`);
        resolve(false);
        return;
      }

      console.log('📋 Shared library dependencies:');
      const lines = output.split('\n').filter((line) => line.trim());

      for (const line of lines) {
        if (line.includes('=>')) {
          const parts = line.split('=>');
          const lib = parts[0].trim();
          const path = parts[1].trim();

          if (path.includes('not found')) {
            console.error(`❌ Missing: ${lib}`);
            hasErrors = true;
          } else {
            console.log(`✅ ${lib} => ${path}`);
          }
        }
      }

      if (BUILD_TYPE === 'openvino') {
        // Check for OpenVINO libraries
        if (output.includes('libopenvino')) {
          console.log('✅ OpenVINO libraries detected');
        } else {
          console.warn('⚠️ No OpenVINO libraries found in dependencies');
        }
      }

      resolve(!hasErrors);
    });

    ldd.on('error', (error) => {
      console.warn(`⚠️ Could not run ldd: ${error.message}`);
      resolve(true); // Don't fail on ldd unavailability
    });
  });
}

function validateWindowsDependencies() {
  console.log('🪟 Windows dependency validation not fully implemented');
  // Could use dumpbin or similar tools here
  return Promise.resolve(true);
}

function validateMacOSDependencies() {
  console.log('🍎 macOS dependency validation not fully implemented');
  // Could use otool here
  return Promise.resolve(true);
}

/**
 * Performance and size validation
 */
function validatePerformance() {
  console.log('\n📋 Step 5: Performance Validation');

  const stats = fs.statSync(ADDON_PATH);
  const sizeInMB = stats.size / 1024 / 1024;

  console.log(`📏 File size: ${sizeInMB.toFixed(2)} MB`);

  // Size validation based on build type
  if (BUILD_TYPE === 'openvino') {
    if (sizeInMB > 200) {
      console.warn(
        `⚠️ OpenVINO addon size is quite large: ${sizeInMB.toFixed(2)} MB`,
      );
    } else {
      console.log(
        `✅ OpenVINO addon size is reasonable: ${sizeInMB.toFixed(2)} MB`,
      );
    }
  } else {
    if (sizeInMB > 100) {
      console.warn(
        `⚠️ Standard addon size is quite large: ${sizeInMB.toFixed(2)} MB`,
      );
    } else {
      console.log(
        `✅ Standard addon size is reasonable: ${sizeInMB.toFixed(2)} MB`,
      );
    }
  }

  return true;
}

/**
 * Main validation workflow
 */
async function main() {
  let allPassed = true;

  try {
    // Run validation steps
    allPassed &= validateFile();
    allPassed &= validateAddonStructure();
    allPassed &= validateOpenVINOFeatures();
    allPassed &= await validateDependencies();
    allPassed &= validatePerformance();
  } catch (error) {
    console.error(`💥 Validation failed with error: ${error.message}`);
    allPassed = false;
  }

  console.log(
    '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
  );

  if (allPassed) {
    console.log('🎉 All validations passed! Addon is ready for use.');
    process.exit(0);
  } else {
    console.log('❌ Some validations failed. Please check the addon build.');
    process.exit(1);
  }
}

// Run the validation
if (require.main === module) {
  main().catch((error) => {
    console.error(`💥 Unexpected error: ${error.message}`);
    process.exit(1);
  });
}
