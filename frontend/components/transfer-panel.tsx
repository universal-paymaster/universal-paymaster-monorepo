'use client';

import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { InfoBadge } from '@/components/ui/info-badge';
import { Input } from '@/components/ui/input';
import { LabeledField } from '@/components/ui/labeled-field';
import { LiquidGlassButton } from '@/components/ui/liquid-glass-button';
import { Select } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';

type TransferPanelProps = {
  onClose?: () => void;
  className?: string;
};

type AssetOption = {
  symbol: string;
  name: string;
  network: string;
  balance: number;
};

type PaymasterToken = {
  symbol: string;
  name: string;
  network: string;
  feeRate: number;
};

type NetworkOption = {
  value: string;
  label: string;
};

type TransferFormState = {
  assetSymbol: string;
  amount: string;
  recipient: string;
  paymasterSymbol: string;
  network: string;
};

type TransferStatus = 'idle' | 'loading' | 'success' | 'error';
type ResourceStatus = 'idle' | 'loading' | 'ready' | 'error';

type EnsState = {
  status: 'idle' | 'loading' | 'resolved' | 'error';
  address: string | null;
};

type TransferReceipt = {
  hash: string;
  asset: string;
  amount: string;
  recipient: string;
  alias?: string | null;
  paymaster: string;
  network: string;
  timestamp: string;
};

type ReviewSnapshot = {
  asset: AssetOption;
  paymaster: PaymasterToken;
  network: NetworkOption;
  amount: string;
  typedRecipient: string;
  resolvedRecipient: string;
  estimatedFee: number;
};

const MOCK_ASSETS: AssetOption[] = [
  {
    symbol: 'USDC',
    name: 'USD Coin',
    network: 'Ethereum Mainnet',
    balance: 182.44,
  },
  {
    symbol: 'WETH',
    name: 'Wrapped Ether',
    network: 'Ethereum Mainnet',
    balance: 11.782,
  },
  {
    symbol: 'DAI',
    name: 'MakerDAO DAI',
    network: 'Ethereum Mainnet',
    balance: 256.71,
  },
];

const MOCK_PAYMASTERS: PaymasterToken[] = [
  {
    symbol: 'DAI',
    name: 'MakerDAO DAI',
    network: 'Ethereum Mainnet',
    feeRate: 0.0018,
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    network: 'Ethereum Mainnet',
    feeRate: 0.0015,
  },
  {
    symbol: 'OP',
    name: 'Optimism',
    network: 'Optimism',
    feeRate: 0.0038,
  },
];

const NETWORK_OPTIONS: NetworkOption[] = [
  { value: 'ethereum-mainnet', label: 'Ethereum Mainnet' },
  { value: 'optimism', label: 'Optimism' },
];

const EXPLORER_BASE_URL = 'https://etherscan.io/tx/';
const ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;
const ENS_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.eth$/i;
const MOCK_ENS_DIRECTORY: Record<string, string> = {
  'vitalik.eth': '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
  'singas.eth': '0x1234567890abcdef1234567890ABCDEF12345678',
};
const BASE_FEE_MULTIPLIER = 12;

function createInitialFormState(): TransferFormState {
  return {
    assetSymbol: '',
    amount: '',
    recipient: '',
    paymasterSymbol: '',
    network: NETWORK_OPTIONS[0]?.value ?? '',
  };
}

export function TransferPanel({ onClose, className }: TransferPanelProps) {
  const [formState, setFormState] = useState<TransferFormState>(
    createInitialFormState
  );
  const [uiStep, setUiStep] = useState<'form' | 'review'>('form');
  const [reviewSnapshot, setReviewSnapshot] = useState<ReviewSnapshot | null>(
    null
  );
  const { options: assets, status: assetsStatus } =
    useAsyncOptions(fetchAvailableAssets);
  const { options: paymasters, status: paymastersStatus } =
    useAsyncOptions(fetchPaymasterTokens);
  const [status, setStatus] = useState<TransferStatus>('idle');
  const [requestError, setRequestError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<TransferReceipt | null>(null);
  const ensState = useEnsResolution(formState.recipient);

  useEffect(() => {
    if (status !== 'success' && status !== 'error') {
      return;
    }
    const timer = window.setTimeout(() => {
      setStatus('idle');
    }, 2200);
    return () => window.clearTimeout(timer);
  }, [status]);

  const resolvedAssetSymbol =
    formState.assetSymbol || (assets[0]?.symbol ?? '');
  const resolvedPaymasterSymbol =
    formState.paymasterSymbol || (paymasters[0]?.symbol ?? '');

  const selectedAsset = useMemo(
    () => assets.find((asset) => asset.symbol === resolvedAssetSymbol) || null,
    [assets, resolvedAssetSymbol]
  );
  const selectedPaymaster = useMemo(
    () =>
      paymasters.find((token) => token.symbol === resolvedPaymasterSymbol) ||
      null,
    [paymasters, resolvedPaymasterSymbol]
  );
  const selectedNetwork = useMemo(
    () =>
      NETWORK_OPTIONS.find((network) => network.value === formState.network) ||
      null,
    [formState.network]
  );

  const normalizedRecipient = formState.recipient.trim();
  const isEnsInput = normalizedRecipient
    ? ENS_PATTERN.test(normalizedRecipient.toLowerCase())
    : false;
  const isHexRecipient = normalizedRecipient
    ? ADDRESS_PATTERN.test(normalizedRecipient)
    : false;
  const hasValidRecipient =
    isHexRecipient || (isEnsInput && ensState.status === 'resolved');

  const amountNumber = Number(formState.amount) || 0;
  const exceedsBalance = selectedAsset
    ? amountNumber > selectedAsset.balance
    : false;

  const amountError = (() => {
    if (!formState.amount) {
      return null;
    }
    if (amountNumber <= 0) {
      return 'Enter an amount greater than zero.';
    }
    if (exceedsBalance) {
      return 'Amount exceeds your available balance.';
    }
    return null;
  })();

  const recipientError = useMemo(() => {
    if (!normalizedRecipient) {
      return null;
    }
    if (isEnsInput) {
      if (ensState.status === 'error') {
        return 'Unable to resolve this ENS name.';
      }
      return null;
    }
    if (!isHexRecipient) {
      return 'Enter a valid 0x address.';
    }
    return null;
  }, [normalizedRecipient, isEnsInput, isHexRecipient, ensState.status]);

  const showRecipientError =
    Boolean(recipientError) && normalizedRecipient.length > 0;

  const recipientStatus = (() => {
    if (ensState.status === 'loading') {
      return { content: 'Resolving ENS…', tone: 'info' as const };
    }
    if (ensState.status === 'resolved' && ensState.address) {
      return {
        content: (
          <span>
            Resolved to <span className="font-mono">{ensState.address}</span>
          </span>
        ),
        tone: 'success' as const,
      };
    }
    if (showRecipientError && recipientError) {
      return { content: recipientError, tone: 'error' as const };
    }
    return {
      content: 'Paste a wallet address or ENS name to continue.',
      tone: 'muted' as const,
    };
  })();

  const estimatedFee = selectedPaymaster
    ? BASE_FEE_MULTIPLIER * selectedPaymaster.feeRate
    : 0;
  const formattedFee = estimatedFee
    ? `${formatNumber(estimatedFee)} ${selectedPaymaster?.symbol ?? ''}`
    : '—';

  const canSubmit =
    assetsStatus === 'ready' &&
    paymastersStatus === 'ready' &&
    Boolean(selectedAsset) &&
    Boolean(selectedPaymaster) &&
    Boolean(selectedNetwork) &&
    !!formState.amount &&
    !amountError &&
    !recipientError &&
    hasValidRecipient;

  const finalRecipient = isEnsInput
    ? ensState.address ?? normalizedRecipient
    : normalizedRecipient;

  const handleFieldChange = <T extends keyof TransferFormState>(
    field: T,
    value: TransferFormState[T]
  ) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleMaxAmount = () => {
    if (!selectedAsset) return;
    handleFieldChange('amount', String(selectedAsset.balance));
  };

  const resetFormAfterSend = () => {
    setFormState((prev) => ({
      ...createInitialFormState(),
      assetSymbol: prev.assetSymbol,
      paymasterSymbol: prev.paymasterSymbol,
      network: prev.network,
    }));
  };

  const handleConfirmDetails = () => {
    if (
      !canSubmit ||
      !selectedAsset ||
      !selectedPaymaster ||
      !selectedNetwork ||
      !finalRecipient
    ) {
      return;
    }
    setReviewSnapshot({
      asset: selectedAsset,
      paymaster: selectedPaymaster,
      network: selectedNetwork,
      amount: formState.amount,
      typedRecipient: formState.recipient.trim(),
      resolvedRecipient: finalRecipient,
      estimatedFee,
    });
    setReceipt(null);
    setRequestError(null);
    setStatus('idle');
    setUiStep('review');
  };

  const handleBackToEdit = () => {
    setUiStep('form');
    setReviewSnapshot(null);
    setReceipt(null);
    setRequestError(null);
    setStatus('idle');
  };

  const handleSendTransfer = async () => {
    if (!reviewSnapshot || status === 'loading') {
      return;
    }
    setStatus('loading');
    setRequestError(null);

    try {
      const payload = {
        asset: reviewSnapshot.asset.symbol,
        amount: reviewSnapshot.amount,
        recipient: reviewSnapshot.resolvedRecipient,
        paymaster: reviewSnapshot.paymaster.symbol,
        network: reviewSnapshot.network.value,
      };
      const result = await sendTransfer(payload);
      setReceipt({
        hash: result.hash,
        asset: payload.asset,
        amount: payload.amount,
        recipient: payload.recipient,
        alias:
          reviewSnapshot.typedRecipient !== reviewSnapshot.resolvedRecipient
            ? reviewSnapshot.typedRecipient
            : null,
        paymaster: payload.paymaster,
        network: reviewSnapshot.network.label,
        timestamp: new Date().toISOString(),
      });
      setStatus('success');
      resetFormAfterSend();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to submit transfer right now.';
      setRequestError(message);
      setStatus('error');
    }
  };

  const panelClassName = [
    'flex h-full w-full flex-col gap-5 text-slate-900',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const reviewStatus = {
    idle: { label: 'Review', tone: 'indigo' as StatusTone },
    loading: { label: 'Sending', tone: 'amber' as StatusTone },
    success: { label: 'Sent', tone: 'emerald' as StatusTone },
    error: { label: 'Retry', tone: 'rose' as StatusTone },
  }[status];

  const renderAssetSection = () => (
    <section className="space-y-3">
      <SectionHeader
        title="Asset & amount"
        statusLabel={assetsStatus === 'loading' ? 'Syncing…' : undefined}
      />

      <div className="grid gap-4 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)]">
        <LabeledField label="Asset">
          <Select
            value={resolvedAssetSymbol}
            onChange={(value) => handleFieldChange('assetSymbol', value)}
            disabled={assetsStatus !== 'ready'}>
            <option value="" disabled>
              Select asset
            </option>
            {assets.map((asset) => (
              <option value={asset.symbol} key={asset.symbol}>
                {asset.symbol}
              </option>
            ))}
          </Select>
          <p className="mt-1 text-xs text-slate-500">
            {selectedAsset
              ? `${formatNumber(selectedAsset.balance)} ${
                  selectedAsset.symbol
                } available on ${selectedAsset.network}`
              : 'Fetching balances…'}
          </p>
        </LabeledField>
        <LabeledField label="Amount">
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Input
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                value={formState.amount}
                onChange={(event) =>
                  handleFieldChange('amount', event.target.value)
                }
                placeholder="0.00"
                disabled={assetsStatus !== 'ready'}
              />
              <LiquidGlassButton
                type="button"
                onClick={handleMaxAmount}
                disabled={!selectedAsset || assetsStatus !== 'ready'}
                className="shrink-0 px-4 py-2 text-xs uppercase tracking-[0.35em]">
                Max
              </LiquidGlassButton>
            </div>
            {amountError ? (
              <p className="text-xs font-medium text-rose-500">{amountError}</p>
            ) : (
              <p className="text-xs text-slate-500">
                Transfers settle instantly. You can reuse this flow anytime.
              </p>
            )}
          </div>
        </LabeledField>
      </div>
    </section>
  );

  const renderDestinationSection = () => (
    <section className="space-y-3">
      <SectionHeader title="Destination" />
      <div className="grid gap-4 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)]">
        <LabeledField label="Network">
          <Select
            value={formState.network}
            onChange={(value) => handleFieldChange('network', value)}>
            <option value="" disabled>
              Select network
            </option>
            {NETWORK_OPTIONS.map((network) => (
              <option key={network.value} value={network.value}>
                {network.label}
              </option>
            ))}
          </Select>
        </LabeledField>

        <LabeledField
          label={
            <span className="flex items-center gap-2">
              Recipient
              <InfoBadge content="Paste a 0x address or an ENS name." />
            </span>
          }>
          <div className="flex flex-col gap-2">
            <Input
              type="text"
              value={formState.recipient}
              onChange={(event) =>
                handleFieldChange('recipient', event.target.value)
              }
              placeholder="0x3aa1...c0fe"
              autoComplete="off"
              spellCheck={false}
            />
            <div className="h-5 text-xs">
              {recipientStatus && (
                <p
                  className={[
                    'h-full whitespace-nowrap overflow-hidden text-ellipsis',
                    recipientStatus.tone === 'info' && 'text-indigo-500',
                    recipientStatus.tone === 'success' && 'text-emerald-600',
                    recipientStatus.tone === 'error' &&
                      'font-medium text-rose-500',
                  ]
                    .filter(Boolean)
                    .join(' ')}>
                  {recipientStatus.content}
                </p>
              )}
            </div>
          </div>
        </LabeledField>
      </div>
    </section>
  );

  const renderPaymasterSection = () => (
    <section className="space-y-3">
      <SectionHeader
        title="Gas sponsor token"
        statusLabel={paymastersStatus === 'loading' ? 'Syncing…' : undefined}
      />

      <div className="grid gap-4 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)]">
        <LabeledField
          label={
            <span className="flex items-center gap-2">
              Pay with
              <InfoBadge content="You pay gas in this token via Singas. No native ETH required." />
            </span>
          }>
          <Select
            value={resolvedPaymasterSymbol}
            onChange={(value) => handleFieldChange('paymasterSymbol', value)}
            disabled={paymastersStatus !== 'ready'}>
            <option value="" disabled>
              Select token
            </option>
            {paymasters.map((token) => (
              <option key={token.symbol} value={token.symbol}>
                {token.symbol}
              </option>
            ))}
          </Select>
          <p className="mt-1 text-xs text-slate-500">
            You pay gas in this token via Singas.
          </p>
        </LabeledField>

        <LabeledField label="Estimated fee">
          <Input type="text" value={formattedFee} readOnly disabled />
          <p className="mt-1 text-xs text-slate-500">
            Fees update dynamically with network conditions.
          </p>
        </LabeledField>
      </div>
    </section>
  );

  const renderReviewSection = () => {
    if (!reviewSnapshot) {
      return null;
    }
    return (
      <section className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.45em] text-slate-500">
              Receipt preview
            </p>
            <h3 className="mt-1 text-lg font-semibold text-slate-900">
              Ready to send
            </h3>
            <p className="text-sm text-slate-600">
              Double-check the simulated receipt before we broadcast it on{' '}
              {reviewSnapshot.network.label}.
            </p>
          </div>
          <StatusPill label={reviewStatus.label} tone={reviewStatus.tone} />
        </div>
        <dl className="space-y-3 text-sm text-slate-700">
          <SummaryRow label="Asset">{reviewSnapshot.asset.symbol}</SummaryRow>
          <SummaryRow label="Amount">
            {reviewSnapshot.amount} {reviewSnapshot.asset.symbol}
          </SummaryRow>
          <SummaryRow label="Network">
            {reviewSnapshot.network.label}
          </SummaryRow>
          <SummaryRow label="Recipient">
            <span className="flex flex-col gap-0.5">
              <span className="font-mono text-xs text-slate-900">
                {truncateAddress(reviewSnapshot.resolvedRecipient)}
              </span>
              {reviewSnapshot.typedRecipient &&
                reviewSnapshot.typedRecipient.toLowerCase() !==
                  reviewSnapshot.resolvedRecipient.toLowerCase() && (
                  <span className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
                    via {reviewSnapshot.typedRecipient}
                  </span>
                )}
            </span>
          </SummaryRow>
          <SummaryRow label="Gas token">
            {reviewSnapshot.paymaster.symbol}
          </SummaryRow>
          <SummaryRow label="Estimated fee">
            {formatNumber(reviewSnapshot.estimatedFee)}{' '}
            {reviewSnapshot.paymaster.symbol}
          </SummaryRow>
        </dl>

        {receipt ? (
          <div className="space-y-3 rounded-2xl border border-emerald-200/70 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-600">
              Transfer queued
            </p>
            <SummaryRow label="Tx hash">
              <a
                href={`${EXPLORER_BASE_URL}${receipt.hash}`}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-xs text-emerald-600 underline decoration-dotted underline-offset-4">
                {truncateAddress(receipt.hash)}
              </a>
            </SummaryRow>
            <SummaryRow label="Sent">
              {receipt.amount} {receipt.asset}
            </SummaryRow>
            <SummaryRow label="Recipient">
              <span className="flex flex-col gap-0.5">
                <span className="font-mono text-xs text-slate-900">
                  {truncateAddress(receipt.recipient)}
                </span>
                {receipt.alias && (
                  <span className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
                    via {receipt.alias}
                  </span>
                )}
              </span>
            </SummaryRow>
            <SummaryRow label="Gas token">{receipt.paymaster}</SummaryRow>
            <SummaryRow label="Network">{receipt.network}</SummaryRow>
            <SummaryRow label="Timestamp">
              {new Date(receipt.timestamp).toLocaleString()}
            </SummaryRow>
          </div>
        ) : (
          <p className="text-xs text-slate-500">
            Once you send, Singas will issue the transaction and provide the
            final receipt here.
          </p>
        )}
      </section>
    );
  };

  return (
    <form
      className={panelClassName}
      onSubmit={(event) => event.preventDefault()}
      aria-busy={status === 'loading'}>
      <header className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.55em] text-slate-500">
              Transfer
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-900">
              Send funds via Singas
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Decide the asset, destination, and gas sponsor token inside a
              single flow. We handle the simulated gas spends for you.
            </p>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-200/80 px-3 py-1 text-xs font-semibold text-slate-500 shadow-[0_6px_18px_rgba(15,23,42,0.08)]">
              Close
            </button>
          )}
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-5">
        <div className="flex-1 space-y-5 overflow-y-auto overflow-x-visible px-1">
          {uiStep === 'form' ? (
            <>
              {renderAssetSection()}
              {renderDestinationSection()}
              {renderPaymasterSection()}
            </>
          ) : (
            renderReviewSection()
          )}
        </div>
        <div className="space-y-3">
          {uiStep === 'form' ? (
            <LiquidGlassButton
              type="button"
              disabled={!canSubmit}
              onClick={handleConfirmDetails}
              className="flex h-12 w-full items-center justify-center text-sm font-semibold">
              Confirm details
            </LiquidGlassButton>
          ) : (
            <div className="flex items-center gap-2">
              <LiquidGlassButton
                type="button"
                onClick={handleSendTransfer}
                disabled={status === 'loading'}
                className="flex h-12 flex-1 items-center justify-center gap-2 text-sm font-semibold">
                {status === 'loading' && <Spinner size="sm" tone="dark" />}
                {status === 'loading' ? 'Sending transfer…' : 'Send transfer'}
              </LiquidGlassButton>
              <button
                type="button"
                onClick={handleBackToEdit}
                className="flex h-12 w-12 items-center justify-center rounded-full border border-white/60 bg-white/70 text-slate-700 shadow-[0_18px_45px_rgba(15,23,42,0.12)] backdrop-blur-xl transition hover:-translate-y-0.5"
                aria-label="Go back and edit details">
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round">
                  <path d="M15 6l-6 6 6 6" />
                </svg>
              </button>
            </div>
          )}
          {status === 'success' && (
            <p className="text-sm font-medium text-emerald-600">
              Transfer queued. Singas will handle the rest.
            </p>
          )}
          {status === 'error' && requestError && (
            <p className="text-sm font-medium text-rose-500">{requestError}</p>
          )}
        </div>
      </div>
    </form>
  );
}

type StatusPillProps = {
  label: string;
  tone?: StatusTone;
};

type StatusTone = 'indigo' | 'amber' | 'emerald' | 'rose';

function StatusPill({ label, tone = 'indigo' }: StatusPillProps) {
  const toneClass = {
    indigo: 'border-indigo-100/70 bg-indigo-50/80 text-indigo-600',
    amber: 'border-amber-100/70 bg-amber-50/80 text-amber-600',
    emerald: 'border-emerald-100/70 bg-emerald-50/80 text-emerald-600',
    rose: 'border-rose-100/70 bg-rose-50/80 text-rose-600',
  }[tone];
  return (
    <span
      className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.35em] ${toneClass}`}>
      {label}
    </span>
  );
}

type SummaryRowProps = {
  label: string;
  children: ReactNode;
};

function SummaryRow({ label, children }: SummaryRowProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-500">
        {label}
      </span>
      <span className="text-[0.95rem] font-semibold text-slate-800">
        {children}
      </span>
    </div>
  );
}

type SectionHeaderProps = {
  title: string;
  statusLabel?: string;
};

function SectionHeader({ title, statusLabel }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3 text-[11px] font-semibold uppercase tracking-[0.45em] text-slate-500">
      <span>{title}</span>
      {statusLabel && (
        <span className="text-[10px] tracking-[0.35em] text-slate-400">
          {statusLabel}
        </span>
      )}
    </div>
  );
}

async function fetchAvailableAssets() {
  await sleep(500);
  return MOCK_ASSETS;
}

async function fetchPaymasterTokens() {
  await sleep(500);
  return MOCK_PAYMASTERS;
}

async function mockResolveEns(value: string) {
  await sleep(600);
  return MOCK_ENS_DIRECTORY[value.toLowerCase()] ?? null;
}

type SendTransferPayload = {
  asset: string;
  amount: string;
  recipient: string;
  paymaster: string;
  network: string;
};

async function sendTransfer(payload: SendTransferPayload) {
  console.log('[TransferPanel] sending transfer', payload);
  await sleep(2000);
  if (Math.random() < 0.25) {
    throw new Error('Paymaster rejected this transfer. Try another token.');
  }
  return { hash: generateMockHash() };
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(value);
}

function truncateAddress(value: string) {
  if (!value) return '—';
  if (value.length <= 12) {
    return value;
  }
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

function generateMockHash() {
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    const randomValues = crypto.getRandomValues(new Uint32Array(4));
    return (
      '0x' +
      Array.from(randomValues)
        .map((value) => value.toString(16).padStart(8, '0'))
        .join('')
        .slice(0, 64)
    );
  }
  const fallback = Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  return `0x${fallback}`;
}

function useEnsResolution(value: string) {
  const [state, setState] = useState<EnsState>({
    status: 'idle',
    address: null,
  });

  useEffect(() => {
    const input = value.trim();
    if (!input || !ENS_PATTERN.test(input.toLowerCase())) {
      const timer = window.setTimeout(() => {
        setState((prev) =>
          prev.status === 'idle' && prev.address === null
            ? prev
            : { status: 'idle', address: null }
        );
      }, 0);
      return () => window.clearTimeout(timer);
    }

    let cancelled = false;
    const loadingTimer = window.setTimeout(() => {
      if (!cancelled) {
        setState({ status: 'loading', address: null });
      }
    }, 0);

    (async () => {
      try {
        const resolved = await mockResolveEns(input);
        if (!cancelled) {
          setState(
            resolved
              ? { status: 'resolved', address: resolved }
              : { status: 'error', address: null }
          );
        }
      } catch (error) {
        console.error('[useEnsResolution] ENS lookup failed', error);
        if (!cancelled) {
          setState({ status: 'error', address: null });
        }
      }
    })();

    return () => {
      cancelled = true;
      window.clearTimeout(loadingTimer);
    };
  }, [value]);

  return state;
}

function useAsyncOptions<T>(loader: () => Promise<T[]>) {
  const [options, setOptions] = useState<T[]>([]);
  const [status, setStatus] = useState<ResourceStatus>('loading');

  const reload = useCallback(async () => {
    setStatus('loading');
    try {
      const data = await loader();
      setOptions(data);
      setStatus('ready');
    } catch (error) {
      console.error('[useAsyncOptions] Failed to fetch options', error);
      setStatus('error');
    }
  }, [loader]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void reload();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [reload]);

  return { options, status, reload };
}
