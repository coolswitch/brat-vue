<template>
  <el-dialog title="Search" :visible="value" @close="Cancel">
    <el-tabs v-model="activeName" type="card">
      <el-tab-pane label="Text" name="Text">
        <!-- 文本搜索 -->
        <el-form :model="formValueText" label-width="80px" size="mini">
          <el-form-item label="Text">
            <el-input v-model="formValueText.text"></el-input>
          </el-form-item>
        </el-form>
      </el-tab-pane>
      <el-tab-pane label="Entity" name="Entity">
        <!-- 实体搜索 -->
        <el-form :model="formValueEntity" label-width="80px" size="mini">
          <el-form-item label="Type">
            <el-select v-model="formValueEntity.type" style="width:100%">
              <el-option label="- Any -" value=""></el-option>
              <el-option
                v-for="item in types_entity"
                :key="item.type"
                :label="item.type"
                :value="item.type"
              ></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="Text">
            <el-input v-model="formValueEntity.text"></el-input>
          </el-form-item>
        </el-form>
      </el-tab-pane>
      <el-tab-pane label="Relation" name="Relation">
        <!-- 关系搜索 -->
        <el-form :model="formValueRelation" label-width="80px" size="mini">
          <el-form-item label="Type">
            <el-select
              v-model="formValueRelation.type"
              @change="ChangeFirst"
              style="width:100%"
            >
              <el-option label="- Any -" value=""></el-option>
              <el-option
                v-for="item in types_relation"
                :key="item.type"
                :label="item.type"
                :value="item.type"
              ></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="Arg1">
            <el-select v-model="formValueRelation.arg1type" style="width:30%">
              <el-option label="- Any -" value=""></el-option>
              <el-option
                v-for="item in arg1Options"
                :key="item"
                :label="item"
                :value="item"
              ></el-option>
            </el-select>
            <el-input
              v-model="formValueRelation.arg1"
              style="width:70%"
            ></el-input>
          </el-form-item>
          <el-form-item label="Arg2">
            <el-select v-model="formValueRelation.arg2type" style="width:30%">
              <el-option label="- Any -" value=""></el-option>
              <el-option
                v-for="item in arg2Options"
                :key="item"
                :label="item"
                :value="item"
              ></el-option>
            </el-select>
            <el-input
              v-model="formValueRelation.arg2"
              style="width:70%"
            ></el-input>
          </el-form-item>
        </el-form>
      </el-tab-pane>
    </el-tabs>
    <span slot="footer" class="dialog-footer">
      <el-button size="small" @click="Cancel">Cancel</el-button>
      <el-button size="small" type="primary" @click="Search"> Ok </el-button>
    </span>
  </el-dialog>
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/camelcase */
import { Component, Vue, Prop } from "vue-property-decorator";
import { CreateRangeDOMRect } from "../brat-util";

@Component
export default class BratSearch extends Vue {
  @Prop({ type: Boolean, default: false })
  private value!: boolean;

  get types_entity() {
    return this.$store.getters.brat.types_entity;
  }
  get types_relation() {
    return this.$store.getters.brat.types_relation;
  }
  // get relation_types() {
  //   if (!this.origin.type || !this.target.type) return [];
  //   const arr = this.$store.state.brat.collectionObj.relation_types;
  //   return arr.filter(item => {
  //     const temp = [...item.args[0].targets, ...item.args[1].targets];
  //     return (
  //       temp.includes(this.origin.type) && temp.includes(this.target.type)
  //     );
  //   });
  // }

  activeName: "Text" | "Entity" | "Relation" = "Text";

  formValueText = {
    text: ""
  };
  formValueEntity = {
    text: "",
    type: ""
  };
  formValueRelation = {
    type: "",
    arg1: "",
    arg1type: "",
    arg2: "",
    arg2type: ""
  };
  arg1Options = [];
  arg2Options = [];

  Cancel() {
    this.$emit("input", false);
  }

  // 关系搜索，下拉框，Type与arg1\2联动
  ChangeFirst(key: string) {
    if (key) {
      this.arg1Options = this.types_relation[key].args[0].targets;
      this.arg2Options = this.types_relation[key].args[1].targets;
    } else {
      this.arg1Options = [];
      this.arg2Options = [];
    }
    this.formValueRelation.arg1 = "";
    this.formValueRelation.arg1type = "";
    this.formValueRelation.arg2 = "";
    this.formValueRelation.arg2type = "";
  }

  Search() {
    const loading = this.$loading({ lock: true });
    const dataKey = `formValue${this.activeName}` as
      | "formValueText"
      | "formValueEntity"
      | "formValueRelation";
    const methodName = `computed${this.activeName}Offsets` as
      | "computedTextOffsets"
      | "computedEntityOffsets"
      | "computedRelationOffsets";
    const params = {
      action: `search${this.activeName}InDocument`,
      ...this[dataKey]
    };

    this.$store
      .dispatch("brat/Search", params)
      .then(res => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const matchs: any[] = [];
        res.items.forEach((item: unknown[]) => matchs.push(item[3]));
        this[methodName](matchs);
        this.Cancel();
      })
      .catch(err => this.$message({ message: err, type: "error" }))
      .finally(() => loading.close());
  }

  /** 计算搜索的文本在整个文档中的位置 */
  computedTextOffsets(matchs: string[]) {
    const lines_offset = this.$store.state.brat.documentObj.sentence_offsets;
    const lines_ele = document.querySelectorAll(".text tspan");
    if (
      !lines_offset ||
      !lines_ele ||
      lines_offset.length === 0 ||
      lines_ele.length === 0
    )
      return;

    const svg = document.querySelector(`#svg`);
    const svgRect = svg?.getBoundingClientRect() as DOMRect;
    const searchResult: BratRect[] = [];
    let index = 0;
    lines_offset.forEach(([lineFrom, lineEnd]: number[], lineIndex: number) => {
      for (; index < matchs.length; index++) {
        let [from, to]: number[] | string[] = matchs[index].split("-");
        from = parseInt(from);
        to = parseInt(to);

        if (from > lineEnd) break;
        if (lineFrom > from) continue;

        const rect = CreateRangeDOMRect(
          lines_ele[lineIndex] as HTMLElement,
          from - lineFrom,
          to - lineFrom
        );
        if (!rect) continue;

        rect.x -= svgRect.left + 1;
        rect.y -= svgRect.top;
        searchResult.push(rect);
      }
    });
    this.$store.commit("brat/SetSearchResult", searchResult);
  }
  /** 计算搜索的 实体 在整个文档中的位置 */
  computedEntityOffsets(matchs: PlainObject[]) {
    const svg = document.querySelector(`#svg`);
    const svgRect = svg?.getBoundingClientRect() as DOMRect;
    const searchResult: BratRect[] = [];
    matchs.forEach(id => {
      const ele = document.querySelector(`[data-span-id="${id}"]`);
      const rect = (ele as HTMLElement).getBoundingClientRect();
      rect.x -= svgRect.left + 4;
      rect.y -= svgRect.top + 4;
      rect.width += 6;
      rect.height += 6;
      searchResult.push({ ...rect, rx: 2, ry: 2 });
    });
    this.$store.commit("brat/SetSearchResult", searchResult);
  }
  /** 计算搜索的 关系 在整个文档中的位置 */
  computedRelationOffsets(matchs: PlainObject[]) {
    const svg = document.querySelector(`#svg`);
    const svgRect = svg?.getBoundingClientRect() as DOMRect;
    const searchResult: BratRect[] = [];
    matchs.forEach(id => {
      const ele = document.querySelector(`[data-arc-id="${id}"] rect`);
      const rect = (ele as HTMLElement).getBoundingClientRect();
      rect.x -= svgRect.left + 4;
      rect.y -= svgRect.top + 4;
      rect.width += 6;
      rect.height += 6;
      searchResult.push({ ...rect, rx: 4, ry: 4 });
    });
    this.$store.commit("brat/SetSearchResult", searchResult);
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
