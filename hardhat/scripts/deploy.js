const { ethers } = require("hardhat");
const {CRYPTODEVS_NFT_CONTRACT_ADDRESS} = require("../constants");

async function main() {
  // deploy the NFTMiniMarket Contract
  const NFTMiniMarket =  await ethers.getContractFactory(
    "NFTMiniMarket"
  );
  const nftMiniMarket = await NFTMiniMarket.deploy();
  await nftMiniMarket.deployed();

  console.log("NFTMiniMarket deployed to :", nftMiniMarket.address);

    // deploy the CryptoDevsDAO Contract
    const CryptoDevsDAO = await ethers.getContractFactory("CryptoDevsDAO");
    const cryptoDevsDAO = await CryptoDevsDAO.deploy(
      nftMiniMarket.address,
      CRYPTODEVS_NFT_CONTRACT_ADDRESS,
      {
        // this assumes your account has at least 1 ETH in it's account
        value: ethers.utils.parseEther("1"),
      }
    );
    await cryptoDevsDAO.deployed();
    console.log("CryptoDevsDAO deployed to:",cryptoDevsDAO.address);
}

main()
.then(() => process.exit(0))
.catch((error) => {
  console.error(error);
  process.exit(1);
});
