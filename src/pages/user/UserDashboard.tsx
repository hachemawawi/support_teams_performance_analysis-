import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useDashboardStore } from '../../stores/dashboardStore';
import { PlusCircle, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import Button from '../../components/shared/Button';
import Spinner from '../../components/shared/Spinner';
import StatusBadge from '../../components/shared/StatusBadge';
import PriorityBadge from '../../components/shared/PriorityBadge';
import { formatDistanceToNow } from 'date-fns';

const UserDashboard = () => {
  const { user } = useAuthStore();
  const { stats, loading, fetchUserDashboardStats } = useDashboardStore();
  
  useEffect(() => {
    if (user) {
      fetchUserDashboardStats(user.id);
    }
  }, [user, fetchUserDashboardStats]);

  if (loading || !stats) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={`Welcome, ${user?.firstName}!`}
        subtitle="Track your support requests and their progress"
        actions={
          <Button
            variant="primary"
            icon={<PlusCircle size={18} />}
            iconPosition="left"
            as={Link}
            to="/requests/new"
          >
            New Request
          </Button>
        }
      />
      
      {/* Stats overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6 flex items-start">
          <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
            <Clock size={24} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">{stats.openRequests}</h3>
            <p className="text-sm text-gray-500">Open Requests</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 flex items-start">
          <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
            <CheckCircle size={24} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">{stats.resolvedRequests}</h3>
            <p className="text-sm text-gray-500">Resolved Requests</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 flex items-start">
          <div className="p-3 rounded-full bg-yellow-100 text-yellow-600 mr-4">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              {stats.avgResponseTime.toFixed(1)} hours
            </h3>
            <p className="text-sm text-gray-500">Average Response Time</p>
          </div>
        </div>
      </div>
      
      {/* Recent requests */}
      <div className="bg-white rounded-lg shadow-sm mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Recent Requests</h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {stats.recentRequests.length > 0 ? (
            stats.recentRequests.map((request) => (
              <Link
                key={request.id}
                to={`/requests/${request.id}`}
                className="block px-6 py-4 hover:bg-gray-50 transition duration-150"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{request.title}</h3>
                    <p className="mt-1 text-xs text-gray-500">
                      Submitted {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <StatusBadge status={request.status} />
                    <PriorityBadge priority={request.priority} />
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="px-6 py-8 text-center">
              <p className="text-gray-500">No requests yet</p>
              <Button
                variant="primary"
                icon={<PlusCircle size={18} />}
                className="mt-4"
                as={Link}
                to="/requests/new"
              >
                Create your first request
              </Button>
            </div>
          )}
        </div>
        
        {stats.recentRequests.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <Link
              to="/requests"
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              View all requests
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;