import { useEffect, useRef, useState, useCallback } from 'react';

interface CountdownTimerProps {
  readonly timeLimit: number;
  readonly onExpire: () => void;
  readonly running: boolean;
  readonly onTick?: (timeRemaining: number) => void;
}

const RADIUS = 44;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function CountdownTimer({ timeLimit, onExpire, running, onTick }: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(timeLimit);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const expiredRef = useRef(false);

  const tick = useCallback((now: number) => {
    if (!startTimeRef.current) startTimeRef.current = now;
    const elapsed = (now - startTimeRef.current) / 1000;
    const remaining = Math.max(0, timeLimit - elapsed);
    const rounded = Math.ceil(remaining);

    setTimeRemaining(rounded);
    onTick?.(remaining);

    if (remaining <= 0 && !expiredRef.current) {
      expiredRef.current = true;
      onExpire();
      return;
    }

    if (remaining > 0) {
      rafRef.current = requestAnimationFrame(tick);
    }
  }, [timeLimit, onExpire, onTick]);

  useEffect(() => {
    if (!running) return;
    expiredRef.current = false;
    startTimeRef.current = null;
    setTimeRemaining(timeLimit);
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [running, timeLimit, tick]);

  const progress = timeRemaining / timeLimit;
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  const color =
    progress > 0.5 ? '#66BF39' :
    progress > 0.25 ? '#D89E00' :
    '#E21B3C';

  return (
    <div className="relative flex items-center justify-center w-28 h-28" role="timer" aria-label={`${timeRemaining} seconds remaining`}>
      <svg width="112" height="112" viewBox="0 0 112 112" className="-rotate-90">
        <circle
          cx="56"
          cy="56"
          r={RADIUS}
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="8"
        />
        <circle
          cx="56"
          cy="56"
          r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.1s linear, stroke 0.3s ease' }}
        />
      </svg>
      <span className="absolute text-3xl font-black text-white tabular-nums">
        {timeRemaining}
      </span>
    </div>
  );
}
