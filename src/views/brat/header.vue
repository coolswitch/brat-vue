<template>
  <header>
    <div class="Header">
      <div id="mainHeader">
        <div id="mainlogo" class="logo unselectable">brat</div>
        <span id="navbuttons">
          <img
            id="prev"
            alt="Previous document (Cursor Left)"
            title="Previous document (Cursor Left)"
            src="/static/img/arrow-180.png"
            @click="Prev"
          />
          <img
            id="next"
            alt="Next document (Cursor Right)"
            title="Next document (Cursor Right)"
            src="/static/img/arrow.png"
            @click="Next"
          />
        </span>
        <span id="document_name">{{ docName }}</span>
        <!-- <span id="document_ctime"/> -->
      </div>
      <div id="pulldown">
        <el-button
          size="mini"
          tabindex="-1"
          title="Open Collection Browser (Tab)"
          @click="ShowColl"
          >Collection</el-button
        >
        <el-button
          size="mini"
          tabindex="-1"
          title="Import, Export Data; Manage Collection"
          @click="isShowData = true"
          >Data</el-button
        >

        <el-button-group style="margin-left: 10px">
          <el-button
            size="mini"
            tabindex="-1"
            title="Search text and annotations"
            @click="isShowSearch = true"
            >Search</el-button
          >
          <el-button
            size="mini"
            tabindex="-1"
            title="Clear search"
            v-if="searchResult.length > 0"
            @click="ClearSearch"
            >x</el-button
          >
        </el-button-group>

        <!-- <input id="search_button" type="checkbox" class="login" value="true" tabindex="-1"/><label id="search_button_label" for="search_button" title="Search text and annotations">Search</label><input id="clear_search_button" type="button" value="✕" tabindex="-1" title="Clear search" style="display: none"/>
            <input id="unlock_type_button" type="button" value="Unlock" tabindex="-1" title="Stop annotating with the locked type"/>  -->

        <a
          target="manual"
          class="fr"
          style="margin-left: 10px"
          href="http://brat.nlplab.org/manual.html"
          >Help <img src="/static/img/Fugue-shadowless-question.png"
        /></a>
      </div>
    </div>
    <PopupCol v-model="isShowColl" />
    <PopupSearch v-model="isShowSearch" />
    <PopupData v-model="isShowData" />
  </header>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import PopupCol from "./popup/col.vue";
import PopupSearch from "./popup/search.vue";
import PopupData from "./popup/data.vue";

@Component({
  components: { PopupCol, PopupSearch, PopupData }
})
export default class BratHeader extends Vue {
  isShowColl = false;
  isShowSearch = false;
  isShowData = false;

  get docName() {
    return this.$route.hash.substr(1);
  }

  get searchResult() {
    return this.$store.state.brat.searchResult;
  }

  ShowColl() {
    this.isShowColl = true;
  }

  Prev() {
    this.$store.commit("brat/NextOrPrev", -1);
  }

  Next() {
    this.$store.commit("brat/NextOrPrev", 1);
  }

  ClearSearch() {
    this.$store.commit("brat/SetSearchResult", []);
  }
}
</script>

<style>
.Header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  -moz-box-shadow: 5px 5px 5px #999999;
  -webkit-box-shadow: 5px 5px 5px #999999;
  box-shadow: 5px 5px 5px #999999;
  z-index: 1;
}
#mainHeader {
  font-size: 120%;
  overflow: hidden;
  white-space: nowrap;
  background: #5c9ccc;
}

#pulldown {
  /* display: none; */
  font-size: 80%;
  background: #fff;
  margin-top: -49px;
  transition: margin 0.5s;
  position: relative;
  z-index: -1;
  padding: 10px;
}
#auth_button {
  float: right;
}
#options_button {
  float: right;
}

#pulluptrigger {
  height: 35px;
  width: 35px;
  position: fixed;
  bottom: 0;
  left: 0;
  background: url("/static/img/Fugue-shadowless-information-balloon.png") center
    no-repeat;
}
#mainlogo {
  font-size: 1.2em;
  float: right;
  cursor: pointer;
  text-shadow: #000000 0 0 3px;
  padding: 0 10px 0 20px;
  color: #fff;
}
.logo {
  font-family: "Astloch", serif;
  font-style: normal;
  text-decoration: none;
  text-transform: none;
  letter-spacing: 0em;
  word-spacing: 0em;
  line-height: 1.2;
  font-weight: bold;
}
#logo:hover {
  opacity: 0.8;
}
#document_name {
  margin-right: 100px;
  margin-left: 5px;
  color: #fff;
}
#next,
#prev {
  background: #dfeffc;
  padding: 2px 5px;
  border-radius: 5px;
  margin: 3px;
  display: block;
  float: left;
}
.Header:hover #pulldown {
  position: relative;
  margin-top: 0px;
}
.fr {
  float: right;
}
</style>
