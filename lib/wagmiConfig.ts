import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { arcTestnet } from './arcChain';

export const wagmiConfig = getDefaultConfig({
  appName: 'Rova',
  projectId: 'c44e995f560e7e1f40784936d8d67295',
  chains: [arcTestnet],
  ssr: true,
});
