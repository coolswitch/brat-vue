import Vue from "vue";
import VueRouter, { RouteConfig } from "vue-router";

Vue.use(VueRouter);

const routes: Array<RouteConfig> = [
  {
    path: "/",
    redirect: () => ({ path: "/brat" })
  },
  {
    path: "/brat",
    meta: { title: "brat" },
    component: () =>
      import(/* webpackChunkName: "brat" */ "./views/brat/index.vue")
  }
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes
});

export default router;
