<template>
  <div class="home">

    <section class="section onboarding install-metamask" v-if="! metamask.installed">
      <div class="container is-max-desktop has-text-centered">
        <a href="https://metamask.io/" target="_blank" class="button is-large is-success">Install MetaMask</a>
      </div>
    </section>

    <section class="section onboarding connect-wallet" v-if="metamask.installed && ! metamask.user">
      <div class="container is-max-desktop has-text-centered">
        <button class="button is-large is-success" @click="connect">Connect Wallet</button>
      </div>
    </section>

    <section class="section onboarding connect-rinkeby" v-if="metamask.user && ! (metamask.ready('rinkeby') || metamask.ready('hardhat'))">
      <div class="container is-max-desktop has-text-centered">
        <article class="message is-warning">
          <div class="message-body">
            You must connect to the Rinkeby test network to continue.
          </div>
        </article>
        <button class="button is-large is-success" @click="chain">Connect To Rinkeby</button>
      </div>
    </section>

    <section class="section" v-if="metamask.user && (metamask.ready('rinkeby') || metamask.ready('hardhat'))">
      <div class="container is-max-desktop">

        <article class="message is-info has-text-centered" v-if="! isMember">
          <div class="message-body">
            Become a member of EscrowDAO and start earning rewards for participating in decentralized arbitration.
            <div class="mt-4">
              <button class="button is-info is-outlined" @click="join">
                <i class="fa-solid fa-user-plus"></i>
                <span class="ml-2">Join EscrowDAO</span>
              </button>
            </div>
          </div>
        </article>

        <article class="message is-success has-text-centered" v-if="isMember">
          <div class="message-body">
            Welcome to EscrowDAO! Start earning rewards for participating in decentralized arbitration.


            <div class="mt-4">
              <button class="button is-success is-outlined is-static" @click="join">
                <i class="fa-solid fa-user-check"></i>
                <span class="ml-2">Membership Confirmed</span>
              </button>
            </div>
          </div>
        </article>

        <div class="box" v-if="stats">
          <nav class="level">
            <div class="level-item has-text-centered">
              <div>
                <p class="heading">Treasury</p>
                <p class="title is-size-6">{{ stats.treasury }} <i class="fa-brands fa-ethereum"></i></p>
              </div>
            </div>
            <div class="level-item has-text-centered">
              <div>
                <p class="heading">Volume</p>
                <p class="title is-size-6">{{ stats.volume }} <i class="fa-brands fa-ethereum"></i></p>
              </div>
            </div>
            <div class="level-item has-text-centered">
              <div>
                <p class="heading">Escrows</p>
                <p class="title is-size-6">{{ stats.escrows }}</p>
              </div>
            </div>
            <div class="level-item has-text-centered">
              <div>
                <p class="heading">Members</p>
                <p class="title is-size-6">{{ stats.members }}</p>
              </div>
            </div>
          </nav>
        </div>

        <div class="columns">
            <div class="column">

              <div class="reverse-stack">

                <div class="box">

                  <h3 class="title is-size-3">New Contracts</h3>

                  <hr>

                  <div class="field">
                    <label class="label">Beneficiary Address</label>
                    <div class="control">
                      <input class="input" type="text" v-model="form.beneficiary">
                    </div>
                  </div>

                  <div class="field">
                    <label class="label">Deposit Amount</label>
                    <div class="control">
                      <input class="input" type="text" v-model="form.value">
                    </div>
                  </div>

                  <div class="control">
                    <button class="button is-success is-fullwidth mt-5" @click="createEscrow()">
                        Submit
                    </button>
                  </div>

                </div>

                <div class="box">

                  <h3 class="title is-size-3">My Rewards</h3>

                  <hr>

                  <table width="100%" class="table" v-if="stats">
                    <tr>
                      <td class="is-size-6">Total Arbitrations</td>
                      <td align="right" class="is-size-6">{{ stats.rewards.attempts }} Escrows</td>
                    </tr>
                    <tr>
                      <td class="is-size-6">Winning Arbitrations</td>
                      <td align="right" class="is-size-6">{{ stats.rewards.wins }} Escrows</td>
                    </tr>
                    <tr>
                      <td class="is-size-6">Rewards Balance</td>
                      <td align="right" class="is-size-6">
                        {{ stats.rewards.balance }}
                        <i class="fa-brands fa-ethereum"></i></td>
                    </tr>
                  </table>

                  <div class="control">
                    <button class="button is-success is-fullwidth mt-5"
                      @click="withdraw()"
                      :disabled="! stats.rewards.balance"
                    >
                        Withdraw
                    </button>
                  </div>

                </div>

              </div>

            </div>
            <div class="column">
                <div class="box">

                  <h3 class="title is-size-3">Existing Contracts</h3>

                  <hr>

                  <div class="tile is-ancestor">
                    <div class="tile is-vertical is-parent">

                        <div
                          :class="
                          (contract.approved == 1)
                            ? 'is-success'
                            : (contract.approved == 2)
                              ? 'is-danger'
                              : 'is-info'"
                          class="tile is-child notification is-light"
                          v-for="contract in contracts" :key="contract.address">
                          <table width="100%">
                            <tr>
                              <td class="is-size-7 has-text-weight-bold pr-4">Contract</td>
                              <td class="is-size-7">{{ contract.address }}</td>
                            </tr>
                            <tr>
                              <td class="is-size-7 has-text-weight-bold pr-4">Depositor</td>
                              <td class="is-size-7">{{ contract.depositor }}</td>
                            </tr>
                            <tr>
                              <td class="is-size-7 has-text-weight-bold pr-4">Beneficiary</td>
                              <td class="is-size-7">{{ contract.beneficiary }}</td>
                            </tr>
                            <tr>
                              <td class="is-size-7 has-text-weight-bold pr-4">Balance</td>
                              <td class="is-size-7">{{ contract.balance }} Ether</td>
                            </tr>
                          </table>

                          <p class="mt-3" v-if="contract.approved == 1">
                            <span class="tag is-success">Approved</span>
                          </p>

                          <p class="mt-3" v-if="contract.approved == 2">
                            <span class="tag is-danger">Denied</span>
                          </p>

                          <button class="button is-info is-small is-outlined mt-5"
                            :disabled="allowed(contract)"
                            @click="approve(contract)"
                            v-if="! contract.approved"
                          >
                            <span class="icon is-medium">
                              <i class="fa-solid fa-thumbs-up"></i>
                            </span>
                            <span>YES ({{ contract.yes }} Votes) </span>
                          </button>

                          <button class="button is-danger is-small is-outlined mt-5 ml-3"
                            :disabled="allowed(contract)"
                            @click="deny(contract)"
                            v-if="! contract.approved"
                          >
                            <span class="icon is-medium">
                              <i class="fa-solid fa-thumbs-down"></i>
                            </span>
                            <span>NO ({{ contract.no }} Votes)</span>
                          </button>
                        </div>

                    </div>
                  </div>

                </div>
            </div>
        </div>

      </div>
    </section>

  </div>
</template>

<script>
import Escrow from '../../artifacts/contracts/Escrow.sol/Escrow';
import EscrowDAO from '../../artifacts/contracts/EscrowDAO.sol/EscrowDAO';
import { ethers, utils } from 'ethers';

export default {
  name: 'Home',
  data() {
    return {
      dao: null,
      escrow: null,
      stats: null,
      metamask: window.metamask,
      provider: null,
      form: {
        arbiter: null,
        beneficiary: null,
        value: null,
      },
    };
  },
  async mounted() {
    this.provider = new ethers.providers.Web3Provider(this.metamask.provider);
    const signer = this.provider.getSigner();

    this.dao = new ethers.Contract('0xB6634Af9E27Ab8ebf77b3396334eDBfE55a29722', EscrowDAO.abi, signer);
    this.dao = this.dao.connect(signer);
    window.dao = this.dao;

    this.escrow = new ethers.ContractFactory(Escrow.abi, Escrow.bytecode, signer);
    window.escrow = this.escrow;

    this.checkMembership();
    const escrows = await this.getEscrows();
    const members = await this.dao.getMembers();

    this.stats = {
      treasury: utils.formatEther(await this.provider.getBalance(this.dao.address)),
      volume: utils.formatEther(await this.dao.volume()),
      escrows: escrows.length,
      members: members.length,
      rewards: {
        attempts: await this.dao.attempts(this.metamask.user),
        wins: await this.dao.wins(this.metamask.user),
        balance: this.precision(await this.dao.balances(this.metamask.user)),
      },
    };

    this.dao.on('EscrowCreated', (escrow) => {
      this.getEscrow(escrow)
    });

    this.dao.on('MemberVoted', async(member,escrow,vote) => {
      if ( vote == 1 ) {
        this.$store.commit('updateVotes', {
          address: escrow,
          vote: 'yes',
          votes: parseInt(await this.dao.getYesVotes(escrow)),
        });
      } else if ( vote == 2 ) {
        this.$store.commit('updateVotes', {
          address: escrow,
          vote: 'no',
          votes: parseInt(await this.dao.getNoVotes(escrow)),
        });
      }
    });

  },
  computed: {
    contracts() {
      return this.$store.state.contracts.slice().reverse();
    },
    isMember() {
      return this.$store.state.isMember;
    }
  },
  methods: {
    connect() {
      this.metamask.connect();
    },

    chain() {
      this.metamask.chain('rinkeby');
    },

    allowed(contract) {
      return (!this.isMember)
        || (this.metamask.user.toLowerCase() == contract.depositor.toLowerCase())
        || (this.metamask.user.toLowerCase() == contract.beneficiary.toLowerCase());
    },

    precision(num) {
      return parseFloat(
        parseFloat(
          utils.formatEther(num)
        ).toFixed(5)
      );
    },

    async createEscrow() {
      await this.dao.createEscrow(
        this.form.beneficiary,
        { value: utils.parseEther(this.form.value) }
      );
    },

    async withdraw() {
      await this.dao.withdraw();
    },

    async approve(contract) {
      const escrow = this.escrow.attach(contract.address);

      escrow.on('Approved', () => {
        this.$store.commit('approveContract', contract.address);
      });

      await this.dao.voteYes(contract.address);
    },

    async deny(contract) {
      const escrow = this.escrow.attach(contract.address);

      escrow.on('Denied', () => {
        this.$store.commit('denyContract', contract.address);
      });

      await this.dao.voteNo(contract.address);
    },

    async join() {
      this.dao.join().then((tx) => {
        return tx.wait();
      }).then(() => {
        this.checkMembership();
      });
    },

    async checkMembership() {
      this.$store.commit('updateMembership', await this.dao.belongs(this.metamask.user));
    },

    async getEscrows() {
      let escrows = await this.dao.getEscrows();

      escrows.forEach(async(escrow) => {
        await this.getEscrow(escrow);
      })

      return escrows;
    },

    async getEscrow(address) {
      const escrow = this.escrow.attach(address);

      this.$store.commit('addContract', {
        address: address,
        depositor: await escrow.depositor(),
        arbiter: await escrow.arbiter(),
        beneficiary: await escrow.beneficiary(),
        balance: ethers.utils.formatEther(await this.provider.getBalance(address)),
        yes: parseInt(await this.dao.getYesVotes(address)),
        no: parseInt(await this.dao.getNoVotes(address)),
        approved: await escrow.status(),
      });
    },
  }
}
</script>
