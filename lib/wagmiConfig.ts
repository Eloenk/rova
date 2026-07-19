import { createConfig, http } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { arcTestnet } from './arcChain';

export const wagmiConfig = createConfig({
  ssr: true,
  chains: [arcTestnet],
  connectors: [
    injected({ shimDisconnect: true }),
  ],
  transports: { [arcTestnet.id]: http('https://rpc.testnet.arc.network') },
});
