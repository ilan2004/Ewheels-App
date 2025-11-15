// Core Types for EV Wheels Mobile App
// These types mirror the web implementation for consistency

export type UserRole = 'admin' | 'front_desk_manager' | 'floor_manager' | 'technician' | 'manager';

export type ServiceTicketStatus = 
  | 'reported'
  | 'triaged' 
  | 'assigned'
  | 'in_progress'
  | 'completed'
  | 'delivered'
  | 'closed'
  | 'cancelled'
  | 'on_hold'
  | 'waiting_approval';

export type Priority = 1 | 2 | 3; // 1=High, 2=Medium, 3=Low

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  contact?: string | null;
  email?: string | null;
  address?: string | null;
  gst_number?: string | null;
  location_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ServiceTicket {
  id: string;
  ticket_number: string;
  customer_id: string;
  customer?: Customer;
  
  // Problem description
  customer_complaint: string;
  description?: string | null;
  
  // Vehicle information
  vehicle_make?: string | null;
  vehicle_model?: string | null;
  vehicle_reg_no?: string | null;
  vehicle_year?: number | null;
  
  // Status and workflow
  status: ServiceTicketStatus;
  priority?: number | null;
  
  // Dates
  created_at: string;
  updated_at: string;
  closed_at?: string | null;
  due_date?: string | null;
  
  // Triage information
  triaged_at?: string | null;
  triaged_by?: string | null;
  triage_notes?: string | null;
  
  // Metadata
  created_by: string;
  updated_by: string;
  
  // Linked cases
  battery_case_id?: string | null;
  vehicle_case_id?: string | null;
  
  // Location context
  location_id?: string | null;
  location?: {
    id: string;
    name: string;
    code?: string;
  };
}

export interface TicketAttachment {
  id: string;
  ticketId: string;
  fileName: string;
  originalName: string;
  storagePath: string;
  fileSize: number;
  mimeType: string;
  attachmentType: 'photo' | 'audio' | 'document';
  thumbnailPath?: string;
  duration?: number; // for audio files
  uploadedBy: string;
  uploadedAt: string;
  processed: boolean;
}

// Dashboard KPIs
export interface DashboardKPIs {
  openTickets: number;
  inProgressBatteries: number;
  dueToday: number;
  overdue: number;
  weeklyCompleted: number;
  avgTatDays: number;
  unassigned: number;
  slaRisk: number;
}

// Team workload
export interface TechnicianWorkload {
  assignee: string | null;
  count: number;
  capacity: number; // Usually 8
  name?: string;
  email?: string;
}

// Notification types
export interface Notification {
  id: string;
  type: 'assignment' | 'status_change' | 'overdue' | 'new_ticket' | 'priority_change';
  title: string;
  message: string;
  ticketId?: string;
  ticketNumber?: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Form types
export interface CreateTicketForm {
  customer_id: string;
  customer_complaint: string;
  description?: string | null;
  vehicle_make?: string | null;
  vehicle_model?: string | null;
  vehicle_reg_no?: string | null;
  vehicle_year?: number | null;
  priority?: number;
}

export interface UpdateTicketForm {
  customer_complaint?: string;
  description?: string | null;
  priority?: number | null;
  status?: ServiceTicketStatus;
  due_date?: string | null;
  triage_notes?: string | null;
}

export interface AssignTechnicianForm {
  ticketIds: string[];
  technicianId: string;
  priority?: Priority;
  dueDate?: string;
  notes?: string;
}

// Filter and search types
export interface TicketFilters {
  status?: ServiceTicketStatus | 'all';
  priority?: Priority | 'all';
  assignedTo?: string | 'all' | 'unassigned';
  dueDate?: 'overdue' | 'today' | 'tomorrow' | 'this_week';
  customer?: string;
  vehicleReg?: string;
  search?: string;
}

export interface SortOptions {
  field: 'createdAt' | 'updatedAt' | 'dueDate' | 'priority' | 'status';
  direction: 'asc' | 'desc';
}

// Authentication context
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// Store types (Zustand)
export interface AuthStore {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  signOut: () => void;
}

export interface JobCardStore {
  tickets: ServiceTicket[];
  loading: boolean;
  filters: TicketFilters;
  setTickets: (tickets: ServiceTicket[]) => void;
  addTicket: (ticket: ServiceTicket) => void;
  updateTicket: (ticketId: string, updates: Partial<ServiceTicket>) => void;
  removeTicket: (ticketId: string) => void;
  setLoading: (loading: boolean) => void;
  setFilters: (filters: TicketFilters) => void;
}

export interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

// Constants
export const TICKET_STATUS_LABELS: Record<ServiceTicketStatus, string> = {
  reported: 'Reported',
  triaged: 'Triaged',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  completed: 'Completed',
  delivered: 'Delivered',
  closed: 'Closed',
  cancelled: 'Cancelled',
  on_hold: 'On Hold',
  waiting_approval: 'Waiting Approval',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  1: 'High Priority',
  2: 'Medium Priority',
  3: 'Low Priority',
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  1: '#EF4444', // red-500
  2: '#F59E0B', // amber-500
  3: '#6B7280', // gray-500
};

export const STATUS_COLORS: Record<ServiceTicketStatus, string> = {
  reported: '#EF4444',
  triaged: '#F59E0B',
  assigned: '#3B82F6',
  in_progress: '#8B5CF6',
  completed: '#10B981',
  delivered: '#059669',
  closed: '#6B7280',
  cancelled: '#EF4444',
  on_hold: '#F59E0B',
  waiting_approval: '#F59E0B',
};

// Role permissions (matching web implementation)
export const ROLE_PERMISSIONS = {
  admin: [
    'view_all_tickets',
    'create_tickets',
    'edit_tickets',
    'delete_tickets',
    'assign_technicians',
    'manage_users',
    'view_analytics',
  ],
  front_desk_manager: [
    'view_all_tickets',
    'create_tickets',
    'edit_tickets',
    'assign_technicians',
    'view_analytics',
  ],
  manager: [
    'view_all_tickets',
    'create_tickets',
    'edit_tickets',
    'assign_technicians',
    'view_analytics',
  ],
  technician: [
    'view_assigned_tickets',
    'update_ticket_status',
    'add_notes',
  ],
} as const;
