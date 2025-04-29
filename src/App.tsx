import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';

// Layouts
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// User Pages
import UserDashboard from './pages/user/UserDashboard';
import NewRequest from './pages/user/NewRequest';
import UserRequests from './pages/user/UserRequests';
import RequestDetails from './pages/user/RequestDetails';
import UserProfile from './pages/user/UserProfile';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import RequestManagement from './pages/admin/RequestManagement';
import Analytics from './pages/admin/Analytics';

// Tech Team Pages
import TechDashboard from './pages/tech/TechDashboard';
import AssignedRequests from './pages/tech/AssignedRequests';

// Shared Components
import ProtectedRoute from './components/shared/ProtectedRoute';

function App() {
  const { initialized, checkAuth } = useAuthStore();
  
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* User Routes */}
      <Route element={<ProtectedRoute allowedRoles={['user']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/requests/new" element={<NewRequest />} />
          <Route path="/requests" element={<UserRequests />} />
          <Route path="/requests/:id" element={<RequestDetails />} />
          <Route path="/profile" element={<UserProfile />} />
        </Route>
      </Route>

      {/* Admin Routes */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/requests" element={<RequestManagement />} />
          <Route path="/admin/analytics" element={<Analytics />} />
        </Route>
      </Route>

      {/* Tech Team Routes */}
      <Route element={<ProtectedRoute allowedRoles={['tech']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/tech" element={<TechDashboard />} />
          <Route path="/tech/requests" element={<AssignedRequests />} />
        </Route>
      </Route>

      {/* Redirect root to login or dashboard based on auth status */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;