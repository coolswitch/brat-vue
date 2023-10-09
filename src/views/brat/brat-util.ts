// --- svg 相关 start ---

function DrawLine(
  direction: DirectionType,
  { left, right, top, bottom }: PosType
) {
  left += window.scrollX;
  right += window.scrollX;
  let c1, c2;
  const curve = 10;
  switch (direction) {
    case "goleft":
      c1 = left + (right - left) / 2;
      c2 = bottom - curve;
      return `M${right},${bottom} Q${c1},${c2}, ${left},${top}`;
    case "goright":
      c1 = right + (left - right) / 2;
      c2 = bottom - curve;
      return `M${left},${top} Q${c1},${c2}, ${right},${bottom}`;
    case "golefttop":
      c1 = left + (right - left) / 2 - curve;
      c2 = top + (bottom - top) / 2 - curve;
      return `M${right},${bottom} Q${c1},${c2}, ${left},${top}`;
    case "gorighttop":
      c1 = right + (left - right) / 2 - curve;
      c2 = bottom + (top - bottom) / 2 - curve;
      return `M${left},${bottom} Q${c1},${c2}, ${right},${top}`;
    case "gorightbottom":
      c1 = right + (left - right) / 2 - curve;
      c2 = bottom + (top - bottom) / 2 - curve;
      return `M${left},${top} Q${c1},${c2}, ${right},${bottom}`;
    case "goleftbottom":
      c1 = left + (right - left) / 2 - curve;
      c2 = top + (bottom - top) / 2 - curve;
      return `M${right},${top} Q${c1},${c2}, ${left},${bottom}`;
  }
}

function DrawLineName(name, offset: PosType) {
  if (!name) return null;
  let x = offset.left + (offset.right - offset.left) / 2;
  const y = offset.top + (offset.bottom - offset.top) / 2 - 10;

  let { width, height } = CreateSvgTextGetSize(name, 12);
  x -= width / 2;
  height -= 4;
  const bgx = x - 2;
  const bgy = y - height + 4;
  return { x, y, width, height, bgx, bgy };
}

/** 根据关系的两个节点id，计算线的d */
export function GetEntitiesLineD(originId, targetId, relation) {
  const svgTop =
    document.querySelector("svg")?.getBoundingClientRect().top || 0;
  let from: any = document.querySelector(`[data-span-id="${originId}"]`);
  let to: any = document.querySelector(`[data-span-id="${targetId}"]`);

  to = to.getBoundingClientRect();
  from = from.getBoundingClientRect();
  // @ts-ignore
  const svgOffsetLeft = document.querySelector(`#svg`)?.offsetLeft;

  if (to.top === from.top) {
    const rightOne = to.left > from.left ? to : from;
    const leftOne = rightOne === to ? from : to;
    const offset = {
      top: leftOne.top + 5 - svgTop,
      bottom: leftOne.top + 5 - svgTop,
      left: leftOne.left - svgOffsetLeft + leftOne.width,
      right: rightOne.left - svgOffsetLeft
    };
    const direction = leftOne === to ? "goleft" : "goright";
    return {
      ...DrawLineName(relation, offset),
      d: DrawLine(direction, offset)
    };
  } else {
    const topOne = to.top < from.top ? to : from;
    const bottomOne = topOne === to ? from : to;
    const rightOne = to.left > from.left ? to : from;
    const leftOne = rightOne === to ? from : to;
    const offset = {
      top: topOne.top + topOne.height - svgTop - 5,
      bottom: bottomOne.top - svgTop + 5,
      left: leftOne.left - svgOffsetLeft + leftOne.width,
      right: rightOne.left - svgOffsetLeft
    };
    let direction = leftOne === to ? "goleft" : "goright";
    direction += topOne === to ? "top" : "bottom";
    return {
      ...DrawLineName(relation, offset),
      d: DrawLine(direction as DirectionType, offset)
    };
  }
}
/** 根据两个位置信息（xy），计算线的d */
export function GetLineD(from, to) {
  const topOne = to.y < from.y ? to : from;
  const bottomOne = topOne === to ? from : to;
  const rightOne = to.x > from.x ? to : from;
  const leftOne = rightOne === to ? from : to;
  const offset = {
    top: topOne.y,
    bottom: bottomOne.y,
    left: leftOne.x,
    right: rightOne.x
  };
  let direction = leftOne === to ? "goleft" : "goright";
  direction += topOne === to ? "top" : "bottom";
  return DrawLine(direction as DirectionType, offset);
}

/** 处理位置重叠的实体们
 * entities: [{ id, type, x, y, width, height, conf }]
 */
export function HandlerOverlapEntities(entities) {
  let overlapNum = 1;
  let overlap: any[] = [];
  const compare = (prev, current) => {
    if (prev.x + prev.width > current.x) {
      current.y += 16;
      overlap.push(current);
      return prev;
    }
    return current;
  };
  entities.reduce(compare);
  let overlapArray = overlap;
  while (overlapArray.length > 0) {
    overlap = [];
    overlapArray.reduce(compare);
    overlapArray = overlap;
    overlapNum += 1;
  }
  return { entities, overlapNum };
}

/** 根据文本创建svg，得到大小 */
export function CreateSvgTextGetSize(str, fontSize) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  // @ts-ignore
  svg.version = "1.1";
  document.body.append(svg);

  const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
  label.setAttribute("style", `font-size: ${fontSize}`);
  label.textContent = str;
  svg.append(label);

  const { width, height } = label.getBoundingClientRect();
  svg.remove();
  return { width: width + 4, height: height + 4 };
}

/** 创建选区，得到选取DomRect */
export function CreateRangeDOMRect(
  ele: HTMLElement,
  from: number,
  to: number
): BratRect | undefined {
  if (window.getSelection) {
    const selection = window.getSelection();
    const range = document.createRange();
    // range.selectNode(ele);
    range.setStart(ele.childNodes[0], from + 1);
    range.setEnd(ele.childNodes[0], to + 1);
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
      const { x, y, width, height } = range.getBoundingClientRect();
      const txt = selection.toString();
      selection.removeAllRanges();
      return { x, y, width, height, txt };
    }
  }
}

/** 获取文本Node的父节点 */
export function GetTextParent(ele: Node) {
  return ele.nodeType === 3 && ele.parentElement ? ele.parentElement : ele;
}

// --- svg 相关 end ---

/** 数组转对象 */
export function Array2Obj(arr, mainkey) {
  return arr.reduce((obj, item) => {
    obj[item[mainkey]] = item;
    return obj;
  }, {});
}

/** 数组转对象 - 深度遍历 */
export function Array2ObjDeep(arr, mainkey) {
  return arr.reduce((obj, item) => {
    obj[item[mainkey]] = item;
    const children = item.children;
    if (children && children.length) {
      const child = Array2ObjDeep(children, mainkey);
      Object.assign(obj, child);
    }
    return obj;
  }, {});
}

/** 操作颜色 */
export class BratColor {
  color: string;
  constructor(color) {
    this.color = color;
  }

  _strToRgb() {
    // Parse strings looking for color tuples [255,255,255]
    const rgbNumRE = /rgb\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*\)/;
    const rgbPercRE = /rgb\(\s*([0-9]+(?:\.[0-9]+)?)%\s*,\s*([0-9]+(?:\.[0-9]+)?)%\s*,\s*([0-9]+(?:\.[0-9]+)?)%\s*\)/;
    const rgbHash6RE = /#([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})/;
    const rgbHash3RE = /#([a-fA-F0-9])([a-fA-F0-9])([a-fA-F0-9])/;

    let result;

    // Look for rgb(num,num,num)
    if ((result = rgbNumRE.exec(this.color)))
      return [parseInt(result[1]), parseInt(result[2]), parseInt(result[3])];

    // Look for rgb(num%,num%,num%)
    if ((result = rgbPercRE.exec(this.color)))
      return [
        parseFloat(result[1]) * 2.55,
        parseFloat(result[2]) * 2.55,
        parseFloat(result[3]) * 2.55
      ];

    // Look for #a0b1c2
    if ((result = rgbHash6RE.exec(this.color)))
      return [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
      ];

    // Look for #fff
    if ((result = rgbHash3RE.exec(this.color)))
      return [
        parseInt(result[1] + result[1], 16),
        parseInt(result[2] + result[2], 16),
        parseInt(result[3] + result[3], 16)
      ];

    // Otherwise, we're most likely dealing with a named color
    return [255, 255, 255];
  }

  toDark(offset) {
    let [r, g, b] = this._strToRgb();
    // if (r < g || r < b) r = r - offset < 0 ? 0 : r - offset;
    // if (g < r || g < b) g = g - offset < 0 ? 0 : g - offset;
    // if (b < g || b < r) b = b - offset < 0 ? 0 : b - offset;
    r = r - offset < 0 ? 0 : r - offset;
    g = g - offset < 0 ? 0 : g - offset;
    b = b - offset < 0 ? 0 : b - offset;
    return `rgb(${r} ${g} ${b})`;
  }
}

/** filter 格式化时间 */
export function formatTimeAgo(time) {
  if (!time) return "";
  time = time * 1000;
  if (time == -1000) return "never"; // FIXME make the server return the server time!

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
  ];
  const unitAgo = function(n, unit) {
    if (n == 1) return "" + n + " " + unit + " ago";
    return "" + n + " " + unit + "s ago";
  };

  const nowDate = new Date();
  const now = nowDate.getTime();
  let diff = Math.floor((now - time) / 1000);
  if (!diff) return "just now";
  if (diff < 60) return unitAgo(diff, "second");
  diff = Math.floor(diff / 60);
  if (diff < 60) return unitAgo(diff, "minute");
  diff = Math.floor(diff / 60);
  if (diff < 24) return unitAgo(diff, "hour");
  diff = Math.floor(diff / 24);
  if (diff < 7) return unitAgo(diff, "day");
  if (diff < 28) return unitAgo(Math.floor(diff / 7), "week");
  const thenDate = new Date(time);
  let result = thenDate.getDate() + " " + monthNames[thenDate.getMonth()];
  if (thenDate.getFullYear() != nowDate.getFullYear()) {
    result += " " + thenDate.getFullYear();
  }
  return result;
}
