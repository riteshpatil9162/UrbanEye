import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Public pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Shared
import ProfilePage from './pages/ProfilePage';

// Citizen
import CitizenDashboard from './pages/citizen/CitizenDashboard';
import ReportIssuePage from './pages/citizen/ReportIssuePage';
import MyIssuesPage from './pages/citizen/MyIssuesPage';
import CommunityPage from './pages/citizen/CommunityPage';
import RewardsPage from './pages/citizen/RewardsPage';
import CitizenNotificationsPage from './pages/citizen/NotificationsPage';

// Officer
import OfficerDashboard from './pages/officer/OfficerDashboard';
import OfficerIssuesPage from './pages/officer/OfficerIssuesPage';
import WorkersPage from './pages/officer/WorkersPage';
import VouchersPage from './pages/officer/VouchersPage';
import AnalyticsPage from './pages/officer/AnalyticsPage';
import MapPage from './pages/officer/MapPage';
import OfficerNotificationsPage from './pages/officer/NotificationsPage';

// Worker
import WorkerDashboard from './pages/worker/WorkerDashboard';
import WorkerIssuesPage from './pages/worker/WorkerIssuesPage';
import RoutePlannerPage from './pages/worker/RoutePlannerPage';
import WorkerNotificationsPage from './pages/worker/NotificationsPage';

// ─── Protected Route ────────────────────────────────────────────────────────
function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const defaultRoute = {
      citizen: '/citizen/dashboard',
      officer: '/officer/dashboard',
      worker: '/worker/dashboard',
    }[user.role] || '/';
    return <Navigate to={defaultRoute} replace />;
  }

  return children;
}

// ─── Guest Route (redirect logged-in users) ──────────────────────────────────
function GuestRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    const defaultRoute = {
      citizen: '/citizen/dashboard',
      officer: '/officer/dashboard',
      worker: '/worker/dashboard',
    }[user.role] || '/';
    return <Navigate to={defaultRoute} replace />;
  }

  return children;
}

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <Routes>
      {/* ── Public ── */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
      </Route>

      <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

      {/* ── Citizen ── */}
      <Route
        path="/citizen"
        element={
          <ProtectedRoute allowedRoles={['citizen']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<CitizenDashboard />} />
        <Route path="report" element={<ReportIssuePage />} />
        <Route path="my-issues" element={<MyIssuesPage />} />
        <Route path="community" element={<CommunityPage />} />
        <Route path="rewards" element={<RewardsPage />} />
        <Route path="notifications" element={<CitizenNotificationsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* ── Officer ── */}
      <Route
        path="/officer"
        element={
          <ProtectedRoute allowedRoles={['officer']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<OfficerDashboard />} />
        <Route path="issues" element={<OfficerIssuesPage />} />
        <Route path="workers" element={<WorkersPage />} />
        <Route path="vouchers" element={<VouchersPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="map" element={<MapPage />} />
        <Route path="notifications" element={<OfficerNotificationsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* ── Worker ── */}
      <Route
        path="/worker"
        element={
          <ProtectedRoute allowedRoles={['worker']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<WorkerDashboard />} />
        <Route path="issues" element={<WorkerIssuesPage />} />
        <Route path="route" element={<RoutePlannerPage />} />
        <Route path="notifications" element={<WorkerNotificationsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* ── Fallback ── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
