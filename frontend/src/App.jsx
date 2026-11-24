import { NavLink, Route, Routes, Navigate } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Check,
  FileText,
  Home,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  UserPlus,
  CheckSquare,
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import HomePage from './pages/HomePage';
import AdminDashboard from './pages/AdminDashboard';
import CreatorDashboard from './pages/CreatorDashboard';
import ReviewerDashboard from './pages/ReviewerDashboard';
import InviteMemberPage from './pages/InviteMemberPage';
import AcceptInvitePage from './pages/AcceptInvitePage';
import KnowledgeBasePage from './pages/KnowledgeBasePage';

const cn = (...inputs) => twMerge(clsx(inputs));

function Header() {
  const { user, currentWorkspace, logout } = useAuth();

  return (
    <header className="flex h-[76px] items-center justify-between border-b border-slate-200 bg-white px-6 lg:px-10">
      <NavLink to="/" className="flex items-center gap-3" aria-label="BrandCheck home">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 text-white">
          <ShieldCheck size={21} />
        </span>
        <span className="text-lg font-semibold tracking-tight text-slate-900">brandcheck</span>
      </NavLink>

      <div className="flex items-center gap-4 text-slate-500">
        {user ? (
          <>
            {currentWorkspace && (
              <span className="hidden rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 sm:inline-block">
                {currentWorkspace.name}
              </span>
            )}
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                (currentWorkspace?.role || user.role) === 'ADMIN'
                  ? 'bg-purple-100 text-purple-700'
                  : (currentWorkspace?.role || user.role) === 'REVIEWER'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {currentWorkspace?.role || user.role}
            </span>
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                {user.name.slice(0, 2).toUpperCase()}
              </span>
              <span className="hidden text-sm font-medium text-slate-800 md:inline-block">
                {user.name}
              </span>
            </div>
            <button
              onClick={logout}
              title="Log out"
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Log out</span>
            </button>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <NavLink
              to="/login"
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Log in
            </NavLink>
            <NavLink
              to="/signup"
              className="rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
            >
              Sign up
            </NavLink>
          </div>
        )}
      </div>
    </header>
  );
}

function Sidebar() {
  const { user, currentWorkspace } = useAuth();
  const effectiveRole = currentWorkspace?.role || user?.role;

  const publicLinks = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/login', label: 'Log in', icon: FileText },
    { to: '/signup', label: 'Sign up', icon: BookOpen },
  ];

  const adminLinks = [
    { to: '/dashboard/admin', label: 'Admin Dashboard', icon: LayoutDashboard },
    { to: '/knowledge-base', label: 'Knowledge Base', icon: BookOpen },
    { to: '/invite', label: 'Invite Member', icon: UserPlus },
  ];

  const creatorLinks = [
    { to: '/dashboard/creator', label: 'Creator Dashboard', icon: FileText },
    { to: '/knowledge-base', label: 'Brand Guidelines', icon: BookOpen },
  ];

  const reviewerLinks = [
    { to: '/dashboard/reviewer', label: 'Reviewer Dashboard', icon: CheckSquare },
    { to: '/knowledge-base', label: 'Brand Guidelines', icon: BookOpen },
  ];

  let authLinks = [{ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }];
  if (effectiveRole === 'ADMIN') {
    authLinks = adminLinks;
  } else if (effectiveRole === 'CREATOR') {
    authLinks = creatorLinks;
  } else if (effectiveRole === 'REVIEWER') {
    authLinks = reviewerLinks;
  }

  const links = user ? authLinks : publicLinks;

  return (
    <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-white p-5 md:block">
      <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
        {user ? currentWorkspace?.name || 'Workspace' : 'Navigation'}
      </p>
      <nav className="space-y-1" aria-label="Main navigation">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
                isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
              )
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm">
          <Check size={17} />
        </div>
        <p className="text-sm font-semibold text-slate-800">Human-led by design</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          AI suggestions support your review. Your team makes the final call.
        </p>
      </div>
    </aside>
  );
}



function DashboardRedirect() {
  const { user, currentWorkspace } = useAuth();
  const effectiveRole = currentWorkspace?.role || user?.role || 'CREATOR';

  if (effectiveRole === 'ADMIN') {
    return <Navigate to="/dashboard/admin" replace />;
  } else if (effectiveRole === 'REVIEWER') {
    return <Navigate to="/dashboard/reviewer" replace />;
  }
  return <Navigate to="/dashboard/creator" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <div className="min-h-screen bg-[#f7f8fa] text-slate-900">
        <Header />
        <div className="flex min-h-[calc(100vh-76px)]">
          <Sidebar />
          <main className="min-w-0 flex-1 px-6 py-10 sm:px-10 lg:px-14">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/invite/accept" element={<AcceptInvitePage />} />
              <Route path="/accept-invite" element={<AcceptInvitePage />} />

              {/* Protected Dashboard Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<DashboardRedirect />} />
                <Route
                  path="/dashboard/admin"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/creator"
                  element={
                    <ProtectedRoute allowedRoles={['CREATOR', 'ADMIN']}>
                      <CreatorDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/reviewer"
                  element={
                    <ProtectedRoute allowedRoles={['REVIEWER', 'ADMIN']}>
                      <ReviewerDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/invite"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <InviteMemberPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="/knowledge-base" element={<KnowledgeBasePage />} />
              </Route>

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </AuthProvider>
  );
}
