import { createContext, useContext, useState } from 'react';
import { NavLink, Route, Routes, Navigate, useSearchParams, Outlet } from 'react-router-dom';
import {
  BookOpen,
  Check,
  FileText,
  Home,
  LayoutDashboard,
  LogOut,
  UserPlus,
  CheckSquare,
  TrendingUp,
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginDrawer from './components/LoginDrawer';
import SignupPage from './pages/SignupPage';
import HomePage from './pages/HomePage';
import AdminDashboard from './pages/AdminDashboard';
import CreatorDashboard from './pages/CreatorDashboard';
import ReviewerDashboard from './pages/ReviewerDashboard';
import InviteMemberPage from './pages/InviteMemberPage';
import AcceptInvitePage from './pages/AcceptInvitePage';
import KnowledgeBasePage from './pages/KnowledgeBasePage';
import DraftsListPage from './pages/DraftsListPage';
import DraftEditorPage from './pages/DraftEditorPage';
import AnalyticsPage from './pages/AnalyticsPage';

const cn = (...inputs) => twMerge(clsx(inputs));

export const LoginDrawerContext = createContext({
  openLoginDrawer: () => {},
  closeLoginDrawer: () => {},
});

export const useLoginDrawer = () => useContext(LoginDrawerContext);

function Header() {
  const { user, currentWorkspace, logout } = useAuth();
  const { openLoginDrawer } = useLoginDrawer();

  return (
    <header className="flex h-[74px] items-center justify-between border-b border-dashed border-[#3b82f6]/50 bg-[#f7f8f3] px-6 lg:px-12">
      <NavLink to="/" className="flex items-center gap-2.5 group" aria-label="BrandCheck home">
        <span className="text-xl font-extrabold tracking-tight text-[#151c15]">
          BrandCheck
        </span>
        <span className="hidden sm:inline-block rounded-full border border-[#d8e6db] bg-[#eef5ee] px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-[#1c3822]">
          Polished before Published
        </span>
      </NavLink>

      <div className="flex items-center gap-6 text-[#151c15]">
        {user ? (
          <>
            <NavLink
              to="/dashboard"
              className="hidden items-center gap-1.5 rounded-xl border border-[#0f140f] bg-[#0f140f] px-3.5 py-1.5 text-xs font-bold text-[#d4ff32] shadow-xs transition hover:bg-[#212a22] md:inline-flex"
            >
              <LayoutDashboard size={14} />
              <span>Dashboard</span>
            </NavLink>
            {currentWorkspace && (
              <span className="hidden rounded-lg border border-[#d8e6db] bg-[#eef5ee] px-3 py-1 text-xs font-semibold text-[#1c3822] sm:inline-block">
                {currentWorkspace.name}
              </span>
            )}
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                (currentWorkspace?.role || user.role) === 'ADMIN'
                  ? 'border border-[#d4ff32]/40 bg-[#0f140f] text-[#d4ff32]'
                  : (currentWorkspace?.role || user.role) === 'REVIEWER'
                  ? 'border border-[#f07153]/30 bg-[#fef2ee] text-[#c2410c]'
                  : 'border border-[#d8e6db] bg-[#eef5ee] text-[#1c3822]'
              }`}
            >
              {currentWorkspace?.role || user.role}
            </span>
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[#0f140f] text-sm font-bold text-[#d4ff32]">
                {user.name.slice(0, 2).toUpperCase()}
              </span>
              <span className="hidden text-sm font-semibold text-[#0f140f] md:inline-block">
                {user.name}
              </span>
            </div>
            <button
              onClick={logout}
              title="Log out"
              className="flex items-center gap-1.5 rounded-xl border border-[#e4e8dc] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#0f140f] transition hover:bg-[#eef5ee]"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Log out</span>
            </button>
          </>
        ) : (
          <div className="flex items-center gap-6">
            <nav className="hidden items-center gap-6 text-sm font-medium text-[#151c15] md:flex">
              <a href="#demo-studio" className="transition hover:text-black">
                Explore demo
              </a>
              <a href="#workflow" className="transition hover:text-black">
                Workflow
              </a>
              <a href="#approach" className="transition hover:text-black">
                Our approach
              </a>
            </nav>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={openLoginDrawer}
                className="rounded-full px-4 py-2 text-sm font-semibold text-[#151c15] transition hover:bg-[#eef5ee]"
              >
                Log in
              </button>
              <NavLink
                to="/signup"
                className="rounded-full bg-[#d8f45a] px-5 py-2 text-sm font-bold text-[#151c15] shadow-xs transition hover:bg-[#c9e846] active:scale-[0.98]"
              >
                Sign up
              </NavLink>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

function Sidebar() {
  const { user, currentWorkspace } = useAuth();
  const { openLoginDrawer } = useLoginDrawer();
  const effectiveRole = currentWorkspace?.role || user?.role;

  const publicLinks = [
    { to: '/', label: 'Home', icon: Home },
    { onClick: openLoginDrawer, label: 'Log in', icon: FileText },
    { to: '/signup', label: 'Sign up', icon: BookOpen },
  ];

  const adminLinks = [
    { to: '/dashboard/admin', label: 'Admin Dashboard', icon: LayoutDashboard },
    { to: '/drafts', label: 'Drafts & Studio', icon: FileText },
    { to: '/analytics', label: 'Insights & Analytics', icon: TrendingUp },
    { to: '/knowledge-base', label: 'Knowledge Base', icon: BookOpen },
    { to: '/invite', label: 'Invite Member', icon: UserPlus },
  ];

  const creatorLinks = [
    { to: '/dashboard/creator', label: 'Creator Dashboard', icon: LayoutDashboard },
    { to: '/drafts', label: 'My Drafts', icon: FileText },
    { to: '/analytics', label: 'Insights & Analytics', icon: TrendingUp },
    { to: '/knowledge-base', label: 'Brand Guidelines', icon: BookOpen },
  ];

  const reviewerLinks = [
    { to: '/dashboard/reviewer', label: 'Reviewer Dashboard', icon: CheckSquare },
    { to: '/drafts', label: 'Review Queue', icon: FileText },
    { to: '/analytics', label: 'Insights & Analytics', icon: TrendingUp },
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
    <aside className="hidden w-64 shrink-0 border-r border-[#e4e8dc] bg-[#fbfcf8] p-5 md:block">
      <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
        {user ? currentWorkspace?.name || 'Workspace' : 'Navigation'}
      </p>
      <nav className="space-y-1.5" aria-label="Main navigation">
        {links.map((link) => {
          const Icon = link.icon;
          if (link.onClick) {
            return (
              <button
                key={link.label}
                type="button"
                onClick={link.onClick}
                className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-600 transition duration-150 hover:bg-[#eef5ee] hover:text-[#0f140f]"
              >
                <Icon size={18} />
                {link.label}
              </button>
            );
          }
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition duration-150',
                  isActive
                    ? 'bg-[#0f140f] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-[#eef5ee] hover:text-[#0f140f]'
                )
              }
            >
              <Icon size={18} />
              {link.label}
            </NavLink>
          );
        })}
      </nav>
      <div className="mt-8 rounded-2xl border border-[#212a22] bg-[#0f140f] p-4 text-white shadow-md">
        <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-[#d4ff32] text-[#0f140f] shadow-xs">
          <Check size={18} strokeWidth={2.5} />
        </div>
        <p className="text-sm font-bold text-white">Polished before Published</p>
        <p className="mt-1 text-xs leading-5 text-slate-300">
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

function AppContent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isLoginOpen = drawerOpen || searchParams.get('login') === 'true';

  const openLoginDrawer = () => {
    setDrawerOpen(true);
  };

  const closeLoginDrawer = () => {
    setDrawerOpen(false);
    if (searchParams.get('login')) {
      searchParams.delete('login');
      setSearchParams(searchParams, { replace: true });
    }
  };

  return (
    <LoginDrawerContext.Provider value={{ openLoginDrawer, closeLoginDrawer }}>
      <div className="min-h-screen bg-[#f7f8f3] text-[#0f140f]">
        <Header />
        <div className="flex min-h-[calc(100vh-76px)]">
          <Sidebar />
          <main className="min-w-0 flex-1 px-4 pt-1.5 pb-8 sm:px-8 sm:pt-2 sm:pb-12 lg:px-12">
            <Routes>
              {/* Public Routes - /login now redirects to /?login=true */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<Navigate to="/?login=true" replace />} />
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
                <Route path="/drafts" element={<DraftsListPage />} />
                <Route path="/drafts/new" element={<DraftEditorPage />} />
                <Route path="/drafts/:id" element={<DraftEditorPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
              </Route>

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>

        {/* Global Slide-Over Login Drawer (Toggles from the Right) */}
        <LoginDrawer isOpen={isLoginOpen} onClose={closeLoginDrawer} />
      </div>
    </LoginDrawerContext.Provider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <AppContent />
    </AuthProvider>
  );
}
