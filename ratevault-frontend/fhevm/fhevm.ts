import { Eip1193Provider, JsonRpcProvider } from "ethers";
import { FhevmInstance } from "./fhevmTypes";
import { RelayerSDKLoader, FhevmWindowType } from "./loader";
import { MockFhevmAdapter } from "./mockAdapter";

async function getChainId(provider: Eip1193Provider | string): Promise<number> {
  if (typeof provider === "string") {
    const jsonProvider = new JsonRpcProvider(provider);
    return Number((await jsonProvider.getNetwork()).chainId);
  }
  const chainId = await provider.request({ method: "eth_chainId" });
  return Number.parseInt(chainId as string, 16);
}

async function tryFetchHardhatNodeMetadata(rpcUrl: string): Promise<any> {
  try {
    const rpc = new JsonRpcProvider(rpcUrl);
    const version = await rpc.send("web3_clientVersion", []);
    
    if (typeof version !== "string" || !version.toLowerCase().includes("hardhat")) {
      return undefined;
    }

    const metadata = await rpc.send("fhevm_relayer_metadata", []);
    rpc.destroy();
    
    if (metadata && metadata.ACLAddress && metadata.InputVerifierAddress && metadata.KMSVerifierAddress) {
      return metadata;
    }
  } catch {
    return undefined;
  }
  return undefined;
}

export async function createFhevmInstance(parameters: {
  provider: Eip1193Provider | string;
  onStatusChange?: (status: string) => void;
}): Promise<FhevmInstance> {
  const { provider, onStatusChange } = parameters;

  const chainId = await getChainId(provider);
  const notify = (status: string) => onStatusChange?.(status);

  // Check if it's local Hardhat node (chainId 31337)
  if (chainId === 31337) {
    console.log("[FHEVM] Detected local Hardhat node (chainId 31337)");
    const rpcUrl = typeof provider === "string" ? provider : "http://localhost:8545";
    const metadata = await tryFetchHardhatNodeMetadata(rpcUrl);

    if (metadata) {
      console.log("[FHEVM] Hardhat metadata found:", metadata);
      notify("creating-mock");
      
      try {
        console.log("[FHEVM] Creating mock instance with MockFhevmInstance.create()...");
        
        // Dynamic import to avoid including mock in production bundle
        const { MockFhevmInstance } = await import("@fhevm/mock-utils");
        console.log("[FHEVM] MockFhevmInstance imported successfully");
        
        // Create JsonRpcProvider
        const jsonProvider = new JsonRpcProvider(rpcUrl);
        
        // Use MockFhevmInstance.create() API
        const mockInstance = await MockFhevmInstance.create(
          jsonProvider,
          jsonProvider,
          {
            aclContractAddress: metadata.ACLAddress,
            chainId: chainId,
            gatewayChainId: metadata.gatewayChainId || 55815,
            inputVerifierContractAddress: metadata.InputVerifierAddress,
            kmsContractAddress: metadata.KMSVerifierAddress,
            verifyingContractAddressDecryption: "0x5ffdaAB0373E62E2ea2944776209aEf29E631A64",
            verifyingContractAddressInputVerification: "0x812b06e1CDCE800494b79fFE4f925A504a9A9810",
          }
        );
        
        console.log("[FHEVM] Mock instance created successfully");
        
        // Wrap mock instance with adapter to match FhevmInstance interface
        const adapter = new MockFhevmAdapter(mockInstance);
        return adapter;
      } catch (err) {
        console.error("[FHEVM] Failed to create mock instance:", err);
        throw new Error(`Mock instance creation failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    } else {
      console.warn("[FHEVM] No Hardhat metadata found, cannot use Mock mode");
      throw new Error("Hardhat node metadata not available. Please ensure Hardhat node is running with FHEVM support.");
    }
  }

  // Use real Relayer SDK for non-local networks
  notify("sdk-loading");

  const loader = new RelayerSDKLoader();
  await loader.load();

  notify("sdk-loaded");

  const win = window as unknown as FhevmWindowType;
  if (!win.relayerSDK) {
    throw new Error("Relayer SDK not loaded");
  }

  if (!win.relayerSDK.__initialized__) {
    notify("sdk-initializing");
    await win.relayerSDK.initSDK();
    win.relayerSDK.__initialized__ = true;
  }

  notify("creating-instance");

  const config = {
    ...win.relayerSDK.SepoliaConfig,
    network: provider,
  };

  const instance = await win.relayerSDK.createInstance(config);

  return instance;
}

