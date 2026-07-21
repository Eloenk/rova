# Deployment Guide — FlowFi Agent

Your Agentic Commerce engine is now refined, debugged, and ready for global deployment. 

## 1. Prerequisites (Secrets)
Ensure you have the following API keys from the Arc Network and Circle Developer consoles:

| Variable | Source | Description |
| :--- | :--- | :--- |
| `ANTHROPIC_API_KEY` | Anthropic | powers the Claude AI Engine |
| `CIRCLE_API_KEY` | Circle Console | required for USD settlements |
| `ARC_RPC_URL` | Arc Network | `https://testnet.arc.network/rpc` |
| `NEXT_PUBLIC_FLOWFI_AGENT_ID` | `register-agent.ts` | Your unique Agent Identity NFT token ID |

## 2. Onchain Identity Registration
Before the app goes live, you must secure your agent's identity on the Arc Testnet. 
Run this command once in your terminal:
```bash
npm run register-agent
```
**Note:** Copy the resulting **Agent Identity Token ID** and add it to your environment variables as `NEXT_PUBLIC_FLOWFI_AGENT_ID`.

## 3. Deploying to Vercel
1.  **Push to GitHub**: Initialize a repo and push the current code.
2.  **Import to Vercel**: Connect your repository.
3.  **Configure Build**: Vercel will auto-detect Next.js.
4.  **Add Environment Variables**: Paste the secrets from Step 1.
5.  **Deploy**: Your app will be live at `https://flowfi-agent.vercel.app`.

## 4. Final Verification
Once live, navigate to your `/dashboard`. 
- **Check Topbar**: You should see the **🛡️ NODE VERIFIED** badge.
- **Test Builder**: Input an intent like *"Route 50 USDC to Arc wallet 0x..."* to confirm the AI planning and Circle execution flow is active.

> [!SUCCESS]
> You are now running an elite, ERC-8004 verified agent on the Arc Network.
