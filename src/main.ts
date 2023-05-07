import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import element from "./plugin-elem";

import "./assets/reset-element.css";

Vue.config.productionTip = false;
Vue.use(element);

Vue.prototype.$Bus = new Vue();

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount("#app");
