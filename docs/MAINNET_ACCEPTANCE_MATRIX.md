# Mainnet Acceptance Matrix

Record the date, tester, release commit, deployment ID, contract address, and public evidence for every row. Never record passwords, API keys, session cookies, OTP values, phone numbers, QR payloads, entity secrets, or private keys.

| Area | Required test | Expected result |
|---|---|---|
| Network identity | Query the configured RPC and inspect the UI network label | RPC reports chain ID `5042`; UI states Arc Mainnet |
| Official assets | Inspect configured USDC, EURC, explorer, RPC, and ERC-8004 addresses | Values match current official Arc documentation |
| Public deployment | Open `/`, `/login`, `/dashboard`, `/send`, `/agent`, `/history`, and `/docs` while signed out | Public pages load as designed; protected data is not exposed; no submitted route is a 404 |
| Authentication | Request and verify an email OTP for a fresh user | OTP expires, cannot be replayed, and creates only that user's session |
| Session lifecycle | Refresh, log out, and reuse the old session cookie | Rotation succeeds; logout invalidates the old session |
| User isolation | Sign in as two different users and inspect wallet, plans, rules, intents, and receipts | Neither user can read or mutate the other's records |
| Wallet network | Create or attach the owner's approved EVM wallet | The displayed address resolves on Arc Mainnet and no testnet wallet is presented as mainnet |
| Balance reads | Compare displayed USDC and EURC balances with the Arc explorer | Values match the same mainnet wallet and official token contracts |
| Recipient binding | Ask to prepare a USDC transfer without an address, then with an explicit valid Arc address | Missing address is rejected; the supplied address is preserved exactly |
| Managed execution boundary | Prepare a supported plan and inspect the API response | No executable plan ID is created; managed-wallet execution remains disabled |
| Self-custody boundary | Attempt the dormant browser-wallet send helper | It rejects before requesting a wallet signature or submitting a transaction |
| Manual endpoint gate | Call authorization and execution endpoints with `ROVA_EXECUTION_ENABLED=false` | Both fail closed before transaction submission |
| Unsupported capability | Request yield, staking, USYC, ERC-8183, executable bridging, or new automation | Request is rejected or remains explicitly informational; no transaction is created |
| Engine gate | Start the Go engine with all execution flags false | Monitoring/planning may start; no transaction-signing path can run |
| WhatsApp ownership | Owner completes linking on their own device | Correct account links without sharing QR, phone, OTP, cookie, or credentials |
| WhatsApp execution gate | Request money movement with WhatsApp execution disabled | Request fails closed without a provider or blockchain submission |
| Contract compile | Run the repository tests and compile `RovaExecutionLog.sol` | Compilation passes and ABI contains only logging/read functions |
| Contract allowlist | Attempt to select `RovaSavingsVault.sol` or another contract in the deploy CLI | Deployment is rejected before signing |
| Mainnet contract | Deploy `RovaExecutionLog` through the guarded owner-controlled workflow | Receipt succeeds on chain `5042`; address and transaction open on `explorer.arc.io` |
| Bytecode check | Compare deployed bytecode with the reviewed compiler artifact | Runtime bytecode matches the reviewed release artifact |
| Log smoke test | Owner submits one zero-value or clearly labelled demonstration log entry | Public event appears at the verified contract; no token approval, custody, or transfer occurs |
| Secret hygiene | Inspect hosting variables, client bundle, logs, screenshots, and repository diff | No server secret or private key appears in public/client-visible output |
| Submission links | Open app, repositories, builder profile, contract, demo, and explorer evidence while signed out | Every submitted link resolves and describes only verified mainnet behavior |

## Required evidence bundle

- exact web and Go commit SHAs;
- clean validation output;
- owner-controlled hosting deployment identifier;
- database migration timestamp and RLS results;
- Arc mainnet contract address, deployment transaction, and bytecode comparison;
- redacted acceptance matrix signed by the owner/tester;
- public demo URL and signed-out link-check result;
- public builder profile and final DoraHacks submission URL.
