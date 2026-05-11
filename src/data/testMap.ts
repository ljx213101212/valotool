import type { TacticalMap } from '@/types/map';

// 示例地图：方形场地 + 中间一堵墙 + 右侧一堵墙（用于测试视野遮挡）
export const testMap: TacticalMap = {
  walkableFloor: [
    [
      { x: 100, y: 100 },
      { x: 900, y: 100 },
      { x: 900, y: 700 },
      { x: 100, y: 700 },
    ],
  ],
  boxWalkable: [],
  walls: [
    // 地图外框围墙
    { id: 'wall-1', line: [{ x: 100, y: 100 }, { x: 900, y: 100 }], isOpaque: true },
    { id: 'wall-2', line: [{ x: 900, y: 100 }, { x: 900, y: 700 }], isOpaque: true },
    { id: 'wall-3', line: [{ x: 900, y: 700 }, { x: 100, y: 700 }], isOpaque: true },
    { id: 'wall-4', line: [{ x: 100, y: 700 }, { x: 100, y: 100 }], isOpaque: true },
    
    //中间遮挡墙（测试视野遮挡用）
    { id: 'wall-mid-1', line: [{ x: 300, y: 200 }, { x: 300, y: 600 }], isOpaque: true },
    { id: 'wall-mid-2', line: [{ x: 600, y: 200 }, { x: 600, y: 600 }], isOpaque: true },
  ],
  areas: [
    { id: 'site-a', name: 'A点', polygon: [{ x: 150, y: 150 }, { x: 450, y: 150 }, { x: 450, y: 400 }, { x: 150, y: 400 }] },
    { id: 'site-b', name: 'B点', polygon: [{ x: 550, y: 150 }, { x: 850, y: 150 }, { x: 850, y: 400 }, { x: 550, y: 400 }] },
  ],
  bounds: { min: { x: 0, y: 0 }, max: { x: 1000, y: 800 } },
};