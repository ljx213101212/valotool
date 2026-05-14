import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DOMParser } from 'xmldom';

import type { MapArea, MapPolygon, Point, Wall } from '../src/shared/types/map';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

/** 约定见 scripts/MAP_SVG_CONVENTIONS.md */
const SVG_FILE_PATH = path.join(ROOT, 'src/assets/maps/split.svg');
const OUTPUT_TS_PATH = path.join(ROOT, 'src', 'shared', 'data', 'valorantMap.ts');

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

function isCommandToken(t: string): boolean {
  return /^[MmLlHhVvCcSsQqTtAaZz]$/.test(t);
}

/** 解析绝对 M/L/H/V/Z（及 M 后隐式 L），用于 Figma 导出的直线路径 */
function parsePathToPoints(d: string): Point[] {
  const raw =
    d.match(/[MmLlHhVvZz]|[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?/gi) ?? [];
  const pts: Point[] = [];
  let x = 0;
  let y = 0;
  let sx = 0;
  let sy = 0;
  let i = 0;
  let cmd = '';

  const push = (): void => {
    pts.push({ x: round(x), y: round(y) });
  };

  while (i < raw.length) {
    if (isCommandToken(raw[i])) {
      cmd = raw[i].toUpperCase();
      i += 1;
      if (cmd === 'Z') {
        x = sx;
        y = sy;
        continue;
      }
    }

    if (cmd === 'M') {
      x = parseFloat(raw[i++]);
      y = parseFloat(raw[i++]);
      sx = x;
      sy = y;
      push();
      while (i < raw.length && !isCommandToken(raw[i])) {
        x = parseFloat(raw[i++]);
        y = parseFloat(raw[i++]);
        push();
      }
      cmd = 'L';
    } else if (cmd === 'L') {
      x = parseFloat(raw[i++]);
      y = parseFloat(raw[i++]);
      push();
    } else if (cmd === 'H') {
      x = parseFloat(raw[i++]);
      push();
    } else if (cmd === 'V') {
      y = parseFloat(raw[i++]);
      push();
    } else {
      i += 1;
    }
  }

  return pts;
}

function isElement(n: Node): n is Element {
  return n.nodeType === 1;
}

function collectDescendantsByTag(root: Element, tagName: string): Element[] {
  const out: Element[] = [];
  const walk = (node: Node): void => {
    if (!isElement(node)) return;
    if (node.tagName === tagName) out.push(node);
    for (let c = node.firstChild; c; c = c.nextSibling) walk(c);
  };
  walk(root);
  return out;
}

function siteIdToDisplayName(id: string): string {
  const code = id.replace(/^site-/i, '');
  if (!code) return id;
  return `${code.toUpperCase()}包点`;
}

function main(): void {
  if (!fs.existsSync(SVG_FILE_PATH)) {
    console.error(`找不到 SVG：${SVG_FILE_PATH}`);
    process.exit(1);
  }

  const svgContent = fs.readFileSync(SVG_FILE_PATH, 'utf-8');
  const doc = new DOMParser().parseFromString(svgContent, 'image/svg+xml');

  const walls: Wall[] = [];
  const wallsRoot = doc.getElementById('walls');
  if (wallsRoot) {
    const lineElements = collectDescendantsByTag(wallsRoot, 'line');
    for (let i = 0; i < lineElements.length; i++) {
      const line = lineElements[i];
      const x1 = parseFloat(line.getAttribute('x1') ?? '');
      const y1 = parseFloat(line.getAttribute('y1') ?? '');
      const x2 = parseFloat(line.getAttribute('x2') ?? '');
      const y2 = parseFloat(line.getAttribute('y2') ?? '');
      const svgId = line.getAttribute('id')?.trim();
      const id =
        svgId && !/\s/.test(svgId) ? svgId : `wall-${i + 1}`;
      walls.push({
        id,
        line: [
          { x: round(x1), y: round(y1) },
          { x: round(x2), y: round(y2) },
        ],
        isOpaque: true,
      });
    }
  }

  const walkableFloor: MapPolygon[] = [];
  const walkRoot = doc.getElementById('walkable_region');
  if (walkRoot) {
    for (const path of collectDescendantsByTag(walkRoot, 'path')) {
      const d = path.getAttribute('d')?.trim();
      if (!d) continue;
      const poly = parsePathToPoints(d);
      if (poly.length >= 3) walkableFloor.push(poly);
    }
  }

  const boxWalkable: MapPolygon[] = [];
  const boxesRoot = doc.getElementById('boxes');
  if (boxesRoot) {
    for (const path of collectDescendantsByTag(boxesRoot, 'path')) {
      const d = path.getAttribute('d')?.trim();
      if (!d) continue;
      const poly = parsePathToPoints(d);
      if (poly.length >= 3) boxWalkable.push(poly);
    }
  }

  const areas: MapArea[] = [];
  const areasRoot = doc.getElementById('areas');
  if (areasRoot) {
    const paths = collectDescendantsByTag(areasRoot, 'path');
    for (const path of paths) {
      const id = path.getAttribute('id')?.trim() ?? '';
      if (!id.toLowerCase().startsWith('site-')) continue;
      const d = path.getAttribute('d')?.trim();
      if (!d) continue;
      const polygon = parsePathToPoints(d);
      if (polygon.length < 3) continue;
      areas.push({
        id,
        name: siteIdToDisplayName(id),
        polygon,
      });
    }
  }

  const allPoints: Point[] = [];
  for (const w of walls) {
    allPoints.push(w.line[0], w.line[1]);
  }
  for (const poly of walkableFloor) allPoints.push(...poly);
  for (const poly of boxWalkable) allPoints.push(...poly);
  for (const a of areas) allPoints.push(...a.polygon);

  if (allPoints.length === 0) {
    console.error(
      'SVG 中未解析到 walls / walkable_region / boxes / areas(site-*) 的几何点，无法计算 bounds。',
    );
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
    `import type { TacticalMap } from '@/shared/types/map';`,
    '',
    'export const valorantMap: TacticalMap = {',
    `  walls: ${JSON.stringify(walls, null, 2)},`,
    `  walkableFloor: ${JSON.stringify(walkableFloor, null, 2)},`,
    `  boxWalkable: ${JSON.stringify(boxWalkable, null, 2)},`,
    `  areas: ${JSON.stringify(areas, null, 2)},`,
    `  bounds: ${JSON.stringify(bounds, null, 2)},`,
    '};',
    '',
  ].join('\n');

  fs.mkdirSync(path.dirname(OUTPUT_TS_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_TS_PATH, body, 'utf-8');

  console.log(`已生成：${OUTPUT_TS_PATH}`);
  console.log(
    `  walls: ${walls.length}，walkableFloor: ${walkableFloor.length}，boxWalkable: ${boxWalkable.length}，areas: ${areas.length}`,
  );
}

main();
