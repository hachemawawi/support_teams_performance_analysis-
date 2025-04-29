import { Outlet, Link } from 'react-router-dom';
import { Users } from 'lucide-react';

const AuthLayout = () => {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding and info */}
      <div className="hidden lg:flex lg:w-1/2 bg-blue-700 p-12 flex-col justify-between">
        <div>
          <div className="flex items-center">
            <Users size={32} className="text-white" />
            <span className="ml-2 text-white text-xl font-bold">SupportTrack</span>
          </div>
          <div className="mt-16">
            <h1 className="text-4xl font-bold text-white">Modern support request tracking</h1>
            <p className="mt-4 text-blue-100 text-lg">
              Submit and track support requests, manage user accounts, and get real-time updates on your technical issues.
            </p>
          </div>
        </div>
        
        <div className="text-blue-200 text-sm">
          © 2025 SupportTrack. All rights reserved.
        </div>
      </div>
      
      {/* Right side - Auth forms */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <div className="flex items-center justify-center">
              <Users size={32} className="text-blue-600" />
              <span className="ml-2 text-gray-900 text-xl font-bold">SupportTrack</span>
            </div>
          </div>
          
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;