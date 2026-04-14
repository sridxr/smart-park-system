import { AnimatePresence, motion as Motion } from "framer-motion";
import { X } from "lucide-react";

function DetailDrawer({ isOpen, title, subtitle = "", children, onClose, width = "max-w-md" }) {
  return (
    <AnimatePresence>
      {isOpen ? (
        <>
          <Motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[70] bg-slate-950/70 backdrop-blur-sm"
          />
          <Motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            className={`fixed right-0 top-0 z-[80] h-full w-full ${width} overflow-y-auto border-l border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,8,23,0.98))] p-6 shadow-[0_30px_120px_rgba(2,8,23,0.7)]`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-white/40">Details</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">{title}</h3>
                {subtitle ? <p className="mt-2 text-sm text-white/55">{subtitle}</p> : null}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-white/10 bg-white/5 p-2 text-white/65"
              >
                <X size={16} />
              </button>
            </div>
            <div className="mt-6">{children}</div>
          </Motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}

export default DetailDrawer;
