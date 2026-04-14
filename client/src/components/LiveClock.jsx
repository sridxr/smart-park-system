import { useEffect, useState } from "react";

function LiveClock({ className = "" }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <div className={`rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-right ${className}`}>
      <p className="text-[10px] uppercase tracking-[0.3em] text-white/35">Live Time</p>
      <p className="mt-1 text-sm font-semibold text-white">{now.toLocaleTimeString("en-IN")}</p>
      <p className="mt-1 text-xs text-white/45">{now.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
    </div>
  );
}

export default LiveClock;
