import { Eip1193Provider } from "ethers";

export interface FhevmInstance {
  createEncryptedInput(contractAddress: string, userAddress: string): EncryptedInput;
  userDecrypt(
    handles: Array<{ handle: string; contractAddress: string }>,
    privateKey: string,
    publicKey: string,
    signature: string,
    contractAddresses: string[],
    userAddress: string,
    startTimestamp: number,
    durationDays: number
  ): Promise<Record<string, bigint | boolean | string>>;
  generateKeypair(): { publicKey: string; privateKey: string };
  getPublicKey(): string;
  getPublicParams(size: number): string;
  createEIP712(
    publicKey: string,
    contractAddresses: string[],
    startTimestamp: number,
    durationDays: number
  ): EIP712Type;
}

export interface EncryptedInput {
  add32(value: number): EncryptedInput;
  add64(value: number | bigint): EncryptedInput;
  addBool(value: boolean): EncryptedInput;
  encrypt(): Promise<{ 
    handles: string[]; 
    inputProof: string;
  }>;
}

export interface FhevmInstanceConfig {
  network: Eip1193Provider | string;
  publicKey?: string;
  publicParams?: string;
  aclContractAddress?: string;
  kmsVerifierContractAddress?: string;
  inputVerifierContractAddress?: string;
  fhevmExecutorContractAddress?: string;
}

export type EIP712Type = {
  domain: {
    chainId: number;
    name: string;
    verifyingContract: `0x${string}`;
    version: string;
  };
  message: any;
  primaryType: string;
  types: {
    [key: string]: {
      name: string;
      type: string;
    }[];
  };
};

export type FhevmDecryptionSignatureType = {
  publicKey: string;
  privateKey: string;
  signature: string;
  startTimestamp: number;
  durationDays: number;
  userAddress: `0x${string}`;
  contractAddresses: `0x${string}`[];
  eip712: EIP712Type;
};

