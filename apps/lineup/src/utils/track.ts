/**
 * 极简埋点：MVP 阶段仅 console 输出 + 本地留存最近 50 条，
 * 上线后接小程序自定义分析/三方统计时替换 emit 实现即可。
 * 留存率/收藏率口径：留存看微信小程序后台自带统计；收藏看 favorite 事件量。
 */
import Taro from '@tarojs/taro'

const launchTs = Date.now()
let firstImageReported = false

function emit(event: string, data: Record<string, unknown>) {
  console.info(`[track] ${event}`, data)
  try {
    const key = 'metrics'
    const list = (Taro.getStorageSync(key) as unknown[]) || []
    list.unshift({ event, ...data, ts: Date.now() })
    Taro.setStorageSync(key, list.slice(0, 50))
  } catch {
    // 存储失败不影响主流程
  }
}

export function track(event: string, data: Record<string, unknown> = {}) {
  emit(event, data)
}

/** 「打开 → 看见第一张点位图」性能指标，整个生命周期只记一次 */
export function reportFirstImage(from: string) {
  if (firstImageReported) return
  firstImageReported = true
  emit('first_image_ms', { ms: Date.now() - launchTs, from })
}
