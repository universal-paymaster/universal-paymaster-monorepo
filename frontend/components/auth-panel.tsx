"use client"

import { LiquidGlassButton } from "./ui/liquid-glass-button"
import { useCallback, useState } from "react"
import { Wallet, LogOut, Copy, Loader2 } from "lucide-react"



const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const AuthPanel = () => {
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [address, setAddress] = useState("")

  const handleLogin = useCallback(async () => {
    setIsConnecting(true)
    try {
      // Mock connection delay
      await delay(1500)
      // Mock ETH address
      setAddress("0x71C...9A23")
      setIsConnected(true)
    } finally {
      setIsConnecting(false)
    }
  }, [])

  const handleLogout = useCallback(async () => {
    setIsConnecting(true)
    try {
      await delay(800)
      setIsConnected(false)
      setAddress("")
    } finally {
      setIsConnecting(false)
    }
  }, [])

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
                <div className="text-2xl font-bold">14.203 ETH</div>
              </div>
              <div className="p-4">
                <div className="mb-1 text-xs font-medium text-slate-500">Wallet Address</div>
                <div className="flex items-center justify-between rounded-md bg-white border px-3 py-2 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="rounded-full bg-indigo-100 p-1.5 text-indigo-600">
                      <Wallet className="h-3.5 w-3.5" />
                    </div>
                    <span className="font-mono text-sm font-medium text-slate-700">{address}</span>
                  </div>
                  <button className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                    <Copy className="h-3.5 w-3.5" />
                  </button>
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
            <LiquidGlassButton  className="flex items-center justify-center h-10 w-full gap-2" onClick={handleLogout} disabled={isConnecting}>
              <p>Logout</p>
              <LogOut className="h-4 w-4" />
            </LiquidGlassButton>
          </>
        ) : (
          <LiquidGlassButton
            className="w-full gap-2 h-10 flex items-center justify-center"
            onClick={handleLogin}
            disabled={isConnecting}
          >
            {isConnecting ? (
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
