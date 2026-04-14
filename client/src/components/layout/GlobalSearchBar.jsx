import { AnimatePresence, motion as Motion } from "framer-motion";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import platformService from "../../services/platformService";
import { roleNavigation } from "../../lib/navigation";

function highlightLabel(label, query) {
  if (!query.trim()) {
    return label;
  }

  const lowerLabel = label.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const matchIndex = lowerLabel.indexOf(lowerQuery);

  if (matchIndex === -1) {
    return label;
  }

  return (
    <>
      {label.slice(0, matchIndex)}
      <span className="rounded bg-blue-500/20 px-1 text-white">
        {label.slice(matchIndex, matchIndex + query.length)}
      </span>
      {label.slice(matchIndex + query.length)}
    </>
  );
}

function GlobalSearchBar({ role, notifications = [], searchItems = [] }) {
  const [query, setQuery] = useState("");
  const [remoteResults, setRemoteResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const fallbackResults = useMemo(() => {
    const items = roleNavigation[role] || [];
    if (!query.trim()) {
      return [];
    }
    const lowered = query.toLowerCase();
    const navMatches = items
      .filter((item) => item.label.toLowerCase().includes(lowered))
      .map((item) => ({
        id: item.to,
        label: item.label,
        to: item.to,
        helper: "Navigation",
      }));
    const notificationMatches = notifications
      .filter(
        (notification) =>
          String(notification?.title || "").toLowerCase().includes(lowered) ||
          String(notification?.message || "").toLowerCase().includes(lowered)
      )
      .map((notification) => ({
        id: notification._id,
        label: notification.title || "Platform notification",
        to: notification.actionUrl || items[0]?.to || "/",
        helper: "Notification",
      }));
    const workspaceMatches = searchItems
      .filter((item) => {
        const haystack = [
          item.label,
          item.helper,
          ...(Array.isArray(item.keywords) ? item.keywords : []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(lowered);
      })
      .map((item) => ({
        id: item.id,
        label: item.label,
        to: item.to,
        helper: item.helper,
      }));
    return [...navMatches, ...workspaceMatches, ...notificationMatches].slice(0, 7);
  }, [notifications, query, role, searchItems]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setRemoteResults([]);
      setSearching(false);
      return undefined;
    }

    let active = true;
    const timeoutId = window.setTimeout(async () => {
      try {
        setSearching(true);
        const response = await platformService.searchPlatform(query, 8);
        if (active) {
          setRemoteResults(response.data || []);
        }
      } catch {
        if (active) {
          setRemoteResults([]);
        }
      } finally {
        if (active) {
          setSearching(false);
        }
      }
    }, 260);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [query]);

  const results = remoteResults.length ? remoteResults : fallbackResults;

  function renderHighlightedText(result, field) {
    const text = result[field] || "";
    const ranges = result.highlightRanges?.[field] || [];

    if (!ranges.length) {
      return text;
    }

    const firstRange = ranges[0];
    return (
      <>
        {text.slice(0, firstRange.start)}
        <span className="rounded bg-blue-500/20 px-1 text-white">
          {text.slice(firstRange.start, firstRange.end)}
        </span>
        {text.slice(firstRange.end)}
      </>
    );
  }

  return (
    <div className="relative hidden xl:block">
      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/55 transition focus-within:border-blue-400/40 focus-within:bg-white/[0.06] focus-within:shadow-[0_0_0_4px_rgba(59,130,246,0.12)]">
        <Search size={16} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search pages, alerts, and actions"
          className="w-72 bg-transparent text-white outline-none placeholder:text-white/35"
        />
      </div>

      <AnimatePresence>
        {results.length || searching ? (
          <Motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="absolute left-0 right-0 top-14 z-[60] rounded-[24px] border border-white/10 bg-[linear-gradient(145deg,rgba(15,23,42,0.98),rgba(2,8,23,0.98))] p-3 shadow-[0_24px_100px_rgba(2,8,23,0.58)]"
          >
            {searching ? (
              <div className="rounded-2xl px-4 py-3 text-sm text-white/60">Searching workspace...</div>
            ) : null}
            {results.map((result) => (
              <Link
                key={result.id}
                to={result.to}
                onClick={() => setQuery("")}
                className="block rounded-2xl px-4 py-3 text-sm text-white/75 transition hover:bg-white/[0.05]"
              >
                <p className="font-medium text-white">
                  {result.highlightRanges ? renderHighlightedText(result, "label") : highlightLabel(result.label, query)}
                </p>
                <p className="mt-1 text-xs text-white/45">
                  {result.highlightRanges ? renderHighlightedText(result, "helper") : result.helper}
                </p>
              </Link>
            ))}
          </Motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export default GlobalSearchBar;
