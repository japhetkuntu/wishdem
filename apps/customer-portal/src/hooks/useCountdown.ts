import { useCallback, useEffect, useState } from "react";

export function useCountdown(initialSeconds: number) {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    const id = window.setInterval(() => {
      setSeconds((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const reset = useCallback(() => setSeconds(initialSeconds), [initialSeconds]);

  return { seconds, reset, isDone: seconds <= 0 };
}
