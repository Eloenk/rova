import { getFailsafePlan } from '../lib/failsafe';

function testFailsafe() {
  const simple = "swap 10 usdc to eurc";
  const complex1 = "swap 10 usdc to eurc and bridge 20 usdc to 0x1234567890123456789012345678901234567890";
  const complex2 = "swap 10 usdc then send 5 usdc to 0x1234567890123456789012345678901234567890";
  const multiAddr = "send 5 usdc to 0x1111111111111111111111111111111111111111 and 10 to 0x2222222222222222222222222222222222222222";

  console.log('Testing Simple Intent:', simple);
  console.log('Result:', getFailsafePlan(simple) ? '✅ Handled by Failsafe' : '❌ Failed to handle');

  console.log('\nTesting Complex Intent (Swap + Bridge):', complex1);
  console.log('Result:', getFailsafePlan(complex1) === null ? '✅ Yielded to AI' : '❌ Failsafe intercepted complex intent');

  console.log('\nTesting Complex Intent (Swap then Send):', complex2);
  console.log('Result:', getFailsafePlan(complex2) === null ? '✅ Yielded to AI' : '❌ Failsafe intercepted complex intent');

  console.log('\nTesting Multi-Address Intent:', multiAddr);
  console.log('Result:', getFailsafePlan(multiAddr) === null ? '✅ Yielded to AI' : '❌ Failsafe intercepted complex intent');
}

testFailsafe();
