# Tactical Map SVG Naming Conventions (map_gen)

Source file default: `src/assets/maps/split.svg`. Root may contain `<g id="map">` wrapper (optional).

## Four main groups (findable via `getElementById` within `map` or SVG root)

| Group `id` | Purpose | Child element convention |
|------------|---------|--------------------------|
| `walls` | Wall/obstacle edge lines (LOS, collision) | Only `<line>`. Each line should have `id="wall-{序号}"`, **no spaces** (avoid `Line 1`). |
| `walkable_region` | Walkable floor area | One or more closed `<path>` (`d` ending with `Z`/`z`). Main floor can use `id="walkable"`. |
| `boxes` | Walkable box-top areas | Closed `<path>`, recommended `id="box-{序号}-walkable"`. |
| `areas` | Bomb-site / logic zones (polygons only) | Only site contours use **`id` starting with `site-`**, e.g. `site-a`, `site-b`. Decorative text, letter vectors use `id="label-*"` or place in separate `g id="labels"`, **do not** start with `site-` to avoid being written into `TacticalMap.areas`. |

## Drawing order recommendation

For visual appeal: render `walkable_region` and `boxes` first, then `walls`, finally overlay `areas` and UI (follow Figma layer order when exporting).

## Path `d` format

The generation script currently parses **absolute commands**: `M`, `L`, `H`, `V`, `Z` (and implicit `L` point pairs after `M`). Complex curves (`C` etc.) are not supported; convert to polylines / simplify to straight segments in an editor before exporting.

## Data flow

Run `npm run map:gen [path/to/map.svg]` to read the SVG above and generate `src/shared/data/valorantMap.ts` with `TacticalMap`: `walls`, `walkableFloor`, `boxWalkable`, `areas`, `bounds`.

## VTracer Workflow (PNG → calibrated SVG)

**Quick pipeline**: PNG minimap → [VTracer](https://www.visioncortex.org/vtracer/) → raw `.svg` → `vtracer_to_map.ts` → calibrated `.svg` → manual annotation → `map_gen.ts`

1. Download map PNG from [valorant-api.com/v1/maps](https://valorant-api.com/v1/maps)
2. Run through VTracer to get a raw SVG with polygon outlines
3. Convert: `npm run map:vtrace -- src/assets/maps/raw.svg src/assets/maps/map_calibrated.svg`
4. Manually add in Figma/editor:
   - `<g id="areas">`: `<path id="site-a" .../>` and `<path id="site-b" .../>` for bomb sites
   - `<g id="boxes">`: `<path id="box-N-walkable" .../>` for box-tops if needed
   - Refine `<g id="walkable_region">` if the auto-generated bounding rect is too coarse
5. Generate TypeScript data: `npm run map:gen -- src/assets/maps/map_calibrated.svg`

**What's automated vs manual:**

| Component | Automated? | Notes |
|-----------|-----------|-------|
| `walls` | ✅ Fully | Polygon edges extracted from VTracer output |
| `walkable_region` | ⚠️ Rough | Uses full viewBox as default; refine manually |
| `boxes` | ❌ Manual | VTracer can't distinguish box-tops from walls |
| `areas` (sites) | ❌ Manual | Requires human annotation of bomb sites |