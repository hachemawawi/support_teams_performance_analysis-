import { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Users, 
  Home, 
  LogOut, 
  Menu, 
  X, 
  User, 
  FileText, 
  PlusCircle, 
  Settings, 
  BarChart4
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { UserRole } from '../types';

const DashboardLayout = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const userNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'My Requests', href: '/requests', icon: FileText },
    { name: 'New Request', href: '/requests/new', icon: PlusCircle },
    { name: 'Profile', href: '/profile', icon: User },
  ];

  const adminNavigation = [
    { name: 'Dashboard', href: '/admin', icon: Home },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Requests', href: '/admin/requests', icon: FileText },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart4 },
    { name: 'Profile', href: '/profile', icon: User },
  ];

  const techNavigation = [
    { name: 'Dashboard', href: '/tech', icon: Home },
    { name: 'Assigned Requests', href: '/tech/requests', icon: FileText },
    { name: 'Profile', href: '/profile', icon: User },
  ];

  const getNavigation = () => {
    switch (user?.role) {
      case UserRole.ADMIN:
        return adminNavigation;
      case UserRole.TECH:
        return techNavigation;
      default:
        return userNavigation;
    }
  };

  const navigation = getNavigation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)}></div>
        
        <div className="fixed inset-y-0 left-0 w-64 flex flex-col bg-white shadow-lg">
          <div className="h-16 px-4 flex items-center justify-between border-b border-gray-200">
            <div className="flex items-center">
              <Users size={24} className="text-blue-600" />
              <span className="ml-2 text-gray-900 text-lg font-semibold">SupportTrack</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="text-gray-500 hover:text-gray-700">
              <X size={24} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            <nav className="space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`
                      flex items-center px-3 py-2 text-sm font-medium rounded-md
                      ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}
                    `}
                  >
                    <item.icon size={20} className={isActive ? 'text-blue-700' : 'text-gray-500'} />
                    <span className="ml-3">{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
          
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
            >
              <LogOut size={20} className="text-gray-500" />
              <span className="ml-3">Log out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-gray-200 lg:bg-white">
        <div className="h-16 px-4 flex items-center border-b border-gray-200">
          <Users size={24} className="text-blue-600" />
          <span className="ml-2 text-gray-900 text-lg font-semibold">SupportTrack</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <nav className="space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    flex items-center px-3 py-2 text-sm font-medium rounded-md
                    ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}
                  `}
                >
                  <item.icon size={20} className={isActive ? 'text-blue-700' : 'text-gray-500'} />
                  <span className="ml-3">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
        
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
          >
            <LogOut size={20} className="text-gray-500" />
            <span className="ml-3">Log out</span>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
          <div className="h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <div className="flex items-center lg:hidden">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 -ml-3 text-gray-500 hover:text-gray-700"
              >
                <Menu size={24} />
              </button>
            </div>
            
            <div className="flex items-center">
              <div className="relative">
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                    {user?.firstName?.charAt(0) || 'U'}{user?.lastName?.charAt(0) || ''}
                  </div>
                  <span className="ml-2 text-sm font-medium text-gray-700 hidden sm:block">
                    {user?.firstName} {user?.lastName}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;