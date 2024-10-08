import { http, createConfig } from 'wagmi';
import { btr, btrTestnet } from 'wagmi/chains';
import { walletConnect } from 'wagmi/connectors';

export const config = createConfig({
  chains: [btr, btrTestnet],
  connectors: [
    walletConnect({
      projectId: 'af2938e2d16d40386a87b41441febf06',
    }),
  ],
  transports: {
    [btr.id]: http(),
    [btrTestnet.id]: http(),
  },
});

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}
