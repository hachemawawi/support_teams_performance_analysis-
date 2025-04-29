import React from 'react';
import PageHeader from '../../components/shared/PageHeader';
import { Activity, Users, FileText, BarChart3 } from 'lucide-react';

const AdminDashboard = () => {
  const stats = [
    { label: 'Total Users', value: '245', icon: Users, color: 'text-blue-600' },
    { label: 'Active Requests', value: '32', icon: FileText, color: 'text-green-600' },
    { label: 'Monthly Activity', value: '+12%', icon: Activity, color: 'text-purple-600' },
    { label: 'Resolution Rate', value: '94%', icon: BarChart3, color: 'text-orange-600' }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Dashboard"
        description="Overview of system performance and key metrics"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-sm p-6 border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">
                  {stat.value}
                </p>
              </div>
              <div className={`${stat.color} bg-gray-50 p-3 rounded-full`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
          <p className="text-sm text-gray-500 mt-1">System activity from the past 24 hours</p>
          <div className="mt-4 space-y-4">
            {/* Activity items would be populated from actual data */}
            <p className="text-sm text-gray-600">No recent activity to display</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-medium text-gray-900">System Health</h3>
          <p className="text-sm text-gray-500 mt-1">Current system status and metrics</p>
          <div className="mt-4 space-y-4">
            {/* System health metrics would be populated from actual data */}
            <p className="text-sm text-gray-600">All systems operating normally</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;