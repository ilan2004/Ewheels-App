import { canBypassLocationFilter } from '@/lib/permissions';
import { supabase } from '@/lib/supabase';
import { UserRole } from '@/types';
import {
  DailyCash,
  Drawing,
  Expense,
  ExpenseForm,
  ExpensesFilters,
  FinancialApiResponse,
  FinancialKPIs,
  Investment,
  PaginatedFinancialResponse,
  RecentTransaction,
  Sale,
  SaleForm,
  SalesFilters,
  TransactionItem
} from '@/types/financial.types';

export class FinancialService {
  // Apply location scoping to queries based on user role
  private applyScopeToQuery(
    tableName: string,
    query: any,
    userRole: UserRole,
    activeLocationId?: string | null
  ): any {
    // Admins and front desk managers can see all locations
    if (canBypassLocationFilter(userRole)) {
      return query;
    }

    // Apply location filtering if location_id exists in table
    if (activeLocationId) {
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
    data: T,
    userRole: UserRole,
    activeLocationId?: string | null
  ): T {
    // Admins can create records for any location
    if (canBypassLocationFilter(userRole)) {
      return data;
    }

    // Add location_id if not already present
    if (activeLocationId) {
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

  // SALES OPERATIONS
  async getSales(
    filters: SalesFilters = {},
    userRole: UserRole,
    activeLocationId?: string | null,
    page = 1,
    limit = 10
  ): Promise<PaginatedFinancialResponse<Sale>> {
    if (this.isMockMode()) {
      return this.getMockSales(filters, page, limit);
    }

    try {
      let query = this.applyScopeToQuery(
        'sales',
        supabase.from('sales').select('*', { count: 'exact' }),
        userRole,
        activeLocationId
      );

      // Apply filters
      if (filters.search) {
        query = query.or(`description.ilike.%${filters.search}%,customer_name.ilike.%${filters.search}%,sale_number.ilike.%${filters.search}%`);
      }
      if (filters.sale_type) {
        query = query.eq('sale_type', filters.sale_type);
      }
      if (filters.payment_status) {
        query = query.eq('payment_status', filters.payment_status);
      }
      if (filters.payment_method) {
        query = query.eq('payment_method', filters.payment_method);
      }
      if (filters.startDate) {
        query = query.gte('sale_date', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('sale_date', filters.endDate);
      }
      if (filters.customer_id) {
        query = query.eq('customer_id', filters.customer_id);
      }

      // Apply pagination
      const from = (page - 1) * limit;
      query = query.range(from, from + limit - 1).order('sale_date', { ascending: false });

      const { data, error, count } = await query;
      if (error) throw error;

      return {
        data: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (error) {
      console.error('Error fetching sales:', error);
      throw error;
    }
  }

  async createSale(
    saleData: SaleForm,
    userRole: UserRole,
    activeLocationId?: string | null
  ): Promise<FinancialApiResponse<Sale>> {
    if (this.isMockMode()) {
      return { success: true, data: { id: 'mock-sale-id', ...saleData } as Sale };
    }

    try {
      const dataWithLocation = this.addLocationToData(saleData, userRole, activeLocationId);
      const { data, error } = await supabase
        .from('sales')
        .insert([dataWithLocation])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create sale'
      };
    }
  }

  async updateSale(
    id: string,
    updates: Partial<SaleForm>,
    userRole: UserRole,
    activeLocationId?: string | null
  ): Promise<FinancialApiResponse<Sale>> {
    if (this.isMockMode()) {
      return { success: true, data: { id, ...updates } as Sale };
    }

    try {
      let query = this.applyScopeToQuery(
        'sales',
        supabase.from('sales').update(updates).eq('id', id),
        userRole,
        activeLocationId
      );

      const { data, error } = await query.select().single();
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update sale'
      };
    }
  }

  async deleteSale(
    id: string,
    userRole: UserRole,
    activeLocationId?: string | null
  ): Promise<FinancialApiResponse<void>> {
    if (this.isMockMode()) {
      return { success: true };
    }

    try {
      let query = this.applyScopeToQuery(
        'sales',
        supabase.from('sales').delete().eq('id', id),
        userRole,
        activeLocationId
      );

      const { error } = await query;
      if (error) throw error;
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete sale'
      };
    }
  }

  // EXPENSES OPERATIONS
  async getExpenses(
    filters: ExpensesFilters = {},
    userRole: UserRole,
    activeLocationId?: string | null,
    page = 1,
    limit = 10
  ): Promise<PaginatedFinancialResponse<Expense>> {
    if (this.isMockMode()) {
      return this.getMockExpenses(filters, page, limit);
    }

    try {
      let query = this.applyScopeToQuery(
        'expenses',
        supabase.from('expenses').select('*', { count: 'exact' }),
        userRole,
        activeLocationId
      );

      // Apply filters
      if (filters.search) {
        query = query.or(`description.ilike.%${filters.search}%,vendor_name.ilike.%${filters.search}%,expense_number.ilike.%${filters.search}%,invoice_number.ilike.%${filters.search}%`);
      }
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.approval_status) {
        query = query.eq('approval_status', filters.approval_status);
      }
      if (filters.payment_method) {
        query = query.eq('payment_method', filters.payment_method);
      }
      if (filters.startDate) {
        query = query.gte('expense_date', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('expense_date', filters.endDate);
      }
      if (filters.vendor_name) {
        query = query.ilike('vendor_name', `%${filters.vendor_name}%`);
      }
      if (filters.is_recurring !== undefined) {
        query = query.eq('is_recurring', filters.is_recurring);
      }

      // Apply pagination
      const from = (page - 1) * limit;
      query = query.range(from, from + limit - 1).order('expense_date', { ascending: false });

      const { data, error, count } = await query;
      if (error) throw error;

      return {
        data: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (error) {
      console.error('Error fetching expenses:', error);
      throw error;
    }
  }

  async createExpense(
    expenseData: ExpenseForm,
    userRole: UserRole,
    activeLocationId?: string | null
  ): Promise<FinancialApiResponse<Expense>> {
    if (this.isMockMode()) {
      return { success: true, data: { id: 'mock-expense-id', ...expenseData } as Expense };
    }

    try {
      const dataWithLocation = this.addLocationToData(expenseData, userRole, activeLocationId);
      const { data, error } = await supabase
        .from('expenses')
        .insert([dataWithLocation])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create expense'
      };
    }
  }

  async updateExpense(
    id: string,
    updates: Partial<ExpenseForm>,
    userRole: UserRole,
    activeLocationId?: string | null
  ): Promise<FinancialApiResponse<Expense>> {
    if (this.isMockMode()) {
      return { success: true, data: { id, ...updates } as Expense };
    }

    try {
      let query = this.applyScopeToQuery(
        'expenses',
        supabase.from('expenses').update(updates).eq('id', id),
        userRole,
        activeLocationId
      );

      const { data, error } = await query.select().single();
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update expense'
      };
    }
  }

  async deleteExpense(
    id: string,
    userRole: UserRole,
    activeLocationId?: string | null
  ): Promise<FinancialApiResponse<void>> {
    if (this.isMockMode()) {
      return { success: true };
    }

    try {
      let query = this.applyScopeToQuery(
        'expenses',
        supabase.from('expenses').delete().eq('id', id),
        userRole,
        activeLocationId
      );

      const { error } = await query;
      if (error) throw error;
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete expense'
      };
    }
  }

  // KPIs and Analytics
  async getFinancialKPIs(
    userRole: UserRole,
    activeLocationId?: string | null
  ): Promise<FinancialKPIs> {
    if (this.isMockMode()) {
      return this.getMockKPIs();
    }

    try {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');

      const startOfToday = `${year}-${month}-${day}`;
      const startOfMonth = `${year}-${month}-01`;
      const startOfYear = `${year}-01-01`;

      // Today's data
      const [todaySales, todayExpenses] = await Promise.all([
        this.getSalesSum(startOfToday, startOfToday, userRole, activeLocationId),
        this.getExpensesSum(startOfToday, startOfToday, userRole, activeLocationId)
      ]);

      // This month's data
      const [monthSales, monthExpenses] = await Promise.all([
        this.getSalesSum(startOfMonth, undefined, userRole, activeLocationId),
        this.getExpensesSum(startOfMonth, undefined, userRole, activeLocationId)
      ]);

      // This year's data
      const [yearSales, yearExpenses] = await Promise.all([
        this.getSalesSum(startOfYear, undefined, userRole, activeLocationId),
        this.getExpensesSum(startOfYear, undefined, userRole, activeLocationId)
      ]);

      return {
        today: {
          sales: todaySales,
          expenses: todayExpenses,
          profit: todaySales - todayExpenses,
          cash_balance: 0, // Would need separate calculation
        },
        this_month: {
          sales: monthSales,
          expenses: monthExpenses,
          profit: monthSales - monthExpenses,
          profit_margin: monthSales > 0 ? ((monthSales - monthExpenses) / monthSales) * 100 : 0,
        },
        this_year: {
          sales: yearSales,
          expenses: yearExpenses,
          profit: yearSales - yearExpenses,
        }
      };
    } catch (error) {
      console.error('Error fetching financial KPIs:', error);
      throw error;
    }
  }

  private async getSalesSum(
    startDate: string,
    endDate?: string,
    userRole?: UserRole,
    activeLocationId?: string | null
  ): Promise<number> {
    let query = supabase
      .from('sales')
      .select('total_amount')
      .gte('sale_date', startDate)
      .eq('payment_status', 'paid');

    if (endDate) {
      query = query.lte('sale_date', endDate);
    }

    if (userRole && activeLocationId) {
      query = this.applyScopeToQuery('sales', query, userRole, activeLocationId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0;
  }

  private async getExpensesSum(
    startDate: string,
    endDate?: string,
    userRole?: UserRole,
    activeLocationId?: string | null
  ): Promise<number> {
    let query = supabase
      .from('expenses')
      .select('amount')
      .gte('expense_date', startDate);

    if (endDate) {
      query = query.lte('expense_date', endDate);
    }

    if (userRole && activeLocationId) {
      query = this.applyScopeToQuery('expenses', query, userRole, activeLocationId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data?.reduce((sum, expense) => sum + (expense.amount || 0), 0) || 0;
  }

  async getRecentTransactions(
    userRole: UserRole,
    activeLocationId?: string | null,
    limit = 10
  ): Promise<RecentTransaction[]> {
    if (this.isMockMode()) {
      return this.getMockRecentTransactions();
    }

    try {
      // Get recent sales
      let salesQuery = this.applyScopeToQuery(
        'sales',
        supabase.from('sales')
          .select('id, description, total_amount, sale_date, sale_type, payment_status')
          .order('created_at', { ascending: false })
          .limit(Math.ceil(limit / 2)),
        userRole,
        activeLocationId
      );

      // Get recent expenses
      let expensesQuery = this.applyScopeToQuery(
        'expenses',
        supabase.from('expenses')
          .select('id, description, amount, total_amount, expense_date, category')
          .order('created_at', { ascending: false })
          .limit(Math.ceil(limit / 2)),
        userRole,
        activeLocationId
      );

      const [salesResult, expensesResult] = await Promise.all([
        salesQuery,
        expensesQuery
      ]) as any[];

      if (salesResult.error) throw salesResult.error;
      if (expensesResult.error) throw expensesResult.error;

      const transactions: RecentTransaction[] = [
        ...(salesResult.data || []).map((sale: any) => ({
          id: sale.id,
          type: 'sale' as const,
          description: sale.description,
          amount: sale.total_amount,
          date: sale.sale_date,
          category: sale.sale_type,
          status: sale.payment_status
        })),
        ...(expensesResult.data || []).map((expense: any) => ({
          id: expense.id,
          type: 'expense' as const,
          description: expense.description,
          amount: expense.total_amount || expense.amount,
          date: expense.expense_date,
          category: expense.category
        }))
      ];

      return transactions
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching recent transactions:', error);
      throw error;
    }
  }

  // Mock Data Methods
  private getMockKPIs(): FinancialKPIs {
    return {
      today: {
        sales: 12500,
        expenses: 3200,
        profit: 9300,
        cash_balance: 45000,
      },
      this_month: {
        sales: 185000,
        expenses: 67500,
        profit: 117500,
        profit_margin: 63.5,
      },
      this_year: {
        sales: 1850000,
        expenses: 675000,
        profit: 1175000,
      }
    };
  }

  private getMockSales(filters: SalesFilters, page: number, limit: number): PaginatedFinancialResponse<Sale> {
    const mockSales: Sale[] = [
      {
        id: '1',
        invoice_id: 'INV-001',
        service_ticket_id: 'ST-001',
        customer_id: 'CUST-001',
        customer_name: 'John Doe',
        sale_number: 'SALE-001',
        sale_date: '2024-11-16',
        sale_type: 'battery',
        subtotal: 5000,
        tax_amount: 900,
        discount_amount: 400,
        total_amount: 5500,
        payment_method: 'upi',
        payment_status: 'paid',
        paid_amount: 5500,
        description: 'Battery replacement service',
        notes: 'Customer satisfied with service',
        location_id: 'LOC-001',
        created_by: 'user1',
        created_at: '2024-11-16T10:00:00Z',
        updated_at: '2024-11-16T10:00:00Z'
      }
    ];

    return {
      data: mockSales,
      pagination: { page, limit, total: 1, totalPages: 1 }
    };
  }

  private getMockExpenses(filters: ExpensesFilters, page: number, limit: number): PaginatedFinancialResponse<Expense> {
    const mockExpenses: Expense[] = [
      {
        id: '1',
        expense_number: 'EXP-001',
        expense_date: '2024-11-16',
        category: 'office_supplies',
        amount: 2500,
        tax_amount: 450,
        total_amount: 2950,
        payment_method: 'card',
        payment_reference: 'TXN-12345',
        vendor_name: 'Office Mart',
        vendor_contact: '+91-9876543210',
        invoice_number: 'VINV-001',
        description: 'Office supplies for monthly operations',
        purpose: 'Regular office maintenance',
        notes: 'Approved by manager',
        approval_status: 'approved',
        approved_by: 'manager1',
        approved_at: '2024-11-16T09:00:00Z',
        receipt_number: 'RCP-001',
        document_path: '/uploads/receipts/exp-001.pdf',
        location_id: 'LOC-001',
        created_by: 'user1',
        created_at: '2024-11-16T10:00:00Z',
        updated_at: '2024-11-16T10:00:00Z'
      }
    ];

    return {
      data: mockExpenses,
      pagination: { page, limit, total: 1, totalPages: 1 }
    };
  }

  private getMockRecentTransactions(): RecentTransaction[] {
    return [
      {
        id: '1',
        type: 'sale',
        description: 'Battery replacement service',
        amount: 5500,
        date: '2024-11-16',
        category: 'battery',
        status: 'paid'
      },
      {
        id: '2',
        type: 'expense',
        description: 'Office supplies for monthly operations',
        amount: 2950,
        date: '2024-11-16',
        category: 'office_supplies'
      }
    ];
  }
  // CASH MANAGEMENT OPERATIONS
  async getDailyCash(
    date: string,
    userRole: UserRole,
    activeLocationId?: string | null
  ): Promise<FinancialApiResponse<DailyCash>> {
    if (this.isMockMode()) {
      return {
        success: true,
        data: {
          id: 'mock-daily-cash',
          date,
          opening_cash: 1000,
          closing_cash: 0,
          cash_balance: 15000,
          hdfc_balance: 25000,
          indian_bank_balance: 10000,
          is_verified: false,
          created_at: new Date().toISOString()
        } as DailyCash
      };
    }

    try {
      let query = this.applyScopeToQuery(
        'daily_cash',
        supabase.from('daily_cash').select('*').eq('date', date),
        userRole,
        activeLocationId
      );

      const { data, error } = await query.maybeSingle();

      if (error) throw error;

      return { success: true, data: data || null };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch daily cash'
      };
    }
  }

  async getDailyCashRecords(
    startDate: string,
    endDate: string,
    userRole: UserRole,
    activeLocationId?: string | null
  ): Promise<FinancialApiResponse<DailyCash[]>> {
    if (this.isMockMode()) {
      return this.getMockDailyCashRecords(startDate, endDate);
    }

    try {
      let query = this.applyScopeToQuery(
        'daily_cash',
        supabase.from('daily_cash')
          .select('*')
          .gte('date', startDate)
          .lte('date', endDate)
          .order('date', { ascending: false }),
        userRole,
        activeLocationId
      );

      const { data, error } = await query;
      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch daily cash records'
      };
    }
  }

  private getMockDailyCashRecords(startDate: string, endDate: string): FinancialApiResponse<DailyCash[]> {
    return {
      success: true,
      data: [
        {
          id: 'mock-daily-cash-1',
          date: startDate,
          opening_cash: 1000,
          closing_cash: 0,
          cash_balance: 15000,
          hdfc_balance: 25000,
          indian_bank_balance: 10000,
          is_verified: false,
          created_at: new Date().toISOString()
        },
        {
          id: 'mock-daily-cash-2',
          date: endDate,
          opening_cash: 1200,
          closing_cash: 0,
          cash_balance: 16000,
          hdfc_balance: 26000,
          indian_bank_balance: 11000,
          is_verified: true,
          created_at: new Date(Date.now() - 86400000).toISOString()
        }
      ]
    };
  }

  async createDailyCash(
    data: Partial<DailyCash>,
    userRole: UserRole,
    activeLocationId?: string | null
  ): Promise<FinancialApiResponse<DailyCash>> {
    if (this.isMockMode()) {
      return {
        success: true,
        data: {
          id: 'mock-daily-cash-new',
          date: data.date || new Date().toISOString().split('T')[0],
          opening_cash: data.opening_cash || 0,
          closing_cash: 0,
          cash_balance: data.opening_cash || 0,
          hdfc_balance: data.hdfc_balance || 0,
          indian_bank_balance: data.indian_bank_balance || 0,
          is_verified: false,
          created_at: new Date().toISOString(),
          ...data
        } as DailyCash
      };
    }

    try {
      const dataWithLocation = this.addLocationToData(data, userRole, activeLocationId);
      const { data: newRecord, error } = await supabase
        .from('daily_cash')
        .insert([dataWithLocation])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data: newRecord };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create daily cash record'
      };
    }
  }

  async updateDailyCash(
    date: string,
    data: Partial<DailyCash>,
    userRole: UserRole,
    activeLocationId?: string | null
  ): Promise<FinancialApiResponse<DailyCash>> {
    if (this.isMockMode()) {
      return {
        success: true,
        data: {
          id: 'mock-daily-cash',
          date,
          opening_cash: 1000,
          closing_cash: 0,
          cash_balance: 15000,
          hdfc_balance: 25000,
          indian_bank_balance: 10000,
          is_verified: false,
          created_at: new Date().toISOString(),
          ...data
        } as DailyCash
      };
    }

    try {
      // Check if record exists
      const existing = await this.getDailyCash(date, userRole, activeLocationId);

      let result;
      if (existing.data) {
        // Update
        let query = this.applyScopeToQuery(
          'daily_cash',
          supabase.from('daily_cash').update(data).eq('id', existing.data.id),
          userRole,
          activeLocationId
        );
        result = await query.select().single();
      } else {
        // Insert
        const dataWithLocation = this.addLocationToData({ ...data, date }, userRole, activeLocationId);
        result = await supabase.from('daily_cash').insert([dataWithLocation]).select().single();
      }

      if (result.error) throw result.error;
      return { success: true, data: result.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update daily cash'
      };
    }
  }

  async getCashSales(
    date: string,
    userRole: UserRole,
    activeLocationId?: string | null
  ): Promise<FinancialApiResponse<Sale[]>> {
    return this.getDailySales(date, userRole, activeLocationId, 'cash');
  }

  async getDailySales(
    date: string,
    userRole: UserRole,
    activeLocationId?: string | null,
    paymentMethod?: string
  ): Promise<FinancialApiResponse<Sale[]>> {
    if (this.isMockMode()) {
      return { success: true, data: [] };
    }

    try {
      let query = this.applyScopeToQuery(
        'sales',
        supabase.from('sales')
          .select('*')
          .eq('sale_date', date)
          .eq('payment_status', 'paid')
          .order('created_at', { ascending: false }),
        userRole,
        activeLocationId
      );

      if (paymentMethod) {
        query = query.eq('payment_method', paymentMethod);
      }

      const { data, error } = await query;
      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch daily sales'
      };
    }
  }

  async getCashExpenses(
    date: string,
    userRole: UserRole,
    activeLocationId?: string | null
  ): Promise<FinancialApiResponse<Expense[]>> {
    return this.getDailyExpenses(date, userRole, activeLocationId, 'cash');
  }

  async getDailyExpenses(
    date: string,
    userRole: UserRole,
    activeLocationId?: string | null,
    paymentMethod?: string
  ): Promise<FinancialApiResponse<Expense[]>> {
    if (this.isMockMode()) {
      return { success: true, data: [] };
    }

    try {
      let query = this.applyScopeToQuery(
        'expenses',
        supabase.from('expenses')
          .select('*')
          .eq('expense_date', date)
          .order('created_at', { ascending: false }),
        userRole,
        activeLocationId
      );

      if (paymentMethod) {
        query = query.eq('payment_method', paymentMethod);
      }

      const { data, error } = await query;
      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch daily expenses'
      };
    }
  }

  async getDrawings(
    startDate: string,
    endDate: string,
    userRole: UserRole,
    activeLocationId?: string | null
  ): Promise<FinancialApiResponse<Drawing[]>> {
    if (this.isMockMode()) {
      return this.getMockDrawings();
    }

    try {
      let query = this.applyScopeToQuery(
        'drawings',
        supabase.from('drawings')
          .select('*')
          .gte('created_at', startDate)
          .lte('created_at', endDate.includes('T') ? endDate : `${endDate}T23:59:59.999Z`)
          .order('created_at', { ascending: false }),
        userRole,
        activeLocationId
      );

      const { data, error } = await query;
      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch drawings'
      };
    }
  }

  async getInvestments(
    startDate: string,
    endDate: string,
    userRole: UserRole,
    activeLocationId?: string | null
  ): Promise<FinancialApiResponse<Investment[]>> {
    if (this.isMockMode()) {
      return this.getMockInvestments();
    }

    try {
      let query = this.applyScopeToQuery(
        'investments',
        supabase.from('investments')
          .select('*')
          .gte('date', startDate)
          .lte('date', endDate)
          .order('date', { ascending: false }),
        userRole,
        activeLocationId
      );

      const { data, error } = await query;
      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch investments'
      };
    }
  }

  private getMockInvestments(): FinancialApiResponse<Investment[]> {
    return {
      success: true,
      data: [
        {
          id: '1',
          amount: 50000,
          target_account: 'hdfc',
          description: 'Initial Capital',
          date: new Date().toISOString(),
          created_at: new Date().toISOString()
        }
      ]
    };
  }

  private getMockDrawings(): FinancialApiResponse<Drawing[]> {
    return {
      success: true,
      data: [
        {
          id: '1',
          amount: 5000,
          type: 'withdrawal',
          source: 'cash',
          partner_name: 'Partner A',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          amount: 10000,
          type: 'deposit',
          source: 'hdfc',
          partner_name: 'Partner B',
          created_at: new Date(Date.now() - 86400000).toISOString()
        }
      ]
    };
  }


  async getTransactionsByMethod(
    startDate: string,
    endDate: string,
    method: 'cash' | 'hdfc' | 'indian_bank',
    userRole: UserRole,
    activeLocationId?: string | null
  ): Promise<FinancialApiResponse<TransactionItem[]>> {
    try {
      // 1. Fetch all data for the date range (we filter in memory to handle complex mappings like UPI->HDFC)
      // Optimisation: We could push filters to DB, but payment_method mapping for HDFC (UPI, Card, Etc) is complex.
      // For HDFC: payment_method in ('upi', 'card', 'hdfc', 'hdfc_bank')
      // For Indian Bank: payment_method = 'indian_bank'
      // For Cash: payment_method = 'cash'

      const [salesRes, expensesRes, drawingsRes, investmentsRes] = await Promise.all([
        this.getSalesSumRecords(startDate, endDate, userRole, activeLocationId),
        this.getExpensesSumRecords(startDate, endDate, userRole, activeLocationId),
        this.getDrawings(startDate, endDate, userRole, activeLocationId),
        this.getInvestments(startDate, endDate, userRole, activeLocationId)
      ]);

      const transactions: TransactionItem[] = [];

      // Helper to check if method matches
      const isMethodMatch = (recordMethod: string | undefined | null) => {
        if (!recordMethod) return false;
        const m = recordMethod.toLowerCase();
        if (method === 'cash') return m === 'cash';
        if (method === 'indian_bank') return m === 'indian_bank';
        if (method === 'hdfc') return ['hdfc', 'hdfc_bank', 'upi', 'card'].includes(m);
        return false;
      };

      // Process Sales
      if (salesRes.data) {
        salesRes.data.forEach(sale => {
          if (isMethodMatch(sale.payment_method)) {
            transactions.push({
              id: sale.id,
              date: sale.sale_date,
              type: 'sale',
              description: sale.description || `Sale #${sale.sale_number}`,
              amount: sale.total_amount,
              method: method, // Normalized
              original_method: sale.payment_method
            } as any);
          }
        });
      }

      // Process Expenses
      if (expensesRes.data) {
        expensesRes.data.forEach(expense => {
          if (isMethodMatch(expense.payment_method)) {
            transactions.push({
              id: expense.id,
              date: expense.expense_date,
              type: 'expense',
              description: expense.description || expense.category,
              amount: expense.total_amount || expense.amount,
              method: method,
              original_method: expense.payment_method
            } as any);
          }
        });
      }

      // Process Drawings
      if (drawingsRes.data) {
        drawingsRes.data.forEach(drawing => {
          if (isMethodMatch(drawing.source)) {
            transactions.push({
              id: drawing.id,
              date: drawing.created_at,
              type: 'drawing',
              description: `${drawing.type} - ${drawing.partner_name}`,
              amount: drawing.amount,
              method: method,
              drawing_type: drawing.type
            } as any);
          }
        });
      }

      // Process Investments
      if (investmentsRes.data) {
        investmentsRes.data.forEach(inv => {
          if (isMethodMatch(inv.target_account)) {
            transactions.push({
              id: inv.id,
              date: inv.date,
              type: 'investment',
              description: inv.description || 'Investment',
              amount: inv.amount,
              method: method
            } as any);
          }
        });
      }

      // Sort by Date DESC
      transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return { success: true, data: transactions };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch transactions'
      };
    }
  }

  // Helper to fetch full records for sum/analysis (reusing logic but needing full fields)
  private async getSalesSumRecords(startDate: string, endDate: string, userRole: UserRole, activeLocationId?: string | null) {
    let query = supabase
      .from('sales')
      .select('*')
      .gte('sale_date', startDate)
      .lte('sale_date', endDate)
      .eq('payment_status', 'paid');

    if (userRole && activeLocationId) {
      query = this.applyScopeToQuery('sales', query, userRole, activeLocationId);
    }
    const { data, error } = await query;
    return { data, error };
  }

  private async getExpensesSumRecords(startDate: string, endDate: string, userRole: UserRole, activeLocationId?: string | null) {
    let query = supabase
      .from('expenses')
      .select('*')
      .gte('expense_date', startDate)
      .lte('expense_date', endDate);

    if (userRole && activeLocationId) {
      query = this.applyScopeToQuery('expenses', query, userRole, activeLocationId);
    }
    const { data, error } = await query;
    return { data, error };
  }
}

// Export singleton instance
export const financialService = new FinancialService();
