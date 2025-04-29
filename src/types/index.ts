// User Types
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  TECH = 'tech'
}

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

// Request/Complaint Types
export enum RequestStatus {
  NEW = 'new',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  REJECTED = 'rejected'
}

export enum Department {
  IT = 'it',
  HR = 'hr',
  FINANCE = 'finance',
  OPERATIONS = 'operations',
  CUSTOMER_SERVICE = 'customer_service'
}

export enum Priority {
  VERY_LOW = 1,
  LOW = 2,
  MEDIUM = 3,
  HIGH = 4,
  CRITICAL = 5
}

export interface Request {
  id: number;
  title: string;
  description: string;
  status: RequestStatus;
  priority: Priority;
  department: Department;
  userId: number;
  assignedTo: number | null;
  createdAt: string;
  updatedAt: string;
  user?: User;
  assignee?: User;
  comments?: Comment[];
}

// Comments on Requests
export interface Comment {
  id: number;
  content: string;
  requestId: number;
  userId: number;
  createdAt: string;
  user?: User;
}

// Auth Types
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  initialized: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

// Dashboard Analytics
export interface DashboardStats {
  totalRequests: number;
  openRequests: number;
  resolvedRequests: number;
  avgResponseTime: number;
  requestsByStatus: Record<RequestStatus, number>;
  requestsByDepartment: Record<Department, number>;
  requestsByPriority: Record<Priority, number>;
  recentRequests: Request[];
}