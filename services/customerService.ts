import { supabase } from '@/lib/supabase';
import {
  Customer,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  CustomerSearchFilters,
  CustomerSearchResponse,
  CreateCustomerResponse,
  GetCustomerResponse,
} from '@/types/customer';

export class CustomerService {
  /**
   * Search customers by name, phone, or email
   */
  static async searchCustomers(
    filters: CustomerSearchFilters = {}
  ): Promise<CustomerSearchResponse> {
    try {
      const {
        query = '',
        location_id,
        limit = 20,
        offset = 0
      } = filters;

      let supabaseQuery = supabase
        .from('customers')
        .select('*', { count: 'exact' })
        .order('name', { ascending: true });

      // Apply search filter across multiple fields
      if (query.trim()) {
        const searchTerm = `%${query.trim()}%`;
        supabaseQuery = supabaseQuery.or(
          `name.ilike.${searchTerm},phone.ilike.${searchTerm},email.ilike.${searchTerm},contact.ilike.${searchTerm}`
        );
      }

      // Apply location filter if provided
      if (location_id) {
        supabaseQuery = supabaseQuery.eq('location_id', location_id);
      }

      // Apply pagination
      supabaseQuery = supabaseQuery.range(offset, offset + limit - 1);

      const { data, error, count } = await supabaseQuery;

      if (error) throw error;

      return {
        customers: data || [],
        total: count || 0,
        hasMore: (count || 0) > offset + limit,
      };
    } catch (error) {
      console.error('Error searching customers:', error);
      return {
        customers: [],
        total: 0,
        hasMore: false,
      };
    }
  }

  /**
   * Get customer by ID
   */
  static async getCustomerById(id: string): Promise<GetCustomerResponse> {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return {
        success: true,
        data: data as Customer,
      };
    } catch (error) {
      console.error('Error fetching customer:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch customer',
      };
    }
  }

  /**
   * Create a new customer
   */
  static async createCustomer(
    request: CreateCustomerRequest
  ): Promise<CreateCustomerResponse> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const customerData = {
        ...request,
        created_by: user.id,
        updated_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('customers')
        .insert(customerData)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data: data as Customer,
      };
    } catch (error) {
      console.error('Error creating customer:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create customer',
      };
    }
  }

  /**
   * Update an existing customer
   */
  static async updateCustomer(
    request: UpdateCustomerRequest
  ): Promise<CreateCustomerResponse> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { id, ...updateData } = request;
      const customerData = {
        ...updateData,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('customers')
        .update(customerData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data: data as Customer,
      };
    } catch (error) {
      console.error('Error updating customer:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update customer',
      };
    }
  }

  /**
   * Delete a customer
   */
  static async deleteCustomer(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting customer:', error);
      return false;
    }
  }

  /**
   * Get recent customers for quick access
   */
  static async getRecentCustomers(
    locationId?: string,
    limit: number = 10
  ): Promise<Customer[]> {
    try {
      let query = supabase
        .from('customers')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (locationId) {
        query = query.eq('location_id', locationId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching recent customers:', error);
      return [];
    }
  }

  /**
   * Check if customer exists by phone or email
   */
  static async checkCustomerExists(
    phone?: string,
    email?: string,
    excludeId?: string
  ): Promise<Customer | null> {
    try {
      if (!phone && !email) return null;

      let query = supabase.from('customers').select('*');

      const conditions: string[] = [];
      if (phone) conditions.push(`phone.eq.${phone}`);
      if (email) conditions.push(`email.eq.${email}`);

      query = query.or(conditions.join(','));

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data, error } = await query.limit(1).single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"
      return data as Customer || null;
    } catch (error) {
      console.error('Error checking customer existence:', error);
      return null;
    }
  }

  /**
   * Get customer statistics
   */
  static async getCustomerStats(locationId?: string) {
    try {
      let query = supabase.from('customers').select('id', { count: 'exact' });

      if (locationId) {
        query = query.eq('location_id', locationId);
      }

      const { count, error } = await query;

      if (error) throw error;

      // Get recent customers count (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      let recentQuery = supabase
        .from('customers')
        .select('id', { count: 'exact' })
        .gte('created_at', thirtyDaysAgo.toISOString());

      if (locationId) {
        recentQuery = recentQuery.eq('location_id', locationId);
      }

      const { count: recentCount, error: recentError } = await recentQuery;

      if (recentError) throw recentError;

      return {
        total: count || 0,
        recent: recentCount || 0,
      };
    } catch (error) {
      console.error('Error fetching customer stats:', error);
      return {
        total: 0,
        recent: 0,
      };
    }
  }
}
