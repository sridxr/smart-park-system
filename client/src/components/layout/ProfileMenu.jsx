import { AnimatePresence, motion as Motion } from "framer-motion";
import { ChevronDown, LogOut, Settings, UserCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

import { useTheme } from "../../context/ThemeContext";
import { getRoleTheme } from "../../lib/roleThemeTokens";

function ProfileMenu({
  role,
  user,
  isOpen,
  onToggle,
  onLogout,
}) {
  const { theme: colorMode } = useTheme();
  const theme = getRoleTheme(role, colorMode);
  const profilePath = role === "user" ? "/user/profile" : role === "lender" ? "/lender/settings" : "/admin/users";
  const settingsPath = role === "user" ? "/user/profile" : role === "lender" ? "/lender/settings" : "/admin/analytics";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5"
      >
        {user?.avatar ? (
          <img src={user.avatar} alt={user.name} className="h-10 w-10 rounded-2xl object-cover" />
        ) : (
          <UserCircle2 className="text-white/75" size={24} />
        )}
        <div className="hidden text-left sm:block">
          <p className="text-sm font-medium text-white">{user?.name || "Operator"}</p>
          <p className="text-xs text-white/45">{user?.email || "Connected session"}</p>
        </div>
        <ChevronDown className="text-white/45" size={16} />
      </button>

      <AnimatePresence>
        {isOpen ? (
          <Motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute right-0 top-14 z-[60] w-72 rounded-[28px] border border-white/10 bg-[linear-gradient(145deg,rgba(15,23,42,0.98),rgba(2,8,23,0.98))] p-4 shadow-[0_24px_100px_rgba(2,8,23,0.58)]"
          >
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center gap-3">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="h-12 w-12 rounded-2xl object-cover" />
                ) : (
                  <UserCircle2 className="text-white/75" size={28} />
                )}
                <div className="min-w-0">
                  <p className="truncate font-medium text-white">{user?.name}</p>
                  <p className="truncate text-xs text-white/45">{user?.email}</p>
                </div>
              </div>
              <div className="mt-4 inline-flex rounded-full border px-3 py-1 text-xs" style={theme.badgeStyle}>
                {role}
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <Link to={profilePath} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/75">
                <UserCircle2 size={16} />
                My Profile
              </Link>
              <Link to={settingsPath} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/75">
                <Settings size={16} />
                Settings
              </Link>
              <button
                type="button"
                onClick={onLogout}
                className="flex w-full items-center gap-3 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-50"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </Motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export default ProfileMenu;
