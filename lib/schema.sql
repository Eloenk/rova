-- SQL Schema to initialize Supabase for Rova Agent

-- 1. Rules table
CREATE TABLE IF NOT EXISTS rova_rules (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    status TEXT NOT NULL CHECK (status IN ('active', 'fired', 'cancelled', 'expired')),
    recipient_label TEXT NOT NULL,
    recipient_address TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    pair TEXT NOT NULL,
    trigger_type TEXT NOT NULL CHECK (trigger_type IN ('rate_gte', 'rate_lte', 'by_date')),
    trigger_value NUMERIC NOT NULL,
    by_date TEXT,
    tolerance_bps INTEGER NOT NULL DEFAULT 10
);

-- 2. Executions table
CREATE TABLE IF NOT EXISTS rova_executions (
    id TEXT PRIMARY KEY,
    rule_id TEXT NOT NULL REFERENCES rova_rules(id) ON DELETE CASCADE,
    fired_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    rate_at_execution NUMERIC NOT NULL,
    mode TEXT NOT NULL CHECK (mode IN ('mock', 'real')),
    tx_hash TEXT NOT NULL,
    arc_scan_url TEXT NOT NULL,
    fee_job_id TEXT,
    fee_amount_usdc NUMERIC NOT NULL DEFAULT 0.05,
    reputation_tx_hash TEXT,
    memo TEXT NOT NULL
);

-- 3. AI Intents table
CREATE TABLE IF NOT EXISTS rova_intents (
    intent_hash TEXT PRIMARY KEY,
    intent TEXT NOT NULL,
    plan JSONB NOT NULL,
    model TEXT NOT NULL,
    processing_ms INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
