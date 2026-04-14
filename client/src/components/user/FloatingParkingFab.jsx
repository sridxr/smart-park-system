import { useState } from "react";
import { CarFront, Compass, Navigation, Sparkles } from "lucide-react";
import { AnimatePresence, motion as Motion } from "framer-motion";

function FloatingParkingFab({ onExplore, onNearMe, onSmartMode }) {
  const [open, setOpen] = useState(false);

  const actions = [
    { id: "explore", label: "Find Parking", icon: Compass, onClick: onExplore },
    { id: "nearby", label: "Near Me", icon: Navigation, onClick: onNearMe },
    { id: "smart", label: "Park for Me", icon: Sparkles, onClick: onSmartMode },
  ].filter((action) => typeof action.onClick === "function");

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[65]">
      <AnimatePresence>
        {open ? (
          <Motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            className="pointer-events-auto mb-3 flex flex-col items-end gap-2"
          >
            {actions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Motion.button
                  key={action.id}
                  type="button"
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 18 }}
                  transition={{ delay: index * 0.04 }}
                  onClick={() => {
                    action.onClick();
                    setOpen(false);
                  }}
                  className="app-surface app-hover-lift flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-[color:var(--app-text)]"
                >
                  <Icon size={16} className="text-[var(--role-primary)]" />
                  {action.label}
                </Motion.button>
              );
            })}
          </Motion.div>
        ) : null}
      </AnimatePresence>

      <Motion.button
        type="button"
        whileHover={{ scale: 1.03, y: -2 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setOpen((current) => !current)}
        className="app-fab pointer-events-auto flex items-center gap-3 rounded-full px-5 py-4 text-sm font-semibold text-white"
      >
        <CarFront size={18} />
        {open ? "Close" : "Find Parking"}
      </Motion.button>
    </div>
  );
}

export default FloatingParkingFab;
