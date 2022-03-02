const { ethers, upgrades } = require("hardhat");

async function main() {
  const proxy = ""; // TODO set proxy address
  const EscrowDAO = await ethers.getContractFactory("EscrowDAO");
  const dao = await upgrades.upgradeProxy(proxy, EscrowDAO);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
