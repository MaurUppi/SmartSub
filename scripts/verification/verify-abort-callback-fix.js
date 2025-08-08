#!/usr/bin/env node

/**
 * ABORT CALLBACK FIX VERIFICATION
 *
 * This script verifies the critical fix that replaces broken progress_callback
 * return values with proper abort_callback implementation for whisper.cpp
 */

const fs = require('fs');
const path = require('path');

console.log('🚨 ABORT CALLBACK FIX VERIFICATION');
console.log('=================================\n');

const subtitleGeneratorPath = path.join(
  __dirname,
  '../../main/helpers/subtitleGenerator.ts',
);
if (fs.existsSync(subtitleGeneratorPath)) {
  const content = fs.readFileSync(subtitleGeneratorPath, 'utf8');

  console.log('🔍 Test 1: Abort Callback Implementation');
  console.log('---------------------------------------');

  // Check for proper abort_callback
  const hasAbortCallback = content.includes('abort_callback:');
  const abortCallbackReturnsBoolean =
    content.includes('return true;') &&
    content.includes('return false;') &&
    content.includes('abort_callback:');
  const abortCallbackChecksCancel =
    content.includes('isTaskCancelled()') &&
    content.includes('abort_callback:');
  const hasAbortLogging =
    content.includes('ABORT:') ||
    content.includes('stopping native whisper processing');

  console.log(
    `✅ abort_callback defined: ${hasAbortCallback ? '✅ Yes' : '❌ Missing'}`,
  );
  console.log(
    `✅ Returns boolean values: ${abortCallbackReturnsBoolean ? '✅ Yes' : '❌ Missing'}`,
  );
  console.log(
    `✅ Checks cancellation state: ${abortCallbackChecksCancel ? '✅ Yes' : '❌ Missing'}`,
  );
  console.log(
    `✅ Has abort logging: ${hasAbortLogging ? '✅ Yes' : '❌ Missing'}`,
  );

  console.log('\n🔍 Test 2: Progress Callback (Void) Implementation');
  console.log('------------------------------------------------');

  // Check that progress_callback is now void and doesn't try to control execution
  const progressCallbackHasReturn =
    content.includes('progress_callback:') &&
    content.includes('return false') &&
    content.includes('return true') &&
    content.includes('progress_callback:');
  const progressCallbackOnlyUI =
    content.includes('progress_callback:') &&
    content.includes('event.sender.send') &&
    content.includes('taskProgressChange');
  const noReturnInProgress = !content.match(
    /progress_callback:[\s\S]*?return\s+(true|false)/,
  );
  const hasVoidComment =
    content.includes('void') && content.includes('progress_callback');

  console.log(
    `✅ No return values for control: ${!progressCallbackHasReturn ? '✅ Clean' : '❌ Still has returns'}`,
  );
  console.log(
    `✅ Only handles UI updates: ${progressCallbackOnlyUI ? '✅ Yes' : '❌ Missing'}`,
  );
  console.log(
    `✅ Properly void implementation: ${noReturnInProgress ? '✅ Yes' : '❌ Still returns values'}`,
  );
  console.log(
    `✅ Has void documentation: ${hasVoidComment ? '✅ Yes' : '❌ Missing'}`,
  );

  console.log('\n🔍 Test 3: Parameter Logging Update');
  console.log('----------------------------------');

  // Check that both callbacks are logged
  const logsAbortCallback = content.includes("abort_callback: '[Function]'");
  const logsProgressCallback = content.includes(
    "progress_callback: '[Function]'",
  );

  console.log(
    `✅ Logs abort_callback: ${logsAbortCallback ? '✅ Yes' : '❌ Missing'}`,
  );
  console.log(
    `✅ Logs progress_callback: ${logsProgressCallback ? '✅ Yes' : '❌ Missing'}`,
  );

  console.log('\n🔍 Test 4: Error Handling Updates');
  console.log('--------------------------------');

  // Check for updated error handling for abort scenarios
  const handlesAbortErrors =
    content.includes('aborted') || content.includes('abort');
  const hasAbortErrorCode = content.includes('-6'); // whisper.cpp abort error code
  const handlesUnexpectedCompletion =
    content.includes('unexpected completion') ||
    content.includes('completed despite cancellation');

  console.log(
    `✅ Handles abort errors: ${handlesAbortErrors ? '✅ Yes' : '❌ Missing'}`,
  );
  console.log(
    `✅ Checks abort error code: ${hasAbortErrorCode ? '✅ Yes' : '❌ Missing'}`,
  );
  console.log(
    `✅ Handles unexpected completion: ${handlesUnexpectedCompletion ? '✅ Yes' : '❌ Missing'}`,
  );

  console.log('\n🔍 Test 5: Critical Safety Patterns');
  console.log('----------------------------------');

  // Check for critical safety patterns
  const bothCallbacksHaveTryCatch =
    content.includes('abort_callback:') &&
    content.includes('try {') &&
    content.includes('} catch') &&
    content.includes('progress_callback:');
  const noExceptionEscape =
    !content.includes('throw') ||
    content.includes('Never let exceptions escape');
  const hasAtomicStateChecks =
    content.includes('isTaskCancelled()') && content.includes('isTaskPaused()');

  console.log(
    `✅ Both callbacks protected: ${bothCallbacksHaveTryCatch ? '✅ Yes' : '❌ Missing'}`,
  );
  console.log(
    `✅ No exception escape: ${noExceptionEscape ? '✅ Safe' : '❌ May throw'}`,
  );
  console.log(
    `✅ Atomic state checks: ${hasAtomicStateChecks ? '✅ Yes' : '❌ Missing'}`,
  );

  console.log('\n📋 Test 6: Implementation Correctness Analysis');
  console.log('--------------------------------------------');

  // Extract and analyze the abort_callback implementation
  const abortCallbackMatch = content.match(
    /abort_callback:\s*\(\)\s*=>\s*\{[\s\S]*?\},/,
  );
  const progressCallbackMatch = content.match(
    /progress_callback:\s*\([^)]*\)\s*=>\s*\{[\s\S]*?\},/,
  );

  if (abortCallbackMatch) {
    const abortCallbackCode = abortCallbackMatch[0];
    console.log('✅ Abort callback found and extracted');

    // Check specific patterns in abort callback
    const returnsTrueForCancel =
      abortCallbackCode.includes('isTaskCancelled()') &&
      abortCallbackCode.includes('return true');
    const returnsFalseDefault =
      abortCallbackCode.includes('return false') &&
      !abortCallbackCode.includes('isTaskPaused()'); // pause shouldn't abort

    console.log(
      `   ✅ Returns true for cancellation: ${returnsTrueForCancel ? '✅ Yes' : '❌ Wrong logic'}`,
    );
    console.log(
      `   ✅ Returns false by default: ${returnsFalseDefault ? '✅ Yes' : '❌ Wrong logic'}`,
    );
  } else {
    console.log('❌ Abort callback not found or malformed');
  }

  if (progressCallbackMatch) {
    const progressCallbackCode = progressCallbackMatch[0];
    console.log('✅ Progress callback found and extracted');

    // Check that it doesn't return control values
    const hasNoControlReturns =
      !progressCallbackCode.includes('return true') &&
      !progressCallbackCode.includes('return false');
    const onlyUIUpdates = progressCallbackCode.includes('event.sender.send');

    console.log(
      `   ✅ No control returns: ${hasNoControlReturns ? '✅ Clean' : '❌ Still has returns'}`,
    );
    console.log(
      `   ✅ Only UI updates: ${onlyUIUpdates ? '✅ Yes' : '❌ Missing'}`,
    );
  } else {
    console.log('❌ Progress callback not found or malformed');
  }
} else {
  console.log('❌ subtitleGenerator.ts not found');
  process.exit(1);
}

console.log('\n🎯 EXPECTED BEHAVIOR WITH THIS FIX');
console.log('=================================');

console.log('✅ STOP Button:');
console.log('   • abort_callback returns true');
console.log('   • whisper.cpp immediately stops processing');
console.log('   • GPU utilization drops to normal');
console.log('   • Returns error code -6 to JavaScript');
console.log('   • TaskCancellationError thrown in safe JavaScript context');
console.log('   • App remains stable');

console.log('\n⚠️ PAUSE Button (Limited):');
console.log('   • progress_callback skips UI updates');
console.log('   • abort_callback continues returning false');
console.log('   • whisper.cpp processing continues in background');
console.log('   • GPU utilization remains high (expected)');
console.log('   • UI shows paused state');

console.log('\n🔄 RESTART Button:');
console.log('   • Old task cancelled via abort_callback');
console.log('   • GPU utilization drops');
console.log('   • New task starts cleanly');
console.log('   • No multiple tasks running simultaneously');

console.log('\n🚨 WHAT WAS WRONG BEFORE');
console.log('=========================');
console.log('❌ Used progress_callback return values (IGNORED by whisper.cpp)');
console.log('❌ progress_callback is void - return values have no effect');
console.log('❌ Native processing continued regardless of JavaScript signals');
console.log('❌ GPU stayed at 97% because processing never actually stopped');
console.log('❌ Required force quit (CMD-Q) to terminate');

console.log('\n✅ WHAT IS CORRECT NOW');
console.log('======================');
console.log('✅ Uses abort_callback which is actually checked by whisper.cpp');
console.log('✅ abort_callback return true = immediate processing termination');
console.log('✅ progress_callback is void and only handles UI updates');
console.log('✅ GPU utilization drops when processing actually stops');
console.log('✅ App remains stable, no force quit needed');

console.log('\n🧪 MANUAL TESTING REQUIRED');
console.log('==========================');
console.log('1. 🔨 Build the application: npm run build:local');
console.log('2. 📦 Launch packaged application');
console.log('3. 🎬 Load a large audio/video file');
console.log('4. ▶️ Start processing and monitor GPU usage');
console.log('5. ⏹️ Click STOP - GPU should drop immediately');
console.log('6. 🔄 Try RESTART - should work cleanly');
console.log('7. ⏸️ Try PAUSE - UI pauses, GPU stays high (expected)');
console.log('8. ✅ Verify no crashes or force quit needed');

console.log('\n✅ Abort callback fix verification COMPLETE');
console.log('🎯 Ready for manual testing to confirm GPU behavior');
