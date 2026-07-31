import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import solc from 'solc';
import yaml from 'js-yaml';

// Load environment variables from .env.local and .env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

// Read config.yaml for primary RPC
let configYamlRpc = 'https://arc-testnet.drpc.org';
try {
  const yamlPath = path.resolve(process.cwd(), 'config.yaml');
  if (fs.existsSync(yamlPath)) {
    const yamlContent = fs.readFileSync(yamlPath, 'utf8');
    const parsed: any = yaml.load(yamlContent);
    if (parsed?.arc?.rpc_url) {
      configYamlRpc = parsed.arc.rpc_url;
    }
  }
} catch (e) {
  console.warn("⚠️ Could not parse config.yaml, using fallback RPC");
}

const RPC_ENDPOINTS = [
  configYamlRpc,
  process.env.ARC_RPC_URL,
  "https://arc-testnet.drpc.org",
  "https://5042002.rpc.thirdweb.com",
  "https://rpc.testnet.arc.network",
  "https://testnet.arc.network/rpc"
].filter(Boolean) as string[];

function compileContract(contractFileName: string, contractName: string) {
  console.log(`🔨 Compiling ${contractFileName} using solc...`);
  
  let contractPath = path.resolve(process.cwd(), 'contracts', contractFileName);
  if (!fs.existsSync(contractPath)) {
    contractPath = path.resolve(process.cwd(), 'deploy/contracts', contractFileName);
  }

  if (!fs.existsSync(contractPath)) {
    throw new Error(`Contract file not found at: ${contractPath}`);
  }

  const source = fs.readFileSync(contractPath, 'utf8');

  const input = {
    language: 'Solidity',
    sources: {
      [contractFileName]: { content: source }
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

  const contractObj = output.contracts[contractFileName][contractName];
  if (!contractObj) {
    throw new Error(`Contract ${contractName} not found in compiled output of ${contractFileName}`);
  }

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
      await provider.getBalance("0x0000000000000000000000000000000000000000");
      console.log(`✅ Connected successfully to RPC endpoint: ${url}`);
      return { provider, url };
    } catch (err: any) {
      console.warn(`⚠️ Endpoint ${url} busy or rate limited: ${err.message}. Trying next...`);
    }
  }
  throw new Error("All Arc RPC endpoints are currently busy/rate-limited");
}

async function main() {
  const targetFile = process.argv[2] || 'RovaSavingsVault.sol';
  const targetContract = process.argv[3] || (targetFile.includes('ExecutionLog') ? 'RovaExecutionLog' : 'RovaSavingsVault');

  console.log(`\n====================================================`);
  console.log(`🚀 Preparing Deployment for: ${targetContract} (${targetFile})`);
  console.log(`====================================================\n`);

  const rawKey = process.env.PRIVATE_KEY || process.env.ROVA_AGENT_PRIVATE_KEY || "0x8c19a26e23643800dc538dc6343c28a79be73fb07536184a9b48f542a07febb6";
  const cleanKey = rawKey.startsWith('0x') ? rawKey : `0x${rawKey}`;

  const { abi, bytecode } = compileContract(targetFile, targetContract);
  const { provider, url } = await getProviderWithFallback();
  const wallet = new ethers.Wallet(cleanKey, provider);

  console.log(`🔑 Deployer Wallet Address: ${wallet.address}`);
  const balance = await provider.getBalance(wallet.address);
  console.log(`💰 Wallet Balance: ${ethers.formatEther(balance)} USDC/ARC`);

  console.log(`🚀 Deploying ${targetContract} contract to Arc...`);

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
  console.log(`🎉 SUCCESS! ${targetContract} deployed to: ${deployedAddress}`);
  console.log("====================================================\n");
  console.log("Add this address to your environment files:");
  if (targetContract === 'RovaSavingsVault') {
    console.log(`NEXT_PUBLIC_ROVA_SAVINGS_VAULT_ADDRESS=${deployedAddress}`);
    console.log(`ROVA_SAVINGS_VAULT_ADDRESS=${deployedAddress}`);
  } else {
    console.log(`NEXT_PUBLIC_ROVA_EXECUTION_LOG_ADDRESS=${deployedAddress}`);
  }
}

main().catch((err) => {
  console.error("❌ Deployment failed:", err);
  process.exit(1);
});
