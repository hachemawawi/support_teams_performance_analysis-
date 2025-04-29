import { useEffect, useState } from 'react';
import { useRequestStore } from '../../stores/requestStore';
import { useAuthStore } from '../../stores/authStore';
import { Request, RequestStatus, Department } from '../../types';
import { DEPARTMENT_LABELS } from '../../config';
import PageHeader from '../../components/shared/PageHeader';
import Button from '../../components/shared/Button';
import TextField from '../../components/shared/TextField';
import Select from '../../components/shared/Select';
import StatusBadge from '../../components/shared/StatusBadge';
import PriorityBadge from '../../components/shared/PriorityBadge';
import { Search, Filter, MessageSquare } from 'lucide-react';

const AssignedRequests = () => {
  const { user } = useAuthStore();
  const { requests, loading, fetchAssignedRequests, updateRequestStatus, addComment } = useRequestStore();
  const [filteredRequests, setFilteredRequests] = useState<Request[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (user) {
      fetchAssignedRequests(user.id);
    }
  }, [user, fetchAssignedRequests]);

  useEffect(() => {
    let filtered = [...requests];
    
    if (searchTerm) {
      filtered = filtered.filter(req => 
        req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(req => req.status === statusFilter);
    }
    
    setFilteredRequests(filtered);
  }, [requests, searchTerm, statusFilter]);

  const handleStatusChange = async (requestId: number, newStatus: RequestStatus) => {
    try {
      await updateRequestStatus(requestId, newStatus);
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleAddComment = async () => {
    if (!selectedRequest || !comment.trim()) return;
    
    try {
      await addComment(selectedRequest.id, comment);
      setComment('');
      setSelectedRequest(null);
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'new', label: 'New' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'rejected', label: 'Rejected' }
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Assigned Requests" 
        description="Manage and update your assigned support requests"
      />
      
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextField
            id="search"
            placeholder="Search requests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search size={18} />}
          />
          
          <Select
            id="statusFilter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={statusOptions}
            icon={<Filter size={18} />}
          />
        </div>
      </div>
      
      {/* Requests Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
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
                  Department
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRequests.map((request) => (
                <tr key={request.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{request.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {request.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {DEPARTMENT_LABELS[request.department as Department]}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Select
                      value={request.status}
                      onChange={(e) => handleStatusChange(request.id, e.target.value as RequestStatus)}
                      options={statusOptions.filter(opt => opt.value !== 'all')}
                      className="min-w-[140px]"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <PriorityBadge priority={request.priority} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedRequest(request)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <MessageSquare size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Add Comment Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Add Comment to Request #{selectedRequest.id}
            </h3>
            
            <textarea
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Enter your comment..."
            ></textarea>
            
            <div className="mt-4 flex justify-end space-x-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setSelectedRequest(null);
                  setComment('');
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleAddComment}>
                Add Comment
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignedRequests;