// scripts/deploy.js
async function main() {
  const VaultETH = await ethers.getContractFactory("VaultETH");
  const vault = await VaultETH.deploy();
  await vault.deployed();
  console.log("✅ VaultETH deployed to:", vault.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
