import {
  Bell,
  Bookmark,
  CarFront,
  ChartColumn,
  CircleDollarSign,
  Cog,
  Compass,
  Gauge,
  Heart,
  LayoutDashboard,
  MapPinned,
  ParkingCircle,
  ShieldCheck,
  Users,
} from "lucide-react";

export const roleNavigation = {
  user: [
    { label: "Dashboard", to: "/user/dashboard", icon: LayoutDashboard },
    { label: "Explore", to: "/user/explore", icon: Compass },
    { label: "Bookings", to: "/user/bookings", icon: Bookmark },
    { label: "Favorites", to: "/user/favorites", icon: Heart },
    { label: "Profile", to: "/user/profile", icon: Users },
  ],
  lender: [
    { label: "Dashboard", to: "/lender/dashboard", icon: LayoutDashboard },
    { label: "My Parkings", to: "/lender/parkings", icon: ParkingCircle },
    { label: "Bookings", to: "/lender/bookings", icon: Bookmark },
    { label: "Analytics", to: "/lender/analytics", icon: ChartColumn },
    { label: "Settings", to: "/lender/settings", icon: Cog },
  ],
  admin: [
    { label: "Dashboard", to: "/admin/dashboard", icon: Gauge },
    { label: "Users", to: "/admin/users", icon: Users },
    { label: "Parkings", to: "/admin/parkings", icon: MapPinned },
    { label: "Bookings", to: "/admin/bookings", icon: CarFront },
    { label: "Analytics", to: "/admin/analytics", icon: CircleDollarSign },
    { label: "Alerts", to: "/admin/alerts", icon: Bell },
  ],
};

export const roleThemes = {
  user: {
    accent: "emerald",
    badgeClass: "border-emerald-400/20 bg-emerald-400/10 text-emerald-100",
    sidebarGlow:
      "radial-gradient(circle at top, rgba(16,185,129,0.18), transparent 22%), linear-gradient(180deg, rgba(15,23,42,0.98), rgba(2,8,23,0.98))",
  },
  lender: {
    accent: "sky",
    badgeClass: "border-sky-400/20 bg-sky-400/10 text-sky-100",
    sidebarGlow:
      "radial-gradient(circle at top, rgba(56,189,248,0.18), transparent 22%), linear-gradient(180deg, rgba(15,23,42,0.98), rgba(2,8,23,0.98))",
  },
  admin: {
    accent: "violet",
    badgeClass: "border-violet-400/20 bg-violet-400/10 text-violet-100",
    sidebarGlow:
      "radial-gradient(circle at top, rgba(168,85,247,0.18), transparent 22%), linear-gradient(180deg, rgba(15,23,42,0.98), rgba(2,8,23,0.98))",
  },
};

export function getSectionMeta(role, pathname) {
  const items = roleNavigation[role] || [];
  return items.find((item) => pathname === item.to || pathname.startsWith(`${item.to}/`)) || items[0];
}

export function getDashboardPath(role) {
  if (role === "lender") {
    return "/lender/dashboard";
  }
  if (role === "admin") {
    return "/admin/dashboard";
  }
  return "/user/dashboard";
}

export const roleLabels = {
  user: "User Workspace",
  lender: "Lender Workspace",
  admin: "Admin Control",
};

export const roleIcons = {
  user: ShieldCheck,
  lender: ParkingCircle,
  admin: Gauge,
};
