// ─────────────────────────────────────────────────────────────────────────────
// Rova — Core Types
// ─────────────────────────────────────────────────────────────────────────────

// What Circle's Bridge Kit expects for chain identifiers
export type CircleChain =
  | 'Arc_Testnet'
  | 'Ethereum_Sepolia'
  | 'Avalanche_Fuji'
  | 'Base_Sepolia'
  | 'Arbitrum_Sepolia'
  | 'Optimism_Sepolia'
  | 'Polygon_Amoy';

// Circle's CCTP bridge type
export type BridgeType = 'cctp' | 'gateway' | 'native' | 'stablefx' | 'yield' | 'staking';

export interface JobMetadata {
  provider:    string;          // Agent/Provider address
  evaluator:   string;          // Evaluator address (defaults to user)
  description: string;          // Work scope
  expiryDays:  number;          // Duration until timeout
}

// A single capital allocation target
export interface FlowSplit {
  recipient:   string;          // Human-readable name
  address:     string;          // Arc wallet/contract address
  amount:      number;          // USDC amount
  currency:    'USDC' | 'EURC' | 'USYC';
  country:     string;          // ISO 3166-1 (e.g. "US")
  fxRate:      number;          // vs USD (USD=1.0, EUR≈1.09)
  fxSymbol:    string;          // "$", "€"
  arcProtocol: string;          // "Arc Native", "CCTP", "Gateway", "StableFX", "ERC-8183 Job"
  jobMetadata?: JobMetadata;    // Only present if protocol is ERC-8183 Job
}

// A routing path between chains/protocols
export interface FlowRoute {
  from:        string;
  to:          string;
  via:         string;          // "CCTP V2", "Circle Gateway", "Arc Native"
  fee:         number;          // Basis points
  cctpDomain:  number | null;   // 26 for Arc
  bridgeType:  BridgeType | null;
}

// Arc gas estimate
export interface GasEstimate {
  totalTxCount: number;
  totalGasUsdc: number;         // txCount × 0.006
}

// Full AI-generated execution plan
export interface FlowPlan {
  splits:        FlowSplit[];
  routes:        FlowRoute[];
  gasEstimate:   GasEstimate;
  reasoning:     string;        // 3-4 sentences citing Arc advantages
  confidence:    number;        // 0-100
  risk:          'low' | 'medium' | 'high';
  reserveAmount: number;
  totalAmount:   number;
  strategy:      string;        // One-line summary
}

// API request/response
export interface IntentRequest { intent: string; }

export interface ApiSuccess {
  ok:   true;
  plan: FlowPlan;
  meta: {
    model:        string;
    processingMs: number;
    intentHash:   string;
    arcChainId:   number;
  };
}

export interface ApiError {
  ok:    false;
  error: { code: string; message: string; detail?: string };
}

export type ApiResponse = ApiSuccess | ApiError;

// Flow execution result
export interface ExecutionResult {
  txHashes:     string[];
  arcScanLinks: string[];
  gasUsed:      number;
  confirmedAt:  string;
  jobId?:       string;         // Present if an ERC-8183 job was created
}

// ERC-8183 Job State
export type JobStatus = 'Open' | 'Funded' | 'Submitted' | 'Completed' | 'Rejected' | 'Expired';

export interface FlowJob {
  id:              string;         // Onchain Job ID
  client:          string;
  provider:        string;
  evaluator:       string;
  amount:          number;
  currency:        'USDC' | 'EURC' | 'USYC';
  description:     string;
  status:          JobStatus;
  createdAt:       string;
  expiresAt:       string;
  txHash:          string;
  deliverableHash?: string;
}

// Persisted history entry
export type FlowEntryStatus = 'planned' | 'executed' | 'failed' | 'job_created';

export interface FlowEntry {
  id:              string;
  intent:          string;
  plan:            FlowPlan;
  status:          FlowEntryStatus;
  executionResult: ExecutionResult | null;
  reputation?:     { score: number; txHash: string; arcScanUrl: string };
  createdAt:       string;
  executedAt?:     string;
  totalAmount:     number;
  risk:            'low' | 'medium' | 'high';
  processingMs:    number | null;
  jobId?:          string;
  memo?:           string;
}
