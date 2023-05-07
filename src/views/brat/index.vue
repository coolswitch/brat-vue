<template>
  <main>
    <Header ref="header" />

    <img id="spinner" src="/static/img/spinner.gif" v-show="loading" />

    <BratSvg v-if="documentPath" />
    <div class="center_wrapper" id="no_svg_wrapper" v-else>
      <div>
        <div>
          <fieldset id="no_document_message">
            <h1 class="unselectable">No document selected</h1>
            <p class="unselectable">To select a document:</p>
            <ul>
              <li class="unselectable">
                press the <strong>TAB</strong> key, or
              </li>
              <li class="unselectable">
                click on &quot;<strong>Collection</strong>&quot; in the blue
                menu bar on top
              </li>
            </ul>
          </fieldset>
          <fieldset id="loading_message" style="display: none">
            <h1 class="unselectable">Loading ...</h1>
            <p class="unselectable">
              This may take a while, in particular when loading a larger
              document collection. Please wait.
            </p>
          </fieldset>
        </div>
      </div>
    </div>
  </main>
</template>

<script lang="ts">
import { Component, Vue, Watch } from "vue-property-decorator";
import Header from "./header.vue";
import BratSvg from "./svg.vue";

@Component({
  components: { Header, BratSvg }
})
export default class Brat extends Vue {
  get loading() {
    const { loadingColl, loadingDoc } = this.$store.state.brat;
    return loadingColl || loadingDoc;
  }

  get documentPath() {
    return this.$store.state.brat.documentPath;
  }

  @Watch("$route.hash", { immediate: true })
  HashChange(newval: string) {
    if (!newval) return;
    const coll = newval.substr(1).replace(/\/[^/]+$/, "/");
    const doc = newval.substr(coll.length + 1);

    if (newval.endsWith("/")) {
      (this.$refs.header as PlainObject).options.ShowColl();
      this.$store.commit("brat/ClearDoc");
    }
    this.LoadColl(coll, doc);
  }

  LoadColl(coll: string, doc: string) {
    // 目录信息是否已加载
    if (this.$store.state.brat.collectionPath === coll) {
      this.LoadDoc(coll, doc);
      return;
    }
    this.$store
      .dispatch("brat/GetDocList", coll)
      .then(() => doc && this.LoadDoc(coll, doc))
      .catch(err => this.$message({ message: err, type: "error" }));
  }

  LoadDoc(coll: string, doc: string) {
    this.$store
      .dispatch("brat/GetDocument", { coll, doc })
      .catch(err => this.$message({ message: err, type: "error" }));
  }

  created() {
    if (!location.hash) location.hash = "/sandbox/";
    this.$store.dispatch("brat/CheckAuth");
    this.$store.dispatch("brat/LoadConf");
  }
}
</script>

<style>
.center_wrapper {
  display: flex;
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  justify-content: center;
  align-items: center;
}
fieldset {
  border: 1px solid #a6c9e2;
  -moz-border-radius: 5px;
  -webkit-border-radius: 5px;
  border-radius: 5px;
  color: #2e6e9e;
  width: 30em;
  font-size: 12px;
}
fieldset h1 {
  font-size: 14px;
}

#spinner {
  position: fixed;
  right: 10px;
  top: 55px;
  z-index: 1;
}

#svg {
  margin: 49px 8px 100px;
}
</style>
