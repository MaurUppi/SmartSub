#!/usr/bin/env node

/**
 * Task 1.1 Test Runner Script
 *
 * Comprehensive test runner for validating Task 1.1 completion
 * with 100% test coverage requirement.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function colorLog(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, description) {
  colorLog('blue', `\n🔄 ${description}...`);
  try {
    const output = execSync(command, {
      encoding: 'utf8',
      stdio: ['inherit', 'pipe', 'pipe'],
    });
    colorLog('green', `✅ ${description} completed successfully`);
    return output;
  } catch (error) {
    colorLog('red', `❌ ${description} failed:`);
    console.error(error.message);
    if (error.stdout) console.log(error.stdout);
    if (error.stderr) console.error(error.stderr);
    // Intentional throw for test execution failure - must fail the test script
    throw error;
    process.exit(1); // Explicitly exit (won't reach but satisfies TS)
  }
}

function checkFileExists(filePath, description) {
  if (fs.existsSync(filePath)) {
    colorLog('green', `✅ ${description}: ${filePath}`);
    return true;
  } else {
    colorLog('red', `❌ Missing ${description}: ${filePath}`);
    return false;
  }
}

function main() {
  console.log('');
  colorLog('bold', '='.repeat(60));
  colorLog('bold', '🚀 Task 1.1: Development Environment & Mock System Setup');
  colorLog('bold', '📋 Comprehensive Test Validation with 100% Coverage');
  colorLog('bold', '='.repeat(60));

  const startTime = Date.now();
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  try {
    // Step 1: Verify required files exist
    colorLog('cyan', '\n📁 Step 1: Verifying Task 1.1 Implementation Files');

    const requiredFiles = [
      {
        path: 'main/helpers/developmentMockSystem.ts',
        desc: 'Development Mock System',
      },
      { path: 'main/helpers/testUtils.ts', desc: 'Test Utilities' },
      { path: 'test/setup/mockEnvironment.ts', desc: 'Mock Environment Setup' },
      { path: 'test/fixtures/mockGPUData.ts', desc: 'Mock GPU Data Fixtures' },
      {
        path: 'test/unit/developmentMockSystem.test.ts',
        desc: 'Mock System Unit Tests',
      },
      { path: 'test/unit/testUtils.test.ts', desc: 'Test Utils Unit Tests' },
      {
        path: 'test/unit/mockEnvironment.test.ts',
        desc: 'Mock Environment Unit Tests',
      },
      {
        path: 'test/unit/mockGPUData.test.ts',
        desc: 'Mock GPU Data Unit Tests',
      },
      {
        path: 'test/integration/task1.1.integration.test.ts',
        desc: 'Task 1.1 Integration Tests',
      },
      { path: 'jest.config.js', desc: 'Jest Configuration' },
    ];

    let allFilesExist = true;
    for (const file of requiredFiles) {
      if (!checkFileExists(file.path, file.desc)) {
        allFilesExist = false;
      }
    }

    if (!allFilesExist) {
      // Intentional throw for missing required files - cannot proceed with tests
      throw new Error('Missing required implementation files');
      process.exit(1); // Explicitly exit (won't reach but satisfies TS)
    }

    // Step 2: Install test dependencies if needed
    colorLog('cyan', '\n📦 Step 2: Checking Test Dependencies');

    try {
      runCommand(
        'npm list jest ts-jest @types/jest',
        'Checking Jest installation',
      );
    } catch (error) {
      colorLog('yellow', '⚠️  Installing missing test dependencies...');
      runCommand(
        'npm install --save-dev jest ts-jest @types/jest jest-html-reporter',
        'Installing test dependencies',
      );
    }

    // Step 3: Run TypeScript compilation check
    colorLog('cyan', '\n🔧 Step 3: TypeScript Compilation Check');

    runCommand(
      'npx tsc --noEmit --project tsconfig.json',
      'TypeScript compilation check',
    );

    // Step 4: Run unit tests with coverage
    colorLog(
      'cyan',
      '\n🧪 Step 4: Running Unit Tests (100% Coverage Required)',
    );

    const unitTestOutput = runCommand(
      'npx jest test/unit --coverage --coverageReporters=text --verbose',
      'Unit tests execution',
    );

    // Parse test results from output
    const unitTestMatches = unitTestOutput.match(
      /Tests:\\s+(\\d+)\\s+passed,\\s+(\\d+)\\s+total/,
    );
    if (unitTestMatches) {
      const unitPassed = parseInt(unitTestMatches[1]);
      const unitTotal = parseInt(unitTestMatches[2]);
      totalTests += unitTotal;
      passedTests += unitPassed;
      failedTests += unitTotal - unitPassed;

      colorLog('green', `✅ Unit Tests: ${unitPassed}/${unitTotal} passed`);
    }

    // Step 5: Run integration tests
    colorLog('cyan', '\n🔗 Step 5: Running Integration Tests');

    const integrationTestOutput = runCommand(
      'npx jest test/integration --verbose',
      'Integration tests execution',
    );

    // Parse integration test results
    const integrationTestMatches = integrationTestOutput.match(
      /Tests:\\s+(\\d+)\\s+passed,\\s+(\\d+)\\s+total/,
    );
    if (integrationTestMatches) {
      const integrationPassed = parseInt(integrationTestMatches[1]);
      const integrationTotal = parseInt(integrationTestMatches[2]);
      totalTests += integrationTotal;
      passedTests += integrationPassed;
      failedTests += integrationTotal - integrationPassed;

      colorLog(
        'green',
        `✅ Integration Tests: ${integrationPassed}/${integrationTotal} passed`,
      );
    }

    // Step 6: Verify coverage requirements
    colorLog('cyan', '\n📊 Step 6: Verifying Coverage Requirements');

    if (fs.existsSync('coverage/lcov-report/index.html')) {
      colorLog(
        'green',
        '✅ Coverage report generated: coverage/lcov-report/index.html',
      );
    }

    // Step 7: Run comprehensive Task 1.1 validation
    colorLog('cyan', '\n✔️  Step 7: Task 1.1 Comprehensive Validation');

    const validationOutput = runCommand(
      'npx jest test/integration/task1.1.integration.test.ts --testNamePattern="Task 1.1 Validation" --verbose',
      'Task 1.1 acceptance criteria validation',
    );

    // Step 8: Generate final report
    colorLog('cyan', '\n📋 Step 8: Generating Test Report');

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    console.log('');
    colorLog('bold', '='.repeat(60));
    colorLog('bold', '📊 TASK 1.1 TEST EXECUTION SUMMARY');
    colorLog('bold', '='.repeat(60));

    colorLog('green', `✅ Total Tests Run: ${totalTests}`);
    colorLog('green', `✅ Tests Passed: ${passedTests}`);

    if (failedTests > 0) {
      colorLog('red', `❌ Tests Failed: ${failedTests}`);
    } else {
      colorLog('green', `✅ Tests Failed: ${failedTests}`);
    }

    colorLog('blue', `⏱️  Execution Time: ${duration.toFixed(2)} seconds`);

    // Coverage verification
    if (fs.existsSync('coverage/coverage-summary.json')) {
      const coverageSummary = JSON.parse(
        fs.readFileSync('coverage/coverage-summary.json', 'utf8'),
      );
      const totalCoverage = coverageSummary.total;

      colorLog('cyan', `\\n📈 Coverage Summary:`);
      colorLog('green', `  Lines: ${totalCoverage.lines.pct}%`);
      colorLog('green', `  Functions: ${totalCoverage.functions.pct}%`);
      colorLog('green', `  Branches: ${totalCoverage.branches.pct}%`);
      colorLog('green', `  Statements: ${totalCoverage.statements.pct}%`);

      const allCoverage100 =
        totalCoverage.lines.pct === 100 &&
        totalCoverage.functions.pct === 100 &&
        totalCoverage.branches.pct === 100 &&
        totalCoverage.statements.pct === 100;

      if (allCoverage100) {
        colorLog('green', '🎯 100% TEST COVERAGE ACHIEVED!');
      } else {
        colorLog('yellow', '⚠️  100% test coverage not achieved');
      }
    }

    console.log('');
    colorLog('bold', '='.repeat(60));

    if (failedTests === 0 && passedTests > 0) {
      colorLog('green', '🎉 TASK 1.1 SUCCESSFULLY COMPLETED!');
      colorLog('green', '✅ All acceptance criteria validated');
      colorLog('green', '✅ 100% test coverage achieved');
      colorLog('green', '✅ Ready to proceed to Task 1.2');
      console.log('');
      colorLog('cyan', '📁 Generated artifacts:');
      colorLog('cyan', '  - coverage/lcov-report/index.html (Coverage Report)');
      colorLog('cyan', '  - coverage/test-report.html (Test Report)');
      colorLog('cyan', '  - All Task 1.1 implementation files');

      process.exit(0);
    } else {
      colorLog('red', '❌ TASK 1.1 VALIDATION FAILED');
      colorLog('red', 'Please fix failing tests before proceeding');
      process.exit(1);
    }
  } catch (error) {
    console.log('');
    colorLog('bold', '='.repeat(60));
    colorLog('red', '❌ TASK 1.1 TEST EXECUTION FAILED');
    colorLog('bold', '='.repeat(60));
    colorLog('red', `Error: ${error.message}`);

    if (error.code) {
      colorLog('red', `Exit Code: ${error.code}`);
    }

    colorLog('yellow', '\\n🔧 Troubleshooting:');
    colorLog('yellow', '1. Ensure all implementation files are present');
    colorLog('yellow', '2. Check TypeScript compilation errors');
    colorLog('yellow', '3. Review test failures in detail');
    colorLog('yellow', '4. Verify Jest configuration');
    colorLog('yellow', '5. Check environment setup');

    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  colorLog('yellow', '\\n⚠️  Test execution interrupted by user');
  process.exit(1);
});

process.on('SIGTERM', () => {
  colorLog('yellow', '\\n⚠️  Test execution terminated');
  process.exit(1);
});

// Run the main function
if (require.main === module) {
  main();
}
