import { useEffect } from "react";

export default function useVisibilityPause(setPaused) {
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) setPaused(true);
    };
    const onBlur = () => setPaused(true);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
    };
  }, [setPaused]);
}
