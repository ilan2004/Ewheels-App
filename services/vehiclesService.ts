import { supabase } from '@/lib/supabase';
import { VehicleCase, CaseFilters, PaginatedResponse } from '@/types';

export class VehiclesService {
  // Check if we're in mock mode - only use mock when explicitly enabled
  private isMockMode(): boolean {
    return (process.env.EXPO_PUBLIC_USE_MOCK_API === 'true') || (process.env.USE_MOCK_API === 'true');
  }

  // Generate mock vehicle cases
  private generateMockVehicles(limit: number = 10): VehicleCase[] {
    const vehicleMakes = ['Ola', 'Ather', 'TVS', 'Bajaj', 'Hero Electric', 'Okinawa'];
    const vehicleModels = ['S1 Pro', '450X', 'iQube', 'Chetak', 'Optima', 'Praise Pro'];
    const statuses: Array<'received' | 'diagnosed' | 'in_progress' | 'completed' | 'delivered'> = 
      ['received', 'diagnosed', 'in_progress', 'completed', 'delivered'];

    return Array.from({ length: limit }, (_, index) => {
      const make = vehicleMakes[index % vehicleMakes.length];
      const model = vehicleModels[index % vehicleModels.length];
      const regNo = `KA${String(index + 1).padStart(2, '0')}AB${String(index + 1000).padStart(4, '0')}`;
      const status = statuses[index % statuses.length];
      
      const createdDate = new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000);
      const receivedDate = new Date(createdDate.getTime() + Math.random() * 24 * 60 * 60 * 1000);

      return {
        id: `vehicle_${String(index + 1).padStart(3, '0')}`,
        service_ticket_id: `ticket_${String(index + 1).padStart(3, '0')}`,
        vehicle_make: make,
        vehicle_model: model,
        vehicle_reg_no: regNo,
        vehicle_year: 2020 + Math.floor(Math.random() * 4),
        vehicle_color: ['Red', 'Blue', 'White', 'Black', 'Silver'][Math.floor(Math.random() * 5)],
        vehicle_type: 'Electric Scooter',
        status,
        initial_diagnosis: index % 3 === 0 ? 'Motor noise during acceleration' : 
                          index % 3 === 1 ? 'Brake system needs adjustment' : 'Electrical system diagnostic required',
        symptoms_observed: 'Customer reported issues with performance and handling',
        diagnostic_notes: status !== 'received' ? 'Initial diagnostic tests completed. Further analysis required.' : null,
        repair_notes: ['in_progress', 'completed', 'delivered'].includes(status) ? 'Repair work in progress according to diagnostic findings.' : null,
        technician_notes: status === 'in_progress' ? 'Working on identified issues. Parts ordered.' : null,
        parts_required: ['in_progress', 'completed', 'delivered'].includes(status) ? ['Brake Pads', 'Chain Lubricant'] : null,
        labor_hours: status === 'completed' ? 2.5 + Math.random() * 3 : null,
        estimated_cost: 1500 + Math.random() * 2000,
        final_cost: status === 'completed' ? 1200 + Math.random() * 1800 : null,
        // Assignment is handled via service_ticket relationship
        received_at: receivedDate.toISOString(),
        diagnosed_at: status !== 'received' ? new Date(receivedDate.getTime() + 2 * 60 * 60 * 1000).toISOString() : null,
        completed_at: status === 'completed' ? new Date(receivedDate.getTime() + 24 * 60 * 60 * 1000).toISOString() : null,
        delivered_at: status === 'delivered' ? new Date(receivedDate.getTime() + 26 * 60 * 60 * 1000).toISOString() : null,
        created_at: createdDate.toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'system',
        updated_by: 'system',
        location_id: 'location_001',
      };
    });
  }

  private mockVehicles: VehicleCase[] | null = null;

  private getMockVehicles(limit: number = 10): VehicleCase[] {
    if (!this.mockVehicles) {
      this.mockVehicles = this.generateMockVehicles(50);
    }
    return this.mockVehicles.slice(0, limit);
  }

  // Get vehicles assigned to current technician via service tickets (two-step to avoid FK name dependency)
  async getMyVehicles(technicianId?: string): Promise<VehicleCase[]> {
    if (this.isMockMode()) {
      const mockVehicles = this.getMockVehicles(20);
      // In mock mode, return vehicles with various statuses to simulate assignment
      return mockVehicles.filter(v => ['diagnosed', 'in_progress', 'completed', 'delivered'].includes(v.status));
    }

    try {
      if (!technicianId) {
        return [];
      }

      // 1) Get tickets assigned to technician that have a vehicle case
      const { data: tickets, error: ticketsError } = await supabase
        .from('service_tickets')
        .select('id, assigned_to, ticket_number, customer_complaint, vehicle_case_id, customer_id')
        .eq('assigned_to', technicianId)
        .not('vehicle_case_id', 'is', null)
        .order('created_at', { ascending: false });

      if (ticketsError) throw ticketsError;
      const vehicleIds = (tickets || []).map(t => t.vehicle_case_id).filter(Boolean) as string[];
      if (vehicleIds.length === 0) return [];

      // 2) Fetch vehicle records by those IDs
      const { data: vehicles, error: vehiclesError } = await supabase
        .from('vehicle_records')
        .select('*')
        .in('id', vehicleIds);

      if (vehiclesError) throw vehiclesError;

      // Attach ticket info for convenience
      const byId: Record<string, any> = {};
      (tickets || []).forEach(t => { if (t.vehicle_case_id) byId[t.vehicle_case_id] = t; });

      const enriched = (vehicles || []).map(v => ({
        ...v,
        service_ticket: byId[v.id] ? {
          id: byId[v.id].id,
          assigned_to: byId[v.id].assigned_to,
          ticket_number: byId[v.id].ticket_number,
          customer_complaint: byId[v.id].customer_complaint,
        } : undefined,
      }));

      // Keep same order as tickets query
      const orderIndex: Record<string, number> = {};
      vehicleIds.forEach((id, idx) => { orderIndex[id] = idx; });

      return enriched.sort((a, b) => (orderIndex[a.id] ?? 0) - (orderIndex[b.id] ?? 0));
    } catch (error) {
      console.error('Error fetching my vehicles:', error);
      throw error;
    }
  }

  // Get all vehicles with filters
  async getVehicles(
    filters: CaseFilters = {},
    page: number = 1,
    pageSize: number = 20
  ): Promise<PaginatedResponse<VehicleCase>> {
    if (this.isMockMode()) {
      const mockVehicles = this.getMockVehicles(50);
      let filteredVehicles = mockVehicles;

      // Apply filters
      if (filters.status && filters.status !== 'all') {
        filteredVehicles = filteredVehicles.filter(v => v.status === filters.status);
      }

      if (filters.assignedTo) {
        if (filters.assignedTo === 'unassigned') {
          // In mock mode, simulate unassigned as 'received' status
          filteredVehicles = filteredVehicles.filter(v => v.status === 'received');
        } else if (filters.assignedTo !== 'all') {
          // In mock mode, can't filter by specific technician, show all assigned
          filteredVehicles = filteredVehicles.filter(v => v.status !== 'received');
        }
      }

      if (filters.search) {
        filteredVehicles = filteredVehicles.filter(v =>
          v.vehicle_reg_no.toLowerCase().includes(filters.search!.toLowerCase()) ||
          v.vehicle_make.toLowerCase().includes(filters.search!.toLowerCase()) ||
          v.vehicle_model.toLowerCase().includes(filters.search!.toLowerCase())
        );
      }

      // Apply pagination
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const paginatedData = filteredVehicles.slice(start, end);

      return {
        data: paginatedData,
        count: filteredVehicles.length,
        page,
        pageSize,
        totalPages: Math.ceil(filteredVehicles.length / pageSize),
      };
    }

    try {
      // Base query without join
      let query = supabase
        .from('vehicle_records')
        .select('*', { count: 'exact' });

      // Apply status/search filters directly on vehicle_cases
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters.search) {
        query = query.or(`vehicle_reg_no.ilike.%${filters.search}%,vehicle_make.ilike.%${filters.search}%,vehicle_model.ilike.%${filters.search}%`);
      }

      // Execute base query first (we need count after potential intersection)
      const offset = (page - 1) * pageSize;
      query = query.order('created_at', { ascending: false }).range(offset, offset + pageSize - 1);
      const { data: vehiclesPage, error: baseError, count } = await query;
      if (baseError) throw baseError;

      let data = vehiclesPage || [];

      // If assignedTo filter is used, intersect with service_tickets assigned_to
      if (filters.assignedTo) {
        if (filters.assignedTo === 'unassigned') {
          // Tickets with no assigned tech but having this vehicle id
          const { data: tickets, error: tErr } = await supabase
            .from('service_tickets')
            .select('vehicle_case_id')
            .is('assigned_to', null)
            .not('vehicle_case_id', 'is', null);
          if (tErr) throw tErr;
          const allowed = new Set((tickets || []).map(t => t.vehicle_case_id));
          data = data.filter(v => allowed.has(v.id));
        } else if (filters.assignedTo !== 'all') {
          const { data: tickets, error: tErr } = await supabase
            .from('service_tickets')
            .select('vehicle_case_id')
            .eq('assigned_to', filters.assignedTo)
            .not('vehicle_case_id', 'is', null);
          if (tErr) throw tErr;
          const allowed = new Set((tickets || []).map(t => t.vehicle_case_id));
          data = data.filter(v => allowed.has(v.id));
        }
      }

      return {
        data,
        count: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      };
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      throw error;
    }
  }

  // Get vehicle case by ID
  async getVehicle(id: string): Promise<VehicleCase | null> {
    if (this.isMockMode()) {
      const mockVehicles = this.getMockVehicles(50);
      return mockVehicles.find(v => v.id === id) || null;
    }

    try {
      const { data, error } = await supabase
        .from('vehicle_records')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Vehicle case not found
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching vehicle:', error);
      throw error;
    }
  }

  // Update vehicle case
  async updateVehicle(id: string, updates: Partial<VehicleCase>): Promise<VehicleCase> {
    if (this.isMockMode()) {
      console.log(`Mock: Updating vehicle ${id}`, updates);
      const vehicle = await this.getVehicle(id);
      if (!vehicle) throw new Error('Vehicle not found');
      
      return { ...vehicle, ...updates, updated_at: new Date().toISOString() };
    }

    try {
      const { data, error } = await supabase
        .from('vehicle_records')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating vehicle:', error);
      throw error;
    }
  }

  // Update vehicle status with automatic timestamp updates
  async updateStatus(
    id: string, 
    status: 'received' | 'diagnosed' | 'in_progress' | 'completed' | 'delivered', 
    notes?: string
  ): Promise<VehicleCase> {
    const updates: any = { status };
    
    // Set appropriate timestamp based on status
    switch (status) {
      case 'diagnosed':
        if (!updates.diagnosed_at) updates.diagnosed_at = new Date().toISOString();
        break;
      case 'completed':
        if (!updates.completed_at) updates.completed_at = new Date().toISOString();
        break;
      case 'delivered':
        if (!updates.delivered_at) updates.delivered_at = new Date().toISOString();
        break;
    }

    if (notes) {
      updates.technician_notes = notes;
    }

    return this.updateVehicle(id, updates);
  }

  // Add diagnostic notes
  async updateDiagnostics(id: string, diagnostics: {
    initial_diagnosis?: string;
    symptoms_observed?: string;
    diagnostic_notes?: string;
    parts_required?: string[];
    estimated_cost?: number;
  }): Promise<VehicleCase> {
    return this.updateVehicle(id, diagnostics);
  }

  // Add repair notes and update progress
  async updateRepairProgress(id: string, progress: {
    repair_notes?: string;
    technician_notes?: string;
    labor_hours?: number;
    parts_required?: string[];
    final_cost?: number;
  }): Promise<VehicleCase> {
    return this.updateVehicle(id, progress);
  }

  // Get vehicle intake record by ID
  async getVehicleRecordById(id: string): Promise<any | null> {
    if (this.isMockMode()) {
      // Mock vehicle record data
      return {
        id,
        service_ticket_id: 'ticket_001',
        vehicle_make: 'Ola',
        vehicle_model: 'S1 Pro',
        vehicle_reg_no: 'KA01AB1234',
        vehicle_year: 2023,
        condition_notes: 'Vehicle in good condition, customer reports minor issues',
        status: 'received',
        created_at: new Date().toISOString(),
      };
    }

    try {
      const { data, error } = await supabase
        .from('vehicle_records')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching vehicle record:', error);
      throw error;
    }
  }

  // Alias for getVehicle for consistency with job card details page
  async getVehicleCaseById(id: string): Promise<VehicleCase | null> {
    return this.getVehicle(id);
  }

  // Note: Technician assignment is handled at the service_ticket level
  // Vehicle cases are linked to service tickets, which have assigned_to field
}

export const vehiclesService = new VehiclesService();
