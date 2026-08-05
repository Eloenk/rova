import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, parseAbi } from 'viem';
import { getSupabaseClient } from '@/lib/supabase';
import { TOKENS, ARC_TESTNET } from '@/lib/config';
import fs from 'fs';
import path from 'path';
import * as yaml from 'js-yaml';

export const dynamic = 'force-dynamic';

function getRpcUrlFromConfig(): string {
  if (process.env.ARC_RPC_URL) return process.env.ARC_RPC_URL;
  try {
    const configPath = path.join(process.cwd(), 'config.yaml');
    if (fs.existsSync(configPath)) {
      const fileContents = fs.readFileSync(configPath, 'utf8');
      const parsed = yaml.load(fileContents) as any;
      if (parsed?.arc?.rpc_url) {
        return parsed.arc.rpc_url;
      }
    }
  } catch (err) {
    console.warn('[Balance API] Could not read config.yaml:', err);
  }
  return ARC_TESTNET.rpc;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let targetAddress: string | null = null;

    const cookieWallet = req.cookies.get('rova_user_wallet')?.value;
    const cookieEmail = req.cookies.get('rova_user_email')?.value;

    if (cookieWallet) {
      targetAddress = cookieWallet;
    } else if (cookieEmail) {
      const supabase = getSupabaseClient();
      if (supabase) {
        const { data: user } = await supabase
          .from('users')
          .select('circle_wallet_address')
          .eq('email', cookieEmail.toLowerCase().trim())
          .single();

        if (user?.circle_wallet_address) {
          targetAddress = user.circle_wallet_address;
        }
      }
    }

    if (!targetAddress) {
      targetAddress = searchParams.get('address');
    }

    if (!targetAddress) {
      return NextResponse.json({
        ok: true,
        address: null,
        rpcUrlUsed: getRpcUrlFromConfig(),
        usdcBalance: '0.00',
        eurcBalance: '0.00',
      });
    }

    const rpcUrl = getRpcUrlFromConfig();
    const abi = parseAbi(['function balanceOf(address) view returns (uint256)']);

    const client = createPublicClient({
      transport: http(rpcUrl, { timeout: 5000 }),
    });

    let usdcBalance = '0.00';
    let eurcBalance = '0.00';

    try {
      const usdcRaw = await client.readContract({
        address: TOKENS.USDC.address as `0x${string}`,
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
        address: TOKENS.EURC.address as `0x${string}`,
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
