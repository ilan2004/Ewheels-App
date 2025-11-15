import { UserRole } from '@/types';

// Define all permissions available in the mobile app
export enum Permission {
  // Ticket Management
  VIEW_ALL_TICKETS = 'view_all_tickets',
  VIEW_ASSIGNED_TICKETS = 'view_assigned_tickets',
  CREATE_TICKETS = 'create_tickets',
  EDIT_TICKETS = 'edit_tickets',
  DELETE_TICKETS = 'delete_tickets',
  ASSIGN_TECHNICIANS = 'assign_technicians',
  REASSIGN_TICKETS = 'reassign_tickets',
  UPDATE_TICKET_STATUS = 'update_ticket_status',
  ADD_NOTES = 'add_notes',
  VIEW_TECHNICIAN_WORKLOAD = 'view_technician_workload',
  MANAGE_ASSIGNMENTS = 'manage_assignments',

  // Battery Management
  VIEW_BATTERIES = 'view_batteries',
  CREATE_BATTERY_RECORD = 'create_battery_record',
  UPDATE_BATTERY_STATUS = 'update_battery_status',
  DELETE_BATTERY_RECORD = 'delete_battery_record',

  // Customer Management
  VIEW_CUSTOMERS = 'view_customers',
  CREATE_CUSTOMER = 'create_customer',
  UPDATE_CUSTOMER = 'update_customer',
  DELETE_CUSTOMER = 'delete_customer',

  // Analytics & Reports
  VIEW_ANALYTICS = 'view_analytics',
  VIEW_FINANCIAL_REPORTS = 'view_financial_reports',
  EXPORT_DATA = 'export_data',

  // User Management
  VIEW_USERS = 'view_users',
  CREATE_USER = 'create_user',
  UPDATE_USER_ROLES = 'update_user_roles',
  DELETE_USER = 'delete_user',
  MANAGE_USERS = 'manage_users',

  // System
  MANAGE_SETTINGS = 'manage_settings',
  VIEW_SYSTEM_LOGS = 'view_system_logs',

  // Location Management
  VIEW_ALL_LOCATIONS = 'view_all_locations',
  MANAGE_LOCATIONS = 'manage_locations',

  // Attachments
  UPLOAD_ATTACHMENTS = 'upload_attachments',
  DELETE_ATTACHMENTS = 'delete_attachments',
}

// Mobile app specific role permissions (mirrors web app but adapted for mobile context)
export const MOBILE_ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    // Full access to everything
    Permission.VIEW_ALL_TICKETS,
    Permission.CREATE_TICKETS,
    Permission.EDIT_TICKETS,
    Permission.DELETE_TICKETS,
    Permission.ASSIGN_TECHNICIANS,
    Permission.UPDATE_TICKET_STATUS,
    Permission.ADD_NOTES,
    Permission.VIEW_BATTERIES,
    Permission.CREATE_BATTERY_RECORD,
    Permission.UPDATE_BATTERY_STATUS,
    Permission.DELETE_BATTERY_RECORD,
    Permission.VIEW_CUSTOMERS,
    Permission.CREATE_CUSTOMER,
    Permission.UPDATE_CUSTOMER,
    Permission.DELETE_CUSTOMER,
    Permission.VIEW_ANALYTICS,
    Permission.VIEW_FINANCIAL_REPORTS,
    Permission.EXPORT_DATA,
    Permission.VIEW_USERS,
    Permission.CREATE_USER,
    Permission.UPDATE_USER_ROLES,
    Permission.DELETE_USER,
    Permission.MANAGE_USERS,
    Permission.MANAGE_SETTINGS,
    Permission.VIEW_SYSTEM_LOGS,
    Permission.VIEW_ALL_LOCATIONS,
    Permission.MANAGE_LOCATIONS,
    Permission.UPLOAD_ATTACHMENTS,
    Permission.DELETE_ATTACHMENTS,
  ],
  front_desk_manager: [
    // Front desk operations
    Permission.VIEW_ALL_TICKETS,
    Permission.CREATE_TICKETS,
    Permission.EDIT_TICKETS,
    Permission.ASSIGN_TECHNICIANS,
    Permission.UPDATE_TICKET_STATUS,
    Permission.ADD_NOTES,
    Permission.VIEW_BATTERIES,
    Permission.CREATE_BATTERY_RECORD,
    Permission.UPDATE_BATTERY_STATUS,
    Permission.VIEW_CUSTOMERS,
    Permission.CREATE_CUSTOMER,
    Permission.UPDATE_CUSTOMER,
    Permission.VIEW_ANALYTICS,
    Permission.VIEW_ALL_LOCATIONS, // Can see all locations but not manage them
    Permission.UPLOAD_ATTACHMENTS,
  ],
  floor_manager: [
    // Floor management operations - focused on assignment and technician management
    Permission.VIEW_ALL_TICKETS,
    Permission.ASSIGN_TECHNICIANS,
    Permission.REASSIGN_TICKETS,
    Permission.UPDATE_TICKET_STATUS,
    Permission.ADD_NOTES,
    Permission.VIEW_TECHNICIAN_WORKLOAD,
    Permission.MANAGE_ASSIGNMENTS,
    Permission.VIEW_CUSTOMERS,
    Permission.VIEW_BATTERIES,
    Permission.UPLOAD_ATTACHMENTS,
  ],
  manager: [
    // Deprecated role, same as front_desk_manager for compatibility
    Permission.VIEW_ALL_TICKETS,
    Permission.CREATE_TICKETS,
    Permission.EDIT_TICKETS,
    Permission.ASSIGN_TECHNICIANS,
    Permission.UPDATE_TICKET_STATUS,
    Permission.ADD_NOTES,
    Permission.VIEW_BATTERIES,
    Permission.CREATE_BATTERY_RECORD,
    Permission.UPDATE_BATTERY_STATUS,
    Permission.VIEW_CUSTOMERS,
    Permission.CREATE_CUSTOMER,
    Permission.UPDATE_CUSTOMER,
    Permission.VIEW_ANALYTICS,
    Permission.VIEW_ALL_LOCATIONS,
    Permission.UPLOAD_ATTACHMENTS,
  ],
  technician: [
    // Limited to assigned work
    Permission.VIEW_ASSIGNED_TICKETS,
    Permission.UPDATE_TICKET_STATUS,
    Permission.ADD_NOTES,
    Permission.VIEW_BATTERIES,
    Permission.UPDATE_BATTERY_STATUS,
    Permission.VIEW_CUSTOMERS,
    Permission.UPLOAD_ATTACHMENTS,
  ],
};

// Navigation permissions - maps navigation items to required permissions
export const NAVIGATION_PERMISSIONS = {
  dashboard: [Permission.VIEW_ALL_TICKETS, Permission.VIEW_ASSIGNED_TICKETS],
  jobcards: [Permission.VIEW_ALL_TICKETS, Permission.VIEW_ASSIGNED_TICKETS],
  team: [Permission.VIEW_ANALYTICS, Permission.ASSIGN_TECHNICIANS],
  customers: [Permission.VIEW_CUSTOMERS],
  batteries: [Permission.VIEW_BATTERIES],
  reports: [Permission.VIEW_ANALYTICS, Permission.VIEW_FINANCIAL_REPORTS],
  settings: [Permission.MANAGE_SETTINGS],
  users: [Permission.VIEW_USERS, Permission.MANAGE_USERS],
} as const;

/**
 * Check if a user role has a specific permission
 */
export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  const rolePermissions = MOBILE_ROLE_PERMISSIONS[userRole];
  return rolePermissions?.includes(permission) || false;
}

/**
 * Check if a user role has any of the specified permissions
 */
export function hasAnyPermission(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission));
}

/**
 * Check if a user role has all of the specified permissions
 */
export function hasAllPermissions(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission));
}

/**
 * Check if user can access a specific navigation item
 */
export function canAccessNavigation(
  userRole: UserRole, 
  navigationKey: keyof typeof NAVIGATION_PERMISSIONS
): boolean {
  const requiredPermissions = NAVIGATION_PERMISSIONS[navigationKey];
  return hasAnyPermission(userRole, requiredPermissions);
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(userRole: UserRole): Permission[] {
  return MOBILE_ROLE_PERMISSIONS[userRole] || [];
}

/**
 * Role checking utilities
 */
export function isAdmin(userRole: UserRole): boolean {
  return userRole === 'admin';
}

export function isFrontDeskManager(userRole: UserRole): boolean {
  return userRole === 'front_desk_manager' || userRole === 'manager';
}

export function isTechnician(userRole: UserRole): boolean {
  return userRole === 'technician';
}

export function isFloorManager(userRole: UserRole): boolean {
  return userRole === 'floor_manager';
}

export function isManagerLevel(userRole: UserRole): boolean {
  return isAdmin(userRole) || isFrontDeskManager(userRole) || isFloorManager(userRole);
}

/**
 * Location access control
 */
export function canBypassLocationFilter(userRole: UserRole): boolean {
  // Admins and front desk managers can see data from all locations
  // Floor managers work within their assigned location
  return isAdmin(userRole) || isFrontDeskManager(userRole);
}

/**
 * Feature flags based on role
 */
export function getFeatureAccess(userRole: UserRole) {
  return {
    canCreateTickets: hasPermission(userRole, Permission.CREATE_TICKETS),
    canEditAllTickets: hasPermission(userRole, Permission.EDIT_TICKETS),
    canDeleteTickets: hasPermission(userRole, Permission.DELETE_TICKETS),
    canAssignTechnicians: hasPermission(userRole, Permission.ASSIGN_TECHNICIANS),
    canViewAnalytics: hasPermission(userRole, Permission.VIEW_ANALYTICS),
    canManageUsers: hasPermission(userRole, Permission.MANAGE_USERS),
    canManageSettings: hasPermission(userRole, Permission.MANAGE_SETTINGS),
    canViewAllTickets: hasPermission(userRole, Permission.VIEW_ALL_TICKETS),
    canViewAllLocations: hasPermission(userRole, Permission.VIEW_ALL_LOCATIONS),
    canUploadAttachments: hasPermission(userRole, Permission.UPLOAD_ATTACHMENTS),
    canDeleteAttachments: hasPermission(userRole, Permission.DELETE_ATTACHMENTS),
    // Floor Manager specific permissions
    canAssignTechnicians: hasPermission(userRole, Permission.ASSIGN_TECHNICIANS),
    canReassignTickets: hasPermission(userRole, Permission.REASSIGN_TICKETS),
    canViewTechnicianWorkload: hasPermission(userRole, Permission.VIEW_TECHNICIAN_WORKLOAD),
    canManageAssignments: hasPermission(userRole, Permission.MANAGE_ASSIGNMENTS),
    // Location bypass
    bypassLocationFilter: canBypassLocationFilter(userRole),
  };
}

/**
 * Get filtered navigation items based on user role
 */
export function getAccessibleNavigation(userRole: UserRole) {
  const navigationItems = Object.keys(NAVIGATION_PERMISSIONS) as Array<keyof typeof NAVIGATION_PERMISSIONS>;
  
  return navigationItems.filter(navItem => 
    canAccessNavigation(userRole, navItem)
  );
}
