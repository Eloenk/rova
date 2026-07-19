import 'dotenv/config';
import { initiateDeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets';

async function main() {
  const apiKey = process.env.CIRCLE_API_KEY;
  const entitySecret = process.env.CIRCLE_ENTITY_SECRET;

  if (!apiKey || !entitySecret) {
    console.error('CIRCLE_API_KEY and CIRCLE_ENTITY_SECRET are missing in .env');
    return;
  }

  const client = initiateDeveloperControlledWalletsClient({ apiKey, entitySecret });
  const resp = await client.listWallets({ blockchain: 'ARC-TESTNET' });
  
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║  Rova — Wallet Retrieval                     ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');
  
  const wallets = resp.data?.wallets || [];
  if (wallets.length === 0) {
    console.log('No wallets found on Arc Testnet.');
    return;
  }

  wallets.forEach((w, i) => {
    console.log(`[${i+1}] Account:  ${w.address}`);
    console.log(`    Role:     ${i === 0 ? 'OWNER' : 'VALIDATOR'}`);
    console.log(`    ID:       ${w.id}`);
    console.log('─'.repeat(53));
  });
}

main().catch(e => console.error(e.message));
