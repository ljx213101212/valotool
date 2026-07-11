import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { initTimelineKeyframeLiveSync } from '@/shared/utils/timelineKeyframeLiveSync'
import MatchListPage from '@/features/match-replay/MatchListPage'
import MatchReplayRoute from '@/features/match-replay/MatchReplayRoute'
import TimelineIngestPage from '@/features/timeline-ingest/TimelineIngestPage'

initTimelineKeyframeLiveSync()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MatchListPage />} />
        <Route path="/replay/:matchId" element={<MatchReplayRoute />} />
        <Route path="/timeline-ingest" element={<TimelineIngestPage />} />
        <Route path="/legacy" element={<App />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
