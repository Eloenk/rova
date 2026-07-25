import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import solc from 'solc';

// Load environment variables from .env.local and .env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

const RPC_ENDPOINTS = [
  process.env.ARC_RPC_URL,
  "https://5042002.rpc.thirdweb.com",
  "https://rpc.testnet.arc.network",
  "https://testnet.arc.network/rpc"
].filter(Boolean) as string[];

function compileContract() {
  console.log("🔨 Compiling RovaExecutionLog.sol using solc...");
  const contractPath = path.resolve(process.cwd(), 'deploy/contracts/RovaExecutionLog.sol');
  const source = fs.readFileSync(contractPath, 'utf8');

  const input = {
    language: 'Solidity',
    sources: {
      'RovaExecutionLog.sol': { content: source }
    },
    settings: {
      optimizer: { enabled: true, runs: 200 },
      outputSelection: {
        '*': {
          '*': ['abi', 'evm.bytecode']
        }
      }
    }
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));

  if (output.errors) {
    const fatal = output.errors.filter((e: any) => e.severity === 'error');
    if (fatal.length > 0) {
      console.error("❌ Solidity Compilation Errors:", fatal);
      process.exit(1);
    }
  }

  const contractObj = output.contracts['RovaExecutionLog.sol']['RovaExecutionLog'];
  const abi = contractObj.abi;
  const bytecode = contractObj.evm.bytecode.object;

  console.log("✅ Compilation successful!");
  return { abi, bytecode };
}

async function getProviderWithFallback() {
  for (const url of RPC_ENDPOINTS) {
    try {
      console.log(`🌐 Trying Arc RPC endpoint: ${url}...`);
      const provider = new ethers.JsonRpcProvider(url, undefined, { staticNetwork: true });
      const balance = await provider.getBalance("0x0000000000000000000000000000000000000000");
      console.log(`✅ Connected successfully to RPC endpoint: ${url}`);
      return { provider, url };
    } catch (err: any) {
      console.warn(`⚠️ Endpoint ${url} busy or rate limited: ${err.message}. Trying next...`);
    }
  }
  throw new Error("All Arc RPC endpoints are currently busy/rate-limited");
}

async function main() {
  const rawKey = process.env.PRIVATE_KEY || process.env.ROVA_AGENT_PRIVATE_KEY || "0x8c19a26e23643800dc538dc6343c28a79be73fb07536184a9b48f542a07febb6";
  const cleanKey = rawKey.startsWith('0x') ? rawKey : `0x${rawKey}`;

  const { abi, bytecode } = compileContract();

  const { provider, url } = await getProviderWithFallback();
  const wallet = new ethers.Wallet(cleanKey, provider);

  console.log(`🔑 Deployer Wallet Address: ${wallet.address}`);
  const balance = await provider.getBalance(wallet.address);
  console.log(`💰 Wallet Balance: ${ethers.formatEther(balance)} USDC/ARC`);

  console.log(`🚀 Deploying RovaExecutionLog contract...`);

  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  
  let contract;
  let attempts = 0;
  while (attempts < 3) {
    try {
      attempts++;
      contract = await factory.deploy();
      break;
    } catch (err: any) {
      console.warn(`⚠️ Deployment attempt ${attempts} failed (${err.message}). Retrying in 2 seconds...`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  if (!contract) {
    throw new Error("Deployment failed after max retries");
  }

  console.log(`⏳ Tx Hash: ${contract.deploymentTransaction()?.hash}`);
  console.log("⏳ Waiting for block confirmation on Arc Testnet...");

  await contract.waitForDeployment();
  const deployedAddress = await contract.getAddress();

  console.log("\n====================================================");
  console.log(`🎉 SUCCESS! RovaExecutionLog deployed to: ${deployedAddress}`);
  console.log("====================================================\n");
  console.log("Add this address to your environment files:");
  console.log(`NEXT_PUBLIC_ROVA_EXECUTION_LOG_ADDRESS=${deployedAddress}`);
}

main().catch((err) => {
  console.error("❌ Deployment failed:", err);
  process.exit(1);
});
