import React from 'react';
import PageHeader from '../../components/shared/PageHeader';

const UserManagement = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="Manage system users and their permissions"
      />
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="p-6">
          <p className="text-gray-600">User management interface will be implemented here</p>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;