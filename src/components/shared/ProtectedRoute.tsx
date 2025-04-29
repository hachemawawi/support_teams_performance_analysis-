import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { UserRole } from '../../types';

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
}

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If authenticated but wrong role, redirect to appropriate dashboard
  if (user && !allowedRoles.includes(user.role as UserRole)) {
    switch (user.role) {
      case UserRole.ADMIN:
        return <Navigate to="/admin" replace />;
      case UserRole.TECH:
        return <Navigate to="/tech" replace />;
      default:
        return <Navigate to="/dashboard" replace />;
    }
  }

  // If authenticated and correct role, render the protected route
  return <Outlet />;
};

export default ProtectedRoute;