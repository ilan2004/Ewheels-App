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
  expoPushToken?: string;
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

export type CustomerBringingType = 'vehicle' | 'battery' | 'both';

export interface ServiceTicket {
  id: string;
  ticket_number: string;
  customer_id: string;
  customer?: Customer;

  // Problem description
  customer_complaint: string[];
  completed_complaints?: string[];
  description?: string | null;

  // What customer is bringing for service
  customer_bringing?: CustomerBringingType | null;

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

  // Linked records (INTAKE LAYER)
  vehicle_record_id?: string | null;  // Links to vehicle_records

  // Linked cases (SERVICE LAYER) 
  vehicle_case_id?: string | null;    // Links to vehicle_cases
  battery_case_id?: string | null;    // Links to battery_cases

  // Assignment
  assigned_to?: string | null;
  assigned_by?: string | null;
  assigned_at?: string | null;

  // Legacy/Alias fields (for compatibility)
  symptom?: string;
  ticketNumber?: string;
  vehicleRegNo?: string | null;
  assignedTo?: string | null;
  assignedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  dueDate?: string | null;

  // Note: battery_records[] are fetched via service_ticket_id
  // Note: battery_cases[] are fetched via service_ticket_id

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
  customer_complaint: string[];
  description?: string | null;
  vehicle_make?: string | null;
  vehicle_model?: string | null;
  vehicle_reg_no?: string | null;
  vehicle_year?: number | null;
  priority?: number;
}

export interface UpdateTicketForm {
  customer_complaint?: string[];
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
  excludeClosed?: boolean;
  statusGroup?: 'active'; // assigned + in_progress
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

// Vehicle and Battery Case Types
export type CaseStatus = 'received' | 'triaged' | 'diagnosed' | 'in_progress' | 'completed' | 'delivered';

// INTAKE LAYER - What customer brings
export interface VehicleRecord {
  id: string;
  service_ticket_id: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_reg_no: string;
  vehicle_year?: number | null;
  vin_number?: string | null;
  vehicle_type?: string | null;
  customer_id?: string | null;
  condition_notes?: string | null;  // Notes during intake
  status: 'received' | 'processed';
  received_date?: string | null;
  delivered_date?: string | null;
  location_id?: string | null;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  updated_by?: string | null;
}

// SERVICE LAYER - Detailed service tracking
export interface VehicleCase {
  id: string;
  service_ticket_id: string;
  vehicle_record_id?: string | null;  // Links to intake record
  vehicle_make: string;
  vehicle_model: string;
  vehicle_reg_no: string;
  vehicle_year?: number | null;
  initial_diagnosis?: string | null;   // Notes during diagnosis
  diagnostic_notes?: string | null;    // Detailed diagnostic notes
  repair_notes?: string | null;       // Notes during repair
  technician_notes?: string | null;   // General technician notes
  assigned_technician?: string | null;
  estimated_cost?: number | null;
  parts_required?: string[] | null;
  status: CaseStatus;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  updated_by?: string | null;
  // Linked service ticket info (populated via join)
  service_ticket?: {
    id: string;
    assigned_to: string | null;
    ticket_number: string;
    customer_complaint: string;
  };
  // Linked intake record (populated via join)
  vehicle_record?: VehicleRecord;
}

// INTAKE LAYER - What customer brings
export interface BatteryRecord {
  id: string;
  service_ticket_id: string;
  serial_number: string;
  brand: string;
  model?: string | null;
  battery_type: 'li-ion' | 'lfp' | 'nmc' | 'other';
  voltage: number;
  capacity: number;
  cell_type?: string | null; // 18650, etc.
  customer_id?: string | null;
  repair_notes?: string | null; // Notes during intake
  status: 'received' | 'processed';
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  updated_by?: string | null;
}

// SERVICE LAYER - Detailed service tracking
export interface BatteryCase {
  id: string;
  service_ticket_id: string;
  battery_record_id: string;           // Links to intake record
  battery_make?: string;
  battery_model?: string;
  serial_number?: string;
  battery_serial?: string;
  battery_type?: 'li-ion' | 'lfp' | 'nmc' | 'other';
  voltage?: number;
  capacity?: number;
  initial_diagnosis?: string | null;   // Notes during diagnosis
  diagnostic_notes?: string | null;    // Detailed diagnostic notes
  repair_notes?: string | null;       // Notes during repair
  technician_notes?: string | null;   // General technician notes
  repair_type?: string | null;
  cells_replaced?: number | null;
  assigned_technician?: string | null;
  estimated_cost?: number | null;
  status: CaseStatus;
  // Diagnostic fields (for technician workflow)
  initial_voltage?: number | null;
  final_voltage?: number | null;
  load_test_result?: number | null;
  ir_values?: number[] | null;
  cell_voltages?: number[] | null;
  bms_status?: 'ok' | 'faulty' | 'replaced' | 'unknown' | null;
  final_cost?: number | null;
  received_at?: string | null;
  diagnosed_at?: string | null;
  completed_at?: string | null;
  delivered_at?: string | null;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  updated_by?: string | null;
  // Linked service ticket info (populated via join)
  service_ticket?: {
    id: string;
    assigned_to: string | null;
    ticket_number: string;
    customer_complaint: string;
  };
  // Linked intake record (populated via join)
  battery_record?: BatteryRecord;
}

// PROGRESS UPDATES - Multiple updates within same status
export interface VehicleProgressUpdate {
  id: string;
  vehicle_case_id: string;
  update_type: 'diagnostic' | 'repair' | 'parts' | 'general';
  notes: string;
  created_by: string;
  created_at: string;
}

export interface BatteryProgressUpdate {
  id: string;
  battery_case_id: string;
  update_type: 'diagnostic' | 'repair' | 'parts' | 'general';
  notes: string;
  created_by: string;
  created_at: string;
}

// STATUS HISTORY - Notes with each status change
export interface VehicleStatusHistory {
  id: string;
  vehicle_case_id: string;
  previous_status?: CaseStatus | null;
  new_status: CaseStatus;
  notes?: string | null;  // Notes added during status change
  changed_by: string;
  changed_at: string;
}

export interface BatteryStatusHistory {
  id: string;
  battery_case_id: string;
  previous_status?: CaseStatus | null;
  new_status: CaseStatus;
  notes?: string | null;  // Notes added during status change
  changed_by: string;
  changed_at: string;
}

export interface ServiceTicketHistory {
  id: string;
  ticket_id: string;
  action: string;
  notes?: string | null;  // Notes added with each action
  changed_by: string;
  changed_at: string;
}

// Case filter types
export interface CaseFilters {
  status?: CaseStatus | 'all';
  assignedTo?: string | 'all' | 'unassigned';
  search?: string;
}

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
