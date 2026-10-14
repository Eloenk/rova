# Guarded Arc Testnet Contract Deployment

Contract deployment is optional for the hackathon demo and is never implied by a successful web build. Deploy only after the owner approves the exact contract, chain, deployer, and change window.

## Allowed contracts

The guarded deployment CLI accepts only:

- `RovaExecutionLog.sol` as `RovaExecutionLog`
- `RovaSavingsVault.sol` as `RovaSavingsVault`

`RovaSavingsVault` is an unaudited testnet prototype and is not approved for production custody. The retired `RovaSwapRouter` must not be deployed.

## Preconditions

1. Review the exact Solidity source and compiler output.
2. Use a dedicated Arc testnet deployer with only the funds needed for this operation.
3. Inject `ROVA_DEPLOYER_PRIVATE_KEY` from an approved secret manager into the one-off deployment process; do not place it in the web host, repository, command history, or local environment file.
4. Set `ARC_CHAIN_ID=5042002` and select an approved Arc testnet RPC.
5. Set `ROVA_ALLOW_CONTRACT_DEPLOY=true` only for the deployment window.
6. Set the exact confirmation string:
   - `DEPLOY:RovaExecutionLog:5042002`, or
   - `DEPLOY:RovaSavingsVault:5042002`.

## Validate and deploy

Compile and test the selected contract before broadcast. Then run one guarded deployment command from the repository root:

```text
npm run deploy:contract -- RovaExecutionLog.sol RovaExecutionLog
```

or:

```text
npm run deploy:contract -- RovaSavingsVault.sol RovaSavingsVault
```

The CLI validates the allow flag, exact confirmation, private-key format, contract allowlist, RPC connectivity, and chain ID. It submits once and does not automatically retry an ambiguous broadcast.

## Reconcile and close

1. Preserve the transaction hash printed by the CLI.
2. Verify the transaction and deployed address at `https://explorer.testnet.arc.io`.
3. Compare deployed bytecode with the reviewed compiler artifact before configuring the application.
4. Record the public address in the deployment manifest and hosting configuration; an address is not a secret.
5. Clear `ROVA_ALLOW_CONTRACT_DEPLOY`, `ROVA_DEPLOY_CONFIRMATION`, and the private key from the process environment.
6. If submission status is uncertain, reconcile the deployer nonce and explorer before any retry.

Do not claim the optional execution-log contract records every action. Server/database receipts and Arc transaction hashes remain the primary evidence.
