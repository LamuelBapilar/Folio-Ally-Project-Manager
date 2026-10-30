import { useCallback, useEffect, useState } from "react";

// start(seconds) begins a countdown; `remaining` is the whole seconds left (0 when idle)
export function useCountdown() {
  const [deadline, setDeadline] = useState(null); // a timestamp in milliseconds
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!deadline) return;

    const timer = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= deadline) setDeadline(null);
    }, 250);

    return () => clearInterval(timer);
  }, [deadline]);

  const start = useCallback((seconds) => {
    const current = Date.now();
    setNow(current);
    setDeadline(current + seconds * 1000);
  }, []);

  // always derived from the clock, never counted down, so it cannot drift
  const remaining = deadline ? Math.max(0, Math.ceil((deadline - now) / 1000)) : 0;

  return { remaining, start };
}