export const API_URL = 'http://localhost:5000/api';

export const REQUEST_STATUS_COLORS = {
  new: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
  resolved: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200'
};

export const PRIORITY_LABELS = {
  1: 'Very Low',
  2: 'Low',
  3: 'Medium',
  4: 'High',
  5: 'Critical'
};

export const PRIORITY_COLORS = {
  1: 'bg-gray-100 text-gray-800 border-gray-200',
  2: 'bg-blue-100 text-blue-800 border-blue-200',
  3: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  4: 'bg-orange-100 text-orange-800 border-orange-200',
  5: 'bg-red-100 text-red-800 border-red-200'
};

export const DEPARTMENT_LABELS = {
  it: 'IT',
  hr: 'Human Resources',
  finance: 'Finance',
  operations: 'Operations',
  customer_service: 'Customer Service'
};