import { Suspense, lazy } from "react";
import { motion as Motion } from "framer-motion";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import { getDashboardPath } from "./lib/navigation";

const LoginPage = lazy(() => import("./pages/LoginPage"));
const UserWorkspace = lazy(() => import("./pages/user/UserWorkspace"));
const UserDashboardPage = lazy(() => import("./pages/user/UserDashboardPage"));
const UserExplorePage = lazy(() => import("./pages/user/UserExplorePage"));
const UserBookingsPage = lazy(() => import("./pages/user/UserBookingsPage"));
const UserFavoritesPage = lazy(() => import("./pages/user/UserFavoritesPage"));
const UserProfilePage = lazy(() => import("./pages/user/UserProfilePage"));
const LenderWorkspace = lazy(() => import("./pages/lender/LenderWorkspace"));
const LenderDashboardPage = lazy(() => import("./pages/lender/LenderDashboardPage"));
const LenderParkingsPage = lazy(() => import("./pages/lender/LenderParkingsPage"));
const LenderBookingsPage = lazy(() => import("./pages/lender/LenderBookingsPage"));
const LenderAnalyticsPage = lazy(() => import("./pages/lender/LenderAnalyticsPage"));
const LenderSettingsPage = lazy(() => import("./pages/lender/LenderSettingsPage"));
const AdminWorkspace = lazy(() => import("./pages/admin/AdminWorkspace"));
const AdminDashboardPage = lazy(() => import("./pages/admin/AdminDashboardPage"));
const AdminUsersPage = lazy(() => import("./pages/admin/AdminUsersPage"));
const AdminParkingsPage = lazy(() => import("./pages/admin/AdminParkingsPage"));
const AdminBookingsPage = lazy(() => import("./pages/admin/AdminBookingsPage"));
const AdminAnalyticsPage = lazy(() => import("./pages/admin/AdminAnalyticsPage"));
const AdminAlertsPage = lazy(() => import("./pages/admin/AdminAlertsPage"));

function HomeRedirect() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <Navigate to={getDashboardPath(user.role)} replace />;
}

function AnimatedPage({ children }) {
  const location = useLocation();

  return (
    <Motion.div
      key={location.pathname}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {children}
    </Motion.div>
  );
}

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
      <div className="rounded-[30px] border border-white/10 bg-white/5 px-6 py-5 text-sm text-white/70 backdrop-blur-2xl">
        Loading SmartPark AI workspace...
      </div>
    </div>
  );
}

function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<AnimatedPage><HomeRedirect /></AnimatedPage>} />
        <Route path="/auth" element={<AnimatedPage><LoginPage /></AnimatedPage>} />

        <Route
          path="/user"
          element={
            <ProtectedRoute allowRoles={["user"]}>
              <AnimatedPage>
                <UserWorkspace />
              </AnimatedPage>
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<UserDashboardPage />} />
          <Route path="explore" element={<UserExplorePage />} />
          <Route path="bookings" element={<UserBookingsPage />} />
          <Route path="favorites" element={<UserFavoritesPage />} />
          <Route path="profile" element={<UserProfilePage />} />
        </Route>

        <Route
          path="/lender"
          element={
            <ProtectedRoute allowRoles={["lender"]}>
              <AnimatedPage>
                <LenderWorkspace />
              </AnimatedPage>
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<LenderDashboardPage />} />
          <Route path="parkings" element={<LenderParkingsPage />} />
          <Route path="bookings" element={<LenderBookingsPage />} />
          <Route path="analytics" element={<LenderAnalyticsPage />} />
          <Route path="settings" element={<LenderSettingsPage />} />
        </Route>

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowRoles={["admin"]}>
              <AnimatedPage>
                <AdminWorkspace />
              </AnimatedPage>
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="parkings" element={<AdminParkingsPage />} />
          <Route path="bookings" element={<AdminBookingsPage />} />
          <Route path="analytics" element={<AdminAnalyticsPage />} />
          <Route path="alerts" element={<AdminAlertsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
