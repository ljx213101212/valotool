import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initTimelineKeyframeLiveSync } from '@/shared/utils/timelineKeyframeLiveSync'

initTimelineKeyframeLiveSync()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
