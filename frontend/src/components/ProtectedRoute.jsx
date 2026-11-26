import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ allowedRoles, children }) {
  const { user, currentWorkspace, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/?login=true" state={{ from: location }} replace />;
  }

  const effectiveRole = currentWorkspace?.role || user.role;

  if (allowedRoles && !allowedRoles.includes(effectiveRole)) {
    // If user does not have required role for this section, redirect to general dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return children ? children : <Outlet />;
}

