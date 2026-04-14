/* eslint-disable react-refresh/only-export-components */

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

const ToastContext = createContext(null);

const toneStyles = {
  success: {
    icon: CheckCircle2,
    className: "border-emerald-400/20 bg-emerald-400/10 text-emerald-50",
  },
  error: {
    icon: AlertTriangle,
    className: "border-rose-400/20 bg-rose-400/10 text-rose-50",
  },
  info: {
    icon: Info,
    className: "border-sky-400/20 bg-sky-400/10 text-sky-50",
  },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    ({ title, description = "", tone = "info" }) => {
      const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      setToasts((current) => [...current, { id, title, description, tone }]);
      window.setTimeout(() => {
        dismissToast(id);
      }, 3200);
    },
    [dismissToast]
  );

  const value = useMemo(
    () => ({
      showToast,
      dismissToast,
    }),
    [dismissToast, showToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[90] flex w-full max-w-sm flex-col gap-3">
        <AnimatePresence>
          {toasts.map((toast) => {
            const tone = toneStyles[toast.tone] || toneStyles.info;
            const Icon = tone.icon;
            return (
              <Motion.div
                key={toast.id}
                initial={{ opacity: 0, y: -18, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                className={`pointer-events-auto rounded-[24px] border px-4 py-4 shadow-[0_20px_80px_rgba(2,8,23,0.42)] backdrop-blur-2xl ${tone.className}`}
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/10 p-2">
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{toast.title}</p>
                    {toast.description ? (
                      <p className="mt-1 text-sm text-white/75">{toast.description}</p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => dismissToast(toast.id)}
                    className="rounded-full border border-white/10 bg-white/5 p-1 text-white/60"
                  >
                    <X size={14} />
                  </button>
                </div>
              </Motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const value = useContext(ToastContext);
  if (!value) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return value;
}
