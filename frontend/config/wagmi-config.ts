import { arbitrum, base } from 'viem/chains';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';

import { env } from './env';

export const projectId = env.projectId;

if (!projectId) {
  throw new Error('Reown project ID is not defined');
}

export const networks = [arbitrum, base];
export const chainIds = [BigInt(arbitrum.id), BigInt(base.id)];

export const wagmiAdapter = new WagmiAdapter({
  ssr: false,
  projectId,
  networks,
  batch: { multicall: true },
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;
