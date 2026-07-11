import { useState } from 'react'
import { View, Text, Input } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { MAPS, getAgent, getMap, parseQuery, SIDE_LABELS } from '@valotool/lineup-content'
import { getRecents, type RecentQuery } from '../../utils/storage'
import { track } from '../../utils/track'
import './index.less'

export default function Index () {
  // 图池地图置顶，非图池排后
  const maps = [...MAPS].sort((a, b) => Number(b.inRankedPool) - Number(a.inRankedPool))
  const [keyword, setKeyword] = useState('')
  const [recents, setRecents] = useState<RecentQuery[]>([])

  useDidShow(() => setRecents(getRecents()))

  const goAgents = (mapSlug: string) => {
    Taro.navigateTo({ url: `/pages/agents/index?map=${mapSlug}` })
  }

  const goLineups = (q: { map: string; agent: string; side?: string; site?: string }) => {
    const extra = `${q.side ? `&side=${q.side}` : ''}${q.site ? `&site=${q.site}` : ''}`
    Taro.navigateTo({ url: `/pages/lineups/index?map=${q.map}&agent=${q.agent}${extra}` })
  }

  const onSearch = () => {
    const input = keyword.trim()
    if (!input) return
    const r = parseQuery(input)
    track('search', { input, ...r })
    if (r.map && r.agent) {
      goLineups({ map: r.map, agent: r.agent, side: r.side, site: r.site })
    } else if (r.map) {
      goAgents(r.map)
    } else {
      const tip = r.unmatched.length ? `未识别：${r.unmatched.join('、')}` : '试试「亚海猎枭防B」'
      Taro.showToast({ title: tip, icon: 'none' })
    }
  }

  return (
    <View className='index'>
      <Text className='index__title'>点位速查</Text>
      <Text className='index__subtitle'>选地图 → 选英雄 → 必学点位</Text>

      <View className='index__search'>
        <Input
          className='index__search-input'
          value={keyword}
          placeholder='如：亚海猎枭防B / yhxc sova'
          confirmType='search'
          onInput={(e) => setKeyword(e.detail.value)}
          onConfirm={onSearch}
        />
        <View className='index__search-btn' onClick={onSearch}><Text>搜索</Text></View>
      </View>

      {recents.length > 0 && (
        <View className='index__recents'>
          <Text className='index__section'>最近查询</Text>
          <View className='index__chips'>
            {recents.map((r) => (
              <View
                key={`${r.map}-${r.agent}`}
                className='index__chip'
                onClick={() => goLineups(r)}
              >
                <Text>{getMap(r.map)?.nameZh}·{getAgent(r.agent)?.nameZh}·{SIDE_LABELS[r.side]}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View
        className='index__fav-entry'
        onClick={() => Taro.navigateTo({ url: '/pages/favorites/index' })}
      >
        <Text>★ 我的收藏</Text>
      </View>

      <Text className='index__section'>选择地图</Text>
      <View className='index__maps'>
        {maps.map((m) => (
          <View
            key={m.slug}
            className={`index__map${m.inRankedPool ? '' : ' index__map--out'}`}
            onClick={() => goAgents(m.slug)}
          >
            <Text className='index__map-name'>{m.nameZh}</Text>
            <Text className='index__map-en'>{m.nameEn}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}
