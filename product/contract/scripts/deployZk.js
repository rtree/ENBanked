// scripts/deployZk.js
// npx hardhat run ./scripts/deployZk.js --network worldChainMainnet

const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Get the PoseidonT3 library address (no need to deploy it manually)
  const PoseidonT3 = await hre.ethers.getContractFactory("PoseidonT3");

  // Link PoseidonT3 library to VaultZkWei
  const VaultZkWei = await hre.ethers.getContractFactory("VaultZkWei", {
    libraries: {
      PoseidonT3: PoseidonT3.bytecode, // Use the library's bytecode
    },
  });

  // Deploy VaultZkWei contract
  const verifierAddress = "0xVerifierContractAddress"; // Replace with the actual Verifier contract address
  const vault = await VaultZkWei.deploy(verifierAddress);
  await vault.deployed();

  console.log("✅ VaultZkWei deployed to:", vault.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
