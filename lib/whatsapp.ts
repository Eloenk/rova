// ─────────────────────────────────────────────────────────────────────────────
// Rova — WhatsApp Messaging Integration
//
// Supports outbound messaging via Meta WhatsApp Cloud API or Twilio WhatsApp API.
// Formats natural-language execution reports (with Nanopayment rate breakdown
// and ArcScan explorer links) and self-custody approval alerts.
// ─────────────────────────────────────────────────────────────────────────────

export interface OutboundMessageResult {
  success: boolean;
  messageId?: string;
  provider: 'meta' | 'twilio' | 'mock';
  error?: string;
}

export interface ExecutionReportOpts {
  recipient: string;
  amount: number;
  pair?: string;
  rate?: number;
  bestProvider?: string;
  providersChecked?: number;
  txHash?: string;
  arcScanUrl?: string;
  mode: 'mock' | 'real';
  memo?: string;
}

export interface ApprovalAlertOpts {
  ruleId: string;
  recipient: string;
  amount: number;
  rate?: number;
  approvalUrl: string;
}

function getProvider(): 'meta' | 'twilio' | 'mock' {
  if (process.env.WHATSAPP_API_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID) {
    return 'meta';
  }
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_NUMBER) {
    return 'twilio';
  }
  return 'mock';
}

/// Formats a phone number to standard E.164 (e.g. +254712345678)
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) return digits;
  if (digits.startsWith('00')) return '+' + digits.slice(2);
  // Default to + if no leading symbol
  return '+' + digits;
}

/// Sends a plain text message to a WhatsApp number.
export async function sendWhatsAppMessage(toPhone: string, text: string): Promise<OutboundMessageResult> {
  const phone = normalizePhone(toPhone);
  const provider = getProvider();

  if (provider === 'mock') {
    console.log(`[WhatsApp Mock Outbound] to=${phone}:\n${text}\n---`);
    return { success: true, messageId: `mock-wa-${Date.now()}`, provider: 'mock' };
  }

  if (provider === 'meta') {
    try {
      const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID!;
      const token = process.env.WHATSAPP_API_TOKEN!;
      const cleanPhone = phone.replace('+', '');

      const res = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: cleanPhone,
          type: 'text',
          text: { body: text },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Meta WhatsApp API request failed');
      }

      return {
        success: true,
        messageId: data.messages?.[0]?.id,
        provider: 'meta',
      };
    } catch (e: any) {
      console.error('[WhatsApp] Meta Cloud API error:', e);
      return { success: false, error: e.message || String(e), provider: 'meta' };
    }
  }

  if (provider === 'twilio') {
    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID!;
      const authToken = process.env.TWILIO_AUTH_TOKEN!;
      const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER!;
      const twilioFrom = fromNumber.startsWith('whatsapp:') ? fromNumber : `whatsapp:${fromNumber}`;
      const twilioTo = phone.startsWith('whatsapp:') ? phone : `whatsapp:${phone}`;

      const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
      const params = new URLSearchParams();
      params.append('From', twilioFrom);
      params.append('To', twilioTo);
      params.append('Body', text);

      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Twilio WhatsApp API request failed');
      }

      return {
        success: true,
        messageId: data.sid,
        provider: 'twilio',
      };
    } catch (e: any) {
      console.error('[WhatsApp] Twilio API error:', e);
      return { success: false, error: e.message || String(e), provider: 'twilio' };
    }
  }

  return { success: false, error: 'Unknown provider', provider: 'mock' };
}

/// Sends a formatted WhatsApp receipt after an autonomous execution completes.
export async function sendWhatsAppExecutionReport(toPhone: string, opts: ExecutionReportOpts): Promise<OutboundMessageResult> {
  let text = `🤖 *Rova Agent Execution Report*\n\n`;
  text += `✅ *Status*: Executed successfully (${opts.mode.toUpperCase()} mode)\n`;
  text += `💸 *Transfer*: ${opts.amount} USDC → \`${opts.recipient}\`\n`;

  if (opts.rate) {
    text += `📊 *Executed FX Rate*: ${opts.rate.toFixed(4)} ${opts.pair || 'USDC/EURC'}\n`;
  }

  if (opts.bestProvider && opts.providersChecked) {
    text += `🏷️ *Nanopayment Rate Shopping*: Selected *${opts.bestProvider}* out of ${opts.providersChecked} quotes via x402 nanopayments.\n`;
  }

  if (opts.memo) {
    text += `📝 *Memo*: ${opts.memo}\n`;
  }

  if (opts.arcScanUrl) {
    text += `\n🔗 *ArcScan Link*:\n${opts.arcScanUrl}\n`;
  } else if (opts.txHash) {
    text += `\n🔗 *Tx Hash*: \`${opts.txHash}\`\n`;
  }

  text += `\n_Powered by Rova Autonomous Agentic Economy_`;

  return sendWhatsAppMessage(toPhone, text);
}

/// Sends a formatted self-custody approval request to the user's WhatsApp.
export async function sendWhatsAppApprovalRequest(toPhone: string, opts: ApprovalAlertOpts): Promise<OutboundMessageResult> {
  let text = `⚠️ *Rova Action Required: Self-Custody Transfer Ready*\n\n`;
  text += `Your armed rule \`${opts.ruleId.slice(0, 8)}\` has met its trigger condition!\n\n`;
  text += `💸 *Transfer Amount*: ${opts.amount} USDC → \`${opts.recipient}\`\n`;
  if (opts.rate) {
    text += `📊 *Triggered Rate*: ${opts.rate.toFixed(4)}\n`;
  }
  text += `\n🔒 Since this is a self-custody wallet, Circle does not hold your keys. Tap the link below to approve and sign the transfer with your wallet:\n\n`;
  text += `👉 ${opts.approvalUrl}\n\n`;
  text += `_Rova Agent Safeguard_`;

  return sendWhatsAppMessage(toPhone, text);
}
