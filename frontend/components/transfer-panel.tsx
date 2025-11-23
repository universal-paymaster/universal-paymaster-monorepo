'use client';

import clsx from 'clsx';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { Address } from 'viem';
import { LiquidGlassButton } from '@/components/ui/liquid-glass-button';
import { crossChainTransfer } from '@/lib/x-sc-actions';
import { Dropdown, type DropdownOption } from '@/components/ui/dropdown';
import { arbitrum, base, mainnet, optimism } from 'viem/chains';
import { CallbackType, ExecCallback } from '@eil-protocol/sdk';
import { env } from '@/config/env';

type TransferPanelProps = {
  onClose?: () => void;
  className?: string;
};

type AssetOption = DropdownOption & {
  ticker: string;
  address: string;
  decimals: number;
};

type ChainOption = DropdownOption & {
  chainId: number;
};

const renderIcon = (src: string, alt: string) => (
  <Image
    src={src}
    alt={alt}
    width={28}
    height={28}
    className="h-7 w-7 object-contain"
  />
);

const assetOptions: AssetOption[] = [
  {
    value: 'USDC',
    label: 'USD Coin',
    ticker: 'USDC',
    address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    decimals: 6,
    icon: renderIcon('/svg/usdc.svg', 'USD Coin'),
  },
  {
    value: 'ETH',
    label: 'Ether',
    ticker: 'ETH',
    address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    decimals: 18,
    icon: renderIcon('/svg/eth.svg', 'Ethereum'),
  },
  {
    value: 'WBTC',
    label: 'Wrapped Bitcoin',
    ticker: 'WBTC',
    address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    decimals: 8,
    icon: renderIcon('/svg/bitcoin.svg', 'Bitcoin'),
  },
  {
    value: 'DAI',
    label: 'Dai',
    ticker: 'DAI',
    address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    decimals: 18,
    icon: renderIcon('/svg/dai.svg', 'Dai'),
  },
  {
    value: 'USDT',
    label: 'Tether USD',
    ticker: 'USDT',
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    decimals: 6,
    icon: renderIcon('/svg/usdt.svg', 'Tether'),
  },
];

const chainOptions: ChainOption[] = [
  {
    value: 'Arbitrum',
    chainId: arbitrum.id,
    label: 'Arbitrum One',
    icon: renderIcon('/svg/arbitrum.svg', 'Arbitrum'),
  },
  {
    value: 'Base',
    chainId: base.id,
    label: 'Base',
    icon: renderIcon('/svg/base.svg', 'Arbitrum'),
  },
  {
    value: 'Ethereum',
    chainId: mainnet.id,
    label: 'Ethereum Mainnet',
    icon: renderIcon('/svg/eth.svg', 'Ethereum'),
  },
  {
    value: 'Optimism',
    chainId: optimism.id,
    label: 'Optimism',
    icon: renderIcon('/svg/optimism.svg', 'Optimism'),
  },
];

const defaultAsset = assetOptions[0].value;
const defaultOriginChain = chainOptions[0].value;
const defaultDestinationChain = chainOptions[1]?.value ?? chainOptions[0].value;

const formatHash = (hash: string | undefined) => {
  if (!hash) return 'Hash unavailable';
  return hash.length <= 14 ? hash : `${hash.slice(0, 6)}...${hash.slice(-4)}`;
};

const formatAddress = (address: string | undefined) => {
  if (!address) return '';
  return address.length <= 12
    ? address
    : `${address.slice(0, 6)}...${address.slice(-4)}`;
};

function TransferPanel({ className, onClose }: TransferPanelProps) {
  const [asset, setAsset] = useState(defaultAsset);
  const [originChain, setOriginChain] = useState(defaultOriginChain);
  const [destinationChain, setDestinationChain] = useState(defaultDestinationChain); // prettier-ignore

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;

    const formData = new FormData(event.currentTarget);
    const assetInput = formData.get('asset')?.toString() ?? asset;
    const amountInput = formData.get('amount')?.toString().trim() ?? '';
    const addressInput = formData.get('address')?.toString().trim() ?? '';
    const originChainInput = formData.get('originChain')?.toString() ?? originChain; // prettier-ignore
    const destinationChainInput = formData.get('destinationChain')?.toString() ?? destinationChain; // prettier-ignore

    const selectedAsset = assetOptions.find(
      (option) => option.value === assetInput,
    );
    const selectedOriginChain = chainOptions.find(
      (option) => option.value === originChainInput,
    );
    const selectedDestinationChain = chainOptions.find(
      (option) => option.value === destinationChainInput,
    );

    if (
      selectedAsset == null ||
      selectedOriginChain == null ||
      selectedDestinationChain == null
    ) {
      console.warn('Cannot submit: selection not found in options.');
      return;
    }

    if (!amountInput || !addressInput) {
      console.log('Cannot submit: amount or address is missing.');
      return;
    }

    setIsSubmitting(true);

    const toastId = toast.loading('Submitting transfer...');
    let sawRevert = false;
    let lastTxHash: string | undefined;
    let lastUserOpHash: string | undefined;

    const showHashToast = (
      variant: 'success' | 'error',
      message: string,
      hash?: string,
    ) => {
      const color =
        variant === 'success'
          ? 'border-emerald-200/80 bg-white'
          : 'border-rose-200/80 bg-white';

      const HashToast = () => {
        const [copied, setCopied] = useState(false);

        useEffect(() => {
          if (!copied) return;
          const timer = setTimeout(() => setCopied(false), 1000);
          return () => clearTimeout(timer);
        }, [copied]);

        const handleCopy = async () => {
          if (!hash) return;
          try {
            await navigator.clipboard.writeText(hash);
            setCopied(true);
          } catch (copyErr) {
            console.error('Failed to copy hash', copyErr);
          }
        };

        return (
          <div
            className={clsx(
              'flex w-full max-w-lg items-center gap-3 rounded-2xl border px-4 py-3 shadow-lg',
              color,
            )}
          >
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-800">{message}</p>
              <div className="mt-1 flex items-center gap-2 text-xs text-slate-600">
                <span className="font-mono tracking-tight">
                  {formatHash(hash)}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              disabled={!hash}
              className={clsx(
                'rounded-full border px-3 py-1 text-xs font-semibold transition',
                hash
                  ? 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-100'
                  : 'cursor-not-allowed border-slate-200 text-slate-400 opacity-60',
              )}
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        );
      };

      toast.custom(
        () => <HashToast />,
        { id: toastId, duration: 8000, position: 'top-center' },
      );
    };

    try {
      const params = {
        chainId0: selectedOriginChain.chainId,
        chainId1: selectedDestinationChain.chainId,
        tokenAddress: selectedAsset.address,
        tokenTicker: selectedAsset.ticker,
        paymaster: env.paymasterAddress,
        amount: amountInput,
        recepient: addressInput,
      };

      const callbackFn: ExecCallback = ({
        revertReason,
        type,
        index,
        txHash,
        userOpHash,
      }) => {
        console.log('Callback data:', {
          revertReason,
          type,
          index,
          txHash,
          userOpHash,
        });
        lastTxHash = txHash ?? lastTxHash;
        lastUserOpHash = userOpHash ?? lastUserOpHash;

        if (revertReason || type === CallbackType.Failed) {
          sawRevert = true;
          const stepLabel =
            typeof index === 'number' ? ` (step ${index + 1})` : '';
          const hash = lastTxHash ?? lastUserOpHash;
          showHashToast(
            'error',
            `Transfer reverted${stepLabel}: ${String(revertReason)}`,
            hash,
          );
        }
      };

      await crossChainTransfer(
        BigInt(params.amount),
        params.recepient as Address,
        callbackFn,
      );

      // Replace with actual transfer action when backend or wallet wiring is ready.
      console.log('Submitting transfer:', params);
      if (!sawRevert) {
        const hash = lastTxHash ?? lastUserOpHash;
        showHashToast(
          'success',
          `Transfer sent: ${amountInput} ${selectedAsset.ticker} to ${formatAddress(addressInput)}`,
          hash,
        );
      }
    } catch (err) {
      console.error(err);
      if (!sawRevert) {
        const message =
          err instanceof Error ? err.message : 'Something went wrong.';
        const hash = lastTxHash ?? lastUserOpHash;
        showHashToast('error', `Transfer failed: ${message}`, hash);
      }
    } finally {
      setIsSubmitting(false);
      form.reset();
      setAsset(defaultAsset);
      setOriginChain(defaultOriginChain);
      setDestinationChain(defaultDestinationChain);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={clsx(['overflow-hidden h-full max-h-screen p-6', className])}
    >
      <div className="flex flex-col gap-10 h-full">
        <div className="pt-5 space-y-10">
          {/* 1. origin, asset, amount */}
          <div className="space-y-2">
            {/* header */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  1. Where you are
                </p>
                <p className="text-xs text-slate-500">
                  Select origin chain & asset to send
                </p>
              </div>
            </div>

            {/* origin chain dropdown */}
            <div className="">
              <label className="text-xs tracking-widest font-medium text-slate-500">
                origin chain
              </label>
              <Dropdown
                options={chainOptions}
                value={originChain}
                onChange={(option) => setOriginChain(option.value)}
                buttonClassName="bg-white/80"
              />
            </div>

            {/* amount and asset dropdonw */}
            <div className="flex items-center gap-2">
              {/* amount input */}
              <div className="w-[45%]">
                <label
                  htmlFor="transfer-amount"
                  className="text-xs tracking-widest font-medium text-slate-500"
                >
                  amount
                </label>
                <div className="rounded-2xl border border-white/60 bg-white/75 px-3 py-1 items-center flex h-[46px] shadow-md">
                  <input
                    id="transfer-amount"
                    name="amount"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="any"
                    required
                    className="w-full border-none bg-transparent text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* asset dropdown */}
              <div className="w-[55%]">
                <label className="text-xs tracking-widest font-medium text-slate-500">
                  asset
                </label>
                <Dropdown
                  options={assetOptions}
                  value={asset}
                  onChange={(option) => setAsset(option.value)}
                />
              </div>
            </div>
          </div>

          {/* 2. destination and address */}
          <div className="space-y-2">
            {/* header */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  2. Where you want to go
                </p>
                <p className="text-xs text-slate-500">
                  Select destination chain & receiver address
                </p>
              </div>
            </div>

            {/* destionation chain dropdown */}
            <div>
              <label className="text-xs tracking-widest font-medium text-slate-500">
                destination chain
              </label>
              <Dropdown
                options={chainOptions}
                value={destinationChain}
                onChange={(option) => setDestinationChain(option.value)}
                buttonClassName="bg-white/80"
              />
            </div>

            <div>
              <label
                htmlFor="transfer-address"
                className="text-xs tracking-widest font-medium text-slate-500"
              >
                receiver address
              </label>
              <div className="rounded-2xl border border-white/60 bg-white/75 px-3 py-1 items-center flex h-[46px] shadow-md">
                <input
                  id="transfer-address"
                  name="address"
                  type="text"
                  required
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full border-none bg-transparent text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400"
                  placeholder="0x123... destination"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3. submit button */}
        <div className="flex w-full gap-5">
          {/* hidden form controls to mirror dropdown selections */}
          <input type="hidden" name="asset" value={asset} />
          <input type="hidden" name="originChain" value={originChain} />
          <input
            type="hidden"
            name="destinationChain"
            value={destinationChain}
          />
          <div className="flex w-full px-10 items-center justify-center mt-15">
            <LiquidGlassButton
              type="submit"
              disabled={isSubmitting}
              className="flex-1 justify-center text-center"
            >
              {isSubmitting ? 'Submitting...' : 'Submit transfer'}
            </LiquidGlassButton>
          </div>
        </div>
      </div>
    </form>
  );
}

export default TransferPanel;
