// ─────────────────────────────────────────────────────────────────────────────
// Rova — Core Types
// ─────────────────────────────────────────────────────────────────────────────

// What Circle's Bridge Kit expects for chain identifiers
export type CircleChain =
  | 'Arc'
  | 'Ethereum'
  | 'Avalanche'
  | 'Base'
  | 'Arbitrum'
  | 'Optimism'
  | 'Polygon';

// Circle's CCTP bridge type
export type BridgeType = 'cctp' | 'gateway' | 'native' | 'stablefx';

// A single capital allocation target
export interface FlowSplit {
  recipient:   string;          // Human-readable name
  address:     string;          // Arc wallet/contract address
  amount:      number;          // USDC amount
  currency:    'USDC' | 'EURC';
  country:     string;          // ISO 3166-1 (e.g. "US")
  fxRate:      number;          // vs USD (USD=1.0, EUR≈1.09)
  fxSymbol:    string;          // "$", "€"
  arcProtocol: string;          // "Arc Native", "CCTP V2", "Circle Gateway", "Arc StableFX"
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
    executable:   boolean;
    executionPlanId?: string;
    expiresAt?:   string;
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
}

// Persisted history entry
export type FlowEntryStatus = 'planned' | 'executed' | 'failed';

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
  memo?:           string;
}
