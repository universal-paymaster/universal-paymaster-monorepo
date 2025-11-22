'use client';

import React, { useMemo, useState } from 'react';

type TransferPanelProps = {
  onClose?: () => void;
  className?: string;
};

const assetOptions = ['ETH', 'BTC', 'USDC'];
const chainOptions = ['Ethereum', 'Polygon', 'Base'];

const TransferPanel: React.FC<TransferPanelProps> = ({
  className,
  onClose,
}) => {
  const [asset, setAsset] = useState(assetOptions[0]);
  const [chain, setChain] = useState(chainOptions[0]);
  const [amount, setAmount] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const amountValue = useMemo(() => Number(amount), [amount]);
  const isAmountValid = Number.isFinite(amountValue) && amountValue > 0;
  const isAddressValid = address.trim().length > 0;
  const isFormValid = isAmountValid && isAddressValid;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!isFormValid) {
      setError('Enter a valid amount and receiver address.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        asset,
        amount: amountValue,
        chain,
        address: address.trim(),
      };

      // Replace with actual transfer action when backend or wallet wiring is ready.
      console.log('Submitting transfer:', payload);

      onClose?.();
    } catch (err) {
      setError('Something went wrong while submitting the transfer.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div>
        <label htmlFor="transfer-asset">Asset</label>
        <select
          id="transfer-asset"
          value={asset}
          onChange={(event) => setAsset(event.target.value)}
        >
          {assetOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="transfer-amount">Amount</label>
        <input
          id="transfer-amount"
          type="number"
          inputMode="decimal"
          min="0"
          step="any"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          required
        />
      </div>

      <div>
        <label htmlFor="transfer-chain">Chain</label>
        <select
          id="transfer-chain"
          value={chain}
          onChange={(event) => setChain(event.target.value)}
        >
          {chainOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="transfer-address">Receiver address</label>
        <input
          id="transfer-address"
          type="text"
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          required
          autoComplete="off"
          spellCheck={false}
        />
      </div>

      {error && <p role="alert">{error}</p>}

      <div>
        <button type="submit" disabled={!isFormValid || isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit transfer'}
        </button>
        {onClose && (
          <button type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default TransferPanel;
