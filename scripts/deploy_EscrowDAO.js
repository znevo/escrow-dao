const hre = require("hardhat");
require('dotenv').config();

async function main() {
  const [signer] = await ethers.getSigners();
  const EscrowDAO = await ethers.getContractFactory("EscrowDAO", signer);
  const dao = await EscrowDAO.deploy();
  await dao.deployed();
  console.log("EscrowDAO deployed to:", dao.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
