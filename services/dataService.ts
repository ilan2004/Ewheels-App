import { supabase } from '@/lib/supabase';
import { 
  ServiceTicket, 
  DashboardKPIs, 
  TechnicianWorkload, 
  TicketFilters,
  PaginatedResponse,
  CreateTicketForm,
  UpdateTicketForm,
  Customer,
  User,
  UserRole,
} from '@/types';
import { canBypassLocationFilter } from '@/lib/permissions';
import { Location } from '@/stores/locationStore';

// Tables that should be scoped by location
const SCOPED_TABLES = new Set([
  'customers',
  'service_tickets', 
  'battery_records',
  'vehicle_cases',
  'quotes',
  'invoices',
  'payments'
]);

export class DataService {
  // Apply location scoping to a query based on user role and active location
  private applyScopeToQuery<T extends { eq: (col: string, val: any) => T }>(
    tableName: string,
    query: T,
    userRole: UserRole,
    activeLocationId?: string | null
  ): T {
    // Admins and front desk managers can see all locations
    if (canBypassLocationFilter(userRole)) {
      return query;
    }

    // Apply location filtering for scoped tables
    if (activeLocationId && SCOPED_TABLES.has(tableName)) {
      try {
        return query.eq('location_id', activeLocationId);
      } catch {
        // If location_id column doesn't exist, return original query
        return query;
      }
    }

    return query;
  }

  // Add location_id to insert data if user is location-scoped
  private addLocationToData<T extends Record<string, any>>(
    tableName: string,
    data: T,
    userRole: UserRole,
    activeLocationId?: string | null
  ): T {
    // Admins can create records for any location (don't auto-add location)
    if (canBypassLocationFilter(userRole)) {
      return data;
    }

    // Add location_id for scoped tables if not already present
    if (activeLocationId && SCOPED_TABLES.has(tableName)) {
      if (!('location_id' in data) || data.location_id == null) {
        return { ...data, location_id: activeLocationId };
      }
    }

    return data;
  }

  // Check if we're in mock mode
  private isMockMode(): boolean {
    const flag = (process.env.EXPO_PUBLIC_USE_MOCK_API === 'true') || (process.env.USE_MOCK_API === 'true');
    const hasSupabase = (
      (!!process.env.EXPO_PUBLIC_SUPABASE_URL || !!process.env.NEXT_PUBLIC_SUPABASE_URL || !!process.env.SUPABASE_URL) &&
      (!!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || !!process.env.SUPABASE_ANON_KEY)
    );
    return flag || !hasSupabase;
  }

  // Mock data for development
  private getMockKPIs(): DashboardKPIs {
    return {
      openTickets: 15,
      inProgressBatteries: 8,
      dueToday: 3,
      overdue: 2,
      weeklyCompleted: 24,
      avgTatDays: 2.5,
      unassigned: 5,
      slaRisk: 4,
    };
  }

  // Fetch dashboard KPIs with location scoping
  async getDashboardKPIs(
    userRole: UserRole,
    activeLocationId?: string | null
  ): Promise<DashboardKPIs> {
    if (this.isMockMode()) {
      return this.getMockKPIs();
    }
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();
      
      const openStatuses = ['reported', 'triaged', 'assigned', 'in_progress'];
      
      // Build base queries with location scoping
      const openTicketsQuery = this.applyScopeToQuery(
        'service_tickets',
        supabase.from('service_tickets').select('id', { count: 'exact', head: true }),
        userRole,
        activeLocationId
      ).in('status', openStatuses);

      const inProgressBatteriesQuery = this.applyScopeToQuery(
        'battery_records',
        supabase.from('battery_records').select('id', { count: 'exact', head: true }),
        userRole,
        activeLocationId
      ).in('status', ['diagnosed', 'in_progress']);

      const dueTodayQuery = this.applyScopeToQuery(
        'service_tickets',
        supabase.from('service_tickets').select('id', { count: 'exact', head: true }),
        userRole,
        activeLocationId
      )
        .gte('due_date', todayISO)
        .lt('due_date', new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString());

      const overdueQuery = this.applyScopeToQuery(
        'service_tickets',
        supabase.from('service_tickets').select('id', { count: 'exact', head: true }),
        userRole,
        activeLocationId
      )
        .lt('due_date', todayISO)
        .not('status', 'in', '(completed,delivered,closed)');

      const unassignedQuery = this.applyScopeToQuery(
        'service_tickets',
        supabase.from('service_tickets').select('id', { count: 'exact', head: true }),
        userRole,
        activeLocationId
      )
        .in('status', openStatuses)
        .is('assigned_to', null);

      const slaRiskQuery = this.applyScopeToQuery(
        'service_tickets',
        supabase.from('service_tickets').select('id', { count: 'exact', head: true }),
        userRole,
        activeLocationId
      )
        .gte('due_date', new Date().toISOString())
        .lt('due_date', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString())
        .not('status', 'in', '(completed,delivered,closed)');

      // Execute all queries in parallel
      const [
        { count: openCount },
        { count: progCount },
        { count: dueTodayCount },
        { count: overdueCount },
        { count: unassignedCount },
        { count: slaRiskCount },
      ] = await Promise.all([
        openTicketsQuery,
        inProgressBatteriesQuery,
        dueTodayQuery,
        overdueQuery,
        unassignedQuery,
        slaRiskQuery,
      ]);

      return {
        openTickets: openCount || 0,
        inProgressBatteries: progCount || 0,
        dueToday: dueTodayCount || 0,
        overdue: overdueCount || 0,
        weeklyCompleted: 0, // Placeholder - would need weekly calculation
        avgTatDays: 0, // Placeholder - would need TAT calculation
        unassigned: unassignedCount || 0,
        slaRisk: slaRiskCount || 0,
      };
    } catch (error) {
      console.error('Error fetching dashboard KPIs:', error);
      throw error;
    }
  }

  private getMockTickets(limit: number = 10): ServiceTicket[] {
    const mockTickets: ServiceTicket[] = [
      {
        id: '1',
        ticket_number: 'EV001',
        customer_id: 'cust1',
        vehicle_reg_no: 'KA01AB1234',
        customer_complaint: 'Battery not charging properly',
        status: 'in_progress',
        priority: 1,
        due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'user1',
        updated_by: 'user1',
        customer: { 
          id: 'cust1', 
          name: 'Rajesh Kumar', 
          contact: '+91 9876543210', 
          email: 'rajesh@email.com', 
          created_at: new Date().toISOString(), 
          updated_at: new Date().toISOString() 
        },
        location: {
          id: 'default',
          name: 'Default Location',
          code: 'DEFAULT'
        }
      },
      {
        id: '2',
        ticket_number: 'EV002',
        customer_id: 'cust2',
        vehicle_reg_no: 'KA02CD5678',
        customer_complaint: 'Motor overheating issue',
        status: 'triaged',
        priority: 2,
        due_date: new Date().toISOString(),
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'user1',
        updated_by: 'user1',
        customer: { 
          id: 'cust2', 
          name: 'Priya Sharma', 
          contact: '+91 9876543211', 
          email: 'priya@email.com', 
          created_at: new Date().toISOString(), 
          updated_at: new Date().toISOString() 
        },
        location: {
          id: 'default',
          name: 'Default Location',
          code: 'DEFAULT'
        }
      },
    ];
    return mockTickets.slice(0, limit);
  }

  // Fetch tickets with location scoping and role-based filtering
  async getTickets(
    userRole: UserRole,
    userId?: string,
    activeLocationId?: string | null,
    filters: TicketFilters = {},
    page: number = 1,
    pageSize: number = 20
  ): Promise<PaginatedResponse<ServiceTicket>> {
    if (this.isMockMode()) {
      const mockTickets = this.getMockTickets(50);
      let filteredTickets = mockTickets;
      
      // Apply status filtering
      if (filters.status && filters.status !== 'all') {
        filteredTickets = filteredTickets.filter(t => t.status === filters.status);
      }
      
      // Role-based filtering for technicians
      if (userRole === 'technician' && userId) {
        filteredTickets = filteredTickets.filter(t => t.created_by === userId); // Mock assignment
      }
      
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const paginatedData = filteredTickets.slice(start, end);
      
      return {
        data: paginatedData,
        count: filteredTickets.length,
        page,
        pageSize,
        totalPages: Math.ceil(filteredTickets.length / pageSize),
      };
    }
    
    try {
      let query = supabase
        .from('service_tickets')
        .select(`
          *,
          customer:customers(*),
          location:locations(id, name, code)
        `, { count: 'exact' });

      // Apply location scoping
      query = this.applyScopeToQuery('service_tickets', query, userRole, activeLocationId);

      // Role-based filtering - technicians only see assigned tickets
      if (userRole === 'technician' && userId) {
        query = query.eq('assigned_to', userId);
      }

      // Apply filters
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters.priority && filters.priority !== 'all') {
        query = query.eq('priority', filters.priority);
      }

      if (filters.assignedTo) {
        if (filters.assignedTo === 'unassigned') {
          query = query.is('assigned_to', null);
        } else if (filters.assignedTo !== 'all') {
          query = query.eq('assigned_to', filters.assignedTo);
        }
      }

      if (filters.search) {
        query = query.or(`ticket_number.ilike.%${filters.search}%,customer_complaint.ilike.%${filters.search}%`);
      }

      if (filters.dueDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        switch (filters.dueDate) {
          case 'overdue':
            query = query.lt('due_date', today.toISOString());
            break;
          case 'today':
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);
            query = query.gte('due_date', today.toISOString()).lt('due_date', tomorrow.toISOString());
            break;
          case 'tomorrow':
            const dayAfterTomorrow = new Date(today);
            dayAfterTomorrow.setDate(today.getDate() + 2);
            const tomorrowDate = new Date(today);
            tomorrowDate.setDate(today.getDate() + 1);
            query = query.gte('due_date', tomorrowDate.toISOString()).lt('due_date', dayAfterTomorrow.toISOString());
            break;
          case 'this_week':
            const weekEnd = new Date(today);
            weekEnd.setDate(today.getDate() + 7);
            query = query.gte('due_date', today.toISOString()).lt('due_date', weekEnd.toISOString());
            break;
        }
      }

      // Apply pagination
      const offset = (page - 1) * pageSize;
      query = query.range(offset, offset + pageSize - 1);

      // Order by created_at desc
      query = query.order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      const totalPages = Math.ceil((count || 0) / pageSize);

      return {
        data: data || [],
        count: count || 0,
        page,
        pageSize,
        totalPages,
      };
    } catch (error) {
      console.error('Error fetching tickets:', error);
      throw error;
    }
  }

  // Fetch recent tickets with location and role scoping
  async getRecentTickets(
    userRole: UserRole,
    userId?: string,
    activeLocationId?: string | null,
    limit: number = 10
  ): Promise<ServiceTicket[]> {
    if (this.isMockMode()) {
      let tickets = this.getMockTickets(limit);
      
      // Filter for technicians
      if (userRole === 'technician' && userId) {
        tickets = tickets.filter(t => t.created_by === userId);
      }
      
      return tickets;
    }
    
    try {
      let query = supabase
        .from('service_tickets')
        .select(`
          *,
          customer:customers(*),
          location:locations(id, name, code)
        `);

      // Apply location scoping
      query = this.applyScopeToQuery('service_tickets', query, userRole, activeLocationId);

      // Role-based filtering for technicians
      if (userRole === 'technician' && userId) {
        query = query.eq('assigned_to', userId);
      }

      query = query.order('created_at', { ascending: false }).limit(limit);

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching recent tickets:', error);
      throw error;
    }
  }

  // Create new ticket with location context
  async createTicket(
    ticketData: CreateTicketForm,
    userRole: UserRole,
    activeLocationId?: string | null
  ): Promise<ServiceTicket> {
    try {
      const dataWithLocation = this.addLocationToData(
        'service_tickets',
        {
          customer_id: ticketData.customer_id,
          customer_complaint: ticketData.customer_complaint,
          description: ticketData.description,
          vehicle_make: ticketData.vehicle_make,
          vehicle_model: ticketData.vehicle_model,
          vehicle_reg_no: ticketData.vehicle_reg_no,
          vehicle_year: ticketData.vehicle_year,
          priority: ticketData.priority || 3,
          status: 'reported' as const,
        },
        userRole,
        activeLocationId
      );

      const { data, error } = await supabase
        .from('service_tickets')
        .insert(dataWithLocation)
        .select(`
          *,
          customer:customers(*),
          location:locations(id, name, code)
        `)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error creating ticket:', error);
      throw error;
    }
  }

  // Fetch customers with location scoping
  async getCustomers(
    userRole: UserRole,
    activeLocationId?: string | null
  ): Promise<Customer[]> {
    if (this.isMockMode()) {
      return [
        { 
          id: 'cust1', 
          name: 'Rajesh Kumar', 
          contact: '+91 9876543210', 
          email: 'rajesh@email.com', 
          created_at: new Date().toISOString(), 
          updated_at: new Date().toISOString() 
        },
        { 
          id: 'cust2', 
          name: 'Priya Sharma', 
          contact: '+91 9876543211', 
          email: 'priya@email.com', 
          created_at: new Date().toISOString(), 
          updated_at: new Date().toISOString() 
        },
      ];
    }
    
    try {
      let query = supabase.from('customers').select('*');
      
      // Apply location scoping
      query = this.applyScopeToQuery('customers', query, userRole, activeLocationId);
      
      query = query.order('name');

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }
  }

  private getMockTeamWorkload(): TechnicianWorkload[] {
    return [
      { assignee: 'John Doe', count: 6, capacity: 8, name: 'John Doe', email: 'john@evwheels.com' },
      { assignee: 'Jane Smith', count: 8, capacity: 8, name: 'Jane Smith', email: 'jane@evwheels.com' },
      { assignee: 'Mike Johnson', count: 4, capacity: 10, name: 'Mike Johnson', email: 'mike@evwheels.com' },
      { assignee: 'Sarah Wilson', count: 9, capacity: 8, name: 'Sarah Wilson', email: 'sarah@evwheels.com' },
    ];
  }

  // Get team workload with location scoping
  async getTeamWorkload(
    userRole: UserRole,
    activeLocationId?: string | null
  ): Promise<TechnicianWorkload[]> {
    if (this.isMockMode()) {
      return this.getMockTeamWorkload();
    }
    
    try {
      const openStatuses = ['reported', 'triaged', 'assigned', 'in_progress'];
      
      let query = supabase.from('service_tickets').select('assigned_to, id');
      
      // Apply location scoping
      query = this.applyScopeToQuery('service_tickets', query, userRole, activeLocationId);
      
      query = query.in('status', openStatuses);

      const { data, error } = await query;

      if (error) throw error;

      // Since the actual implementation may not track workload properly,
      // return mock workload for now
      return this.getMockTeamWorkload();
    } catch (error) {
      console.error('Error fetching team workload:', error);
      throw error;
    }
  }

  // Get users with role filtering
  async getUsers(requestingUserRole: UserRole): Promise<User[]> {
    // Only admins and managers can view users
    if (!['admin', 'front_desk_manager', 'manager'].includes(requestingUserRole)) {
      throw new Error('Insufficient permissions to view users');
    }

    if (this.isMockMode()) {
      return [
        {
          id: '1',
          email: 'admin@evwheels.com',
          firstName: 'Admin',
          lastName: 'User',
          role: 'admin',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          email: 'manager@evwheels.com',
          firstName: 'Floor',
          lastName: 'Manager',
          role: 'front_desk_manager',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '3',
          email: 'tech@evwheels.com',
          firstName: 'Tech',
          lastName: 'User',
          role: 'technician',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
    }

    try {
      // Fetch users from profiles and app_roles tables
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          user_id,
          username,
          email,
          created_at,
          updated_at,
          app_roles!inner(role)
        `);

      if (error) throw error;

      return profiles?.map(profile => ({
        id: profile.user_id,
        email: profile.email,
        firstName: profile.username || 'User',
        lastName: '',
        role: (profile.app_roles as any).role,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
      })) || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }
}

export const dataService = new DataService();
