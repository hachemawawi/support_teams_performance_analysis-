import { useEffect, useState } from 'react';
import { useRequestStore } from '../../stores/requestStore';
import { useUserStore } from '../../stores/userStore';
import { Request, RequestStatus, Priority, Department, User } from '../../types';
import { DEPARTMENT_LABELS, PRIORITY_LABELS } from '../../config';
import PageHeader from '../../components/shared/PageHeader';
import Button from '../../components/shared/Button';
import TextField from '../../components/shared/TextField';
import Select from '../../components/shared/Select';
import StatusBadge from '../../components/shared/StatusBadge';
import PriorityBadge from '../../components/shared/PriorityBadge';
import { Search, Filter, Edit2, Trash2 } from 'lucide-react';

const RequestManagement = () => {
  const { requests, loading, fetchRequests, updateRequest, updateRequestStatus } = useRequestStore();
  const { users, fetchUsers } = useUserStore();
  const [filteredRequests, setFilteredRequests] = useState<Request[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [editingRequest, setEditingRequest] = useState<Request | null>(null);

  useEffect(() => {
    fetchRequests();
    fetchUsers();
  }, [fetchRequests, fetchUsers]);

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
    
    if (departmentFilter !== 'all') {
      filtered = filtered.filter(req => req.department === departmentFilter);
    }
    
    setFilteredRequests(filtered);
  }, [requests, searchTerm, statusFilter, departmentFilter]);

  const handleStatusChange = async (requestId: number, newStatus: RequestStatus) => {
    try {
      await updateRequestStatus(requestId, newStatus);
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleAssignRequest = async (requestId: number, techId: number) => {
    try {
      await updateRequest(requestId, { assignedTo: techId });
    } catch (error) {
      console.error('Failed to assign request:', error);
    }
  };

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'new', label: 'New' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'rejected', label: 'Rejected' }
  ];

  const departmentOptions = [
    { value: 'all', label: 'All Departments' },
    ...Object.entries(DEPARTMENT_LABELS).map(([value, label]) => ({
      value,
      label
    }))
  ];

  const techUsers = users.filter(user => user.role === 'tech');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Request Management"
        description="Manage and oversee all system requests"
      />
      
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          
          <Select
            id="departmentFilter"
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            options={departmentOptions}
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
                  Assigned To
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
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Select
                      value={request.assignedTo?.toString() || ''}
                      onChange={(e) => handleAssignRequest(request.id, parseInt(e.target.value))}
                      options={[
                        { value: '', label: 'Unassigned' },
                        ...techUsers.map(user => ({
                          value: user.id.toString(),
                          label: `${user.firstName} ${user.lastName}`
                        }))
                      ]}
                      className="min-w-[160px]"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingRequest(request)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RequestManagement;