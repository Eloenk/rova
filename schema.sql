CREATE TABLE IF NOT EXISTS agent_rules (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    status TEXT NOT NULL CHECK (status IN ('active', 'ready_to_execute', 'fired', 'cancelled', 'expired')),
    recipient_label TEXT NOT NULL,
    recipient_identifier TEXT NOT NULL,
    recipient_type TEXT NOT NULL CHECK (recipient_type IN ('email', 'wallet')),
    amount NUMERIC NOT NULL,
    pair TEXT NOT NULL,
    trigger_type TEXT NOT NULL CHECK (trigger_type IN ('rate_gte', 'rate_lte', 'by_date')),
    trigger_value NUMERIC NOT NULL,
    by_date TEXT,
    tolerance_bps INTEGER NOT NULL DEFAULT 10,
    custody_mode TEXT NOT NULL DEFAULT 'managed',
    source_wallet TEXT NOT NULL,
    notify_phone TEXT,
    source_channel TEXT DEFAULT 'web'
);

CREATE TABLE IF NOT EXISTS standing_intents (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    status TEXT NOT NULL CHECK (status IN ('active', 'ready_to_execute', 'cancelled')),
    intent_text TEXT NOT NULL,
    plan JSONB NOT NULL,
    trigger JSONB NOT NULL,
    custody_mode TEXT NOT NULL DEFAULT 'managed',
    source_wallet TEXT NOT NULL,
    last_run_at TIMESTAMPTZ,
    last_known_balance NUMERIC,
    run_count INTEGER NOT NULL DEFAULT 0,
    notify_phone TEXT,
    source_channel TEXT DEFAULT 'web'
);

CREATE TABLE IF NOT EXISTS agent_executions (
    id TEXT PRIMARY KEY,
    rule_id TEXT REFERENCES agent_rules(id) ON DELETE SET NULL,
    standing_intent_id TEXT REFERENCES standing_intents(id) ON DELETE SET NULL,
    fired_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    rate_at_execution NUMERIC,
    mode TEXT NOT NULL CHECK (mode IN ('mock', 'real')),
    tx_hash TEXT NOT NULL,
    arc_scan_url TEXT NOT NULL,
    fee_job_id TEXT,
    fee_amount_usdc NUMERIC NOT NULL DEFAULT 0.006,
    reputation_tx_hash TEXT,
    memo TEXT NOT NULL,
    quote_shop JSONB
);

CREATE TABLE IF NOT EXISTS rova_intents (
    intent_hash TEXT PRIMARY KEY,
    intent TEXT NOT NULL,
    plan JSONB NOT NULL,
    model TEXT NOT NULL,
    processing_ms INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    whatsapp_number TEXT UNIQUE,
    email TEXT,
    circle_wallet_address TEXT,
    savings_wallet_address TEXT,
    custodian_wallet_address TEXT,
    whatsapp_approval_threshold_usdc NUMERIC NOT NULL DEFAULT 100.00
);

CREATE TABLE IF NOT EXISTS otp_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_rules_status ON agent_rules(status);
CREATE INDEX IF NOT EXISTS idx_standing_intents_status ON standing_intents(status);
CREATE INDEX IF NOT EXISTS idx_agent_executions_fired_at ON agent_executions(fired_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_whatsapp ON users(whatsapp_number);
CREATE INDEX IF NOT EXISTS idx_otp_codes_email ON otp_codes(email);

