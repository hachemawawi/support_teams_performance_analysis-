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
  LOW = 1,        // Non-urgent issues (e.g., billing inquiries, general questions)
  MEDIUM = 2,     // Minor service issues (e.g., slow speed, occasional disconnections)
  HIGH = 3,       // Service affecting issues (e.g., frequent disconnections, poor signal)
  URGENT = 4,     // Critical service issues (e.g., complete service outage)
  EMERGENCY = 5   // Life-threatening situations (e.g., emergency services affected)
}

export enum SentimentScore {
  VERY_NEGATIVE = 1,
  NEGATIVE = 2,
  NEUTRAL = 3,
  POSITIVE = 4,
  VERY_POSITIVE = 5
}

export interface SentimentAnalysis {
  score: SentimentScore;
  confidence: number;
  keywords: string[];
  timestamp: string;
}

export interface Request {
  id: number;
  title: string;
  description: string;
  status: RequestStatus;
  priority: Priority;
  department: Department;
  userId: number;
  assignedTo?: number;
  createdAt: string;
  updatedAt: string;
  user?: {
    firstName: string;
    lastName: string;
  };
  assignee?: {
    firstName: string;
    lastName: string;
  };
  comments?: Comment[];
  serviceType: string;
  accountNumber: string;
  location: string;
  issueType: string;
  overallSentiment?: {
    score: number;
    confidence: number;
    keywords: string[];
    timestamp: string;
  };
}

// Comments on Requests
export interface Comment {
  id: number;
  content: string;
  requestId: number;
  userId: number;
  createdAt: string;
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  sentiment?: {
    score: number;
    confidence: number;
    keywords: string[];
    timestamp: string;
  };
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
  requestsByStatus: Record<string, number>;
  requestsByDepartment: Record<string, number>;
  requestsByPriority: Record<number, number>;
  recentRequests: Request[];
  requests: Request[];
}