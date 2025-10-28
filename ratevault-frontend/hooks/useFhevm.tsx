"use client";

import { useState, useEffect } from "react";
import { FhevmInstance } from "@/fhevm/fhevmTypes";
import { createFhevmInstance } from "@/fhevm/fhevm";

export function useFhevm(rawProvider: any, chainId: number | null) {
  const [instance, setInstance] = useState<FhevmInstance | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    if (!rawProvider || !chainId) {
      setInstance(null);
      return;
    }

    // Only initialize for supported networks
    const isSupportedNetwork = chainId === 31337 || chainId === 11155111;
    if (!isSupportedNetwork) {
      setInstance(null);
      setError(`Unsupported network (Chain ID: ${chainId}). Please switch to Hardhat (31337) or Sepolia (11155111).`);
      setIsLoading(false);
      return;
    }

    const initInstance = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const fhevmInstance = await createFhevmInstance({
          provider: rawProvider, // Use raw EIP-1193 provider
          onStatusChange: (s) => setStatus(s),
        });

        setInstance(fhevmInstance);
      } catch (err: any) {
        console.error("Failed to create FHEVM instance:", err);
        
        // Provide helpful error messages
        let errorMessage = err.message || "Failed to initialize FHEVM";
        
        if (errorMessage.includes("could not decode result data")) {
          errorMessage = "Failed to connect to FHEVM network. Please ensure you're connected to Hardhat (local) or Sepolia testnet.";
        } else if (errorMessage.includes("threads")) {
          errorMessage = "Browser does not support FHEVM. Please use Chrome, Edge, or Firefox with SharedArrayBuffer support.";
        }
        
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    initInstance();
  }, [rawProvider, chainId]);

  return { instance, isLoading, error, status };
}

