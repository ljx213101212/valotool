import { useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { AGENTS, getMap, lineupCountByAgent } from '@valotool/lineup-content'
import { prefetchMapFirstImages } from '../../utils/prefetch'
import './index.less'

export default function Agents () {
  const { params } = useRouter()
  const mapSlug = params.map ?? ''
  const map = getMap(mapSlug)
  const counts = lineupCountByAgent(mapSlug)

  // 选定地图即预取该图必学点位首图
  useEffect(() => { prefetchMapFirstImages(mapSlug) }, [mapSlug])

  // 有点位内容的英雄排前面
  const agents = [...AGENTS].sort(
    (a, b) => (counts[b.slug] ?? 0) - (counts[a.slug] ?? 0) || a.slug.localeCompare(b.slug),
  )

  const goLineups = (agentSlug: string) => {
    if (!counts[agentSlug]) {
      Taro.showToast({ title: '该英雄在本图暂无点位', icon: 'none' })
      return
    }
    Taro.navigateTo({ url: `/pages/lineups/index?map=${mapSlug}&agent=${agentSlug}` })
  }

  return (
    <View className='agents'>
      <Text className='agents__title'>{map?.nameZh ?? mapSlug}</Text>
      <Text className='agents__subtitle'>选择你的英雄</Text>
      <View className='agents__grid'>
        {agents.map((a) => {
          const count = counts[a.slug] ?? 0
          return (
            <View
              key={a.slug}
              className={`agents__item${count ? '' : ' agents__item--empty'}`}
              onClick={() => goLineups(a.slug)}
            >
              <Text className='agents__name'>{a.nameZh}</Text>
              <Text className='agents__count'>{count ? `${count} 个点位` : '暂无'}</Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}
