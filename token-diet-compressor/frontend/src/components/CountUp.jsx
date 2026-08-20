import { useEffect, useRef, useState } from "react";

export default function CountUp({ value, decimals = 0, prefix = "", suffix = "", duration = 700 }) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const rafRef = useRef(null);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    if (from === to) return undefined;

    const start = performance.now();
    function settle() {
      fromRef.current = to;
      setDisplay(to);
    }
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + (to - from) * eased);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    }
    rafRef.current = requestAnimationFrame(tick);
    // rAF is throttled/paused on hidden or non-compositing tabs, which would
    // otherwise leave the display stuck mid-animation indefinitely — this
    // guarantees it always converges to the real value.
    const fallback = setTimeout(settle, duration + 120);
    return () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(fallback);
    };
  }, [value, duration]);

  return (
    <>
      {prefix}
      {display.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </>
  );
}
