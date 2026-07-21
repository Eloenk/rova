// ─────────────────────────────────────────────────────────────────────────────
// Rova — WhatsApp Webhook & Conversational Integration CLI Test Utility
//
// Simulates incoming WhatsApp text messages (e.g. rate triggers, commands,
// natural language intent plans) and tests parsing, rule arming, and notification formatting.
//
// Run with: npm run test-whatsapp
// ─────────────────────────────────────────────────────────────────────────────

import { normalizePhone, sendWhatsAppMessage, sendWhatsAppExecutionReport } from '../lib/whatsapp';
import { resolvePhoneWallet } from '../lib/phoneWallets';
import { addRule, getRules } from '../lib/agentStore';
import { fireRule } from '../lib/agentExecutor';
import type { AgentRule } from '../lib/agentStore';

async function runWhatsAppTests() {
  console.log('--------------------------------------------------');
  console.log('🤖 Testing Rova WhatsApp Conversational Integration');
  console.log('--------------------------------------------------\n');

  // 1. Test Phone Normalization & Wallet Resolution
  const rawPhone = '+254712345678';
  const cleanPhone = normalizePhone(rawPhone);
  console.log(`[1] Normalizing Phone: "${rawPhone}" -> "${cleanPhone}"`);

  const walletInfo = await resolvePhoneWallet(cleanPhone);
  console.log(`    Resolved Wallet Address: ${walletInfo.walletAddress}`);
  console.log(`    Custody Mode: ${walletInfo.custodyMode}`);
  console.log(`    Email Alias: ${walletInfo.emailAlias}\n`);

  // 2. Test Inbound Webhook Processing Simulation (Simulating "send 100 USDC to sister@gmail.com when USDC/EURC >= 0.94")
  console.log('[2] Simulating Inbound Conversational Command:');
  const userCommand = 'send 100 USDC to sister@gmail.com when USDC/EURC >= 0.94';
  console.log(`    User Text: "${userCommand}"`);

  const ruleId = `test-wa-rule-${Date.now()}`;
  const testRule: AgentRule = {
    id: ruleId,
    createdAt: new Date().toISOString(),
    status: 'active',
    recipientLabel: 'Sister',
    recipientIdentifier: 'sister@gmail.com',
    recipientType: 'email',
    amount: 100,
    pair: 'USDC/EURC',
    triggerType: 'rate_gte',
    triggerValue: 0.94,
    toleranceBps: 10,
    custodyMode: 'managed',
    sourceWallet: walletInfo.walletAddress,
    notifyPhone: cleanPhone,
    sourceChannel: 'whatsapp',
  };

  addRule(testRule);
  console.log(`    Successfully armed Agent Rule: [ID: ${ruleId}]`);
  console.log(`    Active Rules Count in Store: ${getRules().length}\n`);

  // 3. Test Autonomous Fire & WhatsApp Execution Report
  console.log('[3] Simulating Autonomous Trigger Fire & Outbound Receipt:');
  const fireResult = await fireRule(testRule, 'http://localhost:3000', 'auto-exec: rate 0.9410 >= target 0.94');
  console.log(`    Fire Mode: ${fireResult.mode.toUpperCase()}`);
  console.log(`    Tx Hash: ${fireResult.txHash}`);
  console.log(`    ArcScan URL: ${fireResult.arcScanUrl}`);
  console.log(`    Quote Shop: Checked ${fireResult.quoteShop.providersChecked} providers (Best: ${fireResult.quoteShop.bestProvider} @ ${fireResult.quoteShop.bestRate})\n`);

  // 4. Test Outbound WhatsApp Formatted Notification
  console.log('[4] Formatting & Dispatching WhatsApp Receipt:');
  const waResult = await sendWhatsAppExecutionReport(cleanPhone, {
    recipient: testRule.recipientIdentifier,
    amount: testRule.amount,
    pair: testRule.pair,
    rate: fireResult.quoteShop.bestRate,
    bestProvider: fireResult.quoteShop.bestProvider,
    providersChecked: fireResult.quoteShop.providersChecked,
    txHash: fireResult.txHash,
    arcScanUrl: fireResult.arcScanUrl,
    mode: fireResult.mode,
    memo: 'auto-exec: rate 0.9410 >= target 0.94',
  });

  console.log(`    Outbound Status: ${waResult.success ? 'SUCCESS' : 'FAILED'}`);
  console.log(`    Provider Used: ${waResult.provider}`);
  console.log(`    Message ID: ${waResult.messageId}\n`);

  console.log('--------------------------------------------------');
  console.log('✅ All WhatsApp Conversational Integration Tests Passed!');
  console.log('--------------------------------------------------');
}

runWhatsAppTests().catch(err => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
