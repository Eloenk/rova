import { NextRequest, NextResponse } from 'next/server';

interface FeedbackPayload {
  category: string;
  rating: number;
  message: string;
  email?: string | null;
  walletAddress?: string | null;
  page?: string;
  timestamp: string;
}

// ── Discord webhook formatter ─────────────────────────────────────────────────
function buildDiscordEmbed(f: FeedbackPayload) {
  const stars = f.rating > 0
    ? '⭐'.repeat(f.rating) + '☆'.repeat(5 - f.rating)
    : '_Not rated_';

  const categoryEmoji: Record<string, string> = {
    bug:     '🐛',
    feature: '💡',
    ux:      '🎨',
    praise:  '🌟',
    other:   '💬',
  };

  const emoji = categoryEmoji[f.category] || '💬';
  const color = f.category === 'bug' ? 0xef4444
    : f.category === 'praise' ? 0x14f195
    : f.category === 'feature' ? 0x60a5fa
    : 0x9333ea;

  return {
    embeds: [{
      title: `${emoji} Rova Feedback — ${f.category.toUpperCase()}`,
      color,
      description: `> ${f.message}`,
      fields: [
        { name: '⭐ Rating',         value: stars,                          inline: true  },
        { name: '📂 Category',       value: f.category,                     inline: true  },
        { name: '📄 Page',           value: f.page || '/',                  inline: true  },
        { name: '🔗 Wallet',         value: f.walletAddress ? `\`${f.walletAddress.slice(0,10)}...\`` : '_Not connected_', inline: true },
        { name: '📧 Email',          value: f.email || '_Not provided_',    inline: true  },
        { name: '🕐 Timestamp',      value: new Date(f.timestamp).toUTCString(), inline: false },
      ],
      footer: { text: 'Rova Agent Feedback System' },
    }],
  };
}

// ── Main handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  let body: FeedbackPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const { category, message, timestamp } = body;

  // Validate required fields
  if (!message?.trim()) {
    return NextResponse.json({ ok: false, error: 'Message is required' }, { status: 400 });
  }
  if (!category) {
    return NextResponse.json({ ok: false, error: 'Category is required' }, { status: 400 });
  }

  // Always log to Vercel function logs (visible in Vercel dashboard → Functions)
  console.log('[Rova Feedback]', JSON.stringify({
    ...body,
    message: body.message.slice(0, 200), // truncate for log readability
    receivedAt: new Date().toISOString(),
  }, null, 2));

  // Optionally forward to Discord
  const webhookUrl = process.env.DISCORD_FEEDBACK_WEBHOOK_URL;
  let discordSent = false;

  if (webhookUrl) {
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildDiscordEmbed(body)),
      });
      if (res.ok) {
        discordSent = true;
        console.log('[Rova Feedback] Forwarded to Discord successfully');
      } else {
        console.error('[Rova Feedback] Discord webhook failed:', res.status, await res.text());
      }
    } catch (err) {
      console.error('[Rova Feedback] Discord webhook error:', err);
    }
  }

  return NextResponse.json({
    ok: true,
    discordSent,
    message: 'Feedback received. Thank you!',
  });
}

// Reject non-POST requests gracefully
export async function GET() {
  return NextResponse.json(
    { ok: false, error: 'Use POST /api/feedback' },
    { status: 405 }
  );
}
