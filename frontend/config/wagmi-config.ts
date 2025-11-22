import { sepolia } from '@reown/appkit/networks';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';

export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;

if (!projectId) {
  throw new Error('Reown project ID is not defined');
}

export const networks = [sepolia];

export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks,
  ssr: false,
  batch: { multicall: true },
});

export const config = wagmiAdapter.wagmiConfig;
