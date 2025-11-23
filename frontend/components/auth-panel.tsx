"use client"

import { useCallback, useMemo } from "react"
import { Copy, Loader2, LogOut, Wallet } from "lucide-react"
import { useAccount, useBalance, useConnect, useDisconnect, useSwitchChain } from "wagmi"

import { Dropdown, type DropdownOption } from "./ui/dropdown"
import { LiquidGlassButton } from "./ui/liquid-glass-button"

const formatAddress = (value?: string) =>
  value ? `${value.slice(0, 6)}...${value.slice(-4)}` : ""

const AuthPanel = () => {
  const { address, chain, isConnected, status: accountStatus } = useAccount()
  const { data: balance, isLoading: isBalanceLoading } = useBalance({
    address,
    chainId: chain?.id,
    query: { enabled: Boolean(address) },
  })
  const { connectAsync, connectors, isPending: isConnectPending } = useConnect()
  const { disconnectAsync, isPending: isDisconnectPending } = useDisconnect()
  const {
    switchChainAsync,
    chains: switchableChains,
    isPending: isSwitchPending,
  } = useSwitchChain()

  const isActionPending =
    isConnectPending ||
    isDisconnectPending ||
    isSwitchPending ||
    accountStatus === "connecting" ||
    accountStatus === "reconnecting"

  const formattedAddress = useMemo(
    () => formatAddress(address),
    [address]
  )

  const balanceDisplay = useMemo(() => {
    if (!isConnected || !address) {
      return "0.000 ETH"
    }
    if (isBalanceLoading) {
      return "..."
    }
    if (balance == null) {
      return "--"
    }

    const formatted = Number(balance.formatted).toLocaleString(undefined, {
      maximumFractionDigits: 4,
    })

    return `${formatted} ${balance.symbol}`
  }, [address, balance, isBalanceLoading, isConnected])

  const handleLogin = useCallback(async () => {
    const connector = connectors[0]
    if (!connector) {
      console.warn("No wallet connectors available.")
      return
    }

    try {
      await connectAsync({ connector })
    } catch (error) {
      console.error("Failed to connect wallet", error)
    }
  }, [connectAsync, connectors])

  const handleLogout = useCallback(async () => {
    try {
      await disconnectAsync()
    } catch (error) {
      console.error("Failed to disconnect wallet", error)
    }
  }, [disconnectAsync])

  const handleCopyAddress = useCallback(async () => {
    if (!address) {
      return
    }

    try {
      await navigator.clipboard.writeText(address)
    } catch (error) {
      console.error("Failed to copy address", error)
    }
  }, [address])

  const networkOptions = useMemo(
    () =>
      switchableChains.map((item) => ({
        value: String(item.id),
        label: item.name,
      })),
    [switchableChains]
  )

  const currentNetworkValue = useMemo(
    () => (chain?.id ? String(chain.id) : undefined),
    [chain?.id]
  )

  const resolvedNetworkValue = useMemo(
    () => currentNetworkValue ?? networkOptions[0]?.value,
    [currentNetworkValue, networkOptions]
  )

  const handleNetworkChange = useCallback(
    async (option: DropdownOption) => {
      if (isActionPending) {
        return
      }

      const targetChain = switchableChains.find(
        (item) => String(item.id) === option.value
      )
      if (!targetChain || targetChain.id === chain?.id) {
        return
      }

      if (!switchChainAsync) {
        console.warn("Switch chain is not available.")
        return
      }

      try {
        await switchChainAsync({ chainId: targetChain.id })
      } catch (error) {
        console.error("Failed to switch chain", error)
      }
    },
    [chain?.id, isActionPending, switchChainAsync, switchableChains]
  )

  return (
    <div className="flex h-full flex-col p-6">
      <div className="flex-1">
        {isConnected ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Connected Status Chip */}
            <div className="flex items-center justify-center">
              <div  className="gap-1.5 border-green-200 bg-green-50 px-3 py-1 text-green-700">
                <div className="h-1.5 w-1.5 rounded-full bg-green-600 animate-pulse" />
                Wallet Connected
              </div>
            </div>

            {/* Wallet Info Card */}
            <div className="overflow-hidden border-slate-200 bg-slate-50/50 p-0">
              <div className="bg-linear-to-r from-slate-900 to-slate-800 p-4 text-white">
                <div className="mb-1 text-xs text-slate-400">Total Balance</div>
                <div className="text-2xl font-bold">{balanceDisplay}</div>
              </div>
              <div className="p-4">
                <div className="mb-1 text-xs font-medium text-slate-500">Wallet Address</div>
                <div className="flex items-center justify-between rounded-md bg-white px-3 py-2 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="rounded-full bg-indigo-100 p-1.5 text-indigo-600">
                      <Wallet className="h-3.5 w-3.5" />
                    </div>
                    <span className="font-mono text-sm font-medium text-slate-700">{formattedAddress}</span>
                  </div>
                  <button
                    className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                    onClick={handleCopyAddress}
                    disabled={!address || isActionPending}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="mt-4 space-y-2 h-[200px]">
                  <div className="text-xs font-medium text-slate-500">Network</div>
                  <Dropdown
                    options={networkOptions}
                    value={resolvedNetworkValue}
                    onChange={handleNetworkChange}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center space-y-6 text-center">
            <div className="relative">
              <div className="absolute -inset-4 rounded-full bg-indigo-500/20 blur-xl" />
              <div className="relative rounded-full bg-white p-4 shadow-xl ring-1 ring-slate-900/5">
                <Wallet className="h-8 w-8 text-indigo-600" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-slate-900">Connect your wallet</h3>
              <p className="max-w-[250px] text-sm text-slate-500">
                Connect securely to access your dashboard and manage your assets.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Actions Footer */}
      <div className="space-y-3 h-[150px]">
        {isConnected ? (
          <>
            <LiquidGlassButton  className="flex items-center justify-center h-10 w-full gap-2" onClick={handleLogout} disabled={isActionPending}>
              <p>Logout</p>
              <LogOut className="h-4 w-4" />
            </LiquidGlassButton>
          </>
        ) : (
          <LiquidGlassButton
            className="w-full gap-2 h-10 flex items-center justify-center"
            onClick={handleLogin}
            disabled={isActionPending || connectors.length === 0}
          >
            {isActionPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
              </>
            ) : (
              <>Connect Wallet</>
            )}
          </LiquidGlassButton>
        )}
      </div>
    </div>
  )
}

export default AuthPanel
