import { supabase } from '@/lib/supabase';
import { 
  ServiceTicket, 
  DashboardKPIs, 
  TechnicianWorkload, 
  TicketFilters,
  ApiResponse,
  PaginatedResponse,
  CreateTicketForm,
  UpdateTicketForm,
  Customer,
} from '@/types';

export class JobCardsService {
  // Check if we're in mock mode - only use mock when explicitly enabled
  private isMockMode(): boolean {
    return (process.env.EXPO_PUBLIC_USE_MOCK_API === 'true') || (process.env.USE_MOCK_API === 'true');
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

  // Fetch dashboard KPIs
  async getDashboardKPIs(): Promise<DashboardKPIs> {
    if (this.isMockMode()) {
      return this.getMockKPIs();
    }
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();
      
      const openStatuses = ['reported', 'triaged', 'in_progress'];
      
      // Get all data in parallel
      const [
        { count: openCount },
        { count: progCount },
        { count: dueTodayCount },
        { count: overdueCount },
        { count: unassignedCount },
        { count: slaRiskCount },
      ] = await Promise.all([
        // Open tickets
        supabase
          .from('service_tickets')
          .select('id', { count: 'exact', head: true })
          .in('status', openStatuses),
          
        // In progress batteries (assuming you have battery_records table)
        supabase
          .from('battery_records')
          .select('id', { count: 'exact', head: true })
          .in('status', ['diagnosed', 'in_progress']),
          
        // Due today
        supabase
          .from('service_tickets')
          .select('id', { count: 'exact', head: true })
          .gte('due_date', todayISO)
          .lt('due_date', new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()),
          
        // Overdue
        supabase
          .from('service_tickets')
          .select('id', { count: 'exact', head: true })
          .lt('due_date', todayISO)
          .not('status', 'in', '(completed,delivered,closed)'),
          
        // Unassigned
        supabase
          .from('service_tickets')
          .select('id', { count: 'exact', head: true })
          .in('status', openStatuses)
          .is('assigned_to', null),
          
        // SLA risk (due in next 24h)
        supabase
          .from('service_tickets')
          .select('id', { count: 'exact', head: true })
          .gte('due_date', new Date().toISOString())
          .lt('due_date', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString())
          .not('status', 'in', '(completed,delivered,closed)'),
      ]);

      // Weekly completed (you'll need to implement this based on your needs)
      const weeklyCompleted = 0; // Placeholder

      return {
        openTickets: openCount || 0,
        inProgressBatteries: progCount || 0,
        dueToday: dueTodayCount || 0,
        overdue: overdueCount || 0,
        weeklyCompleted,
        avgTatDays: 0, // Placeholder
        unassigned: unassignedCount || 0,
        slaRisk: slaRiskCount || 0,
      };
    } catch (error) {
      console.error('Error fetching dashboard KPIs:', error);
      throw error;
    }
  }

  private generateMockTickets(limit: number = 10): ServiceTicket[] {
    const ticketTemplates = [
      { complaint: 'Battery not charging properly', priority: 1, status: 'reported' },
      { complaint: 'Motor making grinding noise', priority: 1, status: 'assigned' },
      { complaint: 'Brake system malfunction', priority: 1, status: 'in_progress' },
      { complaint: 'Display screen flickering', priority: 2, status: 'assigned' },
      { complaint: 'Throttle response delayed', priority: 2, status: 'in_progress' },
      { complaint: 'Headlight not working', priority: 3, status: 'triaged' },
      { complaint: 'Horn not functioning', priority: 3, status: 'assigned' },
      { complaint: 'Seat adjustment broken', priority: 3, status: 'reported' },
      { complaint: 'Mirror loose and vibrating', priority: 3, status: 'in_progress' },
      { complaint: 'USB charging port dead', priority: 3, status: 'assigned' },
      { complaint: 'Side stand not locking', priority: 2, status: 'in_progress' },
      { complaint: 'Speedometer showing wrong reading', priority: 2, status: 'reported' },
      { complaint: 'Turn indicators not blinking', priority: 2, status: 'assigned' },
      { complaint: 'Suspension making noise', priority: 2, status: 'triaged' },
      { complaint: 'Chain needs lubrication', priority: 3, status: 'reported' },
      { complaint: 'Battery level indicator stuck', priority: 3, status: 'in_progress' },
      { complaint: 'Footrest adjustment issue', priority: 3, status: 'assigned' },
      { complaint: 'Storage compartment lock broken', priority: 3, status: 'triaged' },
      { complaint: 'Wheel alignment needed', priority: 2, status: 'assigned' },
      { complaint: 'Key remote not working', priority: 3, status: 'in_progress' },
    ];

    const customers = [
      { name: 'Rajesh Kumar', contact: '+91 9876543210', email: 'rajesh.kumar@gmail.com' },
      { name: 'Priya Sharma', contact: '+91 8765432109', email: 'priya.sharma@gmail.com' },
      { name: 'Amit Patel', contact: '+91 7654321098', email: 'amit.patel@gmail.com' },
      { name: 'Sneha Reddy', contact: '+91 6543210987', email: 'sneha.reddy@gmail.com' },
      { name: 'Vikram Singh', contact: '+91 5432109876', email: 'vikram.singh@gmail.com' },
      { name: 'Kavya Nair', contact: '+91 4321098765', email: 'kavya.nair@gmail.com' },
      { name: 'Deepak Rao', contact: '+91 3210987654', email: 'deepak.rao@gmail.com' },
      { name: 'Meera Shah', contact: '+91 2109876543', email: 'meera.shah@gmail.com' },
      { name: 'Suresh Gupta', contact: '+91 1098765432', email: 'suresh.gupta@gmail.com' },
      { name: 'Lakshmi Pillai', contact: '+91 9087654321', email: 'lakshmi.pillai@gmail.com' },
    ];

    const vehicleNumbers = [
      'KA01AB1234', 'DL02CD5678', 'MH03EF9012', 'TN04GH3456', 'UP05IJ7890',
      'GJ06KL1234', 'RJ07MN5678', 'KL08PQ9012', 'AP09RS3456', 'TS10TU7890',
      'PB11VW1234', 'HR12XY5678', 'BR13ZA9012', 'OR14BC3456', 'JH15DE7890',
      'AS16FG1234', 'SK17HI5678', 'NL18JK9012', 'TR19LM3456', 'AR20NO7890',
    ];

      const technicians = ['tech_001', 'tech_002', 'tech_003', 'tech_004', 'tech_005', 'tech_006'];
      const customerBringingOptions = ['vehicle', 'battery', 'both'] as const;

    return Array.from({ length: limit }, (_, index) => {
      const template = ticketTemplates[index % ticketTemplates.length];
      const customer = customers[index % customers.length];
      const vehicleNo = vehicleNumbers[index % vehicleNumbers.length];
      const daysAgo = Math.floor(Math.random() * 14) + 1; // 1-14 days ago
      const createdDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      
      // Generate due date based on priority (1-3 days for high, 5-7 for medium, 7-14 for low)
      const dueDays = template.priority === 1 ? 1 + Math.random() * 2 : 
                      template.priority === 2 ? 3 + Math.random() * 4 : 
                      5 + Math.random() * 9;
      const dueDate = new Date(createdDate.getTime() + dueDays * 24 * 60 * 60 * 1000);
      
      // Determine if assigned - assign tickets with status 'assigned', 'in_progress' 
      const isAssigned = ['assigned', 'in_progress'].includes(template.status);
      const assignedTechnician = isAssigned ? technicians[Math.floor(Math.random() * technicians.length)] : undefined;
      const assignedDate = isAssigned ? new Date(createdDate.getTime() + Math.random() * 24 * 60 * 60 * 1000) : undefined;
      
      const ticketId = `ticket_${String(index + 1).padStart(3, '0')}`;
      const customerId = `customer_${String((index % customers.length) + 1).padStart(3, '0')}`;
      const ticketNumber = `EV-${new Date().getFullYear()}-${String(Date.now() + index).slice(-6)}`;
      
      // Randomly assign what customer is bringing
      const customerBringing = customerBringingOptions[Math.floor(Math.random() * customerBringingOptions.length)];

      return {
        id: ticketId,
        ticketNumber: ticketNumber,
        ticket_number: ticketNumber, // Legacy field
        customerId: customerId,
        customer_id: customerId, // Legacy field
        vehicleRegNo: vehicleNo,
        vehicle_reg_no: vehicleNo, // Legacy field
        symptom: template.complaint,
        customer_complaint: template.complaint, // Legacy field
        description: `Customer reports: ${template.complaint}. Initial assessment required.`,
        customer_bringing: customerBringing,
        // Add case IDs based on what customer is bringing
        vehicle_case_id: (customerBringing === 'vehicle' || customerBringing === 'both') ? `vehicle_case_${String(index + 1).padStart(3, '0')}` : null,
        battery_case_id: (customerBringing === 'battery' || customerBringing === 'both') ? `battery_case_${String(index + 1).padStart(3, '0')}` : null,
        status: template.status as any,
        priority: template.priority,
        dueDate: dueDate.toISOString(),
        due_date: dueDate.toISOString(), // Legacy field
        assignedTo: assignedTechnician,
        assignedToId: assignedTechnician,
        assigned_to: assignedTechnician, // Legacy field
        assignedBy: isAssigned ? 'floor_manager_001' : undefined,
        assignedAt: assignedDate?.toISOString(),
        assigned_at: assignedDate?.toISOString(), // Legacy field
        createdAt: createdDate.toISOString(),
        created_at: createdDate.toISOString(), // Legacy field
        updatedAt: new Date().toISOString(),
        updated_at: new Date().toISOString(), // Legacy field
        createdBy: 'system',
        created_by: 'system', // Legacy field
        updatedBy: 'system',
        updated_by: 'system', // Legacy field
        locationId: 'location_001',
        location_id: 'location_001', // Legacy field
        customer: {
          id: customerId,
          name: customer.name,
          contact: customer.contact,
          email: customer.email,
          address: `${Math.floor(Math.random() * 999) + 1}, Sector ${Math.floor(Math.random() * 50) + 1}, ${['Bangalore', 'Mumbai', 'Delhi', 'Chennai', 'Hyderabad'][Math.floor(Math.random() * 5)]}`,
          vehicleRegNo: vehicleNo,
          createdAt: createdDate.toISOString(),
          created_at: createdDate.toISOString(), // Legacy field
          updatedAt: new Date().toISOString(),
          updated_at: new Date().toISOString(), // Legacy field
        },
      };
    });
  }

  private getMockTickets(limit: number = 10): ServiceTicket[] {
    // Cache generated tickets for consistency (but refresh every app restart)
    if (!this.cachedMockTickets) {
      this.cachedMockTickets = this.generateMockTickets(50);
    }
    return this.cachedMockTickets.slice(0, limit);
  }
  
  // Clear cached mock tickets (for debugging)
  clearMockTicketsCache(): void {
    this.cachedMockTickets = null;
  }

  private cachedMockTickets: ServiceTicket[] | null = null;

  // Fetch recent tickets
  async getRecentTickets(limit: number = 10): Promise<ServiceTicket[]> {
    if (this.isMockMode()) {
      return this.getMockTickets(limit);
    }
    
    try {
      const { data, error } = await supabase
        .from('service_tickets')
        .select(`
          *,
          customer:customers(*)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching recent tickets:', error);
      throw error;
    }
  }

  // Fetch tickets with filters and pagination
  async getTickets(
    filters: TicketFilters = {},
    page: number = 1,
    pageSize: number = 20
  ): Promise<PaginatedResponse<ServiceTicket>> {
    if (this.isMockMode()) {
      const mockTickets = this.getMockTickets(50); // Get more tickets for filtering
      let filteredTickets = mockTickets;
      
      // Apply status filtering
      if (filters.status && filters.status !== 'all') {
        filteredTickets = filteredTickets.filter(t => t.status === filters.status);
      }
      
      // Apply assignedTo filtering
      if (filters.assignedTo) {
        if (filters.assignedTo === 'unassigned') {
          filteredTickets = filteredTickets.filter(t => !t.assigned_to);
        } else if (filters.assignedTo !== 'all') {
          filteredTickets = filteredTickets.filter(t => t.assigned_to === filters.assignedTo);
        }
      }
      
      // Apply search filtering
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredTickets = filteredTickets.filter(t => 
          t.ticket_number.toLowerCase().includes(searchLower) ||
          t.symptom.toLowerCase().includes(searchLower) ||
          t.customer_complaint.toLowerCase().includes(searchLower)
        );
      }
      
      // Apply pagination
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
          customer:customers(*)
        `, { count: 'exact' });

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
        query = query.or(`ticket_number.ilike.%${filters.search}%,symptom.ilike.%${filters.search}%,customer_complaint.ilike.%${filters.search}%`);
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
            tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);
            query = query.gte('due_date', tomorrow.toISOString()).lt('due_date', dayAfterTomorrow.toISOString());
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

  private generateMockTeamWorkload(): TechnicianWorkload[] {
    const hour = new Date().getHours();
    const workingHours = hour >= 8 && hour <= 18;
    
    const technicians = [
      {
        id: 'tech_001',
        name: 'Rajesh Kumar',
        email: 'rajesh.kumar@evwheels.com',
        phone: '+91 9876543210',
        experience: '5 years',
        specialization: ['Battery Systems', 'Motor Repair'],
        rating: 4.8,
        completedTasks: 142,
        joinDate: '2019-03-15',
        baseCapacity: 8,
        currentLoad: workingHours ? 6 : 5,
        efficiency: 95,
        avgTAT: 2.1, // days
        status: 'active',
      },
      {
        id: 'tech_002', 
        name: 'Priya Sharma',
        email: 'priya.sharma@evwheels.com',
        phone: '+91 8765432109',
        experience: '7 years',
        specialization: ['Electrical Systems', 'Diagnostics'],
        rating: 4.9,
        completedTasks: 189,
        joinDate: '2017-08-22',
        baseCapacity: 8,
        currentLoad: workingHours ? 8 : 7,
        efficiency: 98,
        avgTAT: 1.8,
        status: 'active',
      },
      {
        id: 'tech_003',
        name: 'Amit Patel',
        email: 'amit.patel@evwheels.com',
        phone: '+91 7654321098', 
        experience: '3 years',
        specialization: ['Mechanical Repair', 'Body Work'],
        rating: 4.6,
        completedTasks: 87,
        joinDate: '2021-01-10',
        baseCapacity: 8,
        currentLoad: workingHours ? 5 : 4,
        efficiency: 88,
        avgTAT: 2.5,
        status: 'active',
      },
      {
        id: 'tech_004',
        name: 'Sneha Reddy',
        email: 'sneha.reddy@evwheels.com',
        phone: '+91 6543210987',
        experience: '2 years',
        specialization: ['Software Updates', 'Display Systems'],
        rating: 4.4,
        completedTasks: 45,
        joinDate: '2022-06-01',
        baseCapacity: 8,
        currentLoad: workingHours ? 3 : 2,
        efficiency: 82,
        avgTAT: 3.1,
        status: 'active',
      },
      {
        id: 'tech_005',
        name: 'Vikram Singh',
        email: 'vikram.singh@evwheels.com',
        phone: '+91 5432109876',
        experience: '6 years',
        specialization: ['Suspension', 'Brake Systems'],
        rating: 4.7,
        completedTasks: 156,
        joinDate: '2018-11-05',
        baseCapacity: 8,
        currentLoad: workingHours ? 7 : 6,
        efficiency: 91,
        avgTAT: 2.3,
        status: 'active',
      },
      {
        id: 'tech_006',
        name: 'Kavya Nair',
        email: 'kavya.nair@evwheels.com',
        phone: '+91 4321098765',
        experience: '4 years',
        specialization: ['Charging Systems', 'Connectivity'],
        rating: 4.5,
        completedTasks: 98,
        joinDate: '2020-09-12',
        baseCapacity: 8,
        currentLoad: workingHours ? 4 : 3,
        efficiency: 85,
        avgTAT: 2.7,
        status: 'active',
      },
      {
        id: 'tech_007',
        name: 'Arjun Mehta',
        email: 'arjun.mehta@evwheels.com',
        phone: '+91 3210987654',
        experience: '8 years',
        specialization: ['Senior Technician', 'Training'],
        rating: 4.9,
        completedTasks: 234,
        joinDate: '2016-02-18',
        baseCapacity: 10, // Senior tech with higher capacity
        currentLoad: workingHours ? 6 : 5,
        efficiency: 97,
        avgTAT: 1.6,
        status: 'active',
      },
      {
        id: 'tech_008',
        name: 'Ravi Krishnan',
        email: 'ravi.krishnan@evwheels.com',
        phone: '+91 2109876543',
        experience: '1 year',
        specialization: ['Trainee', 'Basic Repairs'],
        rating: 4.2,
        completedTasks: 23,
        joinDate: '2023-04-01',
        baseCapacity: 6, // Trainee with lower capacity
        currentLoad: workingHours ? 4 : 3,
        efficiency: 78,
        avgTAT: 3.5,
        status: 'training',
      },
    ];

    return technicians.map(tech => ({
      assignee: tech.id,
      count: tech.currentLoad,
      capacity: tech.baseCapacity,
      // Additional data for enhanced display
      name: tech.name,
      email: tech.email,
      phone: tech.phone,
      experience: tech.experience,
      specialization: tech.specialization,
      rating: tech.rating,
      completedTasks: tech.completedTasks,
      joinDate: tech.joinDate,
      efficiency: tech.efficiency,
      avgTAT: tech.avgTAT,
      status: tech.status,
    }));
  }

  private getMockTeamWorkload(): TechnicianWorkload[] {
    // Cache the generated workload for consistency
    if (!this.cachedTeamWorkload) {
      this.cachedTeamWorkload = this.generateMockTeamWorkload();
    }
    return this.cachedTeamWorkload;
  }

  private cachedTeamWorkload: TechnicianWorkload[] | null = null;

  // Get team workload
  async getTeamWorkload(): Promise<TechnicianWorkload[]> {
    if (this.isMockMode()) {
      return this.getMockTeamWorkload();
    }
    
    try {
      // 1. Get users with technician role
      const { data: technicianRoles, error: rolesError } = await supabase
        .from('app_roles')
        .select('user_id')
        .eq('role', 'technician');
      
      if (rolesError) {
        console.error('Error fetching technician roles for workload:', rolesError);
        throw rolesError;
      }
      
      if (!technicianRoles?.length) {
        return [];
      }
      
      const userIds = technicianRoles.map(r => r.user_id);
      
      // 2. Get profiles for those users
      const { data: technicians, error: techError } = await supabase
        .from('profiles')
        .select('user_id, username, email')
        .in('user_id', userIds)
        .eq('is_active', true);
        
      if (techError) {
        console.error('Error fetching technicians for workload:', techError);
        throw techError;
      }

      if (!technicians?.length) {
        return [];
      }

      // Get workload for each technician
      const workloadPromises = technicians.map(async (tech) => {
        const { data: tickets } = await supabase
          .from('service_tickets')
          .select('id')
          .eq('assigned_to', tech.user_id)
          .in('status', ['in_progress']);
          
        return {
          assignee: tech.user_id,
          count: tickets?.length || 0,
          capacity: 8, // Default capacity
        };
      });

      const workload = await Promise.all(workloadPromises);
      return workload;
    } catch (error) {
      console.error('Error fetching team workload:', error);
      throw error;
    }
  }

  // Get single ticket by ID
  async getTicketById(id: string): Promise<ServiceTicket | null> {
    if (this.isMockMode()) {
      const tickets = this.getMockTickets(50);
      return tickets.find(t => t.id === id) || null;
    }
    
    try {
      const { data: ticket, error } = await supabase
        .from('service_tickets')
        .select(`
          *,
          customer:customers(*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Ticket not found
        }
        throw error;
      }

      // Try to use foreign key relationship first, fall back to separate query
      let ticketWithCreator = ticket;
      
      // If the database supports foreign key relationships, try using them
      try {
        const { data: ticketWithJoin, error: joinError } = await supabase
          .from('service_tickets')
          .select(`
            *,
            customer:customers(*),
            creator:profiles!fk_service_tickets_created_by(user_id, username, email)
          `)
          .eq('id', id)
          .single();
          
        if (!joinError && ticketWithJoin) {
          ticketWithCreator = ticketWithJoin;
        } else {
          // Fall back to separate query for creator
          let creator = null;
          if (ticket?.created_by) {
            try {
              const { data: creatorData, error: creatorError } = await supabase
                .from('profiles')
                .select('user_id, username, email')
                .eq('user_id', ticket.created_by)
                .single();
                
              if (!creatorError) {
                creator = creatorData;
              }
            } catch (creatorError) {
              console.log('Could not fetch creator info:', creatorError);
            }
          }

          ticketWithCreator = {
            ...ticket,
            creator
          };
        }
      } catch (joinError) {
        // If join fails, fall back to separate query
        let creator = null;
        if (ticket?.created_by) {
          try {
            const { data: creatorData, error: creatorError } = await supabase
              .from('profiles')
              .select('user_id, username, email')
              .eq('user_id', ticket.created_by)
              .single();
              
            if (!creatorError) {
              creator = creatorData;
            }
          } catch (creatorError) {
            console.log('Could not fetch creator info:', creatorError);
          }
        }

        ticketWithCreator = {
          ...ticket,
          creator
        };
      }

      return ticketWithCreator;
    } catch (error) {
      console.error('Error fetching ticket by ID:', error);
      throw error;
    }
  }

  // Get tickets by technician - improved version
  async getTicketsByTechnician(technicianId: string): Promise<ServiceTicket[]> {
    if (this.isMockMode()) {
      const tickets = this.getMockTickets(50);
      return tickets.filter(t => t.assigned_to === technicianId);
    }
    
    try {
      const { data, error } = await supabase
        .from('service_tickets')
        .select(`
          *,
          customer:customers(*)
        `)
        .eq('assigned_to', technicianId)
        .in('status', ['assigned', 'in_progress'])
        .order('assigned_at', { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching tickets by technician:', error);
      throw error;
    }
  }

  // Update ticket status
  async updateTicketStatus(ticketId: string, status: string): Promise<ServiceTicket | null> {
    if (this.isMockMode()) {
      console.log(`Mock: Updated ticket ${ticketId} status to ${status}`);
      const ticket = await this.getTicketById(ticketId);
      if (ticket) {
        ticket.status = status as any;
        ticket.updatedAt = new Date().toISOString();
      }
      return ticket;
    }
    
    try {
      const { data, error } = await supabase
        .from('service_tickets')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId)
        .select(`
          *,
          customer:customers(*)
        `)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error updating ticket status:', error);
      throw error;
    }
  }

  // Create new ticket
  async createTicket(ticketData: CreateTicketForm): Promise<ServiceTicket> {
    try {
      const { data, error } = await supabase
        .from('service_tickets')
        .insert({
          customer_id: ticketData.customerId,
          symptom: ticketData.symptom,
          description: ticketData.description,
          vehicle_make: ticketData.vehicleMake,
          vehicle_model: ticketData.vehicleModel,
          vehicle_reg_no: ticketData.vehicleRegNo,
          vehicle_year: ticketData.vehicleYear,
          priority: ticketData.priority || 3,
          status: 'reported',
        })
        .select(`
          *,
          customer:customers(*)
        `)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error creating ticket:', error);
      throw error;
    }
  }

  // Update ticket
  async updateTicket(id: string, updates: UpdateTicketForm): Promise<ServiceTicket> {
    try {
      const { data, error } = await supabase
        .from('service_tickets')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          customer:customers(*)
        `)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error updating ticket:', error);
      throw error;
    }
  }

  // Assign ticket to technician
  async assignTicket(ticketId: string, technicianId: string, dueDate?: string): Promise<ServiceTicket> {
    try {
      const updates: any = {
        assigned_to: technicianId,
        status: 'in_progress', // Use 'in_progress' as it's semantically correct for assigned work
      };

      if (dueDate) {
        updates.due_date = dueDate;
      }

      const { data, error } = await supabase
        .from('service_tickets')
        .update(updates)
        .eq('id', ticketId)
        .select(`
          *,
          customer:customers(*)
        `)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error assigning ticket:', error);
      throw error;
    }
  }

  // Get technicians (for team management)
  async getTechnicians(): Promise<any[]> {
    if (this.isMockMode()) {
      return [
        { id: 'tech_001', first_name: 'Rajesh', last_name: 'Kumar', email: 'rajesh.kumar@evwheels.com' },
        { id: 'tech_002', first_name: 'Priya', last_name: 'Sharma', email: 'priya.sharma@evwheels.com' },
        { id: 'tech_003', first_name: 'Amit', last_name: 'Patel', email: 'amit.patel@evwheels.com' },
        { id: 'tech_004', first_name: 'Sneha', last_name: 'Reddy', email: 'sneha.reddy@evwheels.com' },
        { id: 'tech_005', first_name: 'Vikram', last_name: 'Singh', email: 'vikram.singh@evwheels.com' },
        { id: 'tech_006', first_name: 'Kavya', last_name: 'Nair', email: 'kavya.nair@evwheels.com' },
      ];
    }
    
    try {
      // 1. Get users with technician role
      const { data: technicianRoles, error: rolesError } = await supabase
        .from('app_roles')
        .select('user_id')
        .eq('role', 'technician');
      
      if (rolesError) throw rolesError;
      if (!technicianRoles?.length) return [];
      
      const userIds = technicianRoles.map(r => r.user_id);
      
      // 2. Get profiles for those users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, username, email, first_name, last_name')
        .in('user_id', userIds)
        .eq('is_active', true);
      
      if (profilesError) throw profilesError;
      
      // Transform the data to match expected format
      const transformedData = profiles?.map(p => ({
        id: p.user_id,
        first_name: p.first_name || p.username,
        last_name: p.last_name || '',
        email: p.email
      }));

      return transformedData || [];
    } catch (error) {
      console.error('Error fetching technicians:', error);
      throw error;
    }
  }

  // Get ticket attachments
  async getTicketAttachments(ticketId: string): Promise<any[]> {
    if (this.isMockMode()) {
      // Mock attachments data - return empty for now to avoid confusion
      return [];
    }
    
    try {
      const { data, error } = await supabase
        .from('ticket_attachments')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('uploaded_at', { ascending: true });

      if (error) throw error;

      // Transform data to match expected format
      const attachments = (data || []).map(att => ({
        ...att,
        // Add compatibility fields
        attachmentType: att.attachment_type,
        fileName: att.file_name,
        originalName: att.original_name,
        fileSize: att.file_size,
        mimeType: att.mime_type,
        storagePath: att.storage_path,
        uploadedAt: att.uploaded_at,
        uploadedBy: att.uploaded_by,
        ticketId: att.ticket_id,
      }));

      return attachments;
    } catch (error) {
      console.error('Error fetching ticket attachments:', error);
      throw error;
    }
  }

  // Get signed URL for attachment (especially images)
  async getAttachmentSignedUrl(storagePath: string, attachmentType: string): Promise<string | null> {
    if (this.isMockMode()) {
      // Return a placeholder image for mock mode
      return 'https://via.placeholder.com/300x200/3B82F6/FFFFFF?text=Sample+Image';
    }
    
    try {
      // Determine the storage bucket based on attachment type
      let bucket = 'ticket-attachments';
      if (attachmentType === 'photo') {
        bucket = 'media-photos';
      } else if (attachmentType === 'audio') {
        bucket = 'media-audio';
      }
      
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(storagePath, 3600); // 1 hour expiry

      if (error) {
        console.error('Error creating signed URL:', error);
        return null;
      }

      return data?.signedUrl || null;
    } catch (error) {
      console.error('Error getting signed URL:', error);
      return null;
    }
  }

  // Get customers (for creating tickets)
  async getCustomers(): Promise<Customer[]> {
    if (this.isMockMode()) {
      return [
        { id: 'cust1', name: 'Rajesh Kumar', phone: '+91 9876543210', email: 'rajesh@email.com' },
        { id: 'cust2', name: 'Priya Sharma', phone: '+91 9876543211', email: 'priya@email.com' },
      ];
    }
    
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name');

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }
  }

  // Triage ticket - create cases and route ticket (manual implementation)
  async triageTicket(params: {
    ticketId: string;
    routeTo: 'vehicle' | 'battery' | 'both';
    note?: string;
  }): Promise<{ vehicle_case_id?: string; battery_case_id?: string }> {
    if (this.isMockMode()) {
      console.log(`Mock: Triaging ticket ${params.ticketId} to ${params.routeTo}`);
      // Mock successful triage
      const result: { vehicle_case_id?: string; battery_case_id?: string } = {};
      if (params.routeTo === 'vehicle' || params.routeTo === 'both') {
        result.vehicle_case_id = `vehicle_case_${Date.now()}`;
      }
      if (params.routeTo === 'battery' || params.routeTo === 'both') {
        result.battery_case_id = `battery_case_${Date.now()}`;
      }
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return result;
    }
    
    try {
      const result: { vehicle_case_id?: string; battery_case_id?: string } = {};
      
      // Get the original ticket to extract information for cases
      const { data: ticket, error: ticketError } = await supabase
        .from('service_tickets')
        .select('*')
        .eq('id', params.ticketId)
        .single();
        
      if (ticketError) throw ticketError;
      if (!ticket) throw new Error('Ticket not found');
      
      // Create vehicle case if needed
      if (params.routeTo === 'vehicle' || params.routeTo === 'both') {
        // Check if vehicle record exists for this ticket
        const { data: existingVehicleRecord, error: vehicleRecordError } = await supabase
          .from('vehicle_records')
          .select('id')
          .eq('service_ticket_id', params.ticketId)
          .maybeSingle(); // Use maybeSingle to handle case where no record exists
          
        if (vehicleRecordError) throw vehicleRecordError;
        
        let vehicleRecordId: string;
        
        if (!existingVehicleRecord) {
          // Try to find existing vehicle record by registration number first
          let existingByRegNo = null;
          if (ticket.vehicle_reg_no) {
            const { data: regNoRecord } = await supabase
              .from('vehicle_records')
              .select('id')
              .eq('vehicle_reg_no', ticket.vehicle_reg_no)
              .maybeSingle();
            existingByRegNo = regNoRecord;
          }
          
          if (existingByRegNo) {
            // Use existing vehicle record if found by registration number
            vehicleRecordId = existingByRegNo.id;
            
            // Update the existing record to link to this ticket
            await supabase
              .from('vehicle_records')
              .update({
                service_ticket_id: params.ticketId,
                updated_at: new Date().toISOString(),
                updated_by: ticket.updated_by || ticket.created_by,
              })
              .eq('id', vehicleRecordId);
          } else {
            // Create a new vehicle record with unique registration number
            const uniqueRegNo = ticket.vehicle_reg_no || `TRG-${params.ticketId.slice(-8)}-${Date.now().toString().slice(-4)}`;
            
            const { data: newVehicleRecord, error: createVehicleError } = await supabase
              .from('vehicle_records')
              .insert({
                service_ticket_id: params.ticketId,
                vehicle_make: ticket.vehicle_make || 'Unknown',
                vehicle_model: ticket.vehicle_model || 'Unknown', 
                vehicle_reg_no: uniqueRegNo,
                vehicle_year: ticket.vehicle_year,
                condition_notes: 'Created during triage process',
                status: 'received',
                customer_id: ticket.customer_id,
                created_by: ticket.created_by || ticket.updated_by,
                updated_by: ticket.updated_by || ticket.created_by,
              })
              .select('id')
              .single();
              
            if (createVehicleError) throw createVehicleError;
            vehicleRecordId = newVehicleRecord.id;
          }
        } else {
          vehicleRecordId = existingVehicleRecord.id;
        }
        
        // Create vehicle service case
        const { data: vehicleCase, error: vehicleCaseError } = await supabase
          .from('vehicle_cases')
          .insert({
            service_ticket_id: params.ticketId,
            vehicle_record_id: vehicleRecordId,
            customer_id: ticket.customer_id, // Add customer_id for consistency
            initial_diagnosis: params.note || 'Pending initial diagnosis',
            status: 'received',
            created_by: ticket.created_by || ticket.updated_by,
            updated_by: ticket.updated_by || ticket.created_by,
          })
          .select('id')
          .single();
          
        if (vehicleCaseError) throw vehicleCaseError;
        result.vehicle_case_id = vehicleCase.id;
        
        // Update ticket to link to vehicle case and record
        const vehicleUpdateData: any = {
          vehicle_case_id: vehicleCase.id,
          customer_bringing: params.routeTo === 'both' ? 'both' : 'vehicle'
        };
        
        // If we created a new vehicle record, link it to the ticket
        if (!existingVehicleRecord) {
          vehicleUpdateData.vehicle_record_id = vehicleRecordId;
        }
        
        await supabase
          .from('service_tickets')
          .update(vehicleUpdateData)
          .eq('id', params.ticketId);
      }
      
      // Create battery cases if needed
      if (params.routeTo === 'battery' || params.routeTo === 'both') {
        // Get existing battery records for this ticket (there can be multiple)
        const { data: existingBatteryRecords, error: batteryRecordError } = await supabase
          .from('battery_records')
          .select('id')
          .eq('service_ticket_id', params.ticketId);
          
        if (batteryRecordError) throw batteryRecordError;
        
        let batteryRecords = existingBatteryRecords || [];
        
        if (batteryRecords.length === 0) {
          // Create a basic battery record if none exists
          // Generate a unique serial number to avoid conflicts
          const uniqueSerialNo = `TRG-BAT-${params.ticketId.slice(-8)}-${Date.now().toString().slice(-4)}`;
          
          const { data: newBatteryRecord, error: createBatteryError } = await supabase
            .from('battery_records')
            .insert({
              service_ticket_id: params.ticketId,
              serial_number: uniqueSerialNo,
              brand: 'Unknown',
              battery_type: 'li-ion',
              voltage: 0,
              capacity: 0,
              repair_notes: 'Created during triage process',
              status: 'received',
              customer_id: ticket.customer_id,
              created_by: ticket.created_by || ticket.updated_by,
              updated_by: ticket.updated_by || ticket.created_by,
            })
            .select('id')
            .single();
            
          if (createBatteryError) throw createBatteryError;
          batteryRecords = [newBatteryRecord];
        }
        
        // Create battery service cases for each battery record
        const batteryCasePromises = batteryRecords.map(async (batteryRecord) => {
          const { data: batteryCase, error: batteryCaseError } = await supabase
            .from('battery_cases')
            .insert({
              service_ticket_id: params.ticketId,
              battery_record_id: batteryRecord.id,
              customer_id: ticket.customer_id, // Add required customer_id field
              initial_diagnosis: params.note || 'Pending initial diagnosis',
              status: 'received',
              created_by: ticket.created_by || ticket.updated_by,
              updated_by: ticket.updated_by || ticket.created_by,
            })
            .select('id')
            .single();
            
          if (batteryCaseError) throw batteryCaseError;
          return batteryCase;
        });
        
        const batteryCases = await Promise.all(batteryCasePromises);
        // Use the first battery case as the primary one for the ticket link
        result.battery_case_id = batteryCases[0].id;
        
        // Update ticket to link to primary battery case
        const updateData: any = { 
          battery_case_id: batteryCases[0].id 
        };
        
        // Set customer_bringing based on route type
        if (params.routeTo === 'battery') {
          updateData.customer_bringing = 'battery';
        } else if (params.routeTo === 'both') {
          updateData.customer_bringing = 'both';
        }
        
        await supabase
          .from('service_tickets')
          .update(updateData)
          .eq('id', params.ticketId);
      }
      
      // Update ticket status to 'triaged' with triage info
      await supabase
        .from('service_tickets')
        .update({
          status: 'triaged',
          triaged_at: new Date().toISOString(),
          triage_notes: params.note || `Triaged to: ${params.routeTo}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', params.ticketId);
      
      return result;
    } catch (error) {
      console.error('Error triaging ticket:', error);
      throw error;
    }
  }

  // Status Updates - Custom progress updates for each status
  async getStatusUpdates(ticketId: string): Promise<any[]> {
    if (this.isMockMode()) {
      // Mock status updates for demo
      return [
        {
          id: 'update_1',
          ticket_id: ticketId,
          status: 'reported',
          update_text: 'Customer complaint received and logged in system',
          created_by: 'system',
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          user_name: 'System',
          is_system_update: true,
        },
        {
          id: 'update_2',
          ticket_id: ticketId,
          status: 'triaged',
          update_text: 'Initial assessment complete. Battery diagnostics recommended.',
          created_by: 'floor_manager_001',
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          user_name: 'Floor Manager',
          is_system_update: false,
        },
        {
          id: 'update_3',
          ticket_id: ticketId,
          status: 'in_progress',
          update_text: 'Started diagnostic tests. Checking battery voltage and connections.',
          created_by: 'tech_001',
          created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          user_name: 'Rajesh Kumar',
          is_system_update: false,
        },
      ];
    }
    
    try {
      // 1. Get status updates for the ticket
      const { data: updates, error: updatesError } = await supabase
        .from('ticket_status_updates')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });
      
      if (updatesError) throw updatesError;
      if (!updates?.length) return [];
      
      // 2. Get unique user IDs from the updates
      const userIds = [...new Set(updates
        .map(u => u.created_by)
        .filter(Boolean))];
      
      let profiles = [];
      if (userIds.length > 0) {
        // 3. Get profiles for those users
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, username, email, first_name, last_name')
          .in('user_id', userIds);
        
        if (profilesError) {
          console.warn('Error fetching profiles for status updates:', profilesError);
          // Continue without profile info rather than failing
        } else {
          profiles = profilesData || [];
        }
      }
      
      // 4. Combine updates with profile data
      return updates.map(update => {
        const profile = profiles.find(p => p.user_id === update.created_by);
        return {
          ...update,
          user: profile || null,
          user_name: profile?.username || profile?.email || 'System'
        };
      });
    } catch (error) {
      console.error('Error fetching status updates:', error);
      throw error;
    }
  }

  async addStatusUpdate(params: {
    ticketId: string;
    status: string;
    updateText: string;
    isSystemUpdate?: boolean;
  }): Promise<any> {
    if (this.isMockMode()) {
      console.log(`Mock: Adding status update for ticket ${params.ticketId}`);
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        id: `update_${Date.now()}`,
        ticket_id: params.ticketId,
        status: params.status,
        update_text: params.updateText,
        created_by: 'current_user',
        created_at: new Date().toISOString(),
        user_name: 'Current User',
        is_system_update: params.isSystemUpdate || false,
      };
    }
    
    try {
      // Get current user to set created_by appropriately
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      const insertData: any = {
        ticket_id: params.ticketId,
        status: params.status,
        update_text: params.updateText,
        is_system_update: params.isSystemUpdate || false,
      };
      
      // Only set created_by if we have an authenticated user
      // For unauthenticated access (development), leave it null
      if (currentUser) {
        insertData.created_by = currentUser.id;
      }
      
      const { data, error } = await supabase
        .from('ticket_status_updates')
        .insert(insertData)
        .select('*')
        .single();

      if (error) throw error;
      
      // Get user profile separately if we have a created_by user
      let profile = null;
      if (data.created_by) {
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('user_id, username, email, first_name, last_name')
            .eq('user_id', data.created_by)
            .single();
          
          if (!profileError) {
            profile = profileData;
          }
        } catch (profileError) {
          console.warn('Could not fetch user profile for status update:', profileError);
        }
      }

      return {
        ...data,
        user: profile,
        user_name: profile?.username || profile?.email || 'System'
      };
    } catch (error) {
      console.error('Error adding status update:', error);
      throw error;
    }
  }

  async deleteStatusUpdate(updateId: string): Promise<boolean> {
    if (this.isMockMode()) {
      console.log(`Mock: Deleting status update ${updateId}`);
      return true;
    }
    
    try {
      const { error } = await supabase
        .from('ticket_status_updates')
        .delete()
        .eq('id', updateId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting status update:', error);
      throw error;
    }
  }

}

export const jobCardsService = new JobCardsService();
