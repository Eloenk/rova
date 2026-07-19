# Deployment Guide — Rova Agent

Your Agentic Commerce engine is now refined, debugged, and ready for global deployment. 

## 1. Prerequisites (Secrets)
Ensure you have the following API keys from the Arc Network and Circle Developer consoles:

| Variable | Source | Description |
| :--- | :--- | :--- |
| `ANTHROPIC_API_KEY` | Anthropic | powers the Claude AI Engine |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Google | Gemini API key for fallback operations |
| `CIRCLE_API_KEY` | Circle Console | required for USD settlements |
| `ARC_RPC_URL` | Arc Network | `https://testnet.arc.network/rpc` |
| `NEXT_PUBLIC_ROVA_AGENT_ID` | `register-agent.ts` | Your unique Agent Identity NFT token ID |
| `SUPABASE_URL` | Supabase | Your database API URL (optional fallback to memory) |
| `SUPABASE_ANON_KEY` | Supabase | Your database public anonymous key (optional) |

## 2. Database State Setup (Optional)
Rova contains a persistent state engine that stores rules, executions, and parsed intents.
1. Create a free project on **Supabase**.
2. Run the SQL schema script inside [schema.sql](file:///c:/Users/Theotherguy.THEOTHERGUY/Desktop/rova/rova/lib/schema.sql) using the Supabase SQL editor.
3. Configure `SUPABASE_URL` and `SUPABASE_ANON_KEY` variables in your environment. If left unset, the engine automatically runs using local in-memory stores.

## 3. Onchain Identity Registration
Before the app goes live, you must secure your agent's identity on the Arc Testnet. 
Run this command once in your terminal:
```bash
npm run register-agent
```
**Note:** Copy the resulting **Agent Identity Token ID** and add it to your environment variables as `NEXT_PUBLIC_ROVA_AGENT_ID`.

## 4. Deploying to Vercel
1.  **Push to GitHub**: Initialize a repo and push the current code.
2.  **Import to Vercel**: Connect your repository.
3.  **Configure Build**: Vercel will auto-detect Next.js.
4.  **Add Environment Variables**: Paste the secrets from Step 1.
5.  **Deploy**: Your app will be live at `https://rovaagent.vercel.app`.

## 5. Final Verification
Once live, navigate to your `/dashboard`. 
- **Check Topbar**: You should see the **🛡️ NODE VERIFIED** badge.
- **Test Builder**: Input an intent like *"Route 50 USDC to Arc wallet 0x..."* to confirm the AI planning and Circle execution flow is active.

> [!SUCCESS]
> You are now running an elite, ERC-8004 verified agent on the Arc Network.
