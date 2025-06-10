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
import { Search, Filter, Edit2, Trash2, Download, MoreVertical, CheckSquare, AlertCircle, Clock, MessageSquare } from 'lucide-react';
import { api } from '../../services/api';

const RequestManagement = () => {
  const { requests, loading, fetchRequests, updateRequest, updateRequestStatus } = useRequestStore();
  const { users, fetchUsers } = useUserStore();
  const [filteredRequests, setFilteredRequests] = useState<Request[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [editingRequest, setEditingRequest] = useState<Request | null>(null);
  const [selectedRequests, setSelectedRequests] = useState<number[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<Request | null>(null);

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

  const handleBulkStatusChange = async (newStatus: RequestStatus) => {
    try {
      await Promise.all(selectedRequests.map(id => updateRequestStatus(id, newStatus)));
      setSelectedRequests([]);
      setShowBulkActions(false);
    } catch (error) {
      console.error('Failed to update statuses:', error);
    }
  };

  const handleBulkAssign = async (techId: number) => {
    try {
      await Promise.all(selectedRequests.map(id => updateRequest(id, { assignedTo: techId })));
      setSelectedRequests([]);
      setShowBulkActions(false);
    } catch (error) {
      console.error('Failed to assign requests:', error);
    }
  };

  const handleDeleteRequest = async (request: Request) => {
    setRequestToDelete(request);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (requestToDelete) {
      try {
        await api.requests.delete(requestToDelete.id);
        setIsDeleteModalOpen(false);
        setRequestToDelete(null);
      } catch (error) {
        console.error('Failed to delete request:', error);
      }
    }
  };

  const exportRequests = () => {
    const data = filteredRequests.map(request => ({
      ID: request.id,
      Title: request.title,
      Department: DEPARTMENT_LABELS[request.department as Department],
      Status: request.status,
      Priority: PRIORITY_LABELS[request.priority],
      AssignedTo: request.assignedTo ? users.find(u => u.id === request.assignedTo)?.firstName + ' ' + users.find(u => u.id === request.assignedTo)?.lastName : 'Unassigned',
      CreatedAt: new Date(request.createdAt).toLocaleString(),
      UpdatedAt: new Date(request.updatedAt).toLocaleString()
    }));

    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `requests-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
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
        subtitle="Manage and oversee all system requests"
      />
      
      {/* Filters and Actions */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          />
          
          <Select
            id="departmentFilter"
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            options={departmentOptions}
          />

          <div className="flex space-x-2">
            <Button
              variant="secondary"
              onClick={exportRequests}
              icon={<Download size={18} />}
            >
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {showBulkActions && (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">
                {selectedRequests.length} requests selected
              </span>
              <div className="flex space-x-2">
                <Select
                  value=""
                  onChange={(e) => handleBulkStatusChange(e.target.value as RequestStatus)}
                  options={[
                    { value: '', label: 'Change Status' },
                    ...statusOptions.filter(opt => opt.value !== 'all')
                  ]}
                />
                <Select
                  value=""
                  onChange={(e) => handleBulkAssign(parseInt(e.target.value))}
                  options={[
                    { value: '', label: 'Assign To' },
                    ...techUsers.map(user => ({
                      value: user.id.toString(),
                      label: `${user.firstName} ${user.lastName}`
                    }))
                  ]}
                />
              </div>
            </div>
            <Button
              variant="secondary"
              onClick={() => {
                setSelectedRequests([]);
                setShowBulkActions(false);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
      
      {/* Requests Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={selectedRequests.length === filteredRequests.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRequests(filteredRequests.map(r => r.id));
                        setShowBulkActions(true);
                      } else {
                        setSelectedRequests([]);
                        setShowBulkActions(false);
                      }
                    }}
                  />
                </th>
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
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={selectedRequests.includes(request.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRequests([...selectedRequests, request.id]);
                          setShowBulkActions(true);
                        } else {
                          setSelectedRequests(selectedRequests.filter(id => id !== request.id));
                          if (selectedRequests.length === 1) {
                            setShowBulkActions(false);
                          }
                        }
                      }}
                    />
                  </td>
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
                        title="Edit"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteRequest(request)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && requestToDelete && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Request</h3>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to delete request #{requestToDelete.id}? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestManagement;