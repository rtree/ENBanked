// scripts/deployZk.js
// npx hardhat run ./scripts/deployZk.js --network worldChainMainnet

const hre = require("hardhat");

async function main() {

  const SendETHZ = await hre.ethers.getContractFactory("SendETHZ");
  const seth = await SendETHZ.deploy();
  await seth.waitForDeployment();
  console.log("✅ SendETHZ deployed to:", await seth.getAddress());

  const Groth16Verifier = await hre.ethers.getContractFactory("Groth16Verifier");
  const g16v = await Groth16Verifier.deploy();
  await g16v.waitForDeployment();
  console.log("✅ Groth16Verifier deployed to:", await g16v.getAddress());
  
  const PoseidonT3 = await hre.ethers.getContractFactory("PoseidonT3");
  const pt3 = await PoseidonT3.deploy();
  await pt3.waitForDeployment();
  console.log("✅ PoseidonT3 deployed to:", await pt3.getAddress());
  
  const VaultZkWei = await hre.ethers.getContractFactory("VaultZkWei", {
    libraries: {
      PoseidonT3: await pt3.getAddress(), // Link the PoseidonT3 library
    },
  });
  const vz = await VaultZkWei.deploy(await g16v.getAddress());
  await vz.waitForDeployment();
  console.log("✅ VaultZkWei deployed to:", await vz.getAddress());

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});


// async function main() {
//   const [deployer] = await ethers.getSigners();

//   console.log("Deploying contracts with the account:", deployer.address);

//   // Verifier コントラクトを先にデプロイ
//   const Groth16 = await ethers.getContractFactory('Groth16Verifier');
//   const groth16 = await Groth16.deploy();
//   await groth16.waitForDeployment();

//   console.log('✅ Verifier (Groth16Verifier) deployed to:', groth16.address);

//   const PoseidonDep = await ethers.getContractFactory('PoseidonT3');
//   const poseidonDep = await PoseidonDep.deploy();
//   await poseidonDep.waitForDeployment();
//   console.log('✅ PoseidonT3 deployed to:', poseidonDep.address);

//   // Vault コントラクトをデプロイし、Verifier のアドレスを渡す
//   const Vault = await ethers.getContractFactory('VaultZkWei',{
//     libraries: {
//       // Paring:  groth16.target,
//       PoseidonT3: poseidonDep.address,  // PoseidonT3 のアドレスをライブラリとして指定
//     },
//   });
//   const vault = await Vault.deploy(groth16.address);  // Verifier のアドレスを渡す
//   await vault.waitForDeployment();
//   console.log('✅ VaultZkWei deployed to:', vault.address);
// }

// main().catch((error) => {
//   console.error(error);
//   process.exitCode = 1;
// });
