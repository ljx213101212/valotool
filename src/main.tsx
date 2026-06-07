import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { initTimelineKeyframeLiveSync } from '@/shared/utils/timelineKeyframeLiveSync'
import MatchListPage from '@/features/match-replay/MatchListPage'
import MatchReplayRoute from '@/features/match-replay/MatchReplayRoute'

initTimelineKeyframeLiveSync()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/replay" element={<MatchListPage />} />
        <Route path="/replay/:matchId" element={<MatchReplayRoute />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
