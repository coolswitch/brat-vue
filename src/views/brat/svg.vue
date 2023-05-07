<template>
  <div id="svg" ref="svgbox">
    <!-- eslint-disable -->
    <!-- 默认值：行号宽29，分隔线位置从31开始，真实内容从35开始 -->
    <!-- 默认值：行背景高度 = 文字高度 + 3 + 批注 -->
    <!-- 默认值：有批注的行向上空白10px，批注本身大概高16px -->
    <svg
      xmlns="http://www.w3.org/2000/svg"
      version="1.1"
      :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
      :style="{ width: `${svgWidth}px`, height: `${svgHeight}px` }"
      @click.prevent="CreatingEntity"
      @mousemove="DragIng"
      @mouseup="DragEnd"
    >
      <!-- document: //texttest -->
      <defs>
        <filter id="Gaussian_Blur">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
        </filter>
        <marker
          id="drag_arrow"
          refX="5"
          refY="2.5"
          markerWidth="5"
          markerHeight="5"
          orient="auto"
          markerUnits="strokeWidth"
          class="drag_fill"
        >
          <polyline points="0,0 5,2.5 0,5 0.2,2.5" />
        </marker>
      </defs>
      <!-- 背景 -->
      <g class="background">
        <rect
          v-for="(row, index) in rows"
          :key="index"
          x="0"
          :y="row.y + constSize.backgroundPadding + 1"
          width="100%"
          :height="row.h"
          :transform="`translate(0, -${row.h})`"
          :class="`background${index % 2}`"
        />
      </g>
      <g class="glow" />
      <!-- 背景高亮 -->
      <g class="highlight">
        <template v-for="(row, index) in rows">
          <rect
            v-for="entity in row.entities"
            :key="index + entity.id"
            :x="entity.x"
            :y="row.y + constSize.backgroundPadding"
            :width="entity.width"
            :height="entity.height"
            :transform="`translate(0, -${entity.height})`"
            :fill="entity.conf.bgColor"
            :fill-opacity="hoverIds.indexOf(entity.id) < 0 ? 0.25 : 1"
            rx="3"
            ry="3"
          />
        </template>
        <!-- 搜索结果高亮 -->
        <rect
          v-for="(item, index) in searchResult"
          :key="index"
          :x="item.x"
          :y="item.y"
          :width="item.width"
          :height="item.height"
          :rx="item.rx || 0"
          :ry="item.ry || 0"
          fill="yellow"
        >
          <animate
            data-type="matchfocus"
            attributeName="fill"
            values="#FF9632;#FFCC00;#FF9632"
            dur="2s"
            repeatCount="indefinite"
          />
        </rect>
        <!-- <rect x="-11.5" y="-34.1875" width="49.2699813842" height="23" class="shadow_EditHighlight" rx="6" ry="6">
          <animate data-type="matchfocus" attributeName="fill" values="#FF9632;#FFCC00;#FF9632" dur="2s" repeatCount="indefinite" begin="indefinite"/></rect> -->
      </g>
      <!-- 行号 -->
      <g class="sentnum">
        <text
          v-for="(row, index) in rows"
          :key="index"
          :x="constSize.widthLineNumber"
          :y="row.y"
          :data-sent="index"
        >
          {{ index + 1 }}
        </text>
        <path
          :d="
            `M${constSize.startDivideLine},0 L${constSize.startDivideLine},${svgHeight}`
          "
        />
      </g>
      <!-- 文字 -->
      <g class="text" ref="texts">
        <text x="0" y="0" v-for="(txt, index) in textArray" :key="index">
          <tspan
            x="35"
            :y="rows[index] ? rows[index].y : 0"
            :data-chunk-id="index"
          >
            {{ txt }}
          </tspan>
        </text>
      </g>
      <!-- 标注 -- 标注结构：
        整体top <g>
          整体left <g>
            行内 位置大小 <rect>
      -->
      <g
        v-for="(row, index) in rows"
        :key="index"
        :transform="`translate(0, ${row.y})`"
      >
        <g />
        <g
          v-for="entity in row.entities"
          :key="entity.id + index"
          :transform="`translate(${entity.x}, 0)`"
        >
          <g />
          <g class="span">
            <rect
              :class="`span_${entity.type} span_default`"
              :x="entity.width / 2 - entity.conf.width / 2"
              :y="-28"
              :width="entity.conf.width"
              height="11"
              rx="2"
              ry="1"
              :fill="entity.conf.bgColor"
              :stroke="entity.conf.borderColor"
              :data-span-id="entity.id"
              :stroke-width="hoverIds.indexOf(entity.id) < 0 ? 0.75 : 2"
              @mouseover="HoverIn(entity.id)"
              @mousemove="Hovering"
              @mouseout="HoverOut"
              @dblclick="EditingEntity(entity)"
              @mousedown="DragStart"
            />
            <text :x="entity.width / 2" y="-19.5" fill="black">
              {{ entity.type }}
            </text>
            <path
              :d="
                `M0,-12 
              C0,-16 ${entity.width / 2},-12 ${entity.width / 2},-16 
              C${entity.width / 2},-12 ${entity.width},-16 ${entity.width},-12`
              "
              class="curly"
            />
          </g>
        </g>
      </g>
      <path
        marker-end="url(#drag_arrow)"
        class="drag_stroke"
        :visibility="dragingIds.length === 1 ? 'visible' : 'hidden'"
        :d="dragingD"
      />
      <!-- 关系 线 -->
      <g
        v-for="(rel, index) in relations"
        :key="rel.id"
        :data-arc-id="rel.id"
        :data-arc-target="rel.targetId"
        :data-arc-origin="rel.originId"
        :opacity="
          hoverIds.indexOf(rel.targetId) > -1 &&
          hoverIds.indexOf(rel.originId) > -1
            ? 1
            : 0.5
        "
        @mouseover="HoverIn(rel.targetId, rel.originId)"
        @mousemove="Hovering"
        @mouseout="HoverOut"
        @dblclick="EditingRelation(rel)"
        class="relation"
      >
        <path marker-end="url(#drag_arrow)" :d="rel.d" />
        <rect
          :x="rel.bgx"
          :y="rel.bgy"
          :width="rel.width"
          :height="rel.height"
        />
        <text :data-arc-role="rel.conf.type" :x="rel.x" :y="rel.y">
          {{ rel.conf.type }}
        </text>
      </g>
    </svg>

    <pop-comment v-show="isShowComment" :mouseEvent="hoverEvent" />
    <pop-entity v-model="isShowEntity" :item="editingItem" />
    <pop-relation v-model="isShowRelation" :item="editingItem" />
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import PopComment from "./popup/comment";
import PopEntity from "./popup/entity";
import PopRelation from "./popup/relation";
import {
  CreateRangeDOMRect,
  BratColor,
  GetEntitiesLineD,
  GetLineD,
  HandlerOverlapEntities,
} from "./brat-util.js";

const constSize = {};
/** 行号宽 */
constSize.widthLineNumber = 29;
/** 分隔线位置，行号宽+2 */
constSize.startDivideLine = constSize.widthLineNumber + 2;
/** 文本开始位置，行号宽+6 */
constSize.startText = constSize.widthLineNumber + 6;
/** 最小行高，空行使用 */
constSize.minLineHeight = 15.5;
/** 行背景比行高3px */
constSize.backgroundPadding = 3;
/** 实体上向padding 3px */
constSize.entityPadding = 10;

export default {
  name: "BratSvg",
  components: { PopComment, PopEntity, PopRelation },
  data() {
    return {
      constSize, // 默认大小们
      svgWidth: "100%",
      svgHeight: 120,
      /** 每行上的实体 [{ eleTxt, w, h, y, entities: [{entity, x,y,width,height}] }] */
      rows: [],
      /** 关系线 */
      relations: [],

      hoverIds: [],
      hoverEvent: null,
      isShowComment: false,

      isShowEntity: false,
      isShowRelation: false,
      editingItem: null,
      dragingIds: [],
      dragingD: "",
    };
  },
  computed: {
    /** 任务配置，实体|关系 的 大小|背景|边框|字体|颜色， */
    ...mapGetters("brat", [
      "types_entity",
      "types_unconfigured",
      "types_relation",
    ]),

    documentPath() {
      return this.$store.state.brat.documentPath;
    },
    // 按行分割文本
    textArray() {
      const lines_offset = this.$store.state.brat.documentObj.sentence_offsets;
      const txt = this.$store.state.brat.documentObj.text;
      const arr = [];
      (lines_offset || []).forEach(([from, end]) =>
        arr.push(txt.substr(from, end - from))
      );
      return arr;
    },
    /** 实体们(按字符位置排序) => [{ from, to, id, type }] */
    entitiesSorted() {
      const origin = this.$store.state.brat.documentObj.entities;
      // ['T1', 'xxx', [[2-9]]] => [{ from, to, id, type }...]
      const sorted = [];
      (origin || []).forEach((entity) => {
        const [id, type] = entity;
        entity[2].forEach((pos) => {
          sorted.push({ from: pos[0], to: pos[1], id, type });
        });
      });
      // 按字符位置排序所有实体
      sorted.sort((a, b) => a.from - b.from);
      return sorted;
    },
    searchResult() {
      return this.$store.state.brat.searchResult;
    },
  },
  watch: {
    documentPath: {
      immediate: true,
      handler(val) {
        if (val) this.$nextTick(() => this.ComputedRows());
        this.rows = [];
      },
    },
  },
  methods: {
    /** 得到每行数据
     * [{ eleTxt, w, h, y, entities: [{entity, x,y,width,height}] }]
     */
    ComputedRows() {
      const lines_offset = this.$store.state.brat.documentObj.sentence_offsets;
      const lines_ele = this.$refs.texts.children;
      if (
        !lines_offset ||
        lines_offset.length === 0 ||
        !lines_ele ||
        lines_ele.length === 0
      )
        return;

      const rows = [];
      let svgHeight = 0;
      let svgWidth = this.$refs.svgbox.clientWidth;
      let entitiesSortedIndex = 0;
      lines_offset.forEach(([lineFrom, lineEnd], index) => {
        const row = { eleTxt: lines_ele[index] };
        const size = row.eleTxt.getBoundingClientRect();
        row.w = size.width + constSize.startText;
        row.h = size.height || constSize.minLineHeight;
        row.h += constSize.backgroundPadding;
        row.y = svgHeight + row.h;

        const [entities, i, lineHeight] = this.GetEntities(
          lineFrom,
          lineEnd,
          row.eleTxt,
          entitiesSortedIndex
        );
        entitiesSortedIndex = i;
        if (entities.length) {
          // 有批注的行向上空白10px，批注本身大概高16px
          row.h += constSize.entityPadding + lineHeight;
          row.y += constSize.entityPadding + lineHeight;
        }
        row.entities = entities;
        rows.push(row);

        svgHeight = row.y;
        svgWidth = row.w > svgWidth ? row.w : svgWidth;
      });
      this.svgWidth = svgWidth;
      this.svgHeight = svgHeight + this.constSize.backgroundPadding + 1;
      this.rows = rows;
      this.$nextTick(() => this.ComputedRelations());
    },
    /** 得到某行的实体们
     * returns: i, [{id, type, x,y,width,height}] */
    GetEntities(lineFrom, lineEnd, eleTxt, index) {
      const entities = [];
      const svgOffsetLeft = this.$refs.svgbox.offsetLeft;
      for (; index < this.entitiesSorted.length; index++) {
        const { from, to, id, type } = this.entitiesSorted[index];
        if (from > lineEnd) break;
        if (lineFrom <= from) {
          let { x, y, width, height } = CreateRangeDOMRect(
            eleTxt.children[0],
            from - lineFrom,
            to - lineFrom
          );
          x -= svgOffsetLeft + 1;

          const conf = this.types_entity[type] || this.types_unconfigured[type];
          if (conf.borderColor === "darken") {
            conf.borderColor = new BratColor(conf.bgColor).toDark(80);
          }
          entities.push({ id, type, x, y, width, height, conf });
        }
      }
      // 计算实体位置是否重叠
      // 上一个元素的结尾位置是否大于下一个元素的开始位置
      const { entities: newarr, overlapNum } = HandlerOverlapEntities(entities);
      const lineHeight = 16 * overlapNum;
      return [entities, index, lineHeight];
    },
    /** 计算关系线
     * returns: { id, originId, targetId, conf }
     */
    ComputedRelations() {
      const origin = this.$store.state.brat.documentObj.relations;
      const newarr = [];
      origin.forEach(([id, type, [source, target]]) => {
        const line = GetEntitiesLineD(source[1], target[1], type);
        newarr.push({
          id,
          originId: source[1],
          targetId: target[1],
          conf: this.types_relation[type],
          ...line,
        });
      });
      this.relations = newarr;
    },

    HoverIn(originId, targetId) {
      if (targetId) {
        this.hoverIds = [originId, targetId];
        this.relations.forEach((item) => {
          if (item.originId === targetId) this.hoverIds.push(item.targetId);
          if (item.targetId === originId) this.hoverIds.push(item.originId);
        });
      } else {
        this.hoverIds = [originId];
        this.relations.forEach((item) => {
          if (item.originId === originId) this.hoverIds.push(item.targetId);
          if (item.targetId === originId) this.hoverIds.push(item.originId);
        });
      }
      setTimeout(() => {
        if (this.hoverEvent) this.isShowComment = true;
      }, 500);
    },
    HoverOut() {
      this.hoverIds = [];
      this.hoverEvent = null;
      this.isShowComment = false;
    },
    Hovering(e) {
      this.hoverEvent = e;
    },
    DragStart(e) {
      const target = e.target;
      if (target.nodeName === "rect" && target.getAttribute("data-span-id")) {
        const id = target.getAttribute("data-span-id");
        this.dragingIds = [{ id, x: e.offsetX, y: e.offsetY }];
      }
    },
    DragIng(e) {
      if (this.dragingIds.length === 1) {
        this.dragingD = GetLineD(this.dragingIds[0], {
          x: e.offsetX,
          y: e.offsetY,
        });
      }
    },
    DragEnd(e) {
      const target = e.target;
      if (target.nodeName === "rect" && target.getAttribute("data-span-id")) {
        const targetId = target.getAttribute("data-span-id");
        // 不可以向自己连线
        if (this.dragingIds[0].id != targetId) {
          this.editingItem = { originId: this.dragingIds[0].id, targetId };
          this.isShowRelation = true;
        }
      }
      this.dragingIds = [];
      this.dragingD = "";
    },
    EditingRelation(item) {
      this.editingItem = item;
      this.isShowRelation = true;
    },

    CreatingEntity(e) {
      const selection = window.getSelection();
      if (
        e.target.nodeName === "rect" ||
        selection.toString().replace(".", "") === ""
      ) {
        selection.removeAllRanges();
        return;
      }
      this.editingItem = null;
      this.isShowEntity = true;
    },
    EditingEntity(item) {
      this.editingItem = item;
      this.isShowEntity = true;
    },

    ReRender() {
      this.$nextTick(() => this.ComputedRows());
    },
  },
  created() {
    this.$Bus.$on("rerender-svg", this.ReRender);
  },
  beforeDestroy() {
    this.$Bus.$off("rerender-svg", this.ReRender);
  },
};
</script>

<style>
#svg {
  position: relative;
  overflow: auto;
  border: 1px solid #7fa2ff;
}
svg {
  width: 100%;
  height: 50px;
  font-size: 15px;
}
svg.reselect {
  border: 1px solid #ff3333;
}

/* "basic" font */
text {
  font-size: 13px;
  font-family: "Liberation Sans", Verdana, Arial, Helvetica, sans-serif;
}

@-webkit-keyframes pulse {
  0% {
    color: #9999ff;
    margin-top: 0;
  }
  50% {
    color: #ffffff;
    margin-top: 7px;
  }
  100% {
    color: #9999ff;
    margin-top: 0;
  }
}

path {
  pointer-events: none;
}

/* "basic" font */
.span text {
  /*  font-size: 10.5px; */
  font-size: 10px;
  text-anchor: middle;
  font-family: "PT Sans Caption", sans-serif;
  pointer-events: none;
  user-select: none;
}

/* this should likely match span font */
.span_type_label {
  font-size: 11px;
  font-family: "PT Sans Caption", sans-serif;
}
/* this should likely match arc font */
.arc_type_label {
  font-size: 11px;
  font-family: "PT Sans Caption", sans-serif;
}
text[data-arc-role] {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

.span path {
  fill: none;
}
.span rect {
  user-select: none;
}

g.relation path,
.drag_stroke {
  stroke: black;
  fill: none;
}
g.relation text {
  fill: #000;
  font-size: 12px;
  stroke-width: 0.75;
  user-select: none;
}
g.relation rect {
  fill: #fff;
}

.glyph {
  font-family: sans-serif;
  font-weight: bold;
}

.span path.curly {
  /* 'stroke' def here blocks 'stroke' set in JS..? */
  stroke: grey;
  stroke-width: 0.5;
}

.span path.boxcross {
  stroke: black;
  opacity: 0.5;
}

.arcs path {
  stroke: #989898;
  fill: none;
  stroke-width: 1;
}

.arcs .highlight path {
  stroke: #000000;
  stroke-width: 1.5;
  opacity: 1;
}
.arcs .highlight text {
  stroke: black;
  fill: black;
  stroke-width: 0.5;
}
.span.highlight rect {
  stroke-width: 2px;
}
.span rect.reselect {
  stroke-width: 2px;
}
.span rect.reselectTarget {
  stroke-width: 2px;
}
.arcs .reselect path {
  stroke-width: 2px;
  stroke: #ff0000 !important;
}
.arcs .reselect text {
  fill: #ff0000 !important;
}

.span rect.badTarget {
  stroke: #f00;
}

.arcs text {
  font-size: 9px;
  text-anchor: middle;
  font-family: "PT Sans Caption", sans-serif;
  /* dominant-baseline: central; */
  cursor: default;
}

.background0 {
  stroke: none;
  fill: #ffffff;
}

.background1 {
  stroke: none;
  fill: #eeeeee;
}

.backgroundHighlight {
  stroke: none;
  fill: #ffff99;
}

.sentnum text {
  fill: #999999;
  text-anchor: end;
  user-select: none;
}

.sentnum path {
  stroke: #999999;
  stroke-width: 1px;
}

.span_cue {
  fill: #eeeeee !important;
}

/* Apple iPad, iPhone, iPod */

* {
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
  -webkit-text-size-adjust: none;
  select: none;
}

.span rect.AddedAnnotation {
  stroke: #ff4141;
  stroke-width: 2;
}
.shadow_AddedAnnotation {
  fill: #ff4141;
}
.span rect.MissingAnnotation {
  stroke: #ffffff;
  stroke-width: 2;
}
.shadow_MissingAnnotation {
  fill: #ff4141;
  opacity: 0.3;
}
.span rect.MissingAnnotation + text {
  opacity: 0.5;
}
.span rect.ChangedAnnotation {
  stroke: #ffff99;
  stroke-width: 2;
}
.shadow_ChangedAnnotation {
  fill: #ff4141;
}
</style>
