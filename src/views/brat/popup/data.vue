<template>
  <el-dialog title="Data" :visible="value" @close="Cancel">
    <el-divider content-position="left">Export</el-divider>
    <p class="pb10">
      <b>Document data: </b>
      <el-button size="mini" :loading="isLoadingAnn" @click="DownloadAnn"
        >ann</el-button
      >
      <el-button size="mini" :loading="isLoadingTxt" @click="DownloadTxt"
        >txt</el-button
      >
    </p>
    <p class="pb10">
      <b>Collection data: </b>
      <el-button size="mini" :loading="isLoadingTar" @click="DownloadTar"
        >Download tar.gz</el-button
      >
    </p>
  </el-dialog>
</template>

<script lang="ts">
import { Component, Vue, Prop } from "vue-property-decorator";

@Component
export default class BratData extends Vue {
  @Prop({ type: Boolean, default: false })
  private value!: boolean;

  isLoadingAnn = false;
  isLoadingTxt = false;
  isLoadingTar = false;

  Cancel() {
    this.$emit("input", false);
  }

  DownloadAnn() {
    if (this.isLoadingAnn) return;
    this.isLoadingAnn = false;
    this.$store
      .dispatch("brat/Download", { action: "downloadFile", extension: "ann" })
      .finally(() => (this.isLoadingAnn = false));
  }

  DownloadTxt() {
    if (this.isLoadingTxt) return;
    this.isLoadingTxt = false;
    this.$store
      .dispatch("brat/Download", { action: "downloadFile", extension: "txt" })
      .finally(() => (this.isLoadingTxt = false));
  }

  DownloadTar() {
    if (this.isLoadingTar) return;
    this.isLoadingTar = false;
    this.$store
      .dispatch("brat/Download", { action: "downloadCollection" })
      .finally(() => (this.isLoadingTar = false));
  }
}
</script>

<style scoped>
.pb10 {
  padding-bottom: 10px;
}
.ml20 {
  margin-left: 10px;
}
.mb20 {
  margin-bottom: 20px;
}
</style>
