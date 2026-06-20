import Taro from '@tarojs/taro'
import { ALL_LINEUPS } from '@valotool/lineup-content'

const requested = new Set<string>()

/** 选定地图后预取该图全部必学点位的首图（去重、静默失败） */
export function prefetchMapFirstImages(map: string): void {
  for (const l of ALL_LINEUPS) {
    if (l.map !== map || l.tier !== 'must-learn') continue
    const url = l.images[0]?.url
    if (!url || requested.has(url)) continue
    requested.add(url)
    Taro.getImageInfo({ src: url }).catch(() => {})
  }
}
