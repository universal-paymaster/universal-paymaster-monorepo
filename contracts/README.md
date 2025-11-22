# Universal Paymaster Smart Contracts

This directory contains the smart contracts for the Universal Paymaster protocol - a liquidity pool system that sponsors blockchain transactions by maintaining pools of ETH and ERC-20 tokens.

## Overview

The Universal Paymaster allows liquidity providers (LPs) to deposit assets into pools and earn fees from transaction sponsorship and rebalancing operations. The system implements ERC-6909 multi-token vault functionality, enabling efficient management of multiple token pools within a single contract.

## Architecture

### Contract Components

The Universal Paymaster contract combines two main components:

1. **UniversalPaymaster** - Core paymaster logic for pool management and rebalancing
2. **ERC6909NativeEntryPointVault** - Multi-token vault implementing ERC-6909 standard

```
┌─────────────────────────────────────────────────────────────┐
│                   UniversalPaymaster                        │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Pool Management                            │  │
│  │  • initializePool()                                  │  │
│  │  • rebalance()                                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                 │
│                           │                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │      ERC6909NativeEntryPointVault                    │  │
│  │  • deposit()                                         │  │
│  │  • withdraw()                                        │  │
│  │  • totalAssets()                                     │  │
│  │  • previewDeposit()                                  │  │
│  │  • previewWithdraw()                                 │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Core Functions

### Pool Management

#### `initializePool(address token, uint24 lpFeeBps, uint24 rebalancingFeeBps, address oracle)`

Initializes a new liquidity pool for a specific token.

**Parameters:**
- `token` - The ERC-20 token address for this pool
- `lpFeeBps` - Liquidity provider fee in basis points (1 bps = 0.01%)
- `rebalancingFeeBps` - Rebalancing fee in basis points
- `oracle` - Price oracle address for the token

**Access:** Public
**State:** Non-payable

```
   Caller                 UniversalPaymaster
     │                            │
     │  initializePool()          │
     ├──────────────────────────► │
     │                            │
     │  ✓ Pool Created            │
     │  ✓ Fees Configured         │
     │  ✓ Oracle Set              │
     │                            │
```

#### `rebalance(address token, uint256 tokenAmount, address receiver)`

Rebalances a pool by exchanging ETH for tokens at a discounted rate.

**Parameters:**
- `token` - The token to receive
- `tokenAmount` - Amount of tokens to receive
- `receiver` - Address to receive the tokens

**Returns:** `ethAmountAfterDiscount` - Amount of ETH required (after discount)

**Access:** Public
**State:** Payable (msg.value must be >= ethAmountAfterDiscount)

```
   Caller                 UniversalPaymaster              Pool
     │                            │                        │
     │  rebalance()               │                        │
     │  + ETH payment             │                        │
     ├──────────────────────────► │                        │
     │                            │  Calculate discount    │
     │                            │  based on oracle       │
     │                            ├──────────────────────► │
     │                            │  Transfer tokens       │
     │                            │◄────────────────────── │
     │  ✓ Tokens received         │                        │
     │  ✓ Pool rebalanced         │                        │
     │◄────────────────────────── │                        │
```

### Vault Operations (ERC-6909)

Pool IDs are derived from token addresses: `poolId = uint256(token)`

#### `deposit(uint256 assets, address receiver, uint256 id)`

Deposits ETH into a specific pool and mints shares to the receiver.

**Parameters:**
- `assets` - Amount of ETH to deposit (in wei)
- `receiver` - Address to receive the LP shares
- `id` - Pool ID (derived from token address)

**Returns:** `shares` - Amount of LP shares minted

**Access:** Public
**State:** Payable (msg.value must equal `assets`)

**Important:** The `msg.value` must exactly match the `assets` parameter or the transaction will revert.

```
    LP                    Vault                    Pool
     │                      │                        │
     │  deposit()           │                        │
     │  + ETH (assets)      │                        │
     ├────────────────────► │                        │
     │                      │  Calculate shares      │
     │                      ├──────────────────────► │
     │                      │  Mint LP tokens        │
     │                      │◄────────────────────── │
     │  ✓ LP shares         │                        │
     │◄──────────────────── │                        │
```

#### `withdraw(uint256 assets, address receiver, address owner, uint256 id)`

Withdraws ETH from a pool by burning LP shares.

**Parameters:**
- `assets` - Amount of ETH to withdraw (in wei)
- `receiver` - Address to receive the ETH
- `owner` - Address that owns the LP shares
- `id` - Pool ID

**Returns:** `shares` - Amount of LP shares burned

**Access:** Public
**State:** Non-payable

```
    LP                    Vault                    Pool
     │                      │                        │
     │  withdraw()          │                        │
     ├────────────────────► │                        │
     │                      │  Calculate shares      │
     │                      ├──────────────────────► │
     │                      │  Burn LP tokens        │
     │                      │  Transfer ETH          │
     │                      │◄────────────────────── │
     │  ✓ ETH received      │                        │
     │◄──────────────────── │                        │
```

### View Functions

#### `totalAssets(uint256 id)`

Returns the total ETH assets in a specific pool.

#### `previewDeposit(uint256 assets, uint256 id)`

Previews the amount of shares that would be minted for a given deposit amount.

#### `previewWithdraw(uint256 assets, uint256 id)`

Previews the amount of shares required to withdraw a given amount of assets.

## Pool Lifecycle

```
┌──────────────┐
│   Creator    │
└──────┬───────┘
       │
       │ 1. initializePool(token, lpFee, rebalancingFee, oracle)
       ▼
┌──────────────────────┐
│   Pool Initialized   │
│   • Token set        │
│   • Fees configured  │
│   • Oracle connected │
└──────┬───────────────┘
       │
       │ 2. LPs deposit ETH
       │    deposit(assets, receiver, poolId)
       ▼
┌──────────────────────┐
│   Pool has Liquidity │
│   • ETH available    │
│   • LP shares minted │
└──────┬───────────────┘
       │
       │ 3. Users rebalance
       │    rebalance(token, amount, receiver)
       ▼
┌──────────────────────┐
│   Pool Generates     │
│   Fees               │
│   • LP fees          │
│   • Rebalancing fees │
└──────┬───────────────┘
       │
       │ 4. LPs withdraw
       │    withdraw(assets, receiver, owner, poolId)
       ▼
┌──────────────────────┐
│   LP Exit            │
│   • Shares burned    │
│   • ETH + fees paid  │
└──────────────────────┘
```

## Fee Structure

The protocol implements a two-tier fee system:

1. **LP Fee (`lpFeeBps`)**: Charged on deposits/withdrawals, accrues to liquidity providers
2. **Rebalancing Fee (`rebalancingFeeBps`)**: Charged on rebalancing operations, incentivizes pool balance

Fees are specified in basis points (bps), where 100 bps = 1%.

## Integration Example

See the frontend integration in [`frontend/lib/sc-actions.ts`](../frontend/lib/sc-actions.ts) for TypeScript/Viem examples:

```typescript
// Create a new pool
await createPool({
  token: '0x...',
  oracle: '0x...',
  lpFeeBps: 30,        // 0.3% LP fee
  rebalancingFeeBps: 10 // 0.1% rebalancing fee
});

// Supply liquidity
await supplyToPool({
  token: '0x...',
  assetsWei: parseEther('1.0'),
  receiver: '0x...'
});

// Rebalance pool
await rebalancePool({
  token: '0x...',
  tokenAmount: parseUnits('1000', 6), // 1000 USDC
  maxEthToSend: parseEther('0.5'),
  receiver: '0x...'
});
```

## Development Setup

This project uses Hardhat 3 Beta with TypeScript and Viem.

### Prerequisites

- Node.js 20+
- pnpm

### Installation

```bash
cd contracts
pnpm install
```

### Running Tests

```bash
# Run all tests
npx hardhat test

# Run Solidity tests only
npx hardhat test solidity

# Run Node.js integration tests
npx hardhat test nodejs
```

### Deployment

#### Local Development

```bash
npx hardhat ignition deploy ignition/modules/Counter.ts
```

#### Sepolia Testnet

```bash
# Set configuration variables
npx hardhat keystore set SEPOLIA_PRIVATE_KEY
npx hardhat keystore set SEPOLIA_RPC_URL

# Deploy
npx hardhat ignition deploy --network sepolia ignition/modules/Counter.ts
```

## Network Configuration

See [`hardhat.config.ts`](./hardhat.config.ts) for network configurations:

- **hardhatMainnet**: Simulated L1 chain
- **hardhatOp**: Simulated Optimism L2 chain
- **sepolia**: Ethereum Sepolia testnet

## Security Considerations

1. **Pool ID Derivation**: Pool IDs are derived from token addresses using `uint256(tokenAddress)`. This creates a 1:1 mapping between tokens and pools.

2. **Deposit Value Matching**: The `deposit()` function requires `msg.value == assets`. Always ensure these values match when calling from contracts or frontends.

3. **Oracle Dependency**: Pool pricing depends on the configured oracle. Ensure oracles are reliable and manipulation-resistant.

4. **Fee Bounds**: Verify that `lpFeeBps` and `rebalancingFeeBps` are within reasonable bounds to prevent excessive fees.

## ABI

The contract ABI is available at [`frontend/lib/abi/universalPaymaster.ts`](../frontend/lib/abi/universalPaymaster.ts).

## License

[Add your license here]
