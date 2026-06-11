import { View, Text } from '@tarojs/components'
import { MAPS } from '@valotool/lineup-content'
import './index.less'

// 冒烟版首页：验证内容包接入；正式速查流程见 OpenSpec add-lineup-quick-lookup 任务 3.x
export default function Index () {
  const pool = MAPS.filter((m) => m.inRankedPool)

  return (
    <View className='index'>
      <Text className='index__title'>点位速查</Text>
      <View className='index__maps'>
        {pool.map((m) => (
          <View key={m.slug} className='index__map'>
            <Text>{m.nameZh}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}
