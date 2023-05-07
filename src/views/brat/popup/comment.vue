<template>
  <div id="commentpopup" :style="{ left: `${x}px`, top: `${y}px` }">
    <div class="markbox" id="originbox">
      <label class="markname" :style="{ background: origin.color }"
        >{{ origin.type }} #{{ origin.id }}</label
      >
      <p class="marktxt">{{ origin.txt }}</p>
    </div>
    <div class="markbox" id="targetbox" v-if="relation">
      <label class="markname" :style="{ background: target.color }"
        >{{ target.type }} #{{ target.id }}</label
      >
      <p class="marktxt">{{ target.txt }}</p>
      <div class="role">
        <label class="markrole">{{ relation }}</label>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from "vue-property-decorator";

type EntityObject = { id: string; type: string; txt: string };

type EntitiesObject = { [key: string]: EntityObject };

@Component
export default class BratComment extends Vue {
  @Prop({ type: MouseEvent, default: false })
  private mouseEvent!: MouseEvent;

  /** 实体们 => [{ id, type, txt }] */
  get entities(): EntitiesObject {
    const txt = this.$store.state.brat.documentObj.text;
    const origin = this.$store.state.brat.documentObj.entities;
    const obj: EntitiesObject = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (origin || []).forEach((entity: any[]) => {
      const [id, type] = entity;
      obj[id] = { id, type, txt: "" };
      entity[2].forEach(([from, end]: number[]) => {
        obj[id].txt = `${obj[id].txt}${txt.substr(from, end - from)}`;
      });
    });
    return obj;
  }

  x = 0;
  y = 0;
  origin = { id: "", type: "", txt: "", color: "" };
  target = { id: "", type: "", txt: "", color: "" };
  relation = "";

  Show(x: number, y: number) {
    this.x = x + 10;
    this.y = y + 10;
    const current = this.mouseEvent.currentTarget as HTMLElement;
    const spanId = current.getAttribute("data-span-id") || "";
    if (spanId) {
      const entity = this.entities[spanId] || {};
      this.origin = { ...entity, color: current.getAttribute("fill") || "" };
      this.relation = "";
    } else {
      const originId = current.getAttribute("data-arc-origin") || "";
      const targetId = current.getAttribute("data-arc-target") || "";
      const entityO = this.entities[originId];
      const entityT = this.entities[targetId];
      const colorO = document.querySelector(`[data-span-id="${originId}"]`);
      const colorT = document.querySelector(`[data-span-id="${targetId}"]`);

      this.origin = { ...entityO, color: colorO?.getAttribute("fill") || "" };
      this.target = { ...entityT, color: colorT?.getAttribute("fill") || "" };
      this.relation = current.children[2].textContent || "";
    }
  }
}
</script>

<style scoped>
#commentpopup {
  font-family: "Liberation Sans", Verdana, Arial, Helvetica, sans-serif;
  position: fixed;
  top: 0;
  left: 0;
  padding: 8px;
  color: #3e404e;
  z-index: 20;
  background: #ffffff;
  box-shadow: 0px 10px 32px rgba(45, 47, 51, 0.18);
  -moz-box-shadow: 0px 10px 32px rgba(45, 47, 51, 0.18);
  -webkit-box-shadow: 0px 10px 32px rgba(45, 47, 51, 0.18);
  -moz-border-radius: 2px;
  -webkit-border-radius: 2px;
  border-radius: 2px;
  max-width: 440px;
  min-width: 100px;
  user-select: none;
}
.markbox {
  background: #f7f7f7;
  border-radius: 2px;
  padding: 4px;
  position: relative;
}
.markbox .markname {
  font-size: 12px;
  color: #fff;
  background: #595959;
  border-radius: 2px;
  line-height: 19px;
  padding: 0 4px;
  margin-bottom: 4px;
  display: inline-block;
}
.markbox .marktxt {
  font-size: 14px;
  line-height: 22px;
  color: #3e404e;
}
#targetbox {
  margin-top: 40px;
}
#commentpopup .role {
  background: url(/static/img/langarrow.svg) center no-repeat;
  position: absolute;
  top: -40px;
  height: 40px;
}
#commentpopup .markrole {
  font-size: 10px;
  color: #fff;
  background: #595959;
  border-radius: 2px;
  line-height: 16px;
  padding: 0 4px;
  margin: 10px auto 0;
  display: inline-block;
}
</style>
