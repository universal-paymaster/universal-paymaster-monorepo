'use client';

import { sepolia } from 'viem/chains';
import { usePathname } from 'next/navigation';
import { cookieToInitialState, WagmiProvider } from 'wagmi';
import { ChainAdapter, createAppKit } from '@reown/appkit/react';
import { type PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ControlOrb } from '@/components/control-orb';
import { projectId, wagmiAdapter } from '@/config/wagmi-config';

const queryClient = new QueryClient();

if (!projectId) {
  throw new Error('Project ID is not defined');
}

const metadata = {
  name: 'universal-paymaster',
  description: 'Universal Paymaster',
  url: 'universalpaymaster.com',
  icons: [''],
};

createAppKit({
  adapters: [wagmiAdapter as ChainAdapter],
  projectId,
  metadata: metadata,
  networks: [sepolia],
  defaultNetwork: sepolia,
  enableWalletConnect: true,
  featuredWalletIds: [
    'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // metamask
  ],
  features: {
    swaps: false,
    onramp: false,
    email: false,
    socials: false,
    analytics: false,
  },
});

export const Providers = ({ children }: PropsWithChildren) => {
  const pathname = usePathname();

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
        {pathname != '/' && <ControlOrb />}
      </QueryClientProvider>
    </WagmiProvider>
  );
};
