# Guarded Arc Mainnet Contract Deployment

The Arc Microgrants submission requires a working Arc Mainnet deployment. This release permits only the non-custodial `RovaExecutionLog` contract. It stores caller-submitted public audit metadata and does not hold, approve, swap, or transfer tokens.

`RovaSavingsVault` and `RovaSwapRouter` are not approved by this release and are rejected by the deployment CLI.

## Owner-controlled preconditions

1. Merge the reviewed release and run the clean-checkout validation commands.
2. Use a new dedicated Arc Mainnet deployer funded only with the small amount of USDC required for gas.
3. Inject `ROVA_DEPLOYER_PRIVATE_KEY` into a one-off local process from an approved secret manager. Never place it in the web host, repository, command history, chat, screenshots, or an environment file.
4. Set `ARC_RPC_URL=https://rpc.mainnet.arc.io` and `ARC_CHAIN_ID=5042`.
5. Set `ROVA_ALLOW_CONTRACT_DEPLOY=true` only for this deployment window.
6. Set `ROVA_DEPLOY_CONFIRMATION=DEPLOY:RovaExecutionLog:5042`.

## Validate and deploy

```text
npm run lint
npm run typecheck
npm test
npm run deploy:contract -- RovaExecutionLog.sol RovaExecutionLog
```

The CLI validates the allow flag, exact confirmation, private-key format, contract allowlist, RPC connectivity, and chain ID. It submits once and does not automatically retry an ambiguous broadcast.

## Reconcile and close

1. Save only the public transaction hash and contract address.
2. Verify both at `https://explorer.arc.io` and confirm chain ID `5042`.
3. Compare deployed runtime bytecode with the reviewed compiler artifact.
4. Configure `NEXT_PUBLIC_ROVA_EXECUTION_LOG_ADDRESS` with the public address.
5. Clear `ROVA_ALLOW_CONTRACT_DEPLOY`, `ROVA_DEPLOY_CONFIRMATION`, and the private key from the process environment.
6. If status is uncertain, inspect the deployer nonce and explorer before any retry.

An optional smoke call may write a clearly labelled zero-value demonstration record through the verified explorer's connected-wallet interface. Use zero values for the recipient, amount, and rate fields, and identify the entry as a non-financial deployment smoke test in the memo. It must not imply that Rova transferred, swapped, bridged, invested, or custodyed funds.
