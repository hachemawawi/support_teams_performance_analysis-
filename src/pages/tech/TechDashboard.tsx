import React from 'react';
import PageHeader from '../../components/shared/PageHeader';

const TechDashboard = () => {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Tech Dashboard" 
        description="Overview of your assigned requests and tasks"
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">Active Requests</h3>
          <p className="mt-2 text-sm text-gray-600">View and manage your currently assigned requests</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">Completed Tasks</h3>
          <p className="mt-2 text-sm text-gray-600">Review your completed request history</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">Performance Metrics</h3>
          <p className="mt-2 text-sm text-gray-600">Track your response times and completion rates</p>
        </div>
      </div>
    </div>
  );
};

export default TechDashboard;