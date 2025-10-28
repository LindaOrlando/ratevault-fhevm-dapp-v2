import { SDK_CDN_URL } from "./constants";

export interface FhevmRelayerSDKType {
  initSDK(options?: any): Promise<boolean>;
  createInstance(config: any): Promise<any>;
  SepoliaConfig: {
    aclContractAddress: string;
    kmsVerifierContractAddress: string;
    inputVerifierContractAddress: string;
    fhevmExecutorContractAddress: string;
  };
  __initialized__?: boolean;
}

export interface FhevmWindowType extends Window {
  relayerSDK: FhevmRelayerSDKType;
}

export class RelayerSDKLoader {
  public isLoaded(): boolean {
    if (typeof window === "undefined") return false;
    return "relayerSDK" in window && !!window.relayerSDK;
  }

  public async load(): Promise<void> {
    if (typeof window === "undefined") {
      throw new Error("RelayerSDKLoader: can only be used in the browser.");
    }

    if (this.isLoaded()) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const existingScript = document.querySelector(`script[src="${SDK_CDN_URL}"]`);
      if (existingScript) {
        if (this.isLoaded()) {
          resolve();
        } else {
          reject(new Error("Script loaded but relayerSDK not available"));
        }
        return;
      }

      const script = document.createElement("script");
      script.src = SDK_CDN_URL;
      script.type = "text/javascript";
      script.async = true;

      script.onload = () => {
        if (this.isLoaded()) {
          console.log("[RelayerSDKLoader] SDK loaded successfully");
          resolve();
        } else {
          reject(new Error("SDK script loaded but window.relayerSDK is not available"));
        }
      };

      script.onerror = () => {
        reject(new Error(`Failed to load Relayer SDK from ${SDK_CDN_URL}`));
      };

      document.head.appendChild(script);
    });
  }
}

