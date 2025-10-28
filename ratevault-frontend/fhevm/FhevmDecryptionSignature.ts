import { ethers } from "ethers";
import { FhevmInstance, EIP712Type } from "./fhevmTypes";

function timestampNow(): number {
  return Math.floor(Date.now() / 1000);
}

interface FhevmDecryptionSignatureData {
  publicKey: string;
  privateKey: string;
  contractAddresses: `0x${string}`[];
  startTimestamp: number;
  durationDays: number;
  signature: string;
  userAddress: `0x${string}`;
  eip712: EIP712Type;
}

export class FhevmDecryptionSignature {
  public readonly publicKey: string;
  public readonly privateKey: string;
  public readonly contractAddresses: `0x${string}`[];
  public readonly startTimestamp: number;
  public readonly durationDays: number;
  public readonly signature: string;
  public readonly userAddress: `0x${string}`;
  public readonly eip712: EIP712Type;

  constructor(data: FhevmDecryptionSignatureData) {
    this.publicKey = data.publicKey;
    this.privateKey = data.privateKey;
    this.contractAddresses = data.contractAddresses.sort();
    this.startTimestamp = data.startTimestamp;
    this.durationDays = data.durationDays;
    this.signature = data.signature;
    this.userAddress = data.userAddress;
    this.eip712 = data.eip712;
  }

  static getStorageKey(userAddress: string, contractAddresses: string[]): string {
    const sortedAddresses = [...contractAddresses].sort().join(",");
    return `fhevm.decryptionSignature.${userAddress}.${sortedAddresses}`;
  }

  static loadFromStorage(
    userAddress: string,
    contractAddresses: string[]
  ): FhevmDecryptionSignature | null {
    const key = this.getStorageKey(userAddress, contractAddresses);
    const stored = localStorage.getItem(key);
    
    if (!stored) return null;

    try {
      const data = JSON.parse(stored);
      const sig = new FhevmDecryptionSignature(data);

      // Check if signature is still valid
      const now = timestampNow();
      const expiryTimestamp = sig.startTimestamp + sig.durationDays * 24 * 60 * 60;
      
      if (now >= expiryTimestamp) {
        // Signature expired, remove it
        localStorage.removeItem(key);
        return null;
      }

      return sig;
    } catch (err) {
      console.error("Failed to load decryption signature:", err);
      return null;
    }
  }

  saveToStorage(): void {
    const key = FhevmDecryptionSignature.getStorageKey(
      this.userAddress,
      this.contractAddresses
    );
    localStorage.setItem(key, JSON.stringify(this));
  }

  static async create(
    instance: FhevmInstance,
    contractAddresses: string[],
    signer: ethers.Signer
  ): Promise<FhevmDecryptionSignature | null> {
    try {
      const userAddress = (await signer.getAddress()) as `0x${string}`;
      
      // Generate key pair using FHEVM instance
      const { publicKey, privateKey } = instance.generateKeypair();

      const startTimestamp = timestampNow();
      const durationDays = 365;

      // Create EIP-712 typed data for signing using FHEVM instance
      const sortedAddresses = [...contractAddresses].sort() as `0x${string}`[];
      
      const eip712 = instance.createEIP712(
        publicKey,
        sortedAddresses,
        startTimestamp,
        durationDays
      );

      // Sign the typed data
      const signature = await signer.signTypedData(
        eip712.domain,
        { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
        eip712.message
      );

      const sig = new FhevmDecryptionSignature({
        publicKey,
        privateKey,
        contractAddresses: sortedAddresses,
        startTimestamp,
        durationDays,
        signature,
        userAddress,
        eip712,
      });

      // Save to storage
      sig.saveToStorage();

      return sig;
    } catch (err) {
      console.error("Failed to create decryption signature:", err);
      return null;
    }
  }

  static async loadOrSign(
    instance: FhevmInstance,
    contractAddresses: string[],
    signer: ethers.Signer
  ): Promise<FhevmDecryptionSignature | null> {
    const userAddress = await signer.getAddress();

    // Try to load from storage first
    const stored = this.loadFromStorage(userAddress, contractAddresses);
    if (stored) {
      console.log("[FhevmDecryptionSignature] Loaded from storage");
      return stored;
    }

    // Create new signature
    console.log("[FhevmDecryptionSignature] Creating new signature");
    return await this.create(instance, contractAddresses, signer);
  }
}

