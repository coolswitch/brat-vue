<template>
  <el-dialog title="Open" :visible="value" @close="Cancel">
    <div class="coltitle">Collection： {{ collectionPath }}</div>

    <el-table
      :data="tableData"
      height="40vh"
      width="auto"
      size="small"
      highlight-current-row
      @current-change="row => (currentRow = row)"
      @row-dblclick="Open"
      v-loading="tableData.length == 0"
    >
      <el-table-column
        v-for="(item, index) in tableData.fields"
        :key="index"
        :property="item"
        :label="item"
        :show-overflow-tooltip="true"
        :width="index < 1 ? 'auto' : index < 2 ? 100 : 75"
      >
        <template slot-scope="scope">
          <template v-if="item === 'Modified'">
            {{ scope.row.Modified | formatTimeAgo }}
          </template>
          <span
            v-else-if="item === 'Document'"
            :class="`icon_${scope.row.type}`"
          >
            {{ scope.row.Document }}
          </span>
          <template v-else>
            {{ scope.row[item] }}
          </template>
        </template>
      </el-table-column>
    </el-table>
    <span slot="footer" class="dialog-footer">
      <el-button size="small" @click="Cancel">取 消</el-button>
      <el-button size="small" type="primary" @click="Open()">确 定</el-button>
    </span>
  </el-dialog>
</template>

<script lang="ts">
import { Component, Vue, Prop } from "vue-property-decorator";
import { formatTimeAgo } from "../brat-util";

@Component({ filters: { formatTimeAgo } })
export default class BratCol extends Vue {
  @Prop({ type: Boolean, default: false })
  private value!: boolean;

  get collectionPath() {
    return this.$store.state.brat.collectionPath;
  }
  get tableData() {
    return this.$store.getters["brat/collectionList"];
  }

  currentRow: PlainObject | null = null;

  Open(row: PlainObject) {
    if (row) this.currentRow = row;
    if (this.currentRow?.Document === "..") {
      location.hash = this.collectionPath.replace(/\/[^/]+\/$/, "/");
    } else {
      location.hash = `${this.collectionPath}${this.currentRow?.Document}`;
    }
    this.$emit("input", false);
  }

  Cancel() {
    this.$emit("input", false);
  }
}
</script>

<style scoped>
.coltitle {
  padding: 0 0 20px 8px;
  font-weight: 500;
}
.icon_c,
.icon_d {
  display: inline-block;
  padding-left: 20px;
  background-position: left center;
  background-repeat: no-repeat;
}
.icon_c {
  background-image: url(/static/img/Fugue-shadowless-folder-horizontal-open.png);
}
.icon_d {
  background-image: url(/static/img/Fugue-shadowless-document.png);
}
</style>
