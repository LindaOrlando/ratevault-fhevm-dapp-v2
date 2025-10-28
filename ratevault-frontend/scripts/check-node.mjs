import { JsonRpcProvider } from "ethers";

const HARDHAT_NODE_URL = "http://localhost:8545";

async function checkHardhatNode() {
  try {
    const provider = new JsonRpcProvider(HARDHAT_NODE_URL);
    const version = await provider.send("web3_clientVersion", []);

    if (version && version.toLowerCase().includes("hardhat")) {
      console.log("✅ Hardhat node detected:", version);
      process.exit(0);
    } else {
      console.error("❌ Not a Hardhat node. Found:", version);
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Hardhat node not running at", HARDHAT_NODE_URL);
    console.error("Please start it with: cd ../fhevm-hardhat-template && npx hardhat node");
    process.exit(1);
  }
}

checkHardhatNode();

