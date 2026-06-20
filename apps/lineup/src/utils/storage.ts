import Taro from '@tarojs/taro'
import type { Side } from '@valotool/lineup-content'

/** 本地记忆（无账号体系）：最近查询组合 + 收藏点位 */

export interface RecentQuery {
  map: string
  agent: string
  side: Side
  ts: number
}

const RECENT_KEY = 'recent-queries'
const FAV_KEY = 'favorite-lineups'
const RECENT_CAP = 6

function read<T>(key: string, fallback: T): T {
  try {
    return (Taro.getStorageSync(key) as T) || fallback
  } catch {
    return fallback
  }
}

export function getRecents(): RecentQuery[] {
  return read<RecentQuery[]>(RECENT_KEY, [])
}

export function addRecent(q: Omit<RecentQuery, 'ts'>): void {
  const list = getRecents().filter((r) => !(r.map === q.map && r.agent === q.agent))
  list.unshift({ ...q, ts: Date.now() })
  Taro.setStorageSync(RECENT_KEY, list.slice(0, RECENT_CAP))
}

export function getFavorites(): string[] {
  return read<string[]>(FAV_KEY, [])
}

export function isFavorite(id: string): boolean {
  return getFavorites().includes(id)
}

/** 返回切换后的收藏状态 */
export function toggleFavorite(id: string): boolean {
  const list = getFavorites()
  const next = list.includes(id) ? list.filter((x) => x !== id) : [id, ...list]
  Taro.setStorageSync(FAV_KEY, next)
  return next.includes(id)
}
