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
  
  // 地图区域（A点、B点等，仅视觉）
  export interface MapArea {
    id: string;
    name: string;
    polygon: Point[];
  }
  
  // 完整地图数据
  export interface TacticalMap {
    walls: Wall[];
    areas: MapArea[];
    bounds: { min: Point; max: Point };
  }