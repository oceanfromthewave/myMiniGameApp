import { useCallback, useEffect, useState } from 'react'

const THEME_KEY = 'mgp:theme'
const DEFAULT_THEME = 'graphite' // 'midnight' | 'sunset' | 'graphite'

export default function useTheme() {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem(THEME_KEY) || DEFAULT_THEME
    } catch {
      return DEFAULT_THEME
    }
  })

  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', theme)
    try {
      localStorage.setItem(THEME_KEY, theme)
    } catch {}
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'midnight' ? 'sunset' : t === 'sunset' ? 'graphite' : 'midnight'))
  }, [])

  return { theme, setTheme, toggleTheme }
}
