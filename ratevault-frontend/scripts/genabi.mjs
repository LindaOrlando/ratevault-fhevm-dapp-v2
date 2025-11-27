import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

const CONTRACT_NAME = "RatingVault";

// ../fhevm-hardhat-template
const rel = "../fhevm-hardhat-template";

// ./abi
const outdir = path.resolve("./abi");

if (!fs.existsSync(outdir)) {
  fs.mkdirSync(outdir);
}

const dir = path.resolve(rel);
const dirname = path.basename(dir);

const line = "\n===================================================================\n";

// Check if ABI files already exist (for Vercel builds where deployment dir may not exist)
const abiFile = path.join(outdir, `${CONTRACT_NAME}ABI.ts`);
const addressesFile = path.join(outdir, `${CONTRACT_NAME}Addresses.ts`);

if (!fs.existsSync(dir)) {
  // If deployment dir doesn't exist, check if ABI files are already present
  if (fs.existsSync(abiFile) && fs.existsSync(addressesFile)) {
    console.log(`${line}Deployment directory not found, but ABI files exist. Skipping generation.${line}`);
    process.exit(0);
  }
  console.error(`${line}Unable to locate ${rel}. Expecting ../fhevm-hardhat-template${line}`);
  process.exit(1);
}

const deploymentsDir = path.join(dir, "deployments");

function deployOnHardhatNode() {
  if (process.platform === "win32") {
    // Not supported on Windows
    return;
  }
  try {
    console.log("Attempting to deploy on Hardhat Node...");
    execSync(`cd ${dir} && npx hardhat deploy --network localhost`, {
      stdio: "inherit",
    });
  } catch (e) {
    console.error(`${line}Auto-deployment failed: ${e}${line}`);
  }
}

function readDeployment(chainName, chainId, contractName, optional) {
  const chainDeploymentDir = path.join(deploymentsDir, chainName);

  if (!fs.existsSync(chainDeploymentDir) && chainId === 31337) {
    // Try to auto-deploy the contract on hardhat node!
    deployOnHardhatNode();
  }

  if (!fs.existsSync(chainDeploymentDir)) {
    console.error(
      `${line}Unable to locate '${chainDeploymentDir}' directory.\n\n1. Goto '${dirname}' directory\n2. Run 'npx hardhat deploy --network ${chainName}'.${line}`
    );
    if (!optional) {
      process.exit(1);
    }
    return undefined;
  }

  const jsonPath = path.join(chainDeploymentDir, `${contractName}.json`);
  if (!fs.existsSync(jsonPath)) {
    console.error(
      `${line}Contract ${contractName}.json not found in ${chainDeploymentDir}.\n\nRun: cd ${dirname} && npx hardhat deploy --network ${chainName}${line}`
    );
    if (!optional) {
      process.exit(1);
    }
    return undefined;
  }

  const jsonString = fs.readFileSync(jsonPath, "utf-8");
  const obj = JSON.parse(jsonString);
  obj.chainId = chainId;

  return obj;
}

// Auto deployed on Linux/Mac (will fail on windows)
const deployLocalhost = readDeployment("localhost", 31337, CONTRACT_NAME, true /* optional */);

// Sepolia is optional
let deploySepolia = readDeployment("sepolia", 11155111, CONTRACT_NAME, true /* optional */);

// Fallback if neither exists
if (!deployLocalhost && !deploySepolia) {
  console.error(`${line}No deployment found for ${CONTRACT_NAME} on localhost or sepolia.${line}`);
  process.exit(1);
}

if (!deploySepolia) {
  deploySepolia = {
    abi: deployLocalhost.abi,
    address: "0x0000000000000000000000000000000000000000",
  };
}

if (!deployLocalhost) {
  // Use Sepolia ABI as fallback
  const tsCode = `
/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const ${CONTRACT_NAME}ABI = ${JSON.stringify({ abi: deploySepolia.abi }, null, 2)} as const;
\n`;

  const tsAddresses = `
/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const ${CONTRACT_NAME}Addresses = { 
  "11155111": { address: "${deploySepolia.address}", chainId: 11155111, chainName: "sepolia" },
  "31337": { address: "0x0000000000000000000000000000000000000000", chainId: 31337, chainName: "hardhat" },
};
`;

  console.log(`Generated ${path.join(outdir, `${CONTRACT_NAME}ABI.ts`)} (from Sepolia)`);
  console.log(`Generated ${path.join(outdir, `${CONTRACT_NAME}Addresses.ts`)}`);

  fs.writeFileSync(path.join(outdir, `${CONTRACT_NAME}ABI.ts`), tsCode, "utf-8");
  fs.writeFileSync(path.join(outdir, `${CONTRACT_NAME}Addresses.ts`), tsAddresses, "utf-8");

  process.exit(0);
}

// Both exist, check ABI consistency
if (JSON.stringify(deployLocalhost.abi) !== JSON.stringify(deploySepolia.abi)) {
  console.warn(
    `${line}WARNING: ABIs differ between localhost and Sepolia. Using localhost ABI.${line}`
  );
}

const tsCode = `
/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const ${CONTRACT_NAME}ABI = ${JSON.stringify({ abi: deployLocalhost.abi }, null, 2)} as const;
\n`;

const tsAddresses = `
/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const ${CONTRACT_NAME}Addresses = { 
  "11155111": { address: "${deploySepolia.address}", chainId: 11155111, chainName: "sepolia" },
  "31337": { address: "${deployLocalhost.address}", chainId: 31337, chainName: "hardhat" },
};
`;

console.log(`Generated ${path.join(outdir, `${CONTRACT_NAME}ABI.ts`)}`);
console.log(`Generated ${path.join(outdir, `${CONTRACT_NAME}Addresses.ts`)}`);
console.log(tsAddresses);

fs.writeFileSync(path.join(outdir, `${CONTRACT_NAME}ABI.ts`), tsCode, "utf-8");
fs.writeFileSync(path.join(outdir, `${CONTRACT_NAME}Addresses.ts`), tsAddresses, "utf-8");

