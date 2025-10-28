import type { MockFhevmInstance } from "@fhevm/mock-utils";
import type { FhevmInstance, EncryptedInput, FhevmDecryptionSignatureType } from "./fhevmTypes";

// Helper to convert Uint8Array to hex string
const toHexString = (data: Uint8Array | string): string => {
  if (typeof data === 'string') return data;
  return '0x' + Array.from(data).map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Adapter to make MockFhevmInstance compatible with our FhevmInstance interface
 */
export class MockFhevmAdapter implements FhevmInstance {
  constructor(private mockInstance: MockFhevmInstance) {}

  createEncryptedInput(contractAddress: string, userAddress: string): EncryptedInput {
    const mockInput = this.mockInstance.createEncryptedInput(contractAddress, userAddress);
    
    return {
      add32: (value: number) => {
        mockInput.add32(value);
        return this as unknown as EncryptedInput;
      },
      add64: (value: number | bigint) => {
        mockInput.add64(value);
        return this as unknown as EncryptedInput;
      },
      addBool: (value: boolean) => {
        mockInput.addBool(value);
        return this as unknown as EncryptedInput;
      },
      encrypt: async () => {
        const result = await mockInput.encrypt();
        
        return {
          handles: result.handles.map(h => toHexString(h)),
          inputProof: toHexString(result.inputProof),
        };
      },
    };
  }

  async userDecrypt(
    handles: Array<{ handle: string; contractAddress: string }>,
    privateKey: string,
    publicKey: string,
    signature: string,
    contractAddresses: string[],
    userAddress: string,
    startTimestamp: number,
    durationDays: number
  ): Promise<Record<string, bigint | boolean | string>> {
    const result = await this.mockInstance.userDecrypt(
      handles,
      privateKey,
      publicKey,
      signature,
      contractAddresses,
      userAddress,
      startTimestamp,
      durationDays
    );
    
    return result as Record<string, bigint | boolean | string>;
  }

  generateKeypair(): { publicKey: string; privateKey: string } {
    // MockFhevmInstance.generateKeypair() returns { publicKey: string; privateKey: string }
    const keyPair = this.mockInstance.generateKeypair();
    
    // Already in string format for mock instance
    return keyPair;
  }

  getPublicKey(): string {
    // For compatibility, use generateKeypair and return only publicKey
    const keyPair = this.generateKeypair();
    return keyPair.publicKey;
  }

  getPublicParams(size: number): string {
    // MockFhevmInstance.getPublicParams() returns { publicParams: Uint8Array, publicParamsId: string } | null
    // The size parameter must be one of the allowed values
    const allowedSizes = [1, 8, 16, 32, 64, 128, 160, 256, 512, 1024, 2048] as const;
    type AllowedSize = typeof allowedSizes[number];
    
    // Find the closest allowed size
    const closestSize = allowedSizes.reduce((prev, curr) => 
      Math.abs(curr - size) < Math.abs(prev - size) ? curr : prev
    ) as AllowedSize;
    
    const result = this.mockInstance.getPublicParams(closestSize);
    
    if (!result) {
      return "";
    }
    
    // Convert Uint8Array to hex string
    return toHexString(result.publicParams);
  }

  createEIP712(
    publicKey: string,
    contractAddresses: string[],
    startTimestamp: number,
    durationDays: number
  ): FhevmDecryptionSignatureType['eip712'] {
    // MockFhevmInstance.createEIP712 accepts string publicKey
    const eip712 = this.mockInstance.createEIP712(
      publicKey,
      contractAddresses,
      startTimestamp,
      durationDays
    );
    
    // Type cast to match our interface
    // MockFhevmInstance.createEIP712 returns compatible type but with slightly different typing
    return {
      ...eip712,
      domain: {
        ...eip712.domain,
        verifyingContract: eip712.domain.verifyingContract as `0x${string}`,
      },
    };
  }
}

