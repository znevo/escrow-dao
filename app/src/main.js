import Vue from 'vue';
import Vuex from 'vuex'
import App from './App.vue';
import router from './router';

import '@fortawesome/fontawesome-free/css/all.min.css';
import './css/main.scss';

Vue.use(Vuex);

const store = new Vuex.Store({
  state: {
    contracts: [],
    isMember: false,
  },
  mutations: {
    addContract(state, contract) {
      const match = state.contracts.findIndex(match => match.address == contract.address);
      (match == -1) && state.contracts.push(contract);
    },
    approveContract(state, address) {
      const contract = state.contracts.findIndex(contract => contract.address == address);
      state.contracts[contract].approved = 1;
    },
    denyContract(state, address) {
      const contract = state.contracts.findIndex(contract => contract.address == address);
      state.contracts[contract].approved = 2;
    },
    updateMembership(state, isMember) {
      state.isMember = isMember;
    },
    updateVotes(state, voteUpdate) {
      console.log(voteUpdate)
      const contract = state.contracts.findIndex(contract => contract.address == voteUpdate.address);
      if ( contract != -1 ) {
        voteUpdate.vote == 'yes'
          ? (state.contracts[contract].yes = voteUpdate.votes)
          : (state.contracts[contract].no = voteUpdate.votes);
      }
    },
  }
});

window.store = store;

Vue.config.productionTip = false;

import Metamask from './library/MetaMask';
const metamask = new Metamask();
window.metamask = metamask;

metamask.on('EVENT_ACCOUNT_CONNECTED',    () => { window.location.reload() });
metamask.on('EVENT_ACCOUNT_SWITCHED',     () => { window.location.reload() });
metamask.on('EVENT_ACCOUNT_DISCONNECTED', () => { window.location.reload() });
metamask.on('EVENT_CHAIN_SWITCHED',       () => { window.location.reload() });

new Vue({
  router,
  store,
  async beforeCreate() {
    await metamask.init();
    this.$mount('#app');
  },
  render: h => h(App)
});
