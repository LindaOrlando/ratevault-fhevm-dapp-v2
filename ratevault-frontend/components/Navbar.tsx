"use client";

import Link from "next/link";
import { useApp } from "@/app/providers";
import { useState } from "react";

export function Navbar() {
  const { wallet } = useApp();
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getNetworkName = (chainId: number) => {
    switch (chainId) {
      case 1:
        return "Ethereum";
      case 11155111:
        return "Sepolia";
      case 31337:
        return "Hardhat";
      default:
        return `Chain ${chainId}`;
    }
  };

  return (
    <>
      <nav className="glass border-b border-purple-200/20 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">
                RateVault
              </div>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-6">
              <Link
                href="/"
                className="text-gray-700 hover:text-purple-600 transition-colors"
              >
                Home
              </Link>
              <Link
                href="/explore"
                className="text-gray-700 hover:text-purple-600 transition-colors"
              >
                Explore Ratings
              </Link>
              <Link
                href="/my"
                className="text-gray-700 hover:text-purple-600 transition-colors"
              >
                My Dashboard
              </Link>
            </div>

            {/* Wallet Connection */}
            <div>
              {!wallet.isConnected ? (
                <button
                  onClick={() => setShowWalletModal(true)}
                  disabled={wallet.isConnecting}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {wallet.isConnecting ? "Connecting..." : "Connect Wallet"}
                </button>
              ) : (
                <div className="relative">
                  <button
                    onClick={() => setShowAccountMenu(!showAccountMenu)}
                    className="px-4 py-2 glass rounded-lg flex items-center space-x-2 hover:bg-white/80 transition-colors"
                  >
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-mono text-sm">{formatAddress(wallet.address!)}</span>
                    <span className="text-xs text-gray-500">
                      {wallet.chainId && getNetworkName(wallet.chainId)}
                    </span>
                  </button>

                  {/* Account Menu */}
                  {showAccountMenu && (
                    <div className="absolute right-0 mt-2 w-64 glass rounded-lg shadow-xl p-4">
                      <div className="mb-3">
                        <div className="text-xs text-gray-500 mb-1">Account</div>
                        <div className="font-mono text-sm break-all">{wallet.address}</div>
                      </div>
                      <div className="mb-3">
                        <div className="text-xs text-gray-500 mb-1">Network</div>
                        <div className="text-sm">
                          {wallet.chainId && getNetworkName(wallet.chainId)}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          wallet.disconnectWallet();
                          setShowAccountMenu(false);
                        }}
                        className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      >
                        Disconnect
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Wallet Selection Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="glass rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Connect Wallet</h2>
              <button
                onClick={() => setShowWalletModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {wallet.availableWallets.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">No wallet detected</p>
                <p className="text-sm text-gray-500">
                  Please install MetaMask or another Web3 wallet
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {wallet.availableWallets.map((w) => (
                  <button
                    key={w.info.uuid}
                    onClick={() => {
                      wallet.connectWallet(w);
                      setShowWalletModal(false);
                    }}
                    className="w-full p-4 glass rounded-lg hover:bg-white/80 transition-colors flex items-center space-x-3"
                  >
                    {w.info.icon && (
                      <img src={w.info.icon} alt={w.info.name} className="w-8 h-8" />
                    )}
                    <span className="font-medium">{w.info.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

