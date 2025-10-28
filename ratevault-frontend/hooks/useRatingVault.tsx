"use client";

import { useState, useCallback } from "react";
import { Contract } from "ethers";
import { FhevmInstance } from "@/fhevm/fhevmTypes";
import { RatingVaultABI } from "@/abi/RatingVaultABI";
import { RatingVaultAddresses } from "@/abi/RatingVaultAddresses";
import { FhevmDecryptionSignature } from "@/fhevm/FhevmDecryptionSignature";

export interface Rating {
  id: bigint;
  creator: string;
  name: string;
  description: string;
  dimensions: string[];
  minScore: number;
  maxScore: number;
  deadline: bigint;
  active: boolean;
  participantCount: bigint;
  createdAt: bigint;
}

export function useRatingVault(
  signer: any,
  provider: any,
  fhevmInstance: FhevmInstance | null,
  chainId: number | null
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getContractAddress = useCallback(() => {
    if (!chainId) return null;
    const key = chainId.toString() as keyof typeof RatingVaultAddresses;
    return RatingVaultAddresses[key]?.address;
  }, [chainId]);

  const getContract = useCallback(
    (withSigner = false) => {
      const address = getContractAddress();
      if (!address) throw new Error("Contract not deployed on this network");

      return new Contract(address, RatingVaultABI.abi, withSigner ? signer : provider);
    },
    [signer, provider, getContractAddress]
  );

  const createRating = useCallback(
    async (params: {
      name: string;
      description: string;
      dimensions: string[];
      minScore: number;
      maxScore: number;
      deadline: number;
    }) => {
      setIsLoading(true);
      setError(null);

      try {
        const contract = getContract(true);
        const tx = await contract.createRating(
          params.name,
          params.description,
          params.dimensions,
          params.minScore,
          params.maxScore,
          params.deadline
        );

        const receipt = await tx.wait();
        
        // Extract rating ID from event
        const event = receipt.logs.find((log: any) => {
          try {
            const parsed = contract.interface.parseLog(log);
            return parsed?.name === "RatingCreated";
          } catch {
            return false;
          }
        });

        let ratingId = 0;
        if (event) {
          const parsed = contract.interface.parseLog(event);
          ratingId = Number(parsed?.args.ratingId);
        }

        return { success: true, txHash: tx.hash, ratingId };
      } catch (err: any) {
        console.error("Create rating error:", err);
        setError(err.message || "Failed to create rating");
        return { success: false, error: err.message };
      } finally {
        setIsLoading(false);
      }
    },
    [getContract]
  );

  const submitRating = useCallback(
    async (ratingId: number, scores: number[]) => {
      if (!fhevmInstance || !signer) {
        setError("FHEVM instance or signer not available");
        return { success: false };
      }

      setIsLoading(true);
      setError(null);

      try {
        const contractAddress = getContractAddress();
        if (!contractAddress) throw new Error("Contract address not found");

        const address = await signer.getAddress();

        // Create encrypted input
        const input = fhevmInstance.createEncryptedInput(contractAddress, address);
        
        for (const score of scores) {
          input.add32(score);
        }

        const encrypted = await input.encrypt();

        // Submit to contract (adapter already converts to hex strings)
        const contract = getContract(true);
        const tx = await contract.submitRating(ratingId, encrypted.handles, encrypted.inputProof);
        await tx.wait();

        return { success: true, txHash: tx.hash };
      } catch (err: any) {
        console.error("Submit rating error:", err);
        setError(err.message || "Failed to submit rating");
        return { success: false, error: err.message };
      } finally {
        setIsLoading(false);
      }
    },
    [fhevmInstance, signer, getContract, getContractAddress]
  );

  const getRating = useCallback(
    async (ratingId: number): Promise<Rating | null> => {
      try {
        const contract = getContract(false);
        const rating = await contract.getRating(ratingId);
        return rating;
      } catch (err: any) {
        console.error("Get rating error:", err);
        return null;
      }
    },
    [getContract]
  );

  const getRatings = useCallback(
    async (offset: number, limit: number): Promise<Rating[]> => {
      try {
        const contract = getContract(false);
        const ratings = await contract.getRatings(offset, limit);
        return ratings;
      } catch (err: any) {
        console.error("Get ratings error:", err);
        return [];
      }
    },
    [getContract]
  );

  const getMyRatedRatings = useCallback(
    async (userAddress: string): Promise<number[]> => {
      try {
        const contract = getContract(false);
        const ids = await contract.getMyRatedRatings(userAddress);
        return ids.map((id: bigint) => Number(id));
      } catch (err: any) {
        console.error("Get my rated ratings error:", err);
        return [];
      }
    },
    [getContract]
  );

  const getMyCreatedRatings = useCallback(
    async (userAddress: string): Promise<number[]> => {
      try {
        const contract = getContract(false);
        const ids = await contract.getMyCreatedRatings(userAddress);
        return ids.map((id: bigint) => Number(id));
      } catch (err: any) {
        console.error("Get my created ratings error:", err);
        return [];
      }
    },
    [getContract]
  );

  const closeRating = useCallback(
    async (ratingId: number) => {
      setIsLoading(true);
      setError(null);

      try {
        const contract = getContract(true);
        const tx = await contract.closeRating(ratingId);
        await tx.wait();

        return { success: true, txHash: tx.hash };
      } catch (err: any) {
        console.error("Close rating error:", err);
        setError(err.message || "Failed to close rating");
        return { success: false, error: err.message };
      } finally {
        setIsLoading(false);
      }
    },
    [getContract]
  );

  const getRatingCount = useCallback(async (): Promise<number> => {
    try {
      const contract = getContract(false);
      const count = await contract.ratingCount();
      return Number(count);
    } catch (err: any) {
      console.error("Get rating count error:", err);
      return 0;
    }
  }, [getContract]);

  // Decrypt user's own submitted rating
  const decryptMyRating = useCallback(
    async (ratingId: number): Promise<number[]> => {
      if (!fhevmInstance) {
        throw new Error("FHEVM instance not available");
      }

      if (!signer) {
        throw new Error("Signer not available");
      }

      try {
        setIsLoading(true);
        setError(null);

        const contract = getContract(false);
        const address = await signer.getAddress();

        // Get user's rating (encrypted handles)
        const userScores = await contract.getMyRating(ratingId);
        
        if (!userScores || userScores.length === 0) {
          throw new Error("You haven't rated this yet");
        }

        const contractAddress = getContractAddress();
        if (!contractAddress) throw new Error("Contract address not found");

        console.log("[Decrypt] Getting decryption signature...");
        
        // Get or create decryption signature
        // Both Mock and Real modes use the same API
        const sig = await FhevmDecryptionSignature.loadOrSign(
          fhevmInstance,
          [contractAddress],
          signer
        );

        if (!sig) {
          throw new Error("Failed to create decryption signature. Please try again.");
        }

        console.log("[Decrypt] Calling userDecrypt...");

        // Prepare handles for decryption
        const handles = userScores.map((score: any) => ({
          handle: score,
          contractAddress: contractAddress,
        }));

        // Call FHEVM userDecrypt
        // MockFhevmInstance implements the same API as real FHEVM
        const decryptedResults = await fhevmInstance.userDecrypt(
          handles,
          sig.privateKey,
          sig.publicKey,
          sig.signature,
          sig.contractAddresses,
          sig.userAddress,
          sig.startTimestamp,
          sig.durationDays
        );

        console.log("[Decrypt] Decryption completed!");

        // Extract decrypted values
        const decryptedScores = userScores.map((score: any) => {
          const value = decryptedResults[score];
          return typeof value === 'bigint' ? Number(value) : Number(value);
        });

        return decryptedScores;
        
      } catch (err: any) {
        console.error("Decrypt my rating error:", err);
        setError(err.message || "Failed to decrypt your rating");
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [fhevmInstance, signer, getContract]
  );

  // Decrypt aggregated statistics (creator only)
  const decryptAggregatedScores = useCallback(
    async (ratingId: number): Promise<number[]> => {
      if (!fhevmInstance) {
        throw new Error("FHEVM instance not available");
      }

      if (!signer) {
        throw new Error("Signer not available");
      }

      try {
        setIsLoading(true);
        setError(null);

        const contract = getContract(false);
        const address = await signer.getAddress();
        const rating = await contract.ratings(ratingId);

        // Check if user is creator
        if (rating.creator.toLowerCase() !== address.toLowerCase()) {
          throw new Error("Only creator can decrypt aggregated statistics");
        }

        // Get aggregated scores (encrypted handles)
        const aggregatedScores = await contract.getAggregatedScores(ratingId);
        
        if (!aggregatedScores || aggregatedScores.length === 0) {
          throw new Error("No aggregated scores available");
        }

        const contractAddress = getContractAddress();
        if (!contractAddress) throw new Error("Contract address not found");

        console.log("[Decrypt] Getting decryption signature...");
        
        // Get or create decryption signature
        // Both Mock and Real modes use the same API
        const sig = await FhevmDecryptionSignature.loadOrSign(
          fhevmInstance,
          [contractAddress],
          signer
        );

        if (!sig) {
          throw new Error("Failed to create decryption signature. Please try again.");
        }

        console.log("[Decrypt] Calling userDecrypt...");

        // Prepare handles for decryption
        const handles = aggregatedScores.map((score: any) => ({
          handle: score,
          contractAddress: contractAddress,
        }));

        // Call FHEVM userDecrypt
        // MockFhevmInstance implements the same API as real FHEVM
        const decryptedResults = await fhevmInstance.userDecrypt(
          handles,
          sig.privateKey,
          sig.publicKey,
          sig.signature,
          sig.contractAddresses,
          sig.userAddress,
          sig.startTimestamp,
          sig.durationDays
        );

        console.log("[Decrypt] Decryption completed!");

        // Extract decrypted values
        const decryptedScores = aggregatedScores.map((score: any) => {
          const value = decryptedResults[score];
          return typeof value === 'bigint' ? Number(value) : Number(value);
        });

        return decryptedScores;
        
      } catch (err: any) {
        console.error("Decrypt aggregated scores error:", err);
        setError(err.message || "Failed to decrypt statistics");
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [fhevmInstance, signer, getContract]
  );

  return {
    createRating,
    submitRating,
    getRating,
    getRatings,
    getMyRatedRatings,
    getMyCreatedRatings,
    closeRating,
    getRatingCount,
    decryptMyRating,
    decryptAggregatedScores,
    isLoading,
    error,
    contractAddress: getContractAddress(),
  };
}

