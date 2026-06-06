/**
 * VTracer SVG → calibrated map SVG converter
 *
 * VTracer produces `<path>` polygons with `transform="translate(x,y)"`.
 * This script converts them to the format expected by `map_gen.ts`:
 *   - `<g id="walls">` with `<line>` elements (one per polygon edge)
 *   - `<g id="walkable_region">` with a simple bounding rect (粗略)
 *   - Empty `<g id="boxes">` and `<g id="areas">` (to be filled manually)
 *
 * Usage: tsx scripts/vtracer_to_map.ts <input.vtracer.svg> [output.svg]
 */

import fs from 'node:fs';
import path from 'node:path';
import { DOMParser } from 'xmldom';

interface Point {
  x: number;
  y: number;
}

interface Line {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/** Round to 2 decimal places */
function round(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Check if token is an SVG path command letter */
function isCommandToken(t: string): boolean {
  return /^[MmLlHhVvZz]$/.test(t);
}

/**
 * Parse SVG path `d` attribute to local coordinate points (absolute commands only).
 * Supports M, L, H, V, Z (and implicit L after M).
 */
function parsePathD(d: string): Point[] {
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
        // Return to start point - push a copy to close the polygon
        if (pts.length > 0) {
          x = sx;
          y = sy;
          push();
        }
        continue;
      }
    }

    if (cmd === 'M') {
      x = parseFloat(raw[i++]);
      y = parseFloat(raw[i++]);
      sx = x;
      sy = y;
      push();
      // Implicit L for subsequent coordinate pairs
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
      // Unknown command - skip
      i += 1;
    }
  }

  return pts;
}

/**
 * Parse VTracer `transform="translate(tx,ty)"` into translation offset.
 * Returns { tx: 0, ty: 0 } if no transform or unparseable.
 */
function parseTranslate(transform: string | null): { tx: number; ty: number } {
  if (!transform) return { tx: 0, ty: 0 };
  const m = transform.match(/translate\(\s*([-\d.]+)\s*,?\s*([-\d.]+)\s*\)/);
  if (!m) return { tx: 0, ty: 0 };
  return { tx: parseFloat(m[1]), ty: parseFloat(m[2]) };
}

/**
 * Build wall lines from polygon points.
 * Each consecutive pair (i, i+1) becomes a wall line.
 */
function polygonToLines(points: Point[]): Line[] {
  const lines: Line[] = [];
  if (points.length < 2) return lines;

  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    // Only add non-degenerate lines
    if (Math.abs(a.x - b.x) > 0.01 || Math.abs(a.y - b.y) > 0.01) {
      lines.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y });
    }
  }

  return lines;
}

/** Parse viewBox "x y w h" string */
function parseViewBox(
  viewBox: string | null,
): { x: number; y: number; w: number; h: number } {
  if (!viewBox) return { x: 0, y: 0, w: 1024, h: 1024 };
  const parts = viewBox.trim().split(/\s+/).map(Number);
  return {
    x: parts[0] ?? 0,
    y: parts[1] ?? 0,
    w: parts[2] ?? 1024,
    h: parts[3] ?? 1024,
  };
}

function main(): void {
  const args = process.argv.slice(2);
  const inputPath = args[0];
  const outputPath =
    args[1] ?? inputPath?.replace(/\.svg$/i, '_calibrated.svg');

  if (!inputPath) {
    console.error(
      'Usage: tsx scripts/vtracer_to_map.ts <input.svg> [output.svg]',
    );
    process.exit(1);
  }

  if (!fs.existsSync(inputPath)) {
    console.error(`Input file not found: ${inputPath}`);
    process.exit(1);
  }

  const svgContent = fs.readFileSync(inputPath, 'utf-8');
  const doc = new DOMParser().parseFromString(svgContent, 'image/svg+xml');

  // Get viewBox and SVG dimensions
  const svgEl = doc.getElementsByTagName('svg')[0];
  const vb = parseViewBox(svgEl?.getAttribute('viewBox'));

  // Use || instead of ?? because getAttribute returns '' (empty string) for
  // missing attributes, which is not null/undefined and would pass through ??.
  const widthAttr = svgEl?.getAttribute('width') ?? '';
  const heightAttr = svgEl?.getAttribute('height') ?? '';
  const svgWidth = parseFloat(widthAttr) || vb.w;
  const svgHeight = parseFloat(heightAttr) || vb.h;

  // Collect all polygon paths
  const pathElements = doc.getElementsByTagName('path');
  const allLines: Line[] = [];
  let polygonCount = 0;

  for (let i = 0; i < pathElements.length; i++) {
    const pathEl = pathElements[i];
    const d = pathEl.getAttribute('d');
    if (!d) continue;

    const localPts = parsePathD(d);
    if (localPts.length < 2) continue;

    const { tx, ty } = parseTranslate(pathEl.getAttribute('transform'));

    // Apply translation
    const worldPts = localPts.map((p) => ({
      x: round(p.x + tx),
      y: round(p.y + ty),
    }));

    const lines = polygonToLines(worldPts);
    allLines.push(...lines);
    polygonCount++;

    console.log(
      `  Path ${i + 1}: ${localPts.length} local points → ${worldPts.length} world points → ${lines.length} walls (translate ${tx},${ty})`,
    );
  }

  // Generate wall lines SVG
  const wallLines = allLines
    .map(
      (l, idx) =>
        `  <line id="wall-${idx + 1}" x1="${l.x1}" y1="${l.y1}" x2="${l.x2}" y2="${l.y2}" stroke="#1CE1CF"/>`,
    )
    .join('\n');

  // Walkable region: use the full viewBox as the rough walkable area
  const walkablePoints = [
    `${vb.x} ${vb.y}`,
    `${vb.x + vb.w} ${vb.y}`,
    `${vb.x + vb.w} ${vb.y + vb.h}`,
    `${vb.x} ${vb.y + vb.h}`,
  ].join(' ');

  // Build output SVG
  const outputSVG = [
    `<svg width="${svgWidth}" height="${svgHeight}" viewBox="${vb.x} ${vb.y} ${vb.w} ${vb.h}" fill="none" xmlns="http://www.w3.org/2000/svg">`,
    '<!-- Generated by vtracer_to_map.ts -->',
    `<!-- Source: ${path.basename(inputPath)} -->`,
    `<!-- Polygons: ${polygonCount}, Walls: ${allLines.length} -->`,
    '<g id="map">',
    '  <g id="walls">',
    wallLines,
    '  </g>',
    '  <g id="walkable_region">',
    `    <path id="walkable" d="M${walkablePoints}Z" fill="#0D293B" fill-opacity="0.8"/>`,
    '  </g>',
    '  <g id="boxes">',
    '    <!-- Manual: add <path id="box-N-walkable" .../> for box tops -->',
    '  </g>',
    '  <g id="areas">',
    '    <!-- Manual: add <path id="site-a" .../> and <path id="site-b" .../> -->',
    '  </g>',
    '</g>',
    '</svg>',
    '',
  ].join('\n');

  fs.writeFileSync(outputPath, outputSVG, 'utf-8');

  console.log(`\nGenerated: ${outputPath}`);
  console.log(`  viewBox: ${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
  console.log(`  Size: ${svgWidth} × ${svgHeight}`);
  console.log(`  Polygons: ${polygonCount}`);
  console.log(`  Walls: ${allLines.length}`);
  console.log(`\nNext steps:`);
  console.log(`  1. Open in Figma/editor to manually add boxes and areas`);
  console.log(
    `  2. Add <path id="site-a" .../> and <path id="site-b" .../> in <g id="areas">`,
  );
  console.log(
    `  3. Add <path id="box-N-walkable" .../> in <g id="boxes"> if needed`,
  );
  console.log(`  4. Refine <g id="walkable_region"> if needed`);
  console.log(`  5. Run: npm run map:gen ${outputPath}`);
}

main();