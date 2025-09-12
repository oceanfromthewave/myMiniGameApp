import { useCallback, useMemo, useState } from "react";
const SFX_KEY = "mgp:sfx-enabled";

export default function useSfx() {
  const [enabled, setEnabled] = useState(() => {
    try {
      return localStorage.getItem(SFX_KEY) !== "0";
    } catch {
      return true;
    }
  });
  const ctx = useMemo(
    () =>
      typeof window !== "undefined" && "AudioContext" in window
        ? new AudioContext()
        : null,
    []
  );

  const beep = useCallback(
    (freq = 440, dur = 0.06, type = "sine", gain = 0.03) => {
      if (!enabled || !ctx) return;
      const t0 = ctx.currentTime;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.value = freq;
      g.gain.value = gain;
      o.connect(g);
      g.connect(ctx.destination);
      o.start(t0);
      o.stop(t0 + dur);
    },
    [ctx, enabled]
  );

  const playMerge = useCallback(() => beep(220, 0.08, "square", 0.04), [beep]);
  const playSpawn = useCallback(() => beep(660, 0.05, "sine", 0.03), [beep]);
  const toggle = useCallback(() => {
    const next = !enabled;
    setEnabled(next);
    try {
      localStorage.setItem(SFX_KEY, next ? "1" : "0");
    } catch {}
  }, [enabled]);

  return { enabled, playMerge, playSpawn, toggle };
}
