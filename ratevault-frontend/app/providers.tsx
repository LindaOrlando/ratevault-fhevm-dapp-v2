"use client";

import { createContext, useContext, ReactNode } from "react";
import { useWallet } from "@/hooks/useWallet";
import { useFhevm } from "@/hooks/useFhevm";
import { useRatingVault } from "@/hooks/useRatingVault";

interface AppContextType {
  wallet: ReturnType<typeof useWallet>;
  fhevm: ReturnType<typeof useFhevm>;
  ratingVault: ReturnType<typeof useRatingVault>;
}

const AppContext = createContext<AppContextType | null>(null);

export function Providers({ children }: { children: ReactNode }) {
  const wallet = useWallet();
  const fhevm = useFhevm(wallet.rawProvider, wallet.chainId); // Use rawProvider instead of provider
  const ratingVault = useRatingVault(wallet.signer, wallet.provider, fhevm.instance, wallet.chainId);

  return (
    <AppContext.Provider value={{ wallet, fhevm, ratingVault }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within Providers");
  }
  return context;
}

