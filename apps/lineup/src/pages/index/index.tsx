import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { MAPS } from '@valotool/lineup-content'
import './index.less'

export default function Index () {
  // 图池地图置顶，非图池排后
  const maps = [...MAPS].sort((a, b) => Number(b.inRankedPool) - Number(a.inRankedPool))

  const goAgents = (mapSlug: string) => {
    Taro.navigateTo({ url: `/pages/agents/index?map=${mapSlug}` })
  }

  return (
    <View className='index'>
      <Text className='index__title'>点位速查</Text>
      <Text className='index__subtitle'>选地图 → 选英雄 → 必学点位</Text>
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
