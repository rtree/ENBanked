// npx hardhat run ./scripts/deploy-vaultCodeTrue.js --network worldChainMainnet

const hre = require("hardhat");

async function main() {
  const VaultCodeETHTrue = await hre.ethers.getContractFactory("VaultCodeETHTrue");
  const vc = await VaultCodeETHTrue.deploy();
  await vc.waitForDeployment();

  console.log("✅ VaultCodeETHTrue deployed to:", await vc.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});


