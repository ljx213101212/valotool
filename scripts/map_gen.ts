import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DOMParser } from 'xmldom';

import type { MapArea, Point, Wall } from '../src/types/map';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// 1. SVG 路径（相对项目根目录）
const SVG_FILE_PATH = path.join(ROOT, 'src/assets/split_no_blocks.svg');

// 2. 生成的 TS 文件路径
const OUTPUT_TS_PATH = path.join(ROOT, 'src', 'data', 'valorantMap.ts');

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

function main(): void {
  if (!fs.existsSync(SVG_FILE_PATH)) {
    console.error(`找不到 SVG：${SVG_FILE_PATH}`);
    process.exit(1);
  }

  const svgContent = fs.readFileSync(SVG_FILE_PATH, 'utf-8');
  const doc = new DOMParser().parseFromString(svgContent, 'image/svg+xml');

  const walls: Wall[] = [];
  const lineElements = doc.getElementsByTagName('line');
  for (let i = 0; i < lineElements.length; i++) {
    const line = lineElements[i];
    const x1 = parseFloat(line.getAttribute('x1') ?? '');
    const y1 = parseFloat(line.getAttribute('y1') ?? '');
    const x2 = parseFloat(line.getAttribute('x2') ?? '');
    const y2 = parseFloat(line.getAttribute('y2') ?? '');
    const p0: Point = { x: round(x1), y: round(y1) };
    const p1: Point = { x: round(x2), y: round(y2) };
    walls.push({
      id: `wall-${i + 1}`,
      line: [p0, p1],
      isOpaque: true,
    });
  }

  const areas: MapArea[] = [];
  const rectElements = doc.getElementsByTagName('rect');
  for (let i = 0; i < rectElements.length; i++) {
    const rect = rectElements[i];
    const x = parseFloat(rect.getAttribute('x') ?? '');
    const y = parseFloat(rect.getAttribute('y') ?? '');
    const w = parseFloat(rect.getAttribute('width') ?? '');
    const h = parseFloat(rect.getAttribute('height') ?? '');
    areas.push({
      id: `area-${i + 1}`,
      name: `区域${i + 1}`,
      polygon: [
        { x: round(x), y: round(y) },
        { x: round(x + w), y: round(y) },
        { x: round(x + w), y: round(y + h) },
        { x: round(x), y: round(y + h) },
      ],
    });
  }

  const allPoints: Point[] = [];
  for (const w of walls) {
    allPoints.push(w.line[0], w.line[1]);
  }
  for (const a of areas) {
    allPoints.push(...a.polygon);
  }

  if (allPoints.length === 0) {
    console.error('SVG 中未解析到 <line> 或 <rect>，无法计算 bounds。');
    process.exit(1);
  }

  const minX = Math.min(...allPoints.map((p) => p.x));
  const minY = Math.min(...allPoints.map((p) => p.y));
  const maxX = Math.max(...allPoints.map((p) => p.x));
  const maxY = Math.max(...allPoints.map((p) => p.y));

  const bounds = {
    min: { x: round(minX - 20), y: round(minY - 20) },
    max: { x: round(maxX + 20), y: round(maxY + 20) },
  };

  const body = [
    `import type { TacticalMap } from '@/types/map';`,
    '',
    'export const valorantMap: TacticalMap = {',
    `  walls: ${JSON.stringify(walls, null, 2)},`,
    `  areas: ${JSON.stringify(areas, null, 2)},`,
    `  bounds: ${JSON.stringify(bounds, null, 2)},`,
    '};',
    '',
  ].join('\n');

  fs.mkdirSync(path.dirname(OUTPUT_TS_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_TS_PATH, body, 'utf-8');

  console.log(`已生成：${OUTPUT_TS_PATH}`);
  console.log(`  walls: ${walls.length}，areas: ${areas.length}`);
}

main();
