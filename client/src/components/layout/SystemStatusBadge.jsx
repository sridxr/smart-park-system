import { useEffect, useMemo, useState } from "react";

function formatDecisionAge(lastDecisionAt, tick) {
  if (!lastDecisionAt) {
    return "Waiting for decision data";
  }

  const secondsAgo = Math.max(0, Math.floor((tick - new Date(lastDecisionAt).getTime()) / 1000));
  return `${secondsAgo}s ago`;
}

function SystemStatusBadge({ lastUpdatedAt, platformStatus = null }) {
  const [tick, setTick] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setTick(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const secondsAgo = useMemo(() => {
    if (!lastUpdatedAt) {
      return 0;
    }
    return Math.max(0, Math.floor((tick - new Date(lastUpdatedAt).getTime()) / 1000));
  }, [lastUpdatedAt, tick]);

  return (
    <div className="app-status-pill rounded-2xl px-4 py-3 text-xs">
      <p className="uppercase tracking-[0.3em] text-white/80">
        {platformStatus?.systemOnline === false ? "System Syncing" : "System Online"}
      </p>
      <p className="mt-1 text-white/75">Last updated: {secondsAgo}s ago</p>
      <p className="mt-1 text-white/65">
        {platformStatus?.aiEngineActive ? "AI Engine Active" : "AI Engine Standby"} | Last decision:{" "}
        {formatDecisionAge(platformStatus?.lastDecisionAt, tick)}
      </p>
    </div>
  );
}

export default SystemStatusBadge;
