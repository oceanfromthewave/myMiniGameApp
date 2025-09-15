import { useCallback, useMemo, useState } from 'react'

const HAPTICS_KEY = 'mgp:haptics-enabled'

export default function useHaptics() {
  const [enabled, setEnabled] = useState(() => {
    try { return localStorage.getItem(HAPTICS_KEY) !== '0' } catch { return true }
  })

  const supported = useMemo(() => typeof navigator !== 'undefined' && 'vibrate' in navigator, [])

  const vibrate = useCallback((pattern = 20) => {
    if (!enabled || !supported) return
    try { navigator.vibrate(pattern) } catch {}
  }, [enabled, supported])

  const toggle = useCallback(() => {
    const next = !enabled
    setEnabled(next)
    try { localStorage.setItem(HAPTICS_KEY, next ? '1' : '0') } catch {}
  }, [enabled])

  return { enabled, toggle, vibrate, supported }
}
