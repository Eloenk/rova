// ─────────────────────────────────────────────────────────────────────────────
// Rova — WhatsApp Webhook API Endpoint
//
// Handles GET verification challenge (Meta WhatsApp Cloud API) and POST inbound
// message webhooks (Meta Cloud API & Twilio format).
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server';
import { sendWhatsAppMessage, normalizePhone } from '@/lib/whatsapp';
import { resolvePhoneWallet } from '@/lib/phoneWallets';
import { addRule, addStandingIntent, getRules, getStandingIntents } from '@/lib/agentStore';
import { generateFlowPlan } from '@/lib/ai-provider';
import type { AgentRule, StandingIntent } from '@/lib/agentStore';

export const dynamic = 'force-dynamic';

/// GET /api/whatsapp/webhook
/// Handles Meta WhatsApp Cloud API webhook verification challenge.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN || 'rova-secret-verify-token';

  if (mode === 'subscribe' && token === expectedToken) {
    console.log('[WhatsApp Webhook] Challenge verified successfully');
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Forbidden. Invalid verify token.' }, { status: 403 });
}

/// POST /api/whatsapp/webhook
/// Processes inbound WhatsApp messages from Meta or Twilio.
export async function POST(req: Request) {
  try {
    let fromPhone = '';
    let messageBody = '';

    const contentType = req.headers.get('content-type') || '';

    // 1. Handle Form URL Encoded (Twilio format)
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData();
      const rawFrom = formData.get('From')?.toString() || '';
      messageBody = formData.get('Body')?.toString() || '';
      fromPhone = rawFrom.replace('whatsapp:', '');
    } else {
      // 2. Handle JSON (Meta Cloud API format or custom test payload)
      const body = await req.json();

      if (body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
        const msg = body.entry[0].changes[0].value.messages[0];
        fromPhone = msg.from;
        messageBody = msg.text?.body || '';
      } else if (body.from && body.text) {
        // Direct test format
        fromPhone = body.from;
        messageBody = body.text;
      }
    }

    if (!fromPhone || !messageBody) {
      return NextResponse.json({ status: 'ignored', reason: 'Missing phone or body' });
    }

    const cleanPhone = normalizePhone(fromPhone);
    console.log(`[WhatsApp Webhook] Inbound from ${cleanPhone}: "${messageBody}"`);

    // Resolve user identity & wallet address
    const walletInfo = await resolvePhoneWallet(cleanPhone);
    const textLower = messageBody.trim().toLowerCase();

    // ── Command Dispatch ──────────────────────────────────────────────────────────

    // Command: HELP
    if (textLower === 'help' || textLower === 'start') {
      const reply =
        `🤖 *Welcome to Rova Agentic Economy!*\n\n` +
        `You can send natural money commands or arm rate rules directly via chat:\n\n` +
        `• *"Send 100 USDC to mom@gmail.com when rate >= 0.94"*\n` +
        `• *"Split 200 USDC: 70% to supplier@co.com and 30% to savings every Friday"*\n` +
        `• *"status"* — View your active rules and standing intents\n` +
        `• *"balance"* — View your agent wallet address\n\n` +
        `_Connected Wallet_: \`${walletInfo.walletAddress.slice(0, 10)}...\``;

      await sendWhatsAppMessage(cleanPhone, reply);
      return NextResponse.json({ status: 'ok', command: 'help' });
    }

    // Command: STATUS / RULES
    if (textLower === 'status' || textLower === 'rules' || textLower === 'intents') {
      const activeRules = getRules().filter(r => r.notifyPhone === cleanPhone || r.status === 'active');
      const activeIntents = getStandingIntents().filter(i => i.notifyPhone === cleanPhone || i.status === 'active');

      let reply = `📊 *Rova Active Watchers*\n\n`;
      reply += `• *Active Rate Rules*: ${activeRules.length}\n`;
      activeRules.slice(0, 3).forEach(r => {
        reply += `  - ${r.amount} USDC → ${r.recipientLabel} (${r.pair} ${r.triggerType} ${r.triggerValue})\n`;
      });

      reply += `\n• *Standing Instructions*: ${activeIntents.length}\n`;
      activeIntents.slice(0, 3).forEach(i => {
        reply += `  - "${i.intentText.slice(0, 30)}..." (${i.trigger.type})\n`;
      });

      if (activeRules.length === 0 && activeIntents.length === 0) {
        reply += `\n_No active watchers currently armed. Text a command to set one up!_`;
      }

      await sendWhatsAppMessage(cleanPhone, reply);
      return NextResponse.json({ status: 'ok', command: 'status' });
    }

    // Command: BALANCE
    if (textLower === 'balance' || textLower === 'wallet') {
      const reply =
        `💳 *Rova Agent Account*\n\n` +
        `• *Phone*: ${cleanPhone}\n` +
        `• *Circle Wallet*: \`${walletInfo.walletAddress}\`\n` +
        `• *Custody Mode*: ${walletInfo.custodyMode.toUpperCase()}\n\n` +
        `_Funds sent to this address can be spent or automated via WhatsApp commands._`;

      await sendWhatsAppMessage(cleanPhone, reply);
      return NextResponse.json({ status: 'ok', command: 'balance' });
    }

    // ── AI Natural Language Intent Parsing ─────────────────────────────────────────

    const plan = await generateFlowPlan(messageBody);

    // If the intent contains a rate or date trigger, arm an AgentRule
    const hasRateTrigger = /rate|>=|<=|above|below/i.test(messageBody);
    const hasRecurring = /daily|weekly|monthly|every/i.test(messageBody);

    const planSummary = plan.strategy || plan.reasoning || 'Custom Transfer';
    const firstSplit = plan.splits[0];

    if (hasRateTrigger || planSummary.toLowerCase().includes('rate')) {
      const matchRate = messageBody.match(/(?:>=|<=|above|below|hits?|at)?\s*([0-9]+\.[0-9]+|[0-9]+)/i);
      const targetRate = matchRate ? parseFloat(matchRate[1]) : 0.94;
      const isLte = /below|<=/i.test(messageBody);

      const ruleId = `wa-rule-${Date.now()}`;
      const newRule: AgentRule = {
        id: ruleId,
        createdAt: new Date().toISOString(),
        status: 'active',
        recipientLabel: firstSplit?.recipient || 'Recipient',
        recipientIdentifier: firstSplit?.recipient || firstSplit?.address || 'sister@gmail.com',
        recipientType: 'email',
        amount: firstSplit?.amount || plan.totalAmount || 50,
        pair: 'USDC/EURC',
        triggerType: isLte ? 'rate_lte' : 'rate_gte',
        triggerValue: targetRate,
        toleranceBps: 10,
        custodyMode: 'managed',
        sourceWallet: walletInfo.walletAddress,
        notifyPhone: cleanPhone,
        sourceChannel: 'whatsapp',
      };

      addRule(newRule);

      const reply =
        `🎯 *Agent Rule Armed!*\n\n` +
        `• *Transfer*: ${newRule.amount} USDC → \`${newRule.recipientIdentifier}\`\n` +
        `• *Trigger*: USDC/EURC ${newRule.triggerType === 'rate_gte' ? '≥' : '≤'} ${newRule.triggerValue}\n` +
        `• *Nanopayment Rate Shopping*: Enabled (3 providers will be checked via x402 on trigger)\n` +
        `• *Notifications*: Execution receipt will be sent to this WhatsApp chat.\n\n` +
        `_Rova is now watching live rates 24/7._`;

      await sendWhatsAppMessage(cleanPhone, reply);
      return NextResponse.json({ status: 'ok', armedRuleId: ruleId });
    }

    if (hasRecurring || planSummary.toLowerCase().includes('every') || planSummary.toLowerCase().includes('split')) {
      const intentId = `wa-intent-${Date.now()}`;
      const newIntent: StandingIntent = {
        id: intentId,
        createdAt: new Date().toISOString(),
        status: 'active',
        intentText: messageBody,
        plan,
        trigger: { type: 'recurring', interval: 'weekly' },
        custodyMode: 'managed',
        sourceWallet: walletInfo.walletAddress,
        runCount: 0,
        notifyPhone: cleanPhone,
        sourceChannel: 'whatsapp',
      };

      addStandingIntent(newIntent);

      const reply =
        `⚡ *Standing Instruction Saved!*\n\n` +
        `• *Plan*: "${planSummary}"\n` +
        `• *Splits*: ${plan.splits.length} split(s) planned (${plan.totalAmount} USDC total)\n` +
        `• *Schedule*: Recurring evaluation active\n` +
        `• *Notifications*: Execution reports sent to ${cleanPhone}\n\n` +
        `_View status anytime by typing "status"._`;

      await sendWhatsAppMessage(cleanPhone, reply);
      return NextResponse.json({ status: 'ok', armedIntentId: intentId });
    }

    // Default response: Confirm plan parsed
    const reply =
      `🤖 *Rova AI Plan Parsed*\n\n` +
      `• *Summary*: ${planSummary}\n` +
      `• *Splits*: ${plan.splits.map(s => `${s.amount} ${s.currency} to ${s.recipient} (${s.arcProtocol})`).join(', ')}\n\n` +
      `To arm this with a rate trigger or recurring schedule, add e.g. *"when USDC/EURC >= 0.94"* or *"every Friday"*.`;

    await sendWhatsAppMessage(cleanPhone, reply);
    return NextResponse.json({ status: 'ok', plan });

  } catch (error: any) {
    console.error('[WhatsApp Webhook] Error:', error);
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
  }
}
