const chai = require("chai");
const { assert, expect } = chai;
const { solidity } = require("ethereum-waffle");

chai.use(solidity);

describe("EscrowDAO", function() {
  let dao;
  let escrow;
  let escrowContract;
  let deposit = ethers.utils.parseEther('1.234');
  let user1, user2, user3, user4, user5;
  let addr1, addr2, addr3, addr4, addr5;

  before(async() => {
    [user1, user2, user3, user4, user5] = await ethers.getSigners();
    [addr1, addr2, addr3, addr4, addr5] = await ethers.provider.listAccounts();
  });

  beforeEach(async () => {
    const daoFactory = await ethers.getContractFactory("EscrowDAO");
    dao = await daoFactory.deploy();
    await dao.deployed();
  });

  describe("constructor()", function() {
    it("should set the deployer as founding member", async function() {
      assert.equal(addr1, await dao.members(0));
    });
  });

  describe("join()", function() {
    it("should add a new member", async function() {
      await dao.connect(user2).join();
      const members = await await dao.getMembers();
      assert.equal(members.length, 2);
    });

    it("should only allow joining one time", async function() {
      await expect(dao.connect(user1).join()).to.be.reverted;
    });
  });

  describe("belongs()", function() {
    it("should confirm membership status", async function() {
      await dao.connect(user2).join();
      assert.equal(await dao.belongs(addr2), true);
      assert.equal(await dao.belongs(addr3), false);
    });
  });

  describe("getMembers()", function() {
    it("should get a list of members", async function() {
      await dao.connect(user2).join();
      await dao.connect(user3).join();
      const members = await dao.getMembers();
      assert.equal(members.length, 3);
    });
  });

  describe("createEscrow()", async function() {
    let thisDao;

    it("should create escrow contract and emit event", async function() {
      const tx = await dao.createEscrow(addr2, { value: deposit });
      const receipt = await tx.wait();
      const emittedEscrow = receipt.events[0].args[0];
      escrow = await dao.escrows(0);
      assert.equal(escrow, emittedEscrow);
      thisDao = dao;
    });

    it("should transfer initial deposit to escrow contract", async function() {
      const escrowBalance = await ethers.provider.getBalance(escrow);
      expect(escrowBalance).to.equal(deposit.div(10).mul(9));
    });

    it("should take a cut of the initial deposit for the treasury", async function() {
      const daoBalance = await ethers.provider.getBalance(thisDao.address);
      expect(daoBalance).to.equal(deposit.div(10));
    });
  });

  describe("getEscrows()", async function() {
    it("should get a list of escrow contracts", async function() {
      await dao.createEscrow(addr2, { value: deposit });
      await dao.createEscrow(addr3, { value: deposit });
      await dao.createEscrow(addr4, { value: deposit });
      const escrows = await dao.getEscrows();
      assert.equal(escrows.length, 3);
    });
  });

  describe("canVote()", async function() {
    before(async() => {
      await dao.createEscrow(addr2, { value: deposit });
      escrow = await dao.escrows(0);

      const escrowFactory = await ethers.getContractFactory("Escrow");
      escrowContract = escrowFactory.attach(escrow);
    });

    it("should only allow members to vote", async function() {
      const foe = await ethers.provider.getSigner(10);
      await expect( dao.connect(foe).voteYes(escrow) ).to.be.reverted;
    });

    it("should not allow depositor to vote", async function() {
      await expect( dao.connect(user1).voteYes(escrow) ).to.be.reverted;
      await expect( dao.connect(user1).voteNo(escrow) ).to.be.reverted;
    });

    it("should not allow beneficiary to vote", async function() {
      await dao.connect(user2).join();
      await expect( dao.connect(user2).voteYes(escrow) ).to.be.reverted;
      await expect( dao.connect(user2).voteNo(escrow) ).to.be.reverted;
    });
  });

  describe("voteYes()", async function() {
    beforeEach(async() => {
      await dao.createEscrow(addr2, { value: deposit });
      escrow = await dao.escrows(0);

      const escrowFactory = await ethers.getContractFactory("Escrow");
      escrowContract = escrowFactory.attach(escrow);

      await dao.connect(user3).join();
      await dao.connect(user4).join();
      await dao.connect(user5).join();
    });

    it("should only allow voting one time", async function() {
      await dao.connect(user3).voteYes(escrow);
      await expect( dao.connect(user3).voteYes(escrow) ).to.be.reverted;
    });

    it("should increase YES votes for escrow", async function() {
      await dao.connect(user3).voteYes(escrow);
      await dao.connect(user4).voteYes(escrow);
      await dao.connect(user5).voteYes(escrow);

      const yes = await dao.getYesVotes(escrow);
      const no = await dao.getNoVotes(escrow);

      expect(yes).to.equal(3);
      expect(no).to.equal(0);
    });

    it("should approve escrow after 3 yes votes", async function() {
      await dao.connect(user3).voteYes(escrow);
      await dao.connect(user4).voteYes(escrow);
      await dao.connect(user5).voteYes(escrow);

      assert.equal(await escrowContract.status(), 1);
    });

    it("should emit an event", async function() {
      await expect(dao.connect(user3).voteYes(escrow))
      .to.emit(dao, 'MemberVoted')
      .withArgs(addr3, escrow, 1);
    });
  })

  describe("voteNo()", async function() {
    beforeEach(async() => {
      await dao.createEscrow(addr2, { value: deposit });
      escrow = await dao.escrows(0);

      const escrowFactory = await ethers.getContractFactory("Escrow");
      escrowContract = escrowFactory.attach(escrow);

      await dao.connect(user3).join();
      await dao.connect(user4).join();
      await dao.connect(user5).join();
    });

    it("should only allow voting one time", async function() {
      await dao.connect(user3).voteNo(escrow);
      await expect( dao.connect(user3).voteNo(escrow) ).to.be.reverted;
    });

    it("should increase NO votes for escrow", async function() {
      await dao.connect(user3).voteNo(escrow);
      await dao.connect(user4).voteNo(escrow);
      await dao.connect(user5).voteNo(escrow);

      const yes = await dao.getYesVotes(escrow);
      const no = await dao.getNoVotes(escrow);

      expect(yes).to.equal(0);
      expect(no).to.equal(3);
    });

    it("should deny escrow after 3 no votes", async function() {
      await dao.connect(user3).voteNo(escrow);
      await dao.connect(user4).voteNo(escrow);
      await dao.connect(user5).voteNo(escrow);

      assert.equal(await escrowContract.status(), 2);
    });

    it("should emit an event", async function() {
      await expect(dao.connect(user3).voteYes(escrow))
      .to.emit(dao, 'MemberVoted')
      .withArgs(addr3, escrow, 1);

      await expect(dao.connect(user4).voteNo(escrow))
      .to.emit(dao, 'MemberVoted')
      .withArgs(addr4, escrow, 2);
    });
  });

  describe("getVote()", async function() {
    beforeEach(async() => {
      await dao.createEscrow(addr2, { value: deposit });
      escrow = await dao.escrows(0);

      const escrowFactory = await ethers.getContractFactory("Escrow");
      escrowContract = escrowFactory.attach(escrow);

      await dao.connect(user3).join();
      await dao.connect(user4).join();
      await dao.connect(user5).join();
    });

    it("should get how a member voted on an escrow", async function() {
      await dao.connect(user3).voteYes(escrow);
      await dao.connect(user4).voteNo(escrow);
      assert.equal(await dao.getVote(escrow, addr3), 1);
      assert.equal(await dao.getVote(escrow, addr4), 2);
      assert.equal(await dao.getVote(escrow, addr5), 0);
    });
  });

});
