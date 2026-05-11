// 地图基础坐标点
export interface Point {
    x: number;
    y: number;
  }
  
  // 墙体：线段（视野遮挡核心）
  export interface Wall {
    id: string;
    line: [Point, Point]; // 墙 = 两个点连成的线段
    isOpaque: boolean;    // 是否遮挡视野（true=遮挡，false=穿透）
  }
  
  // 地图区域（包点安包逻辑区等；SVG 中 id 须以 site- 开头才会被 map_gen 收录）
  export interface MapArea {
    id: string;
    name: string;
    polygon: Point[];
  }

  /** 闭合多边形：一组点，首尾闭合（不必重复首点） */
  export type MapPolygon = Point[];
  
  // 完整地图数据
  export interface TacticalMap {
    walls: Wall[];
    /** 地面可走：每条 path 一组顶点（可多块不相连） */
    walkableFloor: MapPolygon[];
    /** 箱顶可走：每箱一组顶点 */
    boxWalkable: MapPolygon[];
    areas: MapArea[];
    bounds: { min: Point; max: Point };
  }