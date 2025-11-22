# Universal Paymaster 🪐

A Next.js frontend application for managing liquidity pools that sponsor blockchain transactions. Built with React, Three.js, and Viem for seamless smart contract interactions.

**Made in Argentina** 🇦🇷

## Features

- **3D Interactive Globe**: WebGL-based visualization of global activity using Three.js
- **Pool Management**: Dashboard for monitoring and managing liquidity pools
- **Smart Contract Integration**: Direct interaction with Universal Paymaster contracts via Viem
- **Multi-Auth Support**: Privy integration with passkey, wallet, and email login
- **Real-time Analytics**: Pool metrics including TVL, APR, volume, and rebalancing factors

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19, Tailwind CSS 4
- **3D Graphics**: Three.js, React Three Fiber, Drei
- **Blockchain**: Viem, Privy Auth
- **Type Safety**: TypeScript, Zod
- **Package Manager**: pnpm

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd universal-paymaster-monorepo/frontend

# Install dependencies
pnpm install
```

### Environment Setup

Create a `.env.local` file in the `frontend` directory:

```env
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
NEXT_PUBLIC_CHAIN_ID=1
NEXT_PUBLIC_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/your-api-key
NEXT_PUBLIC_PAYMASTER_ADDRESS=0x...
```

All environment variables are validated at build time using Zod.

### Development

```bash
cd frontend
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Building for Production

```bash
cd frontend
pnpm build
pnpm start
```

## Project Structure

```
frontend/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Landing page with 3D globe
│   ├── pools/             # Pool management routes
│   └── providers.tsx      # App-wide providers (Privy)
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── globe.tsx         # 3D globe visualization
│   ├── control-orb.tsx   # Floating navigation control
│   └── pool-*.tsx        # Pool-specific components
├── config/               # Configuration
│   └── env.ts           # Environment variable validation
├── lib/                 # Utilities and integrations
│   ├── abi/            # Smart contract ABIs
│   └── sc-actions.ts   # Smart contract action functions
├── data/               # Mock/static data
└── public/            # Static assets
```

## Smart Contract Integration

The app interacts with Universal Paymaster contracts through [lib/sc-actions.ts](frontend/lib/sc-actions.ts):

- **`createPool()`**: Initialize a new liquidity pool
- **`supplyToPool()`**: Deposit ETH into a pool
- **`withdrawFromPool()`**: Withdraw assets from a pool
- **`rebalancePool()`**: Rebalance pool liquidity

Pool IDs are derived from token addresses using `poolIdFromToken(token: Address)`.

## Key Components

### 3D Globe ([components/globe.tsx](frontend/components/globe.tsx))
- Renders ~450,000 points using WebGL
- Loads GeoJSON data for continent visualization
- Auto-rotates with smooth animations

### Control Orb ([components/control-orb.tsx](frontend/components/control-orb.tsx))
- Floating navigation UI
- Provides quick access to transfers and authentication
- Appears on all pages except landing

### Pool Dashboard ([app/pools/page.tsx](frontend/app/pools/page.tsx))
- Interactive pool table with sorting
- Real-time metrics and analytics
- Deposit/withdrawal actions

## Development

### Code Quality

```bash
pnpm lint
```

### Path Aliases

The project uses `@/*` path aliases:

```typescript
import { env } from '@/config/env'
import { createPool } from '@/lib/sc-actions'
import { Button } from '@/components/ui/button'
```

## Deployment

This Next.js app can be deployed to:

- **Vercel**: Push to GitHub and connect your repo
- **Self-hosted**: Use `pnpm build && pnpm start`
- **Docker**: Create a Dockerfile with Node.js runtime

Ensure all environment variables are set in your deployment platform.

## Contributing

This project was built during a hackathon. Contributions are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

[Add your license here]

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Authentication by [Privy](https://privy.io/)
- 3D graphics powered by [Three.js](https://threejs.org/)
