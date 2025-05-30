const hre = require("hardhat");

async function main() {
  const Vault = await hre.ethers.getContractFactory("VaultETH");
  const vault = await Vault.deploy();
  await vault.waitForDeployment();

  console.log("✅ VaultETH deployed to:", await vault.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
