"use client";

import { useState, useEffect, useCallback } from "react";
import { BrowserProvider, JsonRpcSigner } from "ethers";

interface EIP6963ProviderInfo {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
}

interface EIP6963ProviderDetail {
  info: EIP6963ProviderInfo;
  provider: any;
}

interface WalletState {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
  rawProvider: any | null; // EIP-1193 provider
}

export function useWallet() {
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    address: null,
    chainId: null,
    provider: null,
    signer: null,
    rawProvider: null,
  });

  const [availableWallets, setAvailableWallets] = useState<EIP6963ProviderDetail[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);

  // Detect EIP-6963 wallets
  useEffect(() => {
    const wallets: EIP6963ProviderDetail[] = [];

    const handleProvider = (event: any) => {
      wallets.push(event.detail);
      setAvailableWallets([...wallets]);
    };

    window.addEventListener("eip6963:announceProvider", handleProvider);
    window.dispatchEvent(new Event("eip6963:requestProvider"));

    // Fallback to window.ethereum if no EIP-6963 wallets found
    setTimeout(() => {
      if (wallets.length === 0 && typeof window !== "undefined" && (window as any).ethereum) {
        const fallbackWallet: EIP6963ProviderDetail = {
          info: {
            uuid: "fallback",
            name: "Injected Wallet",
            icon: "",
            rdns: "injected",
          },
          provider: (window as any).ethereum,
        };
        wallets.push(fallbackWallet);
        setAvailableWallets([fallbackWallet]);
      }
    }, 100);

    return () => {
      window.removeEventListener("eip6963:announceProvider", handleProvider);
    };
  }, []);

  const connectWallet = useCallback(async (wallet: EIP6963ProviderDetail, silent = false) => {
    setIsConnecting(true);

    try {
      const provider = new BrowserProvider(wallet.provider);
      
      let accounts: string[];
      if (silent) {
        accounts = await wallet.provider.request({ method: "eth_accounts" });
      } else {
        accounts = await wallet.provider.request({ method: "eth_requestAccounts" });
      }

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found");
      }

      const signer = await provider.getSigner();
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);

      setWalletState({
        isConnected: true,
        address: accounts[0],
        chainId,
        provider,
        signer,
        rawProvider: wallet.provider, // Store the raw EIP-1193 provider
      });

      // Persist connection
      localStorage.setItem("wallet.connected", "true");
      localStorage.setItem("wallet.lastConnectorId", wallet.info.uuid);
      localStorage.setItem("wallet.lastConnectorRdns", wallet.info.rdns); // Store rdns as backup
      localStorage.setItem("wallet.lastAccounts", JSON.stringify(accounts));
      localStorage.setItem("wallet.lastChainId", chainId.toString());

      // Remove old listeners first
      wallet.provider.removeListener("accountsChanged", handleAccountsChanged);
      wallet.provider.removeListener("chainChanged", handleChainChanged);
      wallet.provider.removeListener("disconnect", handleDisconnect);

      // Listen to events
      wallet.provider.on("accountsChanged", handleAccountsChanged);
      wallet.provider.on("chainChanged", handleChainChanged);
      wallet.provider.on("disconnect", handleDisconnect);

    } catch (error: any) {
      console.error("Connect wallet error:", error);
      if (error.code === 4001) {
        alert("Connection rejected by user");
      }
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const handleAccountsChanged = async (accounts: string[]) => {
    if (accounts.length === 0) {
      disconnectWallet();
    } else {
      // Update address and signer
      if (walletState.provider) {
        const signer = await walletState.provider.getSigner();
        setWalletState((prev) => ({
          ...prev,
          address: accounts[0],
          signer,
        }));
        localStorage.setItem("wallet.lastAccounts", JSON.stringify(accounts));
        
        // Clear old decryption signatures
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith("fhevm.decryptionSignature.")) {
            localStorage.removeItem(key);
          }
        });
      }
      
      // Reload page to reinitialize FHEVM instance
      window.location.reload();
    }
  };

  const handleChainChanged = async (chainIdHex: string) => {
    const chainId = Number.parseInt(chainIdHex, 16);
    
    if (walletState.provider) {
      const signer = await walletState.provider.getSigner();
      setWalletState((prev) => ({
        ...prev,
        chainId,
        signer,
      }));
      localStorage.setItem("wallet.lastChainId", chainId.toString());
    }

    // Reload page on chain change (recommended by MetaMask)
    window.location.reload();
  };

  const disconnectWallet = useCallback(() => {
    setWalletState({
      isConnected: false,
      address: null,
      chainId: null,
      provider: null,
      signer: null,
      rawProvider: null,
    });

    localStorage.removeItem("wallet.connected");
    localStorage.removeItem("wallet.lastConnectorId");
    localStorage.removeItem("wallet.lastConnectorRdns");
    localStorage.removeItem("wallet.lastAccounts");
    localStorage.removeItem("wallet.lastChainId");

    // Clear decryption signatures
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("fhevm.decryptionSignature.")) {
        localStorage.removeItem(key);
      }
    });
  }, []);

  const handleDisconnect = useCallback(() => {
    disconnectWallet();
  }, [disconnectWallet]);

  // Silent reconnect on page load
  useEffect(() => {
    const reconnect = async () => {
      const connected = localStorage.getItem("wallet.connected");
      const lastConnectorId = localStorage.getItem("wallet.lastConnectorId");
      const lastConnectorRdns = localStorage.getItem("wallet.lastConnectorRdns");

      console.log("[Wallet] Reconnect check:", { 
        connected, 
        lastConnectorId, 
        lastConnectorRdns,
        walletsCount: availableWallets.length,
        walletInfos: availableWallets.map(w => ({ name: w.info.name, uuid: w.info.uuid, rdns: w.info.rdns }))
      });

      if (connected === "true" && (lastConnectorId || lastConnectorRdns) && availableWallets.length > 0) {
        // Try to find wallet by UUID first, then by rdns
        let wallet = availableWallets.find((w) => w.info.uuid === lastConnectorId);
        
        if (!wallet && lastConnectorRdns) {
          console.log("[Wallet] UUID not found, trying to match by rdns:", lastConnectorRdns);
          wallet = availableWallets.find((w) => w.info.rdns === lastConnectorRdns);
        }
        
        console.log("[Wallet] Found wallet for reconnect:", wallet?.info.name);
        
        if (wallet) {
          try {
            const accounts = await wallet.provider.request({ method: "eth_accounts" });
            console.log("[Wallet] Accounts from wallet:", accounts);
            
            if (accounts && accounts.length > 0) {
              console.log("[Wallet] Reconnecting with account:", accounts[0]);
              await connectWallet(wallet, true);
            } else {
              // Clear storage if no accounts
              console.log("[Wallet] No accounts found, clearing storage");
              localStorage.removeItem("wallet.connected");
              localStorage.removeItem("wallet.lastConnectorId");
              localStorage.removeItem("wallet.lastConnectorRdns");
              localStorage.removeItem("wallet.lastAccounts");
              localStorage.removeItem("wallet.lastChainId");
            }
          } catch (error) {
            console.error("[Wallet] Silent reconnect failed:", error);
            // Clear storage on error
            localStorage.removeItem("wallet.connected");
            localStorage.removeItem("wallet.lastConnectorId");
            localStorage.removeItem("wallet.lastConnectorRdns");
            localStorage.removeItem("wallet.lastAccounts");
            localStorage.removeItem("wallet.lastChainId");
          }
        } else {
          console.log("[Wallet] Wallet not found by UUID or rdns, clearing storage");
          localStorage.removeItem("wallet.connected");
          localStorage.removeItem("wallet.lastConnectorId");
          localStorage.removeItem("wallet.lastConnectorRdns");
        }
      }
    };

    // Add a small delay to ensure wallets are fully loaded
    const timer = setTimeout(() => {
      if (!walletState.isConnected) {
        reconnect();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [availableWallets, connectWallet, walletState.isConnected]);

  return {
    ...walletState,
    availableWallets,
    isConnecting,
    connectWallet,
    disconnectWallet,
  };
}

