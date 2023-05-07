<template>
  <el-dialog :title="title" :visible="value" @close="Cancel">
    <p class="pb10">
      <b>From: [{{ origin.type }}] - </b> {{ origin.txt }}
    </p>
    <p class="pb10">
      <b>To: [{{ target.type }}] - </b> {{ target.txt }}
    </p>
    <el-divider content-position="left">Type</el-divider>
    <el-radio-group v-model="choosed">
      <el-radio
        class="mb20"
        v-for="item in relation_types"
        :key="item.name"
        :label="item.type"
        >{{ item.name }}</el-radio
      >
    </el-radio-group>
    <span slot="footer" class="dialog-footer">
      <el-button size="small" @click="Cancel">Cancel</el-button>
      <el-button
        size="small"
        type="danger"
        @click="Del"
        v-if="item && item.conf"
      >
        Delete
      </el-button>
      <el-button size="small" type="primary" @click="Submit"> Ok </el-button>
    </span>
  </el-dialog>
</template>

<script>
export default {
  name: 'BratRelation',
  data() {
    return {
      title: 'New Annotation',
      choosed: '',
      origin: {},
      target: {},
    };
  },
  computed: {
    relation_types() {
      if (!this.origin.type || !this.target.type) return [];
      const arr = this.$store.state.brat.collectionObj.relation_types;
      return arr.filter(item => {
        const temp = [...item.args[0].targets, ...item.args[1].targets];
        return (
          temp.includes(this.origin.type) && temp.includes(this.target.type)
        );
      });
    },
  },
  props: {
    value: {
      type: Boolean,
      default: false,
    },
    item: {
      type: Object,
      default: () => {
        return {};
      },
    },
  },
  watch: {
    value: {
      immediate: true,
      handler(val) {
        if (!val || !this.item) return;
        if (this.item.conf) {
          this.title = 'Edit Annotation';
          this.choosed = this.item.conf.type;
        } else {
          this.title = 'New Annotation';
          this.choosed = '';
        }
        this.computedEntity();
      },
    },
  },
  methods: {
    Cancel() {
      this.$emit('input', false);
    },
    Del() {
      if (!this.choosed) return;
      const loading = this.$loading({ lock: true });
      const params = {
        type: this.choosed,
        old_type: this.item.conf.type,
        origin: this.item.originId,
        target: this.item.targetId,
        old_target: this.item.targetId,
      };
      this.$store
        .dispatch('brat/RelationDel', params)
        .then(() => {
          this.$Bus.$emit('rerender-svg');
          this.Cancel();
        })
        .catch(err => this.$message({ message: err, type: 'error' }))
        .finally(() => loading.close());
    },
    Submit() {
      if (!this.choosed) return;

      const loading = this.$loading({ lock: true });
      const params = {
        type: this.choosed,
        origin: this.item.originId,
        target: this.item.targetId,
      };
      if (this.item.conf) {
        params.old_type = this.item.conf.type;
        params.old_target = this.item.targetId;
      }

      this.$store
        .dispatch('brat/RelationCreateOrEdit', params)
        .then(() => {
          this.$Bus.$emit('rerender-svg');
          this.Cancel();
        })
        .catch(err => this.$message({ message: err, type: 'error' }))
        .finally(() => loading.close());
    },
    /** 计算实体的文本 */
    computedEntity() {
      let text = this.$store.state.brat.documentObj.text;
      function GetTxt(offsets) {
        let resstr = '';
        offsets.forEach(([from, to]) => {
          resstr = `${resstr}${text.substr(from, to - from)}`;
        });
        return resstr;
      }

      if (this.item) {
        this.origin = {};
        this.target = {};
        this.$store.state.brat.documentObj.entities.find(entity => {
          if (entity[0] === this.item.originId)
            this.origin = { type: entity[1], txt: GetTxt(entity[2]) };
          if (entity[0] === this.item.targetId)
            this.target = { type: entity[1], txt: GetTxt(entity[2]) };

          return this.origin.type && this.target.type;
        });
      }
    },
  },
};
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
