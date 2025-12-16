import { calculateInvoiceTotals } from '@/lib/invoiceCalculations';
import { supabase } from '@/lib/supabase';
import {
  CreateInvoiceRequest,
  CreateInvoiceResponse,
  CreatePaymentRequest,
  Invoice,
  InvoiceFilters,
  InvoiceListResponse,
  InvoicePayment,
  InvoiceStatus,
  InvoiceWithPayments
} from '@/types/invoice';

export class InvoiceService {
  /**
   * Generate the next invoice number
   */
  static async generateInvoiceNumber(locationId?: string): Promise<string> {
    try {
      let query = supabase
        .from('invoices')
        .select('number')
        .order('created_at', { ascending: false })
        .limit(1);

      if (locationId) {
        query = query.eq('location_id', locationId);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (!data || data.length === 0) {
        return 'INV-0001';
      }

      const lastNumber = data[0].number;
      const match = lastNumber.match(/INV-(\d+)/);
      const nextNumber = match ? parseInt(match[1]) + 1 : 1;

      return `INV-${nextNumber.toString().padStart(4, '0')}`;
    } catch (error) {
      console.error('Error generating invoice number:', error);
      return `INV-${Date.now().toString().slice(-4)}`;
    }
  }

  /**
   * Create a new invoice
   */
  static async createInvoice(request: CreateInvoiceRequest): Promise<CreateInvoiceResponse> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Calculate totals
      const totals = calculateInvoiceTotals(request.items);

      // Generate invoice number
      const number = await this.generateInvoiceNumber(request.location_id);

      // Create invoice record
      const invoiceData = {
        number,
        status: 'draft' as InvoiceStatus,
        customer: request.customer,
        totals: {
          subtotal: totals.subtotal,
          discount_total: totals.discount_total,
          sgst_total: totals.sgst_total,
          cgst_total: totals.cgst_total,
          shipping_amount: totals.shipping_amount,
          adjustment_amount: totals.adjustment_amount,
          grand_total: totals.grand_total,
        },
        currency: request.currency || 'USD',
        balance_due: totals.grand_total,
        due_date: request.due_date,
        notes: request.notes,
        terms: request.terms,
        created_by: user.id,
        location_id: request.location_id,
      };

      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert(invoiceData)
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Create invoice items
      const itemsData = request.items.map(item => ({
        ...item,
        invoice_id: invoice.id,
      }));

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(itemsData);

      if (itemsError) throw itemsError;

      // Fetch the complete invoice with items
      const completeInvoice = await this.getInvoiceById(invoice.id);

      return {
        success: true,
        data: completeInvoice || invoice
      };
    } catch (error) {
      console.error('Error creating invoice:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create invoice'
      };
    }
  }

  /**
   * Get invoices list with filtering
   */
  static async getInvoices(
    filters: InvoiceFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<InvoiceListResponse> {
    try {
      let query = supabase
        .from('invoices')
        .select(`
          *,
          items:invoice_items(*)
        `, { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.customer_name) {
        query = query.ilike('customer->>name', `%${filters.customer_name}%`);
      }

      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }

      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      if (filters.location_id) {
        query = query.eq('location_id', filters.location_id);
      }

      // Pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        invoices: data || [],
        total: count || 0,
        page,
        limit,
      };
    } catch (error) {
      console.error('Error fetching invoices:', error);
      return {
        invoices: [],
        total: 0,
        page,
        limit,
      };
    }
  }

  /**
   * Get invoice by ID
   */
  static async getInvoiceById(id: string): Promise<Invoice | null> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          items:invoice_items(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching invoice:', error);
      return null;
    }
  }

  /**
   * Update invoice status
   */
  static async updateInvoiceStatus(id: string, status: InvoiceStatus): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating invoice status:', error);
      return false;
    }
  }

  /**
   * Update invoice
   */
  static async updateInvoice(id: string, updates: Partial<Invoice>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating invoice:', error);
      return false;
    }
  }

  /**
   * Delete invoice
   */
  static async deleteInvoice(id: string): Promise<boolean> {
    try {
      // Delete invoice items first (foreign key constraint)
      const { error: itemsError } = await supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', id);

      if (itemsError) throw itemsError;

      // Delete invoice
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting invoice:', error);
      return false;
    }
  }

  /**
   * Get invoice with payments by ID
   */
  static async getInvoiceWithPayments(id: string): Promise<InvoiceWithPayments | null> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          items:invoice_items(*),
          payments:payments(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      // Calculate total payments
      const totalPayments = data.payments?.reduce(
        (sum: number, payment: InvoicePayment) => sum + payment.amount,
        0
      ) || 0;

      return {
        ...data,
        total_payments: totalPayments,
      };
    } catch (error) {
      console.error('Error fetching invoice with payments:', error);
      return null;
    }
  }

  /**
   * Add payment to invoice
   */
  static async addPayment(request: CreatePaymentRequest): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Add payment
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          ...request,
          created_by: user.id,
        });

      if (paymentError) throw paymentError;

      // Get total payments for this invoice
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('amount')
        .eq('invoice_id', request.invoice_id);

      if (paymentsError) throw paymentsError;

      const totalPayments = payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;

      // Get invoice total to calculate balance
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select('totals')
        .eq('id', request.invoice_id)
        .single();

      if (invoiceError) throw invoiceError;

      const balanceDue = invoice.totals.total - totalPayments;
      const newStatus = balanceDue <= 0.01 ? 'paid' : 'sent'; // Consider amounts under 1 cent as fully paid

      // Update invoice balance and status if fully paid
      const { error: updateError } = await supabase
        .from('invoices')
        .update({
          balance_due: Math.max(0, balanceDue),
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', request.invoice_id);

      if (updateError) throw updateError;

      return true;
    } catch (error) {
      console.error('Error adding payment:', error);
      return false;
    }
  }

  /**
   * Get payments for invoice
   */
  static async getInvoicePayments(invoiceId: string): Promise<InvoicePayment[]> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('received_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching invoice payments:', error);
      return [];
    }
  }

  /**
   * Duplicate invoice
   */
  static async duplicateInvoice(id: string): Promise<CreateInvoiceResponse> {
    try {
      const originalInvoice = await this.getInvoiceById(id);
      if (!originalInvoice) {
        return { success: false, error: 'Original invoice not found' };
      }

      const duplicateRequest: CreateInvoiceRequest = {
        customer: originalInvoice.customer,
        items: originalInvoice.items?.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount: item.discount,
          sgst_rate: item.sgst_rate,
          cgst_rate: item.cgst_rate,
          subtotal: item.subtotal,
          discount_amount: item.discount_amount,
          sgst_amount: item.sgst_amount,
          cgst_amount: item.cgst_amount,
          total: item.total,
        })) || [],
        currency: originalInvoice.currency,
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        notes: originalInvoice.notes,
        terms: originalInvoice.terms,
        location_id: originalInvoice.location_id,
      };

      return await this.createInvoice(duplicateRequest);
    } catch (error) {
      console.error('Error duplicating invoice:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to duplicate invoice'
      };
    }
  }

  /**
   * Get invoice statistics
   */
  static async getInvoiceStats(locationId?: string) {
    try {
      let query = supabase
        .from('invoices')
        .select('status, totals');

      if (locationId) {
        query = query.eq('location_id', locationId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        draft: 0,
        sent: 0,
        paid: 0,
        void: 0,
        totalAmount: 0,
        paidAmount: 0,
        outstandingAmount: 0,
      };

      data?.forEach(invoice => {
        stats[invoice.status as keyof typeof stats] += 1;
        stats.totalAmount += invoice.totals.total;
        if (invoice.status === 'paid') {
          stats.paidAmount += invoice.totals.total;
        } else if (invoice.status !== 'void') {
          stats.outstandingAmount += invoice.totals.total;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error fetching invoice stats:', error);
      return null;
    }
  }
}
