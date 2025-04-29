import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { PlusCircle, Filter, Search } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useRequestStore } from '../../stores/requestStore';
import { RequestStatus } from '../../types';
import PageHeader from '../../components/shared/PageHeader';
import Button from '../../components/shared/Button';
import TextField from '../../components/shared/TextField';
import Select from '../../components/shared/Select';
import StatusBadge from '../../components/shared/StatusBadge';
import PriorityBadge from '../../components/shared/PriorityBadge';
import Spinner from '../../components/shared/Spinner';

const UserRequests = () => {
  const { user } = useAuthStore();
  const { requests, loading, fetchUserRequests } = useRequestStore();
  const [filteredRequests, setFilteredRequests] = useState(requests);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  useEffect(() => {
    if (user) {
      fetchUserRequests(user.id);
    }
  }, [user, fetchUserRequests]);
  
  useEffect(() => {
    let filtered = [...requests];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(req => 
        req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(req => req.status === statusFilter);
    }
    
    setFilteredRequests(filtered);
  }, [requests, searchTerm, statusFilter]);
  
  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'new', label: 'New' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'rejected', label: 'Rejected' }
  ];

  return (
    <div>
      <PageHeader
        title="My Requests"
        subtitle="View and manage your support requests"
        actions={
          <Button
            variant="primary"
            icon={<PlusCircle size={18} />}
            iconPosition="left"
          >
            <Link to="/requests/new">New Request</Link>
          </Button>
        }
      />
      
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-2/3">
            <TextField
              id="search"
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search size={18} />}
            />
          </div>
          <div className="w-full md:w-1/3">
            <Select
              id="statusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={statusOptions}
              icon={<Filter size={18} />}
            />
          </div>
        </div>
      </div>
      
      {/* Request list */}
      <div className="bg-white rounded-lg shadow-sm">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : filteredRequests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.map((request) => (
                  <tr 
                    key={request.id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => window.location.href = `/requests/${request.id}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      #{request.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {request.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={request.status as RequestStatus} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <PriorityBadge priority={request.priority} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(request.createdAt), 'MMM d, yyyy')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center p-6">
            <p className="text-gray-500 mb-4">No requests found</p>
            <Button
              variant="primary"
              icon={<PlusCircle size={18} />}
              as={Link}
              to="/requests/new"
            >
              Create your first request
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserRequests;