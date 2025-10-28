"use client";

import { useApp } from "@/app/providers";

export function NetworkWarning() {
  const { wallet } = useApp();

  if (!wallet.isConnected) return null;

  const isSupportedNetwork = wallet.chainId === 31337 || wallet.chainId === 11155111;

  if (isSupportedNetwork) return null;

  const switchToHardhat = async () => {
    if (!wallet.rawProvider) return;

    try {
      await wallet.rawProvider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x7a69" }], // 31337 in hex
      });
    } catch (error: any) {
      console.error("Failed to switch network:", error);
      alert("Please manually switch to Hardhat network (Chain ID: 31337)");
    }
  };

  const switchToSepolia = async () => {
    if (!wallet.rawProvider) return;

    try {
      await wallet.rawProvider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0xaa36a7" }], // 11155111 in hex
      });
    } catch (error: any) {
      // Network not added, try to add it
      if (error.code === 4902) {
        try {
          await wallet.rawProvider.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0xaa36a7",
                chainName: "Sepolia Testnet",
                nativeCurrency: {
                  name: "Sepolia ETH",
                  symbol: "ETH",
                  decimals: 18,
                },
                rpcUrls: ["https://rpc.sepolia.org"],
                blockExplorerUrls: ["https://sepolia.etherscan.io"],
              },
            ],
          });
        } catch (addError) {
          console.error("Failed to add network:", addError);
          alert("Please manually add Sepolia network to your wallet");
        }
      } else {
        console.error("Failed to switch network:", error);
        alert("Please manually switch to Sepolia network");
      }
    }
  };

  return (
    <div className="fixed top-20 left-0 right-0 z-40 mx-4">
      <div className="max-w-4xl mx-auto">
        <div className="glass border-2 border-red-500 p-4 rounded-lg">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 text-2xl">⚠️</div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-700 mb-2">
                Unsupported Network
              </h3>
              <p className="text-sm text-gray-700 mb-3">
                You are connected to chain ID {wallet.chainId}. Please switch to a
                supported network:
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={switchToHardhat}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                >
                  Switch to Hardhat (Local)
                </button>
                <button
                  onClick={switchToSepolia}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Switch to Sepolia (Testnet)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

