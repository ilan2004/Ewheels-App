import { supabase } from '@/lib/supabase';
import { ServiceTicket, User } from '@/types';

export interface FloorManagerStats {
  unassignedTickets: number;
  inProgressTickets: number;
  dueToday: number;
  overdue: number;
  totalTechnicians: number;
  avgTicketsPerTechnician: number;
}

export interface TechnicianOverview {
  id: string;
  name: string;
  email: string;
  activeTickets: number;
  capacity: number;
  oldestTicketDays?: number;
  tickets?: ServiceTicket[];
}

export interface AssignmentRequest {
  ticketIds: string[];
  technicianId: string;
  assignedBy: string;
  notes?: string;
}

export class FloorManagerService {
  // Check if we're in mock mode
  private isMockMode(): boolean {
    const flag = (process.env.EXPO_PUBLIC_USE_MOCK_API === 'true') || (process.env.USE_MOCK_API === 'true');
    const hasSupabase = (
      (!!process.env.EXPO_PUBLIC_SUPABASE_URL || !!process.env.NEXT_PUBLIC_SUPABASE_URL || !!process.env.SUPABASE_URL) &&
      (!!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || !!process.env.SUPABASE_ANON_KEY)
    );
    return flag || !hasSupabase;
  }

  // Enhanced mock data for development
  private getMockStats(): FloorManagerStats {
    // Simulate realistic stats with some variability based on time
    const hour = new Date().getHours();
    const baseStats = {
      unassignedTickets: Math.max(1, 7 - Math.floor(hour / 4)), // Fewer unassigned as day progresses
      inProgressTickets: 15 + Math.floor(hour / 3), // More in progress during work hours
      dueToday: Math.max(0, 4 - Math.floor(hour / 8)), // Due today decreases throughout day
      overdue: Math.min(5, Math.floor(hour / 6)), // Overdue increases slightly
      totalTechnicians: 6,
      avgTicketsPerTechnician: 3.2,
    };
    return baseStats;
  }

  private getMockTechnicians(): TechnicianOverview[] {
    const hour = new Date().getHours();
    const workingHours = hour >= 8 && hour <= 18;
    
    return [
      {
        id: 'tech_001',
        name: 'Rajesh Kumar',
        email: 'rajesh.kumar@evwheels.com',
        activeTickets: workingHours ? 6 : 5,
        capacity: 8,
        oldestTicketDays: 2,
        tickets: this.getMockTicketsForTechnician('tech_001', workingHours ? 6 : 5),
      },
      {
        id: 'tech_002', 
        name: 'Priya Sharma',
        email: 'priya.sharma@evwheels.com',
        activeTickets: workingHours ? 8 : 7,
        capacity: 8,
        oldestTicketDays: 4,
        tickets: this.getMockTicketsForTechnician('tech_002', workingHours ? 8 : 7),
      },
      {
        id: 'tech_003',
        name: 'Amit Patel',
        email: 'amit.patel@evwheels.com', 
        activeTickets: workingHours ? 5 : 4,
        capacity: 8,
        oldestTicketDays: 1,
        tickets: this.getMockTicketsForTechnician('tech_003', workingHours ? 5 : 4),
      },
      {
        id: 'tech_004',
        name: 'Sneha Reddy',
        email: 'sneha.reddy@evwheels.com',
        activeTickets: workingHours ? 3 : 2,
        capacity: 8,
        oldestTicketDays: 6,
        tickets: this.getMockTicketsForTechnician('tech_004', workingHours ? 3 : 2),
      },
      {
        id: 'tech_005',
        name: 'Vikram Singh',
        email: 'vikram.singh@evwheels.com',
        activeTickets: workingHours ? 7 : 6,
        capacity: 8,
        oldestTicketDays: 3,
        tickets: this.getMockTicketsForTechnician('tech_005', workingHours ? 7 : 6),
      },
      {
        id: 'tech_006',
        name: 'Kavya Nair',
        email: 'kavya.nair@evwheels.com',
        activeTickets: workingHours ? 4 : 3,
        capacity: 8,
        oldestTicketDays: 8,
        tickets: this.getMockTicketsForTechnician('tech_006', workingHours ? 4 : 3),
      },
    ];
  }

  private getMockTicketsForTechnician(technicianId: string, activeTicketCount?: number): ServiceTicket[] {
    const ticketTemplates = [
      { symptom: 'Battery not charging properly', priority: 1, customer: 'Arjun Mehta', vehicle: 'KA01AB1234' },
      { symptom: 'Motor making unusual noise', priority: 2, customer: 'Sita Devi', vehicle: 'DL02CD5678' },
      { symptom: 'Brake system needs adjustment', priority: 1, customer: 'Ravi Kumar', vehicle: 'MH03EF9012' },
      { symptom: 'Display not working', priority: 3, customer: 'Lakshmi Pillai', vehicle: 'TN04GH3456' },
      { symptom: 'Throttle response sluggish', priority: 2, customer: 'Suresh Gupta', vehicle: 'UP05IJ7890' },
      { symptom: 'Headlight replacement needed', priority: 3, customer: 'Meera Shah', vehicle: 'GJ06KL1234' },
      { symptom: 'Chain lubrication service', priority: 3, customer: 'Kiran Joshi', vehicle: 'RJ07MN5678' },
      { symptom: 'Suspension repair required', priority: 2, customer: 'Deepak Rao', vehicle: 'KL08PQ9012' },
    ];

    const numTickets = activeTicketCount || 3;
    
    return Array.from({ length: numTickets }, (_, index) => {
      const template = ticketTemplates[index % ticketTemplates.length];
      const daysAgo = Math.floor(Math.random() * 10) + 1;
      const createdDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      
      return {
        id: `${technicianId}_ticket_${String(index + 1).padStart(3, '0')}`,
        ticketNumber: `EV-${new Date().getFullYear()}-${String(Date.now() + index).slice(-6)}`,
        symptom: template.symptom,
        description: `Customer complaint: ${template.symptom}. Assigned for inspection and repair.`,
        priority: template.priority,
        status: 'in_progress' as const,
        customerId: `customer_${index + 1}`,
        customer: {
          id: `customer_${index + 1}`,
          name: template.customer,
          contact: `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`,
          email: `${template.customer.toLowerCase().replace(' ', '.')}@gmail.com`,
          address: `${Math.floor(Math.random() * 999) + 1}, Street ${Math.floor(Math.random() * 50) + 1}, City`,
          vehicleRegNo: template.vehicle,
          createdAt: createdDate.toISOString(),
          updatedAt: new Date().toISOString(),
        },
        vehicleRegNo: template.vehicle,
        assignedTo: technicianId,
        assignedToId: technicianId,
        assignedBy: 'floor_manager_001',
        assignedAt: new Date(createdDate.getTime() + Math.random() * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: createdDate.toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system',
        updatedBy: 'system',
        locationId: 'location_001',
        dueDate: new Date(Date.now() + (Math.random() * 5 + 1) * 24 * 60 * 60 * 1000).toISOString(),
      };
    });
  }

  // Get dashboard statistics for floor manager
  async getDashboardStats(
    floorManagerId: string,
    locationId?: string | null
  ): Promise<FloorManagerStats> {
    if (this.isMockMode()) {
      return this.getMockStats();
    }

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      // Build queries with conditional location filtering
      const buildQuery = (baseQuery: any) => {
        return locationId ? baseQuery.eq('location_id', locationId) : baseQuery;
      };

      // Get counts in parallel
      const [
        { count: unassignedCount },
        { count: inProgressCount },
        { count: dueTodayCount },
        { count: overdueCount },
      ] = await Promise.all([
        // Unassigned tickets
        buildQuery(
          supabase
            .from('service_tickets')
            .select('id', { count: 'exact', head: true })
            .is('assigned_to', null)
            .in('status', ['reported', 'triaged'])
        ),
        
        // In progress tickets  
        buildQuery(
          supabase
            .from('service_tickets')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'in_progress')
            .not('assigned_to', 'is', null)
        ),
        
        // Due today
        buildQuery(
          supabase
            .from('service_tickets')
            .select('id', { count: 'exact', head: true })
            .gte('due_date', todayISO)
            .lt('due_date', new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString())
            .not('status', 'in', '(completed,delivered,closed)')
        ),
        
        // Overdue
        buildQuery(
          supabase
            .from('service_tickets')
            .select('id', { count: 'exact', head: true })
            .lt('due_date', todayISO)
            .not('status', 'in', '(completed,delivered,closed)')
        ),
      ]);

      // Get technician count
      const { count: technicianCount } = await supabase
        .from('app_roles')
        .select('user_id', { count: 'exact', head: true })
        .eq('role', 'technician');

      const avgTicketsPerTechnician = technicianCount && inProgressCount 
        ? Math.round((inProgressCount || 0) / technicianCount) 
        : 0;

      return {
        unassignedTickets: unassignedCount || 0,
        inProgressTickets: inProgressCount || 0,
        dueToday: dueTodayCount || 0,
        overdue: overdueCount || 0,
        totalTechnicians: technicianCount || 0,
        avgTicketsPerTechnician,
      };
    } catch (error) {
      console.error('Error fetching floor manager stats:', error);
      return this.getMockStats();
    }
  }

  // Get technician overview with workload
  async getTechnicianOverview(locationId?: string | null): Promise<TechnicianOverview[]> {
    if (this.isMockMode()) {
      return this.getMockTechnicians();
    }

    try {
      // Get all technicians
      const { data: technicians, error: techError } = await supabase
        .from('profiles')
        .select(`
          user_id,
          username,
          email,
          app_roles!inner(role)
        `)
        .eq('app_roles.role', 'technician');

      if (techError) {
        console.warn('Error fetching technicians:', techError);
        return this.getMockTechnicians();
      }

      if (!technicians?.length) {
        return [];
      }

      // Get workload for each technician
      const technicianOverviews = await Promise.all(
        technicians.map(async (tech) => {
          let ticketQuery = supabase
            .from('service_tickets')
            .select('id, assigned_at, status')
            .eq('assigned_to', tech.user_id)
            .eq('status', 'in_progress'); // Only use existing status value

          // Apply location filtering if needed
          if (locationId) {
            ticketQuery = ticketQuery.eq('location_id', locationId);
          }

          const { data: tickets, error } = await ticketQuery;

          if (error) {
            console.warn(`Error fetching tickets for ${tech.username}:`, error);
          }

          const activeTickets = tickets?.length || 0;
          
          // Calculate oldest ticket days
          let oldestTicketDays = 0;
          if (tickets?.length) {
            const oldestAssignment = tickets
              .filter(t => t.assigned_at)
              .sort((a, b) => new Date(a.assigned_at!).getTime() - new Date(b.assigned_at!).getTime())[0];
            
            if (oldestAssignment?.assigned_at) {
              const assignedDate = new Date(oldestAssignment.assigned_at);
              const today = new Date();
              oldestTicketDays = Math.floor((today.getTime() - assignedDate.getTime()) / (1000 * 60 * 60 * 24));
            }
          }

          return {
            id: tech.user_id,
            name: tech.username || 'Unknown',
            email: tech.email || '',
            activeTickets,
            capacity: 8, // Default capacity
            oldestTicketDays: oldestTicketDays > 0 ? oldestTicketDays : undefined,
          };
        })
      );

      return technicianOverviews;
    } catch (error) {
      console.error('Error fetching technician overview:', error);
      return this.getMockTechnicians();
    }
  }

  // Get available technicians for assignment
  async getAvailableTechnicians(locationId?: string | null): Promise<User[]> {
    if (this.isMockMode()) {
      return this.getMockTechnicians().map(t => ({
        id: t.id,
        email: t.email,
        firstName: t.name.split(' ')[0],
        lastName: t.name.split(' ')[1] || '',
        role: 'technician' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
    }

    try {
      const { data: technicians, error } = await supabase
        .from('profiles')
        .select(`
          user_id,
          username,
          email,
          app_roles!inner(role)
        `)
        .eq('app_roles.role', 'technician');

      if (error) {
        console.error('Error fetching available technicians:', error);
        return [];
      }

      return technicians?.map(tech => ({
        id: tech.user_id,
        email: tech.email || '',
        firstName: tech.username?.split(' ')[0] || 'Unknown',
        lastName: tech.username?.split(' ')[1] || '',
        role: 'technician' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })) || [];
    } catch (error) {
      console.error('Error fetching available technicians:', error);
      return [];
    }
  }

  // Assign tickets to technician
  async assignTickets(assignment: AssignmentRequest): Promise<boolean> {
    if (this.isMockMode()) {
      console.log('Mock: Assigned tickets', assignment.ticketIds, 'to technician', assignment.technicianId);
      return true;
    }

    try {
      const now = new Date().toISOString();
      
      // Update tickets with assignment
      const { error } = await supabase
        .from('service_tickets')
        .update({
          assigned_to: assignment.technicianId,
          assigned_by: assignment.assignedBy,
          assigned_at: now,
          status: 'in_progress', // This should be a valid status in your enum
          updated_at: now,
        })
        .in('id', assignment.ticketIds);

      if (error) {
        console.error('Error assigning tickets:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in assignTickets:', error);
      return false;
    }
  }

  // Reassign tickets to different technician
  async reassignTickets(assignment: AssignmentRequest): Promise<boolean> {
    return this.assignTickets(assignment); // Same logic for now
  }

  // Assign single ticket to technician
  async assignTicket(ticketId: string, technicianId: string): Promise<boolean> {
    if (this.isMockMode()) {
      console.log(`Mock: Assigned ticket ${ticketId} to technician ${technicianId}`);
      return true;
    }

    try {
      const now = new Date().toISOString();
      
      const { error } = await supabase
        .from('service_tickets')
        .update({
          assigned_to: technicianId || null,
          assigned_by: technicianId ? 'floor_manager' : null,
          assigned_at: technicianId ? now : null,
          status: technicianId ? 'assigned' : 'reported',
          updated_at: now,
        })
        .eq('id', ticketId);

      return !error;
    } catch (error) {
      console.error('Error assigning ticket:', error);
      return false;
    }
  }

  // Reassign single ticket
  async reassignTicket(ticketId: string, newTechnicianId: string): Promise<boolean> {
    return this.assignTicket(ticketId, newTechnicianId);
  }

  // Get technician details with their assigned tickets
  async getTechnicianDetails(
    technicianId: string,
    locationId?: string | null
  ): Promise<TechnicianOverview | null> {
    if (this.isMockMode()) {
      const mockTechnicians = this.getMockTechnicians();
      return mockTechnicians.find(t => t.id === technicianId) || null;
    }

    try {
      // Get technician info
      const { data: technician, error: techError } = await supabase
        .from('profiles')
        .select(`
          user_id,
          username,
          email,
          app_roles!inner(role)
        `)
        .eq('user_id', technicianId)
        .eq('app_roles.role', 'technician')
        .single();

      if (techError || !technician) {
        console.error('Error fetching technician details:', techError);
        return null;
      }

      // Get assigned tickets
      let ticketQuery = supabase
        .from('service_tickets')
        .select(`
          *,
          customer:customers(*)
        `)
        .eq('assigned_to', technicianId)
        .eq('status', 'in_progress') // Only use existing status value
        .order('assigned_at', { ascending: true });

      if (locationId) {
        ticketQuery = ticketQuery.eq('location_id', locationId);
      }

      const { data: tickets, error: ticketsError } = await ticketQuery;

      if (ticketsError) {
        console.warn('Error fetching technician tickets:', ticketsError);
      }

      const activeTickets = tickets?.length || 0;
      
      // Calculate oldest ticket days
      let oldestTicketDays = 0;
      if (tickets?.length) {
        const oldestTicket = tickets[0]; // Already sorted by assigned_at
        if (oldestTicket.assigned_at) {
          const assignedDate = new Date(oldestTicket.assigned_at);
          const today = new Date();
          oldestTicketDays = Math.floor((today.getTime() - assignedDate.getTime()) / (1000 * 60 * 60 * 24));
        }
      }

      return {
        id: technician.user_id,
        name: technician.username || 'Unknown',
        email: technician.email || '',
        activeTickets,
        capacity: 8,
        oldestTicketDays: oldestTicketDays > 0 ? oldestTicketDays : undefined,
        tickets: tickets || [],
      };
    } catch (error) {
      console.error('Error fetching technician details:', error);
      return null;
    }
  }
}

export const floorManagerService = new FloorManagerService();
