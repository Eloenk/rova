# Rova Arc Mainnet Deployment Guide

This guide covers the owner-controlled Arc Microgrants release. It authorizes only the public application, the engine with all money-moving gates disabled, and the non-custodial `RovaExecutionLog` contract.

## Prerequisites

- Node.js 22 and npm;
- an owner-controlled Supabase project with the complete `schema.sql` applied;
- owner-controlled Circle, email, AI, Vercel, and engine-hosting resources required by the demonstrated paths;
- a dedicated mainnet deployer funded only for the approved log-contract operation;
- the exact reviewed web and Go commits.

## Configure the host

Use encrypted hosting environment variables and follow `.env.example` plus `docs/CONFIGURATION_AND_SECRET_HANDLING.md`. Never upload or reuse another person's `.env` file.

Required public network values:

```text
NEXT_PUBLIC_ARC_CHAIN=Arc
NEXT_PUBLIC_ARC_RPC_URL=https://rpc.mainnet.arc.io
ARC_RPC_URL=https://rpc.mainnet.arc.io
```

Required execution posture:

```text
ROVA_EXECUTION_ENABLED=false
ROVA_WHATSAPP_EXECUTION_ENABLED=false
ROVA_AUTONOMOUS_EXECUTION_ENABLED=false
ROVA_ALLOW_MEMORY_OTP=false
```

Do not add deployment private keys to the web or engine environment.

## Validate and release

1. Run the clean-checkout commands in `docs/HACKATHON_SUBMISSION_RUNBOOK.md`.
2. Deploy the merged web and Go commits from projects controlled by the owner.
3. Run `docs/MAINNET_ACCEPTANCE_MATRIX.md` before enabling public access.
4. Deploy only `RovaExecutionLog` using `DEPLOY_CONTRACT.md` and configure its verified public address.
5. Rebuild/redeploy the web app after adding the public contract address.
6. Let the owner complete WhatsApp linking on their own account with execution disabled.
7. Verify every app, repository, demo, profile, contract, and explorer link while signed out.

The hosted release must remain fail-closed for transfers, swaps, bridges, yield, staking, savings custody, and autonomous execution.
