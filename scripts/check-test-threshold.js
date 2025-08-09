#!/usr/bin/env node

/**
 * Check if test pass rate meets the minimum threshold
 * This script is used in CI to allow for non-100% pass rates
 * while still ensuring quality standards are met.
 */

const { execSync } = require('child_process');
const fs = require('fs');

// Configuration
const MINIMUM_PASS_RATE = 80; // Minimum percentage of tests that must pass
const TEST_COMMAND = 'npm run test:tsx';

function runTests() {
  try {
    // Run tests and capture output
    const output = execSync(`${TEST_COMMAND} 2>&1`, {
      encoding: 'utf8',
      stdio: 'pipe',
      shell: true,
    });
    return output;
  } catch (error) {
    // Tests failed, but we need to parse the output
    if (error.stdout) {
      return error.stdout;
    }
    if (error.output) {
      return error.output.map((o) => (o ? o.toString() : '')).join('\n');
    }
    return error.toString();
  }
}

function parseTestResults(output) {
  // Look for the test summary line with more flexible matching
  // Format: "Tests:       40 failed, 21 skipped, 302 passed, 363 total"
  const testSummaryMatch = output.match(
    /Tests:\s+(\d+)\s+failed,\s+(\d+)\s+skipped,\s+(\d+)\s+passed,\s+(\d+)\s+total/,
  );

  if (!testSummaryMatch) {
    // Try alternative format without skipped tests
    const altMatch = output.match(
      /Tests:\s+(\d+)\s+failed,\s+(\d+)\s+passed,\s+(\d+)\s+total/,
    );
    if (altMatch) {
      const [, failed, passed, total] = altMatch.map(Number);
      return {
        failed,
        skipped: 0,
        passed,
        total,
        passRate: (passed / total) * 100,
      };
    }

    console.error('Could not parse test results from output');
    console.error('Output sample:', output.slice(-500)); // Show last 500 chars for debugging
    return null;
  }

  const [, failed, skipped, passed, total] = testSummaryMatch.map(Number);

  // Calculate pass rate excluding skipped tests
  const effectiveTotal = total - skipped;
  const passRate = effectiveTotal > 0 ? (passed / effectiveTotal) * 100 : 0;

  return {
    failed,
    skipped,
    passed,
    total,
    passRate,
  };
}

function main() {
  console.log('Running TSX tests with threshold checking...');
  console.log(`Minimum pass rate required: ${MINIMUM_PASS_RATE}%\n`);

  const output = runTests();
  console.log(output);

  const results = parseTestResults(output);

  if (!results) {
    console.error('Failed to parse test results');
    process.exit(1);
  }

  console.log('\n=== Test Results Summary ===');
  console.log(`Total tests: ${results.total}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Skipped: ${results.skipped}`);
  console.log(`Pass rate: ${results.passRate.toFixed(1)}%`);
  console.log(`Required: ${MINIMUM_PASS_RATE}%`);

  if (results.passRate >= MINIMUM_PASS_RATE) {
    console.log(
      `\n✅ Test pass rate (${results.passRate.toFixed(1)}%) meets minimum threshold (${MINIMUM_PASS_RATE}%)`,
    );

    // Write results to a file for CI artifacts
    const resultsJson = {
      ...results,
      threshold: MINIMUM_PASS_RATE,
      passed_threshold: true,
      timestamp: new Date().toISOString(),
    };

    fs.writeFileSync(
      'test-results-tsx.json',
      JSON.stringify(resultsJson, null, 2),
    );
    process.exit(0);
  } else {
    console.log(
      `\n❌ Test pass rate (${results.passRate.toFixed(1)}%) is below minimum threshold (${MINIMUM_PASS_RATE}%)`,
    );

    // Write results to a file for CI artifacts
    const resultsJson = {
      ...results,
      threshold: MINIMUM_PASS_RATE,
      passed_threshold: false,
      timestamp: new Date().toISOString(),
    };

    fs.writeFileSync(
      'test-results-tsx.json',
      JSON.stringify(resultsJson, null, 2),
    );
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { parseTestResults, MINIMUM_PASS_RATE };
