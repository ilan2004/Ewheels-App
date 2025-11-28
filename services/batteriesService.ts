import { supabase } from '@/lib/supabase';
import { BatteryCase, BatteryRecord, CaseFilters, PaginatedResponse } from '@/types';

export class BatteriesService {
  // Check if we're in mock mode - only use mock when explicitly enabled
  private isMockMode(): boolean {
    return (process.env.EXPO_PUBLIC_USE_MOCK_API === 'true') || (process.env.USE_MOCK_API === 'true');
  }

  // Generate mock battery records
  private generateMockBatteries(limit: number = 10): BatteryRecord[] {
    const batteryMakes = ['Ola', 'Ather', 'TVS', 'Bajaj', 'Hero Electric'];
    const batteryModels = ['Li-3024', '450X-BAT', 'iQ-2836', 'CT-3648', 'HE-4872'];
    const batteryTypes: Array<'li-ion' | 'lfp' | 'nmc' | 'other'> = ['li-ion', 'lfp', 'nmc', 'other'];
    const bmsStatuses: Array<'ok' | 'faulty' | 'replaced' | 'unknown'> = ['ok', 'faulty', 'replaced', 'unknown'];
    const statuses: Array<'received' | 'diagnosed' | 'in_progress' | 'completed' | 'delivered'> =
      ['received', 'diagnosed', 'in_progress', 'completed', 'delivered'];

    return Array.from({ length: limit }, (_, index) => {
      const make = batteryMakes[index % batteryMakes.length];
      const model = batteryModels[index % batteryModels.length];
      const serialNumber = `BAT${String(index + 1000).padStart(6, '0')}`;
      const batterySerial = `${make.substring(0, 2).toUpperCase()}${String(index + 1000).padStart(4, '0')}`;
      const batteryType = batteryTypes[index % batteryTypes.length];
      const bmsStatus = bmsStatuses[index % bmsStatuses.length];
      const status = statuses[index % statuses.length];

      const createdDate = new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000);
      const receivedDate = new Date(createdDate.getTime() + Math.random() * 24 * 60 * 60 * 1000);

      // Generate realistic voltage and capacity values
      const nominalVoltage = batteryType === 'li-ion' ? 48 : batteryType === 'lfp' ? 51.2 : batteryType === 'nmc' ? 44.8 : 48;
      const capacity = 20 + Math.random() * 30; // 20-50 Ah

      // Generate cell voltages (assuming 13 cells for 48V battery)
      const cellCount = 13;
      const nominalCellVoltage = nominalVoltage / cellCount;
      const cellVoltages = Array.from({ length: cellCount }, () =>
        nominalCellVoltage + (Math.random() - 0.5) * 0.5 // ±0.25V variation
      );

      return {
        id: `battery_${String(index + 1).padStart(3, '0')}`,
        service_ticket_id: `ticket_${String(index + 1).padStart(3, '0')}`,
        serial_number: serialNumber,
        battery_serial: batterySerial,
        brand: make,
        battery_make: make,
        model: model,
        battery_model: model,
        battery_type: batteryType,
        voltage: nominalVoltage,
        capacity: Math.round(capacity * 10) / 10,
        status,
        initial_voltage: status !== 'received' ? nominalVoltage * (0.85 + Math.random() * 0.15) : null,
        final_voltage: status === 'completed' ? nominalVoltage * (0.95 + Math.random() * 0.05) : null,
        load_test_result: status !== 'received' ? 80 + Math.random() * 20 : null,
        ir_values: status !== 'received' ? [2.5 + Math.random() * 2, 3.1 + Math.random() * 2] : null,
        cell_voltages: status !== 'received' ? cellVoltages : null,
        bms_status: bmsStatus,
        repair_type: ['in_progress', 'completed', 'delivered'].includes(status) ?
          (index % 3 === 0 ? 'Cell Replacement' : index % 3 === 1 ? 'BMS Repair' : 'Charging System Fix') : null,
        cells_replaced: status === 'completed' && index % 3 === 0 ? Math.floor(Math.random() * 3) + 1 : null,
        diagnostic_notes: status !== 'received' ? 'Battery diagnostic tests completed. Analysis shows performance degradation.' : null,
        repair_notes: ['in_progress', 'completed', 'delivered'].includes(status) ? 'Repair work in progress according to diagnostic findings.' : null,
        technician_notes: status === 'in_progress' ? 'Working on identified issues. Parts ordered.' : null,
        estimated_cost: 2000 + Math.random() * 3000,
        final_cost: status === 'completed' ? 1800 + Math.random() * 2500 : null,
        // Assignment is handled via service_ticket relationship
        received_at: receivedDate.toISOString(),
        diagnosed_at: status !== 'received' ? new Date(receivedDate.getTime() + 4 * 60 * 60 * 1000).toISOString() : null,
        completed_at: status === 'completed' ? new Date(receivedDate.getTime() + 48 * 60 * 60 * 1000).toISOString() : null,
        delivered_at: status === 'delivered' ? new Date(receivedDate.getTime() + 52 * 60 * 60 * 1000).toISOString() : null,
        created_at: createdDate.toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'system',
        updated_by: 'system',
        location_id: 'location_001',
      };
    });
  }

  private mockBatteries: BatteryRecord[] | null = null;

  private getMockBatteries(limit: number = 10): BatteryRecord[] {
    if (!this.mockBatteries) {
      this.mockBatteries = this.generateMockBatteries(50);
    }
    return this.mockBatteries.slice(0, limit);
  }

  // Get batteries assigned to current technician via service tickets
  async getMyBatteries(technicianId?: string): Promise<BatteryCase[]> {
    if (this.isMockMode()) {
      const mockBatteries = this.getMockBatteries(20);
      // In mock mode, return batteries with various statuses to simulate assignment
      return mockBatteries.filter(b => ['diagnosed', 'in_progress', 'completed', 'delivered'].includes(b.status)) as any;
    }

    try {
      if (!technicianId) {
        return [];
      }

      // 1) Get tickets assigned to technician that have a battery case
      const { data: tickets, error: ticketsError } = await supabase
        .from('service_tickets')
        .select('id, assigned_to, ticket_number, customer_complaint, battery_case_id, status')
        .eq('assigned_to', technicianId)
        .not('battery_case_id', 'is', null)
        .order('created_at', { ascending: false });

      if (ticketsError) throw ticketsError;
      const batteryCaseIds = (tickets || []).map(t => t.battery_case_id).filter(Boolean) as string[];
      if (batteryCaseIds.length === 0) return [];

      // 2) Fetch battery cases
      const { data: cases, error: casesError } = await supabase
        .from('battery_cases')
        .select('*')
        .in('id', batteryCaseIds);

      if (casesError) throw casesError;

      // 3) Fetch linked battery records
      const recordIds = (cases || []).map(c => c.battery_record_id).filter(Boolean) as string[];
      let recordsById: Record<string, any> = {};

      if (recordIds.length > 0) {
        const { data: records, error: recordsError } = await supabase
          .from('battery_records')
          .select('*')
          .in('id', recordIds);

        if (recordsError) throw recordsError;
        (records || []).forEach(r => { recordsById[r.id] = r; });
      }

      // Attach ticket info and merge record data
      const ticketById: Record<string, any> = {};
      (tickets || []).forEach(t => { if (t.battery_case_id) ticketById[t.battery_case_id] = t; });

      const enriched = (cases || []).map(c => {
        const record = c.battery_record_id ? recordsById[c.battery_record_id] : {};
        const ticket = ticketById[c.id];
        let displayStatus = c.status;

        // Sync status with ticket if available
        if (ticket) {
          if (ticket.status === 'in_progress') displayStatus = 'in_progress';
          else if (ticket.status === 'completed') displayStatus = 'completed';
          else if (ticket.status === 'delivered') displayStatus = 'delivered';
          else if (ticket.status === 'triaged') displayStatus = 'triaged';
          else if (ticket.status === 'assigned') displayStatus = 'received'; // "New" for tech
        }

        return {
          ...record, // Base properties from record
          ...c,      // Override with case properties (status, etc)
          status: displayStatus,
          // Map record fields to case fields expected by UI
          battery_make: c.battery_make || record.brand,
          battery_model: c.battery_model || record.model,
          battery_serial: c.battery_serial || record.serial_number,
          // Ensure technical specs are present
          voltage: c.voltage || record.voltage,
          capacity: c.capacity || record.capacity,
          battery_type: c.battery_type || record.battery_type,

          id: c.id, // Use Case ID
          service_ticket: ticket ? {
            id: ticket.id,
            assigned_to: ticket.assigned_to,
            ticket_number: ticket.ticket_number,
            customer_complaint: ticket.customer_complaint,
            status: ticket.status,
          } : undefined,

        };
      });

      // Keep same order as tickets query
      const orderIndex: Record<string, number> = {};
      batteryCaseIds.forEach((id, idx) => { orderIndex[id] = idx; });

      return enriched.sort((a, b) => (orderIndex[a.id] ?? 0) - (orderIndex[b.id] ?? 0));
    } catch (error) {
      console.error('Error fetching my batteries:', error);
      throw error;
    }
  }

  // Get all batteries with filters
  async getBatteries(
    filters: CaseFilters = {},
    page: number = 1,
    pageSize: number = 20
  ): Promise<PaginatedResponse<BatteryRecord>> {
    if (this.isMockMode()) {
      const mockBatteries = this.getMockBatteries(50);
      let filteredBatteries = mockBatteries;

      // Apply filters
      if (filters.status && filters.status !== 'all') {
        filteredBatteries = filteredBatteries.filter(b => b.status === filters.status);
      }

      if (filters.assignedTo) {
        if (filters.assignedTo === 'unassigned') {
          // In mock mode, simulate unassigned as 'received' status
          filteredBatteries = filteredBatteries.filter(b => b.status === 'received');
        } else if (filters.assignedTo !== 'all') {
          // In mock mode, can't filter by specific technician, show all assigned
          filteredBatteries = filteredBatteries.filter(b => b.status !== 'received');
        }
      }

      if (filters.search) {
        filteredBatteries = filteredBatteries.filter(b =>
          b.serial_number.toLowerCase().includes(filters.search!.toLowerCase()) ||
          b.brand.toLowerCase().includes(filters.search!.toLowerCase()) ||
          (b.model || '').toLowerCase().includes(filters.search!.toLowerCase())
        );
      }

      // Apply pagination
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const paginatedData = filteredBatteries.slice(start, end);

      return {
        data: paginatedData,
        count: filteredBatteries.length,
        page,
        pageSize,
        totalPages: Math.ceil(filteredBatteries.length / pageSize),
      };
    }

    try {
      // Base query without join
      let query = supabase
        .from('battery_records')
        .select('*', { count: 'exact' });

      // Apply status/search filters directly on battery_records
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters.search) {
        query = query.or(`serial_number.ilike.%${filters.search}%,brand.ilike.%${filters.search}%,model.ilike.%${filters.search}%`);
      }

      // Execute base query first (we need count after potential intersection)
      const offset = (page - 1) * pageSize;
      query = query.order('created_at', { ascending: false }).range(offset, offset + pageSize - 1);
      const { data: batteriesPage, error: baseError, count } = await query;
      if (baseError) throw baseError;

      let data = batteriesPage || [];

      // If assignedTo filter is used, intersect with service_tickets assigned_to
      if (filters.assignedTo) {
        if (filters.assignedTo === 'unassigned') {
          // Tickets with no assigned tech but having this battery id
          const { data: tickets, error: tErr } = await supabase
            .from('service_tickets')
            .select('battery_case_id')
            .is('assigned_to', null)
            .not('battery_case_id', 'is', null);
          if (tErr) throw tErr;
          const allowed = new Set((tickets || []).map(t => t.battery_case_id));
          data = data.filter(b => allowed.has(b.id));
        } else if (filters.assignedTo !== 'all') {
          const { data: tickets, error: tErr } = await supabase
            .from('service_tickets')
            .select('battery_case_id')
            .eq('assigned_to', filters.assignedTo)
            .not('battery_case_id', 'is', null);
          if (tErr) throw tErr;
          const allowed = new Set((tickets || []).map(t => t.battery_case_id));
          data = data.filter(b => allowed.has(b.id));
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
      console.error('Error fetching batteries:', error);
      throw error;
    }
  }

  // Get battery record by ID
  async getBattery(id: string): Promise<BatteryRecord | null> {
    if (this.isMockMode()) {
      const mockBatteries = this.getMockBatteries(50);
      return mockBatteries.find(b => b.id === id) || null;
    }

    try {
      const { data, error } = await supabase
        .from('battery_records')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Battery record not found
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching battery:', error);
      throw error;
    }
  }

  // Get battery case by ID
  async getBatteryCase(id: string): Promise<BatteryCase | null> {
    if (this.isMockMode()) {
      // Mock logic...
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('battery_cases')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Error fetching battery case:', error);
      throw error;
    }
  }

  // Update battery case
  async updateBatteryCase(id: string, updates: Partial<BatteryCase>): Promise<BatteryCase> {
    if (this.isMockMode()) {
      // Mock logic...
      return {} as BatteryCase;
    }

    try {
      const { data, error } = await supabase
        .from('battery_cases')
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
      console.error('Error updating battery case:', error);
      throw error;
    }
  }

  // Update battery record
  async updateBattery(id: string, updates: Partial<BatteryRecord>): Promise<BatteryRecord> {
    if (this.isMockMode()) {
      console.log(`Mock: Updating battery ${id}`, updates);
      const battery = await this.getBattery(id);
      if (!battery) throw new Error('Battery not found');

      return { ...battery, ...updates, updated_at: new Date().toISOString() };
    }

    try {
      const { data, error } = await supabase
        .from('battery_records')
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
      console.error('Error updating battery:', error);
      throw error;
    }
  }

  // Update battery status with automatic timestamp updates
  async updateStatus(
    id: string,
    status: 'received' | 'triaged' | 'diagnosed' | 'in_progress' | 'completed' | 'delivered',
    notes?: string
  ): Promise<BatteryCase> {
    const updates: any = { status };

    // Set appropriate timestamp based on status
    switch (status) {
      case 'triaged':
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

    return this.updateBatteryCase(id, updates);
  }

  // Update battery diagnostics
  async updateDiagnostics(id: string, diagnostics: {
    initial_voltage?: number;
    final_voltage?: number;
    load_test_result?: number;
    ir_values?: number[];
    cell_voltages?: number[];
    bms_status?: 'ok' | 'faulty' | 'replaced' | 'unknown';
    diagnostic_notes?: string;
    estimated_cost?: number;
  }): Promise<BatteryCase> {
    return this.updateBatteryCase(id, diagnostics);
  }

  // Add repair notes and update progress
  async updateRepairProgress(id: string, progress: {
    repair_type?: string;
    repair_notes?: string;
    technician_notes?: string;
    cells_replaced?: number;
    bms_status?: 'ok' | 'faulty' | 'replaced' | 'unknown';
    final_cost?: number;
    final_voltage?: number;
  }): Promise<BatteryCase> {
    return this.updateBatteryCase(id, progress);
  }

  // Run battery diagnostic tests
  async runDiagnosticTest(id: string): Promise<{
    voltage: number;
    loadTest: number;
    irValues: number[];
    cellVoltages: number[];
    bmsStatus: 'ok' | 'faulty' | 'replaced' | 'unknown';
  }> {
    if (this.isMockMode()) {
      // Simulate diagnostic test with realistic values
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate test time

      const battery = await this.getBattery(id);
      if (!battery) throw new Error('Battery not found');

      const cellCount = 13; // Standard for 48V battery
      const nominalCellVoltage = battery.voltage / cellCount;

      return {
        voltage: battery.voltage * (0.85 + Math.random() * 0.15),
        loadTest: 75 + Math.random() * 25,
        irValues: [2 + Math.random() * 3, 2.5 + Math.random() * 3],
        cellVoltages: Array.from({ length: cellCount }, () =>
          nominalCellVoltage * (0.95 + Math.random() * 0.1)
        ),
        bmsStatus: Math.random() > 0.7 ? 'faulty' : 'ok' as 'ok' | 'faulty'
      };
    }

    try {
      // In a real implementation, this would interface with diagnostic equipment
      // For now, we'll simulate the process
      throw new Error('Diagnostic equipment interface not implemented');
    } catch (error) {
      console.error('Error running diagnostic test:', error);
      throw error;
    }
  }

  // Note: Technician assignment is handled at the service_ticket level
  // Battery records are linked to service tickets, which have assigned_to field

  // Get battery health analysis
  async getBatteryHealthAnalysis(id: string): Promise<{
    healthScore: number;
    capacityRetention: number;
    voltageHealth: number;
    cellBalance: number;
    recommendations: string[];
  }> {
    if (this.isMockMode()) {
      const battery = await this.getBattery(id);
      if (!battery) throw new Error('Battery not found');

      // Simulate health analysis based on diagnostic data
      const healthScore = 65 + Math.random() * 30; // 65-95%
      const capacityRetention = 70 + Math.random() * 25; // 70-95%
      const voltageHealth = 80 + Math.random() * 18; // 80-98%
      const cellBalance = 75 + Math.random() * 20; // 75-95%

      const recommendations: string[] = [];
      if (healthScore < 80) recommendations.push('Consider battery replacement');
      if (capacityRetention < 80) recommendations.push('Capacity degradation detected');
      if (voltageHealth < 85) recommendations.push('Voltage irregularities found');
      if (cellBalance < 85) recommendations.push('Cell balancing required');
      if ((battery as any).bms_status === 'faulty') recommendations.push('BMS replacement needed');

      return {
        healthScore: Math.round(healthScore),
        capacityRetention: Math.round(capacityRetention),
        voltageHealth: Math.round(voltageHealth),
        cellBalance: Math.round(cellBalance),
        recommendations
      };
    }

    try {
      // In a real implementation, this would analyze the diagnostic data
      // and provide health metrics based on battery performance data
      throw new Error('Battery health analysis not implemented');
    } catch (error) {
      console.error('Error analyzing battery health:', error);
      throw error;
    }
  }

  // Get battery case by ID (SERVICE LAYER)
  async getBatteryCaseById(id: string): Promise<any | null> {
    if (this.isMockMode()) {
      // Mock battery case data
      return {
        id,
        service_ticket_id: 'ticket_001',
        battery_record_id: 'battery_record_001',
        initial_diagnosis: 'Battery diagnostic tests required',
        status: 'received',
        created_at: new Date().toISOString(),
      };
    }

    try {
      const { data, error } = await supabase
        .from('battery_cases')
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
      console.error('Error fetching battery case:', error);
      throw error;
    }
  }

  // Get battery records by service ticket ID (INTAKE LAYER)
  async getBatteryRecordsByTicket(ticketId: string): Promise<BatteryRecord[]> {
    if (this.isMockMode()) {
      // Mock battery records data
      return [
        {
          id: `battery_record_${ticketId}_1`,
          service_ticket_id: ticketId,
          serial_number: 'BAT001234',
          brand: 'Ola',
          model: 'S1 Pro Battery',
          battery_type: 'li-ion',
          voltage: 48,
          capacity: 30,
          cell_type: '18650',
          repair_notes: 'Battery appears in good condition, requires diagnostic testing',
          status: 'received',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ];
    }

    try {
      const { data, error } = await supabase
        .from('battery_records')
        .select('*')
        .eq('service_ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching battery records by ticket:', error);
      throw error;
    }
  }

  // Get battery cases by service ticket ID (SERVICE LAYER)
  async getBatteryCasesByTicket(ticketId: string): Promise<any[]> {
    if (this.isMockMode()) {
      // Mock battery cases data
      return [
        {
          id: `battery_case_${ticketId}_1`,
          service_ticket_id: ticketId,
          battery_record_id: `battery_record_${ticketId}_1`,
          initial_diagnosis: 'Battery requires cell voltage testing and capacity check',
          repair_type: 'diagnostic',
          status: 'received',
          assigned_technician: 'tech_001',
          estimated_cost: 2500.00,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ];
    }

    try {
      const { data, error } = await supabase
        .from('battery_cases')
        .select('*')
        .eq('service_ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching battery cases by ticket:', error);
      throw error;
    }
  }

  // Alias for getBattery for consistency with job card details page (INTAKE LAYER)
  async getBatteryRecordById(id: string): Promise<BatteryRecord | null> {
    return this.getBattery(id);
  }
}

export const batteriesService = new BatteriesService();
