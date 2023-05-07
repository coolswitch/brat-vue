declare module "*.vue" {
  import Vue from "vue";
  export default Vue;
}

declare type PlainObject = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prop: string]: any;
};

declare type ApiObject = {
  url: string;
  method: "post" | "get" | "delete" | "put";
};

declare type ApiModuleObject = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prop: string]: ApiObject;
};

declare type BratRect = {
  x: number;
  y: number;
  width: number;
  height: number;
  txt?: string;
  rx?: number;
  ry?: number;
};

declare type DirectionType =
  | "goleft"
  | "goright"
  | "golefttop"
  | "gorighttop"
  | "gorightbottom"
  | "goleftbottom";

declare type PosType = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};

declare type DrawLineParams = {
  direction: DirectionType;
  pos: PosType;
};
