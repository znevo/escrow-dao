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
  },
  mutations: {
    initialiseStore(state) {
      if(localStorage.getItem('store')) {
        let store = localStorage.getItem('store');
        this.replaceState(Object.assign(state, JSON.parse(store)));
      }
    },
    addContract(state, contract) {
      state.contracts.push(contract);
    },
    approveContract(state, address) {
      const contract = state.contracts.findIndex(contract => contract.address == address);
      state.contracts[contract].approved = 1;
    },
    denyContract(state, address) {
      const contract = state.contracts.findIndex(contract => contract.address == address);
      state.contracts[contract].approved = -1;
    }
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

    this.$store.commit('initialiseStore');
    this.$store.subscribe((mutation, state) => {
      localStorage.setItem('store', JSON.stringify(state));
    });

    this.$mount('#app');
  },
  render: h => h(App)
});
