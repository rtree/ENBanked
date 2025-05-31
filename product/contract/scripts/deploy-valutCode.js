
const hre = require("hardhat");

async function main() {
  const VaultCode = await hre.ethers.getContractFactory("VaultCodeETH");
  const vc = await VaultCode.deploy();
  await vc.waitForDeployment();

  console.log("✅ VaultETH deployed to:", await vc.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
