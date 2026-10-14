# Rova Testnet Deployment Guide

This guide deploys the web application only. It does not authorize contract deployment, mainnet use, autonomous execution, or custody.

## Prerequisites

- Node.js 22 and npm
- a dedicated non-production Supabase project with the complete `schema.sql` applied
- a Circle developer-controlled-wallet test environment
- a supported AI provider and Resend account if those flows will be demonstrated
- a hosting project connected to the reviewed repository and release commit

## Configure the host

Use the hosting platform's encrypted environment-variable dashboard. Follow `.env.example` and `docs/CONFIGURATION_AND_SECRET_HANDLING.md`; never upload a local `.env` file or place secrets in source code.

Set all custody gates to disabled for the baseline deployment:

```text
ROVA_EXECUTION_ENABLED=false
ROVA_ALLOW_MEMORY_OTP=false
```

Do not add deployment private keys to the web application environment. Public contract addresses remain blank until a separately approved deployment is verified.

## Validate before deployment

```text
npm ci --ignore-scripts
npm run lint
npm run typecheck
npm test
npm run build
npm audit --omit=dev
```

Record the exact commit and validation result. A successful local build is not proof that the hosted environment has the correct migration or secrets.

## Deploy and accept

1. Deploy the reviewed release commit to an isolated preview/testnet environment.
2. Open every route listed in `docs/TESTNET_ACCEPTANCE_MATRIX.md` in a signed-out browser.
3. Run baseline acceptance with execution disabled.
4. Let the owner or designated tester complete WhatsApp checks on their own account.
5. If one bounded transfer is explicitly approved, temporarily enable only `ROVA_EXECUTION_ENABLED`, preserve the Arc receipt, and immediately disable the flag again.
6. Do not publish the URL as live until the signed-out link check and acceptance matrix pass.

Use `docs/HACKATHON_SUBMISSION_RUNBOOK.md` for the submission sequence and stop conditions.
