#!/usr/bin/env node

// Test the parsing function from check-test-threshold.js
const {
  parseTestResults,
  MINIMUM_PASS_RATE,
} = require('./check-test-threshold.js');

// Test with actual Jest output format
const testOutput = `
Running one project: jsdom
FAIL jsdom test/components/GPUSelectionDropbox.test.tsx
PASS jsdom test/components/GPUInfoPanel.test.tsx

Test Suites: 4 failed, 6 passed, 10 total
Tests:       40 failed, 21 skipped, 302 passed, 363 total
Snapshots:   0 total
Time:        24.756 s, estimated 25 s
Ran all test suites.
`;

const results = parseTestResults(testOutput);

if (results) {
  console.log('✅ Parser working correctly!');
  console.log('Results:', results);
  console.log(`Pass rate: ${results.passRate.toFixed(1)}%`);
  console.log(
    `Meets ${MINIMUM_PASS_RATE}% threshold: ${results.passRate >= MINIMUM_PASS_RATE ? 'YES' : 'NO'}`,
  );
} else {
  console.log('❌ Parser failed to extract results');
}
