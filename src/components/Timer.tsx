import { useEffect, useState } from 'react';

export function useTimer(isRunning: boolean, resetKey = 0) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    setElapsed(0);
  }, [resetKey]);

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    const interval = window.setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isRunning]);

  return elapsed;
}
