/** 竞技地图列表；缩略图放在 public/assets/map-thumbs/{id}.webp（或改 thumbFile 扩展名） */
export interface MapCatalogEntry {
  id: string;
  label: string;
  /** 用于无图时的占位渐变 */
  accent: string;
  /** 相对站点根路径，如 /assets/map-thumbs/bind.webp */
  thumbFile: string;
}

export const MAPS_CATALOG: MapCatalogEntry[] = [
  { id: 'bind', label: '源工重镇', accent: '#7c3aed', thumbFile: '/assets/map-thumbs/bind.webp' },
  { id: 'haven', label: '隐士修所', accent: '#0d9488', thumbFile: '/assets/map-thumbs/haven.webp' },
  { id: 'split', label: '霓虹町', accent: '#db2777', thumbFile: '/assets/map-thumbs/split.webp' },
  { id: 'ascent', label: '亚海悬城', accent: '#ea580c', thumbFile: '/assets/map-thumbs/ascent.webp' },
  { id: 'icebox', label: '极地寒港', accent: '#0284c7', thumbFile: '/assets/map-thumbs/icebox.webp' },
  { id: 'breeze', label: '微风岛屿', accent: '#16a34a', thumbFile: '/assets/map-thumbs/breeze.webp' },
  { id: 'fracture', label: '裂变峡谷', accent: '#ca8a04', thumbFile: '/assets/map-thumbs/fracture.webp' },
  { id: 'pearl', label: '深海明珠', accent: '#2563eb', thumbFile: '/assets/map-thumbs/pearl.webp' },
  { id: 'lotus', label: '莲华古城', accent: '#059669', thumbFile: '/assets/map-thumbs/lotus.webp' },
  { id: 'sunset', label: '日落之城', accent: '#dc2626', thumbFile: '/assets/map-thumbs/sunset.webp' },
  { id: 'abyss', label: '幽邃地窟', accent: '#475569', thumbFile: '/assets/map-thumbs/abyss.webp' },
  { id: 'corrode', label: '盐海矿镇', accent: '#5b21b6', thumbFile: '/assets/map-thumbs/corrode.webp' },
  { id: 'summit', label: '天枢云阙', accent: '#0891b2', thumbFile: '/assets/map-thumbs/summit.webp' },
];

export function getMapById(id: string): MapCatalogEntry | undefined {
  return MAPS_CATALOG.find((m) => m.id === id);
}
