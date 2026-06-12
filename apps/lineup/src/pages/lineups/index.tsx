import { useEffect, useMemo, useState } from 'react'
import { View, Text, Image } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import {
  getAgent,
  getMap,
  lineupsFor,
  thumbUrl,
  SIDE_LABELS,
  SITE_LABELS,
  TIER_LABELS,
  type Side,
  type Site,
  type Tier,
} from '@valotool/lineup-content'
import { addRecent } from '../../utils/storage'
import { reportFirstImage } from '../../utils/track'
import './index.less'

const SIDES: Side[] = ['attack', 'defense']
const TIERS: Tier[] = ['must-learn', 'advanced', 'flashy']

const isSide = (v?: string): v is Side => v === 'attack' || v === 'defense'
const isSite = (v?: string): v is Site => v === 'A' || v === 'B' || v === 'C' || v === 'mid'

export default function Lineups () {
  const { params } = useRouter()
  const mapSlug = params.map ?? ''
  const agentSlug = params.agent ?? ''
  const map = getMap(mapSlug)
  const agent = getAgent(agentSlug)

  const [side, setSide] = useState<Side>(isSide(params.side) ? params.side : 'attack')
  const [site, setSite] = useState<Site | 'all'>(isSite(params.site) ? params.site : 'all')

  // 记录最近查询组合，供首页快捷入口
  useEffect(() => {
    if (mapSlug && agentSlug) addRecent({ map: mapSlug, agent: agentSlug, side })
  }, [mapSlug, agentSlug, side])

  const all = useMemo(() => lineupsFor(mapSlug, agentSlug, side), [mapSlug, agentSlug, side])
  const sites = useMemo(() => [...new Set(all.map((l) => l.site))], [all])
  const list = site === 'all' ? all : all.filter((l) => l.site === site)

  const goDetail = (id: string) => {
    Taro.navigateTo({ url: `/pages/lineup/index?id=${id}` })
  }

  return (
    <View className='lineups'>
      <Text className='lineups__title'>
        {map?.nameZh ?? mapSlug} · {agent?.nameZh ?? agentSlug}
      </Text>

      <View className='lineups__sides'>
        {SIDES.map((s) => (
          <View
            key={s}
            className={`lineups__side${side === s ? ' lineups__side--active' : ''}`}
            onClick={() => { setSide(s); setSite('all') }}
          >
            <Text>{SIDE_LABELS[s]}</Text>
          </View>
        ))}
      </View>

      <View className='lineups__sites'>
        <View
          className={`lineups__site${site === 'all' ? ' lineups__site--active' : ''}`}
          onClick={() => setSite('all')}
        >
          <Text>全部</Text>
        </View>
        {sites.map((s) => (
          <View
            key={s}
            className={`lineups__site${site === s ? ' lineups__site--active' : ''}`}
            onClick={() => setSite(s)}
          >
            <Text>{SITE_LABELS[s]}</Text>
          </View>
        ))}
      </View>

      {TIERS.map((tier) => {
        const group = list.filter((l) => l.tier === tier)
        if (group.length === 0) return null
        return (
          <View key={tier} className='lineups__group'>
            <Text className='lineups__group-title'>{TIER_LABELS[tier]}</Text>
            {group.map((l) => (
              <View key={l.id} className='lineups__card' onClick={() => goDetail(l.id)}>
                {l.images[0] && (
                  <Image
                    className='lineups__card-thumb'
                    src={thumbUrl(l.images[0].url)}
                    mode='aspectFill'
                    lazyLoad
                    onLoad={() => reportFirstImage('list-thumb')}
                  />
                )}
                <View className='lineups__card-info'>
                  <View className='lineups__card-head'>
                    <Text className='lineups__card-site'>{SITE_LABELS[l.site]}</Text>
                    <Text className='lineups__card-title'>{l.title}</Text>
                  </View>
                  <Text className='lineups__card-purpose'>{l.purpose}</Text>
                  {l.status === 'stale' && <Text className='lineups__card-stale'>⚠️ 待验证</Text>}
                </View>
              </View>
            ))}
          </View>
        )
      })}

      {list.length === 0 && (
        <View className='lineups__empty'>
          <Text>该筛选下暂无点位</Text>
        </View>
      )}
    </View>
  )
}
