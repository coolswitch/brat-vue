<template>
  <el-dialog :title="title" :visible="value" @close="Cancel">
    <p class="pb10"><b>Text: </b> {{ txt }}</p>
    <p class="pb10">
      <b>Search: </b>
      <a v-for="link in links" :key="link[0]" :href="link[1]" class="ml20">{{
        link[0]
      }}</a>
    </p>
    <el-divider content-position="left">Entity type</el-divider>
    <el-radio-group v-model="choosed">
      <el-radio
        v-for="item in entity_types"
        :key="item.name"
        :label="item.type"
        >{{ item.name }}</el-radio
      >
    </el-radio-group>
    <span slot="footer" class="dialog-footer">
      <el-button size="small" @click="Cancel">Cancel</el-button>
      <el-button size="small" type="danger" @click="Del" v-if="item">
        Delete
      </el-button>
      <el-button size="small" type="primary" @click="Moving" v-if="item">
        Move
      </el-button>
      <el-button size="small" type="primary" @click="Submit">
        Ok
      </el-button>
    </span>
  </el-dialog>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from "vue-property-decorator";
import { GetTextParent } from "../brat-util";

type EntityObject = { id: string; type: string; txt: string };

type EntitiesObject = { [key: string]: EntityObject };

@Component
export default class BratEntity extends Vue {
  @Prop({ type: Boolean, default: false })
  private value!: boolean;

  @Prop({ type: Object, default: () => null })
  private item!: PlainObject;

  get links() {
    return this.$store.state.brat.collectionObj.search_config;
  }

  get entity_types() {
    return this.$store.state.brat.collectionObj.entity_types;
  }

  title = "Edit Annotation";
  txt = "";
  choosed = "";
  offsets: any = [];
  moving: any = null;

  @Watch("value", { immediate: true })
  valueChange(val: boolean) {
    if (!val) return;
    if (this.item) {
      this.title = "Edit Annotation";
      this.choosed = this.item.type;
    } else {
      this.title = "Add Annotation";
      this.choosed = "";
    }
    this.computedOffsets();
    this.computedTxt();
    if (this.moving) this.Move();
  }

  Cancel() {
    this.$emit("input", false);
  }

  Del() {
    if (!this.choosed) return;
    const loading = this.$loading({ lock: true });
    const params = {
      offsets: this.offsets,
      type: this.choosed,
      id: this.item.id
    };
    this.$store
      .dispatch("brat/EntityDel", params)
      .then(() => {
        this.$Bus.$emit("rerender-svg");
        this.Cancel();
      })
      .catch(err => this.$message({ message: err, type: "error" }))
      .finally(() => loading.close());
  }

  Moving() {
    this.moving = { id: this.item.id, type: this.choosed };
    this.Cancel();
  }

  Move() {
    this.Cancel();
    this.choosed = this.moving.type;
    this.Submit();
  }

  Submit() {
    if (!this.choosed) return;

    const loading = this.$loading({ lock: true });
    const params = {
      id: "",
      offsets: this.offsets,
      type: this.choosed
    };
    if (this.item) params.id = this.item.id;
    if (this.moving) params.id = this.moving.id;
    this.moving = null;

    this.$store
      .dispatch("brat/EntityCreateOrEdit", params)
      .then(() => {
        this.$Bus.$emit("rerender-svg");
        this.Cancel();
      })
      .catch(err => this.$message({ message: err, type: "error" }))
      .finally(() => loading.close());
  }
  /** 计算实体的文本 */
  computedTxt() {
    if (this.item) {
      const from = this.offsets[0][0];
      const to = this.offsets[this.offsets.length - 1][1];
      this.txt = this.$store.state.brat.documentObj.text.substr(
        from,
        to - from
      );
    } else {
      this.txt = window.getSelection()?.toString() || "";
    }
  }
  /** 计算选中的文本在整个文档中的位置 */
  computedOffsets() {
    if (this.item) {
      this.$store.state.brat.documentObj.entities.find(entity => {
        if (entity[0] === this.item.id) this.offsets = entity[2];
      });
      return;
    }

    const rangeObj = window.getSelection()?.getRangeAt(0);
    if (!rangeObj) return;
    const eleStart = GetTextParent(rangeObj.startContainer);
    const eleEnd = GetTextParent(rangeObj.endContainer);
    let rangeEle:
      | (HTMLElement | SVGTSpanElement)[]
      | HTMLElement = rangeObj.commonAncestorContainer as HTMLElement;
    if (eleStart === eleEnd) {
      rangeEle = [eleStart as HTMLElement];
    } else {
      rangeEle = Array.from(rangeEle.querySelectorAll("tspan"));
    }

    const offsets: (string | number)[] = [];
    const lines_offset = this.$store.state.brat.documentObj.sentence_offsets;

    rangeEle.some(ele => {
      const lineIndex = ele.getAttribute("data-chunk-id");
      const [lineFrom] = lines_offset[lineIndex as string];
      if (ele === eleStart) {
        offsets.push(lineFrom + rangeObj.startOffset - 1);
      }
      if (ele === eleEnd) {
        offsets.push(lineFrom + rangeObj.endOffset - 1);
        return true;
      }
      return false;
    });
    this.offsets = [offsets];
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
</style>
