import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, parseAbi } from 'viem';
import { getSupabaseClient } from '@/lib/supabase';
import { TOKENS, ARC_TESTNET } from '@/lib/config';
import fs from 'fs';
import path from 'path';
import * as yaml from 'js-yaml';
import { requireSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

function getConfigValues(): { rpcUrl: string; usdcAddress: `0x${string}`; eurcAddress: `0x${string}` } {
  let rpcUrl = process.env.ARC_RPC_URL || ARC_TESTNET.rpc;
  let usdcAddress = TOKENS.USDC.address as `0x${string}`;
  let eurcAddress = TOKENS.EURC.address as `0x${string}`;

  try {
    const configPath = path.join(process.cwd(), 'config.yaml');
    if (fs.existsSync(configPath)) {
      const fileContents = fs.readFileSync(configPath, 'utf8');
      const parsed = yaml.load(fileContents) as any;
      if (parsed?.arc?.rpc_url && !process.env.ARC_RPC_URL) {
        rpcUrl = parsed.arc.rpc_url;
      }
      if (parsed?.arc?.usdc_address) {
        usdcAddress = parsed.arc.usdc_address as `0x${string}`;
      }
      if (parsed?.arc?.eurc_address) {
        eurcAddress = parsed.arc.eurc_address as `0x${string}`;
      }
    }
  } catch (err) {
    console.warn('[Balance API] Could not read config.yaml:', err);
  }

  return { rpcUrl, usdcAddress, eurcAddress };
}

export async function GET(req: NextRequest) {
  try {
    const guard = requireSession(req);
    if ('response' in guard) return guard.response;

    let targetAddress = guard.session.walletAddress || null;
    if (!targetAddress) {
      const supabase = getSupabaseClient();
      if (supabase) {
        const { data: user } = await supabase
          .from('users')
          .select('circle_wallet_address')
          .eq('email', guard.session.email)
          .single();
        targetAddress = user?.circle_wallet_address || null;
      }
    }

    const { rpcUrl, usdcAddress, eurcAddress } = getConfigValues();

    if (!targetAddress) {
      return NextResponse.json({
        ok: true,
        address: null,
        rpcUrlUsed: rpcUrl,
        usdcBalance: '0.00',
        eurcBalance: '0.00',
      });
    }

    const abi = parseAbi(['function balanceOf(address) view returns (uint256)']);

    const client = createPublicClient({
      transport: http(rpcUrl, { timeout: 5000 }),
    });

    let usdcBalance = '0.00';
    let eurcBalance = '0.00';

    try {
      const usdcRaw = await client.readContract({
        address: usdcAddress,
        abi,
        functionName: 'balanceOf',
        args: [targetAddress as `0x${string}`],
      }) as bigint;
      usdcBalance = (Number(usdcRaw) / 10 ** TOKENS.USDC.decimals).toFixed(2);
    } catch (e) {
      console.warn('[Balance API] Failed to fetch USDC balance from RPC:', rpcUrl);
    }

    try {
      const eurcRaw = await client.readContract({
        address: eurcAddress,
        abi,
        functionName: 'balanceOf',
        args: [targetAddress as `0x${string}`],
      }) as bigint;
      eurcBalance = (Number(eurcRaw) / 10 ** TOKENS.EURC.decimals).toFixed(2);
    } catch (e) {
      console.warn('[Balance API] Failed to fetch EURC balance from RPC:', rpcUrl);
    }

    return NextResponse.json({
      ok: true,
      address: targetAddress,
      rpcUrlUsed: rpcUrl,
      usdcBalance,
      eurcBalance,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      },
    });
  } catch (err: any) {
    console.error('[Balance API Error]', err);
    return NextResponse.json({
      ok: false,
      error: err?.message || 'Failed to query wallet balance',
      usdcBalance: '0.00',
      eurcBalance: '0.00',
    }, { status: 500 });
  }
}
