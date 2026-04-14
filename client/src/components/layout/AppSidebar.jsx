import { LogOut } from "lucide-react";
import { NavLink } from "react-router-dom";

import { useTheme } from "../../context/ThemeContext";
import { roleIcons, roleLabels, roleNavigation } from "../../lib/navigation";
import { getRoleTheme } from "../../lib/roleThemeTokens";

function AppSidebar({ role, onLogoutRequest }) {
  const items = roleNavigation[role] || [];
  const { theme: colorMode } = useTheme();
  const theme = getRoleTheme(role, colorMode);
  const RoleIcon = roleIcons[role];

  return (
    <aside
      className="app-sidebar hidden w-72 shrink-0 border-r border-white/10 px-5 py-6 lg:block"
      style={{ backgroundImage: theme.sidebarGlow }}
    >
      <div className="app-surface rounded-[28px] p-5">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border p-3" style={theme.badgeStyle}>
            <RoleIcon size={22} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--app-text-muted)]">SmartPark AI</p>
            <h1 className="mt-2 text-2xl font-semibold text-[color:var(--app-text)]">{roleLabels[role]}</h1>
          </div>
        </div>
      </div>

      <nav className="mt-8 space-y-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-[22px] px-4 py-3 text-sm transition duration-200 ${
                  isActive
                    ? "border border-white/10 bg-white/10 text-[color:var(--app-text)] shadow-[0_12px_32px_rgba(15,23,42,0.35)]"
                    : "border border-transparent text-[color:var(--app-text-muted)] hover:-translate-y-0.5 hover:border-white/10 hover:bg-white/[0.04] hover:text-[color:var(--app-text)]"
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
        onClick={onLogoutRequest}
        className="mt-10 flex w-full items-center gap-3 rounded-[22px] border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-50 transition hover:-translate-y-0.5 hover:bg-rose-400/15"
      >
        <LogOut size={18} />
        Logout
      </button>
    </aside>
  );
}

export default AppSidebar;
