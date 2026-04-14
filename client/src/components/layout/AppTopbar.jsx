import GlobalSearchBar from "./GlobalSearchBar";
import LiveClock from "../LiveClock";
import Breadcrumbs from "./Breadcrumbs";
import NotificationCenter from "./NotificationCenter";
import ProfileMenu from "./ProfileMenu";
import SystemStatusBadge from "./SystemStatusBadge";
import ThemeToggle from "./ThemeToggle";
import { Menu } from "lucide-react";

import { getSectionMeta } from "../../lib/navigation";

function AppTopbar({
  role,
  pathname,
  user,
  notifications,
  unreadCount,
  notificationsOpen,
  onNotificationsToggle,
  onMarkNotificationRead,
  onNotificationNavigate,
  profileOpen,
  onProfileToggle,
  onLogoutRequest,
  lastUpdatedAt,
  platformStatus,
  searchItems,
  onMobileNavOpen,
}) {
  const section = getSectionMeta(role, pathname);

  return (
    <header className="app-topbar sticky top-0 z-40 border-b border-white/10 bg-[rgba(11,15,25,0.82)] px-4 py-4 backdrop-blur-2xl md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={onMobileNavOpen}
            className="app-button-secondary rounded-2xl p-3 text-[color:var(--app-text-muted)] lg:hidden"
          >
            <Menu size={18} />
          </button>
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--app-text-muted)]">{role} workspace</p>
            <h2 className="mt-2 text-2xl font-semibold text-[color:var(--app-text)]">{section?.label || "Dashboard"}</h2>
            <Breadcrumbs role={role} pathname={pathname} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden xl:block">
            <SystemStatusBadge lastUpdatedAt={lastUpdatedAt} platformStatus={platformStatus} />
          </div>
          <GlobalSearchBar role={role} notifications={notifications} searchItems={searchItems} />
          <div className="hidden lg:block">
            <LiveClock />
          </div>
          <ThemeToggle />
          <NotificationCenter
            isOpen={notificationsOpen}
            notifications={notifications}
            unreadCount={unreadCount}
            onToggle={onNotificationsToggle}
            onMarkRead={onMarkNotificationRead}
            onNavigate={onNotificationNavigate}
          />
          <ProfileMenu
            role={role}
            user={user}
            isOpen={profileOpen}
            onToggle={onProfileToggle}
            onLogout={onLogoutRequest}
          />
        </div>
      </div>
    </header>
  );
}

export default AppTopbar;
