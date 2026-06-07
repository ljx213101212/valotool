import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initTimelineKeyframeLiveSync } from '@/shared/utils/timelineKeyframeLiveSync'
// PoC：关键帧战术复盘（真实 match-details 样例）。访问 ?poc=replay 查看，不影响主应用。
import MatchReplayPoc from '@/features/match-replay/MatchReplayPoc'

initTimelineKeyframeLiveSync()

const isReplayPoc = new URLSearchParams(window.location.search).get('poc') === 'replay'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isReplayPoc ? <MatchReplayPoc /> : <App />}
  </StrictMode>,
)
