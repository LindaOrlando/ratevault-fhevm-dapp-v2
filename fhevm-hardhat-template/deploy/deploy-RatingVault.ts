import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployed = await deploy("RatingVault", {
    from: deployer,
    log: true,
  });

  console.log(`RatingVault contract deployed at: ${deployed.address}`);
};

export default func;
func.id = "deploy_rating_vault";
func.tags = ["RatingVault"];

