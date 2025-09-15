import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './app/App.jsx'
import './styles/main.scss'
import { HashRouter } from 'react-router-dom'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
)

if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    })
  } else {
    navigator.serviceWorker.getRegistrations().then((regs) =>
      regs.forEach((r) => r.unregister())
    )
    caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)))
  }
}
