# Configuration and Secret Handling

## Configuration model

Rova does not ship one shared environment file for all users. Every development or hosted deployment supplies its own values through its local process environment or hosting secret manager.

The TypeScript files are validation boundaries, not secret stores:

- `lib/env/server.ts` is the only application boundary for server secrets and private runtime controls.
- `lib/env/public.ts` contains browser-safe `NEXT_PUBLIC_*` values only.
- `tools/runtimeConfig.ts` validates one-off deployment and registration controls.
- `.env.example` contains names and safe defaults only; it must never contain real credentials.

Do not put secrets into a `.ts`, `.js`, YAML, JSON, contract, or committed environment file. Moving a secret from `.env` into source code would expose it to every clone and often to client bundles.

## Key classification

| Variable | Secret? | Required handling |
|---|---|---|
| `ROVA_SESSION_SECRET` | Yes | Generate a unique high-entropy value per deployment; rotate after suspected disclosure and invalidate existing sessions |
| `ROVA_ADMIN_TOKEN` | Yes | Store server-side only; rotate after suspected disclosure |
| `ROVA_SCHEDULER_TOKEN` | Yes | Engine/server secret; rotate after suspected disclosure and restart both services |
| `ROVA_DEPLOYER_PRIVATE_KEY` | Yes | Use a dedicated funded-only-for-the-operation mainnet deployer; never place it in the web runtime |
| `ROVA_DEPLOY_CONFIRMATION` | No | Exact one-operation authorization phrase; clear it after the deployment window |
| `ROVA_ALLOW_CONTRACT_DEPLOY` | No | Safety gate; default `false` and enable only during an approved deployment window |
| `ROVA_EXECUTION_ENABLED` | No | Custody gate; default `false` |
| `ROVA_AUTONOMOUS_EXECUTION_ENABLED` | No | Additional unattended-engine gate; default `false` |
| `ROVA_WHATSAPP_EXECUTION_ENABLED` | No | Additional WhatsApp execution gate; default `false` |
| Circle, Supabase, AI, Resend, and webhook credentials | Yes | Unique per environment; store only in the relevant service/hosting secret manager |

## Exposure status

The historical fallback deployer private key embedded in repository code is treated as exposed and must never be reused. Move any remaining funds and revoke relevant approvals from the derived account.

The current tracked web and Go trees passed a redacted credential-pattern scan on October 15, 2026. Repository history containing a variable name such as `ROVA_SESSION_SECRET`, `ROVA_DEPLOY_CONFIRMATION`, or `ROVA_SCHEDULER_TOKEN` does not by itself prove that a secret value was committed. Rotation is still required whenever a real value was pasted into source control, chat, logs, screenshots, build output, or an untrusted machine.

## Rotation checklist

1. Inventory the web host, engine host, Supabase, Circle, AI providers, email provider, webhook provider, CI, and local developer machines.
2. Revoke or rotate actual credentials at their issuing service; changing only the variable name is not rotation.
3. Generate unique replacement values for each environment and account.
4. Update the secret managers without printing values into terminal logs or pull requests.
5. Restart the affected services and invalidate old sessions/tokens where supported.
6. Keep all execution gates disabled while testing authentication and read paths.
7. Verify the old credential no longer works and record only the rotation time, responsible owner, and non-sensitive key identifier.
8. Run the redacted repository, bundle, log, and screenshot checks before deployment.
