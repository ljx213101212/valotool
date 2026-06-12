import { useState } from 'react'
import { View, Text, Image } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import {
  getAgent,
  getLineup,
  getMap,
  thumbUrl,
  SIDE_LABELS,
  SITE_LABELS,
  type Lineup,
} from '@valotool/lineup-content'
import { getFavorites } from '../../utils/storage'
import './index.less'

export default function Favorites () {
  const [list, setList] = useState<Lineup[]>([])

  // 收藏在详情页可变化，每次进入页面重读
  useDidShow(() => {
    setList(getFavorites().map(getLineup).filter((l): l is Lineup => Boolean(l)))
  })

  if (list.length === 0) {
    return (
      <View className='favorites'>
        <View className='favorites__empty'>
          <Text>还没有收藏的点位{'\n'}在点位详情页点「☆ 收藏」</Text>
        </View>
      </View>
    )
  }

  return (
    <View className='favorites'>
      {list.map((l) => (
        <View
          key={l.id}
          className='favorites__card'
          onClick={() => Taro.navigateTo({ url: `/pages/lineup/index?id=${l.id}` })}
        >
          {l.images[0] && (
            <Image
              className='favorites__thumb'
              src={thumbUrl(l.images[0].url)}
              mode='aspectFill'
              lazyLoad
            />
          )}
          <View className='favorites__info'>
            <Text className='favorites__title'>{l.title}</Text>
            <Text className='favorites__meta'>
              {getMap(l.map)?.nameZh} · {getAgent(l.agent)?.nameZh} · {SIDE_LABELS[l.side]} · {SITE_LABELS[l.site]}
            </Text>
            {l.status === 'stale' && <Text className='favorites__stale'>⚠️ 待验证</Text>}
          </View>
        </View>
      ))}
    </View>
  )
}
