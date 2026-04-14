import { AnimatePresence, motion as Motion } from "framer-motion";
import { LogOut, X } from "lucide-react";
import { NavLink } from "react-router-dom";

import { useTheme } from "../../context/ThemeContext";
import { roleIcons, roleLabels, roleNavigation } from "../../lib/navigation";
import { getRoleTheme } from "../../lib/roleThemeTokens";

function MobileSidebarDrawer({ role, isOpen, onClose, onLogoutRequest }) {
  const items = roleNavigation[role] || [];
  const { theme: colorMode } = useTheme();
  const theme = getRoleTheme(role, colorMode);
  const RoleIcon = roleIcons[role];

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
            className="fixed inset-0 z-[70] bg-slate-950/70 backdrop-blur-sm lg:hidden"
          />
          <Motion.aside
            initial={{ x: -320, opacity: 0.6 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0.6 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed inset-y-0 left-0 z-[80] flex w-[88vw] max-w-xs flex-col border-r border-white/10 px-5 py-6 lg:hidden"
            style={{ backgroundImage: theme.sidebarGlow }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="app-surface rounded-[28px] p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl border p-3" style={theme.badgeStyle}>
                    <RoleIcon size={20} />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-white/40">SmartPark AI</p>
                    <h2 className="mt-2 text-xl font-semibold text-white">{roleLabels[role]}</h2>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-white/70"
              >
                <X size={18} />
              </button>
            </div>

            <nav className="mt-8 space-y-2">
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `group flex items-center gap-3 rounded-[22px] px-4 py-3 text-sm transition duration-200 ${
                        isActive
                          ? "border border-white/10 bg-white/10 text-white shadow-[0_12px_32px_rgba(15,23,42,0.35)]"
                          : "border border-transparent text-white/65 hover:-translate-y-0.5 hover:border-white/10 hover:bg-white/[0.04] hover:text-white"
                      }`
                    }
                  >
                    <Icon size={18} className="transition-transform duration-200 group-hover:scale-110" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            <button
              type="button"
              onClick={() => {
                onClose();
                onLogoutRequest();
              }}
              className="mt-auto flex w-full items-center gap-3 rounded-[22px] border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-50 transition hover:-translate-y-0.5 hover:bg-rose-400/15"
            >
              <LogOut size={18} />
              Logout
            </button>
          </Motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}

export default MobileSidebarDrawer;
