# Deploying RovaExecutionLog (no coding required)

This is the one contract in the Rova codebase that's actually yours — everything
else in `lib/config.ts` (USDC, EURC, CCTP, Gateway, ERC-8004/8183 registries) is
shared Circle/Arc infrastructure every builder on Arc points to. This is the
address to put in the hackathon form's "smart contract" field.

You don't need to install anything. This uses Remix (a contract IDE that runs
entirely in your browser) and MetaMask.

---

## 1. Add Arc Testnet to MetaMask

Open MetaMask → Networks → **Add a network manually**, and enter:

| Field | Value |
|---|---|
| Network name | Arc Testnet |
| RPC URL | `https://rpc.testnet.arc.network` |
| Chain ID | `5042002` |
| Currency symbol | `USDC` |
| Block explorer | `https://testnet.arcscan.app` |

## 2. Get testnet gas

Arc uses USDC itself as the gas token (no separate ETH-like gas coin). Get
free testnet USDC from **https://faucet.circle.com** — paste in your MetaMask
wallet address, select Arc Testnet.

## 3. Open Remix and load the contract

1. Go to **https://remix.ethereum.org**
2. In the file explorer on the left, create a new file named `RovaExecutionLog.sol`
3. Open `contracts/RovaExecutionLog.sol` from your Rova project folder, copy
   its full contents, and paste into the new Remix file

## 4. Compile

1. Click the **Solidity Compiler** tab (left sidebar, looks like an "S")
2. Set compiler version to `0.8.24` (or anything `0.8.24` and above)
3. Click **Compile RovaExecutionLog.sol**
4. You should see a green checkmark — no red errors

## 5. Deploy

1. Click the **Deploy & Run Transactions** tab (left sidebar, looks like an Ethereum logo with an arrow)
2. Under **Environment**, choose **Injected Provider - MetaMask**
3. MetaMask will pop up — make sure it's connected and switched to **Arc Testnet** (from step 1)
4. Confirm `RovaExecutionLog` is selected in the contract dropdown
5. Click the orange **Deploy** button
6. MetaMask pops up asking you to confirm the transaction — confirm it
7. Wait a few seconds (Arc has sub-second finality, but the UI needs a moment to catch up)

## 6. Copy the deployed address

1. Under **Deployed Contracts** at the bottom of the Remix sidebar, you'll see
   `ROVAEXECUTIONLOG AT 0x...` — click the copy icon next to it
2. This address is what goes in:
   - The hackathon form's "smart contract" field
   - Your `.env` file, as `NEXT_PUBLIC_ROVA_EXECUTION_LOG_ADDRESS=0x...`

## 7. Verify it on ArcScan (optional but recommended)

Go to `https://testnet.arcscan.app/address/<your contract address>` — you
should see your deployment transaction. This is what you'd link to if the
form or judges ask for proof.

## 8. Confirm it's wired up correctly

Once the env var is set and you redeploy the app, every autonomous Agent
execution will call `logExecution(...)` on this contract automatically —
you'll see the transaction show up in the Agent tab's execution log, and on
ArcScan under your contract's address.

---

**If you get stuck at any step**, paste the error message here and I'll help
you debug it.
