/* eslint-disable @typescript-eslint/camelcase */
import Vue from "vue";
import Vuex, { Dispatch, StoreOptions } from "vuex";
import $axios from "../tools/ajax";
import { BRAT as API } from "../tools/API";
import { Array2Obj, CreateSvgTextGetSize } from "../views/brat/brat-util";
import { Message } from "element-ui";

Vue.use(Vuex);
const PROTOCOL_VERSION = 1;

const Configuration = {
  abbrevsOn: true,
  textBackgrounds: "striped",
  visual: {
    margin: { x: 2, y: 1 },
    arcTextMargin: 1,
    boxSpacing: 1,
    curlyHeight: 4,
    arcSpacing: 9, //10;
    arcStartHeight: 19 //23; //25;
  },
  svgWidth: "100%",
  rapidModeOn: false,
  confirmModeOn: true,
  autorefreshOn: false,
  typeCollapseLimit: 30
};

/** 发送请求并重新请求当前文档，参数自动添加collection、document */
function RequestAndRerender(
  state: PlainObject,
  dispatch: Dispatch,
  params: PlainObject
) {
  params.collection = state.collectionPath;
  params.document = state.documentPath;
  return dispatch("CGI", params).then((res: PlainObject) => {
    if (!res.exception) {
      // 返回的分段不对，需要重新请求
      return dispatch("GetDocument", {
        coll: state.collectionPath,
        doc: state.documentPath
      });
    } else {
      return Promise.reject(res.messages[0][0]);
    }
  });
}

/** 得到实体配置，颜色宽度等 */
function ComputedConfig(confs: PlainObject[]) {
  const newConfs: PlainObject = {};
  confs.forEach((entity: PlainObject) => {
    const { width } = CreateSvgTextGetSize(entity.type, 10);
    newConfs[entity.type] = { ...entity, width };
  });
  return newConfs;
}

const brat: StoreOptions<PlainObject> = {
  state: {
    loginUser: null,
    collectionObj: {},
    collectionPath: "",
    documentObj: {},
    documentPath: "",
    loadingColl: false,
    loadingDoc: false,

    searchResult: [],

    configuration: Configuration
  },
  getters: {
    // 集合列表
    collectionList(state) {
      if (!state.collectionObj.items) return [];

      const fields = state.collectionObj.header.map(
        (item: string[]) => item[0]
      );
      const rows = state.collectionObj.items.map((item: string[]) => {
        // 数组转换为对象
        const row: PlainObject = { type: item[0], Document: item[2] };
        fields.forEach((key: string, index: number) => {
          if (index === 0) {
            row.type = item[0];
            row[key] = item[2];
          } else {
            row[key] = item.length > index + 2 ? item[index + 2] : "";
          }
        });
        return row;
      });
      rows.fields = fields;
      return rows;
    },
    /** 实体的属性：颜色、宽度等 */
    types_entity(state) {
      return ComputedConfig(state.collectionObj.entity_types || []);
    },
    types_unconfigured(state) {
      return ComputedConfig(state.collectionObj.unconfigured_types || []);
    },
    types_relation(state) {
      return Array2Obj(state.collectionObj.relation_types || [], "type");
    }
  },
  mutations: {
    SetUser(state, payload) {
      state.loginUser = payload;
    },
    SetColl(state, payload) {
      state.collectionObj = payload;
    },
    SetColPath(state, payload) {
      state.collectionPath = payload;
    },
    SetDoc(state, payload) {
      state.documentObj = payload;
    },
    SetDocPath(state, payload) {
      state.documentPath = payload;
    },
    ClearDoc(state) {
      state.documentObj = {};
      state.documentPath = "";
    },
    NextOrPrev(state, payload) {
      const colList = (this.getters as PlainObject).collectionList(state);
      let index = colList.findIndex((item: PlainObject) => {
        return state.documentPath === item.Document;
      });
      index += payload;
      if (index < 0) return Message.error("这是第一篇");
      if (index >= colList.length) return Message.error("这是最后一篇");
      location.hash = `${state.collectionPath}${colList[index].Document}`;
      state.searchResult = [];
    },
    SetLoading(state, payload) {
      Object.keys(payload).forEach(key => (state[key] = payload[key]));
    },
    SetConfiguration(state, payload) {
      state.configuration = payload;
    },
    SetSearchResult(state, payload) {
      state.searchResult = payload;
    }
  },
  actions: {
    CGI(_, params) {
      params.protocol = PROTOCOL_VERSION;
      let fd = "";
      Object.keys(params).forEach(key => {
        let val = params[key];
        if (typeof params[key] === "object") val = JSON.stringify(val);
        fd = `${fd}&${encodeURIComponent(key)}=${encodeURIComponent(val)}`;
      });
      fd = fd.substr(1);
      return $axios(API.CGI, fd);
    },
    CheckAuth({ dispatch, commit }) {
      dispatch("CGI", { action: "whoami" }).then(res => {
        if (res.user) commit("SetUser", res.user);
        else commit("SetUser", null);
      });
    },
    LoadConf({ dispatch, commit }) {
      return dispatch("CGI", { action: "loadConf" }).then(res => {
        if (res.config != undefined) {
          try {
            commit("SetConfiguration", JSON.parse(res.config));
          } catch (x) {
            commit("SetConfiguration", {});
            return Promise.reject("Corrupted configuration; resetting.");
          }
        }
        return Promise.resolve();
      });
    },
    GetDocument({ dispatch, commit, state }, { coll, doc }) {
      if (state.loadingDoc) return;
      commit("SetLoading", { loadingDoc: true });

      const params = { action: "getDocument", collection: coll, document: doc };
      return dispatch("CGI", params).then(res => {
        commit("SetLoading", { loadingDoc: false });
        if (res.exception) return Promise.reject(res.exception);
        commit("SetDoc", res);
        commit("SetDocPath", doc);
        return Promise.resolve();
      });
    },
    GetDocList({ dispatch, commit, state }, coll) {
      if (state.loadingColl) return;
      commit("SetColPath", coll);
      commit("SetLoading", { loadingColl: true });

      const params = { action: "getCollectionInformation", collection: coll };
      return dispatch("CGI", params).then(res => {
        commit("SetLoading", { loadingColl: false });
        if (res.exception) return Promise.reject(res.exception);
        commit("SetColl", res);
        return Promise.resolve();
      });
    },

    EntityCreateOrEdit({ dispatch, state }, { id, type, offsets }) {
      const params: PlainObject = {
        action: "createSpan",
        offsets,
        type,
        comment: "",
        attributes: {},
        normalizations: []
      };
      if (id) params.id = id;
      return RequestAndRerender(state, dispatch, params);
    },
    EntityDel({ dispatch, state }, { id, type, offsets }) {
      const params = {
        action: "deleteSpan",
        offsets,
        type,
        id
      };
      return RequestAndRerender(state, dispatch, params);
    },

    RelationCreateOrEdit({ dispatch, state }, payload) {
      const params = {
        action: "createArc",
        comment: "",
        // { type, old_type, origin, target, old_target }
        ...payload
      };
      return RequestAndRerender(state, dispatch, params);
    },
    RelationDel({ dispatch, state }, payload) {
      const params = {
        action: "deleteArc",
        // { type, old_type, origin, target, old_target }
        ...payload
      };
      return RequestAndRerender(state, dispatch, params);
    },

    Search({ dispatch, state }, payload) {
      const params = {
        // // action: 'deleteArc',
        collection: state.collectionPath,
        document: state.documentPath,
        scope: "document",
        concordancing: false,
        context_length: "50",
        text_match: "word",
        match_case: false,
        // // { type, text, arg1, arg1type, arg2, arg2type }
        ...payload
      };
      return dispatch("CGI", params).then(res => {
        if (res.exception) return Promise.reject(res.messages[0][0]);
        return Promise.resolve(res);
      });
    },

    Download({ dispatch, state }, payload) {
      const params = {
        // // action: 'deleteArc',
        collection: state.collectionPath,
        document: state.documentPath,
        // { action=downloadFile downloadCollection, extension=ann txt }
        ...payload
      };
      let query = "";
      Object.keys(params).forEach(key => {
        query = `${query}&${key}=${encodeURIComponent(params[key])}`;
      });
      // window.open(`${API.CGI.url}?${query.substr(1)}`, '_blank')
      return dispatch("CGI", params).then(res => {
        if (res.exception) return Promise.reject(res.messages[0][0]);
        return Promise.resolve(res);
      });
    }
  }
};

export default new Vuex.Store({
  modules: {
    brat: {
      namespaced: true,
      ...brat
    }
  }
});
