import { useNavigate } from "react-router-dom";
import { BarChart3, Compass, MapPinned, Navigation, ShieldAlert, Sparkles, Wallet } from "lucide-react";
import { motion as Motion } from "framer-motion";

function WorkspaceQuickActions({ role, context }) {
  const navigate = useNavigate();

  const baseActions = {
    user: [
      {
        id: "find",
        label: "Find Parking",
        helper: "Open live discovery",
        icon: Compass,
        onClick: () => navigate("/user/explore"),
      },
      {
        id: "bookings",
        label: "My Booking",
        helper: "Review active trips",
        icon: Wallet,
        onClick: () => navigate("/user/bookings"),
      },
      {
        id: "near",
        label: "Near Me",
        helper: "Jump to local inventory",
        icon: Navigation,
        onClick: () => {
          if (!navigator.geolocation || !context?.setLocation) {
            navigate("/user/explore");
            return;
          }

          navigator.geolocation.getCurrentPosition(
            (position) => {
              context.setLocation((current) => ({
                ...current,
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                fullText: "Near me",
              }));
              navigate("/user/explore");
            },
            () => navigate("/user/explore")
          );
        },
      },
    ],
    lender: [
      {
        id: "inventory",
        label: "My Parkings",
        helper: "Manage your locations",
        icon: MapPinned,
        onClick: () => navigate("/lender/parkings"),
      },
      {
        id: "analytics",
        label: "Analytics",
        helper: "See growth signals",
        icon: BarChart3,
        onClick: () => navigate("/lender/analytics"),
      },
      {
        id: "refresh",
        label: "Refresh",
        helper: "Sync live metrics",
        icon: Sparkles,
        onClick: () => {
          void context?.loadWorkspace?.();
        },
      },
    ],
    admin: [
      {
        id: "users",
        label: "Users",
        helper: "Open account control",
        icon: ShieldAlert,
        onClick: () => navigate("/admin/users"),
      },
      {
        id: "analytics",
        label: "Analytics",
        helper: "Review platform trends",
        icon: BarChart3,
        onClick: () => navigate("/admin/analytics"),
      },
      {
        id: "alerts",
        label: "Alerts",
        helper: "Fraud and system signals",
        icon: Sparkles,
        onClick: () => navigate("/admin/alerts"),
      },
    ],
  };

  const actions = baseActions[role] || [];

  if (!actions.length) {
    return null;
  }

  return (
    <div className="px-4 pt-4 md:px-6">
      <div className="grid gap-3 md:grid-cols-3">
        {actions.map((action, index) => {
          const Icon = action.icon;

          return (
            <Motion.button
              key={action.id}
              type="button"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              whileHover={{ y: -3, scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={action.onClick}
              className="app-surface group flex items-center gap-4 rounded-[26px] px-4 py-4 text-left"
            >
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-[var(--role-primary)] transition group-hover:scale-105">
                <Icon size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[color:var(--app-text)]">{action.label}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.25em] text-[color:var(--app-text-muted)]">
                  {action.helper}
                </p>
              </div>
            </Motion.button>
          );
        })}
      </div>
    </div>
  );
}

export default WorkspaceQuickActions;
