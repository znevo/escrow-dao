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

    <!-- <section class="section onboarding connect-rinkeby" v-if="metamask.user && ! metamask.ready('rinkeby')">
      <div class="container is-max-desktop has-text-centered">
        <article class="message is-warning">
          <div class="message-body">
            You must connect to the Rinkeby test network to continue.
          </div>
        </article>
        <button class="button is-large is-success" @click="chain">Connect To Rinkeby</button>
      </div>
    </section> -->

    <section class="section" v-if="metamask.user">
      <div class="container is-max-desktop">

        <div class="columns">
            <div class="column">
                <div class="box">

                  <h3 class="title is-size-3">New Contracts</h3>

                  <hr>

                  <div class="field">
                    <label class="label">Arbiter Address</label>
                    <div class="control">
                      <input class="input" type="text" v-model="form.arbiter">
                    </div>
                  </div>

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
                    <button class="button is-success is-fullwidth mt-5" @click="deploy()">
                        Submit
                    </button>
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
                            : (contract.approved == -1)
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
                              <td class="is-size-7 has-text-weight-bold pr-4">Arbiter</td>
                              <td class="is-size-7">{{ contract.arbiter }}</td>
                            </tr>
                            <tr>
                              <td class="is-size-7 has-text-weight-bold pr-4">Beneficiary</td>
                              <td class="is-size-7">{{ contract.beneficiary }}</td>
                            </tr>
                            <tr>
                              <td class="is-size-7 has-text-weight-bold pr-4">Deposit</td>
                              <td class="is-size-7">{{ contract.value }} Ether</td>
                            </tr>
                          </table>

                          <p class="mt-3" v-if="contract.approved == 1">
                            <span class="tag is-success">Approved</span>
                          </p>

                          <p class="mt-3" v-if="contract.approved == -1">
                            <span class="tag is-danger">Denied</span>
                          </p>

                          <button class="button is-info is-small is-outlined mt-5" @click="approve(contract)" v-if="! contract.approved">
                            <span class="icon is-medium">
                              <i class="fa-solid fa-thumbs-up"></i>
                            </span>
                            <span>Vote YES</span>
                          </button>

                          <button class="button is-danger is-small is-outlined mt-5 ml-3" @click="deny(contract)" v-if="! contract.approved">
                            <span class="icon is-medium">
                              <i class="fa-solid fa-thumbs-down"></i>
                            </span>
                            <span>Vote NO</span>
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
import { ethers, utils } from 'ethers';

export default {
  name: 'Home',
  data() {
    return {
      escrow: null,
      metamask: window.metamask,
      form: {
        arbiter: null,
        beneficiary: null,
        value: null,
      },
    };
  },
  async mounted() {
    const provider = new ethers.providers.Web3Provider(this.metamask.provider);
    const signer = provider.getSigner();
    this.escrow = new ethers.ContractFactory(Escrow.abi, Escrow.bytecode, signer);
  },
  computed: {
    contracts() {
      return this.$store.state.contracts.slice().reverse();
    }
  },
  methods: {
    connect() {
      this.metamask.connect();
    },

    chain() {
      this.metamask.chain('rinkeby');
    },

    async deploy() {
      const contract = await this.escrow.deploy(
        this.form.arbiter,
        this.form.beneficiary,
        { value: utils.parseEther(this.form.value) }
      );

      this.$store.commit('addContract', {
        address: contract.address,
        arbiter: this.form.arbiter,
        beneficiary: this.form.beneficiary,
        value: this.form.value,
        approved: 0,
      });
    },

    async approve(contract) {
      const escrow = this.escrow.attach(contract.address);

      escrow.on('Approved', () => {
        this.$store.commit('approveContract', contract.address);
      });

      await escrow.approve();
    },

    async deny(contract) {
      const escrow = this.escrow.attach(contract.address);

      escrow.on('Denied', () => {
        this.$store.commit('denyContract', contract.address);
      });

      await escrow.deny();
    }
  }
}
</script>
