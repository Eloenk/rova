#!/usr/bin/env tsx

import { ethers } from 'ethers';
import { ARC_NETWORK, ERC8004, arcScan } from '../lib/config';
import {
  operationalFlag,
  readOperationalVariable,
  requireOperationalVariable,
} from '../tools/runtimeConfig';

const REGISTRY_ABI = [
  'function register(string agentURI) returns (uint256 agentId)',
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
];

async function main() {
  if (!operationalFlag('ROVA_ALLOW_AGENT_REGISTRATION')) {
    throw new Error('Agent registration is disabled. Set ROVA_ALLOW_AGENT_REGISTRATION=true only for the approved registration window.');
  }

  const expectedConfirmation = `REGISTER_AGENT:${ARC_NETWORK.chainId}`;
  if (readOperationalVariable('ROVA_AGENT_REGISTRATION_CONFIRMATION') !== expectedConfirmation) {
    throw new Error(`Set ROVA_AGENT_REGISTRATION_CONFIRMATION=${expectedConfirmation} to authorize this exact registration`);
  }

  const metadataUri = requireOperationalVariable('ROVA_METADATA_URI');
  if (!/^ipfs:\/\/|^https:\/\//i.test(metadataUri)) {
    throw new Error('ROVA_METADATA_URI must use ipfs:// or https://');
  }

  const rawKey = requireOperationalVariable('ROVA_DEPLOYER_PRIVATE_KEY');
  const privateKey = rawKey.startsWith('0x') ? rawKey : `0x${rawKey}`;
  if (!/^0x[0-9a-fA-F]{64}$/.test(privateKey)) {
    throw new Error('ROVA_DEPLOYER_PRIVATE_KEY must be a 32-byte hexadecimal private key');
  }

  const rpcUrl = readOperationalVariable('ARC_RPC_URL') || ARC_NETWORK.rpc;
  const provider = new ethers.JsonRpcProvider(rpcUrl, undefined, { staticNetwork: true });
  const network = await provider.getNetwork();
  if (network.chainId !== BigInt(ARC_NETWORK.chainId)) {
    throw new Error(`RPC is chain ${network.chainId}; expected Arc mainnet ${ARC_NETWORK.chainId}`);
  }

  const wallet = new ethers.Wallet(privateKey, provider);
  const registry = new ethers.Contract(ERC8004.IdentityRegistry, REGISTRY_ABI, wallet);

  console.log(`Registering Rova ERC-8004 identity from ${wallet.address} on Arc mainnet...`);
  const transaction = await registry.register(metadataUri);
  console.log(`Transaction: ${arcScan.tx(transaction.hash)}`);

  const receipt = await transaction.wait();
  if (!receipt || receipt.status !== 1) {
    throw new Error('Agent registration transaction did not succeed');
  }

  const registryInterface = new ethers.Interface(REGISTRY_ABI);
  const transfer = receipt.logs
    .filter((log: ethers.Log | ethers.EventLog) => log.address.toLowerCase() === ERC8004.IdentityRegistry.toLowerCase())
    .map((log: ethers.Log | ethers.EventLog) => {
      try {
        return registryInterface.parseLog({ topics: [...log.topics], data: log.data });
      } catch {
        return null;
      }
    })
    .find((log: ethers.LogDescription | null) => log?.name === 'Transfer' && String(log.args.to).toLowerCase() === wallet.address.toLowerCase());

  if (!transfer) {
    throw new Error('Registration succeeded but the identity token ID could not be reconciled from the receipt');
  }

  const agentId = transfer.args.tokenId.toString();
  console.log(`NEXT_PUBLIC_ROVA_AGENT_ID=${agentId}`);
  console.log(`Agent identity: ${arcScan.nft(agentId)}`);
}

main().catch(error => {
  console.error(`Agent registration failed: ${error instanceof Error ? error.message : 'unknown error'}`);
  process.exit(1);
});
