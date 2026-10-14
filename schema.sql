CREATE TABLE IF NOT EXISTS agent_rules (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    status TEXT NOT NULL CHECK (status IN ('active', 'ready_to_execute', 'fired', 'cancelled', 'expired')),
    owner_email TEXT NOT NULL,
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
    owner_email TEXT NOT NULL,
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
    owner_email TEXT NOT NULL,
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
    email TEXT UNIQUE,
    circle_wallet_address TEXT,
    savings_wallet_address TEXT,
    custodian_wallet_address TEXT,
    whatsapp_approval_threshold_usdc NUMERIC NOT NULL DEFAULT 100.00
);

CREATE TABLE IF NOT EXISTS otp_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    code_hash TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE otp_codes ADD COLUMN IF NOT EXISTS code_hash TEXT;
ALTER TABLE agent_rules ADD COLUMN IF NOT EXISTS owner_email TEXT;
ALTER TABLE standing_intents ADD COLUMN IF NOT EXISTS owner_email TEXT;
ALTER TABLE agent_executions ADD COLUMN IF NOT EXISTS owner_email TEXT;

UPDATE agent_rules SET owner_email = 'legacy-disabled@invalid', status = 'cancelled' WHERE owner_email IS NULL;
UPDATE standing_intents SET owner_email = 'legacy-disabled@invalid', status = 'cancelled' WHERE owner_email IS NULL;
UPDATE agent_executions SET owner_email = 'legacy-disabled@invalid' WHERE owner_email IS NULL;

ALTER TABLE agent_rules ALTER COLUMN owner_email SET NOT NULL;
ALTER TABLE standing_intents ALTER COLUMN owner_email SET NOT NULL;
ALTER TABLE agent_executions ALTER COLUMN owner_email SET NOT NULL;

CREATE TABLE IF NOT EXISTS whatsapp_link_tokens (
    email TEXT PRIMARY KEY,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_rules_status ON agent_rules(status);
CREATE INDEX IF NOT EXISTS idx_agent_rules_owner_created ON agent_rules(owner_email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_standing_intents_status ON standing_intents(status);
CREATE INDEX IF NOT EXISTS idx_standing_intents_owner_created ON standing_intents(owner_email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_executions_fired_at ON agent_executions(fired_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_executions_owner_fired ON agent_executions(owner_email, fired_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_whatsapp ON users(whatsapp_number);
CREATE INDEX IF NOT EXISTS idx_otp_codes_email ON otp_codes(email);
CREATE INDEX IF NOT EXISTS idx_otp_codes_email_hash ON otp_codes(email, code_hash);
CREATE INDEX IF NOT EXISTS idx_whatsapp_link_tokens_expires_at ON whatsapp_link_tokens(expires_at);

ALTER TABLE agent_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE standing_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rova_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_link_tokens ENABLE ROW LEVEL SECURITY;

-- ── Refresh tokens (JWT rotation) ─────────────────────────────────────────────
-- One row per user. Upserted on login, deleted on logout or on rotation.
-- Only the SHA-256 hash of the opaque token is stored — never the raw value.
CREATE TABLE IF NOT EXISTS refresh_tokens (
    email       TEXT PRIMARY KEY REFERENCES users(email) ON DELETE CASCADE,
    token_hash  TEXT NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash       ON refresh_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION consume_refresh_token(requested_token_hash TEXT)
RETURNS TABLE(email TEXT)
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
    DELETE FROM refresh_tokens
     WHERE token_hash = requested_token_hash
       AND expires_at > now()
    RETURNING refresh_tokens.email;
$$;

REVOKE ALL ON FUNCTION consume_refresh_token(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION consume_refresh_token(TEXT) TO service_role;

-- ── One-time execution plans ────────────────────────────────────────────────
-- The browser receives only the opaque id. The server reloads the exact plan
-- and atomically claims it, preventing payload tampering and replay.
CREATE TABLE IF NOT EXISTS execution_plans (
    id TEXT PRIMARY KEY,
    owner_email TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
    wallet_address TEXT NOT NULL,
    intent_hash TEXT NOT NULL,
    plan JSONB NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('planned', 'executing', 'executed', 'failed', 'expired')),
    expires_at TIMESTAMPTZ NOT NULL,
    approval_code_hash TEXT,
    approval_expires_at TIMESTAMPTZ,
    approval_attempts INTEGER NOT NULL DEFAULT 0,
    receipt JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    claimed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_execution_plans_owner_created
    ON execution_plans(owner_email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_execution_plans_status_expiry
    ON execution_plans(status, expires_at);

ALTER TABLE execution_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE execution_plans ADD COLUMN IF NOT EXISTS approval_code_hash TEXT;
ALTER TABLE execution_plans ADD COLUMN IF NOT EXISTS approval_expires_at TIMESTAMPTZ;
ALTER TABLE execution_plans ADD COLUMN IF NOT EXISTS approval_attempts INTEGER NOT NULL DEFAULT 0;
REVOKE ALL ON TABLE execution_plans FROM anon, authenticated;

DROP FUNCTION IF EXISTS claim_execution_plan(TEXT, TEXT);
DROP FUNCTION IF EXISTS claim_execution_plan(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS claim_execution_plan(TEXT, TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION claim_execution_plan(
    requested_id TEXT,
    requested_owner_email TEXT,
    requested_wallet_address TEXT,
    requested_approval_hash TEXT
)
RETURNS SETOF execution_plans
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    candidate execution_plans%ROWTYPE;
BEGIN
    UPDATE execution_plans
       SET approval_attempts = approval_attempts + 1
     WHERE id = requested_id
       AND owner_email = lower(trim(requested_owner_email))
       AND lower(wallet_address) = lower(trim(requested_wallet_address))
       AND status = 'planned'
       AND expires_at > now()
       AND approval_expires_at > now()
       AND approval_attempts < 5
    RETURNING * INTO candidate;

    IF NOT FOUND OR candidate.approval_code_hash IS NULL
       OR candidate.approval_code_hash <> requested_approval_hash THEN
        RETURN;
    END IF;

    UPDATE execution_plans
       SET status = 'executing',
           claimed_at = now(),
           approval_code_hash = NULL,
           approval_expires_at = NULL
     WHERE id = requested_id
       AND status = 'planned'
    RETURNING * INTO candidate;

    IF FOUND THEN
        RETURN NEXT candidate;
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION claim_execution_plan(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION claim_execution_plan(TEXT, TEXT, TEXT, TEXT) TO service_role;
