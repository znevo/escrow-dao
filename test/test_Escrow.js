const chai = require("chai");
const { assert, expect } = chai;
const { solidity } = require("ethereum-waffle");

chai.use(solidity);

describe("Escrow", function() {
  let contract;
  let depositor;
  let beneficiary;
  let arbiter;
  const deposit = ethers.utils.parseEther("1");

  beforeEach(async () => {
    depositor = ethers.provider.getSigner(0);
    beneficiary = ethers.provider.getSigner(1);
    arbiter = ethers.provider.getSigner(2);
    const Escrow = await ethers.getContractFactory("Escrow");
    contract = await Escrow.deploy(depositor.getAddress(), arbiter.getAddress(), beneficiary.getAddress(), {
      value: deposit
    });
    await contract.deployed();
  });

  describe("constructor()", async() => {
    it("should receive funds from the depositor", async function() {
      let balance = await ethers.provider.getBalance(contract.address);
      assert.equal(balance.toString(), deposit.toString());
    });
  });

  describe("approve()", () => {
    it("should only allow approval by the arbiter", async () => {
      await expect( contract.connect(depositor).approve() ).to.be.reverted;
      await expect( contract.connect(beneficiary).approve() ).to.be.reverted;
    });

    it("should transfer balance to beneficiary", async () => {
        const before = await ethers.provider.getBalance(beneficiary.getAddress());
        const approve = await contract.connect(arbiter).approve();
        const after = await ethers.provider.getBalance(beneficiary.getAddress());
        assert.equal(after.sub(before).toString(), deposit.toString());
    });
  });

  describe("deny()", () => {
    it("should only allow denial by the arbiter", async () => {
      await expect( contract.connect(depositor).deny() ).to.be.reverted;
      await expect( contract.connect(beneficiary).deny() ).to.be.reverted;
    });

    it("should transfer balance to depositor", async () => {
        const before = await ethers.provider.getBalance(depositor.getAddress());
        const approve = await contract.connect(arbiter).deny();
        const after = await ethers.provider.getBalance(depositor.getAddress());
        assert.equal(after.sub(before).toString(), deposit.toString());
    });
  });
});
