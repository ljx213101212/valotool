// 地图坐标标定：把 Riot 对局世界坐标 (location.x / location.y) 映射到官方小地图图片
//
// 数据来自 valorant-api.com /v1/maps（displayIcon + 4 个标定参数）。
// 关键公式（注意游戏 x/y 与图片 x/y 互换）：
//   normX = location.y * xMultiplier + xScalarToAdd
//   normY = location.x * yMultiplier + yScalarToAdd
// normX / normY 为 [0,1] 归一化坐标，乘以小地图渲染尺寸即得像素坐标。
//
// mapId 对应 matchInfo.mapId（如 "/Game/Maps/Ascent/Ascent"）。
// 内部代号与展示名不一致是 Riot 历史遗留（Bonsai=Split、Duality=Bind 等）。

export interface MapCalibration {
  mapId: string;
  displayName: string;
  displayIcon: string;
  xMultiplier: number;
  yMultiplier: number;
  xScalarToAdd: number;
  yScalarToAdd: number;
  /**
   * 把官方 displayIcon 转到标准 VCT 朝向（防守 CT 在上、进攻 T 在下）所需的顺时针 90° 次数。
   * valorant-api.com 各图的 displayIcon 原生朝向不一致，需逐图标定。0 = 不旋转。
   */
  rotationSteps?: number;
}

export interface GameLocation {
  x: number;
  y: number;
}

export interface NormalizedPoint {
  x: number;
  y: number;
}

export const MAP_CALIBRATIONS: MapCalibration[] = [
  { mapId: '/Game/Maps/Ascent/Ascent', displayName: 'Ascent', displayIcon: 'https://media.valorant-api.com/maps/7eaecc1b-4337-bbf6-6ab9-04b8f06b3319/displayicon.png', xMultiplier: 7e-5, yMultiplier: -7e-5, xScalarToAdd: 0.813895, yScalarToAdd: 0.573242, rotationSteps: 1 },
  { mapId: '/Game/Maps/Bonsai/Bonsai', displayName: 'Split', displayIcon: 'https://media.valorant-api.com/maps/d960549e-485c-e861-8d71-aa9d1aed12a2/displayicon.png', xMultiplier: 7.8e-5, yMultiplier: -7.8e-5, xScalarToAdd: 0.842188, yScalarToAdd: 0.697578 },
  { mapId: '/Game/Maps/Canyon/Canyon', displayName: 'Fracture', displayIcon: 'https://media.valorant-api.com/maps/b529448b-4d60-346e-e89e-00a4c527a405/displayicon.png', xMultiplier: 7.8e-5, yMultiplier: -7.8e-5, xScalarToAdd: 0.556952, yScalarToAdd: 1.155886 },
  { mapId: '/Game/Maps/Duality/Duality', displayName: 'Bind', displayIcon: 'https://media.valorant-api.com/maps/2c9d57ec-4431-9c5e-2939-8f9ef6dd5cba/displayicon.png', xMultiplier: 5.9e-5, yMultiplier: -5.9e-5, xScalarToAdd: 0.576941, yScalarToAdd: 0.967566 },
  { mapId: '/Game/Maps/Foxtrot/Foxtrot', displayName: 'Breeze', displayIcon: 'https://media.valorant-api.com/maps/2fb9a4fd-47b8-4e7d-a969-74b4046ebd53/displayicon.png', xMultiplier: 7e-5, yMultiplier: -7e-5, xScalarToAdd: 0.465123, yScalarToAdd: 0.833078 },
  { mapId: '/Game/Maps/Infinity/Infinity', displayName: 'Abyss', displayIcon: 'https://media.valorant-api.com/maps/224b0a95-48b9-f703-1bd8-67aca101a61f/displayicon.png', xMultiplier: 8.1e-5, yMultiplier: -8.1e-5, xScalarToAdd: 0.5, yScalarToAdd: 0.5 },
  { mapId: '/Game/Maps/Jam/Jam', displayName: 'Lotus', displayIcon: 'https://media.valorant-api.com/maps/2fe4ed3a-450a-948b-6d6b-e89a78e680a9/displayicon.png', xMultiplier: 7.2e-5, yMultiplier: -7.2e-5, xScalarToAdd: 0.454789, yScalarToAdd: 0.917752 },
  { mapId: '/Game/Maps/Juliett/Juliett', displayName: 'Sunset', displayIcon: 'https://media.valorant-api.com/maps/92584fbe-486a-b1b2-9faa-39b0f486b498/displayicon.png', xMultiplier: 7.8e-5, yMultiplier: -7.8e-5, xScalarToAdd: 0.5, yScalarToAdd: 0.515625 },
  { mapId: '/Game/Maps/Pitt/Pitt', displayName: 'Pearl', displayIcon: 'https://media.valorant-api.com/maps/fd267378-4d1d-484f-ff52-77821ed10dc2/displayicon.png', xMultiplier: 7.8e-5, yMultiplier: -7.8e-5, xScalarToAdd: 0.480469, yScalarToAdd: 0.916016 },
  { mapId: '/Game/Maps/Port/Port', displayName: 'Icebox', displayIcon: 'https://media.valorant-api.com/maps/e2ad5c54-4114-a870-9641-8ea21279579a/displayicon.png', xMultiplier: 7.2e-5, yMultiplier: -7.2e-5, xScalarToAdd: 0.460214, yScalarToAdd: 0.304687 },
  { mapId: '/Game/Maps/Rook/Rook', displayName: 'Corrode', displayIcon: 'https://media.valorant-api.com/maps/1c18ab1f-420d-0d8b-71d0-77ad3c439115/displayicon.png', xMultiplier: 7e-5, yMultiplier: -7e-5, xScalarToAdd: 0.526158, yScalarToAdd: 0.5 },
  { mapId: '/Game/Maps/Triad/Triad', displayName: 'Haven', displayIcon: 'https://media.valorant-api.com/maps/2bee0dc9-4ffe-519b-1cbd-7fbe763a6047/displayicon.png', xMultiplier: 7.5e-5, yMultiplier: -7.5e-5, xScalarToAdd: 1.09345, yScalarToAdd: 0.642728 },
];

export function getCalibration(mapId: string): MapCalibration | undefined {
  return MAP_CALIBRATIONS.find((m) => m.mapId === mapId);
}

/** 归一化点在单位正方形内顺时针 90°×steps 旋转。 */
function rotateNormCW(p: NormalizedPoint, steps: number): NormalizedPoint {
  let { x, y } = p;
  const s = ((steps % 4) + 4) % 4;
  for (let i = 0; i < s; i++) {
    [x, y] = [1 - y, x];
  }
  return { x, y };
}

/** 方向向量顺时针 90°×steps 旋转（屏幕 y 向下坐标系，无平移）。 */
function rotateDirCW(d: NormalizedPoint, steps: number): NormalizedPoint {
  let { x, y } = d;
  const s = ((steps % 4) + 4) % 4;
  for (let i = 0; i < s; i++) {
    [x, y] = [-y, x];
  }
  return { x, y };
}

/** 顺时针 90° 旋转次数对应的角度（供 Konva 背景图旋转使用）。 */
export function rotationDegrees(cal: MapCalibration): number {
  return ((cal.rotationSteps ?? 0) % 4) * 90;
}

/** 游戏世界坐标 → 小地图归一化坐标 [0,1]（x/y 互换 + 朝向旋转到标准 VCT 方向）。 */
export function gameToNormalized(loc: GameLocation, cal: MapCalibration): NormalizedPoint {
  const base = {
    x: loc.y * cal.xMultiplier + cal.xScalarToAdd,
    y: loc.x * cal.yMultiplier + cal.yScalarToAdd,
  };
  return rotateNormCW(base, cal.rotationSteps ?? 0);
}

/** 游戏世界坐标 → 小地图像素坐标（size = 渲染的正方形边长）。 */
export function gameToPixel(loc: GameLocation, cal: MapCalibration, size: number): NormalizedPoint {
  const n = gameToNormalized(loc, cal);
  return { x: n.x * size, y: n.y * size };
}

/**
 * 朝向（viewRadians）→ 小地图像素空间的单位方向向量。
 * 对世界前向量 (cosθ, sinθ) 施加与坐标相同的线性变换（去掉平移项）后归一化。
 * 仅用于绘制朝向指示，属近似可视化。
 */
export function viewDirToPixel(viewRadians: number, cal: MapCalibration): NormalizedPoint {
  const gx = Math.cos(viewRadians);
  const gy = Math.sin(viewRadians);
  let dx = gy * cal.xMultiplier;
  let dy = gx * cal.yMultiplier;
  const len = Math.hypot(dx, dy) || 1;
  dx /= len;
  dy /= len;
  return rotateDirCW({ x: dx, y: dy }, cal.rotationSteps ?? 0);
}
