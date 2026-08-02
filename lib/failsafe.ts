import type { FlowPlan } from './types';

/**
 * Enhanced Deterministic Architect for common intents.
 * Handles natural language variations to ensure 0ms latency for standard flows.
 */
export function getFailsafePlan(intent: string): FlowPlan | null {
  const text = intent.toLowerCase().trim();

  // 0. GREETINGS & INTRODUCTIONS (Fast-Path 0ms guaranteed)
  const isGreeting = ['hi', 'hello', 'hey', 'who are you', 'what is rova', 'what can you do', 'help'].includes(text) || text.startsWith('hi ') || text.startsWith('hello ') || text.startsWith('hey ');
  if (isGreeting) {
    return {
      totalAmount: 0,
      splits: [{
        recipient: "Rova Assistant",
        address: "0x0000000000000000000000000000000000000000",
        amount: 0,
        currency: "USDC",
        country: "US",
        fxRate: 1.0,
        fxSymbol: "$",
        arcProtocol: "Arc Native"
      }],
      routes: [{
        from: "Rova Agent",
        to: "User Interface",
        via: "Arc AI Engine",
        fee: 0,
        cctpDomain: null,
        bridgeType: "native"
      }],
      gasEstimate: { totalTxCount: 1, totalGasUsdc: 0.006 },
      reasoning: "Hello! I am Rova, your autonomous AI financial agent built on Arc Testnet. I can execute instant USDC/EURC transfers, StableFX swaps, yield staking, or set up 24/7 automated rules. How can I assist you today?",
      confidence: 100,
      risk: "low",
      strategy: "Hello! I am Rova, your autonomous AI financial agent on Arc Testnet.",
      reserveAmount: 0
    };
  }

  // 0B. BALANCE QUERY (Fast-Path 0ms guaranteed)
  const isBalance = text.includes('balance') || text.includes('wallet') || text.includes('how much') || text.includes('my funds');
  if (isBalance) {
    return {
      totalAmount: 0,
      splits: [{
        recipient: "User Wallet",
        address: "Circle Managed Wallet",
        amount: 0,
        currency: "USDC",
        country: "US",
        fxRate: 1.0,
        fxSymbol: "$",
        arcProtocol: "Arc Native"
      }],
      routes: [{
        from: "Arc RPC Node",
        to: "User Dashboard",
        via: "Circle Developer-Controlled Wallet API",
        fee: 0,
        cctpDomain: null,
        bridgeType: "native"
      }],
      gasEstimate: { totalTxCount: 0, totalGasUsdc: 0 },
      reasoning: "Your wallet balances on Arc Testnet (USDC / EURC) are displayed in real-time in the top balance bar and portfolio drawer.",
      confidence: 100,
      risk: "low",
      strategy: "Balance Query (Arc RPC)",
      reserveAmount: 0
    };
  }

  // 0C. SYSTEM STATUS & ACTIVE RULES (Fast-Path 0ms guaranteed)
  const isStatus = text.includes('status') || text.includes('rule') || text.includes('rules') || text.includes('watcher') || text.includes('daemon');
  if (isStatus) {
    return {
      totalAmount: 0,
      splits: [{
        recipient: "Autonomous Daemon",
        address: "0x0000000000000000000000000000000000000000",
        amount: 0,
        currency: "USDC",
        country: "US",
        fxRate: 1.0,
        fxSymbol: "$",
        arcProtocol: "Rova Go Engine"
      }],
      routes: [{
        from: "Rova Daemon Engine",
        to: "Arc Chain State",
        via: "24/7 Standing Rule Monitor",
        fee: 0,
        cctpDomain: null,
        bridgeType: "native"
      }],
      gasEstimate: { totalTxCount: 0, totalGasUsdc: 0 },
      reasoning: "Rova 24/7 background execution daemon is ACTIVE on Arc Testnet (Chain ID 5042002). All armed rate rules are monitored continuously.",
      confidence: 100,
      risk: "low",
      strategy: "Daemon System Status",
      reserveAmount: 0
    };
  }

  // Extract common components using simple global regex
  const amountMatch = text.match(/([\d.]+)/);
  const addrMatch = text.match(/(0x[a-f0-9]{40})/i);
  
  const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;
  const address = addrMatch ? addrMatch[1] : "0x0000000000000000000000000000000000000000";
  const isEurc = text.includes('eurc') || text.includes('euro');
  const currency: 'USDC' | 'EURC' = isEurc ? 'EURC' : 'USDC';

  // Complexity Detection: If prompt contains multiple intents or addresses, yield to full AI
  const intents = ['swap', 'exchange', 'convert', 'bridge', 'move', 'cctp', 'send', 'pay'];
  const intentCount = intents.filter(i => text.includes(i)).length;
  const addressCount = (text.match(/0x[a-f0-9]{40}/gi) || []).length;
  const connectors = [' and ', ' then ', ' also ', ' plus '];
  const hasConnectors = connectors.some(c => text.includes(c));

  if (intentCount > 1 || addressCount > 1 || hasConnectors) {
    console.log('[Failsafe] Complexity detected. Yielding to AI Orchestrator.');
    return null;
  }

  // OUT-OF-SCOPE / UNRELATED NON-FINANCIAL PROMPTS (No amount & no financial keywords)
  const financialKeywords = ['send', 'pay', 'transfer', 'swap', 'convert', 'exchange', 'bridge', 'cctp', 'move', 'stake', 'yield', 'usyc', 'rule', 'rules', 'automate', 'recurring', 'job', 'hire', 'balance', 'wallet', 'status', 'watcher', 'daemon', 'check'];
  const hasFinancialKeyword = financialKeywords.some(k => text.includes(k));

  if (amount <= 0 && !hasFinancialKeyword) {
    return {
      totalAmount: 0,
      splits: [{
        recipient: "Rova Assistant",
        address: "0x0000000000000000000000000000000000000000",
        amount: 0,
        currency: "USDC",
        country: "US",
        fxRate: 1.0,
        fxSymbol: "$",
        arcProtocol: "Arc Native"
      }],
      routes: [{
        from: "Rova Agent",
        to: "User Interface",
        via: "Arc AI Engine",
        fee: 0,
        cctpDomain: null,
        bridgeType: "native"
      }],
      gasEstimate: { totalTxCount: 1, totalGasUsdc: 0.006 },
      reasoning: "I am Rova, an autonomous AI financial agent dedicated exclusively to financial operations on Arc Testnet. Please use me for sending payments, currency swaps (USDC/EURC), CCTP cross-chain bridging, treasury yield, or setting up 24/7 automation rules.",
      confidence: 100,
      risk: "low",
      strategy: "I am Rova, an autonomous AI financial agent dedicated exclusively to financial operations on Arc Testnet.",
      reserveAmount: 0
    };
  }

  // We only run failsafe for standard transactions if an amount is specified
  if (amount <= 0) return null;

  // 1. SWAP INTENT
  if (text.includes('swap') || text.includes('exchange') || text.includes('convert')) {
    const isEurcOut = text.includes('to eurc') || text.includes('for eurc');
    const outCurrency = isEurcOut ? "EURC" : "USDC";
    
    return {
      totalAmount: amount,
      splits: [{
        recipient: address === "0x0000000000000000000000000000000000000000" ? "Self (Swap)" : "Recipient Wallet",
        address: address,
        amount: amount,
        currency: outCurrency,
        country: outCurrency === 'EURC' ? "EU" : "US",
        fxRate: outCurrency === 'EURC' ? 0.92 : 1.0,
        fxSymbol: outCurrency === 'EURC' ? '€' : '$',
        arcProtocol: "Arc StableFX"
      }],
      routes: [{
        from: "Local Balance",
        to: "Target Currency",
        via: "Arc StableFX",
        fee: 0.1,
        cctpDomain: null,
        bridgeType: "native"
      }],
      gasEstimate: { totalTxCount: 1, totalGasUsdc: 0.008 },
      reasoning: "Optimal currency swap mapped to Arc StableFX liquidity pools for minimum slippage.",
      confidence: 100,
      risk: "low",
      strategy: "StableFX Swap",
      reserveAmount: 0
    };
  }

  // 2. BRIDGE INTENT
  if (text.includes('bridge') || text.includes('move') || text.includes('cctp')) {
      return {
        totalAmount: amount,
        splits: [{
          recipient: "Cross-chain Vault",
          address: address,
          amount: amount,
          currency: currency,
          country: currency === 'EURC' ? "EU" : "US",
          fxRate: 1.0,
          fxSymbol: currency === 'EURC' ? '€' : '$',
          arcProtocol: "CCTP V2"
        }],
        routes: [{
          from: "Arc",
          to: "Multi-chain Route",
          via: "Circle CCTP",
          fee: 0,
          cctpDomain: 26,
          bridgeType: "cctp"
        }],
        gasEstimate: { totalTxCount: 2, totalGasUsdc: 0.012 },
        reasoning: "Secure cross-chain liquidity flow via Circle CCTP. Arc Domain 26 serves as the origination point for this high-integrity institutional route.",
        confidence: 100,
        risk: "low",
        strategy: "CCTP Secure Bridging",
        reserveAmount: 0
      };
  }

  // 3. TRANSFER INTENT (Fallback for 'send', 'pay', 'route', or generic statements)
  return {
      totalAmount: amount,
      splits: [{
        recipient: address === "0x0000000000000000000000000000000000000000" ? "Specified Recipient" : "Recipient Wallet",
        address: address,
        amount: amount,
        currency: currency,
        country: currency === 'EURC' ? "EU" : "US",
        fxRate: 1.0,
        fxSymbol: currency === 'EURC' ? '€' : '$',
        arcProtocol: "Arc Native"
      }],
      routes: [{
        from: "User Wallet",
        to: "Recipient",
        via: "Arc Native",
        fee: 0,
        cctpDomain: null,
        bridgeType: "native"
      }],
      gasEstimate: { totalTxCount: 1, totalGasUsdc: 0.006 },
      reasoning: `High-speed ${currency} flow detected. Utilizing Arc's native sub-second finality to settlement the intent instantly with minimal gas overhead.`,
      confidence: 100,
      risk: "low",
      strategy: "Arc Native Fast-Path",
      reserveAmount: 0
  };
}
