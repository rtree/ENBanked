
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const { MNEMONIC, ALCHEMY_API_KEY } = process.env;

module.exports = {
  solidity: "0.8.19",
  networks: {
    worldChainMainnet: {
      url: `https://worldchain-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      chainId: 480,
      accounts: {
        mnemonic: MNEMONIC
      }
    },
  },
};