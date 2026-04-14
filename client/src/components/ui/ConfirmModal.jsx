import { AnimatePresence, motion as Motion } from "framer-motion";

function ConfirmModal({
  isOpen,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "default",
  onConfirm,
  onCancel,
}) {
  const confirmTone =
    tone === "danger"
      ? "bg-rose-300 text-slate-950"
      : "bg-white text-slate-950";

  return (
    <AnimatePresence>
      {isOpen ? (
        <>
          <Motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 z-[90] bg-slate-950/80 backdrop-blur-sm"
          />
          <Motion.div
            initial={{ opacity: 0, y: 22, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            className="fixed left-1/2 top-1/2 z-[100] w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-[30px] border border-white/10 bg-[linear-gradient(145deg,rgba(15,23,42,0.98),rgba(2,8,23,0.98))] p-6 shadow-[0_28px_120px_rgba(2,8,23,0.7)]"
          >
            <p className="text-xs uppercase tracking-[0.35em] text-white/35">Confirmation</p>
            <h3 className="mt-3 text-2xl font-semibold text-white">{title}</h3>
            <p className="mt-3 text-sm text-white/65">{description}</p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className={`rounded-2xl px-4 py-3 text-sm font-semibold ${confirmTone}`}
              >
                {confirmLabel}
              </button>
            </div>
          </Motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

export default ConfirmModal;
