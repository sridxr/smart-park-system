import { useEffect, useMemo, useState } from "react";

function TypewriterText({
  text,
  speed = 18,
  animate = true,
  className = "",
  cursor = false,
}) {
  const safeText = useMemo(() => String(text || ""), [text]);
  const [visibleCount, setVisibleCount] = useState(() => (animate ? 0 : safeText.length));

  useEffect(() => {
    if (!animate) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setVisibleCount((current) => {
        if (current >= safeText.length) {
          window.clearInterval(intervalId);
          return current;
        }

        return current + 1;
      });
    }, speed);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [animate, safeText.length, speed]);

  const rendered = animate ? safeText.slice(0, visibleCount) : safeText;

  return (
    <span className={className}>
      {rendered}
      {cursor && visibleCount < safeText.length ? <span className="app-type-cursor">|</span> : null}
    </span>
  );
}

export default TypewriterText;
