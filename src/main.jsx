import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './app/App.jsx'
import './styles/main.scss'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(()=>{})
  })
}
