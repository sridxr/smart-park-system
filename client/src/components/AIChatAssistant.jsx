import { useMemo, useState } from "react";
import { LoaderCircle, Sparkles } from "lucide-react";
import { motion as Motion } from "framer-motion";

import API from "../api";
import TypewriterText from "./ui/TypewriterText";

function AIChatAssistant({ location, carType, maxPrice }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Ask SmartPark AI for the cheapest parking, best SUV fit, or the least crowded option.",
    },
  ]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [thinkingLabel, setThinkingLabel] = useState("AI thinking...");
  const [matches, setMatches] = useState([]);

  const suggestions = useMemo(
    () => [
      "Cheapest parking near me",
      "Best parking for SUV",
      "Least crowded parking",
      "Closest parking with good availability",
    ],
    []
  );

  const askAssistant = async (text) => {
    if (!text.trim()) return;

    setMessages((prev) => [...prev, { role: "user", text }]);
    setLoading(true);
    setThinkingLabel("AI thinking...");
    setQuery("");

    const labelTimers = [
      window.setTimeout(() => setThinkingLabel("Scanning nearby parking..."), 500),
      window.setTimeout(() => setThinkingLabel("Comparing price, traffic, and fit..."), 1200),
    ];

    try {
      const res = await API.post("/ai/chat", {
        message: text,
        location,
        carType,
        maxPrice,
      });
      setMatches(res.data.matches || []);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: res.data.answer,
        },
      ]);
    } catch (err) {
      setMatches([]);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: err.response?.data?.msg || "I could not analyze the parking data right now.",
        },
      ]);
    } finally {
      labelTimers.forEach((timer) => window.clearTimeout(timer));
      setLoading(false);
    }
  };

  return (
    <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-2xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-emerald-300/70">AI Assistant</p>
          <h3 className="mt-2 text-xl font-semibold text-white">Conversational Parking Intelligence</h3>
        </div>
        {loading ? (
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">
            <LoaderCircle className="animate-spin" size={14} />
            AI analyzing...
          </div>
        ) : null}
      </div>

      <div className="mt-5 max-h-80 space-y-3 overflow-auto pr-1">
        {messages.map((message, index) => (
          <Motion.div
            key={`${message.role}-${index}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl px-4 py-3 text-sm ${
              message.role === "assistant"
                ? "border border-emerald-400/10 bg-emerald-400/10 text-emerald-50"
                : "border border-white/10 bg-slate-900/80 text-white"
            }`}
          >
            {message.role === "assistant" && index === messages.length - 1 && !loading ? (
              <TypewriterText key={`${index}-${message.text}`} text={message.text} cursor className="leading-6" />
            ) : (
              message.text
            )}
          </Motion.div>
        ))}

        {loading ? (
          <Motion.div
            initial={{ opacity: 0.4 }}
            animate={{ opacity: [0.35, 1, 0.35] }}
            transition={{ duration: 1.25, repeat: Number.POSITIVE_INFINITY }}
            className="rounded-2xl border border-emerald-400/10 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-50"
          >
            <div className="flex items-center gap-2">
              <Sparkles size={14} />
              {thinkingLabel}
            </div>
          </Motion.div>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => askAssistant(suggestion)}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 hover:bg-white/10"
          >
            {suggestion}
          </button>
        ))}
      </div>

      {matches.length ? (
        <div className="mt-4 grid gap-2">
          {matches.map((match) => (
            <div key={match._id} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/70">
              <p className="font-medium text-white">{match.title}</p>
              <p className="mt-1">
                Rs. {match.dynamicPrice || match.fare} | {match.ai?.distanceKm !== null && match.ai?.distanceKm !== undefined ? `${match.ai.distanceKm} km` : "Nearby"} | {match.ai?.carFit || "Balanced"}
              </p>
              <p className="mt-2 text-xs text-emerald-200/80">
                SmartPark AI says this option is strong because of the live score, current availability, and your search intent.
              </p>
            </div>
          ))}
        </div>
      ) : null}

      <form
        className="mt-4 flex gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          void askAssistant(query);
        }}
      >
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="flex-1 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none"
          placeholder="Ask SmartPark AI anything about parking..."
        />
        <button className="rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950">
          Ask
        </button>
      </form>
    </div>
  );
}

export default AIChatAssistant;
