require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  networks: {
    worldchain: {
      url: "https://worldchain-mainnet.g.alchemy.com/v2/yYqkQNEKuzDKgYc35KTC35iwZ9oHRy3u",
      chainId: 480,
      accounts: [process.env.PRIVATE_KEY],
    },
  },
  solidity: "0.8.19",
};