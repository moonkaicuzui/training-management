import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Web Vitals 모니터링 초기화 (비동기, 메인 번들에서 제외)
import('./utils/webVitals').then(({ initWebVitals }) => initWebVitals())
