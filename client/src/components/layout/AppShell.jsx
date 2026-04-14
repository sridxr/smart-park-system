import { AnimatePresence, motion as Motion } from "framer-motion";
import { useMemo } from "react";
import { Outlet, useLocation } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { usePlatformChrome } from "../../hooks/usePlatformChrome";
import { buildWorkspaceSearchItems } from "../../lib/searchIndex";
import { getRoleTheme } from "../../lib/roleThemeTokens";
import ConfirmModal from "../ui/ConfirmModal";
import AppSidebar from "./AppSidebar";
import MobileSidebarDrawer from "./MobileSidebarDrawer";
import AppTopbar from "./AppTopbar";
import WorkspaceQuickActions from "./WorkspaceQuickActions";

function AppShell({ role, context }) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const location = useLocation();
  const chrome = usePlatformChrome();
  const searchItems = useMemo(
    () => buildWorkspaceSearchItems(role, context),
    [context, role]
  );
  const roleTheme = useMemo(() => getRoleTheme(role, theme), [role, theme]);

  return (
    <>
      <div
        className="app-shell-bg min-h-screen text-[var(--app-text)]"
        style={roleTheme.cssVars}
        data-role={role}
      >
        <div className="flex min-h-screen">
          <AppSidebar role={role} onLogoutRequest={() => chrome.setLogoutOpen(true)} />
          <MobileSidebarDrawer
            role={role}
            isOpen={chrome.mobileNavOpen}
            onClose={() => chrome.setMobileNavOpen(false)}
            onLogoutRequest={() => chrome.setLogoutOpen(true)}
          />
          <div className="flex min-w-0 flex-1 flex-col">
            <AppTopbar
              role={role}
              pathname={location.pathname}
              user={user}
              notifications={chrome.notifications}
              unreadCount={chrome.unreadCount}
              notificationsOpen={chrome.notificationsOpen}
              onNotificationsToggle={() => chrome.setNotificationsOpen((current) => !current)}
              onMarkNotificationRead={chrome.markNotificationRead}
              onNotificationNavigate={chrome.navigateFromNotification}
              profileOpen={chrome.profileOpen}
              onProfileToggle={() => chrome.setProfileOpen((current) => !current)}
              onLogoutRequest={() => chrome.setLogoutOpen(true)}
              lastUpdatedAt={chrome.lastUpdatedAt}
              platformStatus={chrome.platformStatus}
              searchItems={searchItems}
              onMobileNavOpen={() => chrome.setMobileNavOpen(true)}
            />
            <WorkspaceQuickActions role={role} context={context} />
            <main className="flex-1 px-4 py-6 md:px-6">
              <AnimatePresence mode="wait">
                <Motion.div
                  key={location.pathname}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.26, ease: "easeOut" }}
                >
                  <Outlet context={context} />
                </Motion.div>
              </AnimatePresence>
            </main>
          </div>
        </div>
      </div>
      <ConfirmModal
        isOpen={chrome.logoutOpen}
        title="Are you sure you want to logout?"
        description="Your session will be cleared from this browser and you will be redirected to the login screen."
        confirmLabel="Logout"
        tone="danger"
        onConfirm={chrome.confirmLogout}
        onCancel={() => chrome.setLogoutOpen(false)}
      />
    </>
  );
}

export default AppShell;
