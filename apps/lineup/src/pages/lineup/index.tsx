import { View, Text, Swiper, SwiperItem, Image } from '@tarojs/components'
import { useRouter } from '@tarojs/taro'
import {
  getAgent,
  getLineup,
  getMap,
  IMAGE_ROLE_LABELS,
  SIDE_LABELS,
  SITE_LABELS,
  TECHNIQUE_LABELS,
} from '@valotool/lineup-content'
import './index.less'

export default function LineupDetail () {
  const { params } = useRouter()
  const lineup = getLineup(params.id ?? '')

  if (!lineup) {
    return (
      <View className='lineup'>
        <View className='lineup__missing'><Text>点位不存在或已下架</Text></View>
      </View>
    )
  }

  const map = getMap(lineup.map)
  const agent = getAgent(lineup.agent)
  const abilityName = agent?.abilities.find((a) => a.slot === lineup.abilitySlot)?.nameZh

  return (
    <View className='lineup'>
      <Swiper className='lineup__swiper' indicatorDots indicatorActiveColor='#1f2329'>
        {lineup.images.map((img, i) => (
          <SwiperItem key={img.role}>
            <View className='lineup__slide'>
              <Image className='lineup__img' src={img.url} mode='aspectFill' />
              <View className='lineup__slide-label'>
                <Text>{`${i + 1}/${lineup.images.length} ${IMAGE_ROLE_LABELS[img.role]}`}</Text>
              </View>
              {img.caption && (
                <View className='lineup__caption'><Text>{img.caption}</Text></View>
              )}
            </View>
          </SwiperItem>
        ))}
      </Swiper>

      <View className='lineup__body'>
        <Text className='lineup__title'>{lineup.title}</Text>
        <View className='lineup__badges'>
          <Text className='lineup__badge'>{map?.nameZh}</Text>
          <Text className='lineup__badge'>{agent?.nameZh}</Text>
          <Text className='lineup__badge'>{SIDE_LABELS[lineup.side]} · {SITE_LABELS[lineup.site]}</Text>
          {lineup.status === 'stale'
            ? <Text className='lineup__badge lineup__badge--stale'>⚠️ 待验证</Text>
            : <Text className='lineup__badge lineup__badge--ok'>✅ v{lineup.verifiedPatch} 已验证</Text>}
        </View>

        <View className='lineup__rows'>
          <View className='lineup__row'>
            <Text className='lineup__row-key'>技能</Text>
            <Text className='lineup__row-val'>{abilityName ?? lineup.abilitySlot}（{lineup.abilitySlot}）</Text>
          </View>
          <View className='lineup__row'>
            <Text className='lineup__row-key'>手法</Text>
            <Text className='lineup__row-val'>{TECHNIQUE_LABELS[lineup.technique]}</Text>
          </View>
          {lineup.timing && (
            <View className='lineup__row'>
              <Text className='lineup__row-key'>时机</Text>
              <Text className='lineup__row-val'>{lineup.timing}</Text>
            </View>
          )}
          <View className='lineup__row'>
            <Text className='lineup__row-key'>站哪</Text>
            <Text className='lineup__row-val'>{lineup.origin}</Text>
          </View>
          <View className='lineup__row'>
            <Text className='lineup__row-key'>落点</Text>
            <Text className='lineup__row-val'>{lineup.target}</Text>
          </View>
          <View className='lineup__row'>
            <Text className='lineup__row-key'>用途</Text>
            <Text className='lineup__row-val'>{lineup.purpose}</Text>
          </View>
        </View>
      </View>
    </View>
  )
}
